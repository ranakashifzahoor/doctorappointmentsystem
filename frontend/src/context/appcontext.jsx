import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../services/api'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
  const currency = 'Rs.'

  /** Format a number as "Rs. 1,500". */
  const money = (n) => `${currency} ${Number(n || 0).toLocaleString('en-PK')}`

  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [userData, setUserData] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [specialities, setSpecialities] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([])

  const getDoctors = async (params = {}) => {
    setLoadingDoctors(true)
    try {
      const { data } = await api.get('/api/doctor/list', { params })
      if (data.success) {
        setDoctors(data.data.doctors)
        setSpecialities(data.data.specialities)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load doctors')
    } finally {
      setLoadingDoctors(false)
    }
  }

  const getPaymentMethods = async () => {
    try {
      const { data } = await api.get('/api/user/payment-methods')
      if (data.success) setPaymentMethods(data.data.methods.filter((m) => m.available))
    } catch {
      /* non-fatal */
    }
  }

  const loadUserProfile = async () => {
    try {
      const { data } = await api.get('/api/user/profile')
      setUserData(data.success ? data.data.user : null)
    } catch {
      setUserData(null)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    setUserData(null)
    toast.success('Logged out')
  }

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      loadUserProfile()
    } else {
      localStorage.removeItem('token')
      setUserData(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    getDoctors()
    getPaymentMethods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = {
    backendUrl,
    currency,
    money,
    token,
    setToken,
    userData,
    setUserData,
    doctors,
    specialities,
    loadingDoctors,
    paymentMethods,
    getDoctors,
    getPaymentMethods,
    loadUserProfile,
    logout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)

export default AppContext
