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

export const getOwnerActiveShares = async (req, res) => {
  try {
    const active = await Permission.find({
      owner: req.user._id,
      status: "approved"
    })
      .populate("file", "filename url type")
      .populate("requester", "name email")
      .sort({ createdAt: -1 })
    res.json(active)
  } catch (err) {
    console.error("Get active shares error:", err)
    res.status(500).json({ error: "Failed to fetch active shares" })
  }
}

/** Shared With Me: paginated, excludes hidden, optional search by filename. */
export const getSharedWithMe = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 4))
    const search = (req.query.search || "").trim()
    const skip = (page - 1) * limit

    const match = {
      requester: req.user._id,
      status: "approved",
      hidden: { $ne: true }
    }

    const lookup = { $lookup: { from: "files", localField: "file", foreignField: "_id", as: "fileDoc" } }
    const unwind = { $unwind: "$fileDoc" }
    const searchMatch = search ? { $match: { "fileDoc.filename": { $regex: search, $options: "i" } } } : null

    const pipeline = [
      { $match: match },
      lookup,
      unwind,
      ...(searchMatch ? [searchMatch] : []),
      { $count: "total" }
    ]
    const countResult = await Permission.aggregate(pipeline)
    const total = countResult[0]?.total ?? 0

    const dataPipeline = [
      { $match: match },
      lookup,
      unwind,
      ...(searchMatch ? [searchMatch] : []),
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          access: 1,
          createdAt: 1,
          file: {
            _id: "$fileDoc._id",
            filename: "$fileDoc.filename",
            url: "$fileDoc.url",
            type: "$fileDoc.type",
            size: "$fileDoc.size",
            createdAt: "$fileDoc.createdAt"
          }
        }
      }
    ]
    const permissions = await Permission.aggregate(dataPipeline)

    res.json({
      permissions,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    })
  } catch (err) {
    console.error("Get shared with me error:", err)
    res.status(500).json({ error: "Failed to fetch shared files" })
  }
}

/** Remove shared file from my dashboard only (hide, no DB delete). */
export const hideFromDashboard = async (req, res) => {
  try {
    const perm = await Permission.findById(req.params.id)
    if (!perm) return res.status(404).json({ error: "Permission not found" })
    if (perm.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Can only remove from your own dashboard" })
    }
    if (perm.status !== "approved") return res.status(400).json({ error: "Not an approved share" })
    perm.hidden = true
    await perm.save()
    res.json({ message: "Removed from dashboard" })
  } catch (err) {
    console.error("Hide from dashboard error:", err)
    res.status(500).json({ error: "Failed to remove from dashboard" })
  }
}

export const revokeAccess = async (req, res) => {
  try {
    const perm = await Permission.findById(req.params.id)
    if (!perm) {
      return res.status(404).json({ error: "Permission not found" })
    }
    if (perm.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only owner can revoke access" })
    }
    
    await perm.deleteOne()
    res.json({ message: "Access revoked" })
  } catch (err) {
    console.error("Revoke access error:", err)
    res.status(500).json({ error: "Failed to revoke access" })
  }
}
