'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function GPSTestPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [speed, setSpeed] = useState(0)
  const [heading, setHeading] = useState(0)
  const [altitude, setAltitude] = useState(0)
  const [currentPosition, setCurrentPosition] = useState<{ longitude: number; latitude: number; heading: number } | null>(null)
  const [viewMode, setViewMode] = useState<'immersive' | 'overhead'>('immersive')
  const [followGPS, setFollowGPS] = useState(true) // Track if we should follow GPS or free roam

  // Initialize map ONCE
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

    // Create map with 3D navigation style
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [-73.5673, 45.5017], // Montreal
      zoom: 17,
      pitch: 70, // Inclinaison 3D immersive
      bearing: 0,
      antialias: true
    })

    console.log('✅ Map 3D créée')

    // When map loads, add 3D buildings and atmosphere
    map.current.on('load', () => {
      if (!map.current) return

      console.log('✅ Map chargée, ajout des effets 3D...')

      // Add 3D buildings layer
      map.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'height'],
            0, '#1a1a2e',
            50, '#2d2d44',
            100, '#3d3d5c'
          ],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.8
        }
      })

      // Add enhanced sky layer
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15,
          'sky-atmosphere-halo-color': '#667eea',
          'sky-atmosphere-color': '#1a1a2e'
        }
      })

      // Add fog for depth perception
      try {
        if (typeof map.current.setFog === 'function') {
          map.current.setFog({
            'range': [0.5, 10],
            'color': '#1a1a2e',
            'horizon-blend': 0.1,
            'high-color': '#667eea',
            'space-color': '#0a0a1e',
            'star-intensity': 0.3
          })
        }
      } catch (error) {
        console.log('Fog not supported')
      }

      console.log('✅ Effets 3D ajoutés')
    })

    // Detect manual map movement (stop GPS follow when user pans)
    map.current.on('dragstart', () => {
      setFollowGPS(false)
      console.log('🖐️ Free roam mode - GPS tracking paused')
    })

    // Track GPS position
    if (navigator.geolocation) {
      console.log('✅ GPS disponible')

      navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude, speed: gpsSpeed, heading: gpsHeading, altitude: gpsAltitude } = position.coords
          console.log(`📍 Position: ${latitude}, ${longitude}`)

          // Update stats
          setSpeed(gpsSpeed ? gpsSpeed * 3.6 : 0) // Convert m/s to km/h
          setHeading(gpsHeading || 0)
          setAltitude(gpsAltitude || 0)

          // Store current position
          setCurrentPosition({ longitude, latitude, heading: gpsHeading || 0 })
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
      map.current?.remove()
    }
  }, [])

  // Handle view mode changes - stay at current map center
  useEffect(() => {
    if (!map.current) return

    // Get current center of the map (wherever user is looking)
    const currentCenter = map.current.getCenter()
    const currentBearing = map.current.getBearing()

    if (viewMode === 'immersive') {
      map.current.easeTo({
        center: [currentCenter.lng, currentCenter.lat] as [number, number],
        zoom: 19, // Très proche
        pitch: 85, // Maximum pitch pour effet immersif
        bearing: currentBearing, // Keep current rotation
        duration: 1000,
        easing: (t: number) => t
      })
    } else {
      map.current.easeTo({
        center: [currentCenter.lng, currentCenter.lat] as [number, number],
        zoom: 15, // Plus éloigné
        pitch: 0, // Vue de haut
        bearing: 0, // North up
        duration: 1000,
        easing: (t: number) => t
      })
    }
  }, [viewMode])

  // Update camera to follow GPS position (only if followGPS is true)
  useEffect(() => {
    if (!map.current || !currentPosition || !followGPS) return

    const { longitude, latitude, heading } = currentPosition

    if (viewMode === 'immersive') {
      map.current.easeTo({
        center: [longitude, latitude] as [number, number],
        zoom: 19,
        pitch: 85,
        bearing: heading,
        duration: 1000,
        easing: (t: number) => t
      })
    } else {
      map.current.easeTo({
        center: [longitude, latitude] as [number, number],
        zoom: 15,
        pitch: 0,
        bearing: 0,
        duration: 1000,
        easing: (t: number) => t
      })
    }
  }, [currentPosition, viewMode, followGPS])

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, position: 'relative' }}>
      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Modern HUD - Top */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        padding: '15px 30px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
        display: 'flex',
        gap: '30px',
        alignItems: 'center'
      }}>
        {/* Speed */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '5px' }}>VITESSE</div>
          <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {speed.toFixed(0)}
          </div>
          <div style={{ color: '#6b7280', fontSize: '12px' }}>km/h</div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#3b82f6', fontSize: '12px', marginBottom: '5px' }}>DIRECTION</div>
          <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {heading.toFixed(0)}°
          </div>
          <div style={{ color: '#6b7280', fontSize: '12px' }}>
            {heading >= 337.5 || heading < 22.5 ? 'N' :
             heading >= 22.5 && heading < 67.5 ? 'NE' :
             heading >= 67.5 && heading < 112.5 ? 'E' :
             heading >= 112.5 && heading < 157.5 ? 'SE' :
             heading >= 157.5 && heading < 202.5 ? 'S' :
             heading >= 202.5 && heading < 247.5 ? 'SW' :
             heading >= 247.5 && heading < 292.5 ? 'W' : 'NW'}
          </div>
        </div>

        {/* Altitude */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f59e0b', fontSize: '12px', marginBottom: '5px' }}>ALTITUDE</div>
          <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {altitude.toFixed(0)}
          </div>
          <div style={{ color: '#6b7280', fontSize: '12px' }}>mètres</div>
        </div>
      </div>

      {/* View Mode Toggle - Top Right */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={() => setViewMode(viewMode === 'immersive' ? 'overhead' : 'immersive')}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            padding: '15px 25px',
            borderRadius: '15px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <div style={{ fontSize: '24px' }}>
            {viewMode === 'immersive' ? '🚁' : '🏎️'}
          </div>
          <div>
            {viewMode === 'immersive' ? 'VUE DE HAUT' : 'VUE IMMERSIVE'}
          </div>
        </button>

        {/* Re-center to GPS button - only show when not following GPS */}
        {!followGPS && (
          <button
            onClick={() => setFollowGPS(true)}
            style={{
              background: 'rgba(16, 185, 129, 0.9)',
              backdropFilter: 'blur(20px)',
              padding: '15px 25px',
              borderRadius: '15px',
              border: '2px solid rgba(16, 185, 129, 0.5)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px',
              animation: 'pulse 2s infinite'
            }}
          >
            <div style={{ fontSize: '24px' }}>📍</div>
            <div>RETOUR GPS</div>
          </button>
        )}
      </div>

      {/* Status Badge - Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        background: followGPS ? 'rgba(16, 185, 129, 0.9)' : 'rgba(234, 179, 8, 0.9)',
        backdropFilter: 'blur(20px)',
        padding: '10px 20px',
        borderRadius: '15px',
        border: followGPS ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(234, 179, 8, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: followGPS ? '#10b981' : '#eab308',
          animation: 'pulse 2s infinite',
          boxShadow: followGPS ? '0 0 10px #10b981' : '0 0 10px #eab308'
        }} />
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
          {followGPS
            ? (viewMode === 'immersive' ? '🏎️ GPS IMMERSIF' : '🗺️ GPS CARTE')
            : '🖐️ FREE ROAM'}
        </div>
      </div>

      {/* Gradient Overlays for depth */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 30%)',
        pointerEvents: 'none',
        zIndex: 999
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 20%)',
        pointerEvents: 'none',
        zIndex: 999
      }} />

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
