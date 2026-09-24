import 'dotenv/config'
import app from './app.js'
import connectDB from './config/mongodb.js'
import cloudinaryConnect from './config/cloudinary.js'

const port = process.env.PORT || 4000

const start = async () => {
  await connectDB()
  cloudinaryConnect()
  app.listen(port, () => console.log(`Server running on port ${port}`))
}

start()
