import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// PUT - Update job location status (arrived, completed, etc.)
export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, location_status, latitude, longitude } = body

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const updateData: any = {
      location_status,
      updated_at: new Date().toISOString()
    }

    // Add timestamps based on status
    if (location_status === 'arrived') {
      updateData.arrived_at = new Date().toISOString()
    } else if (location_status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.status = 'completed'
    }

    // Update location if provided
    if (latitude && longitude) {
      updateData.latitude = latitude
      updateData.longitude = longitude
    }

    const { data, error } = await supabase
      .from('fc_jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Job location update error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Check proximity and auto-update job status
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, threshold = 50 } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Get all jobs assigned to this user that are not completed
    const { data: jobs, error } = await supabase
      .from('fc_jobs')
      .select('*')
      .eq('assigned_to', userId)
      .in('location_status', ['assigned', 'en_route'])

    if (error) throw error

    const updatedJobs = []

    // Check proximity for each job
    for (const job of jobs || []) {
      if (!job.latitude || !job.longitude) continue

      const distance = calculateDistance(
        latitude,
        longitude,
        job.latitude,
        job.longitude
      )

      // If within threshold, mark as arrived
      if (distance <= threshold) {
        const { data: updatedJob, error: updateError } = await supabase
          .from('fc_jobs')
          .update({
            location_status: 'arrived',
            arrived_at: new Date().toISOString()
          })
          .eq('id', job.id)
          .select()
          .single()

        if (!updateError) {
          updatedJobs.push(updatedJob)
        }
      }
    }

    return NextResponse.json({
      checked: jobs?.length || 0,
      updated: updatedJobs.length,
      jobs: updatedJobs
    })
  } catch (error: any) {
    console.error('Proximity check error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
