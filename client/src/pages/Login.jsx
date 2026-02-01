import API from "../services/api"
import { useContext, useState } from "react"
import { AuthContext } from "../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"

const Login = () => {
  const { loginUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    const f = new FormData(e.target)
    try {
      const res = await API.post("/auth/login", {
        email: f.get("email"),
        password: f.get("password"),
      })
      loginUser(res.data)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.error || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE7DC] p-4 text-[#8E8D8A]">
      <div className="w-full max-w-md bg-[#D8C3A5] rounded-xl shadow-lg p-8 transform transition-all hover:scale-[1.01]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#E85A4F] mb-2">CloudVault</h1>
          <h2 className="text-xl font-semibold">Welcome Back</h2>
          <p className="text-sm opacity-80 mt-1">
            Login to access your personal drive
          </p>
        </div>

        {error && (
          <div className="bg-[#E98074] bg-opacity-20 border border-[#E98074] text-[#E85A4F] px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 pl-1">Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              className="w-full bg-[#EAE7DC] border-none rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-[#E85A4F] outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 pl-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="w-full bg-[#EAE7DC] border-none rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-[#E85A4F] outline-none transition-all pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#E85A4F] transition-colors p-1"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#E85A4F] text-white font-bold py-3 rounded-lg hover:bg-[#D74F44] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-2"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#EAE7DC] border-opacity-30 pt-6">
          <p className="text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#E85A4F] font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
