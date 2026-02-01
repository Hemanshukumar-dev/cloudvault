import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  password: String,
  role: { type: String, default: "user" }
}, { timestamps: true })

// Strict uniqueness: one email per user (emails stored lowercase)
userSchema.index({ email: 1 }, { unique: true })

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.model("User", userSchema)
