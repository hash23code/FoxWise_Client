'use client'

import { Plus, Mail, Phone } from 'lucide-react'

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Employés</h1>
          <p className="text-gray-400 mt-1">Gérez votre équipe</p>
        </div>
        <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouvel Employé
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Gestion d'Équipe</h2>
          <p className="text-gray-400 mb-6">
            Ajoutez et gérez vos employés pour leur assigner des jobs
          </p>
          <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all">
            Ajouter votre premier employé
          </button>
        </div>
      </div>
    </div>
  )
}
