'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Search, Plus, Calendar, DollarSign, User, X, Edit, Trash2, Clock, Briefcase, MapPin, Filter } from 'lucide-react'
import type { Job, Client, Activity, Employee, EmployeeLocation } from '@/types'

export default function JobsPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const jobMarkers = useRef<mapboxgl.Marker[]>([])
  const employeeMarkers = useRef<mapboxgl.Marker[]>([])

  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeLocations, setEmployeeLocations] = useState<EmployeeLocation[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [selectedActivity, setSelectedActivity] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')

  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    client_id: string
    activity_id: string
    address: string
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
    activity_id: '',
    address: '',
    status: 'pending',
    priority: 'medium',
    scheduled_date: '',
    estimated_hours: '',
    estimated_cost: '',
    notes: '',
    assigned_to: ''
  })

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Poll jobs every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Poll employee locations every 10 seconds
  useEffect(() => {
    fetchEmployeeLocations()
    const interval = setInterval(() => {
      fetchEmployeeLocations()
    }, 10000)

    return () => clearInterval(interval)
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

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        setJobs(await res.json())
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchEmployeeLocations = async () => {
    try {
      const res = await fetch('/api/geolocation')
      if (res.ok) {
        setEmployeeLocations(await res.json())
      }
    } catch (error) {
      console.error('Error fetching employee locations:', error)
    }
  }

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const apiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
    if (!apiKey) {
      console.error('No Mapbox API key')
      return
    }

    mapboxgl.accessToken = apiKey

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-73.5673, 45.5017], // Montreal
      zoom: 11,
      pitch: 0,
      bearing: 0
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  // Update job markers on map
  useEffect(() => {
    if (!map.current || jobs.length === 0) return

    // Clear existing markers
    jobMarkers.current.forEach(marker => marker.remove())
    jobMarkers.current = []

    // Add marker for each job with coordinates
    jobs.forEach(job => {
      if (!job.latitude || !job.longitude) return

      // Color based on status and urgency (matching navigation page)
      const getColor = () => {
        if (job.status === 'completed') return '#10b981' // green
        if (job.status === 'in_progress') return '#a855f7' // purple
        if (job.priority === 'urgent') return '#ef4444' // red
        return '#eab308' // yellow - pending
      }

      const color = getColor()

      // Create marker element
      const el = document.createElement('div')
      el.className = 'job-marker'
      el.style.cssText = `
        width: 40px;
        height: 40px;
        cursor: pointer;
        filter: drop-shadow(0 0 8px ${color});
      `

      el.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2.5"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="18" font-weight="bold">📍</text>
        </svg>
      `

      // Click handler to edit job
      el.addEventListener('click', () => {
        handleOpenModal(job)
        // Center map on job
        if (map.current) {
          map.current.flyTo({
            center: [job.longitude!, job.latitude!],
            zoom: 15,
            duration: 1000
          })
        }
      })

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([job.longitude, job.latitude])
        .addTo(map.current!)

      jobMarkers.current.push(marker)
    })
  }, [jobs])

  // Update employee markers on map
  useEffect(() => {
    if (!map.current) return

    // Clear existing employee markers
    employeeMarkers.current.forEach(marker => marker.remove())
    employeeMarkers.current = []

    // Add marker for each employee with location
    employeeLocations.forEach(location => {
      if (!location.latitude || !location.longitude) return

      const employee = employees.find(e => e.id === location.user_id)
      const employeeName = employee?.full_name || employee?.email || 'Employé'
      const initials = employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

      // Create marker element for employee
      const el = document.createElement('div')
      el.className = 'employee-marker'
      el.style.cssText = `
        width: 50px;
        height: 50px;
        cursor: pointer;
        filter: drop-shadow(0 0 10px #a855f7);
      `

      el.innerHTML = `
        <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="22" fill="#a855f7" stroke="white" stroke-width="3"/>
          <circle cx="25" cy="18" r="8" fill="white"/>
          <path d="M 13 35 Q 13 28 25 28 Q 37 28 37 35 L 37 40 Q 37 45 25 45 Q 13 45 13 40 Z" fill="white"/>
        </svg>
      `

      // Add popup with employee info
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="color: white; background: #1f2937; padding: 8px; border-radius: 4px;">
          <strong>${employeeName}</strong><br/>
          <span style="font-size: 12px; color: #9ca3af;">
            Dernière mise à jour: ${new Date(location.updated_at).toLocaleTimeString('fr-FR')}
          </span>
        </div>
      `)

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current!)

      employeeMarkers.current.push(marker)
    })
  }, [employeeLocations, employees])

  // Get unique sectors from clients
  const sectors = Array.from(new Set(clients.map(c => c.sector?.name).filter(Boolean))) as string[]

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSector = selectedSector === 'all' || job.client?.sector?.name === selectedSector
    const matchesActivity = selectedActivity === 'all' || job.activity_id === selectedActivity
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    const matchesEmployee = selectedEmployee === 'all' ||
                           (selectedEmployee === 'unassigned' ? !job.assigned_to : job.assigned_to === selectedEmployee)

    return matchesSearch && matchesSector && matchesActivity && matchesStatus && matchesEmployee
  })

  // Split into two sections
  const assignedJobs = filteredJobs.filter(job => job.assigned_to)
  const unassignedJobs = filteredJobs.filter(job => !job.assigned_to)

  const handleOpenModal = (job?: Job) => {
    if (job) {
      setEditingJob(job)
      // Get address from job's client
      const jobAddress = job.client?.formatted_address ||
                        `${job.client?.address || ''} ${job.client?.city || ''} ${job.client?.postal_code || ''}`.trim()

      setFormData({
        title: job.title,
        description: job.description || '',
        client_id: job.client_id || '',
        activity_id: job.activity_id || '',
        address: jobAddress,
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
        activity_id: '',
        address: '',
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

  // Auto-fill address when client is selected
  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, client_id: clientId })

    if (clientId) {
      const client = clients.find(c => c.id === clientId)
      if (client) {
        const address = client.formatted_address ||
                       `${client.address || ''} ${client.city || ''} ${client.postal_code || ''}`.trim()
        setFormData(prev => ({ ...prev, client_id: clientId, address }))
      }
    } else {
      setFormData(prev => ({ ...prev, address: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // First, geocode the address if provided
      let latitude = editingJob?.latitude || null
      let longitude = editingJob?.longitude || null

      if (formData.address && formData.address !== '') {
        try {
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
        } catch (error) {
          console.error('Geocoding error:', error)
        }
      }

      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        client_id: formData.client_id || null,
        activity_id: formData.activity_id || null,
        assigned_to: formData.assigned_to || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        notes: formData.notes || null,
        latitude,
        longitude
      }

      if (formData.scheduled_date) {
        payload.scheduled_date = formData.scheduled_date
      }

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
      case 'in_progress': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tous les secteurs</option>
          {sectors.map(sector => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>

        <select
          value={selectedActivity}
          onChange={(e) => setSelectedActivity(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Toutes les activités</option>
          {activities.map(activity => (
            <option key={activity.id} value={activity.id}>{activity.name}</option>
          ))}
        </select>

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
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tous les employés</option>
          <option value="unassigned">Non assignés</option>
          {employees.filter(e => e.role === 'employee').map(employee => (
            <option key={employee.id} value={employee.id}>{employee.full_name || employee.email}</option>
          ))}
        </select>
      </div>

      {/* Map - Full Width at Top */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
        <div ref={mapContainer} className="w-full h-[600px]" />
      </div>

      {/* Jobs Lists - Side by Side */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Jobs Assignés - Left */}
        <div className="flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            Jobs Assignés ({assignedJobs.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {assignedJobs.length > 0 ? (
              assignedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  employees={employees}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  getStatusLabel={getStatusLabel}
                  getPriorityLabel={getPriorityLabel}
                />
              ))
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-gray-400">Aucun job assigné</p>
              </div>
            )}
          </div>
        </div>

        {/* Jobs à Assigner - Right */}
        <div className="flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-yellow-500" />
            Jobs à Assigner ({unassignedJobs.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {unassignedJobs.length > 0 ? (
              unassignedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  employees={employees}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  getStatusLabel={getStatusLabel}
                  getPriorityLabel={getPriorityLabel}
                />
              ))
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">✓</div>
                <p className="text-gray-400">Tous les jobs sont assignés</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* No Results - Full Width */}
      {filteredJobs.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center mt-6">
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
                    onChange={(e) => handleClientChange(e.target.value)}
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
                    Activité
                  </label>
                  <select
                    value={formData.activity_id}
                    onChange={(e) => setFormData({ ...formData, activity_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Sélectionner une activité</option>
                    {activities.map(activity => (
                      <option key={activity.id} value={activity.id}>{activity.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    placeholder="Adresse complète"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Auto-rempli lors de la sélection d&apos;un client</p>
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

// Job Card Component
function JobCard({
  job,
  employees,
  onEdit,
  onDelete,
  getStatusColor,
  getPriorityColor,
  getStatusLabel,
  getPriorityLabel
}: {
  job: Job
  employees: Employee[]
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
  getStatusLabel: (status: string) => string
  getPriorityLabel: (priority: string) => string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all group">
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
            onClick={() => onEdit(job)}
            className="p-2 text-gray-400 hover:text-orange-400 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(job.id)}
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
          </div>
        )}
        {job.estimated_hours && (
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{job.estimated_hours}h estimées</span>
          </div>
        )}
        {job.latitude && job.longitude && (
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">{job.latitude.toFixed(4)}, {job.longitude.toFixed(4)}</span>
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
  )
}
