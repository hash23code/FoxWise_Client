'use client'

import { useEffect, useState } from 'react'
import { Users, Briefcase, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import type { Stats, Client, Job } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, clientsRes, jobsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/clients'),
        fetch('/api/jobs')
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (clientsRes.ok) setClients(await clientsRes.json())
      if (jobsRes.ok) setJobs(await jobsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Chart data
  const clientsBySector = clients.reduce((acc, client) => {
    const sectorName = client.sector?.name || 'Sans secteur'
    const existing = acc.find(item => item.name === sectorName)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: sectorName, value: 1, color: client.sector?.color || '#888888' })
    }
    return acc
  }, [] as { name: string; value: number; color: string }[])

  const clientsByStatus = [
    { name: 'Actifs', value: clients.filter(c => c.status === 'active').length, color: '#10B981' },
    { name: 'Prospects', value: clients.filter(c => c.status === 'prospect').length, color: '#FBBF24' },
    { name: 'Inactifs', value: clients.filter(c => c.status === 'inactive').length, color: '#6B7280' }
  ]

  const jobsByStatus = [
    { name: 'En attente', value: jobs.filter(j => j.status === 'pending').length, color: '#F59E0B' },
    { name: 'En cours', value: jobs.filter(j => j.status === 'in_progress').length, color: '#3B82F6' },
    { name: 'Complétés', value: jobs.filter(j => j.status === 'completed').length, color: '#10B981' },
    { name: 'Annulés', value: jobs.filter(j => j.status === 'cancelled').length, color: '#EF4444' }
  ]

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
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clients */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-purple-200 text-sm">Total</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{clients.length}</div>
          <div className="text-purple-200 text-sm">Clients</div>
        </div>

        {/* Active Clients */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-green-200 text-sm">Actifs</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {clients.filter(c => c.status === 'active').length}
          </div>
          <div className="text-green-200 text-sm">Clients actifs</div>
        </div>

        {/* Total Jobs */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-blue-200 text-sm">Total</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{jobs.length}</div>
          <div className="text-blue-200 text-sm">Jobs</div>
        </div>

        {/* Completed Jobs */}
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl p-6 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-cyan-200 text-sm">Complétés</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {jobs.filter(j => j.status === 'completed').length}
          </div>
          <div className="text-cyan-200 text-sm">Jobs terminés</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients by Sector */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Clients par Secteur</h2>
          {clientsBySector.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientsBySector}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clientsBySector.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Aucune donnée
            </div>
          )}
        </div>

        {/* Clients by Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Statut des Clients</h2>
          {clientsByStatus.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientsByStatus}>
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {clientsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jobs by Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Jobs par Statut</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobsByStatus.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {jobsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Statistiques Rapides</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-gray-300">Jobs complétés</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {jobs.filter(j => j.status === 'completed').length}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-gray-300">Jobs en cours</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {jobs.filter(j => j.status === 'in_progress').length}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-300">Jobs en attente</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {jobs.filter(j => j.status === 'pending').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Clients */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Clients Récents</h2>
        <div className="space-y-3">
          {clients.slice(0, 5).map((client) => (
            <div key={client.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium">{client.name}</div>
                  <div className="text-sm text-gray-400">{client.email || 'Pas d&apos;email'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {client.sector && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: client.sector.color + '20',
                    color: client.sector.color
                  }}>
                    {client.sector.name}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  client.status === 'prospect' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {client.status === 'active' ? 'Actif' : client.status === 'prospect' ? 'Prospect' : 'Inactif'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
