import Permission from "../models/Permission.js"
import File from "../models/File.js"

export const requestAccess = async (req, res) => {
  try {
    const { fileId, access } = req.body
    const requesterId = req.user._id

    if (!fileId) {
      return res.status(400).json({ error: "fileId required" })
    }
    const accessType = access === "edit" ? "edit" : "view"

    const file = await File.findById(fileId)
    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }

    const ownerId = file.user
    if (ownerId.toString() === requesterId.toString()) {
      return res.status(400).json({ error: "Owner cannot request access to own file" })
    }

    const existing = await Permission.findOne({
      file: fileId,
      requester: requesterId
    })
    if (existing) {
      return res.status(400).json({ error: "Request already exists" })
    }

    const perm = await Permission.create({
      file: fileId,
      owner: ownerId,
      requester: requesterId,
      access: accessType,
      status: "pending"
    })

    const populated = await Permission.findById(perm._id)
      .populate("file", "filename url type")
      .populate("requester", "name email")
    res.json(populated)
  } catch (err) {
    console.error("Request access error:", err)
    res.status(500).json({ error: "Failed to request access" })
  }
}

export const approveAccess = async (req, res) => {
  try {
    const perm = await Permission.findById(req.params.id)
    if (!perm) {
      return res.status(404).json({ error: "Request not found" })
    }
    
    if (perm.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only owner can approve" })
    }
    
    perm.status = "approved"
    perm.access = req.body.access === "edit" ? "edit" : "view"
    await perm.save()
    
    const populated = await Permission.findById(perm._id)
      .populate("file", "filename url type")
      .populate("requester", "name email")
    
    res.json(populated)
  } catch (err) {
    console.error("Approve access error:", err)
    res.status(500).json({ error: "Failed to approve access" })
  }
}

export const myRequests = async (req, res) => {
  try {
    const reqs = await Permission.find({ requester: req.user._id })
      .populate("file", "filename url type")
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
    res.json(reqs)
  } catch (err) {
    console.error("Get requests error:", err)
    res.status(500).json({ error: "Failed to fetch requests" })
  }
}

export const getPendingRequests = async (req, res) => {
  try {
    const reqs = await Permission.find({
      owner: req.user._id,
      status: "pending"
    })
      .populate("file", "filename url type")
      .populate("requester", "name email")
      .sort({ createdAt: -1 })
    res.json(reqs)
  } catch (err) {
    console.error("Get pending requests error:", err)
    res.status(500).json({ error: "Failed to fetch pending requests" })
  }
}

export const getOwnerRequests = async (req, res) => {
  try {
    const reqs = await Permission.find({
      owner: req.user._id,
      status: "pending"
    })
      .populate("file", "filename url type")
      .populate("requester", "name email")
      .sort({ createdAt: -1 })
    res.json(reqs)
  } catch (err) {
    console.error("Get owner requests error:", err)
    res.status(500).json({ error: "Failed to fetch access requests" })
  }
}

export const rejectAccess = async (req, res) => {
  try {
    const perm = await Permission.findById(req.params.id)
    if (!perm) {
      return res.status(404).json({ error: "Request not found" })
    }
    if (perm.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only owner can reject" })
    }
    perm.status = "rejected"
    await perm.save()
    res.json({ message: "Request rejected" })
  } catch (err) {
    console.error("Reject access error:", err)
    res.status(500).json({ error: "Failed to reject request" })
  }
}
