// Dashboard page — caregiver view of session summary, mood chart, and concern alerts
import React, { useState, useEffect } from 'react'
import MoodChart from '../components/MoodChart.jsx'
import ConcernAlert from '../components/ConcernAlert.jsx'
import { getReport } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { patientId, caregiver, logout } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchReport = async () => {
    if (!patientId) return
    setError('')
    setLoading(true)
    try {
      const res = await getReport(patientId)
      setReport(res.data)
    } catch (err) {
      setError('Could not load report. No sessions found yet.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (patientId) fetchReport()
  }, [patientId])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div
      className="max-w-3xl mx-auto p-8"
      style={{ fontFamily: 'system-ui, Arial, sans-serif' }}
    >
      {/* Header with nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Caregiver Dashboard
          </h1>
          {caregiver && (
            <p style={{ fontSize: '15px', color: '#6b7280', marginTop: '4px' }}>
              Welcome, {caregiver.full_name}
              {patientId && <> · Patient: <strong>{patientId}</strong></>}
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db',
            borderRadius: '8px', padding: '8px 16px', fontSize: '15px', cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {patientId && (
          <>
            <a href="/chat" style={{
              backgroundColor: '#4f46e5', color: 'white', padding: '10px 20px',
              borderRadius: '8px', fontSize: '16px', fontWeight: '600', textDecoration: 'none',
            }}>
              Open Companion
            </a>
            <a href="/update-patient" style={{
              backgroundColor: 'white', color: '#4f46e5', padding: '10px 20px',
              borderRadius: '8px', fontSize: '16px', fontWeight: '600', textDecoration: 'none',
              border: '2px solid #4f46e5',
            }}>
              Add More Data
            </a>
          </>
        )}
        {!patientId && (
          <a href="/onboarding" style={{
            backgroundColor: '#4f46e5', color: 'white', padding: '10px 20px',
            borderRadius: '8px', fontSize: '16px', fontWeight: '600', textDecoration: 'none',
          }}>
            Set Up Patient
          </a>
        )}
      </div>

      {!patientId && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 text-center">
          <p style={{ fontSize: '18px', color: '#374151' }}>No patient linked yet. Set up your patient to get started.</p>
        </div>
      )}

      {patientId && loading && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 text-center">
          <p style={{ fontSize: '18px', color: '#6b7280' }}>Loading report...</p>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <p style={{ fontSize: '16px', color: '#6b7280', textAlign: 'center' }}>{error}</p>
        </div>
      )}

      {/* Report */}
      {report && (
        <>
          {/* Summary card */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Session Summary</h2>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {report.date} · {report.duration_minutes} min
              </span>
            </div>
            <p style={{ fontSize: '17px', color: '#374151', lineHeight: '1.6' }}>{report.summary}</p>
          </div>

          {/* Mood chart */}
          <MoodChart moodTrend={report.mood_trend} />

          {/* Concern alerts */}
          {report.concerns.length > 0 && (
            <div className="mb-6">
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Concerns</h2>
              {report.concerns.map((c, i) => (
                <ConcernAlert key={i} concern={c} />
              ))}
            </div>
          )}

          {report.concerns.length === 0 && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '17px', color: '#166534' }}>No concerns flagged in this session.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
