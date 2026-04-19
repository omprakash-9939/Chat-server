import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { writeAuthToken, writeChatUser } from "../authStorage";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Logo from "../components/Logo";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setError("");
    setMessage("");
  };

  const login = async () => {
    resetState();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      writeAuthToken(res.data.token);

      if (res.data.user) {
        writeChatUser(res.data.user);
      }
      toast.success("Login successful");

      window.location.href = "/chat";
    } catch (e) {
      setError(e.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    resetState();
    setLoading(true);

    try {
      const res = await api.post("/auth/password-reset/request", { email });

      setResetToken(res.data.resetToken || "");

      setMessage(
        res.data.resetToken
          ? "Reset token generated successfully"
          : res.data.message,
      );
    } catch (e) {
      setError(e.response?.data?.error || "Could not create reset token");
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    resetState();
    setLoading(true);

    try {
      const res = await api.post("/auth/password-reset/confirm", {
        email,
        token: resetToken,
        newPassword,
      });

      setMessage(res.data.message || "Password updated successfully");

      setMode("login");
      setPassword("");
      setNewPassword("");
      setResetToken("");
    } catch (e) {
      setError(e.response?.data?.error || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-3 rounded-lg text-sm transition";

  const buttonBase =
    "w-full rounded-lg p-3 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen flex">
      {/* LEFT HERO SECTION */}
      <div className="hidden font-bold lg:flex w-1/2 relative overflow-hidden bg-blue-950">
        {/* Soft ambient background layers */}
        <div className="absolute inset-0 opacity-40">
         <Logo/>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_60%)]" />

          
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_60%)]" />
        </div>

        {/* Floating blobs (more subtle + slower) */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, -15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">

          <Logo/>
          {/* Title (more elegant sizing) */}
          <motion.h1
            className="text-4xl font-semibold tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Welcome back
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mt-3 text-white/70 text-sm max-w-md leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            A modern workspace to connect, collaborate, and manage everything in
            real time.
          </motion.p>

          {/* Stats Cards (premium glass style) */}
          <div className="mt-10 grid grid-cols-2 gap-4">

            
            {[
              { value: "24/7", label: "Real-time sync" },
              { value: "100%", label: "Secure system" },
              { value: "1s", label: "Message delivery" },
              { value: "∞", label: "Scalable workspace" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="group relative bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 overflow-hidden"
                whileHover={{ scale: 1.06, y: -4 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {/* glow hover effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-white/5" />

                <p className="text-2xl font-bold tracking-tight">
                  {item.value}
                </p>
                <p className="text-xs text-white/70 mt-1">{item.label}</p>
              </motion.div>
            ))}
          </div>

          

          {/* Feature list (clean + modern spacing) */}
          <motion.div
            className="mt-10 space-y-3 text-sm text-white/75"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="flex items-center gap-2">
              ✔ Secure authentication system
            </p>
            <p className="flex items-center gap-2">
              ✔ Real-time chat & collaboration
            </p>
          </motion.div>
          
        </div>
        
      </div>

      {/* RIGHT FORM SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {mode === "login" ? "Login to your account" : "Reset password"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "login"
                ? "Enter your credentials to continue"
                : "We will help you recover your account"}
            </p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-3">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-3 whitespace-pre-wrap">
              {message}
            </div>
          )}
          <input
            className={inputClass}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode === "login" ? (
            <>
              <input
                className={`${inputClass} mt-3`}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className={`${buttonBase} mt-5 bg-black text-white hover:bg-gray-600`}
                onClick={login}
                disabled={loading || !email || !password}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              <button
                type="button"
                className="text-sm text-indigo-600 mt-4 w-full hover:underline"
                onClick={() => {
                  setMode("reset");
                  resetState();
                }}
              >
                Forgot password?
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${buttonBase} mt-4 bg-gray-900 text-white hover:bg-black`}
                onClick={requestReset}
                disabled={loading || !email}
              >
                {loading ? "Generating..." : "Generate reset token"}
              </button>

              <input
                className={`${inputClass} mt-3`}
                placeholder="Reset token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />

              <input
                className={`${inputClass} mt-3`}
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className={`${buttonBase} mt-5 bg-black text-white hover:bg-indigo-700`}
                onClick={confirmReset}
                disabled={loading || !resetToken || !newPassword}
              >
                {loading ? "Updating..." : "Reset password"}
              </button>
              <button
                type="button"
                className="text-sm text-indigo-600 mt-4 w-full hover:underline"
                onClick={() => {
                  setMode("login");
                  resetState();
                }}
              >
                Back to login
              </button>
            </>
          )}
          {mode === "login" && (
            <p className="text-sm text-gray-500 mt-6 text-center">
              Don’t have an account?{" "}
              <Link
                className="text-indigo-600 font-medium hover:underline"
                to="/register"
              >
                Sign up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
