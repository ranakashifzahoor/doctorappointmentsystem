import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="pb-10">
      <Header />
      <SpecialityMenu />
      <TopDoctors />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-primary rounded-3xl px-6 sm:px-12 py-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold">Book Appointment With 100+ Trusted Doctors</h3>
            <p className="text-indigo-100 text-sm mt-2">Create your account and start booking in minutes.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-gray-800 px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition shrink-0"
          >
            Create account
          </button>
        </div>
      </section>
    </div>
  )
}

export default Home
