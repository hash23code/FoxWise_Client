'use client'

import { Settings as SettingsIcon, User, Bell, Lock } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 mt-1">Configurez votre compte et préférences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">Profil</h3>
          </div>
          <p className="text-gray-400 text-sm">Gérez vos informations personnelles</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          </div>
          <p className="text-gray-400 text-sm">Configurez vos préférences de notifications</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">Sécurité</h3>
          </div>
          <p className="text-gray-400 text-sm">Gérez la sécurité de votre compte</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">Préférences</h3>
          </div>
          <p className="text-gray-400 text-sm">Personnalisez votre expérience</p>
        </div>
      </div>
    </div>
  )
}
