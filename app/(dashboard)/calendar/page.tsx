'use client'

import { Calendar as CalendarIcon } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Calendrier</h1>
        <p className="text-gray-400 mt-1">Planifiez vos événements et jobs</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <div className="max-w-md mx-auto">
          <CalendarIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Calendrier Interactif</h2>
          <p className="text-gray-400 mb-6">
            Le calendrier interactif sera disponible bientôt pour planifier tous vos événements et jobs
          </p>
        </div>
      </div>
    </div>
  )
}
