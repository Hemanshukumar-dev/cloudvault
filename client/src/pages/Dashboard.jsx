import { useState, useEffect } from "react"
import API from "../services/api"
import FileCard from "../components/FileCard"
import UploadModal from "../components/UploadModal"

const Dashboard = () => {
  const [files, setFiles] = useState([])
  const [accessRequests, setAccessRequests] = useState([])
  const [activeShares, setActiveShares] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await API.get("/files")
      setFiles(res.data)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  const fetchAccessRequests = async () => {
    try {
      const res = await API.get("/permissions/owner")
      setAccessRequests(res.data)
    } catch (err) {
      console.error("Failed to fetch access requests:", err)
    }
  }

  const fetchActiveShares = async () => {
    try {
      const res = await API.get("/permissions/owner/active")
      setActiveShares(res.data)
    } catch (err) {
      console.error("Failed to fetch active shares:", err)
    }
  }

  const fetchMyRequests = async () => {
    try {
      const res = await API.get("/permissions/my")
      setMyRequests(res.data)
    } catch (err) {
      console.error("Failed to fetch my requests:", err)
    }
  }

  useEffect(() => {
    fetchFiles()
    fetchAccessRequests()
    fetchActiveShares()
    fetchMyRequests()
  }, [])

  const handleUpload = async (file) => {
    try {
      const form = new FormData()
      form.append("file", file)
      await API.post("/files/upload", form)
      fetchFiles()
    } catch (err) {
      throw new Error(err.response?.data?.error || "Upload failed")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this file?")) return
    
    try {
      await API.delete(`/files/${id}`)
      fetchFiles()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete file")
    }
  }

  const handleApprove = async (id, access) => {
    try {
      await API.put(`/permissions/approve/${id}`, { access: access || "view" })
      fetchAccessRequests()
      fetchActiveShares()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to approve")
    }
  }

  const handleReject = async (id) => {
    try {
      await API.put(`/permissions/reject/${id}`)
      fetchAccessRequests()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reject")
    }
  }

  const handleRevoke = async (id) => {
    if (!confirm("Are you sure you want to revoke access?")) return
    try {
      await API.delete(`/permissions/revoke/${id}`)
      fetchActiveShares()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to revoke access")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Files</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Access Requests</h2>
        {accessRequests.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {accessRequests.map((req) => (
              <div key={req._id} className="bg-white border rounded-lg p-4 shadow-sm flex justify-between items-center flex-wrap gap-2">
                <div>
                  <p className="font-medium">{req.requester?.email || "—"}</p>
                  <p className="text-sm text-gray-600">{req.file?.filename || "File"}</p>
                  <p className="text-xs text-gray-500">Requested: {req.access}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(req._id, req.access)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeShares.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Active Shares</h2>
          <div className="space-y-2">
            {activeShares.map((share) => (
              <div key={share._id} className="bg-white border rounded-lg p-4 shadow-sm flex justify-between items-center flex-wrap gap-2">
                <div>
                  <p className="font-medium">{share.requester?.email || "—"}</p>
                  <p className="text-sm text-gray-600">{share.file?.filename || "File"}</p>
                  <p className="text-xs text-gray-500">Access: {share.access}</p>
                </div>
                <button
                  onClick={() => handleRevoke(share._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {myRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">My Access Requests</h2>
          <div className="space-y-2">
            {myRequests.map((req) => (
              <div key={req._id} className="bg-white border rounded-lg p-4 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-medium">{req.file?.filename || "File"}</p>
                  <p className="text-sm text-gray-600">Owner: {req.owner?.email || "—"}</p>
                  {req.file?.url && req.status === "approved" && (
                    <a href={req.file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View file</a>
                  )}
                </div>
                <span className={`text-sm px-3 py-1 rounded ${req.status === "approved" ? "bg-green-100 text-green-800" : req.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading files...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <FileCard key={file._id} file={file} onDelete={handleDelete} />
            ))}
          </div>

          {files.length === 0 && (
            <p className="text-gray-500">No files yet. Upload one to get started.</p>
          )}
        </>
      )}

      <UploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}

export default Dashboard
