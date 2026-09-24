import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api, { errMsg } from '../services/api'
import { useApp } from '../context/AppContext'

/**
 * Landing page for gateway redirects (e.g. Razorpay callback URL).
 * Verifies the payment server-side before showing success.
 */
const Verify = () => {
  const [params] = useSearchParams()
  const { token, loadUserProfile } = useApp()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your payment…')

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Please login to verify your payment.')
        return
      }
      const appointmentId = params.get('appointmentId')
      if (!appointmentId) {
        setStatus('error')
        setMessage('Missing appointment reference.')
        return
      }
      try {
        const { data } = await api.post('/api/user/verify-payment', {
          appointmentId,
          razorpay_order_id: params.get('razorpay_order_id'),
          razorpay_payment_id: params.get('razorpay_payment_id'),
          razorpay_signature: params.get('razorpay_signature'),
          paymentId: params.get('paymentId'),
        })
        if (data.success) {
          setStatus('success')
          setMessage('Payment verified — your appointment is confirmed.')
          loadUserProfile()
        } else {
          setStatus('error')
          setMessage(data.message)
        }
      } catch (error) {
        setStatus('error')
        setMessage(errMsg(error))
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const color = status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-500' : 'text-gray-600'

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="card p-10 text-center max-w-md w-full">
        <div className={`text-5xl ${color}`}>{status === 'success' ? '✓' : status === 'error' ? '✕' : '⏳'}</div>
        <p className={`mt-4 text-sm ${color}`}>{message}</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={() => navigate('/my-appointments')} className="btn-primary">My appointments</button>
          <button onClick={() => navigate('/')} className="btn-outline">Home</button>
        </div>
      </div>
    </div>
  )
}

export default Verify
