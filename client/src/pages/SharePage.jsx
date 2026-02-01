import { useState, useEffect, useContext } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../context/AuthContext"
import { setPendingSharedFileId } from "../utils/sharedFileStorage"

const SharePage = () => {
  const { fileId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [fileInfo, setFileInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState("view")
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  // Logged-in user on /share/:fileId → store fileId and go to dashboard (modal will open there)
  useEffect(() => {
    if (user && fileId) {
      setPendingSharedFileId(fileId)
      navigate("/", { replace: true })
    }
  }, [user, fileId, navigate])

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true)
        const res = await API.get(`/files/share/${fileId}`)
        setFileInfo(res.data)
      } catch (err) {
        setFileInfo(null)
      } finally {
        setLoading(false)
      }
    }
    if (fileId && !user) fetchInfo()
  }, [fileId, user])

  // When not logged in and file exists: preserve context and send to login
  useEffect(() => {
    if (!user && fileId && !loading && fileInfo) {
      setPendingSharedFileId(fileId)
      navigate("/login", { replace: true })
    }
  }, [user, fileId, loading, fileInfo, navigate])

  const handleRequestAccess = async (e) => {
    e.preventDefault()
    if (!user) return
    setMessage({ type: "", text: "" })
    setRequesting(true)
    try {
      await API.post("/permissions/request", { fileId, access })
      setMessage({ type: "success", text: "Access request sent." })
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to send request"
      })
    } finally {
      setRequesting(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ""
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`
  }

  if (user && fileId) {
    return (
      <div className="max-w-md mx-auto mt-8 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Redirecting to dashboard…</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!fileInfo) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <p className="text-red-600">File not found.</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 bg-white border rounded-lg p-6 shadow-sm">
      <h1 className="text-xl font-bold mb-4">Shared File</h1>
      <div className="mb-4">
        <p className="font-medium text-gray-900">{fileInfo.filename}</p>
        <p className="text-sm text-gray-500 mt-1">{fileInfo.type}</p>
        {fileInfo.size != null && (
          <p className="text-sm text-gray-500">{formatFileSize(fileInfo.size)}</p>
        )}
      </div>

      <p className="text-gray-600 mb-2">
        Redirecting to login… You’ll be able to request access right after.
      </p>
    </div>
  )
}

export default SharePage
