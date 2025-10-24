import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            🦊 FoxWise Client
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Gestion de clients intelligente pour entreprises de services
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-2">📊 Dashboard Intelligent</h3>
              <p className="text-white/80 text-sm">Statistiques en temps réel</p>
            </div>
            <div className="bg-white/10 p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-2">👥 Gestion Clients</h3>
              <p className="text-white/80 text-sm">Organisation par secteur</p>
            </div>
            <div className="bg-white/10 p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-2">💼 Jobs & Équipe</h3>
              <p className="text-white/80 text-sm">Attribution et suivi</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/sign-in"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all flex items-center gap-2"
            >
              Se Connecter
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/sign-up"
              className="bg-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all backdrop-blur-sm"
            >
              Créer un Compte
            </Link>
          </div>
        </div>

        <p className="text-white/60 text-sm">
          Partie de la suite FoxWise - ToDo, Finance, Client
        </p>
      </div>
    </div>
  );
}
