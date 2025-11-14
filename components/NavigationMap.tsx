'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Navigation, Zap, MapPin, CloudRain, CloudSnow, Sun, Droplets } from 'lucide-react'
import type { Job } from '@/types'

interface NavigationMapProps {
  destination: Job | null
  apiKey: string
  onArrival?: () => void
  onLocationUpdate?: (lat: number, lng: number, heading: number, speed: number) => void
  freeRideMode?: boolean
}

export default function NavigationMap({
  destination,
  apiKey,
  onArrival,
  onLocationUpdate,
  freeRideMode = false
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
  const animationFrame = useRef<number | null>(null)
  const particlesLayer = useRef<any[]>([])

  // Initialize map with ULTRA graphics
  useEffect(() => {
    console.log('[NavigationMap] Initializing...')
    console.log('[NavigationMap] mapContainer.current:', mapContainer.current ? 'Present' : 'NULL')
    console.log('[NavigationMap] map.current:', map.current ? 'Already exists' : 'NULL')
    console.log('[NavigationMap] apiKey:', apiKey ? 'Present' : 'Missing')
    console.log('[NavigationMap] freeRideMode:', freeRideMode)
    console.log('[NavigationMap] destination:', destination)

    if (!mapContainer.current || map.current) {
      console.log('[NavigationMap] Skipping initialization - container or map issue')
      return
    }

    try {
      console.log('[NavigationMap] Setting Mapbox access token...')
      mapboxgl.accessToken = apiKey

      console.log('[NavigationMap] Creating Mapbox Map instance...')
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        center: [-73.5673, 45.5017],
        zoom: 17,
        pitch: 75, // Plus incliné pour effet immersif
        bearing: 0,
        antialias: true,
        attributionControl: false // Enlever l'attribution pour plus d'espace
      })
      console.log('[NavigationMap] Map instance created successfully!')
    } catch (error) {
      console.error('[NavigationMap] Map initialization error:', error)
      return
    }

    map.current.on('load', () => {
      console.log('[NavigationMap] Map loaded event fired!')
      if (!map.current) return

      console.log('[NavigationMap] Adding 3D buildings layer...')
      // Add 3D buildings with better styling
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
          'fill-extrusion-opacity': 0.9
        }
      })

      // Enhanced sky layer
      map.current!.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 20,
          'sky-atmosphere-halo-color': '#667eea',
          'sky-atmosphere-color': '#1a1a2e'
        }
      })

      // Add fog for depth (optional - may not be supported on all devices)
      try {
        if (map.current && typeof map.current.setFog === 'function') {
          map.current.setFog({
            'range': [1, 20],
            'color': '#1a1a2e',
            'horizon-blend': 0.1,
            'high-color': '#667eea',
            'space-color': '#0a0a1e',
            'star-intensity': 0.5
          })
        }
      } catch (error) {
        console.log('Fog not supported on this device')
      }
    })

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
      const frameId = animationFrame.current
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      map.current?.remove()
    }
  }, [apiKey])

  // Start GPS tracking with high precision
  useEffect(() => {
    console.log('[NavigationMap] Setting up GPS tracking...')
    if (!navigator.geolocation) {
      console.error('[NavigationMap] Geolocation NOT supported!')
      alert('Geolocation non supportée')
      return
    }

    console.log('[NavigationMap] Starting watchPosition...')
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const newHeading = position.coords.heading || 0
        const newSpeed = position.coords.speed ? position.coords.speed * 3.6 : 0

        setUserLocation({ lat, lng })
        setHeading(newHeading)
        setSpeed(newSpeed)

        // Smooth camera movement
        if (map.current) {
          map.current.easeTo({
            center: [lng, lat],
            zoom: 18.5,
            pitch: 75,
            bearing: newHeading,
            duration: 1000
          })
        }

        if (onLocationUpdate) {
          onLocationUpdate(lat, lng, newHeading, newSpeed)
        }

        // Check arrival (only if not in free ride mode and destination exists)
        if (!freeRideMode && destination && destination.latitude && destination.longitude) {
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
      (error) => console.error('Geolocation error:', error),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, arrived, onArrival, onLocationUpdate])

  // Fetch and draw route with enhanced styling (only if not in free ride mode)
  useEffect(() => {
    if (freeRideMode || !map.current || !userLocation || !destination || !destination.latitude || !destination.longitude) return

    fetchRoute(userLocation.lng, userLocation.lat, destination.longitude, destination.latitude)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, destination, freeRideMode])

  const fetchRoute = async (startLng: number, startLat: number, endLng: number, endLat: number) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&steps=true&banner_instructions=true&voice_instructions=true&access_token=${apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        setDuration(route.duration)
        setDistance(route.distance)

        if (route.legs[0].steps.length > 0) {
          setCurrentInstruction(route.legs[0].steps[0].maneuver.instruction)
        }

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

            // Main route line with glow effect
            map.current.addLayer({
              id: 'route-glow',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#3b82f6',
                'line-width': 12,
                'line-opacity': 0.4,
                'line-blur': 8
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
                'line-color': '#60a5fa',
                'line-width': 6,
                'line-opacity': 1
              }
            })

            // Animated dashes
            map.current.addLayer({
              id: 'route-arrow',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#93c5fd',
                'line-width': 3,
                'line-opacity': 1,
                'line-dasharray': [0, 2, 4]
              }
            })
          }

          // Enhanced destination marker
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

            // Pulsing effect for destination
            map.current.addLayer({
              id: 'destination-glow',
              type: 'circle',
              source: 'destination',
              paint: {
                'circle-radius': 30,
                'circle-color': destination?.is_urgent ? '#ef4444' : '#10b981',
                'circle-opacity': 0.3,
                'circle-blur': 1
              }
            })

            map.current.addLayer({
              id: 'destination-marker',
              type: 'circle',
              source: 'destination',
              paint: {
                'circle-radius': 18,
                'circle-color': destination?.is_urgent ? '#ef4444' : '#10b981',
                'circle-stroke-width': 4,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 1
              }
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }

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

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    if (mins < 60) {
      return `${mins}min`
    }
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}min`
  }

  const toggleWeather = () => {
    const effects: Array<'rain' | 'snow' | 'clear'> = ['clear', 'rain', 'snow']
    const currentIndex = effects.indexOf(weatherEffect)
    const nextIndex = (currentIndex + 1) % effects.length
    setWeatherEffect(effects[nextIndex])
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Compact Mobile-Optimized HUD */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Compact Bar */}
        <div className="absolute top-0 left-0 right-0 p-2 md:p-3">
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden pointer-events-auto">
            {/* Destination header - Ultra compact */}
            <div className="px-3 py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                {freeRideMode ? (
                  <>
                    <Navigation className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-bold text-sm md:text-base truncate">Mode Exploration 3D</h2>
                    </div>
                  </>
                ) : destination ? (
                  <>
                    <MapPin className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${destination.is_urgent ? 'text-red-400 animate-pulse' : 'text-green-400'}`} />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-bold text-sm md:text-base truncate">{destination.title}</h2>
                    </div>
                    {destination.is_urgent && (
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse flex-shrink-0">
                        URGENT
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            </div>

            {/* Stats - Ultra compact grid */}
            <div className="grid grid-cols-3 gap-1 p-2">
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs text-gray-400">Distance</div>
                <div className="text-white font-bold text-sm md:text-base">
                  {freeRideMode ? '--' : (distance !== null ? formatDistance(distance) : '---')}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs text-gray-400">Temps</div>
                <div className="text-white font-bold text-sm md:text-base">
                  {freeRideMode ? '--' : (duration !== null ? formatDuration(duration) : '---')}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs text-gray-400">Vitesse</div>
                <div className="text-white font-bold text-sm md:text-base flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  {speed.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current instruction - Bottom, more visible */}
        {!freeRideMode && currentInstruction && !arrived && (
          <div className="absolute bottom-20 md:bottom-24 left-2 right-2 md:left-4 md:right-4 pointer-events-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl p-3 md:p-4 border-2 border-blue-300 shadow-2xl">
              <div className="flex items-center gap-3">
                <Navigation className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm md:text-base leading-tight">{currentInstruction}</div>
                  {distance !== null && distance < 1000 && (
                    <div className="text-xs md:text-sm opacity-90 mt-1">dans {formatDistance(distance)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Free ride mode message */}
        {freeRideMode && (
          <div className="absolute bottom-20 md:bottom-24 left-2 right-2 md:left-4 md:right-4 pointer-events-auto">
            <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white rounded-2xl p-3 md:p-4 border border-blue-300/50 shadow-2xl">
              <div className="flex items-center gap-3">
                <Navigation className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm md:text-base leading-tight">Mode Exploration</div>
                  <div className="text-xs md:text-sm opacity-90 mt-1">En attente de nouvelles missions...</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Arrival notification */}
        {!freeRideMode && arrived && destination && (
          <div className="absolute bottom-20 md:bottom-24 left-2 right-2 md:left-4 md:right-4 pointer-events-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl p-4 border-2 border-green-300 shadow-2xl animate-pulse">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-lg">Vous êtes arrivé!</div>
                  <div className="text-sm opacity-90">{destination.title}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Speed Circle - Bottom Left */}
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-xl rounded-full w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center border-2 border-white/20 shadow-xl">
            <div className="text-white font-bold text-xl md:text-2xl">{speed.toFixed(0)}</div>
            <div className="text-gray-400 text-[10px]">km/h</div>
          </div>
        </div>

        {/* Weather control - Bottom Right - Smaller */}
        <button
          onClick={toggleWeather}
          className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-black/70 backdrop-blur-xl text-white p-3 md:p-3.5 rounded-full border border-white/20 hover:bg-black/90 transition-all pointer-events-auto shadow-xl"
        >
          {weatherEffect === 'clear' && <Sun className="w-5 h-5 md:w-6 md:h-6" />}
          {weatherEffect === 'rain' && <CloudRain className="w-5 h-5 md:w-6 md:h-6" />}
          {weatherEffect === 'snow' && <CloudSnow className="w-5 h-5 md:w-6 md:h-6" />}
        </button>
      </div>

      {/* Animated gradient overlay for dramatic effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
      </div>
    </div>
  )
}
