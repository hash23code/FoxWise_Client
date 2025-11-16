'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Search, Mail, AlertCircle, Check, X, FileText, Send, Filter } from 'lucide-react'
import type { Client } from '@/types'

interface ClientWithPayments extends Client {
  total_jobs: number
  total_revenue: number
  paid_amount: number
  pending_amount: number
  payment_status: 'paid' | 'partial' | 'unpaid'
}

type FilterStatus = 'all' | 'paid' | 'partial' | 'unpaid'

export default function PaymentsPage() {
  const [clients, setClients] = useState<ClientWithPayments[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)

  useEffect(() => {
    fetchPaymentsData()
  }, [])

  const fetchPaymentsData = async () => {
    try {
      const res = await fetch('/api/payments')
      if (res.ok) {
        const data = await res.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || client.payment_status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleToggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
  }

  const handleToggleAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set())
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)))
    }
  }

  const handleSendInvoice = async () => {
    if (selectedClients.size === 0) {
      alert('Please select at least one client')
      return
    }

    setSendingInvoice(true)
    try {
      const res = await fetch('/api/emails/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: Array.from(selectedClients),
          type: 'invoice'
        })
      })

      if (res.ok) {
        alert(`Invoice emails queued for ${selectedClients.size} client(s)`)
        setSelectedClients(new Set())
      } else {
        const error = await res.json()
        alert('Error: ' + (error.error || 'Failed to send invoices'))
      }
    } catch (error) {
      console.error('Error sending invoices:', error)
      alert('Error sending invoices')
    } finally {
      setSendingInvoice(false)
    }
  }

  const handleSendReminder = async () => {
    if (selectedClients.size === 0) {
      alert('Please select at least one client')
      return
    }

    setSendingReminder(true)
    try {
      const res = await fetch('/api/emails/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: Array.from(selectedClients),
          type: 'reminder'
        })
      })

      if (res.ok) {
        alert(`Payment reminder emails queued for ${selectedClients.size} client(s)`)
        setSelectedClients(new Set())
      } else {
        const error = await res.json()
        alert('Error: ' + (error.error || 'Failed to send reminders'))
      }
    } catch (error) {
      console.error('Error sending reminders:', error)
      alert('Error sending reminders')
    } finally {
      setSendingReminder(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'partial':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'unpaid':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="w-4 h-4" />
      case 'partial':
        return <AlertCircle className="w-4 h-4" />
      case 'unpaid':
        return <X className="w-4 h-4" />
      default:
        return null
    }
  }

  const totalRevenue = clients.reduce((sum, c) => sum + c.total_revenue, 0)
  const totalPaid = clients.reduce((sum, c) => sum + c.paid_amount, 0)
  const totalPending = clients.reduce((sum, c) => sum + c.pending_amount, 0)

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
          <h1 className="text-3xl font-bold text-white">Paiements</h1>
          <p className="text-gray-400 mt-1">
            {clients.length} client{clients.length > 1 ? 's' : ''} · ${totalRevenue.toFixed(2)} revenus totaux
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSendInvoice}
            disabled={selectedClients.size === 0 || sendingInvoice}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            {sendingInvoice ? 'Sending...' : `Send Invoice${selectedClients.size > 0 ? ` (${selectedClients.size})` : ''}`}
          </button>
          <button
            onClick={handleSendReminder}
            disabled={selectedClients.size === 0 || sendingReminder}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {sendingReminder ? 'Sending...' : `Send Reminder${selectedClients.size > 0 ? ` (${selectedClients.size})` : ''}`}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs font-medium text-green-400 uppercase">Paid</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">${totalPaid.toFixed(2)}</div>
          <p className="text-sm text-gray-400">Total received</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-xs font-medium text-yellow-400 uppercase">Pending</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">${totalPending.toFixed(2)}</div>
          <p className="text-sm text-gray-400">Awaiting payment</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs font-medium text-blue-400 uppercase">Total</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">${totalRevenue.toFixed(2)}</div>
          <p className="text-sm text-gray-400">All time revenue</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilterStatus('partial')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'partial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            Partial
          </button>
          <button
            onClick={() => setFilterStatus('unpaid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'unpaid' ? 'bg-red-500/20 text-red-400' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            Unpaid
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                  onChange={handleToggleAll}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-gray-900 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Client</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Jobs</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Total Revenue</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Paid</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Pending</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredClients.map((client) => (
              <tr
                key={client.id}
                className={`hover:bg-gray-800/50 transition-colors cursor-pointer ${
                  selectedClients.has(client.id) ? 'bg-green-500/5' : ''
                }`}
                onClick={() => handleToggleClient(client.id)}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.has(client.id)}
                    onChange={() => handleToggleClient(client.id)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-gray-900 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-white">{client.name}</div>
                    {client.email && (
                      <div className="text-sm text-gray-400">{client.email}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">{client.total_jobs}</td>
                <td className="px-6 py-4 font-semibold text-white">${client.total_revenue.toFixed(2)}</td>
                <td className="px-6 py-4 text-green-400">${client.paid_amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-yellow-400">${client.pending_amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(client.payment_status)}`}>
                    {getPaymentStatusIcon(client.payment_status)}
                    {client.payment_status.charAt(0).toUpperCase() + client.payment_status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No clients found</h3>
            <p className="text-gray-400">
              {clients.length === 0 ? 'No payment data available yet' : 'Try adjusting your search or filter'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
