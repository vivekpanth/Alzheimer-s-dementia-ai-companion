// Onboarding page — caregiver uploads patient biography, photos, and family details
import React, { useState } from 'react'
import PhotoUpload from '../components/PhotoUpload.jsx'
import { ingestPatientData } from '../api/client.js'

export default function Onboarding() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    /** Submit onboarding form data to the ingest API */
    setLoading(true)
    // TODO Phase 3: build full form and call ingestPatientData()
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Setup</h1>
      <p className="text-gray-600 mb-8">Upload your loved one's story and photos to personalise their AI companion.</p>
      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
          <input type="text" placeholder="e.g. margaret_001" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Life Story / Biography</label>
          <textarea rows={5} placeholder="Write about the patient's life, key memories, family..." className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" />
        </div>
        <PhotoUpload />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
        {submitted && <p className="text-green-600 text-sm text-center">Setup complete — pipeline will connect in Phase 2</p>}
      </div>
    </div>
  )
}
