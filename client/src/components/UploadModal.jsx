import { useState } from "react"

const UploadModal = ({ open, onClose, onUpload }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const file = e.target.file.files[0]
    
    if (!file) {
      setError("Please select a file")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("Only PDF and image files are allowed")
      return
    }

    setError("")
    setLoading(true)
    
    try {
      await onUpload(file)
      onClose()
    } catch (err) {
      setError(err.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4">Upload File</h3>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            name="file"
            accept=".pdf,image/*"
            className="w-full border p-2 rounded mb-4"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mb-4">
            Max size: 5MB • Allowed: PDF, Images
          </p>
          <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadModal
