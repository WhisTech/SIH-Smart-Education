import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Fetch employee_profiles record for the authenticated user.
  // If profile is missing but user_metadata exists (e.g. pending confirmation signup), auto-create profile under RLS.
  const fetchProfile = useCallback(async (currentUser) => {
    if (!currentUser?.id) {
      setProfile(null)
      return null
    }
    const userId = currentUser.id
    setProfileLoading(true)

    try {
      // 1. Query existing profile
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        setProfile(data)
        return data
      }

      // 2. If no profile exists, check if user_metadata contains onboarding details from signup
      const meta = currentUser.user_metadata
      if (meta && meta.name && meta.designation_id) {
        console.log('Auto-creating profile from user metadata under authenticated session...')
        const { data: newProfile, error: createError } = await supabase
          .from('employee_profiles')
          .insert({
            user_id: userId,
            name: meta.name,
            employee_id: meta.employee_id,
            designation_id: meta.designation_id, // UUID
            department: meta.department,
            experience_years: meta.experience_years ?? 0
          })
          .select('*')
          .single()

        if (!createError && newProfile) {
          setProfile(newProfile)

          // Insert skills if present in metadata
          if (Array.isArray(meta.skill_ids) && meta.skill_ids.length > 0) {
            const skillRows = meta.skill_ids.map((skillId) => ({
              employee_profile_id: newProfile.id,
              skill_id: skillId
            }))
            try {
              await supabase.from('employee_skills').insert(skillRows)
            } catch (skillErr) {
              console.warn('Error inserting initial skills:', skillErr)
            }
          }

          return newProfile
        } else if (createError) {
          console.error('Error auto-creating profile from metadata:', createError.message)
        }
      }

      setProfile(null)
      return null
    } catch (err) {
      console.error('Network error fetching profile:', err)
      setProfile(null)
      return null
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    // 1. Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser)
      } else {
        setProfile(null)
      }
    })

    // 2. Initialize session from Supabase client storage
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error retrieving session:', error.message)
        }
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          fetchProfile(currentUser)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [fetchProfile])

  // Explicit sign out method
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setUser(null)
      setProfile(null)
    }
  }, [])

  // Method to reload profile on demand (e.g. after profile edit)
  const reloadProfile = useCallback(() => {
    if (user) {
      return fetchProfile(user)
    }
    return Promise.resolve(null)
  }, [user, fetchProfile])

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    signOut,
    reloadProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
