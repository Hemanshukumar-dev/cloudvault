import { Readable } from "stream"
import jwt from "jsonwebtoken"
import cloudinary from "../utils/cloudinary.js"
import File from "../models/File.js"
import Permission from "../models/Permission.js"
import User from "../models/User.js"

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" })
    }
    // PDFs must use resource_type "raw" so URLs are /raw/upload/ and publicly viewable; images use "image"
    const resourceType = req.file.mimetype === "application/pdf" ? "raw" : "image"
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: resourceType
    })
    
    const file = await File.create({
      user: req.user._id,
      filename: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      type: req.file.mimetype,
      size: req.file.size
    })
    
    res.json(file)
  } catch (err) {
    console.error("Upload error:", err)
    res.status(500).json({ error: "Upload failed" })
  }
}

export const getUserFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(files)
  } catch (err) {
    console.error("Get files error:", err)
    res.status(500).json({ error: "Failed to fetch files" })
  }
}

export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }
    
    const isOwner = file.user.toString() === req.user._id.toString()
    const isAdmin = req.user.role === "admin"
    let isEditor = false

    if (!isOwner && !isAdmin) {
      const perm = await Permission.findOne({
        file: file._id,
        requester: req.user._id,
        status: "approved",
        access: "edit"
      })
      if (perm) isEditor = true
    }

    if (!isOwner && !isAdmin && !isEditor) {
      return res.status(403).json({ error: "Not authorized to delete this file" })
    }
    
    // Cleanup: Delete from Cloudinary (pass resource_type for raw/PDF)
    if (file.publicId) {
        try {
            const resourceType = file.type === "application/pdf" ? "raw" : "image"
            await cloudinary.uploader.destroy(file.publicId, { resource_type: resourceType })
        } catch (cloudErr) {
            console.error("Cloudinary delete error (non-fatal):", cloudErr)
        }
    }

    // Cleanup: Delete all permissions associated with this file
    await Permission.deleteMany({ file: file._id })

    // Delete the file itself
    await file.deleteOne()
    
    res.json({ message: "File deleted successfully and active shares removed." })
  } catch (err) {
    console.error("Delete error:", err)
    res.status(500).json({ error: "Failed to delete file" })
  }
}

export const getAllFiles = async (req, res) => {
  try {
    const files = await File.find().populate("user", "email name").sort({ createdAt: -1 })
    const permissions = await Permission.find({ status: "approved" }).populate("requester", "email name")

    const filesWithPermissions = files.map(file => {
      const filePerms = permissions.filter(p => p.file.toString() === file._id.toString())
      return {
        ...file.toObject(),
        permissions: filePerms
      }
    })

    res.json(filesWithPermissions)
  } catch (err) {
    console.error("Get all files error:", err)
    res.status(500).json({ error: "Failed to fetch files" })
  }
}

export const adminDeleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }
    
    const resourceType = file.type === "application/pdf" ? "raw" : "image"
    await cloudinary.uploader.destroy(file.publicId, { resource_type: resourceType })
    await file.deleteOne()
    
    res.json({ message: "File deleted by admin" })
  } catch (err) {
    console.error("Admin delete error:", err)
    res.status(500).json({ error: "Failed to delete file" })
  }
}

const hasAccess = async (userId, fileId) => {
  const perm = await Permission.findOne({
    file: fileId,
    requester: userId,
    status: "approved"
  })
  return perm
}

export const getFileInfoForShare = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).select("filename type size")
    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }
    res.json(file)
  } catch (err) {
    console.error("Get file info error:", err)
    res.status(500).json({ error: "Failed to get file info" })
  }
}

export const viewFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate("user", "email name")
    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }
    
    // Owner can always view
    if (file.user._id.toString() === req.user._id.toString()) {
      return res.json(file)
    }
    
    // Admin can always view
    if (req.user.role === "admin") {
      return res.json(file)
    }
    
    // Check if user has approved permission
    const perm = await hasAccess(req.user._id, file._id)
    if (!perm) {
      return res.status(403).json({ error: "No access to this file" })
    }
    
    res.json(file)
  } catch (err) {
    console.error("View file error:", err)
    res.status(500).json({ error: "Failed to view file" })
  }
}

/** Resolve user from token (header or query, for view stream so window.open works). */
const getUserFromToken = async (req) => {
  const token = req.headers.authorization?.split(" ")[1] || req.query.token
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password")
    return user || null
  } catch {
    return null
  }
}

/** Stream file for inline viewing (PDF in browser). Accepts token in query for window.open. */
export const streamFileView = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    const file = await File.findById(req.params.id).populate("user", "email name")
    if (!file) return res.status(404).json({ error: "File not found" })

    const isOwner = file.user._id.toString() === user._id.toString()
    const isAdmin = user.role === "admin"
    const perm = await hasAccess(user._id, file._id)
    if (!isOwner && !isAdmin && !perm) return res.status(403).json({ error: "No access to this file" })

    if (file.type !== "application/pdf") {
      return res.redirect(302, file.url)
    }

    const fetchRes = await fetch(file.url)
    if (!fetchRes.ok) return res.status(502).json({ error: "Failed to fetch file from storage" })

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", "inline")
    Readable.fromWeb(fetchRes.body).pipe(res)
  } catch (err) {
    console.error("Stream file view error:", err)
    res.status(500).json({ error: "Failed to stream file" })
  }
}
