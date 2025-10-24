'use client'

import { DollarSign } from 'lucide-react'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Paiements</h1>
        <p className="text-gray-400 mt-1">Suivez vos revenus et paiements</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <div className="max-w-md mx-auto">
          <DollarSign className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Gestion des Paiements</h2>
          <p className="text-gray-400 mb-6">
            Suivez les paiements clients, générez des factures et analysez vos revenus
          </p>
        </div>
      </div>
    </div>
  )
}
