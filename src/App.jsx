import { Routes, Route } from "react-router-dom";

import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Donation from "./pages/Donation";
import Withdraw from "./pages/Withdraw";
import Settings from "./pages/Settings";
import Livesub from "./pages/Livesub";
import Home from "./pages/Home";
import CreatorPage from "./pages/CreatorPage";
import PaymentSuccess from "./pages/PaymentSuccess";

// FIXED: Now importing the proper React JSX component instead of an HTML file
import NotFound from "./pages/NotFound"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/donation" element={<Donation />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/withdraw" element={<Withdraw />} />
      <Route path="/livesub" element={<Livesub />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      
      {/* Explicit 404 route */}
      <Route path="/404" element={<NotFound />} />

      {/* CREATOR PAGE (Keep this at the very bottom) */}
      <Route path="/:username" element={<CreatorPage />} />
      
      {/* Catch-all for deeper invalid paths like /settings/abc/xyz */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
