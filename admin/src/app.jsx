import { Routes, Route, Navigate } from 'react-router-dom'
import DoctorLayout from './components/DoctorLayout'
import DoctorLogin from './pages/DoctorLogin'
import DoctorSignup from './pages/DoctorSignup'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorAppointments from './pages/DoctorAppointments'
import DoctorProfile from './pages/DoctorProfile'

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/doctor/login" replace />} />

    <Route path="/doctor/login" element={<DoctorLogin />} />
    <Route path="/doctor/signup" element={<DoctorSignup />} />
    <Route element={<DoctorLayout />}>
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor/appointments" element={<DoctorAppointments />} />
      <Route path="/doctor/profile" element={<DoctorProfile />} />
    </Route>

    <Route path="*" element={<Navigate to="/doctor/login" replace />} />
  </Routes>
)

export default App
