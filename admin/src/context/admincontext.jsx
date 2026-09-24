import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../services/api'

const AdminContext = createContext(null)

export const AdminProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
  const currency = 'Rs.'
  const money = (n) => `${currency} ${Number(n || 0).toLocaleString('en-PK')}`

  const [aToken, setAToken] = useState(localStorage.getItem('aToken') || '')
  const [dToken, setDToken] = useState(localStorage.getItem('dToken') || '')
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [messages, setMessages] = useState([])
  const [reviews, setReviews] = useState([])
  const [dashboard, setDashboard] = useState(null)

  const getAllDoctors = async () => {
    try {
      const { data } = await api.get('/api/admin/doctors')
      if (data.success) setDoctors(data.data.doctors)
      else toast.error(data.message)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load doctors')
    }
  }

  const getDashboard = async () => {
    try {
      const { data } = await api.get('/api/admin/dashboard')
      if (data.success) {
        setDashboard(data.data.dashboard)
        setAppointments(data.data.dashboard.latestAppointments || [])
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load dashboard')
    }
  }

  const getAllAppointments = async () => {
    try {
      const { data } = await api.get('/api/admin/appointments')
      if (data.success) setAppointments(data.data.appointments)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load appointments')
    }
  }

  const getAllMessages = async () => {
    try {
      const { data } = await api.get('/api/admin/messages')
      if (data.success) setMessages(data.data.messages)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load messages')
    }
  }

  const getAllReviews = async () => {
    try {
      const { data } = await api.get('/api/admin/reviews')
      if (data.success) setReviews(data.data.reviews)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load reviews')
    }
  }

  const getDoctorAppointments = async () => {
    try {
      const { data } = await api.get('/api/doctor/appointments')
      if (data.success) setAppointments(data.data.appointments)
      return data.data.appointments
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load appointments')
      return []
    }
  }

  const adminLogout = () => {
    localStorage.removeItem('aToken')
    setAToken('')
    toast.success('Logged out')
  }

  const doctorLogout = () => {
    localStorage.removeItem('dToken')
    setDToken('')
    toast.success('Logged out')
  }

  useEffect(() => {
    if (aToken) localStorage.setItem('aToken', aToken)
    else localStorage.removeItem('aToken')
  }, [aToken])

  useEffect(() => {
    if (dToken) localStorage.setItem('dToken', dToken)
    else localStorage.removeItem('dToken')
  }, [dToken])

  const value = {
    backendUrl,
    currency,
    money,
    aToken,
    setAToken,
    dToken,
    setDToken,
    doctors,
    setDoctors,
    appointments,
    setAppointments,
    messages,
    reviews,
    dashboard,
    getAllDoctors,
    getDashboard,
    getAllAppointments,
    getAllMessages,
    getAllReviews,
    getDoctorAppointments,
    adminLogout,
    doctorLogout,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export const useAdmin = () => useContext(AdminContext)

export default AdminContext
