import { useState, useEffect } from "react"
import API from "../services/api"
import FileCard from "../components/FileCard"
import { isValidEmail, normalizeEmail, EMAIL_ERROR_MESSAGE, EMAIL_EXISTS_MESSAGE } from "../utils/emailValidation"

const AdminDashboard = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [view, setView] = useState("files")
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState("")
  const [admins, setAdmins] = useState([])
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "" })
  const [adminEmailError, setAdminEmailError] = useState("")
  const [createAdminSuccess, setCreateAdminSuccess] = useState("")

  useEffect(() => {
    fetchFiles()
  }, [])

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

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError("")
      const { data } = await API.get("/auth/admin/users")
      setUsers(data)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }
  
  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError("")
      const { data } = await API.get("/admin")
      setAdmins(data)
    } catch (err) {
       setError(err.response?.data?.error || "Failed to fetch admins")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) return
    setError("")
    try {
      await API.delete(`/files/admin/${id}`)
      setFiles(files.filter(f => f._id !== id))
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete file")
    }
  }

  const handleAdminEmailChange = (e) => {
    const value = e.target.value
    setNewAdmin((prev) => ({ ...prev, email: value }))
    setCreateAdminSuccess("")
    if (value.trim()) {
      setAdminEmailError(isValidEmail(value) ? "" : EMAIL_ERROR_MESSAGE)
    } else {
      setAdminEmailError("")
    }
  }

  const handleAdminEmailBlur = () => {
    if (newAdmin.email.trim()) {
      setAdminEmailError(isValidEmail(newAdmin.email) ? "" : EMAIL_ERROR_MESSAGE)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setError("")
    setCreateAdminSuccess("")
    const rawEmail = newAdmin.email.trim()
    if (!isValidEmail(rawEmail)) {
      setAdminEmailError(EMAIL_ERROR_MESSAGE)
      return
    }
    setAdminEmailError("")
    try {
      await API.post("/admin", {
        email: normalizeEmail(rawEmail),
        password: newAdmin.password
      })
      setCreateAdminSuccess("Admin created successfully")
      setNewAdmin({ email: "", password: "" })
      fetchAdmins()
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create admin"
      setError(msg === "Email already in use" || msg.includes("already") ? EMAIL_EXISTS_MESSAGE : msg)
    }
  }

  const handleDeleteAdmin = async (id) => {
    if (!confirm("Are you sure you want to delete this admin?")) return
    setError("")
    try {
      await API.delete(`/admin/${id}`)
      fetchAdmins()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete admin")
    }
  }

  const handleDemoteAdmin = async (id) => {
    if (!confirm("Are you sure you want to demote this admin to a regular user?")) return
    setError("")
    try {
      await API.put(`/admin/demote/${id}`)
      fetchAdmins()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to demote admin")
    }
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#EAE7DC] text-[#8E8D8A] font-sans">
      
      {/* Header - Floating Rounded Bar */}
      <div className="px-4 pt-4 md:px-6 md:pt-6 mb-8">
        <header className="bg-[#8E8D8A] rounded-2xl shadow-lg p-5 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="bg-[#EAE7DC] p-2 rounded-lg text-[#8E8D8A]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
             </div>
             <h1 className="text-2xl font-bold text-[#EAE7DC] tracking-wide font-serif">CloudVault <span className="text-sm opacity-70 font-sans tracking-normal ml-2 bg-[#EAE7DC] text-[#8E8D8A] px-2 py-0.5 rounded">ADMIN</span></h1>
          </div>
          
          <button 
            onClick={() => window.location.href = "/login"} 
            className="w-full md:w-auto bg-white text-[#E85A4F] hover:bg-[#E85A4F] hover:text-white font-medium text-sm border border-[#E85A4F] px-4 py-1.5 rounded-lg transition-all shadow-sm"
          >
             Logout
          </button>
        </header>
      </div>

      <main className="container mx-auto px-6 pb-10">
        
        {/* Navigation */}
        <div className="flex gap-4 mb-8">
            <button 
                onClick={() => setView("files")}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${view === "files" ? "bg-[#8E8D8A] text-[#EAE7DC] shadow-md" : "bg-[#D8C3A5] text-[#8E8D8A] hover:bg-[#D1BFA0]"}`}
            >
                All Files
            </button>
            <button 
                onClick={() => { setView("users"); fetchUsers(); }}
                 className={`px-4 py-2 rounded-lg font-bold transition-all ${view === "users" ? "bg-[#8E8D8A] text-[#EAE7DC] shadow-md" : "bg-[#D8C3A5] text-[#8E8D8A] hover:bg-[#D1BFA0]"}`}
            >
                Users
            </button>
            <button 
                onClick={() => { setView("admins"); fetchAdmins(); }}
                 className={`px-4 py-2 rounded-lg font-bold transition-all ${view === "admins" ? "bg-[#8E8D8A] text-[#EAE7DC] shadow-md" : "bg-[#D8C3A5] text-[#8E8D8A] hover:bg-[#D1BFA0]"}`}
            >
                Manage Admins
            </button>
        </div>

        {/* ADMINS VIEW */}
        {view === "admins" && (
            <div className="space-y-8">
                {/* Create Admin Form */}
                <div className="bg-[#D8C3A5] bg-opacity-30 rounded-xl p-6 border border-[#D8C3A5]">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        Create New Admin
                    </h3>
                    <form onSubmit={handleAddAdmin} className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold uppercase mb-1">Email</label>
                            <input
                                type="text"
                                inputMode="email"
                                required
                                value={newAdmin.email}
                                onChange={handleAdminEmailChange}
                                onBlur={handleAdminEmailBlur}
                                className={`w-full rounded px-3 py-2 text-sm outline-none border-2 ${adminEmailError ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-transparent focus:ring-2 focus:ring-[#8E8D8A]"}`}
                                placeholder="newAdmin@example.com"
                            />
                            {adminEmailError && (
                                <p className="text-red-600 text-xs mt-1">{adminEmailError}</p>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase mb-1">Password</label>
                            <input 
                                type="password" 
                                required
                                value={newAdmin.password}
                                onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                                className="w-full rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E8D8A] outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <button
                                type="submit"
                                disabled={!!adminEmailError || !newAdmin.email.trim() || !newAdmin.password}
                                className="bg-[#8E8D8A] text-[#EAE7DC] px-6 py-2 rounded font-bold hover:bg-[#7E7D7A] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                Create
                            </button>
                            {createAdminSuccess && (
                                <p className="text-green-700 text-xs">{createAdminSuccess}</p>
                            )}
                        </div>
                    </form>
                </div>

                {/* Admins List */}
                <div className="grid gap-4">
                    {admins.map(admin => {
                        const isSuperAdmin = admin.isSuperAdmin === true || (admin.email && admin.email.toLowerCase() === "beast@gmail.com")
                        return (
                            <div key={admin._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isSuperAdmin ? "bg-[#E85A4F] text-white" : "bg-[#EAE7DC] text-[#8E8D8A]"}`}>
                                        {admin.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 flex items-center gap-2">
                                            {admin.email}
                                            {isSuperAdmin && <span className="text-[10px] bg-[#E85A4F] text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Super Admin</span>}
                                        </p>
                                        <p className="text-xs text-gray-400">Created: {new Date(admin.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                
                                {!isSuperAdmin && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleDemoteAdmin(admin._id)}
                                            className="text-xs font-bold text-[#8E8D8A] border border-[#8E8D8A] px-3 py-1.5 rounded hover:bg-[#8E8D8A] hover:text-[#EAE7DC] transition-colors"
                                        >
                                            Demote
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAdmin(admin._id)}
                                            className="text-xs font-bold text-[#E85A4F] border border-[#E85A4F] px-3 py-1.5 rounded hover:bg-[#E85A4F] hover:text-white transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 italic">Loading data...</p>
      ) : view === "admins" ? null : view === "files" ? (
        /* FILES VIEW */
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <div key={file._id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm relative">
                 <button
                    onClick={() => handleDelete(file._id)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-semibold"
                  >
                    Delete
                  </button>

                <div className="mb-4 pr-12">
                  <h3 className="font-bold text-lg text-black truncate" title={file.filename}>{file.filename}</h3>
                  <p className="text-xs text-gray-500 mt-1">{file.type} • {((file.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-xs text-gray-600 mt-2"><span className="font-semibold text-gray-700">Owner:</span> {file.user?.email || "Unknown"}</p>
                  <p className="text-xs text-gray-500"><span className="">Uploaded:</span> {new Date(file.createdAt).toLocaleString()}</p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wide">ACCESS LIST</h4>
                  {file.permissions && file.permissions.length > 0 ? (
                    <ul className="space-y-2">
                      {file.permissions.map(perm => (
                        <li key={perm._id} className="text-sm flex justify-between items-center">
                          <span className="truncate max-w-[150px] text-gray-800 font-medium" title={perm.requester?.email}>
                            {perm.requester?.email}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${perm.access === 'edit' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {perm.access}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No shared access</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {files.length === 0 && <p className="text-gray-500">No files in the system.</p>}
        </>
      ) : (
        /* USERS VIEW */
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <div className="relative">
               <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-white border border-[#D8C3A5] text-sm rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#E85A4F] w-64 transition-all"
               />
               <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>

          {filteredUsers.map(user => (
            <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email} <span className="mx-2">•</span> Role: <span className="uppercase font-semibold text-xs">{user.role}</span></p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-400">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                   <p className="text-sm font-bold text-[#8E8D8A] mt-1">{user.files?.length || 0} Files Uploaded</p>
                </div>
              </div>
              
              <div className="p-4">
                {user.files && user.files.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2">Filename</th>
                          <th className="px-4 py-2">Type</th>
                          <th className="px-4 py-2">Size</th>
                          <th className="px-4 py-2">Uploaded At</th>
                          <th className="px-4 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                         {user.files.map(file => (
                           <tr key={file._id} className="border-b hover:bg-gray-50">
                             <td className="px-4 py-2 font-medium text-gray-900">{file.filename}</td>
                             <td className="px-4 py-2 text-gray-500">{file.type}</td>
                             <td className="px-4 py-2 text-gray-500">{((file.size || 0) / 1024 / 1024).toFixed(2)} MB</td>
                             <td className="px-4 py-2 text-gray-500">{new Date(file.createdAt).toLocaleString()}</td>
                             <td className="px-4 py-2">
                               <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-bold">VIEW</a>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic p-2">No files uploaded by this user.</p>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-gray-500">No users found.</p>}
        </div>
      )}
      </main>
    </div>
  )
}

export default AdminDashboard
