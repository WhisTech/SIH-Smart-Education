import { supabase } from './supabase'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

/**
 * Fetch all available designations from the database.
 * Tries direct Supabase query first, then falls back to backend API if needed.
 * Returns array of { id: string (UUID), name: string, description: string }
 */
export async function fetchDesignations() {
  try {
    const { data, error } = await supabase
      .from('designations')
      .select('id, name, description')
      .order('name')

    if (!error && Array.isArray(data) && data.length > 0) {
      return { data, error: null }
    }
  } catch {
    // If Supabase direct query fails, attempt fallback
  }

  // Fallback to backend API endpoint
  try {
    const response = await fetch(`${BACKEND_URL}/api/designations`)
    if (response.ok) {
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return { data: result.data, error: null }
      }
    }
  } catch {
    // Fallback also failed
  }

  return { data: [], error: null }
}

/**
 * Fetch all available skills from the database.
 * Tries direct Supabase query first, then falls back to backend API if needed.
 * Returns array of { id: string (UUID), name: string, description: string, category: string }
 */
export async function fetchSkills() {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('id, name, description, category')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (!error && Array.isArray(data) && data.length > 0) {
      return { data, error: null }
    }
  } catch {
    // If Supabase direct query fails, attempt fallback
  }

  // Fallback to backend API endpoint
  try {
    const response = await fetch(`${BACKEND_URL}/api/skills`)
    if (response.ok) {
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return { data: result.data, error: null }
      }
    }
  } catch {
    // Fallback also failed
  }

  return { data: [], error: null }
}
