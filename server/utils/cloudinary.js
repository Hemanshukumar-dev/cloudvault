import { v2 as cloudinary } from "cloudinary"

// Validate environment variables
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME
const api_key = process.env.CLOUDINARY_API_KEY
const api_secret = process.env.CLOUDINARY_API_SECRET

if (!cloud_name || !api_key || !api_secret) {
  console.error("❌ Cloudinary configuration error:")
  console.error("CLOUDINARY_CLOUD_NAME:", cloud_name || "MISSING")
  console.error("CLOUDINARY_API_KEY:", api_key || "MISSING")
  console.error("CLOUDINARY_API_SECRET:", api_secret ? "SET" : "MISSING")
  throw new Error("Missing Cloudinary credentials in environment variables")
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
})

console.log("✅ Cloudinary configured successfully")

export default cloudinary
