import { useNavigate } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate()

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-primary rounded-3xl px-6 sm:px-12 lg:px-16 py-12 lg:py-16 mt-6 grid lg:grid-cols-2 gap-10 items-center">
        <div className="text-white">
          <p className="uppercase tracking-widest text-xs text-indigo-100">Care that listens</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mt-3">
            Book Appointment <br />
            With Trusted Doctors
          </h1>
          <p className="text-indigo-100 text-sm mt-5 max-w-md">
            Find the right specialist, check real-time availability and confirm your appointment in
            seconds — no phone calls, no waiting.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={() => navigate('/doctors')}
              className="bg-white text-gray-800 px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition"
            >
              Book an appointment →
            </button>
            <button
              onClick={() => navigate('/about')}
              className="border border-white/40 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-white/10 transition"
            >
              Learn more
            </button>
          </div>
        </div>

        <div className="hidden lg:flex justify-center">
          <svg viewBox="0 0 320 220" className="w-full max-w-sm" role="img" aria-label="Healthcare illustration">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.75" />
              </linearGradient>
            </defs>
            <rect x="10" y="20" width="300" height="180" rx="24" fill="url(#g1)" />
            <rect x="36" y="52" width="120" height="14" rx="7" fill="#5f6FFF" opacity="0.35" />
            <rect x="36" y="80" width="180" height="10" rx="5" fill="#5f6FFF" opacity="0.2" />
            <circle cx="250" cy="96" r="42" fill="#5f6FFF" opacity="0.15" />
            <path d="M232 96h36M250 78v36" stroke="#5f6FFF" strokeWidth="10" strokeLinecap="round" />
            <path
              d="M36 150h44l10-22 14 44 12-30 10 22h60"
              fill="none"
              stroke="#5f6FFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="36" y="172" width="120" height="10" rx="5" fill="#5f6FFF" opacity="0.25" />
          </svg>
        </div>
      </div>
    </section>
  )
}

export default Header
