import { useState } from "react"

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

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="bg-[#D8C3A5] rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between aspect-square group relative overflow-hidden">
      
      {/* File Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center items-center text-center">
        {/* Mock Icon based on type */}
        <div className="text-[#E85A4F] mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
          {file.type?.includes("image") ? (
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          ) : (
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          )}
        </div>

        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8E8D8A] font-bold text-lg hover:text-[#E85A4F] truncate w-full px-2"
          title={name}
        >
          {name}
        </a>
        
        <div className="text-xs text-[#8E8D8A] mt-2 opacity-80 space-y-1">
          <p>{file.type?.split('/')[1]?.toUpperCase() || "FILE"} • {formatFileSize(file.size)}</p>
          <p>{formatDate(file.createdAt)}</p>
        </div>
      </div>

      {/* Actions (Hover Overlay or Bottom Bar) - simplifying to bottom bar for accessibility */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-[#8E8D8A] border-opacity-20 z-10 w-full">
        <button
          onClick={copyShareLink}
          className="flex-1 bg-white bg-opacity-40 text-[#8E8D8A] hover:bg-[#E85A4F] hover:text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          {copied ? (
            <span>Copied!</span>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share
            </>
          )}
        </button>
        <button
          onClick={() => onDelete(file._id)}
          className="flex-1 bg-white bg-opacity-40 text-[#8E8D8A] hover:bg-[#E98074] hover:text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
      </div>
    </div>
  )
}

export default FileCard
