import axios from 'axios'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 15000
})

const useMockValue = `${import.meta.env.VITE_USE_MOCK_API ?? 'false'}`.toLowerCase()
export const useMockApi = useMockValue === 'true' || useMockValue === '1' || useMockValue === 'yes'

export const normalizeApiError = (error, fallback = 'Something went wrong.') => {
  if (error?.response?.data?.message) return error.response.data.message
  if (typeof error?.response?.data === 'string') return error.response.data
  if (error?.message) return error.message
  return fallback
}

export default httpClient