// Centralised API client — all backend calls go through this axios instance
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const sendMessage = (userId, message, sessionId) =>
  client.post('/chat', { user_id: userId, message, session_id: sessionId })

export const ingestPatientData = (formData) =>
  client.post('/ingest', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const getReport = (userId) =>
  client.get(`/report/${userId}`)

export const getPatientInfo = (userId) =>
  client.get(`/patient/${userId}`)

export const getPatientProfile = (userId) =>
  client.get(`/patient/${userId}/profile`)

export const deletePatient = (userId) =>
  client.delete(`/patient/${userId}`)

export const linkPatientToCaregiver = (authUserId, patientUserId) =>
  client.patch('/caregiver/link', { auth_user_id: authUserId, patient_user_id: patientUserId })

export const ensureCaregiver = (authUserId, email, fullName) =>
  client.post('/caregiver/ensure', { auth_user_id: authUserId, email, full_name: fullName })

export const getCaregiverPatients = (authUserId) =>
  client.get(`/caregiver/${authUserId}/patients`)

export const addPatientToCaregiver = (authUserId, patientUserId, displayName = '') =>
  client.post('/caregiver/patients/add', { auth_user_id: authUserId, patient_user_id: patientUserId, display_name: displayName })

export const removePatientFromCaregiver = (authUserId, patientUserId) =>
  client.delete('/caregiver/patients/remove', { data: { auth_user_id: authUserId, patient_user_id: patientUserId } })

export const endSession = (userId, sessionId) =>
  client.post('/session/end', { user_id: userId, session_id: sessionId })

export default client
