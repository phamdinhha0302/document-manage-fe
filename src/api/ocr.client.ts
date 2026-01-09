import axios from 'axios'

// OCR API Client (không cần token authentication)
const ocrClient = axios.create({
    baseURL: import.meta.env.VITE_OCR_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'multipart/form-data',
    }
})

export default ocrClient
