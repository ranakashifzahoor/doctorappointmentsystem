import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  timeout: 20000,
})

// pick the right token based on which API namespace the request targets
api.interceptors.request.use((config) => {
  const url = config.url || ''
  const token = url.startsWith('/api/admin')
    ? localStorage.getItem('aToken')
    : localStorage.getItem('dToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const errMsg = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'

export default api
