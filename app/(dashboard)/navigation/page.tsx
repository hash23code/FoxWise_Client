'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, List, AlertCircle, CheckCircle, Clock, X, ChevronRight } from 'lucide-react'
import type { Job } from '@/types'

const NavigationMap = dynamic(() => import('@/components/NavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-950">
      <div className="text-white text-xl">Chargement de la carte...</div>
    </div>
  )
})

export default function NavigationPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [mapboxApiKey, setMapboxApiKey] = useState('')
  const [showJobList, setShowJobList] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [freeRideMode, setFreeRideMode] = useState(false)
  const [newJobNotification, setNewJobNotification] = useState<Job | null>(null)
  const [previousJobCount, setPreviousJobCount] = useState(0)

  const addDebug = (msg: string) => {
    console.log('[Navigation]', msg)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  useEffect(() => {
    addDebug('Starting initialization...')

    const apiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || ''
    addDebug(`API Key: ${apiKey ? 'Present' : 'Missing'}`)
    setMapboxApiKey(apiKey)

    if (!apiKey) {
      setError('Clé API Mapbox manquante')
      setLoading(false)
      return
    }

    fetchJobs()

    // Poll for new jobs every 10 seconds
    const pollInterval = setInterval(() => {
      fetchJobs()
    }, 10000)

    if (navigator.geolocation) {
      addDebug('Geolocation available, requesting permission...')

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          addDebug(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          setUserLocation({ lat, lng })
          updateEmployeeLocation(lat, lng, position.coords.heading || 0, position.coords.speed || 0)
          checkProximity(lat, lng)
        },
        (error) => {
          // Don't block the app if geolocation times out - just log it
          addDebug(`Geolocation warning: ${error.message} (code: ${error.code})`)
          console.warn('Geolocation error (non-blocking):', error)
          // Don't set error state or stop loading - continue anyway
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000, // Allow 10s old positions
          timeout: 30000 // Increase timeout to 30s
        }
      )

      return () => {
        clearInterval(pollInterval)
        if (watchId) {
          addDebug('Cleaning up geolocation watch')
          navigator.geolocation.clearWatch(watchId)
        }
      }
    } else {
      addDebug('Geolocation NOT available - continuing without GPS')
      // Don't block the app - just continue without GPS
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchJobs = async () => {
    try {
      addDebug('Fetching jobs...')
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const data = await res.json()
        addDebug(`Received ${data.length} jobs`)
        const assignedJobs = data.filter(
          (job: Job) => job.assigned_to && job.status !== 'cancelled' && job.status !== 'completed'
        )
        addDebug(`${assignedJobs.length} assigned jobs`)

        // Check for new jobs and show notification
        if (previousJobCount > 0 && assignedJobs.length > previousJobCount) {
          const newJob = assignedJobs[0] // Assume newest job is first
          setNewJobNotification(newJob)
          addDebug(`🚨 NEW JOB ASSIGNED: ${newJob.title}`)

          // Auto-dismiss notification after 5 seconds
          setTimeout(() => setNewJobNotification(null), 5000)
        }

        setPreviousJobCount(assignedJobs.length)
        setJobs(assignedJobs)

        // If no jobs or current job has no coordinates, enable free ride mode
        if (assignedJobs.length === 0 || (assignedJobs[0] && !assignedJobs[0].latitude)) {
          setFreeRideMode(true)
          addDebug('Free ride mode enabled')
        }

        if (!selectedJob && assignedJobs.length > 0) {
          const job = assignedJobs[0]
          setSelectedJob(job)
          addDebug(`Selected job: ${job.title}`)
          addDebug(`Job has coordinates: ${job.latitude ? 'YES' : 'NO'} (lat: ${job.latitude}, lng: ${job.longitude})`)
          addDebug(`Client address: ${job.client?.address || 'N/A'}`)

          // If job has coordinates, disable free ride mode
          if (job.latitude && job.longitude) {
            setFreeRideMode(false)
          }
        }
      } else {
        addDebug(`Failed to fetch jobs: ${res.status}`)
      }
    } catch (error: any) {
      addDebug(`Error fetching jobs: ${error.message}`)
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateEmployeeLocation = useCallback(async (lat: number, lng: number, heading: number, speed: number) => {
    try {
      await fetch('/api/geolocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          heading,
          speed: speed * 3.6,
          accuracy: 10
        })
      })
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }, [])

  const checkProximity = async (lat: number, lng: number) => {
    try {
      const res = await fetch('/api/jobs/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          threshold: 50
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.updated > 0) {
          addDebug(`${data.updated} jobs updated (proximity)`)
          await fetchJobs()
        }
      }
    } catch (error) {
      console.error('Error checking proximity:', error)
    }
  }

  const handleArrival = useCallback(async () => {
    if (!selectedJob) return

    try {
      await fetch('/api/jobs/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          location_status: 'arrived'
        })
      })

      await fetchJobs()
    } catch (error) {
      console.error('Error marking arrival:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob])

  const handleComplete = async (jobId: string) => {
    try {
      await fetch('/api/jobs/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          location_status: 'completed'
        })
      })

      await fetchJobs()

      const remainingJobs = jobs.filter(j => j.id !== jobId)
      if (remainingJobs.length > 0) {
        setSelectedJob(remainingJobs[0])
      } else {
        setSelectedJob(null)
      }

      setShowJobList(false)
    } catch (error) {
      console.error('Error completing job:', error)
    }
  }

  const handleSelectJob = (job: Job) => {
    addDebug(`Job selected: ${job.title}`)
    setSelectedJob(job)
    setShowJobList(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'arrived':
        return 'text-green-400 bg-green-500/20'
      case 'en_route':
        return 'text-blue-400 bg-blue-500/20'
      case 'assigned':
        return 'text-orange-400 bg-orange-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      assigned: 'Assigné',
      en_route: 'En route',
      arrived: 'Arrivé',
      completed: 'Complété'
    }
    return labels[status] || status
  }

  // Debug panel toggle
  const [showDebug, setShowDebug] = useState(false)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-950 p-4">
        <div className="text-white text-xl mb-4">Chargement de la navigation...</div>
        <div className="text-gray-400 text-sm">{debugInfo[debugInfo.length - 1]}</div>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="mt-4 text-xs text-gray-500 hover:text-gray-300"
        >
          {showDebug ? 'Masquer' : 'Afficher'} les détails
        </button>
        {showDebug && (
          <div className="mt-4 bg-black/50 p-4 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="text-xs font-mono text-green-400 space-y-1">
              {debugInfo.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 max-w-md mx-4">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-gray-300 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
          >
            Réessayer
          </button>
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer">Logs de débogage</summary>
            <div className="mt-2 bg-black/50 p-2 rounded text-xs font-mono text-green-400 max-h-40 overflow-y-auto">
              {debugInfo.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          </details>
        </div>
      </div>
    )
  }

  if (!mapboxApiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 max-w-md mx-4">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Clé API Mapbox manquante</h2>
          <p className="text-gray-300 text-sm">
            Veuillez ajouter votre clé API Mapbox dans les variables d&apos;environnement Vercel
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex relative overflow-hidden bg-gray-950">
      {/* Debug button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="absolute top-4 right-4 z-50 bg-black/80 text-white px-2 py-1 rounded text-xs"
      >
        Debug
      </button>

      {showDebug && (
        <div className="absolute top-16 right-4 z-50 bg-black/90 p-4 rounded-lg max-w-md max-h-96 overflow-y-auto">
          <div className="text-xs font-mono text-green-400 space-y-1">
            {debugInfo.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        </div>
      )}

      {/* Burger Menu Button */}
      <button
        onClick={() => setShowJobList(!showJobList)}
        className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-xl text-white p-3 rounded-xl border border-white/20 hover:bg-black/90 transition-all shadow-2xl"
        aria-label="Toggle job list"
      >
        {showJobList ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
      </button>

      {/* Job List Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-full sm:w-96
          bg-gray-950/95 backdrop-blur-xl border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${showJobList ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white">Mes Jobs</h2>
              <button
                onClick={() => setShowJobList(false)}
                className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm">{jobs.length} job{jobs.length > 1 ? 's' : ''} assigné{jobs.length > 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {jobs.map((job, index) => (
              <button
                key={job.id}
                onClick={() => handleSelectJob(job)}
                className={`w-full text-left bg-gray-800/50 border rounded-xl p-4 transition-all ${
                  selectedJob?.id === job.id
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20 bg-gray-800'
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/70'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="bg-gray-700 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-white truncate">{job.title}</h3>
                  </div>
                  {job.is_urgent && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse ml-2 flex-shrink-0">
                      URGENT
                    </span>
                  )}
                </div>

                {job.description && (
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{job.description}</p>
                )}

                <div className="flex items-center gap-2 mb-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 truncate">
                    {job.client?.address || 'Adresse non définie'}
                  </span>
                </div>

                {job.scheduled_date && (
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400">
                      {new Date(job.scheduled_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.location_status)}`}>
                    {getStatusLabel(job.location_status)}
                  </span>

                  {job.location_status === 'arrived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleComplete(job.id)
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-600 transition-colors"
                    >
                      Compléter
                    </button>
                  )}

                  {selectedJob?.id === job.id && (
                    <ChevronRight className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showJobList && (
        <div
          className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          onClick={() => setShowJobList(false)}
        />
      )}

      {/* Map Container - Always shown (free ride mode if no destination) */}
      <div className="flex-1 relative">
        <NavigationMap
          destination={selectedJob && selectedJob.latitude && selectedJob.longitude ? selectedJob : null}
          apiKey={mapboxApiKey}
          onArrival={handleArrival}
          onLocationUpdate={updateEmployeeLocation}
          freeRideMode={freeRideMode}
        />
      </div>

      {/* New Job Notification */}
      {newJobNotification && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl p-4 border-2 border-orange-300 shadow-2xl max-w-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-base">Nouveau Job Assigné!</div>
                <div className="text-sm opacity-90">{newJobNotification.title}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedJob(newJobNotification)
                  setNewJobNotification(null)
                  setFreeRideMode(false)
                }}
                className="bg-white text-orange-600 px-3 py-1 rounded-lg font-semibold text-sm hover:bg-gray-100"
              >
                Voir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
