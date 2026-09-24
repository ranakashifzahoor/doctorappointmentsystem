import 'dotenv/config'
import app from './app.js'
import connectDB from './config/mongodb.js'
import cloudinaryConnect from './config/cloudinary.js'

const port = Number(process.env.PORT || 4000)

const start = async () => {
  await connectDB()
  cloudinaryConnect()

  const server = app.listen(port, () => {
    console.log('')
    console.log(`  Prescrip API running on  http://localhost:${port}`)
    console.log(`  Health check             http://localhost:${port}/api/health`)
    console.log('')
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('')
      console.error(`  Port ${port} is already in use.`)
      console.error('  Another instance of the API (or another program) is already listening on it.')
      console.error(`  Fix: stop that process, or set PORT=4001 in backend/.env and start again.`)
      console.error('')
    } else if (err.code === 'EACCES') {
      console.error(`\n  Port ${port} needs elevated permissions. Try another PORT in backend/.env.\n`)
    } else {
      console.error('\n  Server error:', err.message, '\n')
    }
    process.exit(1)
  })
}

start().catch((err) => {
  console.error('\n  Could not start the server:')
  console.error('  ' + err.message + '\n')
  process.exit(1)
})
