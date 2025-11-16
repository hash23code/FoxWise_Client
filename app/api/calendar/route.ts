import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getCompanyContext } from '@/lib/company-context'

// GET - Get calendar events (includes jobs and calendar events)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const assigned_to = searchParams.get('assigned_to')

    // Fetch all employees with their colors
    const { data: employees } = await supabase
      .from('fc_users')
      .select('id, clerk_user_id, email, full_name, color, role')
      .eq('company_id', context.companyId)
      .eq('role', 'employee')

    const employeeMap = new Map(employees?.map(e => [e.id, e]) || [])

    // Fetch jobs from fc_jobs table
    let jobsQuery = supabase
      .from('fc_jobs')
      .select(`
        *,
        client:fc_clients(id, name, email, phone)
      `)
      .eq('company_id', context.companyId)
      .not('scheduled_date', 'is', null)

    // Filter by assigned employee if provided
    if (assigned_to && assigned_to !== 'all') {
      jobsQuery = jobsQuery.eq('assigned_to', assigned_to)
    }

    const { data: jobs, error: jobsError } = await jobsQuery

    if (jobsError) throw jobsError

    // Transform jobs into calendar events format
    const jobEvents = (jobs || []).map(job => {
      // Find the employee by clerk_user_id (assigned_to contains clerk_user_id)
      const employee = employees?.find(e => e.clerk_user_id === job.assigned_to)

      return {
        id: job.id,
        user_id: job.user_id,
        assigned_to: job.assigned_to,
        title: job.title,
        description: job.description,
        start_time: job.scheduled_date,
        end_time: job.scheduled_date, // Jobs are single day events
        client_id: job.client_id,
        job_id: job.id,
        event_type: 'job' as const,
        created_at: job.created_at,
        updated_at: job.updated_at,
        client: job.client,
        job: {
          id: job.id,
          title: job.title,
          status: job.status,
          priority: job.priority
        },
        employee_color: employee?.color || null,
        employee_name: employee?.full_name || employee?.email || null
      }
    })

    // Fetch calendar events from fc_calendar_events table (if it exists)
    let calendarQuery = supabase
      .from('fc_calendar_events')
      .select(`
        *,
        client:fc_clients(id, name, email, phone),
        job:fc_jobs(id, title, status, priority)
      `)
      .order('start_time', { ascending: true })

    // Apply same filter
    if (assigned_to && assigned_to !== 'all') {
      calendarQuery = calendarQuery.eq('assigned_to', assigned_to)
    }

    const { data: calendarEvents } = await calendarQuery

    // Add employee colors to calendar events
    const calendarEventsWithColors = (calendarEvents || []).map(event => {
      const employee = employees?.find(e => e.clerk_user_id === event.assigned_to)
      return {
        ...event,
        employee_color: employee?.color || null,
        employee_name: employee?.full_name || employee?.email || null
      }
    })

    // Combine and return all events
    const allEvents = [...jobEvents, ...calendarEventsWithColors]

    return NextResponse.json(allEvents)
  } catch (error) {
    console.error('Calendar GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create calendar event
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('fc_calendar_events')
      .insert([{
        user_id: userId,
        assigned_to: body.assigned_to || null,
        title: body.title,
        description: body.description || null,
        start_time: body.start_time,
        end_time: body.end_time,
        client_id: body.client_id || null,
        job_id: body.job_id || null,
        event_type: body.event_type || 'other'
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Calendar POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update calendar event
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('fc_calendar_events')
      .update({
        assigned_to: body.assigned_to,
        title: body.title,
        description: body.description,
        start_time: body.start_time,
        end_time: body.end_time,
        client_id: body.client_id,
        job_id: body.job_id,
        event_type: body.event_type
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Calendar PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete calendar event
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fc_calendar_events')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
