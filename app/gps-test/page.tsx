'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function GPSTestPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    // Initialize map only once
    if (map.current) return

    // Get API key
    const apiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
    if (!apiKey) {
      console.error('❌ NO API KEY')
      return
    }

    console.log('✅ API Key présente')
    mapboxgl.accessToken = apiKey

    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-73.5673, 45.5017], // Montreal
      zoom: 12
    })

    console.log('✅ Map créée')

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Track GPS position
    if (navigator.geolocation) {
      console.log('✅ GPS disponible')

      navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude } = position.coords
          console.log(`📍 Position: ${latitude}, ${longitude}`)

          // Update or create marker
          if (!marker.current && map.current) {
            marker.current = new mapboxgl.Marker({ color: '#00ff00' })
              .setLngLat([longitude, latitude])
              .addTo(map.current)
            console.log('✅ Marker créé')
          } else if (marker.current) {
            marker.current.setLngLat([longitude, latitude])
          }

          // Move map to user location
          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 2000
          })
        },
        (error) => {
          console.error('❌ GPS error:', error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      )
    } else {
      console.error('❌ GPS non supporté')
    }

    // Cleanup
    return () => {
      marker.current?.remove()
      map.current?.remove()
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100%' }}
      />
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 1000
      }}>
        🗺️ GPS Test - Ouvre la console F12
      </div>
    </div>
  )
}
