'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, List as ListIcon, Table as TableIcon, FileDown, Edit, Trash2, MapPin, Mail, Phone, Building2, Clock } from 'lucide-react'
import type { Client, Sector, ViewMode } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('name')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [clientsRes, sectorsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/sectors')
      ])

      if (clientsRes.ok && sectorsRes.ok) {
        const clientsData = await clientsRes.json()
        const sectorsData = await sectorsRes.json()
        setClients(clientsData)
        setSectors(sectorsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client?')) return

    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setClients(clients.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const exportToPDF = () => {
    // TODO: Implement PDF export with jspdf
    alert('Export PDF: À implémenter avec jspdf')
  }

  // Filter and sort clients
  const filteredClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.city?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSector = selectedSector === 'all' || client.sector_id === selectedSector
      const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus
      return matchesSearch && matchesSector && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-gray-400 mt-1">{filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null)
            setShowAddModal(true)
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Client
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tous les secteurs</option>
            {sectors.map(sector => (
              <option key={sector.id} value={sector.id}>{sector.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="prospect">Prospect</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'created_at')}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="name">Nom (A-Z)</option>
            <option value="created_at">Plus récent</option>
          </select>
        </div>

        {/* View Mode and Export */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Clients List/Table */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{client.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      client.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'Prospect'}
                    </span>
                    {client.sector && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                        {client.sector.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingClient(client)
                      setShowAddModal(true)
                    }}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{client.city}</span>
                  </div>
                )}
                {client.created_at && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs pt-2">
                    <Clock className="w-3 h-3" />
                    <span>Ajouté le {new Date(client.created_at).toLocaleDateString('fr-CA')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Nom</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Téléphone</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Ville</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Secteur</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Statut</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{client.name}</td>
                    <td className="px-6 py-4 text-gray-400">{client.email || '-'}</td>
                    <td className="px-6 py-4 text-gray-400">{client.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-400">{client.city || '-'}</td>
                    <td className="px-6 py-4">
                      {client.sector ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                          {client.sector.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        client.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'Prospect'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingClient(client)
                            setShowAddModal(true)
                          }}
                          className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {clients.length === 0 ? 'Aucun Client' : 'Aucun Résultat'}
          </h2>
          <p className="text-gray-400 mb-6">
            {clients.length === 0
              ? 'Commencez par ajouter votre premier client'
              : 'Essayez de modifier vos filtres de recherche'}
          </p>
          {clients.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Ajouter votre premier client
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal - Simple version for now */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
            </h2>
            <p className="text-gray-400">Modal complet à implémenter - Utilisez l&apos;API /api/clients</p>
            <button
              onClick={() => {
                setShowAddModal(false)
                setEditingClient(null)
              }}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
