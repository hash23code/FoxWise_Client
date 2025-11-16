'use client'

import { useEffect, useState } from 'react'
import { Plus, Building2, Trash2, X, Edit } from 'lucide-react'
import type { Sector } from '@/types'

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSector, setEditingSector] = useState<Sector | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    color: string
  }>({
    name: '',
    description: '',
    color: '#8b5cf6'
  })

  useEffect(() => {
    fetchSectors()
  }, [])

  const fetchSectors = async () => {
    try {
      const res = await fetch('/api/sectors')
      if (res.ok) {
        const data = await res.json()
        setSectors(data)
      }
    } catch (error) {
      console.error('Error fetching sectors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (sector?: Sector) => {
    if (sector) {
      setEditingSector(sector)
      setFormData({
        name: sector.name,
        description: sector.description || '',
        color: sector.color
      })
    } else {
      setEditingSector(null)
      setFormData({
        name: '',
        description: '',
        color: '#8b5cf6'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSector(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingSector ? `/api/sectors?id=${editingSector.id}` : '/api/sectors'
      const method = editingSector ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        await fetchSectors()
        handleCloseModal()
      } else {
        const error = await res.json()
        alert('Erreur: ' + (error.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Error saving sector:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce secteur?')) return

    try {
      const res = await fetch(`/api/sectors?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchSectors()
      } else {
        const error = await res.json()
        alert('Erreur lors de la suppression: ' + (error.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Error deleting sector:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-white text-xl">Chargement...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Secteurs</h1>
          <p className="text-gray-400 mt-1">Organisez vos clients par secteur d&apos;activité</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Secteur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectors.map((sector) => (
          <div
            key={sector.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all group"
            style={{ borderColor: sector.color + '50' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: sector.color + '30' }}
                >
                  <Building2 className="w-6 h-6" style={{ color: sector.color }} />
                </div>
                <h3 className="text-lg font-semibold text-white">{sector.name}</h3>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(sector)}
                  className="p-2 text-gray-400 hover:text-orange-400 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(sector.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {sector.description && (
              <p className="text-gray-400 text-sm">{sector.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">
                {editingSector ? 'Modifier le Secteur' : 'Nouveau Secteur'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du secteur *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="ex: Construction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  rows={3}
                  placeholder="Description du secteur..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Couleur
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
                  />
                  <span className="text-gray-400">{formData.color}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all"
                >
                  {editingSector ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
