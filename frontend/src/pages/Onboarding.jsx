// Onboarding page — caregiver uploads patient biography, photos, and family details
import React, { useState } from 'react'
import PhotoUpload from '../components/PhotoUpload.jsx'
import { ingestPatientData } from '../api/client.js'

export default function Onboarding() {
  const [userId, setUserId] = useState('')
  const [biography, setBiography] = useState('')
  const [familyMembers, setFamilyMembers] = useState('')
  const [favouriteTopics, setFavouriteTopics] = useState('')
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!userId.trim()) { setError('Patient ID is required.'); return }
    if (!biography.trim()) { setError('Biography is required.'); return }
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('user_id', userId.trim())
    formData.append('biography', biography.trim())
    formData.append('family_members', familyMembers.trim())
    formData.append('favourite_topics', favouriteTopics.trim())
    // Photos now have {file, description} — send files and descriptions separately
    const photoDescriptions = []
    photos.forEach((photo) => {
      formData.append('photos', photo.file)
      photoDescriptions.push(photo.description || '')
    })
    formData.append('photo_descriptions', JSON.stringify(photoDescriptions))

    try {
      const res = await ingestPatientData(formData)
      setResult(res.data)
      localStorage.setItem('patient_id', userId.trim())
    } catch (err) {
      setError('Could not save. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>Setup Complete!</p>
          <p style={{ fontSize: '20px', color: '#166534', marginTop: '12px' }}>
            {result.chunks_stored} memory chunks indexed
            {result.photos_captioned > 0 && ` · ${result.photos_captioned} photos processed`}
          </p>
          <button
            onClick={() => window.location.href = '/chat'}
            style={{
              marginTop: '32px', backgroundColor: '#4f46e5', color: 'white',
              fontSize: '22px', padding: '16px 40px', borderRadius: '12px',
              border: 'none', cursor: 'pointer', fontFamily: 'system-ui, Arial'
            }}
          >
            Start Conversation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="max-w-2xl mx-auto p-8"
      style={{ fontFamily: 'system-ui, Arial, sans-serif' }}
    >
      <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
        Patient Setup
      </h1>
      <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
        Upload your loved one's story and photos to personalise their AI companion.
      </p>

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        {/* Patient ID */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Patient ID <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. margaret_001"
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '18px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Biography */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Life Story / Biography <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            rows={6}
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            placeholder="Write about the patient's life, key memories, family, places they loved..."
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '16px', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        {/* Family Members */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Family Members
          </label>
          <input
            type="text"
            value={familyMembers}
            onChange={(e) => setFamilyMembers(e.target.value)}
            placeholder="Sarah (daughter), David (husband), Tom (son)"
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '16px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Separate names with commas</p>
        </div>

        {/* Favourite Topics */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Favourite Topics
          </label>
          <input
            type="text"
            value={favouriteTopics}
            onChange={(e) => setFavouriteTopics(e.target.value)}
            placeholder="roses, folk music, Bondi Beach, cricket"
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '16px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Separate topics with commas</p>
        </div>

        {/* Photos */}
        <PhotoUpload onFilesSelected={setPhotos} />

        {/* Error */}
        {error && (
          <p style={{ fontSize: '16px', color: '#dc2626', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', backgroundColor: loading ? '#a5b4fc' : '#4f46e5',
            color: 'white', padding: '16px', borderRadius: '10px',
            fontSize: '20px', fontWeight: '600', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, Arial'
          }}
        >
          {loading ? 'Saving & Processing...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
