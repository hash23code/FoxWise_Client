'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Calendar, DollarSign, User, X, Edit, Trash2, Clock, Briefcase } from 'lucide-react'
import type { Job, Client, Activity, Employee } from '@/types'

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    client_id: string
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    scheduled_date: string
    estimated_hours: string
    estimated_cost: string
    notes: string
    assigned_to: string
  }>({
    title: '',
    description: '',
    client_id: '',
    status: 'pending',
    priority: 'medium',
    scheduled_date: '',
    estimated_hours: '',
    estimated_cost: '',
    notes: '',
    assigned_to: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [jobsRes, clientsRes, activitiesRes, employeesRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/clients'),
        fetch('/api/activities'),
        fetch('/api/employees')
      ])

      if (jobsRes.ok) setJobs(await jobsRes.json())
      if (clientsRes.ok) setClients(await clientsRes.json())
      if (activitiesRes.ok) setActivities(await activitiesRes.json())
      if (employeesRes.ok) setEmployees(await employeesRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || job.priority === selectedPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleOpenModal = (job?: Job) => {
    if (job) {
      setEditingJob(job)
      setFormData({
        title: job.title,
        description: job.description || '',
        client_id: job.client_id || '',
        status: job.status,
        priority: job.priority,
        scheduled_date: job.scheduled_date ? new Date(job.scheduled_date).toISOString().split('T')[0] : '',
        estimated_hours: job.estimated_hours?.toString() || '',
        estimated_cost: job.estimated_cost?.toString() || '',
        notes: job.notes || '',
        assigned_to: job.assigned_to || ''
      })
    } else {
      setEditingJob(null)
      setFormData({
        title: '',
        description: '',
        client_id: '',
        status: 'pending',
        priority: 'medium',
        scheduled_date: '',
        estimated_hours: '',
        estimated_cost: '',
        notes: '',
        assigned_to: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingJob(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        client_id: formData.client_id || null,
        assigned_to: formData.assigned_to || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        notes: formData.notes || null
      }

      // Only add scheduled_date if it's provided
      if (formData.scheduled_date) {
        payload.scheduled_date = formData.scheduled_date
      }

      console.log('Submitting job payload:', payload)

      const url = editingJob ? `/api/jobs?id=${editingJob.id}` : '/api/jobs'
      const method = editingJob ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        await fetchData()
        handleCloseModal()
      } else {
        const error = await res.json()
        console.error('Server error:', error)
        alert('Erreur: ' + (error.details || error.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Error saving job:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce job?')) return

    try {
      const res = await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id))
      }
    } catch (error) {
      console.error('Error deleting job:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-500/20 text-gray-400'
      case 'medium': return 'bg-blue-500/20 text-blue-400'
      case 'high': return 'bg-orange-500/20 text-orange-400'
      case 'urgent': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Complété',
      cancelled: 'Annulé'
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      urgent: 'Urgente'
    }
    return labels[priority] || priority
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-white text-xl">Chargement...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Jobs</h1>
          <p className="text-gray-400 mt-1">{filteredJobs.length} job{filteredJobs.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nouveau Job
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Complété</option>
          <option value="cancelled">Annulé</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Toutes les priorités</option>
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
          <option value="urgent">Urgente</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{job.title}</h3>
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                    {getPriorityLabel(job.priority)}
                  </span>
                </div>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(job)}
                  className="p-2 text-gray-400 hover:text-orange-400 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {job.description && (
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{job.description}</p>
            )}

            <div className="space-y-2 text-sm">
              {job.client && (
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{job.client.name}</span>
                </div>
              )}
              {job.activity && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Briefcase className="w-4 h-4" />
                  <span>{job.activity.name}</span>
                </div>
              )}
              {job.scheduled_date && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(job.scheduled_date).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {job.estimated_cost && (
                <div className="flex items-center gap-2 text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{job.estimated_cost}$</span>
                  {job.payment_status === 'unpaid' && (
                    <span className="text-red-400 text-xs">(Non payé)</span>
                  )}
                </div>
              )}
              {job.estimated_hours && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{job.estimated_hours}h estimées</span>
                </div>
              )}
            </div>

            {job.assigned_to && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-semibold">
                    {employees.find(e => e.id === job.assigned_to)?.full_name?.charAt(0).toUpperCase() || 'E'}
                  </div>
                  <span className="text-gray-300 text-sm">
                    Assigné à {employees.find(e => e.id === job.assigned_to)?.full_name || 'un employé'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {jobs.length === 0 ? 'Aucun Job' : 'Aucun Résultat'}
          </h2>
          <p className="text-gray-400 mb-6">
            {jobs.length === 0
              ? 'Commencez par créer votre premier job'
              : 'Essayez de modifier vos filtres de recherche'}
          </p>
          {jobs.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all"
            >
              Créer votre premier job
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingJob ? 'Modifier le Job' : 'Nouveau Job'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Déneigement résidentiel"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  placeholder="Détails du job..."
                />
              </div>

              {/* Client & Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="pending">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Complété</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priorité
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Date & Estimated Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date prévue
                  </label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Heures estimées
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    placeholder="Ex: 2.5"
                  />
                </div>
              </div>

              {/* Estimated Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Coût estimé ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  placeholder="Ex: 150.00"
                />
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assigner à un employé
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Aucun (non assigné)</option>
                  {employees.filter(e => e.role === 'employee').map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name || employee.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  placeholder="Notes additionnelles..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all"
                >
                  {editingJob ? 'Mettre à jour' : 'Créer le Job'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
