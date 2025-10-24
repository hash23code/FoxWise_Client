'use client'

import { useEffect, useState } from 'react'
import { Plus, Building2 } from 'lucide-react'
import type { Sector } from '@/types'

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sectors')
      .then(res => res.json())
      .then(data => {
        setSectors(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-white text-xl">Chargement...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Secteurs</h1>
          <p className="text-gray-400 mt-1">Organisez vos clients par secteur d'activité</p>
        </div>
        <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouveau Secteur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectors.map((sector) => (
          <div
            key={sector.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all"
            style={{ borderColor: sector.color + '50' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: sector.color + '30' }}
              >
                <Building2 className="w-6 h-6" style={{ color: sector.color }} />
              </div>
              <h3 className="text-lg font-semibold text-white">{sector.name}</h3>
            </div>
            {sector.description && (
              <p className="text-gray-400 text-sm">{sector.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
