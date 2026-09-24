import { Link } from 'react-router-dom'

const Footer = () => (
  <footer className="mt-24 bg-gray-50 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-3">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-9 h-9 rounded-xl bg-primary text-white grid place-items-center font-bold">P</span>
          <span className="text-xl font-semibold text-gray-800">Prescrip</span>
        </div>
        <p className="text-sm text-gray-600 max-w-xs">
          Book appointments with trusted doctors across specialities — quick, transparent and secure.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-4">Company</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/" className="link-muted">Home</Link></li>
          <li><Link to="/about" className="link-muted">About us</Link></li>
          <li><Link to="/doctors" className="link-muted">Find doctors</Link></li>
          <li><Link to="/contact" className="link-muted">Contact us</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-4">Get in touch</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>+92 300 1234567</li>
          <li>support@prescrip.com</li>
          <li>Mon–Sat, 9:00 – 21:00</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-gray-200 py-5 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} Prescrip. All rights reserved.
    </div>
  </footer>
)

export default Footer
