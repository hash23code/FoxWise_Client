'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function GPSTestPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const userMarker = useRef<mapboxgl.Marker | null>(null)
  const [speed, setSpeed] = useState(0)
  const [heading, setHeading] = useState(0)
  const [altitude, setAltitude] = useState(0)
  const [currentPosition, setCurrentPosition] = useState<{ longitude: number; latitude: number; heading: number } | null>(null)
  const [viewMode, setViewMode] = useState<'immersive' | 'overhead'>('immersive')
  const [followGPS, setFollowGPS] = useState(true) // Track if we should follow GPS or free roam
  const [distanceTraveled, setDistanceTraveled] = useState(0)
  const [sessionStart] = useState(Date.now())
  const [maxSpeed, setMaxSpeed] = useState(0)
  const lastPosition = useRef<{ lng: number; lat: number } | null>(null)
  const trail = useRef<Array<[number, number]>>([])
  const [weather, setWeather] = useState<'clear' | 'rain' | 'snow'>('clear')

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

      // Add 3D buildings layer with enhanced lighting
      map.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'height'],
            0, '#0a0a1e',
            20, '#1a1a3e',
            50, '#2a2a5e',
            100, '#3a3a7e',
            200, '#4a4a9e'
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.9,
          'fill-extrusion-vertical-gradient': true
        }
      })

      // Add enhanced sky layer with dynamic lighting
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 80.0],
          'sky-atmosphere-sun-intensity': 20,
          'sky-atmosphere-halo-color': 'rgba(102, 126, 234, 0.8)',
          'sky-atmosphere-color': 'rgba(26, 26, 46, 0.9)',
          'sky-gradient-center': [0, 0],
          'sky-gradient-radius': 90,
          'sky-opacity': [
            'interpolate',
            ['exponential', 0.1],
            ['zoom'],
            5, 0,
            22, 1
          ]
        }
      })

      // Add fog for ultra-depth perception
      try {
        if (typeof map.current.setFog === 'function') {
          map.current.setFog({
            'range': [0.8, 8],
            'color': '#1a1a2e',
            'horizon-blend': 0.05,
            'high-color': '#667eea',
            'space-color': '#0a0a1e',
            'star-intensity': 0.5
          })
        }
      } catch (error) {
        console.log('Fog not supported')
      }

      // Add ambient and directional lighting for 3D buildings
      try {
        if (typeof map.current.setLight === 'function') {
          map.current.setLight({
            anchor: 'viewport',
            color: '#ffffff',
            intensity: 0.4,
            position: [1.5, 180, 80]
          })
        }
      } catch (error) {
        console.log('Lighting not supported')
      }

      console.log('✅ Effets 3D ajoutés')

      // Add trail source for movement trail
      map.current.addSource('trail', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      })

      // Add trail layer with gradient effect
      map.current.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, '#667eea',
            0.5, '#10b981',
            1, '#f59e0b'
          ],
          'line-width': 6,
          'line-opacity': 0.8,
          'line-gradient': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, 'rgba(102, 126, 234, 0.2)',
            0.5, 'rgba(16, 185, 129, 0.6)',
            1, 'rgba(245, 158, 11, 1)'
          ]
        }
      })

      // Add pulsing circle around user position
      map.current.addSource('user-pulse', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [-73.5673, 45.5017]
          }
        }
      })

      map.current.addLayer({
        id: 'user-pulse-layer',
        type: 'circle',
        source: 'user-pulse',
        paint: {
          'circle-radius': 30,
          'circle-color': '#10b981',
          'circle-opacity': 0.3,
          'circle-blur': 0.8
        }
      })
    })

    // Detect manual map movement (stop GPS follow when user pans)
    map.current.on('dragstart', () => {
      setFollowGPS(false)
      console.log('🖐️ Free roam mode - GPS tracking paused')
    })

    // Create custom marker for user position
    const el = document.createElement('div')
    el.className = 'user-marker'
    el.style.cssText = `
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 40px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      animation: userPulse 2s infinite;
      cursor: pointer;
    `
    el.innerHTML = '🏎️'

    userMarker.current = new mapboxgl.Marker(el)
      .setLngLat([-73.5673, 45.5017])
      .addTo(map.current)

    // Track GPS position
    if (navigator.geolocation) {
      console.log('✅ GPS disponible')

      navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude, speed: gpsSpeed, heading: gpsHeading, altitude: gpsAltitude } = position.coords
          console.log(`📍 Position: ${latitude}, ${longitude}`)

          const currentSpeed = gpsSpeed ? gpsSpeed * 3.6 : 0

          // Update stats
          setSpeed(currentSpeed)
          setHeading(gpsHeading || 0)
          setAltitude(gpsAltitude || 0)

          // Track max speed
          if (currentSpeed > maxSpeed) {
            setMaxSpeed(currentSpeed)
          }

          // Calculate distance traveled
          if (lastPosition.current) {
            const R = 6371 // Earth radius in km
            const dLat = (latitude - lastPosition.current.lat) * Math.PI / 180
            const dLon = (longitude - lastPosition.current.lng) * Math.PI / 180
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lastPosition.current.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distance = R * c
            setDistanceTraveled(prev => prev + distance)
          }
          lastPosition.current = { lng: longitude, lat: latitude }

          // Update trail
          trail.current.push([longitude, latitude])
          if (trail.current.length > 100) {
            trail.current.shift() // Keep only last 100 points
          }

          // Update marker position
          if (userMarker.current) {
            userMarker.current.setLngLat([longitude, latitude])
          }

          // Update pulse circle
          if (map.current?.getSource('user-pulse')) {
            (map.current.getSource('user-pulse') as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              }
            })
          }

          // Update trail line
          if (map.current?.getSource('trail') && trail.current.length > 1) {
            (map.current.getSource('trail') as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: trail.current
              }
            })
          }

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

  // Update weather/precipitation effects using real Mapbox API
  useEffect(() => {
    if (!map.current) return

    try {
      const mapAny = map.current as any

      if (weather === 'rain') {
        // Clear snow first if it was active
        if (typeof mapAny.setSnow === 'function') {
          mapAny.setSnow(null)
        }
        // Set rain with official Mapbox API
        if (typeof mapAny.setRain === 'function') {
          mapAny.setRain({
            density: 0.8,
            intensity: 1.0,
            color: '#a8adbc',
            opacity: 0.7,
            vignette: 1.0,
            'vignette-color': '#464646',
            direction: [0, 80],
            'droplet-size': [2.6, 18.2],
            'distortion-strength': 0.7,
            'center-thinning': 0
          })
          console.log('✅ Rain enabled')
        }
      } else if (weather === 'snow') {
        // Clear rain first if it was active
        if (typeof mapAny.setRain === 'function') {
          mapAny.setRain(null)
        }
        // Set snow with official Mapbox API
        if (typeof mapAny.setSnow === 'function') {
          mapAny.setSnow({
            density: 0.85,
            intensity: 1.0,
            'center-thinning': 0.1,
            direction: [0, 50],
            opacity: 1.0,
            color: '#ffffff',
            'flake-size': 0.71,
            vignette: 0.3,
            'vignette-color': '#ffffff'
          })
          console.log('✅ Snow enabled')
        }
      } else {
        // Clear both rain and snow
        if (typeof mapAny.setRain === 'function') {
          mapAny.setRain(null)
        }
        if (typeof mapAny.setSnow === 'function') {
          mapAny.setSnow(null)
        }
        console.log('✅ Weather cleared')
      }
    } catch (error) {
      console.log('❌ Weather effects error:', error)
    }
  }, [weather])

  // Calculate session time
  const sessionTime = Math.floor((Date.now() - sessionStart) / 1000)
  const minutes = Math.floor(sessionTime / 60)
  const seconds = sessionTime % 60

  // Calculate speedometer angle (0-200 km/h mapped to -135° to 135°)
  const speedAngle = -135 + (Math.min(speed, 200) / 200) * 270

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, position: 'relative', overflow: 'hidden' }}>
      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Speed Effect - Motion blur lines when moving fast */}
      {speed > 50 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 997,
          background: `repeating-linear-gradient(
            ${heading}deg,
            transparent 0px,
            rgba(255,255,255,${Math.min(speed / 500, 0.2)}) 1px,
            transparent 2px,
            transparent 100px
          )`,
          animation: 'speedLines 0.1s linear infinite'
        }} />
      )}

      {/* Circular Speedometer - Bottom Left */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 30,
        width: '180px',
        height: '180px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(30px)',
        borderRadius: '50%',
        border: '3px solid rgba(102, 126, 234, 0.5)',
        boxShadow: '0 0 40px rgba(102, 126, 234, 0.3), inset 0 0 30px rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Speed arc background */}
        <svg width="180" height="180" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
          <circle
            cx="90"
            cy="90"
            r="70"
            fill="none"
            stroke="url(#speedGradient)"
            strokeWidth="12"
            strokeDasharray={`${(Math.min(speed, 200) / 200) * 440} 440`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
          <defs>
            <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>

        {/* Speed value */}
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
            lineHeight: 1
          }}>
            {speed.toFixed(0)}
          </div>
          <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', marginTop: '5px' }}>
            KM/H
          </div>
          <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>
            MAX: {maxSpeed.toFixed(0)}
          </div>
        </div>

        {/* Speedometer needle */}
        <div style={{
          position: 'absolute',
          width: '2px',
          height: '60px',
          background: 'linear-gradient(to bottom, #ef4444, transparent)',
          transformOrigin: 'bottom center',
          transform: `rotate(${speedAngle}deg)`,
          transition: 'transform 0.3s ease',
          bottom: '90px',
          left: '89px',
          filter: 'drop-shadow(0 0 5px #ef4444)'
        }} />
      </div>

      {/* Compass Rose - Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: '120px',
        height: '120px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(30px)',
        borderRadius: '50%',
        border: '3px solid rgba(59, 130, 246, 0.5)',
        boxShadow: '0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 30px rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Compass background */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `rotate(${-heading}deg)`,
          transition: 'transform 0.5s ease'
        }}>
          {/* Cardinal directions */}
          <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', color: '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>N</div>
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '16px' }}>E</div>
          <div style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', color: '#6b7280', fontSize: '16px' }}>S</div>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '16px' }}>W</div>
        </div>

        {/* Compass needle */}
        <div style={{
          position: 'absolute',
          width: '4px',
          height: '50px',
          background: 'linear-gradient(to bottom, #ef4444, #3b82f6)',
          clipPath: 'polygon(50% 0%, 100% 100%, 50% 85%, 0% 100%)',
          filter: 'drop-shadow(0 0 10px #ef4444)'
        }} />

        {/* Heading value */}
        <div style={{
          position: 'absolute',
          bottom: '15px',
          fontSize: '12px',
          color: 'white',
          fontWeight: 'bold',
          fontFamily: 'monospace'
        }}>
          {heading.toFixed(0)}°
        </div>
      </div>

      {/* Session Stats - Top Left */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(30px)',
        padding: '15px 20px',
        borderRadius: '20px',
        border: '2px solid rgba(102, 126, 234, 0.3)',
        boxShadow: '0 0 30px rgba(102, 126, 234, 0.2)',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <div style={{ color: '#667eea', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
          📊 Session
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Distance</span>
            <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {distanceTraveled.toFixed(2)} km
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Temps</span>
            <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Altitude</span>
            <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {altitude.toFixed(0)}m
            </span>
          </div>
        </div>
      </div>

      {/* Weather Toggle - Top Center */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(30px)',
        padding: '10px',
        borderRadius: '15px',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => setWeather('clear')}
          style={{
            background: weather === 'clear' ? 'rgba(102, 126, 234, 0.5)' : 'transparent',
            border: weather === 'clear' ? '2px solid #667eea' : '2px solid transparent',
            borderRadius: '10px',
            padding: '8px 15px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          ☀️
        </button>
        <button
          onClick={() => setWeather('rain')}
          style={{
            background: weather === 'rain' ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
            border: weather === 'rain' ? '2px solid #3b82f6' : '2px solid transparent',
            borderRadius: '10px',
            padding: '8px 15px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🌧️
        </button>
        <button
          onClick={() => setWeather('snow')}
          style={{
            background: weather === 'snow' ? 'rgba(156, 163, 175, 0.5)' : 'transparent',
            border: weather === 'snow' ? '2px solid #9ca3af' : '2px solid transparent',
            borderRadius: '10px',
            padding: '8px 15px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          ❄️
        </button>
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

      {/* Status Badge - Bottom Center */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        background: followGPS ? 'rgba(16, 185, 129, 0.9)' : 'rgba(234, 179, 8, 0.9)',
        backdropFilter: 'blur(30px)',
        padding: '12px 25px',
        borderRadius: '20px',
        border: followGPS ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(234, 179, 8, 0.5)',
        boxShadow: followGPS ? '0 0 30px rgba(16, 185, 129, 0.3)' : '0 0 30px rgba(234, 179, 8, 0.3)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: followGPS ? '#10b981' : '#eab308',
          animation: 'pulse 2s infinite',
          boxShadow: followGPS ? '0 0 15px #10b981' : '0 0 15px #eab308'
        }} />
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
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

        @keyframes userPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 40px rgba(102, 126, 234, 0.4);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 30px rgba(102, 126, 234, 1), 0 0 60px rgba(102, 126, 234, 0.6);
          }
        }

        @keyframes speedLines {
          0% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.3;
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.5), 0 0 40px rgba(102, 126, 234, 0.3), inset 0 0 20px rgba(102, 126, 234, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(102, 126, 234, 0.8), 0 0 60px rgba(102, 126, 234, 0.5), inset 0 0 30px rgba(102, 126, 234, 0.2);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* Custom scrollbar for stats */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(102, 126, 234, 0.5);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(102, 126, 234, 0.8);
        }
      `}</style>
    </div>
  )
}
