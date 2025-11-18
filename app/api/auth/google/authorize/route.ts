// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { google } from 'googleapis'

/**
 * GET /api/auth/google/authorize
 * Initie le flow OAuth Google pour configurer l'email
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Configuration OAuth Google
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    )

    // Scopes requis pour envoyer des emails
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send', // Envoyer des emails
      'https://www.googleapis.com/auth/userinfo.email', // Récupérer l'email de l'utilisateur
      'https://www.googleapis.com/auth/userinfo.profile', // Récupérer le profil
    ]

    // Générer l'URL d'autorisation
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Pour obtenir un refresh token
      scope: scopes,
      prompt: 'consent', // Force le consentement pour obtenir le refresh token
      state: userId, // Passer le userId pour le récupérer au callback
    })

    return NextResponse.json({ authUrl })
  } catch (error: any) {
    console.error('Google OAuth authorize error:', error)
    return NextResponse.json({
      error: 'Failed to generate authorization URL',
      details: error.message
    }, { status: 500 })
  }
}
