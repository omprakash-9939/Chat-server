import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { writeChatUser } from "../authStorage";
import { motion } from "framer-motion";
import Logo from "../components/Logo";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setError("");
    setMessage("");
  };

  const register = async () => {
    resetState();
    setLoading(true);

    try {
      const res = await api.post("/auth/register", {
        email,
        username,
        password,
      });

      if (res.data.user) {
        writeChatUser(res.data.user);
      }

      setMessage("Account created. Redirecting...");

      setTimeout(() => {
        window.location.href = "/";
      }, 900);
    } catch (e) {
      setError(e.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-3 rounded-lg text-sm transition";

  const buttonClass =
    "w-full rounded-lg p-3 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

  const isDisabled = !email || !username || !password || loading;

  return (
    <div className="min-h-screen flex">
      <div className="hidden font-bold lg:flex w-1/2 relative overflow-hidden bg-blue-950">
        <div className="absolute inset-0 opacity-40 z-0">
         <Logo/>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_60%)]" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)]" />
        <motion.div
          className="absolute top-20 right-20 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl text-xs text-white shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          💬 Live Chat Active
        </motion.div>

        <motion.div
          className="absolute bottom-24 left-20 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl text-xs text-white shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        >
          🟢 877 Professionals Online
        </motion.div>

        <motion.div
          className="absolute top-1/2 right-10 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl text-xs text-white shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          🔒 End-to-End Encrypted
        </motion.div>
        <motion.div
          className="absolute top-16 left-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-16 right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/20 rotate-45 rounded-lg"
          animate={{ rotate: [45, 60, 45], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Title */}
          <motion.h1
            className="text-4xl font-semibold leading-tight tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Where Conversations Turn Into Opportunities
          </motion.h1>
          <motion.p
            className="mt-4 text-white/75 text-sm max-w-md leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Discover people who think like you, collaborate in real-time, and
            build meaningful professional relationships that go beyond just
            messages.
          </motion.p>
          <motion.div
            className="mt-8 space-y-3 text-sm text-white/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {[
              "Instant conversations that feel natural",
              "Your data stays private and protected",
              "Build a network that truly adds value",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-xs">
                  ✦
                </div>
                <p>{item}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">
            Create account
          </h2>
          <p className="text-sm text-gray-500 text-center mt-1 mb-6">
            Start your journey in seconds
          </p>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-3">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-3">
              {message}
            </div>
          )}
          <input
            className={inputClass}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={`${inputClass} mt-3`}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className={`${inputClass} mt-3`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className={`${buttonClass} mt-6 bg-black text-white`}
            onClick={register}
            disabled={isDisabled}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account?{" "}
            <Link
              className="text-indigo-600 font-medium hover:underline"
              to="/"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
