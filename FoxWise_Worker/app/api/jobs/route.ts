import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getCompanyContext } from '@/lib/company-context'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get company context for multi-tenant isolation
    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // For employees: only show jobs assigned to them
    // For managers: show all company jobs
    let query = supabase
      .from('fc_jobs')
      .select(`
        *,
        client:fc_clients(*, sector:fc_sectors(*)),
        job_type:fc_job_types(*),
        assigned_employee:fc_users!assigned_to(id, email, full_name, role)
      `)
      .eq('company_id', context.companyId)

    // Employee filter: only jobs assigned to them
    if (context.role === 'employee') {
      query = query.eq('assigned_to', context.userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Jobs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Only managers can create jobs
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can create jobs' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Creating job with data:', body)
    console.log('User ID:', userId)
    console.log('Company ID:', context.companyId)

    // Automatically add company_id and user_id
    const { data, error } = await supabase
      .from('fc_jobs')
      .insert([{
        ...body,
        user_id: userId,
        company_id: context.companyId
      }])
      .select(`
        *,
        client:fc_clients(*, sector:fc_sectors(*)),
        job_type:fc_job_types(*),
        assigned_employee:fc_users!assigned_to(id, email, full_name, role)
      `)
      .single()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Jobs POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const body = await request.json()

    // Employees can only update job status/location for their assigned jobs
    // Managers can update any job in their company
    let query = supabase
      .from('fc_jobs')
      .update(body)
      .eq('id', id)
      .eq('company_id', context.companyId)

    if (context.role === 'employee') {
      query = query.eq('assigned_to', context.userId)
    }

    const { data, error } = await query
      .select(`
        *,
        client:fc_clients(*, sector:fc_sectors(*)),
        job_type:fc_job_types(*),
        assigned_employee:fc_users!assigned_to(id, email, full_name, role)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Jobs PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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

    // Only managers can delete jobs
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can delete jobs' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fc_jobs')
      .delete()
      .eq('id', id)
      .eq('company_id', context.companyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Jobs DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
