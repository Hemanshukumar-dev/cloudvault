import express from "express"
import { getAdmins, createAdmin, deleteAdmin, demoteAdmin } from "../controllers/adminController.js"
import auth from "../middleware/authMiddleware.js"
import admin from "../middleware/adminMiddleware.js"

const router = express.Router()

// All routes are protected by auth and admin middleware
router.use(auth, admin)

router.get("/", getAdmins)
router.post("/", createAdmin)
router.delete("/:id", deleteAdmin)
router.put("/demote/:id", demoteAdmin)

export default router
