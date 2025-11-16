'use client'

import { useUser } from '@clerk/nextjs'
import { User, Mail, Building2, Shield, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  company_id: string | null
  created_at: string
}

export default function ProfilePage() {
  const { user } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

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
      <div>
        <h1 className="text-3xl font-bold text-white">Mon Profil</h1>
        <p className="text-gray-400 mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-3xl font-bold">
            {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : profile?.full_name || 'Utilisateur'}
            </h2>
            <p className="text-gray-400">{user?.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
            <User className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Nom complet</p>
              <p className="text-white font-medium">
                {profile?.full_name || user?.fullName || 'Non défini'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
            <Mail className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white font-medium">
                {user?.emailAddresses[0]?.emailAddress || profile?.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
            <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Rôle</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  Employé
                </span>
              </div>
            </div>
          </div>

          {profile?.created_at && (
            <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Membre depuis</p>
                <p className="text-white font-medium">
                  {new Date(profile.created_at).toLocaleDateString('fr-CA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Management */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Gestion du compte</h2>
        <p className="text-gray-400 text-sm mb-4">
          Pour modifier vos informations de connexion (email, mot de passe), utilisez le bouton de profil dans la barre latérale.
        </p>
      </div>
    </div>
  )
}
