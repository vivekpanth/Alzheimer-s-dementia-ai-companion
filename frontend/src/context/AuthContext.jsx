// Auth context — provides current caregiver session, patient list, and auth functions
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../api/supabase.js'
import { linkPatientToCaregiver, ensureCaregiver, getCaregiverPatients, addPatientToCaregiver, removePatientFromCaregiver } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [caregiver, setCaregiver] = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchCaregiver(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchCaregiver(session.user)
      else { setCaregiver(null); setPatients([]); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCaregiver(user) {
    try {
      const { data } = await ensureCaregiver(user.id, user.email, user.user_metadata?.full_name || user.email)
      setCaregiver(data)
    } catch {
      // fallback: direct Supabase read if backend is unreachable
      const { data } = await supabase.from('caregivers').select('*').eq('auth_user_id', user.id).maybeSingle()
      if (data) setCaregiver(data)
    } finally {
      await fetchPatients(user.id)
      setLoading(false)
    }
  }

  async function fetchPatients(authUserId) {
    try {
      const res = await getCaregiverPatients(authUserId)
      setPatients(res.data || [])
    } catch {
      setPatients([])
    }
  }

  async function signup(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setCaregiver(null)
    setPatients([])
  }

  // Set the active patient for chat (does not add to list)
  async function linkPatient(patientUserId) {
    if (!session) throw new Error('Not authenticated')
    await linkPatientToCaregiver(session.user.id, patientUserId)
    setCaregiver(prev => ({ ...prev, patient_user_id: patientUserId }))
    setPatients(prev => prev.map(p => ({ ...p, is_active: p.patient_user_id === patientUserId })))
  }

  // Add a new patient to the list AND make them active (called from Onboarding)
  async function addPatient(patientUserId, displayName = '') {
    if (!session) throw new Error('Not authenticated')
    await addPatientToCaregiver(session.user.id, patientUserId, displayName)
    setCaregiver(prev => ({ ...prev, patient_user_id: patientUserId }))
    await fetchPatients(session.user.id)
  }

  // Remove patient from list only — does NOT delete their data
  async function removePatientLink(patientUserId) {
    if (!session) throw new Error('Not authenticated')
    await removePatientFromCaregiver(session.user.id, patientUserId)
    const remaining = patients.filter(p => p.patient_user_id !== patientUserId)
    setPatients(remaining)
    if (caregiver?.patient_user_id === patientUserId) {
      const next = remaining[0]?.patient_user_id || null
      setCaregiver(prev => ({ ...prev, patient_user_id: next }))
    }
  }

  const value = {
    session,
    caregiver,
    patients,
    loading,
    signup,
    login,
    logout,
    linkPatient,
    addPatient,
    removePatientLink,
    isAuthenticated: !!session,
    patientId: caregiver?.patient_user_id || null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
