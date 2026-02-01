import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"
import FileCard from "../components/FileCard"
import UploadModal from "../components/UploadModal"
import { AuthContext } from "../context/AuthContext"

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext) // Access user info
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [accessRequests, setAccessRequests] = useState([])
  const [activeShares, setActiveShares] = useState([])
  const [myRequests, setMyRequests] = useState([])
  
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("incoming")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [filesRes, reqRes, activeRes, myRes] = await Promise.all([
        API.get("/files"),
        API.get("/permissions/owner"),
        API.get("/permissions/owner/active"),
        API.get("/permissions/my")
      ])
      
      setFiles(filesRes.data)
      setAccessRequests(reqRes.data)
      setActiveShares(activeRes.data)
      setMyRequests(myRes.data)
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate("/admin")
      return
    }
    fetchAllData()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleUpload = async (file) => {
    try {
      const form = new FormData()
      form.append("file", file)
      await API.post("/files/upload", form)
      fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || "Upload failed")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this file?")) return
    try {
      await API.delete(`/files/${id}`)
      fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete file")
    }
  }

  const handleApprove = async (id, access) => {
    try {
      await API.put(`/permissions/approve/${id}`, { access: access || "view" })
      fetchAllData()
    } catch (err) {
      alert("Failed to approve")
    }
  }

  const handleReject = async (id) => {
    try {
      await API.put(`/permissions/reject/${id}`)
      fetchAllData()
    } catch (err) {
      alert("Failed to reject")
    }
  }

  const handleRevoke = async (id) => {
    if (!confirm("Remove access?")) return
    try {
      await API.delete(`/permissions/revoke/${id}`)
      fetchAllData()
    } catch (err) {
      alert("Failed to revoke")
    }
  }

  const filteredFiles = files.filter(f => 
    f.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#EAE7DC] text-[#8E8D8A] font-sans">
      {/* Header - Warm Beige Background */}
      <header className="bg-[#8E8D8A] py-4 shadow-sm">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-[#EAE7DC] tracking-tight">CloudVault</h1>
          
          <div className="flex items-center gap-6">
            <div className="text-right flex flex-col justify-center">
              <span className="text-sm font-bold text-[#EAE7DC] leading-tight">{user?.name}</span>
              <span className="text-[10px] text-[#EAE7DC] uppercase font-semibold tracking-wider opacity-80">
                {user?.role || "User"}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white text-[#E85A4F] hover:bg-[#E85A4F] hover:text-white font-medium text-sm border border-[#E85A4F] px-4 py-1.5 rounded-lg transition-all shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-10">
        {/* Files Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-4">
               <h2 className="text-xl font-bold text-[#8E8D8A]">My Files</h2>
               <div className="relative">
                 <input 
                    type="text" 
                    placeholder="Search files..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-[#D8C3A5] text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E85A4F] w-48 transition-all"
                 />
                 <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
             </div>
             
             <button
              onClick={() => setModalOpen(true)}
              className="bg-[#E85A4F] text-white px-4 py-2 rounded-lg hover:bg-[#D74F44] transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-bold text-sm transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              Upload
            </button>
          </div>

          {loading ? (
             <div className="text-center py-10 opacity-50 animate-pulse">Loading drive contents...</div>
          ) : filteredFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredFiles.map(file => (
                <FileCard key={file._id} file={file} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="bg-[#D8C3A5] bg-opacity-30 rounded-xl p-10 text-center border-2 border-dashed border-[#8E8D8A] border-opacity-30">
              <p className="text-lg mb-2">{files.length > 0 ? "No matching files found" : "Your drive is empty"}</p>
              {files.length === 0 && (
                <button onClick={() => setModalOpen(true)} className="text-[#E85A4F] font-semibold hover:underline">Upload your first file</button>
              )}
            </div>
          )}
        </section>

        {/* Requests & Shares Tabs */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#D8C3A5]">
          <div className="flex border-b border-[#EAE7DC] bg-[#EAE7DC] bg-opacity-30">
            <button 
              onClick={() => setActiveTab("incoming")}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === "incoming" ? "bg-white text-[#E85A4F] border-t-2 border-[#E85A4F]" : "text-gray-500 hover:text-[#8E8D8A] hover:bg-white hover:bg-opacity-50"}`}
            >
              Incoming Requests
              {accessRequests.length > 0 && <span className="bg-[#E85A4F] text-white text-[10px] px-1.5 py-0.5 rounded-full">{accessRequests.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab("active")}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === "active" ? "bg-white text-[#E85A4F] border-t-2 border-[#E85A4F]" : "text-gray-500 hover:text-[#8E8D8A] hover:bg-white hover:bg-opacity-50"}`}
            >
              Active Shares
              {activeShares.length > 0 && <span className="bg-[#D8C3A5] text-[10px] px-1.5 py-0.5 rounded-full">{activeShares.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab("my_requests")}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === "my_requests" ? "bg-white text-[#E85A4F] border-t-2 border-[#E85A4F]" : "text-gray-500 hover:text-[#8E8D8A] hover:bg-white hover:bg-opacity-50"}`}
            >
               My Access Requests
            </button>
          </div>

          <div className="p-6 bg-white min-h-[200px]">
            {activeTab === "incoming" && (
               <div className="space-y-3">
                 {accessRequests.length === 0 ? (
                   <p className="text-center text-gray-400 py-8 italic">No pending requests</p>
                 ) : (
                   accessRequests.map(req => (
                     <div key={req._id} className="flex items-center justify-between p-4 bg-[#EAE7DC] bg-opacity-30 rounded-lg border border-[#EAE7DC]">
                       <div>
                         <p className="font-semibold text-gray-800">{req.requester?.name || "User"}</p>
                         <p className="text-sm text-gray-500">{req.requester?.email} wants to <span className="font-bold uppercase text-xs text-[#E85A4F]">{req.access}</span></p>
                         <p className="text-xs text-gray-400 mt-1">File: {req.file?.filename}</p>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => handleApprove(req._id, req.access)} className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors" title="Approve">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                         </button>
                         <button onClick={() => handleReject(req._id)} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" title="Reject">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            )}

            {activeTab === "active" && (
                <div className="space-y-3">
                  {activeShares.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 italic">You haven't shared any files yet</p>
                  ) : (
                    activeShares.map(share => (
                      <div key={share._id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-[#D8C3A5] flex items-center justify-center text-[#8E8D8A] font-bold">
                             {share.requester?.email?.[0].toUpperCase()}
                           </div>
                           <div>
                             <p className="font-medium text-gray-700">{share.requester?.email}</p>
                             <div className="flex items-center gap-2 text-xs text-gray-500">
                               <span>{share.file?.filename}</span>
                               <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                               <span className="uppercase">{share.access}</span>
                             </div>
                           </div>
                        </div>
                        <button onClick={() => handleRevoke(share._id)} className="text-gray-400 hover:text-red-500 text-sm font-medium px-3 py-1 rounded transition-colors">
                          Revoke
                        </button>
                      </div>
                    ))
                  )}
                </div>
            )}

            {activeTab === "my_requests" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {myRequests.filter(r => r.file).length === 0 ? (
                   <p className="col-span-2 text-center text-gray-400 py-8 italic">No access requests sent</p>
                ) : (
                  myRequests.filter(r => r.file).map(req => (
                    <div key={req._id} className="p-4 border rounded-xl flex justify-between items-start bg-gray-50 hover:bg-white transition-colors">
                      <div>
                        <p className="font-bold text-gray-700 truncate max-w-[150px]">{req.file.filename}</p>
                        <p className="text-xs text-gray-500">Owner: {req.owner?.name || "Unknown"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-1 ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status}
                        </span>
                        {req.status === 'approved' && (
                          <a href={req.file.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#E85A4F] hover:underline font-medium">
                            View File &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <UploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}

export default Dashboard
