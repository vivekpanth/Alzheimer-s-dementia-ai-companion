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

export default client
