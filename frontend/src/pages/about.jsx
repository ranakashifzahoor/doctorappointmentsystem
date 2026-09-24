import { useNavigate } from 'react-router-dom'

const About = () => {
  const navigate = useNavigate()
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-semibold text-gray-800">About Prescrip</h1>
      <p className="text-gray-600 mt-5 leading-relaxed">
        Prescrip is a modern healthcare appointment platform that connects patients with trusted
        doctors across 8+ specialities. We remove the friction of phone calls and waiting rooms by
        showing real-time availability and letting you confirm a visit in seconds.
      </p>

      <div className="grid sm:grid-cols-3 gap-5 mt-10">
        {[
          { t: 'Verified doctors', d: 'Every specialist is verified before appearing in the directory.' },
          { t: 'Real availability', d: 'Slots update instantly — what you see is what you book.' },
          { t: 'Secure payments', d: 'Pay online through the gateway or choose to pay at the clinic.' },
        ].map((c) => (
          <div key={c.t} className="card p-6">
            <p className="font-medium text-gray-800">{c.t}</p>
            <p className="text-sm text-gray-500 mt-2">{c.d}</p>
          </div>
        ))}
      </div>

      <div className="bg-primary rounded-3xl px-8 py-10 text-white mt-12 flex flex-col sm:flex-row items-center justify-between gap-5">
        <p className="text-lg font-medium">Ready to see a doctor?</p>
        <button onClick={() => navigate('/doctors')} className="bg-white text-gray-800 px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition">
          Browse doctors
        </button>
      </div>
    </div>
  )
}

export default About
