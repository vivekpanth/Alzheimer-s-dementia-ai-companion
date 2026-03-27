// Auth context — provides current caregiver session and login/logout/signup functions
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../api/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [caregiver, setCaregiver] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchCaregiver(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchCaregiver(session.user.id)
      else { setCaregiver(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCaregiver(authUserId) {
    const { data } = await supabase
      .from('caregivers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()

    if (data) setCaregiver(data)
    setLoading(false)
  }

  async function signup(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    const { error: profileError } = await supabase
      .from('caregivers')
      .insert({ auth_user_id: data.user.id, full_name: fullName, email })

    if (profileError) throw profileError
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
  }

  async function linkPatient(patientUserId) {
    if (!caregiver) return
    const { error } = await supabase
      .from('caregivers')
      .update({ patient_user_id: patientUserId })
      .eq('id', caregiver.id)

    if (error) throw error
    setCaregiver({ ...caregiver, patient_user_id: patientUserId })
  }

  const value = {
    session,
    caregiver,
    loading,
    signup,
    login,
    logout,
    linkPatient,
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
