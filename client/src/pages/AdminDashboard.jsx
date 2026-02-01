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
              <div key={file._id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg truncate" title={file.filename}>{file.filename}</h3>
                    <p className="text-sm text-gray-500">{file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="text-sm text-gray-700 mb-3 space-y-1">
                  <p><span className="font-semibold">Owner:</span> {file.user?.email || "Unknown"}</p>
                  <p><span className="font-semibold">Uploaded:</span> {new Date(file.createdAt).toLocaleString()}</p>
                </div>

                <div className="border-t pt-2">
                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Access List</h4>
                  {file.permissions && file.permissions.length > 0 ? (
                    <ul className="space-y-1">
                      {file.permissions.map(perm => (
                        <li key={perm._id} className="text-sm flex justify-between">
                          <span className="truncate max-w-[150px]" title={perm.requester?.email}>
                            {perm.requester?.email}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${perm.access === 'edit' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                            {perm.access}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No shared access</p>
                  )}
                </div>
              </div>
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
