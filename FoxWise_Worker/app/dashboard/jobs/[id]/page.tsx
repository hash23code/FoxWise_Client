'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Clock, User, Phone, Mail,
  Navigation, CheckCircle, PlayCircle, AlertCircle,
  FileText, Building2, Briefcase
} from 'lucide-react'
import Link from 'next/link'
import type { Job } from '@/types'

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-blue-500/20 text-blue-400 border-blue-500', icon: AlertCircle },
  completed: { label: 'Terminé', color: 'bg-green-500/20 text-green-400 border-green-500', icon: CheckCircle },
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const data = await res.json()
        const foundJob = data.find((j: Job) => j.id === jobId)
        if (foundJob) {
          setJob(foundJob)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (!job) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/jobs?id=${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        const updated = await res.json()
        setJob(updated)
      } else {
        alert('Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const handleNavigate = () => {
    if (!job?.client?.address) return

    // Open in Google Maps or Apple Maps depending on device
    const address = encodeURIComponent(job.client.address)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      // Try to open in native maps app
      window.location.href = `https://maps.google.com/maps?daddr=${address}`
    } else {
      // Open in new tab for desktop
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center text-white">
        <p>Job non trouvé</p>
        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
          Retour aux jobs
        </Link>
      </div>
    )
  }

  const StatusIcon = statusConfig[job.status as keyof typeof statusConfig]?.icon || Clock

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">
            {job.job_type?.name || job.title || 'Détails du Job'}
          </h1>
          <p className="text-gray-400 mt-1">
            {job.client?.name || 'Client non spécifié'}
          </p>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusConfig[job.status as keyof typeof statusConfig]?.color}`}>
              <StatusIcon className="w-5 h-5" />
              {statusConfig[job.status as keyof typeof statusConfig]?.label}
            </div>
          </div>
        </div>

        {/* Status Update Buttons */}
        <div className="flex gap-3">
          {job.status === 'pending' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              disabled={updating}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Commencer le job
            </button>
          )}

          {job.status === 'in_progress' && (
            <>
              <button
                onClick={() => handleStatusChange('pending')}
                disabled={updating}
                className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Mettre en attente
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={updating}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Marquer comme terminé
              </button>
            </>
          )}

          {job.status === 'completed' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              disabled={updating}
              className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Rouvrir le job
            </button>
          )}
        </div>
      </div>

      {/* Client Information */}
      {job.client && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Informations Client
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Nom</p>
                <p className="text-white font-medium">{job.client.name}</p>
              </div>
            </div>

            {job.client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Téléphone</p>
                  <a href={`tel:${job.client.phone}`} className="text-purple-400 hover:text-purple-300 font-medium">
                    {job.client.phone}
                  </a>
                </div>
              </div>
            )}

            {job.client.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <a href={`mailto:${job.client.email}`} className="text-purple-400 hover:text-purple-300 font-medium">
                    {job.client.email}
                  </a>
                </div>
              </div>
            )}

            {job.client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Adresse</p>
                  <p className="text-white font-medium">{job.client.address}</p>
                  <button
                    onClick={handleNavigate}
                    className="mt-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Naviguer vers le client
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Détails du Job
        </h2>

        <div className="space-y-3">
          {job.scheduled_date && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Date prévue</p>
                <p className="text-white font-medium">
                  {new Date(job.scheduled_date).toLocaleDateString('fr-CA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {job.description && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-white">{job.description}</p>
              </div>
            </div>
          )}

          {job.job_type && (
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Type d'activité</p>
                <p className="text-white font-medium">{job.job_type.name}</p>
              </div>
            </div>
          )}

          {job.assigned_employee && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Assigné à</p>
                <p className="text-white font-medium">
                  {job.assigned_employee.full_name || job.assigned_employee.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
