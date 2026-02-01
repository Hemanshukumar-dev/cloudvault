import { useState } from "react"
import API from "../services/api"

const FileCard = ({ file, onDelete }) => {
  const name = file.filename || file.url?.split("/").pop() || file._id
  const [copied, setCopied] = useState(false)

  const getShareLink = () => {
    return `${window.location.origin}/share/${file._id}`
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ""
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="min-w-0 mb-3">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate block font-medium"
        >
          {name}
        </a>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{file.type}</span>
          {file.size && (
            <span className="text-xs text-gray-500">• {formatFileSize(file.size)}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyShareLink}
          className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          {copied ? "Link copied!" : "Share Link"}
        </button>
        <button
          onClick={() => onDelete(file._id)}
          className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default FileCard
