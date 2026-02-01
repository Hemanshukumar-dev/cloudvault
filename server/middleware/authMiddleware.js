import jwt from "jsonwebtoken"
import User from "../models/User.js"

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) return res.status(401).json("No token")

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password")
    if (!user) return res.status(401).json("User not found")
    req.user = user
    next()
  } catch {
    res.status(401).json("Invalid token")
  }
}

export default authMiddleware
