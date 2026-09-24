import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="text-center">
        <p className="text-6xl font-semibold text-primary">404</p>
        <p className="text-gray-600 mt-3">The page you are looking for does not exist.</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6">Back to home</button>
      </div>
    </div>
  )
}

export default NotFound
