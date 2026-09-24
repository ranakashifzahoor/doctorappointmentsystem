import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  timeout: 20000,
})

// attach the JWT (if any) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Pull a human-friendly message out of an axios error. */
export const errMsg = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'

export default api
