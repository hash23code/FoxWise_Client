// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getCompanyContext } from '@/lib/company-context'
import crypto from 'crypto'

/**
 * GET - Get all pending invitations for the company (managers only)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // Only managers can view invitations
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can view invitations' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('fc_employee_invitations')
      .select('*')
      .eq('company_id', context.companyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Invitations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST - Create a new employee invitation and send email
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // Only managers can invite employees
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can invite employees' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user already exists in this company
    const { data: existingUser } = await supabase
      .from('fc_users')
      .select('*')
      .eq('email', email)
      .eq('company_id', context.companyId)
      .single()

    if (existingUser) {
      return NextResponse.json({
        error: 'An employee with this email already exists in your company'
      }, { status: 400 })
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('fc_employee_invitations')
      .select('*')
      .eq('email', email)
      .eq('company_id', context.companyId)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json({
        error: 'A pending invitation already exists for this email'
      }, { status: 400 })
    }

    // Generate secure invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('fc_employee_invitations')
      .insert([{
        company_id: context.companyId,
        email,
        full_name,
        role: 'employee',
        invited_by: userId,
        invitation_token: invitationToken,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }])
      .select()
      .single()

    if (invitationError) throw invitationError

    // Send invitation email
    try {
      const emailResult = await sendInvitationEmail({
        to: email,
        inviterName: context.fullName || 'Your manager',
        companyName: await getCompanyName(context.companyId),
        invitationToken,
        employeeName: full_name
      })

      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error)
        // Don't fail the request if email fails, invitation is still created
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      invitation,
      message: 'Invitation created and email sent successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Invitation POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT - Resend an invitation email
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can resend invitations' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 })
    }

    // Get invitation
    const { data: invitation, error } = await supabase
      .from('fc_employee_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('company_id', context.companyId)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({
        error: 'Can only resend pending invitations'
      }, { status: 400 })
    }

    // Resend email
    try {
      const emailResult = await sendInvitationEmail({
        to: invitation.email,
        inviterName: context.fullName || 'Your manager',
        companyName: await getCompanyName(context.companyId),
        invitationToken: invitation.invitation_token,
        employeeName: invitation.full_name
      })

      if (!emailResult.success) {
        return NextResponse.json({
          error: 'Failed to send email',
          details: emailResult.error
        }, { status: 500 })
      }
    } catch (emailError) {
      console.error('Error resending invitation email:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation email resent successfully'
    })
  } catch (error) {
    console.error('Invitation PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE - Cancel/delete an invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can delete invitations' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fc_employee_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('company_id', context.companyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Invitation DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Helper: Get company name
 */
async function getCompanyName(companyId: string): Promise<string> {
  const { data } = await supabase
    .from('fc_companies')
    .select('name')
    .eq('id', companyId)
    .single()

  return data?.name || 'FoxWise Company'
}

/**
 * Helper: Send invitation email
 * Replace this with your email service (Resend, SendGrid, etc.)
 */
async function sendInvitationEmail(params: {
  to: string
  inviterName: string
  companyName: string
  invitationToken: string
  employeeName: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured. Email not sent.')
      return { success: false, error: 'Email service not configured' }
    }

    // Build invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/accept-invitation/${params.invitationToken}`

    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FoxWise <noreply@foxwise.app>',
        to: params.to,
        subject: `Invitation to join ${params.companyName} on FoxWise`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🦊 FoxWise</h1>
              </div>

              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">You've been invited!</h2>

                <p>Hi ${params.employeeName || 'there'},</p>

                <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.companyName}</strong> on FoxWise as an employee.</p>

                <p>FoxWise is a powerful job management platform that helps teams coordinate work, track progress, and stay connected.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}"
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Accept Invitation
                  </a>
                </div>

                <p style="font-size: 14px; color: #666;">
                  Or copy and paste this link in your browser:<br>
                  <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
                </p>

                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  This invitation will expire in 7 days.
                </p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #999; text-align: center;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      return { success: false, error: errorData.message || 'Failed to send email' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Send email error:', error)
    return { success: false, error: error.message }
  }
}
