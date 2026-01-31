import cloudinary from "../utils/cloudinary.js"
import File from "../models/File.js"
import Permission from "../models/Permission.js"

export const uploadFile = async (req,res) => {
  const result = await cloudinary.uploader.upload(req.file.path)

  const file = await File.create({
    user: req.user._id,
    url: result.secure_url,
    publicId: result.public_id,
    type: req.file.mimetype
  })

  res.json(file)
}

export const getUserFiles = async (req,res) => {
  const files = await File.find({ user: req.user._id })
  res.json(files)
}

export const deleteFile = async (req,res) => {
  const file = await File.findById(req.params.id)

  await cloudinary.uploader.destroy(file.publicId)
  await file.deleteOne()

  res.json("Deleted")
}


export const getAllFiles = async (req,res) => {
  const files = await File.find().populate("user","email")
  res.json(files)
}

export const adminDeleteFile = async (req,res) => {
  const file = await File.findById(req.params.id)

  await cloudinary.uploader.destroy(file.publicId)
  await file.deleteOne()

  res.json("Deleted by admin")
}

const hasAccess = async (userId, fileId) => {
  const perm = await Permission.findOne({
    file: fileId,
    requester: userId,
    status: "approved"
  })
  return perm
}

export const viewFile = async (req,res) => {
  const file = await File.findById(req.params.id)

  // owner can access
  if (file.user.toString() === req.user._id.toString())
    return res.json(file)

  // admin can access
  if (req.user.role === "admin")
    return res.json(file)

  // check permission
  const perm = await hasAccess(req.user._id, file._id)

  if (!perm) return res.status(403).json("No access")

  res.json(file)
}
