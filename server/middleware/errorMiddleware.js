const errorMiddleware = (err, req, res, next) => {
  console.error("Error:", err)
  
  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 5MB" })
  }
  
  // Multer file type error
  if (err.message === "Only PDF & images allowed") {
    return res.status(400).json({ error: err.message })
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ error: "Duplicate entry" })
  }
  
  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" })
  }
  
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" })
  }
  
  // Default error
  res.status(500).json({ error: "Server error" })
}

export default errorMiddleware
