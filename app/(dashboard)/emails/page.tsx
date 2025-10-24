'use client'

import { Mail } from 'lucide-react'

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Emails</h1>
        <p className="text-gray-400 mt-1">Communiquez avec vos clients</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <div className="max-w-md mx-auto">
          <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Système d&apos;Emails</h2>
          <p className="text-gray-400 mb-6">
            Envoyez des emails groupés à vos clients via l&apos;intégration n8n
          </p>
        </div>
      </div>
    </div>
  )
}
