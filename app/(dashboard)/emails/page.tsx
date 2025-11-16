'use client'

import { useEffect, useState } from 'react'
import { Mail, Send, Users, Sparkles, Loader2, Check, X, Search } from 'lucide-react'
import type { Client } from '@/types'

export default function EmailsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [improvingSubject, setImprovingSubject] = useState(false)
  const [improvingBody, setImprovingBody] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    scheduledAt: ''
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
    setSelectAll(false)
  }

  const handleToggleAll = () => {
    if (selectAll || selectedClients.size === clients.length) {
      setSelectedClients(new Set())
      setSelectAll(false)
    } else {
      setSelectedClients(new Set(clients.map(c => c.id)))
      setSelectAll(true)
    }
  }

  const handleImproveText = async (field: 'subject' | 'body') => {
    const currentText = formData[field]
    if (!currentText.trim()) {
      alert(`Please enter ${field === 'subject' ? 'a subject' : 'email content'} first`)
      return
    }

    if (field === 'subject') {
      setImprovingSubject(true)
    } else {
      setImprovingBody(true)
    }

    try {
      const res = await fetch('/api/ai/improve-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          type: field
        })
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, [field]: data.improved })
      } else {
        const error = await res.json()
        alert('AI improvement failed: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error improving text:', error)
      alert('Error improving text. Please try again.')
    } finally {
      if (field === 'subject') {
        setImprovingSubject(false)
      } else {
        setImprovingBody(false)
      }
    }
  }

  const handleSendCampaign = async () => {
    if (!formData.subject.trim() || !formData.body.trim()) {
      alert('Please enter both subject and email content')
      return
    }

    const recipientIds = selectAll ? 'all' : Array.from(selectedClients)

    if (!selectAll && selectedClients.size === 0) {
      alert('Please select at least one recipient')
      return
    }

    setSending(true)

    try {
      const res = await fetch('/api/emails/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: recipientIds,
          subject: formData.subject,
          body: formData.body,
          scheduledAt: formData.scheduledAt || null
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Campaign queued successfully! Emails will be sent to ${selectAll ? clients.length : selectedClients.size} client(s)`)

        // Reset form
        setFormData({ subject: '', body: '', scheduledAt: '' })
        setSelectedClients(new Set())
        setSelectAll(false)
      } else {
        const error = await res.json()
        alert('Error: ' + (error.error || 'Failed to send campaign'))
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
      alert('Error sending campaign')
    } finally {
      setSending(false)
    }
  }

  const recipientCount = selectAll ? clients.length : selectedClients.size

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Marketing</h1>
          <p className="text-gray-400 mt-1">
            Send batch emails to {recipientCount} selected client{recipientCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleSendCampaign}
          disabled={sending || recipientCount === 0}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {sending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Campaign ({recipientCount})
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Subject Line
              </label>
              <button
                onClick={() => handleImproveText('subject')}
                disabled={improvingSubject || !formData.subject.trim()}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {improvingSubject ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI Improve
              </button>
            </div>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Important Update: Service Schedule Change"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Email Body */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Email Content
              </label>
              <button
                onClick={() => handleImproveText('body')}
                disabled={improvingBody || !formData.body.trim()}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {improvingBody ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI Improve
              </button>
            </div>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Write your email message here. You can use {{client.name}} for personalization."
              rows={12}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 Tip: Use {'{'}{'{'} client.name {'}'}{'}'}for personalized greetings
            </p>
          </div>

          {/* Schedule (Optional) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule Send (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              Leave blank to send immediately
            </p>
          </div>
        </div>

        {/* Recipients Selection */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recipients
              </h3>
              <button
                onClick={handleToggleAll}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  selectAll || selectedClients.size === clients.length
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {selectAll || selectedClients.size === clients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Client List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredClients.map((client) => (
                <label
                  key={client.id}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectAll || selectedClients.has(client.id)
                      ? 'bg-blue-500/10 border border-blue-500/30'
                      : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectAll || selectedClients.has(client.id)}
                    onChange={() => handleToggleClient(client.id)}
                    disabled={selectAll}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer disabled:opacity-50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{client.name}</div>
                    {client.email && (
                      <div className="text-xs text-gray-400 truncate">{client.email}</div>
                    )}
                  </div>
                </label>
              ))}

              {filteredClients.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No clients found</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Total Recipients:</span>
                <span className="font-semibold text-white">{recipientCount}</span>
              </div>
            </div>
          </div>

          {/* AI Assistant Info */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-200 mb-1">AI Writing Assistant</h4>
                <p className="text-sm text-purple-300/80">
                  Click "AI Improve" to enhance your subject line and email content for better engagement and professionalism.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
