'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Globe, Save, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

const TIMEZONES = [
  { value: 'America/Toronto', label: 'Eastern Time (ET)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Vancouver', label: 'Vancouver (PT)' },
  { value: 'America/Montreal', label: 'Montreal (ET)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
]

const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
]

const EMAIL_PROVIDERS = [
  {
    value: 'gmail',
    name: 'Gmail',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    instructions: 'Activez l\'authentification à 2 facteurs, puis générez un "Mot de passe d\'application" dans Sécurité > Mots de passe des applications.'
  },
  {
    value: 'outlook',
    name: 'Outlook / Hotmail',
    smtp_host: 'smtp-mail.outlook.com',
    smtp_port: 587,
    instructions: 'Utilisez votre email et mot de passe Outlook/Hotmail.'
  },
  {
    value: 'office365',
    name: 'Office 365',
    smtp_host: 'smtp.office365.com',
    smtp_port: 587,
    instructions: 'Utilisez votre email et mot de passe professionnel Office 365.'
  },
  {
    value: 'smtp_custom',
    name: 'Autre (SMTP personnalisé)',
    smtp_host: '',
    smtp_port: 587,
    instructions: 'Contactez votre fournisseur d\'email pour obtenir les paramètres SMTP.'
  }
]

export default function SettingsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [settings, setSettings] = useState({
    language: 'fr',
    timezone: 'America/Toronto',
    theme: 'dark',
    notifications: {
      email: true,
      push: false,
      jobReminders: true,
      clientUpdates: true,
    },
  })

  // États pour la configuration email
  const [emailConfig, setEmailConfig] = useState({
    provider: 'gmail',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
  })
  const [emailConfigLoading, setEmailConfigLoading] = useState(false)
  const [emailConfigSaved, setEmailConfigSaved] = useState(false)
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [emailTestError, setEmailTestError] = useState('')
  const [showEmailPassword, setShowEmailPassword] = useState(false)

  useEffect(() => {
    if (user) {
      loadSettings()
      loadEmailConfig()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(false)
      const response = await fetch('/api/user-settings')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setSettings(prev => ({
            ...prev,
            language: data.language || 'fr',
            timezone: data.timezone || 'America/Toronto',
            theme: data.theme || 'dark',
            notifications: data.notifications || prev.notifications,
          }))
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Charger la configuration email existante
  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/email-config')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setEmailConfig({
            provider: data.provider || 'gmail',
            smtp_host: data.smtp_host || 'smtp.gmail.com',
            smtp_port: data.smtp_port || 587,
            smtp_user: data.smtp_user || '',
            smtp_password: '', // Ne jamais charger le mot de passe pour la sécurité
            from_email: data.from_email || '',
            from_name: data.from_name || '',
          })
          if (data.is_verified) {
            setEmailTestStatus('success')
          }
        }
      }
    } catch (error) {
      console.error('Error loading email config:', error)
    }
  }

  // Sauvegarder la configuration email
  const handleSaveEmailConfig = async () => {
    setEmailConfigLoading(true)
    try {
      const response = await fetch('/api/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      })

      if (response.ok) {
        setEmailConfigSaved(true)
        setTimeout(() => setEmailConfigSaved(false), 2000)
      } else {
        const error = await response.json()
        alert('Erreur: ' + (error.error || 'Impossible de sauvegarder'))
      }
    } catch (error) {
      console.error('Error saving email config:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setEmailConfigLoading(false)
    }
  }

  // Tester la configuration email
  const handleTestEmailConfig = async () => {
    setEmailTestStatus('testing')
    setEmailTestError('')
    try {
      const response = await fetch('/api/email-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setEmailTestStatus('success')
      } else {
        setEmailTestStatus('error')
        setEmailTestError(data.error || 'Test échoué')
      }
    } catch (error) {
      setEmailTestStatus('error')
      setEmailTestError('Erreur de connexion')
    }
  }

  // Quand le provider change, mettre à jour les paramètres SMTP
  const handleProviderChange = (provider: string) => {
    const providerData = EMAIL_PROVIDERS.find(p => p.value === provider)
    if (providerData) {
      setEmailConfig({
        ...emailConfig,
        provider,
        smtp_host: providerData.smtp_host,
        smtp_port: providerData.smtp_port,
      })
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
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 mt-1">Gérez vos préférences et paramètres</p>
      </div>

      {/* Profile Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Profil</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Nom complet</label>
            <input
              type="text"
              value={user?.fullName || user?.firstName || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Géré par votre compte Clerk</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={user?.primaryEmailAddress?.emailAddress || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Géré par votre compte Clerk</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Préférences</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Langue</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Fuseau horaire</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Notifications par email</p>
              <p className="text-sm text-gray-400">Recevoir des notifications par email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Rappels de jobs</p>
              <p className="text-sm text-gray-400">Rappels pour les jobs à venir</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.jobReminders}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, jobReminders: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Mises à jour clients</p>
              <p className="text-sm text-gray-400">Notifications pour les nouveaux clients</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.clientUpdates}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, clientUpdates: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Configuration Email</h2>
            <p className="text-sm text-gray-400">Configurez votre email pour envoyer des factures et campagnes</p>
          </div>
          {emailTestStatus === 'success' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-green-400 font-medium">Configuré</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Fournisseur d&apos;email
            </label>
            <select
              value={emailConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              {EMAIL_PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {EMAIL_PROVIDERS.find(p => p.value === emailConfig.provider)?.instructions}
            </p>
          </div>

          {/* Email and Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Votre email
              </label>
              <input
                type="email"
                value={emailConfig.smtp_user}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtp_user: e.target.value })}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Mot de passe
                {emailConfig.provider === 'gmail' && (
                  <span className="text-yellow-500 ml-1">(Mot de passe d&apos;application)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showEmailPassword ? 'text' : 'password'}
                  value={emailConfig.smtp_password}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showEmailPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>

          {/* From Email and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email d&apos;envoi (optionnel)
              </label>
              <input
                type="email"
                value={emailConfig.from_email}
                onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
                placeholder={emailConfig.smtp_user || 'votre@email.com'}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Laissez vide pour utiliser l&apos;email ci-dessus</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nom de l&apos;expéditeur
              </label>
              <input
                type="text"
                value={emailConfig.from_name}
                onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
                placeholder="Votre Entreprise"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Advanced Settings (if custom SMTP) */}
          {emailConfig.provider === 'smtp_custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Serveur SMTP
                </label>
                <input
                  type="text"
                  value={emailConfig.smtp_host}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                  placeholder="smtp.example.com"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Port SMTP
                </label>
                <input
                  type="number"
                  value={emailConfig.smtp_port}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: parseInt(e.target.value) })}
                  placeholder="587"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* Test Status */}
          {emailTestStatus === 'error' && (
            <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Échec du test</p>
                <p className="text-sm text-red-300 mt-1">{emailTestError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTestEmailConfig}
              disabled={emailTestStatus === 'testing' || !emailConfig.smtp_user || !emailConfig.smtp_password}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              {emailTestStatus === 'testing' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Tester la connexion
                </>
              )}
            </button>

            <button
              onClick={handleSaveEmailConfig}
              disabled={emailConfigLoading || !emailConfig.smtp_user || !emailConfig.smtp_password}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                emailConfigSaved
                  ? 'bg-green-600 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed'
              }`}
            >
              {emailConfigLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {emailConfigSaved ? 'Enregistré !' : 'Sauvegarder'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            isSaved
              ? 'bg-green-600 text-white'
              : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
          }`}
        >
          <Save className="w-5 h-5" />
          {isSaved ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
