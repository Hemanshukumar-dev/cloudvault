import User from "../models/User.js"
import bcrypt from "bcrypt"
import normalizeEmail from "../utils/emailNormalize.js"

// Super admin is stored as lowercase (all emails normalized)
const SUPER_ADMIN_EMAIL = "beast@gmail.com"

// Returns the _id of the single designated super admin (email stored lowercase)
const getSuperAdminId = async () => {
  const superAdmin = await User.findOne({
    role: "admin",
    email: SUPER_ADMIN_EMAIL
  }).select("_id")
  return superAdmin?._id?.toString() || null
}

// Get all admins; only the account with email "beast@gmail.com" (normalized) is marked as super admin
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password").sort({ createdAt: 1 })
    const superAdminId = await getSuperAdminId()
    const withFlag = admins.map((a) => ({
      ...a.toObject(),
      isSuperAdmin: superAdminId && a._id.toString() === superAdminId
    }))
    res.json(withFlag)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admins" })
  }
}

// Create new admin (email normalized: lowercase + trim; uniqueness by normalized email)
export const createAdmin = async (req, res) => {
  const { email, password } = req.body
  try {
    const emailNorm = normalizeEmail(email)
    if (!emailNorm) {
      return res.status(400).json({ error: "Please enter a valid email address" })
    }
    const existingUser = await User.findOne({ email: emailNorm })
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newAdmin = await User.create({
      name: emailNorm.split("@")[0],
      email: emailNorm,
      password: hashedPassword,
      role: "admin"
    })

    res.status(201).json({ message: "Admin created successfully", admin: { id: newAdmin._id, email: newAdmin.email } })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already in use" })
    }
    res.status(500).json({ error: "Failed to create admin" })
  }
}

// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id)
    if (!admin) return res.status(404).json({ error: "Admin not found" })

    // Block only if this exact user's email is "Beast@gmail.com" (case-sensitive)
    if (admin.email === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: "Cannot delete the Super Admin" })
    }

    await admin.deleteOne()
    res.json({ message: "Admin deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete admin" })
  }
}

// Demote admin to user
export const demoteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id)
    if (!admin) return res.status(404).json({ error: "Admin not found" })

    // Block only if this exact user's email is "Beast@gmail.com" (case-sensitive)
    if (admin.email === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: "Cannot demote the Super Admin" })
    }

    admin.role = "user"
    await admin.save()

    res.json({ message: "Admin demoted to user successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to demote admin" })
  }
}
