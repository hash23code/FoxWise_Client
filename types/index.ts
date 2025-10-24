export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  sector_id: string | null
  status: 'active' | 'inactive' | 'prospect'
  notes: string | null
  created_at: string
  updated_at: string
  sector?: Sector
}

export interface Sector {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
}

export interface Job {
  id: string
  user_id: string
  client_id: string
  assigned_to: string | null
  job_type_id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduled_date: string | null
  completed_date: string | null
  estimated_hours: number | null
  estimated_cost: number | null
  actual_hours: number | null
  actual_cost: number | null
  payment_status: 'unpaid' | 'partial' | 'paid'
  notes: string | null
  created_at: string
  updated_at: string
  client?: Client
  job_type?: JobType
}

export interface JobType {
  id: string
  name: string
  description: string | null
  default_cost: number | null
  created_at: string
}

export interface Stats {
  totalClients: number
  activeClients: number
  totalJobs: number
  completedJobs: number
  pendingPayments: number
  totalRevenue: number
  pendingRevenue: number
}
