'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Job, EmployeeLocation } from '@/types'

interface Map3DProps {
  jobs: Job[]
  employeeLocations?: EmployeeLocation[]
  userLocation?: { lat: number; lng: number }
  onJobClick?: (job: Job) => void
  onLocationUpdate?: (lat: number, lng: number) => void
  enableNavigation?: boolean
  weatherEffect?: 'rain' | 'snow' | 'clear'
  apiKey: string
}

export default function Map3D({
  jobs,
  employeeLocations = [],
  userLocation,
  onJobClick,
  onLocationUpdate,
  enableNavigation = false,
  weatherEffect = 'clear',
  apiKey
}: Map3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [lng, setLng] = useState(-73.5673) // Montréal par défaut
  const [lat, setLat] = useState(45.5017)
  const [zoom, setZoom] = useState(12)
  const [pitch, setPitch] = useState(60) // 3D tilt
  const [bearing, setBearing] = useState(0) // Rotation
  const markers = useRef<mapboxgl.Marker[]>([])
  const navigationRoute = useRef<any>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = apiKey

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark theme style jeu vidéo
      center: [lng, lat],
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      antialias: true // Pour des rendus 3D smooth
    })

    // Add 3D buildings layer
    map.current.on('load', () => {
      if (!map.current) return

      // 3D Buildings
      const layers = map.current.getStyle().layers
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
      )?.id

      map.current.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#1a1a2e',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      )

      // Add weather effects
      addWeatherEffect(weatherEffect)
    })

    // Navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: enableNavigation,
        showUserHeading: enableNavigation
      }),
      'top-right'
    )

    return () => {
      map.current?.remove()
    }
  }, [apiKey])

  // Add weather effects
  const addWeatherEffect = (effect: string) => {
    if (!map.current) return

    // Remove existing weather layers
    if (map.current.getLayer('weather-particles')) {
      map.current.removeLayer('weather-particles')
    }
    if (map.current.getSource('weather-particles')) {
      map.current.removeSource('weather-particles')
    }

    if (effect === 'clear') return

    // Add particle effect for rain/snow
    const particleCount = effect === 'rain' ? 1000 : 500
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            lng + (Math.random() - 0.5) * 0.1,
            lat + (Math.random() - 0.5) * 0.1
          ]
        },
        properties: {}
      })
    }

    map.current.addSource('weather-particles', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: particles
      }
    })

    map.current.addLayer({
      id: 'weather-particles',
      type: 'circle',
      source: 'weather-particles',
      paint: {
        'circle-radius': effect === 'rain' ? 1 : 3,
        'circle-color': effect === 'rain' ? '#4A90E2' : '#FFFFFF',
        'circle-opacity': effect === 'rain' ? 0.6 : 0.8
      }
    })
  }

  // Update markers when jobs change
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add job markers
    jobs.forEach(job => {
      if (!job.latitude || !job.longitude) return

      const color = getJobColor(job)
      const el = createCustomMarker(color, job.is_urgent)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([job.longitude, job.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="color: #000; padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${job.title}</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px;">${job.description || ''}</p>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
                <span style="display: inline-block; padding: 2px 8px; background: ${color}; color: white; border-radius: 4px; font-size: 11px; font-weight: bold;">
                  ${getStatusLabel(job.location_status)}
                </span>
                ${job.is_urgent ? '<span style="display: inline-block; margin-left: 4px; padding: 2px 8px; background: #EF4444; color: white; border-radius: 4px; font-size: 11px; font-weight: bold;">URGENT</span>' : ''}
              </div>
            </div>
          `)
        )

      if (onJobClick) {
        el.addEventListener('click', () => onJobClick(job))
      }

      marker.addTo(map.current!)
      markers.current.push(marker)
    })

    // Add employee location markers
    employeeLocations.forEach(location => {
      const el = createEmployeeMarker()

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="color: #000; padding: 8px;">
              <h3 style="margin: 0; font-weight: bold;">Employé</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px;">
                Vitesse: ${location.speed?.toFixed(1) || 0} km/h
              </p>
            </div>
          `)
        )
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [jobs, employeeLocations])

  // Track user location
  useEffect(() => {
    if (!enableNavigation || !userLocation) return

    const { lat: userLat, lng: userLng } = userLocation

    // Update map center with smooth animation
    map.current?.flyTo({
      center: [userLng, userLat],
      zoom: 16,
      pitch: 60,
      bearing: 0,
      essential: true
    })

    // Check proximity to jobs
    jobs.forEach(job => {
      if (!job.latitude || !job.longitude) return

      const distance = calculateDistance(
        userLat,
        userLng,
        job.latitude,
        job.longitude
      )

      // Si à moins de 50 mètres, marquer comme arrivé
      if (distance < 50 && job.location_status !== 'arrived' && job.location_status !== 'completed') {
        console.log(`Arrived at job: ${job.title}`)
        if (onLocationUpdate) {
          onLocationUpdate(userLat, userLng)
        }
      }
    })
  }, [userLocation, enableNavigation, jobs])

  // Get job color based on status
  const getJobColor = (job: Job): string => {
    if (job.is_urgent) return '#EF4444' // Rouge urgent

    switch (job.location_status) {
      case 'completed':
      case 'arrived':
        return '#10B981' // Vert
      case 'assigned':
      case 'en_route':
      case 'pending':
      default:
        return '#F97316' // Orange
    }
  }

  // Get status label
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      assigned: 'Assigné',
      en_route: 'En route',
      arrived: 'Arrivé',
      completed: 'Complété'
    }
    return labels[status] || status
  }

  // Create custom marker element
  const createCustomMarker = (color: string, isUrgent: boolean): HTMLDivElement => {
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.cssText = `
      width: ${isUrgent ? '40px' : '30px'};
      height: ${isUrgent ? '40px' : '30px'};
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 ${isUrgent ? '20px' : '10px'} rgba(0,0,0,0.5);
      cursor: pointer;
      transition: transform 0.2s;
      animation: ${isUrgent ? 'pulse 1.5s infinite' : 'none'};
    `

    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)'
    })

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)'
    })

    return el
  }

  // Create employee marker
  const createEmployeeMarker = (): HTMLDivElement => {
    const el = document.createElement('div')
    el.className = 'employee-marker'
    el.style.cssText = `
      width: 35px;
      height: 35px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(102, 126, 234, 0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    `
    el.innerHTML = '👤'
    return el
  }

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  // Change weather effect
  useEffect(() => {
    if (map.current) {
      addWeatherEffect(weatherEffect)
    }
  }, [weatherEffect])

  return (
    <>
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px rgba(239, 68, 68, 1);
            transform: scale(1.1);
          }
        }

        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 8px;
          overflow: hidden;
        }

        .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 4px 8px;
        }
      `}</style>
      <div
        ref={mapContainer}
        className="w-full h-full rounded-xl overflow-hidden shadow-2xl"
        style={{ minHeight: '400px' }}
      />
    </>
  )
}
