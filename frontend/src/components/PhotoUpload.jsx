// Photo upload component — drag-and-drop with per-photo caregiver descriptions
import React, { useState, useRef } from 'react'

export default function PhotoUpload({ onFilesSelected }) {
  const [photos, setPhotos] = useState([]) // [{file, description}]
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  const addPhotos = (newFiles) => {
    const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    const newPhotos = imageFiles.map(file => ({ file, description: '' }))
    const updated = [...photos, ...newPhotos]
    setPhotos(updated)
    if (onFilesSelected) onFilesSelected(updated)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addPhotos(e.dataTransfer.files)
  }

  const handleFileInput = (e) => {
    addPhotos(e.target.files)
    e.target.value = '' // allow re-selecting same file
  }

  const updateDescription = (index, desc) => {
    const updated = photos.map((p, i) => i === index ? { ...p, description: desc } : p)
    setPhotos(updated)
    if (onFilesSelected) onFilesSelected(updated)
  }

  const removePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index)
    setPhotos(updated)
    if (onFilesSelected) onFilesSelected(updated)
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
        Photos
      </label>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
        Upload photos of the patient, family, and meaningful places. Add a description to each photo so the companion knows who and what is in it.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed', borderRadius: '12px', padding: '32px',
          textAlign: 'center', cursor: 'pointer', marginBottom: '16px',
          borderColor: dragging ? '#4f46e5' : '#d1d5db',
          backgroundColor: dragging ? '#eef2ff' : '#f9fafb',
        }}
      >
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Drag and drop photos here, or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {/* Photo list with descriptions */}
      {photos.map((photo, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: '12px', alignItems: 'flex-start',
            backgroundColor: '#f9fafb', borderRadius: '10px', padding: '12px',
            marginBottom: '12px', border: '1px solid #e5e7eb',
          }}
        >
          {/* Thumbnail */}
          <img
            src={URL.createObjectURL(photo.file)}
            alt={`Photo ${i + 1}`}
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
          />

          {/* Description input */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
              {photo.file.name}
            </p>
            <input
              type="text"
              value={photo.description}
              onChange={(e) => updateDescription(i, e.target.value)}
              placeholder="Who is in this photo? Where and when was it taken?"
              style={{
                width: '100%', border: '1px solid #d1d5db', borderRadius: '6px',
                padding: '8px 10px', fontSize: '14px', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Remove button */}
          <button
            onClick={() => removePhoto(i)}
            style={{
              backgroundColor: 'transparent', border: 'none', color: '#9ca3af',
              fontSize: '20px', cursor: 'pointer', padding: '4px 8px', flexShrink: 0,
            }}
            aria-label="Remove photo"
          >
            ✕
          </button>
        </div>
      ))}

      {photos.length > 0 && (
        <p style={{ fontSize: '13px', color: '#6b7280' }}>{photos.length} photo(s) — add descriptions for better conversations</p>
      )}
    </div>
  )
}
