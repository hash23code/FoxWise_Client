// @ts-nocheck
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface OAuthCredentials {
  refresh_token: string
  access_token: string
  token_expiry: string
  from_email: string
  from_name: string
}

interface EmailData {
  to: string
  subject: string
  body: string
  isHtml?: boolean
}

/**
 * Envoie un email via Gmail API avec OAuth
 */
export async function sendViaGmailAPI(
  companyId: string,
  oauthCreds: OAuthCredentials,
  emailData: EmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Configurer OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    )

    // Vérifier si l'access token est expiré
    const tokenExpiry = new Date(oauthCreds.token_expiry)
    const now = new Date()
    const needsRefresh = tokenExpiry <= now

    if (needsRefresh) {
      console.log('Access token expired, refreshing...')

      // Utiliser le refresh token pour obtenir un nouveau access token
      oauth2Client.setCredentials({
        refresh_token: oauthCreds.refresh_token
      })

      // Refresh automatiquement
      const { credentials } = await oauth2Client.refreshAccessToken()

      // Sauvegarder le nouveau access token dans Supabase
      const newExpiry = new Date()
      if (credentials.expiry_date) {
        newExpiry.setTime(credentials.expiry_date)
      } else {
        newExpiry.setHours(newExpiry.getHours() + 1)
      }

      // Mettre à jour dans Supabase (on pourrait appeler une fonction RPC ici)
      // Pour l'instant on continue avec le nouveau token
      oauth2Client.setCredentials(credentials)
    } else {
      // Access token encore valide
      oauth2Client.setCredentials({
        access_token: oauthCreds.access_token,
        refresh_token: oauthCreds.refresh_token
      })
    }

    // Créer le message email au format RFC 2822
    const emailLines = [
      `From: ${oauthCreds.from_name} <${oauthCreds.from_email}>`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      emailData.isHtml ? 'Content-Type: text/html; charset=utf-8' : 'Content-Type: text/plain; charset=utf-8',
      '',
      emailData.body
    ]

    const email = emailLines.join('\r\n')

    // Encoder en base64url (requis par Gmail API)
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Envoyer via Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    })

    console.log('Email sent via Gmail API:', response.data.id)

    return {
      success: true,
      messageId: response.data.id
    }

  } catch (error: any) {
    console.error('Gmail API send error:', error)

    // Messages d'erreur en français
    let errorMessage = 'Erreur lors de l\'envoi via Gmail API'

    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      errorMessage = 'Token OAuth invalide ou révoqué. Reconnectez votre compte Google.'
    } else if (error.code === 403) {
      errorMessage = 'Permission refusée. Vérifiez les scopes OAuth.'
    } else if (error.code === 429) {
      errorMessage = 'Limite d\'envoi atteinte. Réessayez plus tard.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Envoie plusieurs emails via Gmail API (pour campagnes)
 */
export async function sendBatchViaGmailAPI(
  companyId: string,
  oauthCreds: OAuthCredentials,
  emails: EmailData[]
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  const results = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const emailData of emails) {
    const result = await sendViaGmailAPI(companyId, oauthCreds, emailData)

    if (result.success) {
      results.sent++
    } else {
      results.failed++
      results.errors.push(`${emailData.to}: ${result.error}`)
    }

    // Petit délai entre chaque email pour éviter rate limits
    if (emails.indexOf(emailData) < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100)) // 100ms entre chaque
    }
  }

  results.success = results.failed === 0

  return results
}
