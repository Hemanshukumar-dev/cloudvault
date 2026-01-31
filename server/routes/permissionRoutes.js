import express from "express"
import auth from "../middleware/authMiddleware.js"
import { requestAccess, approveAccess, myRequests } from "../controllers/permissionController.js"

const router = express.Router()

router.post("/request", auth, requestAccess)
router.put("/approve/:id", auth, approveAccess)
router.get("/my", auth, myRequests)

export default router
