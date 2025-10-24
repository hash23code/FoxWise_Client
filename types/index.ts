// ==================== USER TYPES ====================
export interface User {
  id: string
  clerk_user_id: string
  email: string
  full_name: string | null
  role: 'manager' | 'employee'
  created_at: string
  updated_at: string
}

// ==================== SECTOR TYPES ====================
export interface Sector {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
}

// ==================== ACTIVITY TYPES ====================
export interface Activity {
  id: string
  user_id: string
  name: string
  description: string | null
  default_cost: number | null
  icon: string | null
  color: string
  created_at: string
}

export interface ClientActivity {
  id: string
  client_id: string
  activity_id: string
  custom_cost: number | null
  notes: string | null
  created_at: string
  activity?: Activity
}

// ==================== CLIENT TYPES ====================
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
  activities?: ClientActivity[]
}

// ==================== JOB TYPES ====================
export interface JobType {
  id: string
  user_id: string
  name: string
  description: string | null
  default_cost: number | null
  created_at: string
}

export interface Job {
  id: string
  user_id: string
  client_id: string
  assigned_to: string | null
  activity_id: string | null
  job_type_id: string | null
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
  amount_paid: number
  notes: string | null
  created_at: string
  updated_at: string
  client?: Client
  job_type?: JobType
  activity?: Activity
  assigned_employee?: User
}

// ==================== CALENDAR TYPES ====================
export interface CalendarEvent {
  id: string
  user_id: string
  assigned_to: string | null
  title: string
  description: string | null
  start_time: string
  end_time: string
  client_id: string | null
  job_id: string | null
  event_type: 'meeting' | 'job' | 'reminder' | 'other'
  created_at: string
  updated_at: string
  client?: Client
  job?: Job
}

// ==================== CHAT TYPES ====================
export interface Conversation {
  id: string
  name: string
  conversation_type: 'private' | 'group' | 'team'
  created_by: string
  created_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string | null
  content: string
  created_at: string
}

// ==================== EMAIL TYPES ====================
export interface EmailLog {
  id: string
  user_id: string
  client_ids: string[]
  subject: string
  content: string
  sent_at: string
  status: 'sent' | 'failed'
}

// ==================== STATS TYPES ====================
export interface Stats {
  totalClients: number
  activeClients: number
  prospectClients: number
  inactiveClients: number
  totalJobs: number
  pendingJobs: number
  inProgressJobs: number
  completedJobs: number
  cancelledJobs: number
  pendingPayments: number
  totalRevenue: number
  paidRevenue: number
  pendingRevenue: number
  totalEmployees: number
  activeEmployees: number
}

export interface DashboardChartData {
  jobsByStatus: { status: string; count: number; color: string }[]
  jobsByPriority: { priority: string; count: number; color: string }[]
  revenueByMonth: { month: string; revenue: number }[]
  clientsBySector: { sector: string; count: number; color: string }[]
  employeeWorkload: { employee: string; jobs: number }[]
}

// ==================== FILTER TYPES ====================
export interface ClientFilters {
  search: string
  sector: string
  status: string
  sortBy: 'name' | 'created_at' | 'updated_at'
  sortOrder: 'asc' | 'desc'
}

export interface JobFilters {
  search: string
  status: string
  priority: string
  assignedTo: string
  clientId: string
  activityId: string
  sortBy: 'created_at' | 'scheduled_date' | 'priority'
  sortOrder: 'asc' | 'desc'
}

// ==================== VIEW TYPES ====================
export type ViewMode = 'list' | 'table' | 'grid'

// ==================== FORM TYPES ====================
export interface ClientFormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  sector_id: string
  status: 'active' | 'inactive' | 'prospect'
  notes: string
  activity_ids: string[]
}

export interface JobFormData {
  client_id: string
  assigned_to: string
  activity_id: string
  job_type_id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduled_date: string
  estimated_hours: number
  estimated_cost: number
  notes: string
}

export interface ActivityFormData {
  name: string
  description: string
  default_cost: number
  color: string
}
