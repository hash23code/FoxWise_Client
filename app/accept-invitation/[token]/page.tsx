'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth, useSignUp } from '@clerk/nextjs'
import { Building2, Mail, User, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface InvitationData {
  email: string
  full_name: string | null
  company: {
    id: string
    name: string
  }
  expires_at: string
}

export default function AcceptInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, userId } = useAuth()
  const { signUp } = useSignUp()

  const token = params.token as string

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Verify invitation on mount
  useEffect(() => {
    verifyInvitation()
  }, [token])

  const verifyInvitation = async () => {
    try {
      const res = await fetch(`/api/invitations/accept?token=${token}`)
      const data = await res.json()

      if (!data.valid) {
        setError(data.error || 'Invalid invitation')
        return
      }

      setInvitation(data.invitation)
    } catch (err) {
      console.error('Error verifying invitation:', err)
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!invitation) return

    setAccepting(true)
    setError(null)

    try {
      // If not signed in, redirect to Clerk sign-up with invitation email
      if (!isSignedIn) {
        // Redirect to Clerk sign-up with email pre-filled
        window.location.href = `/sign-up?email=${encodeURIComponent(invitation.email)}&redirect_url=${encodeURIComponent(`/accept-invitation/${token}`)}`
        return
      }

      // User is signed in, accept the invitation
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          clerk_user_id: userId,
          email: invitation.email
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)

      // Redirect to employee dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      setError(err.message || 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-white text-purple-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to {invitation?.company.name}!</h1>
          <p className="text-gray-300 mb-6">Your invitation has been accepted. Redirecting to dashboard...</p>
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🦊</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">You&apos;re Invited!</h1>
          <p className="text-gray-300">Join your team on FoxWise</p>
        </div>

        {invitation && (
          <div className="space-y-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Company</p>
                <p className="text-white font-semibold">{invitation.company.name}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 flex items-start gap-3">
              <Mail className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-semibold">{invitation.email}</p>
              </div>
            </div>

            {invitation.full_name && (
              <div className="bg-white/5 rounded-lg p-4 flex items-start gap-3">
                <User className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white font-semibold">{invitation.full_name}</p>
                </div>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-yellow-200">
                This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleAcceptInvitation}
          disabled={accepting}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {accepting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Accept Invitation
            </>
          )}
        </button>

        <p className="text-center text-gray-400 text-sm mt-4">
          By accepting, you agree to join {invitation?.company.name} as an employee
        </p>
      </div>
    </div>
  )
}
