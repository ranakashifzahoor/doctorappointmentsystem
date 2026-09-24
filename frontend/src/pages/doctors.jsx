import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import DoctorCard from '../components/DoctorCard'

const Doctors = () => {
  const { speciality } = useParams()
  const { doctors, specialities, loadingDoctors } = useApp()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { setShowFilters(false) }, [speciality])

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const bySpec = !speciality || d.speciality === speciality
      const q = search.trim().toLowerCase()
      const bySearch = !q || d.name.toLowerCase().includes(q) || d.speciality.toLowerCase().includes(q)
      return bySpec && bySearch
    })
  }, [doctors, speciality, search])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-gray-800">
        {speciality ? `Browse: ${speciality}` : 'All Doctors'}
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Browse through our list of trusted doctors and book your appointment.
      </p>

      <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctor by name or speciality…"
          className="input sm:max-w-sm"
        />
        <button className="btn-outline sm:hidden" onClick={() => setShowFilters((s) => !s)}>
          {showFilters ? 'Hide filters' : 'Show filters'}
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* speciality filter */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/doctors')}
              className={`text-left text-sm px-3 py-2 rounded-lg border ${!speciality ? 'border-primary text-primary bg-indigo-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              All Specialities
            </button>
            {specialities.map((s) => (
              <button
                key={s}
                onClick={() => navigate(s === speciality ? '/doctors' : `/doctors/${s}`)}
                className={`text-left text-sm px-3 py-2 rounded-lg border ${speciality === s ? 'border-primary text-primary bg-indigo-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </aside>

        {/* results */}
        <section>
          {loadingDoctors ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100 rounded-xl" />
                  <div className="h-3 bg-gray-100 rounded mt-4 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded mt-2 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-10 text-center text-gray-500">
              No doctors found for this filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((d) => <DoctorCard key={d._id} doctor={d} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Doctors
