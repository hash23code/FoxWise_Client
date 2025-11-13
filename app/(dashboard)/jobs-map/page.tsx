'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Plus, MapPin, Users, X, Search, Filter, AlertCircle } from 'lucide-react'
import type { Job, Client, Employee, EmployeeLocation } from '@/types'

// Import Map3D dynamically to avoid SSR issues
const Map3D = dynamic(() => import('@/components/Map3D'), { ssr: false })

export default function JobsMapPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeLocations, setEmployeeLocations] = useState<EmployeeLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [mapboxApiKey, setMapboxApiKey] = useState('')

  // Form state for creating/editing job
  const [formData, setFormData] = useState<{
    title: string
    description: string
    client_id: string
    assigned_to: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    is_urgent: boolean
    scheduled_date: string
    address: string
  }>({
    title: '',
    description: '',
    client_id: '',
    assigned_to: '',
    priority: 'medium',
    is_urgent: false,
    scheduled_date: '',
    address: ''
  })

  useEffect(() => {
    // Get Mapbox API key from environment
    const apiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || ''
    setMapboxApiKey(apiKey)

    fetchData()

    // Poll for employee locations every 10 seconds
    const interval = setInterval(fetchEmployeeLocations, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [jobsRes, clientsRes, employeesRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/clients'),
        fetch('/api/employees')
      ])

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData)
      }
      if (clientsRes.ok) setClients(await clientsRes.json())
      if (employeesRes.ok) setEmployees(await employeesRes.json())

      await fetchEmployeeLocations()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeLocations = async () => {
    try {
      const res = await fetch('/api/geolocation')
      if (res.ok) {
        const data = await res.json()
        setEmployeeLocations(data)
      }
    } catch (error) {
      console.error('Error fetching employee locations:', error)
    }
  }

  const handleOpenModal = (job?: Job) => {
    if (job) {
      setSelectedJob(job)
      const client = clients.find(c => c.id === job.client_id)
      setFormData({
        title: job.title,
        description: job.description || '',
        client_id: job.client_id || '',
        assigned_to: job.assigned_to || '',
        priority: job.priority,
        is_urgent: job.is_urgent || false,
        scheduled_date: job.scheduled_date ? new Date(job.scheduled_date).toISOString().split('T')[0] : '',
        address: client?.address || ''
      })
    } else {
      setSelectedJob(null)
      setFormData({
        title: '',
        description: '',
        client_id: '',
        assigned_to: '',
        priority: 'medium',
        is_urgent: false,
        scheduled_date: '',
        address: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedJob(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // First, geocode the address
      let latitude = null
      let longitude = null

      if (formData.address) {
        const geocodeRes = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: formData.address })
        })

        if (geocodeRes.ok) {
          const geocodeData = await geocodeRes.json()
          latitude = geocodeData.latitude
          longitude = geocodeData.longitude
        }
      } else if (formData.client_id) {
        // Use client's location if no address provided
        const client = clients.find(c => c.id === formData.client_id)
        if (client?.latitude && client?.longitude) {
          latitude = client.latitude
          longitude = client.longitude
        } else if (client?.address) {
          // Geocode client address
          const clientAddress = `${client.address}, ${client.city || ''} ${client.postal_code || ''}`
          const geocodeRes = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: clientAddress })
          })

          if (geocodeRes.ok) {
            const geocodeData = await geocodeRes.json()
            latitude = geocodeData.latitude
            longitude = geocodeData.longitude

            // Update client with coordinates
            await fetch(`/api/clients?id=${client.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                latitude,
                longitude,
                formatted_address: geocodeData.formatted_address
              })
            })
          }
        }
      }

      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        client_id: formData.client_id || null,
        assigned_to: formData.assigned_to || null,
        priority: formData.priority,
        is_urgent: formData.is_urgent,
        location_status: formData.assigned_to ? 'assigned' : 'pending',
        status: 'pending',
        scheduled_date: formData.scheduled_date || null,
        latitude,
        longitude
      }

      const url = selectedJob ? `/api/jobs?id=${selectedJob.id}` : '/api/jobs'
      const method = selectedJob ? 'PUT' : 'POST'

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
        alert('Erreur: ' + (error.details || error.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Error saving job:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleJobClick = (job: Job) => {
    handleOpenModal(job)
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

  const getJobColor = (job: Job): string => {
    if (job.is_urgent) return '#EF4444'
    if (job.location_status === 'completed' || job.location_status === 'arrived') return '#10B981'
    return '#F97316'
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || job.location_status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Chargement de la carte...</div>
      </div>
    )
  }

  if (!mapboxApiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Clé API Mapbox manquante</h2>
          <p className="text-gray-300">
            Veuillez ajouter votre clé API Mapbox dans le fichier <code className="bg-black/50 px-2 py-1 rounded">.env.local</code>
          </p>
          <pre className="bg-black/50 p-3 rounded mt-3 text-sm text-gray-300">
            NEXT_PUBLIC_MAPBOX_API_KEY=votre_cle_ici
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Carte des Jobs</h1>
          <p className="text-gray-400 mt-1">
            {filteredJobs.length} job{filteredJobs.length > 1 ? 's' : ''} • {employeeLocations.length} employé{employeeLocations.length > 1 ? 's' : ''} en ligne
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nouveau Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="assigned">Assigné</option>
          <option value="en_route">En route</option>
          <option value="arrived">Arrivé</option>
          <option value="completed">Complété</option>
        </select>
      </div>

      {/* Map */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden" style={{ minHeight: '600px' }}>
        <Map3D
          jobs={filteredJobs}
          employeeLocations={employeeLocations}
          onJobClick={handleJobClick}
          weatherEffect="clear"
          apiKey={mapboxApiKey}
        />
      </div>

      {/* Legend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-gray-300 text-sm">Assigné / En route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-gray-300 text-sm">Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-gray-300 text-sm">Arrivé / Complété</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span className="text-gray-300 text-sm">Employé</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedJob ? 'Modifier le Job' : 'Nouveau Job'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assigner à
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Aucun</option>
                    {employees.filter(e => e.role === 'employee').map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name || employee.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  placeholder="123 Rue Example, Montréal, QC H1A 1A1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_urgent"
                  checked={formData.is_urgent}
                  onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                  className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-700 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_urgent" className="text-sm font-medium text-gray-300">
                  Marquer comme URGENT (apparaîtra en rouge sur la carte)
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all"
                >
                  {selectedJob ? 'Mettre à jour' : 'Créer le Job'}
                </button>
                {selectedJob && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedJob.id)}
                    className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
                  >
                    Supprimer
                  </button>
                )}
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
