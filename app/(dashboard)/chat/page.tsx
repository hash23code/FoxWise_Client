'use client'

import { MessageSquare } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Chat</h1>
        <p className="text-gray-400 mt-1">Communiquez avec votre équipe</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <div className="max-w-md mx-auto">
          <MessageSquare className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Chat d'Équipe</h2>
          <p className="text-gray-400 mb-6">
            Chat en temps réel pour communiquer avec votre équipe
          </p>
        </div>
      </div>
    </div>
  )
}
