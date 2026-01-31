import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import fileRoutes from "./routes/fileRoutes.js"
import permissionRoutes from "./routes/permissionRoutes.js"

dotenv.config()
connectDB()

const app = express()

const corsOptions = {
  origin: ["http://localhost:5173", "https://yourfrontend.com"], // add vercel link here
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions))
app.use(express.json())


app.get("/", (req,res)=>{
  res.send("CloudVault API running")
})
app.use("/api/auth", authRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/permissions", permissionRoutes)




app.listen(5000, ()=> console.log("Server running on 5000"))
