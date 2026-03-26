// Photo upload component — drag-and-drop interface for uploading patient photos
import React, { useState } from 'react'

export default function PhotoUpload({ onFilesSelected }) {
  /** Drag-and-drop photo uploader that collects image files for the ingestion pipeline */
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    /** Handle file drop event and update the selected file list */
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    const updated = [...files, ...dropped]
    setFiles(updated)
    if (onFilesSelected) onFilesSelected(updated)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <p className="text-gray-500">Drag and drop photos here</p>
        <p className="text-sm text-gray-400 mt-1">{files.length} photo(s) selected</p>
      </div>
    </div>
  )
}
