// Patient management page — list all patients, view details, select for chat, add or delete
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getPatientInfo, getPatientProfile, deletePatient } from '../api/client.js'

export default function PatientManagement() {
  const { caregiver, patients, patientId, linkPatient, removePatientLink, logout } = useAuth()
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)        // { info, profile, photoMemories }
  const [detailLoading, setDetailLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)  // patient_user_id to delete
  const [confirmRemove, setConfirmRemove] = useState(null)  // patient_user_id to unlink
  const [deleting, setDeleting] = useState(false)
  const [showBio, setShowBio] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId])

  async function loadDetail(pid) {
    setDetailLoading(true)
    setDetail(null)
    try {
      const [infoRes, profileRes] = await Promise.all([
        getPatientInfo(pid),
        getPatientProfile(pid),
      ])
      setDetail({
        info: infoRes.data,
        profile: profileRes.data.profile,
        photoMemories: profileRes.data.photo_memories || [],
      })
    } catch {
      setError('Could not load patient details.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleSelectForChat(pid) {
    try {
      await linkPatient(pid)
    } catch {
      setError('Could not select patient. Please try again.')
    }
  }

  async function handleRemove(pid) {
    setDeleting(true)
    try {
      await removePatientLink(pid)
      setConfirmRemove(null)
      if (selectedId === pid) setSelectedId(null)
    } catch {
      setError('Could not remove patient. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeleteAll(pid) {
    setDeleting(true)
    try {
      await deletePatient(pid)
      await removePatientLink(pid)
      setConfirmDelete(null)
      if (selectedId === pid) setSelectedId(null)
    } catch {
      setError('Could not delete patient. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const s = {
    card: { backgroundColor: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '12px' },
    label: { fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 },
    tag: { display: 'inline-block', backgroundColor: '#ede9fe', color: '#5b21b6', borderRadius: '20px', padding: '3px 10px', fontSize: '13px', marginRight: '6px', marginBottom: '6px' },
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          {selectedId
            ? <button onClick={() => { setSelectedId(null); setShowBio(false); setError('') }} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '16px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>← All Patients</button>
            : <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>My Patients</h1>
          }
          {caregiver && !selectedId && (
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{caregiver.full_name} · {caregiver.email}</p>
          )}
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      {error && <p style={{ fontSize: '14px', color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' }}>{error}</p>}

      {/* ── LIST VIEW ── */}
      {!selectedId && (
        <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <a
              href="/onboarding"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#4f46e5', color: 'white', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', textDecoration: 'none' }}
            >
              + Add New Patient
            </a>
            {patientId && (
              <a
                href="/dashboard"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: 'white', color: '#4f46e5', padding: '14px 18px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', border: '2px solid #4f46e5', whiteSpace: 'nowrap' }}
              >
                📊 Reports
              </a>
            )}
          </div>

          {patients.length === 0 ? (
            <div style={{ ...s.card, padding: '48px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>No patients yet</h2>
              <p style={{ fontSize: '15px', color: '#6b7280' }}>Add a patient above to get started.</p>
            </div>
          ) : (
            patients.map(p => (
              <div key={p.patient_user_id} style={{ ...s.card, borderLeft: p.is_active ? '4px solid #4f46e5' : '4px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                        {p.display_name || p.patient_user_id}
                      </p>
                      {p.is_active && (
                        <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#ede9fe', color: '#4f46e5', borderRadius: '20px', padding: '2px 10px' }}>
                          ACTIVE FOR CHAT
                        </span>
                      )}
                    </div>
                    {p.display_name && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0', fontFamily: 'monospace' }}>{p.patient_user_id}</p>
                    )}
                    <p style={{ fontSize: '12px', color: '#d1d5db', margin: '4px 0 0' }}>
                      Added {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {!p.is_active && (
                    <button
                      onClick={() => handleSelectForChat(p.patient_user_id)}
                      style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Select for Chat
                    </button>
                  )}
                  {p.is_active && (
                    <a href="/chat" style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>
                      Open Companion
                    </a>
                  )}
                  <button
                    onClick={() => { setSelectedId(p.patient_user_id); setShowBio(false); setError('') }}
                    style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => setConfirmRemove(p.patient_user_id)}
                    style={{ backgroundColor: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>

                {/* Confirm remove (unlink only) */}
                {confirmRemove === p.patient_user_id && (
                  <div style={{ marginTop: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px' }}>
                    <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 10px' }}>
                      Remove <strong>{p.patient_user_id}</strong> from your list? Their memories and sessions are kept.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleRemove(p.patient_user_id)} disabled={deleting} style={{ flex: 1, backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
                        {deleting ? 'Removing…' : 'Yes, Remove'}
                      </button>
                      <button onClick={() => setConfirmRemove(null)} style={{ flex: 1, backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* ── DETAIL VIEW ── */}
      {selectedId && (
        <>
          {detailLoading && <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading patient details…</div>}

          {detail && (
            <>
              {/* Stats */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {[
                  { val: detail.info?.chunks_stored ?? '—', label: 'Memory chunks' },
                  { val: detail.photoMemories.length, label: 'Photos' },
                  { val: detail.info?.sessions_count ?? '—', label: 'Conversations' },
                ].map(({ val, label }) => (
                  <div key={label} style={{ ...s.card, flex: 1, marginBottom: 0, textAlign: 'center' }}>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4f46e5', margin: 0 }}>{val}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Patient ID */}
              <div style={s.card}>
                <p style={s.label}>Patient ID</p>
                <p style={{ fontSize: '17px', fontFamily: 'monospace', fontWeight: '600', color: '#111827', margin: '4px 0 0' }}>{selectedId}</p>
                {patients.find(p => p.patient_user_id === selectedId)?.is_active && (
                  <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#ede9fe', color: '#4f46e5', borderRadius: '20px', padding: '2px 10px', marginTop: '8px', display: 'inline-block' }}>ACTIVE FOR CHAT</span>
                )}
              </div>

              {detail.profile ? (
                <>
                  {/* Biography */}
                  <div style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <p style={s.label}>Life Story / Biography</p>
                      <button onClick={() => setShowBio(v => !v)} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                        {showBio ? 'Show less' : 'Show full'}
                      </button>
                    </div>
                    <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {showBio ? detail.profile.biography_text : (detail.profile.biography_text?.length > 220 ? detail.profile.biography_text.slice(0, 220) + '…' : detail.profile.biography_text)}
                    </p>
                  </div>

                  {detail.profile.family_members?.length > 0 && (
                    <div style={s.card}>
                      <p style={{ ...s.label, marginBottom: '10px' }}>Family Members</p>
                      {detail.profile.family_members.map((m, i) => <span key={i} style={s.tag}>{m}</span>)}
                    </div>
                  )}

                  {detail.profile.favourite_topics?.length > 0 && (
                    <div style={s.card}>
                      <p style={{ ...s.label, marginBottom: '10px' }}>Favourite Topics</p>
                      {detail.profile.favourite_topics.map((t, i) => <span key={i} style={{ ...s.tag, backgroundColor: '#fef3c7', color: '#92400e' }}>{t}</span>)}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ ...s.card, color: '#6b7280', fontSize: '14px' }}>
                  No profile details — use "Add More Memories" to update.
                </div>
              )}

              {detail.photoMemories.length > 0 && (
                <div style={s.card}>
                  <p style={{ ...s.label, marginBottom: '12px' }}>Photo Memories ({detail.photoMemories.length})</p>
                  {detail.photoMemories.map((p, i) => (
                    <div key={i} style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px', fontWeight: '600' }}>
                        Photo {i + 1}{p.metadata?.caregiver_description ? ' — ' + p.metadata.caregiver_description : ''}
                      </p>
                      <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.5' }}>{p.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                {!patients.find(p => p.patient_user_id === selectedId)?.is_active && (
                  <button onClick={() => handleSelectForChat(selectedId)} style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
                    Select for Chat
                  </button>
                )}
                {patients.find(p => p.patient_user_id === selectedId)?.is_active && (
                  <a href="/chat" style={{ display: 'block', backgroundColor: '#4f46e5', color: 'white', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' }}>
                    Open Companion for Patient
                  </a>
                )}
                <a href="/dashboard" style={{ display: 'block', backgroundColor: 'white', color: '#4f46e5', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', textAlign: 'center', border: '2px solid #4f46e5' }}>
                  View Session Reports & Dashboard
                </a>
                <a href="/update-patient" style={{ display: 'block', backgroundColor: 'white', color: '#374151', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', textAlign: 'center', border: '1px solid #d1d5db' }}>
                  Add More Memories / Photos
                </a>
              </div>

              {/* Danger zone */}
              <div style={{ marginTop: '24px', borderTop: '1px solid #f3f4f6', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Remove from list only */}
                {confirmRemove !== selectedId ? (
                  <button onClick={() => setConfirmRemove(selectedId)} style={{ backgroundColor: 'white', color: '#6b7280', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                    Remove from My List (keep data)
                  </button>
                ) : (
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                    <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 12px' }}>Remove from your list? Their memories and sessions are kept — you can re-add them later.</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleRemove(selectedId)} disabled={deleting} style={{ flex: 1, backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>{deleting ? 'Removing…' : 'Yes, Remove'}</button>
                      <button onClick={() => setConfirmRemove(null)} style={{ flex: 1, backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Delete all data */}
                {confirmDelete !== selectedId ? (
                  <button onClick={() => setConfirmDelete(selectedId)} style={{ backgroundColor: 'white', color: '#dc2626', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: '1px solid #fecaca', cursor: 'pointer' }}>
                    Delete Patient & All Data
                  </button>
                ) : (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px' }}>
                    <p style={{ fontSize: '14px', color: '#991b1b', fontWeight: '600', margin: '0 0 4px' }}>This permanently deletes all memories, photos, and conversations for <strong>{selectedId}</strong>.</p>
                    <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 12px' }}>This cannot be undone.</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleDeleteAll(selectedId)} disabled={deleting} style={{ flex: 1, backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>{deleting ? 'Deleting…' : 'Yes, Delete Everything'}</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
