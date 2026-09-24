import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Doctors from './pages/Doctors'
import Appointment from './pages/Appointment'
import MyAppointments from './pages/MyAppointments'
import MyProfile from './pages/MyProfile'
import About from './pages/About'
import Contact from './pages/Contact'
import Verify from './pages/Verify'
import NotFound from './pages/NotFound'

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Login />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:speciality" element={<Doctors />} />
      <Route path="/appointment/:doctorId" element={<Appointment />} />
      <Route path="/my-appointments" element={<MyAppointments />} />
      <Route path="/my-profile" element={<MyProfile />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
)

export default App
