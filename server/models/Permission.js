import mongoose from "mongoose"

const permissionSchema = new mongoose.Schema({
  file: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  access: { type: String, enum: ["view", "edit"], default: "view" },
  status: { type: String, enum: ["pending", "approved"], default: "pending" }
},{timestamps:true})

export default mongoose.model("Permission", permissionSchema)
