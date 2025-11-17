// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyContext } from '@/lib/company-context'

// This endpoint queues batch email campaigns to be sent via n8n workflow
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL_CAMPAIGN

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

    // Only managers can send campaigns
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can send campaigns' }, { status: 403 })
    }

    const body = await request.json()
    const { clientIds, subject, body: emailBody, scheduledAt } = body

    if (!clientIds || (clientIds !== 'all' && (!Array.isArray(clientIds) || clientIds.length === 0))) {
      return NextResponse.json({ error: 'Client IDs are required' }, { status: 400 })
    }

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    // Generate campaign ID
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // If n8n webhook URL is configured, forward the request
    if (N8N_WEBHOOK_URL) {
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.N8N_API_KEY || ''
          },
          body: JSON.stringify({
            campaignId,
            clientIds,
            subject,
            body: emailBody,
            scheduledAt,
            companyId: context.companyId,
            triggeredBy: userId,
            timestamp: new Date().toISOString()
          })
        })

        if (!response.ok) {
          throw new Error('n8n webhook failed')
        }

        return NextResponse.json({
          success: true,
          campaignId,
          workflowUrl: N8N_WEBHOOK_URL,
          message: 'Campaign queued successfully'
        })
      } catch (error) {
        console.error('n8n webhook error:', error)
        return NextResponse.json({
          error: 'Failed to queue campaign via n8n. Please check n8n configuration.',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    } else {
      // n8n not configured - return success but indicate setup needed
      return NextResponse.json({
        success: true,
        campaignId,
        message: 'Campaign ready to send',
        warning: 'n8n webhook not configured. Please set N8N_WEBHOOK_URL_CAMPAIGN environment variable.'
      })
    }
  } catch (error) {
    console.error('Send campaign error:', error)
    return NextResponse.json({
      error: 'Failed to queue campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
