'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Briefcase, MapPin, Clock, CheckCircle, AlertCircle, Navigation } from 'lucide-react'
import type { Job } from '@/types'

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-blue-500/20 text-blue-400', icon: AlertCircle },
  completed: { label: 'Terminé', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
}

export default function DashboardPage() {
  const { user } = useUser()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const data = await res.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    return job.status === filter
  })

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Mes Jobs</h1>
        <p className="text-gray-400 mt-1">
          Bonjour {user?.firstName || 'Employé'}, vous avez {stats.pending + stats.in_progress} tâche{stats.pending + stats.in_progress > 1 ? 's' : ''} active{stats.pending + stats.in_progress > 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 border-purple-500'
              : 'bg-gray-900 border-gray-800 hover:border-purple-500'
          }`}
        >
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-300">Total</div>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'pending'
              ? 'bg-yellow-500/20 border-yellow-500'
              : 'bg-gray-900 border-gray-800 hover:border-yellow-500'
          }`}
        >
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-sm text-gray-300">En attente</div>
        </button>

        <button
          onClick={() => setFilter('in_progress')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'in_progress'
              ? 'bg-blue-500/20 border-blue-500'
              : 'bg-gray-900 border-gray-800 hover:border-blue-500'
          }`}
        >
          <div className="text-2xl font-bold text-blue-400">{stats.in_progress}</div>
          <div className="text-sm text-gray-300">En cours</div>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'completed'
              ? 'bg-green-500/20 border-green-500'
              : 'bg-gray-900 border-gray-800 hover:border-green-500'
          }`}
        >
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-sm text-gray-300">Terminés</div>
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {filter === 'all' ? 'Aucun job assigné' : `Aucun job ${statusConfig[filter]?.label.toLowerCase()}`}
            </h2>
            <p className="text-gray-400">
              {filter === 'all'
                ? 'Contactez votre gestionnaire pour obtenir des tâches'
                : 'Changez de filtre pour voir vos autres jobs'}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const StatusIcon = statusConfig[job.status as keyof typeof statusConfig]?.icon || Clock
            return (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                      {job.job_type?.name || job.title || 'Job sans titre'}
                    </h3>
                    {job.client && (
                      <p className="text-gray-400 text-sm">
                        {job.client.name}
                      </p>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[job.status as keyof typeof statusConfig]?.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig[job.status as keyof typeof statusConfig]?.label}
                  </div>
                </div>

                {job.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {job.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {job.client?.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.client.address}</span>
                      </div>
                    )}
                    {job.scheduled_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-purple-400 font-medium text-sm group-hover:text-purple-300">
                    <Navigation className="w-4 h-4" />
                    Voir détails
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
