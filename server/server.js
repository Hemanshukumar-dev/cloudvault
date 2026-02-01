import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();



app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cloudvault-two.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);



app.use(express.json());


app.get("/", (req, res) => {
  res.send("CloudVault API running");
});



app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/admin", adminRoutes);



app.use(errorMiddleware);



connectDB()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });



const PORT = process.env.PORT || 5000;

app.get("/health", (req, res) => {
  res.send("Alive");
});

// Keep-alive system for Render (pings every 14 minutes)
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes
const BACKEND_URL = "https://cloudvault-bcpk.onrender.com/health";

setInterval(async () => {
  try {
    const res = await fetch(BACKEND_URL);
    if (res.ok) {
      console.log(`Keep-alive ping sent to ${BACKEND_URL}`);
    } else {
      console.log(`Keep-alive ping failed: ${res.statusText}`);
    }
  } catch (err) {
    console.error("Keep-alive ping error:", err.message);
  }
}, KEEP_ALIVE_INTERVAL);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
