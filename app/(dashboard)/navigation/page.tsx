'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, List, AlertCircle, CheckCircle, Clock, X, ChevronRight } from 'lucide-react'
import type { Job } from '@/types'

// Import NavigationMap dynamically to avoid SSR issues
const NavigationMap = dynamic(() => import('@/components/NavigationMap'), { ssr: false })

export default function NavigationPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapboxApiKey, setMapboxApiKey] = useState('')
  const [showJobList, setShowJobList] = useState(false) // Changé à false par défaut (menu burger)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || ''
      setMapboxApiKey(apiKey)

      fetchJobs()

      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            setUserLocation({ lat, lng })

            updateEmployeeLocation(lat, lng, position.coords.heading || 0, position.coords.speed || 0)
            checkProximity(lat, lng)
          },
          (error) => {
            console.error('Geolocation error:', error)
            setLoading(false)
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          }
        )

        return () => {
          if (watchId) navigator.geolocation.clearWatch(watchId)
        }
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Initialization error:', error)
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const data = await res.json()
        const assignedJobs = data.filter(
          (job: Job) => job.assigned_to && job.status !== 'cancelled' && job.status !== 'completed'
        )
        setJobs(assignedJobs)

        if (!selectedJob && assignedJobs.length > 0) {
          setSelectedJob(assignedJobs[0])
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateEmployeeLocation = async (lat: number, lng: number, heading: number, speed: number) => {
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
  }

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
          await fetchJobs()
        }
      }
    } catch (error) {
      console.error('Error checking proximity:', error)
    }
  }

  const handleArrival = async () => {
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
  }

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

      // Fermer le menu après avoir complété
      setShowJobList(false)
    } catch (error) {
      console.error('Error completing job:', error)
    }
  }

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job)
    setShowJobList(false) // Fermer le menu après sélection
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="text-white text-xl">Chargement de la navigation...</div>
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
            Veuillez ajouter votre clé API Mapbox dans le fichier <code className="bg-black/50 px-2 py-1 rounded text-xs">.env.local</code>
          </p>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center max-w-md mx-4">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Aucun Job Assigné</h2>
          <p className="text-gray-400">
            Vous n&apos;avez aucun job assigné pour le moment. Contactez votre gestionnaire pour plus d&apos;informations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex relative overflow-hidden">
      {/* Burger Menu Button - Always visible */}
      <button
        onClick={() => setShowJobList(!showJobList)}
        className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-xl text-white p-3 rounded-xl border border-white/20 hover:bg-black/90 transition-all shadow-2xl"
        aria-label="Toggle job list"
      >
        {showJobList ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
      </button>

      {/* Job List Sidebar - Slide from left on mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-full sm:w-96
          bg-gray-950/95 backdrop-blur-xl border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${showJobList ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
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

          {/* Job List */}
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

      {/* Overlay for mobile when menu is open */}
      {showJobList && (
        <div
          className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          onClick={() => setShowJobList(false)}
        />
      )}

      {/* Map Container - Full screen */}
      <div className="flex-1 relative">
        {selectedJob && selectedJob.latitude && selectedJob.longitude ? (
          <NavigationMap
            destination={selectedJob}
            apiKey={mapboxApiKey}
            onArrival={handleArrival}
            onLocationUpdate={updateEmployeeLocation}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-950">
            <div className="text-center px-4">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Aucune destination</h2>
              <p className="text-gray-400">
                {selectedJob
                  ? 'Ce job n&apos;a pas d&apos;adresse définie.'
                  : 'Sélectionnez un job dans la liste pour commencer la navigation.'}
              </p>
              <button
                onClick={() => setShowJobList(true)}
                className="mt-4 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all"
              >
                Voir mes jobs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
