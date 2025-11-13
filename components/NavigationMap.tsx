'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Navigation, Zap, Cloud, CloudRain, CloudSnow, Sun, MapPin, Clock } from 'lucide-react'
import type { Job } from '@/types'

interface NavigationMapProps {
  destination: Job
  apiKey: string
  onArrival?: () => void
  onLocationUpdate?: (lat: number, lng: number, heading: number, speed: number) => void
}

export default function NavigationMap({
  destination,
  apiKey,
  onArrival,
  onLocationUpdate
}: NavigationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [heading, setHeading] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [distance, setDistance] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [currentInstruction, setCurrentInstruction] = useState<string>('')
  const [weatherEffect, setWeatherEffect] = useState<'rain' | 'snow' | 'clear'>('clear')
  const [arrived, setArrived] = useState(false)
  const watchId = useRef<number | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = apiKey

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1', // Style navigation
      center: [-73.5673, 45.5017],
      zoom: 16,
      pitch: 70, // Vue 3D immersive
      bearing: 0,
      antialias: true
    })

    // Add 3D buildings
    map.current.on('load', () => {
      if (!map.current) return

      map.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#2a2a3e',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.8
        }
      })

      // Add sky layer for immersive effect
      map.current!.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      })
    })

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
      map.current?.remove()
    }
  }, [apiKey])

  // Start GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      alert('Geolocation non supportée par votre navigateur')
      return
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const newHeading = position.coords.heading || 0
        const newSpeed = position.coords.speed ? position.coords.speed * 3.6 : 0 // m/s to km/h

        setUserLocation({ lat, lng })
        setHeading(newHeading)
        setSpeed(newSpeed)

        // Update map center and bearing
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 18,
            pitch: 70,
            bearing: newHeading,
            essential: true
          })
        }

        // Send location update
        if (onLocationUpdate) {
          onLocationUpdate(lat, lng, newHeading, newSpeed)
        }

        // Check if arrived
        if (destination.latitude && destination.longitude) {
          const dist = calculateDistance(lat, lng, destination.latitude, destination.longitude)
          setDistance(dist)

          if (dist < 50 && !arrived) {
            setArrived(true)
            if (onArrival) {
              onArrival()
            }
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [destination, arrived, onArrival, onLocationUpdate])

  // Fetch and draw route
  useEffect(() => {
    if (!map.current || !userLocation || !destination.latitude || !destination.longitude) return

    fetchRoute(userLocation.lng, userLocation.lat, destination.longitude, destination.latitude)
  }, [userLocation, destination])

  // Fetch route from Mapbox Directions API
  const fetchRoute = async (startLng: number, startLat: number, endLng: number, endLat: number) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&steps=true&banner_instructions=true&voice_instructions=true&access_token=${apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        setDuration(route.duration)
        setDistance(route.distance)

        // Get current instruction
        if (route.legs[0].steps.length > 0) {
          setCurrentInstruction(route.legs[0].steps[0].maneuver.instruction)
        }

        // Draw route on map
        if (map.current) {
          if (map.current.getSource('route')) {
            ;(map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: route.geometry
            })
          } else {
            map.current.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: route.geometry
              }
            })

            map.current.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#3b82f6',
                'line-width': 8,
                'line-opacity': 0.8
              }
            })

            // Add animated overlay
            map.current.addLayer({
              id: 'route-arrow',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#60a5fa',
                'line-width': 4,
                'line-opacity': 1,
                'line-dasharray': [0, 2, 3]
              }
            })
          }

          // Add destination marker
          if (!map.current.getLayer('destination-marker')) {
            map.current.addSource('destination', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [endLng, endLat]
                }
              }
            })

            map.current.addLayer({
              id: 'destination-marker',
              type: 'circle',
              source: 'destination',
              paint: {
                'circle-radius': 15,
                'circle-color': destination.is_urgent ? '#EF4444' : '#10B981',
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff'
              }
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }

  // Calculate distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    if (mins < 60) {
      return `${mins}min`
    }
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}min`
  }

  // Toggle weather
  const toggleWeather = () => {
    const effects: Array<'rain' | 'snow' | 'clear'> = ['clear', 'rain', 'snow']
    const currentIndex = effects.indexOf(weatherEffect)
    const nextIndex = (currentIndex + 1) % effects.length
    setWeatherEffect(effects[nextIndex])
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* HUD Overlay - Style jeu vidéo */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        {/* Destination info */}
        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/20 pointer-events-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className={`w-5 h-5 ${destination.is_urgent ? 'text-red-400' : 'text-green-400'}`} />
                <h2 className="text-white font-bold text-lg">{destination.title}</h2>
                {destination.is_urgent && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                    URGENT
                  </span>
                )}
              </div>
              {destination.description && (
                <p className="text-gray-300 text-sm">{destination.description}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Distance</div>
              <div className="text-white font-bold text-xl">
                {distance !== null ? formatDistance(distance) : '---'}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Temps</div>
              <div className="text-white font-bold text-xl flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {duration !== null ? formatDuration(duration) : '---'}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Vitesse</div>
              <div className="text-white font-bold text-xl flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                {speed.toFixed(0)} km/h
              </div>
            </div>
          </div>
        </div>

        {/* Current instruction */}
        {currentInstruction && !arrived && (
          <div className="bg-blue-500 text-white rounded-xl p-4 mb-4 border border-blue-300 pointer-events-auto shadow-lg">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8" />
              <div className="flex-1">
                <div className="font-bold text-lg">{currentInstruction}</div>
                {distance !== null && (
                  <div className="text-sm opacity-90">dans {formatDistance(distance)}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Arrival notification */}
        {arrived && (
          <div className="bg-green-500 text-white rounded-xl p-4 mb-4 border border-green-300 pointer-events-auto shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8" />
              <div className="flex-1">
                <div className="font-bold text-lg">Vous êtes arrivé!</div>
                <div className="text-sm opacity-90">Job: {destination.title}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weather control */}
      <button
        onClick={toggleWeather}
        className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white p-4 rounded-full border border-white/20 hover:bg-black/90 transition-all pointer-events-auto"
      >
        {weatherEffect === 'clear' && <Sun className="w-6 h-6" />}
        {weatherEffect === 'rain' && <CloudRain className="w-6 h-6" />}
        {weatherEffect === 'snow' && <CloudSnow className="w-6 h-6" />}
      </button>

      {/* Speed indicator */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md rounded-full w-24 h-24 flex flex-col items-center justify-center border-4 border-white/20 pointer-events-none">
        <div className="text-white font-bold text-3xl">{speed.toFixed(0)}</div>
        <div className="text-gray-400 text-xs">km/h</div>
      </div>
    </div>
  )
}
