import { Navigate } from "react-router-dom"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext)
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" />
  }
  
  return children
}

export default ProtectedRoute
