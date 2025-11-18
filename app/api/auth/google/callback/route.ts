// @ts-nocheck
import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { getCompanyContext } from '@/lib/company-context'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/auth/google/callback
 * Callback OAuth Google - échange le code contre des tokens
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId from state
    const error = searchParams.get('error')

    if (error) {
      // L'utilisateur a refusé l'autorisation
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_cancelled`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_invalid`
      )
    }

    const userId = state

    // Récupérer le company_id de l'utilisateur
    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=user_not_found`
      )
    }

    // Configuration OAuth
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    )

    // Échanger le code contre des tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    if (!tokens.refresh_token) {
      // Si pas de refresh_token, c'est probablement parce que l'utilisateur a déjà autorisé
      // On devrait demander à nouveau avec prompt=consent
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_refresh_token`
      )
    }

    // Récupérer les infos du profil Google pour obtenir l'email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    const userEmail = userInfo.data.email
    const userName = userInfo.data.name || ''

    // Calculer l'expiration de l'access token (généralement 1 heure)
    const tokenExpiry = new Date()
    if (tokens.expiry_date) {
      tokenExpiry.setTime(tokens.expiry_date)
    } else {
      tokenExpiry.setHours(tokenExpiry.getHours() + 1)
    }

    // Sauvegarder les tokens OAuth dans Supabase (chiffrés!)
    const { data, error: saveError } = await supabase.rpc('fc_save_oauth_credential', {
      p_company_id: context.companyId,
      p_provider: 'gmail_oauth',
      p_from_email: userEmail!,
      p_from_name: userName,
      p_refresh_token: tokens.refresh_token,
      p_access_token: tokens.access_token!,
      p_token_expiry: tokenExpiry.toISOString(),
      p_scope: tokens.scope!
    })

    if (saveError) {
      console.error('Error saving OAuth credentials:', saveError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=save_failed`
      )
    }

    // Rediriger vers Settings avec succès
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?oauth_success=true`
    )

  } catch (error: any) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent(error.message)}`
    )
  }
}
