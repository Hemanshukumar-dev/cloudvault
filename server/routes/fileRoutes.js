import express from "express"
import upload from "../middleware/uploadMiddleware.js"
import auth from "../middleware/authMiddleware.js"
import admin from "../middleware/adminMiddleware.js"
import { uploadFile, getUserFiles, deleteFile, getAllFiles, adminDeleteFile, viewFile, getFileInfoForShare } from "../controllers/fileController.js"

const router = express.Router()

router.get("/share/:id", getFileInfoForShare)
router.post("/upload", auth, upload.single("file"), uploadFile)
router.get("/", auth, getUserFiles)
router.delete("/:id", auth, deleteFile)

router.get("/admin/all", auth, admin, getAllFiles)
router.delete("/admin/:id", auth, admin, adminDeleteFile)
router.get("/:id", auth, viewFile)

export default router

