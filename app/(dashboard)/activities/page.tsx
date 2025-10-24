'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'
import type { Activity } from '@/types'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_cost: '',
    color: '#F97316'
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities')
      const data = await res.json()
      setActivities(data)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingActivity ? '/api/activities' : '/api/activities'
      const method = editingActivity ? 'PUT' : 'POST'

      const body = editingActivity
        ? { id: editingActivity.id, ...formData, default_cost: parseFloat(formData.default_cost) || 0 }
        : { ...formData, default_cost: parseFloat(formData.default_cost) || 0 }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        await fetchActivities()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving activity:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité?')) return

    try {
      const res = await fetch(`/api/activities?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchActivities()
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      name: activity.name,
      description: activity.description || '',
      default_cost: activity.default_cost?.toString() || '',
      color: activity.color
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', default_cost: '', color: '#F97316' })
    setEditingActivity(null)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Activités</h1>
          <p className="text-gray-400 mt-1">Gérez les services offerts par votre entreprise</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Activité
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: activity.color + '30' }}
              >
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: activity.color }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(activity)}
                  className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {activity.user_id !== 'system' && (
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{activity.name}</h3>

            {activity.description && (
              <p className="text-gray-400 text-sm mb-4">{activity.description}</p>
            )}

            {activity.default_cost && (
              <div className="flex items-center gap-2 text-cyan-400">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">{activity.default_cost}$</span>
              </div>
            )}

            {activity.user_id === 'system' && (
              <div className="mt-4 text-xs text-gray-500 italic">Par défaut</div>
            )}
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Aucune Activité</h2>
          <p className="text-gray-400 mb-6">
            Commencez par ajouter les services offerts par votre entreprise
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            Ajouter votre première activité
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingActivity ? 'Modifier l\'Activité' : 'Nouvelle Activité'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  required
                  placeholder="Ex: Déneigement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 resize-none"
                  rows={3}
                  placeholder="Description du service..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Coût par Défaut ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.default_cost}
                  onChange={(e) => setFormData({ ...formData, default_cost: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Couleur
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg px-2 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  {editingActivity ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
