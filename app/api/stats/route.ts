// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [clientsResult, jobsResult] = await Promise.all([
      supabase.from('fc_clients').select('*', { count: 'exact' }).eq('user_id', userId),
      supabase.from('fc_jobs').select('*', { count: 'exact' }).eq('user_id', userId)
    ])

    const clients = clientsResult.data || []
    const jobs = jobsResult.data || []

    const activeClients = clients.filter((c: any) => c.status === 'active').length
    const completedJobs = jobs.filter((j: any) => j.status === 'completed').length
    const pendingPayments = jobs.filter((j: any) => j.payment_status === 'unpaid').length

    const totalRevenue = jobs
      .filter((j: any) => j.payment_status === 'paid' && j.actual_cost)
      .reduce((sum: number, j: any) => sum + (j.actual_cost || 0), 0)

    const pendingRevenue = jobs
      .filter((j: any) => j.payment_status === 'unpaid' && j.estimated_cost)
      .reduce((sum: number, j: any) => sum + (j.estimated_cost || 0), 0)

    return NextResponse.json({
      totalClients: clients.length,
      activeClients,
      totalJobs: jobs.length,
      completedJobs,
      pendingPayments,
      totalRevenue,
      pendingRevenue
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
