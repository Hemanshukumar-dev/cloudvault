/**
 * One-time cleanup: beast@gmail.com duplicates.
 * - Find all users whose email matches "beast@gmail.com" (case-insensitive).
 * - Keep only one record (the admin account).
 * - Delete all other duplicates.
 * - Ensure the remaining record has: role=admin, email=beast@gmail.com, password=123456789 (hashed).
 *
 * Run from server folder: node --env-file=.env scripts/cleanupBeastDuplicates.js
 */
import "dotenv/config"
import mongoose from "mongoose"
import User from "../models/User.js"
import bcrypt from "bcrypt"
import connectDB from "../config/db.js"

const BEAST_EMAIL_NORM = "beast@gmail.com"
const BEAST_PASSWORD = "123456789"

async function cleanup() {
  await connectDB()

  const regex = new RegExp(`^${BEAST_EMAIL_NORM.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
  const duplicates = await User.find({ email: regex }).sort({ createdAt: 1 })

  if (duplicates.length === 0) {
    const hashed = await bcrypt.hash(BEAST_PASSWORD, 10)
    await User.create({
      name: "beast",
      email: BEAST_EMAIL_NORM,
      password: hashed,
      role: "admin"
    })
    console.log("Created single super-admin account: beast@gmail.com")
  } else {
    const toKeep = duplicates.find((u) => u.role === "admin") || duplicates[0]
    const toDelete = duplicates.filter((u) => !u._id.equals(toKeep._id))

    // Delete duplicates FIRST so no duplicate key when we set email to beast@gmail.com
    for (const u of toDelete) {
      await User.findByIdAndDelete(u._id)
    }

    const hashed = await bcrypt.hash(BEAST_PASSWORD, 10)
    await User.findByIdAndUpdate(toKeep._id, {
      email: BEAST_EMAIL_NORM,
      role: "admin",
      password: hashed
    })

    console.log(`Kept 1 admin (beast@gmail.com), deleted ${toDelete.length} duplicate(s).`)
  }

  await mongoose.disconnect()
  console.log("Cleanup done.")
  process.exit(0)
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err)
  process.exit(1)
})
