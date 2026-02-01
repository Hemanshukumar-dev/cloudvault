import express from "express"
import auth from "../middleware/authMiddleware.js"
import { requestAccess, approveAccess, myRequests, getOwnerRequests, rejectAccess } from "../controllers/permissionController.js"

const router = express.Router()

router.post("/request", auth, requestAccess)
router.put("/approve/:id", auth, approveAccess)
router.put("/reject/:id", auth, rejectAccess)
router.get("/my", auth, myRequests)
router.get("/owner", auth, getOwnerRequests)

export default router
