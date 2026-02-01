import mongoose from "mongoose"

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number }
}, { timestamps: true })

export default mongoose.model("File", fileSchema)
