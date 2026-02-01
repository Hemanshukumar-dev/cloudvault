import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
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



app.use(errorMiddleware);



connectDB()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
