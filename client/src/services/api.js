import axios from "axios"

const baseURL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : "https://cloudvault-bcpk.onrender.com/api"

const API = axios.create({ baseURL })
export { baseURL }

// attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token")

  if (token) {
    req.headers.Authorization = `Bearer ${token}`
  }

  return req
})

export default API
