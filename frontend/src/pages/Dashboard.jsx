// Dashboard page — caregiver view of session summary, mood chart, and concern alerts
import React, { useState, useEffect } from 'react'
import MoodChart from '../components/MoodChart.jsx'
import ConcernAlert from '../components/ConcernAlert.jsx'
import { getReport } from '../api/client.js'

export default function Dashboard() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(localStorage.getItem('patient_id') || '')
  const [inputId, setInputId] = useState(localStorage.getItem('patient_id') || '')
  const [error, setError] = useState('')

  const fetchReport = async (id) => {
    if (!id.trim()) { setError('Enter a patient ID.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await getReport(id.trim())
      setReport(res.data)
      setUserId(id.trim())
      localStorage.setItem('patient_id', id.trim())
    } catch (err) {
      setError('Could not load report. Check the patient ID and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) fetchReport(userId)
  }, [])

  return (
    <div
      className="max-w-3xl mx-auto p-8"
      style={{ fontFamily: 'system-ui, Arial, sans-serif' }}
    >
      <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>
        Caregiver Dashboard
      </h1>

      {/* Patient ID lookup */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
          Patient ID
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="e.g. margaret_001"
            style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '18px' }}
          />
          <button
            onClick={() => fetchReport(inputId)}
            disabled={loading}
            style={{
              backgroundColor: '#4f46e5', color: 'white', padding: '10px 24px',
              borderRadius: '8px', fontSize: '16px', fontWeight: '600',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Loading...' : 'Load Report'}
          </button>
        </div>
        {error && (
          <p style={{ fontSize: '15px', color: '#dc2626', marginTop: '8px' }}>{error}</p>
        )}
      </div>

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
