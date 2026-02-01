import express from "express"
import { signup, login, getAllUsers } from "../controllers/authController.js"
import auth from "../middleware/authMiddleware.js"
import admin from "../middleware/adminMiddleware.js"

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.get("/admin/users", auth, admin, getAllUsers)

export default router
