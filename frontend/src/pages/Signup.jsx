// Signup page — caregiver creates an account with name, email, and password
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { signup } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async () => {
    if (!fullName.trim()) { setError('Full name is required.'); return }
    if (!email.trim()) { setError('Email is required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError('')
    setLoading(true)
    try {
      await signup(email.trim(), password, fullName.trim())
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, Arial, sans-serif', padding: '32px',
        }}
      >
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '420px' }}>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534', marginBottom: '12px' }}>Account Created!</p>
          <p style={{ fontSize: '17px', color: '#374151', marginBottom: '24px' }}>
            Check your email to confirm your account, then sign in.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-block', backgroundColor: '#4f46e5', color: 'white',
              padding: '14px 32px', borderRadius: '10px', fontSize: '18px',
              fontWeight: '600', textDecoration: 'none',
            }}
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, Arial, sans-serif', padding: '32px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
          Create Account
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '32px', textAlign: 'center' }}>
          Set up your caregiver account to get started
        </p>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              style={{
                width: '100%', border: '1px solid #d1d5db', borderRadius: '8px',
                padding: '12px 14px', fontSize: '16px', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', border: '1px solid #d1d5db', borderRadius: '8px',
                padding: '12px 14px', fontSize: '16px', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              placeholder="At least 6 characters"
              style={{
                width: '100%', border: '1px solid #d1d5db', borderRadius: '8px',
                padding: '12px 14px', fontSize: '16px', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '15px', color: '#dc2626', marginBottom: '16px', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{
              width: '100%', backgroundColor: loading ? '#a5b4fc' : '#4f46e5',
              color: 'white', padding: '14px', borderRadius: '10px',
              fontSize: '18px', fontWeight: '600', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '15px', color: '#6b7280' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
