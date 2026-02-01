import multer from "multer"

const storage = multer.diskStorage({})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("image/")
  ) cb(null, true)
  else cb(new Error("Only PDF & images allowed"), false)
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
})

export default upload
