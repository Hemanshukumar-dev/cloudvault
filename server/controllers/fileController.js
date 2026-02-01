import cloudinary from "../utils/cloudinary.js"
import File from "../models/File.js"
import Permission from "../models/Permission.js"

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" })
    }
    
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto"
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

    // Debug Logs
    console.log(`[DeleteFile] Attempting delete. User: ${req.user._id}, Role: ${req.user.role}, File: ${file._id}, Owner: ${file.user}`)

    if (!isOwner && !isAdmin) {
      // Check for edit permission
      const perm = await Permission.findOne({
        file: file._id,
        requester: req.user._id,
        status: "approved",
        access: "edit"
      })
      
      console.log(`[DeleteFile] Permission Check Result:`, perm)
      
      if (perm) {
        isEditor = true
      }
    }

    if (!isOwner && !isAdmin && !isEditor) {
      console.log(`[DeleteFile] Authorization failed. isOwner: ${isOwner}, isAdmin: ${isAdmin}, isEditor: ${isEditor}`)
      return res.status(403).json({ error: "Not authorized to delete this file" })
    }
    
    // Cleanup: Delete from Cloudinary
    if (file.publicId) {
        try {
            await cloudinary.uploader.destroy(file.publicId)
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
    
    await cloudinary.uploader.destroy(file.publicId)
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
