// Login page — caregiver signs in with email and password
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Email and password are required.'); return }
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
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
          Memory Companion
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '32px', textAlign: 'center' }}>
          Sign in to your caregiver account
        </p>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Your password"
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
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', backgroundColor: loading ? '#a5b4fc' : '#4f46e5',
              color: 'white', padding: '14px', borderRadius: '10px',
              fontSize: '18px', fontWeight: '600', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '15px', color: '#6b7280' }}>
            Don't have an account?{' '}
            <a href="/signup" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
