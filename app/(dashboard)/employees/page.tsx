'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, X, Mail, Shield, Send, Clock, CheckCircle } from 'lucide-react'
import type { Employee, EmployeeInvitation } from '@/types'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [invitations, setInvitations] = useState<EmployeeInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState<{
    full_name: string
    email: string
    role: 'manager' | 'employee'
  }>({
    full_name: '',
    email: '',
    role: 'employee'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [employeesRes, invitationsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/invitations')
      ])

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data)
      }

      if (invitationsRes.ok) {
        const data = await invitationsRes.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(employee =>
    employee.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        full_name: employee.full_name || '',
        email: employee.email,
        role: employee.role
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        full_name: '',
        email: '',
        role: 'employee'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEmployee(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      if (editingEmployee) {
        // Update existing employee
        const res = await fetch(`/api/employees?id=${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Erreur inconnue')
        }
      } else {
        // Send invitation for new employee
        const res = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Erreur inconnue')
        }

        alert('Invitation envoyée avec succès! L&apos;employé recevra un email pour accepter l&apos;invitation.')
      }

      await fetchData()
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving employee:', error)
      alert('Erreur: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/invitations?id=${invitationId}`, {
        method: 'PUT'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur inconnue')
      }

      alert('Invitation renvoyée avec succès!')
    } catch (error: any) {
      console.error('Error resending invitation:', error)
      alert('Erreur: ' + error.message)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette invitation?')) return

    try {
      const res = await fetch(`/api/invitations?id=${invitationId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur inconnue')
      }

      await fetchData()
    } catch (error: any) {
      console.error('Error canceling invitation:', error)
      alert('Erreur: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé?')) return

    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Employés</h1>
          <p className="text-gray-400 mt-1">
            {employees.length} employé{employees.length > 1 ? 's' : ''}
            {pendingInvitations.length > 0 && ` · ${pendingInvitations.length} invitation${pendingInvitations.length > 1 ? 's' : ''} en attente`}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Inviter un Employé
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Rechercher un employé..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-yellow-200">
              Invitations en attente ({pendingInvitations.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{invitation.full_name || invitation.email}</p>
                    <p className="text-sm text-gray-400">{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      Expire le {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResendInvitation(invitation.id)}
                    className="px-3 py-2 text-sm bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Renvoyer
                  </button>
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="px-3 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold">
                {employee.full_name?.charAt(0).toUpperCase() || employee.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(employee)}
                  className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(employee.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-1">
              {employee.full_name || 'Sans nom'}
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  employee.role === 'manager'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {employee.role === 'manager' ? 'Gestionnaire' : 'Employé'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {employees.length === 0 ? 'Aucun Employé' : 'Aucun Résultat'}
          </h2>
          <p className="text-gray-400 mb-6">
            {employees.length === 0
              ? 'Commencez par inviter votre premier employé'
              : 'Essayez de modifier votre recherche'}
          </p>
          {employees.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Inviter votre premier employé
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingEmployee ? 'Modifier l&apos;Employé' : 'Inviter un Employé'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!editingEmployee && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-200">
                  📧 Un email d&apos;invitation sera envoyé à cet employé avec un lien pour créer son compte.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Jean Tremblay"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="jean@example.com"
                  disabled={!!editingEmployee}
                />
                {editingEmployee && (
                  <p className="text-xs text-gray-500 mt-1">L&apos;email ne peut pas être modifié</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="employee">Employé</option>
                  <option value="manager">Gestionnaire</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : editingEmployee ? (
                    'Mettre à jour'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer l&apos;invitation
                    </>
                  )}
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
