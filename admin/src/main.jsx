import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import App from './App.jsx'
import { AdminProvider } from './context/AdminContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminProvider>
        <App />
        <ToastContainer position="top-center" autoClose={3000} />
      </AdminProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
