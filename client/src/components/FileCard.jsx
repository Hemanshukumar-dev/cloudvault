import { useState } from "react"
import { baseURL } from "../services/api"

const viewUrl = (file) =>
  file.type === "application/pdf"
    ? `${baseURL}/files/${file._id}/view?token=${encodeURIComponent(localStorage.getItem("token") || "")}`
    : file.url

const FileCard = ({ file, onDelete, isShared, permissionId, onRemoveFromDashboard }) => {
  const name = file.filename || file.url?.split("/").pop() || file._id
  const [copied, setCopied] = useState(false)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const isPdf = file.type === "application/pdf"
  const isImage = file.type?.startsWith("image/")
  const url = viewUrl(file)

  const getShareLink = () => `${window.location.origin}/share/${file._id}`
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
  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleRemoveFromDashboard = () => {
    if (permissionId && onRemoveFromDashboard) onRemoveFromDashboard(permissionId)
    setRemoveModalOpen(false)
  }

  return (
    <>
      <div
        className={`relative rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex flex-col overflow-hidden group bg-white ${
          isShared ? "ring-2 ring-blue-200/60 bg-blue-50/30" : "bg-[#D8C3A5]"
        }`}
        style={{ minHeight: "280px" }}
      >
        {/* Remove from dashboard (shared only) */}
        {isShared && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setRemoveModalOpen(true)
            }}
            className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm"
            aria-label="Remove from dashboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Badge: Shared With Me */}
        {isShared && (
          <div
            className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              file.permission === "edit" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            {file.permission === "edit" ? "EDITOR" : "VIEW ONLY"}
          </div>
        )}

        {/* Preview */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block flex-shrink-0 w-full aspect-[4/3] bg-[#8E8D8A]/10 overflow-hidden hover:opacity-95 transition-opacity"
        >
          {isImage && file.url ? (
            <img
              src={file.url}
              alt=""
              className="w-full h-full object-cover object-center"
            />
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#8E8D8A] p-4">
              <svg className="w-14 h-14 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium mt-1">PDF</span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#8E8D8A] p-4">
              <svg className="w-14 h-14 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium mt-1">FILE</span>
            </div>
          )}
        </a>

        {/* Info */}
        <div className="flex-1 flex flex-col p-3 min-w-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#8E8D8A] hover:text-[#E85A4F] truncate text-sm"
            title={name}
          >
            {name}
          </a>
          <p className="text-xs text-[#8E8D8A]/80 mt-0.5">
            {file.type?.split("/")[1]?.toUpperCase() || "FILE"} • {formatFileSize(file.size)}
          </p>
          <p className="text-xs text-[#8E8D8A]/70 mt-0.5">{formatDate(file.createdAt)}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-3 pt-2 border-t border-[#8E8D8A]/20">
          <button
            type="button"
            onClick={copyShareLink}
            className="flex-1 bg-white/60 hover:bg-[#E85A4F] hover:text-white text-[#8E8D8A] py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            {copied ? "Copied!" : "Share"}
          </button>
          {onDelete && (!file.permission || file.permission === "edit") && (
            <button
              type="button"
              onClick={() => onDelete(file._id)}
              className="flex-1 bg-white/60 hover:bg-[#E98074] hover:text-white text-[#8E8D8A] py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Remove from dashboard modal */}
      {removeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <p className="text-gray-800 font-medium mb-4">Remove this file from your dashboard?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRemoveModalOpen(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveFromDashboard}
                className="flex-1 py-2 bg-[#E85A4F] text-white rounded-lg hover:bg-[#D74F44]"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FileCard
