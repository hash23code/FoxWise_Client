'use client'

import { useEffect, useState } from 'react'
import { Users, Briefcase, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Stats {
  totalClients: number
  activeClients: number
  totalJobs: number
  completedJobs: number
  pendingPayments: number
  totalRevenue: number
  pendingRevenue: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Clients Totaux',
      value: stats?.totalClients || 0,
      subtext: `${stats?.activeClients || 0} actifs`,
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Jobs',
      value: stats?.totalJobs || 0,
      subtext: `${stats?.completedJobs || 0} complétés`,
      icon: Briefcase,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Paiements en Attente',
      value: stats?.pendingPayments || 0,
      subtext: `${stats?.pendingRevenue || 0}$ en attente`,
      icon: Clock,
      color: 'from-orange-500 to-red-600'
    },
    {
      name: 'Revenu Total',
      value: `${stats?.totalRevenue || 0}$`,
      subtext: 'Ce mois',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600'
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Tableau de Bord
        </h1>
        <p className="text-gray-400">
          Vue d'ensemble de votre activité
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.name}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.color} p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{card.name}</p>
                <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                <p className="mt-1 text-xs text-white/70">{card.subtext}</p>
              </div>
              <card.icon className="h-12 w-12 text-white/30" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Actions Rapides</h2>
          <div className="space-y-3">
            <a href="/dashboard/clients" className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-orange-500" />
                <span className="text-white font-medium">Ajouter un Client</span>
              </div>
            </a>
            <a href="/dashboard/jobs" className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-green-500" />
                <span className="text-white font-medium">Créer un Job</span>
              </div>
            </a>
            <a href="/dashboard/calendar" className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span className="text-white font-medium">Voir le Calendrier</span>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Activité Récente</h2>
          <div className="space-y-3 text-gray-400">
            <p className="text-sm">Aucune activité récente</p>
            <p className="text-xs">Les dernières actions s'afficheront ici</p>
          </div>
        </div>
      </div>
    </div>
  )
}
