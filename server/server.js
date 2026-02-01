import "dotenv/config"
import express from "express"
import cors from "cors"
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import fileRoutes from "./routes/fileRoutes.js"
import permissionRoutes from "./routes/permissionRoutes.js"
import errorMiddleware from "./middleware/errorMiddleware.js"

const app = express()

const corsOptions = {
  origin: ["http://localhost:5173", "https://yourfrontend.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

app.get("/", (req, res) => {
  res.send("CloudVault API running")
})
app.use("/api/auth", authRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/permissions", permissionRoutes)

app.use(errorMiddleware)

connectDB().catch((err) => {
  console.error(err)
  process.exit(1)
})

app.listen(5000, () => console.log("Server running on 5000"))
