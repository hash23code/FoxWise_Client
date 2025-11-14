'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function MapTestPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (map.current) return // Initialize map only once

    const apiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
    if (!apiKey) {
      console.error('No API key!')
      return
    }

    mapboxgl.accessToken = apiKey

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-73.5673, 45.5017],
      zoom: 12
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl())

    console.log('Map initialized!')

    return () => {
      map.current?.remove()
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
