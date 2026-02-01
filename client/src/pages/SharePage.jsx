import { useState, useEffect, useContext } from "react"
import { useParams, Link } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../context/AuthContext"

const SharePage = () => {
  const { fileId } = useParams()
  const { user } = useContext(AuthContext)
  const [fileInfo, setFileInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState("view")
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

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
    if (fileId) fetchInfo()
  }, [fileId])

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

      {!user ? (
        <p className="text-gray-600 mb-2">
          <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to request access.
        </p>
      ) : (
        <form onSubmit={handleRequestAccess}>
          {message.text && (
            <div className={`mb-4 px-3 py-2 rounded text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
              {message.text}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Permission</label>
            <select
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="view">Can View</option>
              <option value="edit">Can Edit</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={requesting}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {requesting ? "Sending..." : "Request Access"}
          </button>
        </form>
      )}

      {user && (
        <Link to="/" className="block mt-4 text-center text-blue-600 hover:underline text-sm">
          Back to Dashboard
        </Link>
      )}
    </div>
  )
}

export default SharePage
