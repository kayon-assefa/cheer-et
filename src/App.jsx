import { Routes, Route } from "react-router-dom";

import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Donation from "./pages/Donation";
import Withdraw from "./pages/Withdraw";
import Settings from "./pages/Settings";
import Livesub from "./pages/Livesub";

import Home from "./pages/Home";     // ← New Landing Page

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />                    {/* Landing Page */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/donation" element={<Donation />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/withdraw" element={<Withdraw />} />
      <Route path="/livesub" element={<Livesub />} />
    </Routes>
  );
}

export default App;