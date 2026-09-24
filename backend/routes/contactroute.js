import express from 'express'
import { createMessage } from '../controllers/contactController.js'

const router = express.Router()

// public contact form
router.post('/', createMessage)

export default router
