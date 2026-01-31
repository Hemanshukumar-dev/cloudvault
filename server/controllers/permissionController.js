import Permission from "../models/Permission.js"

// request access
export const requestAccess = async (req,res) => {
  const { fileId } = req.body

  const perm = await Permission.create({
    file: fileId,
    owner: req.body.ownerId,
    requester: req.user._id
  })

  res.json(perm)
}

// owner approves
export const approveAccess = async (req,res) => {
  const perm = await Permission.findById(req.params.id)

  perm.status = "approved"
  perm.access = req.body.access || "view"

  await perm.save()

  res.json(perm)
}

// view my requests
export const myRequests = async (req,res) => {
  const reqs = await Permission.find({ requester: req.user._id })
  res.json(reqs)
}
