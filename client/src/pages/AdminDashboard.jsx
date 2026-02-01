import { useState, useEffect } from "react"
import API from "../services/api"
import FileCard from "../components/FileCard"

const AdminDashboard = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await API.get("/files/admin/all")
      setFiles(res.data)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) return
    
    try {
      await API.delete(`/files/admin/${id}`)
      fetchFiles()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete file")
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Files (Admin)</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading files...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                onDelete={handleDelete}
                owner={file.user?.email || file.user?.name}
              />
            ))}
          </div>

          {files.length === 0 && (
            <p className="text-gray-500">No files in the system.</p>
          )}
        </>
      )}
    </div>
  )
}

export default AdminDashboard
