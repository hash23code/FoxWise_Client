'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Zap } from 'lucide-react'

interface NavigationMapSimpleProps {
  apiKey: string
}

export default function NavigationMapSimple({ apiKey }: NavigationMapSimpleProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const userMarker = useRef<mapboxgl.Marker | null>(null)
  const [speed, setSpeed] = useState(0)
  const [initialized, setInitialized] = useState(false)

  // Initialize map ONCE
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('[SimpleMap] Initializing map...')

    mapboxgl.accessToken = apiKey

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [-73.5673, 45.5017], // Montreal
      zoom: 15,
      pitch: 60,
      bearing: 0
    })

    map.current.on('load', () => {
      console.log('[SimpleMap] Map loaded!')
      setInitialized(true)

      // Add 3D buildings
      if (map.current) {
        map.current.addLayer({
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        })
        console.log('[SimpleMap] 3D buildings added')
      }
    })

    return () => {
      console.log('[SimpleMap] Cleanup')
      map.current?.remove()
    }
  }, [apiKey])

  // Setup GPS tracking ONCE
  useEffect(() => {
    if (!initialized || !map.current) return

    console.log('[SimpleMap] Setting up GPS...')

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed: gpsSpeed } = position.coords
        console.log('[SimpleMap] GPS update:', latitude, longitude)

        // Update speed
        setSpeed(gpsSpeed ? gpsSpeed * 3.6 : 0)

        // Move map to user location
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 17,
            pitch: 60
          })
        }

        // Update or create user marker
        if (!userMarker.current && map.current) {
          userMarker.current = new mapboxgl.Marker({
            color: '#00ff00'
          })
            .setLngLat([longitude, latitude])
            .addTo(map.current)
          console.log('[SimpleMap] User marker created')
        } else if (userMarker.current) {
          userMarker.current.setLngLat([longitude, latitude])
        }
      },
      (error) => {
        console.warn('[SimpleMap] GPS error (non-blocking):', error.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    )

    return () => {
      console.log('[SimpleMap] GPS cleanup')
      navigator.geolocation.clearWatch(watchId)
      userMarker.current?.remove()
    }
  }, [initialized])

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Simple HUD */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xl rounded-xl p-4 text-white">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="text-2xl font-bold">{speed.toFixed(0)}</span>
          <span className="text-sm text-gray-400">km/h</span>
        </div>
      </div>

      {!initialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/50">
          <div className="text-white text-xl">Chargement de la carte...</div>
        </div>
      )}
    </div>
  )
}
