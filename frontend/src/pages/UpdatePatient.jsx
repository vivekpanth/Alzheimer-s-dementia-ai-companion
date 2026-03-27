// Update patient page — caregiver adds more biography, photos, or family details to existing patient
import React, { useState } from 'react'
import PhotoUpload from '../components/PhotoUpload.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ingestPatientData } from '../api/client.js'

export default function UpdatePatient() {
  const { patientId } = useAuth()
  const [biography, setBiography] = useState('')
  const [familyMembers, setFamilyMembers] = useState('')
  const [favouriteTopics, setFavouriteTopics] = useState('')
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!biography.trim() && photos.length === 0 && !familyMembers.trim() && !favouriteTopics.trim()) {
      setError('Please add at least some new information — biography text, photos, family members, or topics.')
      return
    }
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('user_id', patientId)
    formData.append('biography', biography.trim())
    formData.append('family_members', familyMembers.trim())
    formData.append('favourite_topics', favouriteTopics.trim())

    const photoDescriptions = []
    photos.forEach((photo) => {
      formData.append('photos', photo.file)
      photoDescriptions.push(photo.description || '')
    })
    formData.append('photo_descriptions', JSON.stringify(photoDescriptions))

    try {
      const res = await ingestPatientData(formData)
      setResult(res.data)
    } catch (err) {
      setError('Could not save. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!patientId) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center" style={{ fontFamily: 'system-ui, Arial, sans-serif' }}>
        <p style={{ fontSize: '20px', color: '#374151', marginBottom: '16px' }}>
          No patient linked to your account yet.
        </p>
        <a
          href="/onboarding"
          style={{
            display: 'inline-block', backgroundColor: '#4f46e5', color: 'white',
            padding: '14px 32px', borderRadius: '10px', fontSize: '18px',
            fontWeight: '600', textDecoration: 'none',
          }}
        >
          Set Up Patient First
        </a>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>Update Saved!</p>
          <p style={{ fontSize: '20px', color: '#166534', marginTop: '12px' }}>
            {result.chunks_stored > 0 && `${result.chunks_stored} new memory chunks added`}
            {result.chunks_stored > 0 && result.photos_captioned > 0 && ' · '}
            {result.photos_captioned > 0 && `${result.photos_captioned} photos processed`}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setResult(null); setBiography(''); setFamilyMembers(''); setFavouriteTopics(''); setPhotos([]) }}
              style={{
                backgroundColor: '#4f46e5', color: 'white', fontSize: '18px',
                padding: '14px 28px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontFamily: 'system-ui, Arial',
              }}
            >
              Add More
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              style={{
                backgroundColor: 'white', color: '#4f46e5', fontSize: '18px',
                padding: '14px 28px', borderRadius: '10px', border: '2px solid #4f46e5',
                cursor: 'pointer', fontFamily: 'system-ui, Arial',
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8" style={{ fontFamily: 'system-ui, Arial, sans-serif' }}>
      <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
        Add More Information
      </h1>
      <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
        Patient: <strong>{patientId}</strong>
      </p>
      <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
        Add new memories, photos, or details. This will be added to the existing data — nothing is overwritten.
      </p>

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Additional Life Story / Memories
          </label>
          <textarea
            rows={5}
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            placeholder="Add new stories, memories, recent events, or details you'd like the companion to know..."
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '16px', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Additional Family Members
          </label>
          <input
            type="text"
            value={familyMembers}
            onChange={(e) => setFamilyMembers(e.target.value)}
            placeholder="e.g. Emma (granddaughter), Max (dog)"
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '16px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Separate names with commas</p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Additional Favourite Topics
          </label>
          <input
            type="text"
            value={favouriteTopics}
            onChange={(e) => setFavouriteTopics(e.target.value)}
            placeholder="e.g. knitting, old movies, afternoon tea"
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '16px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Separate topics with commas</p>
        </div>

        <PhotoUpload onFilesSelected={setPhotos} />

        {error && (
          <p style={{ fontSize: '16px', color: '#dc2626', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', backgroundColor: loading ? '#a5b4fc' : '#4f46e5',
            color: 'white', padding: '16px', borderRadius: '10px',
            fontSize: '20px', fontWeight: '600', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, Arial',
          }}
        >
          {loading ? 'Saving...' : 'Save New Information'}
        </button>
      </div>
    </div>
  )
}
