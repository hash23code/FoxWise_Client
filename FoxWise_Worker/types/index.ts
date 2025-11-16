// ==================== COMPANY TYPES ====================
export interface Company {
  id: string
  name: string
  owner_id: string // Clerk user ID of company owner
  email: string | null
  phone: string | null
  address: string | null
  subscription_status: 'active' | 'inactive' | 'suspended'
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise'
  max_employees: number
  created_at: string
  updated_at: string
}

export interface EmployeeInvitation {
  id: string
  company_id: string
  email: string
  full_name: string | null
  role: 'employee'
  invited_by: string // Clerk user ID
  invitation_token: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  accepted_at: string | null
  created_at: string
}

// ==================== USER TYPES ====================
export interface User {
  id: string
  clerk_user_id: string
  email: string
  full_name: string | null
  role: 'manager' | 'employee'
  company_id: string | null
  invitation_status: string | null
  invitation_token: string | null
  invited_at: string | null
  invited_by: string | null
  created_at: string
  updated_at: string
  company?: Company
}

// Employee is a User with role 'employee'
export type Employee = User

// ==================== SECTOR TYPES ====================
export interface Sector {
  id: string
  user_id: string
  company_id: string | null
  name: string
  description: string | null
  color: string
  created_at: string
}

// ==================== ACTIVITY TYPES ====================
export interface Activity {
  id: string
  user_id: string
  company_id: string | null
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
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  formatted_address: string | null
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
  company_id: string | null
  name: string
  description: string | null
  default_cost: number | null
  created_at: string
}

export interface Job {
  id: string
  user_id: string
  company_id: string | null
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
  latitude: number | null
  longitude: number | null
  location_status: 'pending' | 'assigned' | 'en_route' | 'arrived' | 'completed'
  is_urgent: boolean
  arrived_at: string | null
  completed_at: string | null
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

// ==================== GEOLOCATION TYPES ====================
export interface EmployeeLocation {
  id: string
  user_id: string
  clerk_user_id: string
  latitude: number
  longitude: number
  heading: number | null
  speed: number | null
  accuracy: number | null
  updated_at: string
}

export interface MapMarker {
  id: string
  type: 'job' | 'employee' | 'client'
  latitude: number
  longitude: number
  title: string
  description?: string
  color: 'green' | 'orange' | 'red' | 'blue'
  data: Job | EmployeeLocation | Client
}

export interface NavigationRoute {
  geometry: any
  distance: number
  duration: number
  steps: RouteStep[]
}

export interface RouteStep {
  instruction: string
  distance: number
  duration: number
  maneuver: {
    type: string
    modifier?: string
    bearing_before?: number
    bearing_after?: number
    location: [number, number]
  }
}

export interface WeatherEffect {
  type: 'rain' | 'snow' | 'fog' | 'clear'
  intensity: number
}
