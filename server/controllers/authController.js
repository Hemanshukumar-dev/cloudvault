import User from "../models/User.js"
import File from "../models/File.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import normalizeEmail from "../utils/emailNormalize.js"

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password required" })
    }
    const emailNorm = normalizeEmail(email)
    if (!emailNorm) {
      return res.status(400).json({ error: "Please enter a valid email address" })
    }
    const existing = await User.findOne({ email: emailNorm })
    if (existing) {
      return res.status(400).json({ error: "Email already in use" })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email: emailNorm, password: hashed })
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET)
    const safeUser = user.toJSON ? user.toJSON() : user
    res.json({ token, user: safeUser })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already in use" })
    }
    console.error("Signup error:", err)
    res.status(500).json({ error: "Signup failed" })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }
    const emailNorm = normalizeEmail(email)
    const user = await User.findOne({ email: emailNorm })
    if (!user) {
      return res.status(400).json({ error: "User not found" })
    }
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(400).json({ error: "Wrong password" })
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET)
    const safeUser = user.toJSON ? user.toJSON() : { _id: user._id, name: user.name, email: user.email, role: user.role }
    res.json({ token, user: safeUser })
  } catch (err) {
    res.status(500).json({ error: "Login failed" })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 })
    const usersWithFiles = await Promise.all(users.map(async (user) => {
      const files = await File.find({ user: user._id }).select("filename size createdAt type url")
      return {
        ...user.toJSON(),
        files
      }
    }))
    res.json(usersWithFiles)
  } catch (err) {
    console.error("Get Users error:", err)
    res.status(500).json({ error: "Failed to fetch users" })
  }
}
