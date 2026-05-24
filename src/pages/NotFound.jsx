import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function NotFound() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Handles search when the user hits the "Enter" key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 text-white"
      style={{
        background: "linear-gradient(to bottom, #0a1428 0%, #1a2a5e 100%)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif"
      }}
    >
      <div className="max-w-md w-full">
        {/* Glassmorphism Card */}
        <div 
          className="p-10 md:p-12 text-center rounded-[24px]"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.4)"
          }}
        >
          {/* 404 Icon Circle */}
          <div className="mx-auto mb-8 flex justify-center">
            <div 
              className="w-[88px] height-[88px] h-[88px] rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #64748b, #475569)",
                boxShadow: "0 10px 30px rgba(100, 116, 139, 0.4)"
              }}
            >
              <i className="fa-solid fa-magnifying-glass text-white text-5xl"></i>
            </div>
          </div>

          <h1 class="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            Page Not Found
          </h1>
          <p className="text-blue-100 text-[17px] leading-relaxed mb-8">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>

          {/* Search Input */}
          <div className="relative mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder:text-blue-200/60 focus:outline-none focus:border-blue-500"
              placeholder="Search creators or pages..."
            />
          </div>

          {/* Navigation Action Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/"
              className="block w-full bg-white/10 hover:bg-white/20 transition-all py-4 rounded-2xl text-lg font-semibold border border-white/20 text-center"
            >
              Go Home
            </Link>
            <Link
              to="/dashboard"
              className="block w-full bg-blue-600 hover:bg-blue-500 transition-all py-4 rounded-2xl text-lg font-semibold text-center"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-10 text-center text-blue-200/60 text-sm">
          Cheer ET © 2026. Owned by Kayon Tech.
        </p>
      </div>
    </div>
  );
}

export default NotFound;
