import { Link, useNavigate } from "react-router-dom"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex gap-4">
        <Link to="/" className="hover:underline">Dashboard</Link>
        {user?.role === "admin" && (
          <Link to="/admin" className="hover:underline">Admin</Link>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="bg-slate-600 px-3 py-1 rounded hover:bg-slate-500"
      >
        Logout
      </button>
    </nav>
  )
}

export default Navbar
