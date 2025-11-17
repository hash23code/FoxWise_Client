// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyContext } from '@/lib/company-context'
import { createClient } from '@supabase/supabase-js'

// This endpoint queues invoice/reminder emails to be sent via n8n workflow
// n8n workflow will handle the actual email sending with company's SMTP credentials
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

    // Get company context
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

    // Récupérer les credentials SMTP de l'entreprise
    const { data: emailCreds, error: credsError } = await supabase.rpc('fc_get_email_credential', {
      p_company_id: context.companyId
    })

    if (credsError || !emailCreds || emailCreds.length === 0) {
      return NextResponse.json({
        error: 'Email not configured',
        message: 'Veuillez configurer votre email dans les paramètres avant d\'envoyer des emails.',
        configUrl: '/settings'
      }, { status: 400 })
    }

    const smtpConfig = emailCreds[0]

    // If n8n webhook URL is configured, forward the request with SMTP credentials
    if (N8N_WEBHOOK_URL) {
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

            // SMTP Credentials du client
            smtpHost: smtpConfig.smtp_host,
            smtpPort: smtpConfig.smtp_port,
            smtpUser: smtpConfig.smtp_user,
            smtpPassword: smtpConfig.smtp_password, // Déchiffré par la fonction RPC
            fromEmail: smtpConfig.from_email,
            fromName: smtpConfig.from_name,

            // Supabase config pour que n8n puisse récupérer les clients
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          })
        })

        if (!response.ok) {
          throw new Error('n8n webhook failed')
        }

        return NextResponse.json({
          success: true,
          queuedCount: clientIds.length,
          workflowUrl: N8N_WEBHOOK_URL,
          message: `${type === 'invoice' ? 'Invoices' : 'Payment reminders'} queued successfully`
        })
      } catch (error) {
        console.error('n8n webhook error:', error)
        return NextResponse.json({
          error: 'Failed to queue emails via n8n. Please check n8n configuration.',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    } else {
      // n8n not configured - return success but indicate setup needed
      return NextResponse.json({
        success: true,
        queuedCount: clientIds.length,
        message: `${clientIds.length} ${type === 'invoice' ? 'invoice(s)' : 'reminder(s)'} ready to send`,
        warning: 'n8n webhook not configured. Please set N8N_WEBHOOK_URL_INVOICE environment variable.'
      })
    }
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json({
      error: 'Failed to queue emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
