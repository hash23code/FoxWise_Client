/**
 * Company Context Utilities
 *
 * Handles multi-tenant company isolation throughout the application.
 * Every API request should use these utilities to ensure data is scoped to the correct company.
 */

import { supabase } from './supabase'

export interface CompanyContext {
  companyId: string
  userId: string
  role: 'manager' | 'employee'
  email: string
  fullName: string | null
}

export interface Company {
  id: string
  name: string
  owner_id: string
  email: string | null
  phone: string | null
  address: string | null
  subscription_status: string
  subscription_plan: string
  max_employees: number
  created_at: string
  updated_at: string
}

/**
 * Get company context for the current user
 * This is the main function to use in API routes
 *
 * @param clerkUserId - The Clerk user ID from auth()
 * @returns CompanyContext or null if user not found
 */
export async function getCompanyContext(clerkUserId: string): Promise<CompanyContext | null> {
  try {
    // Get user with company info
    const { data: user, error } = await supabase
      .from('fc_users')
      .select('id, company_id, role, email, full_name')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error || !user) {
      console.error('User not found in fc_users:', clerkUserId)
      return null
    }

    if (!user.company_id) {
      console.error('❌ CRITICAL: User has no company_id. Migration required!', {
        userId: user.id,
        email: user.email,
        clerkUserId
      })
      return null
    }

    return {
      companyId: user.company_id,
      userId: user.id,
      role: user.role,
      email: user.email,
      fullName: user.full_name
    }
  } catch (error) {
    console.error('Error getting company context:', error)
    return null
  }
}

/**
 * Get or create user in fc_users table
 * Called when a Clerk user logs in for the first time
 *
 * @param clerkUserId - Clerk user ID
 * @param email - User email
 * @param fullName - User full name
 * @param role - User role (manager or employee)
 * @returns User object
 */
export async function getOrCreateUser(
  clerkUserId: string,
  email: string,
  fullName: string | null,
  role: 'manager' | 'employee' = 'manager'
) {
  // First try to get existing user
  const { data: existingUser } = await supabase
    .from('fc_users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (existingUser) {
    return existingUser
  }

  // Create new user
  // Note: If role is 'manager', the trigger will auto-create a company
  const { data: newUser, error } = await supabase
    .from('fc_users')
    .insert([{
      clerk_user_id: clerkUserId,
      email,
      full_name: fullName,
      role
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    throw new Error('Failed to create user')
  }

  return newUser
}

/**
 * Verify user belongs to a company
 * Used in employee invitation flow
 *
 * @param userId - fc_users.id
 * @param companyId - fc_companies.id
 * @returns boolean
 */
export async function verifyUserCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('fc_users')
    .select('company_id')
    .eq('id', userId)
    .eq('company_id', companyId)
    .single()

  return !error && !!data
}

/**
 * Get company details
 *
 * @param companyId - fc_companies.id
 * @returns Company object or null
 */
export async function getCompany(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('fc_companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error) {
    console.error('Error fetching company:', error)
    return null
  }

  return data
}

/**
 * Check if user is a manager of their company
 *
 * @param clerkUserId - Clerk user ID
 * @returns boolean
 */
export async function isCompanyManager(clerkUserId: string): Promise<boolean> {
  const context = await getCompanyContext(clerkUserId)
  return context?.role === 'manager'
}

/**
 * Check if user is an employee
 *
 * @param clerkUserId - Clerk user ID
 * @returns boolean
 */
export async function isEmployee(clerkUserId: string): Promise<boolean> {
  const context = await getCompanyContext(clerkUserId)
  return context?.role === 'employee'
}

/**
 * Get all employees for a company
 * Only managers can call this
 *
 * @param companyId - fc_companies.id
 * @returns Array of employee users
 */
export async function getCompanyEmployees(companyId: string) {
  const { data, error } = await supabase
    .from('fc_users')
    .select('*')
    .eq('company_id', companyId)
    .eq('role', 'employee')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }

  return data || []
}

/**
 * Get company statistics
 *
 * @param companyId - fc_companies.id
 * @returns Object with company stats
 */
export async function getCompanyStats(companyId: string) {
  const [
    { count: employeeCount },
    { count: clientCount },
    { count: activeJobCount },
    { count: completedJobCount }
  ] = await Promise.all([
    supabase.from('fc_users').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('role', 'employee'),
    supabase.from('fc_clients').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('fc_jobs').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['pending', 'in_progress']),
    supabase.from('fc_jobs').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'completed')
  ])

  return {
    employeeCount: employeeCount || 0,
    clientCount: clientCount || 0,
    activeJobCount: activeJobCount || 0,
    completedJobCount: completedJobCount || 0
  }
}
