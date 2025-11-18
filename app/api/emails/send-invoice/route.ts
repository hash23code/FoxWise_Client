// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyContext } from '@/lib/company-context'
import { createClient } from '@supabase/supabase-js'
import { sendBatchViaGmailAPI } from '@/lib/gmail-api'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL_INVOICE

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // Only managers can send invoices/reminders
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can send invoices' }, { status: 403 })
    }

    const body = await request.json()
    const { clientIds, type, customMessage } = body

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Client IDs are required' }, { status: 400 })
    }

    if (!type || !['invoice', 'reminder'].includes(type)) {
      return NextResponse.json({ error: 'Type must be "invoice" or "reminder"' }, { status: 400 })
    }

    // Vérifier la configuration email (OAuth ou SMTP)
    const { data: emailConfig } = await supabase
      .from('fc_email_credentials')
      .select('*')
      .eq('company_id', context.companyId)
      .eq('is_active', true)
      .single()

    if (!emailConfig) {
      return NextResponse.json({
        error: 'Email not configured',
        message: 'Veuillez configurer votre email dans les paramètres avant d\'envoyer des emails.',
        configUrl: '/settings'
      }, { status: 400 })
    }

    // ================================================================
    // BRANCHE 1: OAuth Google → Gmail API Direct! 🚀
    // ================================================================
    if (emailConfig.auth_method === 'oauth') {
      console.log('Using Gmail API (OAuth) for sending emails')

      // Récupérer les credentials OAuth déchiffrés
      const { data: oauthCreds, error: oauthError } = await supabase.rpc('fc_get_oauth_credential', {
        p_company_id: context.companyId
      })

      if (oauthError || !oauthCreds || oauthCreds.length === 0) {
        return NextResponse.json({
          error: 'OAuth credentials not found',
          message: 'Veuillez reconnecter votre compte Google.'
        }, { status: 400 })
      }

      const oauth = oauthCreds[0]

      // Récupérer les clients
      const { data: clients, error: clientsError } = await supabase
        .from('fc_clients')
        .select('*')
        .in('id', clientIds)
        .eq('company_id', context.companyId)

      if (clientsError || !clients) {
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
      }

      // Préparer les emails
      const emails = clients.map(client => {
        const subject = type === 'invoice'
          ? `Facture - ${client.name || 'Client'}`
          : `Rappel de paiement - ${client.name || 'Client'}`

        const body = type === 'invoice'
          ? `Bonjour ${client.name || 'Client'},\n\nVeuillez trouver ci-joint votre facture.\n\n${customMessage ? customMessage + '\n\n' : ''}Merci de votre confiance!\n\n${oauth.from_name || 'Votre équipe'}`
          : `Bonjour ${client.name || 'Client'},\n\nCeci est un rappel amical concernant votre paiement en attente.\n\n${customMessage ? customMessage + '\n\n' : ''}Merci de votre attention!\n\n${oauth.from_name || 'Votre équipe'}`

        return {
          to: client.email,
          subject,
          body,
          isHtml: false
        }
      })

      // Envoyer via Gmail API
      const result = await sendBatchViaGmailAPI(context.companyId, oauth, emails)

      if (result.success) {
        return NextResponse.json({
          success: true,
          method: 'gmail_api',
          sentCount: result.sent,
          message: `${result.sent} ${type === 'invoice' ? 'facture(s)' : 'rappel(s)'} envoyé(s) avec succès via Gmail API`
        })
      } else {
        return NextResponse.json({
          success: false,
          method: 'gmail_api',
          sentCount: result.sent,
          failedCount: result.failed,
          errors: result.errors,
          message: `${result.sent} envoyé(s), ${result.failed} échoué(s)`
        }, { status: 500 })
      }
    }

    // ================================================================
    // BRANCHE 2: SMTP → n8n workflow (fallback) 📧
    // ================================================================
    else {
      console.log('Using n8n/SMTP for sending emails')

      // Récupérer les credentials SMTP déchiffrés
      const { data: smtpCreds, error: smtpError } = await supabase.rpc('fc_get_email_credential', {
        p_company_id: context.companyId
      })

      if (smtpError || !smtpCreds || smtpCreds.length === 0) {
        return NextResponse.json({
          error: 'SMTP credentials not found',
          message: 'Veuillez configurer votre email SMTP.'
        }, { status: 400 })
      }

      const smtp = smtpCreds[0]

      // Vérifier que n8n est configuré
      if (!N8N_WEBHOOK_URL) {
        return NextResponse.json({
          error: 'n8n not configured',
          message: 'n8n webhook URL not set. Please configure N8N_WEBHOOK_URL_INVOICE.'
        }, { status: 500 })
      }

      // Envoyer à n8n
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.N8N_API_KEY || ''
          },
          body: JSON.stringify({
            clientIds,
            type,
            customMessage,
            companyId: context.companyId,
            triggeredBy: userId,
            timestamp: new Date().toISOString(),

            // SMTP Credentials
            smtpHost: smtp.smtp_host,
            smtpPort: smtp.smtp_port,
            smtpUser: smtp.smtp_user,
            smtpPassword: smtp.smtp_password,
            fromEmail: smtp.from_email,
            fromName: smtp.from_name,

            // Supabase config
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          })
        })

        if (!response.ok) {
          throw new Error('n8n webhook failed')
        }

        return NextResponse.json({
          success: true,
          method: 'n8n_smtp',
          queuedCount: clientIds.length,
          message: `${type === 'invoice' ? 'Factures' : 'Rappels'} envoyé(s) via n8n/SMTP`
        })
      } catch (error) {
        console.error('n8n webhook error:', error)
        return NextResponse.json({
          error: 'Failed to send via n8n',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json({
      error: 'Failed to send emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
