// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST - Accept an employee invitation
 * This is called when an employee clicks the invitation link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, clerk_user_id, email } = body

    if (!token) {
      return NextResponse.json({ error: 'Invitation token required' }, { status: 400 })
    }

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('fc_employee_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({
        error: 'Invalid or expired invitation'
      }, { status: 404 })
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('fc_employee_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json({
        error: 'This invitation has expired'
      }, { status: 400 })
    }

    // Verify email matches if provided
    if (email && email !== invitation.email) {
      return NextResponse.json({
        error: 'Email does not match invitation'
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('fc_users')
      .select('*')
      .eq('email', invitation.email)
      .single()

    let userId: string

    if (existingUser) {
      // User exists, update their company
      const { data: updatedUser, error: updateError } = await supabase
        .from('fc_users')
        .update({
          company_id: invitation.company_id,
          role: 'employee',
          clerk_user_id: clerk_user_id || existingUser.clerk_user_id
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) throw updateError
      userId = updatedUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('fc_users')
        .insert([{
          clerk_user_id: clerk_user_id || 'pending_' + Date.now(),
          email: invitation.email,
          full_name: invitation.full_name,
          role: 'employee',
          company_id: invitation.company_id,
          invited_by: invitation.invited_by,
          invited_at: invitation.created_at
        }])
        .select()
        .single()

      if (createError) throw createError
      userId = newUser.id
    }

    // Mark invitation as accepted
    await supabase
      .from('fc_employee_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    // Get company info
    const { data: company } = await supabase
      .from('fc_companies')
      .select('*')
      .eq('id', invitation.company_id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      user: {
        id: userId,
        email: invitation.email,
        full_name: invitation.full_name,
        role: 'employee',
        company_id: invitation.company_id
      },
      company
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET - Verify invitation token (before accepting)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const { data: invitation, error } = await supabase
      .from('fc_employee_invitations')
      .select(`
        *,
        company:fc_companies(*)
      `)
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single()

    if (error || !invitation) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invitation'
      }, { status: 404 })
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('fc_employee_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json({
        valid: false,
        error: 'Invitation expired'
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        full_name: invitation.full_name,
        company: invitation.company,
        expires_at: invitation.expires_at
      }
    })
  } catch (error) {
    console.error('Verify invitation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
