import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1157);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const location = useLocation();
  const user = auth.currentUser;

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1157);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // User Data
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) setUserData(snapshot.data());
    });
    return () => unsubscribe();
  }, [user]);

  // Notifications
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "donations"), where("streamerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setNotifications(notifs);
    });
    return () => unsub();
  }, [user]);

  // Clear unread when on Donation page
  useEffect(() => {
    if (location.pathname === "/donation") setUnreadCount(0);
    else setUnreadCount(notifications.length);
  }, [location.pathname, notifications.length]);

  // Events (Live)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "events"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  const [liveEvents, setLiveEvents] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = events
        .map(event => {
          if (!event.startTime) return null;
          const start = new Date(event.startTime.seconds * 1000);
          const now = new Date();
          const minutesPassed = Math.floor((now - start) / 60000);
          if (minutesPassed < 0) return { ...event, status: "upcoming", display: `${Math.abs(minutesPassed)} min left` };
          const remaining = (event.duration || 90) - minutesPassed;
          if (remaining <= 0) return null;
          return { ...event, status: "live", display: `${remaining} min running` };
        })
        .filter(Boolean);
      setLiveEvents(updated);
    }, 30000);
    return () => clearInterval(interval);
  }, [events]);

  const avatarSrc = userData?.photoURL || user?.photoURL || "https://via.placeholder.com/120";
  const displayName = userData?.username || userData?.displayName || "Streamer";

  const menu = [
    { name: "Dashboard", icon: "bi-speedometer2", path: "/dashboard" },
    { name: "Donation", icon: "bi-cash-stack", path: "/donation" },
    { name: "Withdraw", icon: "bi-wallet2", path: "/withdraw" },
    { name: "Settings", icon: "bi-gear", path: "/settings" },
  ];

  return (
    <>
      {!isDesktop && !open && (
        <button style={styles.floatingButton} onClick={() => setOpen(true)}>
          <i className="bi bi-list" style={styles.menuIcon} />
        </button>
      )}

      {(open || showNotifDropdown) && !isDesktop && (
        <div style={styles.overlay} onClick={() => { setOpen(false); setShowNotifDropdown(false); }} />
      )}

      <div style={{
        ...styles.navbar,
        transform: (isDesktop || open) ? "translateX(0)" : "translateX(-100%)",
      }}>

        {/* Logo */}
        <div style={styles.header}>
          <h2 style={styles.logo}>Cheer ET</h2>
        </div>

        {/* Big Profile */}
        <div style={styles.profile} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
          <img src={avatarSrc} alt="Profile" style={styles.avatar} />
          <div style={styles.userInfo}>
            <p style={styles.userName}>{displayName}</p>
            <p style={styles.userEmail}>{user?.email}</p>
          </div>
        </div>

        {/* Notifications (Clickable) */}
        <div style={styles.notifRow} onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
          <i className="bi bi-bell" style={styles.notifIcon} />
          <span style={styles.notifText}>Notifications</span>
          {unreadCount > 0 && <div style={styles.notifBadge}>{unreadCount}</div>}
        </div>

        {/* Menu */}
        <div style={styles.menuContainer}>
          {menu.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                to={item.path}
                key={item.name}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? "rgba(59, 130, 246, 0.25)" : "transparent",
                }}
                onClick={() => { setOpen(false); setShowNotifDropdown(false); }}
              >
                <i className={`bi ${item.icon}`} style={styles.navIcon} />
                <span style={styles.navText}>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div style={styles.logoutContainer}>
          <button onClick={() => setShowLogoutModal(true)} style={styles.logoutButton}>
            <i className="bi bi-box-arrow-right" style={styles.navIcon} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Profile Dropdown */}
      {showProfileDropdown && (
        <div style={styles.profileDropdown}>
          <a href={`https://cheer-er.web.app/${userData?.username || user?.uid}`} style={styles.dropdownItem} target="_blank" rel="noopener noreferrer">
            <i className="bi bi-person" /> View Profile
          </a>
          <Link to="/settings" style={styles.dropdownItem} onClick={() => setShowProfileDropdown(false)}>
            <i className="bi bi-pencil" /> Edit Profile
          </Link>
        </div>
      )}

      {/* Notification Dropdown */}
      {showNotifDropdown && (
        <div style={styles.notifDropdown}>
          <div style={styles.dropdownHeader}>Recent Donations</div>
          {notifications.slice(0, 6).map(notif => (
            <div key={notif.id} style={styles.notifCard}>
              <strong>${notif.amount}</strong> from {notif.senderName || "Anonymous"}
              {notif.message && <p style={styles.notifMessage}>{notif.message.slice(0, 70)}...</p>}
            </div>
          ))}
          {notifications.length === 0 && <p style={styles.emptyState}>No new donations yet</p>}
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Sign Out</h3>
            <p style={styles.modalText}>Are you sure you want to sign out?</p>
            <div style={styles.modalButtons}>
              <button onClick={() => setShowLogoutModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={() => auth.signOut()} style={styles.confirmBtn}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  floatingButton: {
    position: "fixed",
    top: "20px",
    left: "20px",
    width: "52px",
    height: "52px",
    background: "transparent",
    border: "none",
    borderRadius: "50%",
    zIndex: 1000,
    boxShadow: "0 8px 25px rgba(0,0,0,0.5)",
    cursor: "pointer",
    backdropFilter: "blur(12px)",
  },
  menuIcon: { fontSize: "28px", color: "#fff" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999 },

  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "280px",
    background: "rgba(15, 23, 42, 0.72)",
    backdropFilter: "blur(36px) saturate(180%)",
    WebkitBackdropFilter: "blur(36px) saturate(180%)",
    borderRight: "1px solid rgba(148, 163, 184, 0.35)",
    boxShadow: "8px 0 45px rgba(0, 0, 0, 0.75)",
    color: "#e2e8f0",
    zIndex: 1001,
    transition: "transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    padding: "28px 24px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  logo: {
    margin: 0,
    fontSize: "29px",
    fontWeight: "900",
    letterSpacing: "-1px",
    background: "linear-gradient(90deg, #60a5fa, #93c5fd, #e0f2fe)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 25px rgba(96, 165, 250, 0.8)",
    fontStyle: "italic",
  },

  profile: {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
  },
  avatar: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    border: "3px solid #3b82f6",
    objectFit: "cover",
  },
  userInfo: { flex: 1 },
  userName: { margin: 0, fontSize: "18px", fontWeight: "600" },
  userEmail: { margin: "4px 0 0", fontSize: "13.5px", opacity: 0.75 },

  notifRow: {
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
  },
  notifIcon: { fontSize: "26px", color: "#60a5fa" },
  notifText: { fontSize: "16px", fontWeight: "500" },
  notifBadge: {
    marginLeft: "auto",
    background: "#ef4444",
    color: "white",
    fontSize: "12px",
    fontWeight: "bold",
    minWidth: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  menuContainer: { flex: 1, padding: "8px 0" },
  navItem: {
    display: "flex",
    alignItems: "center",
    padding: "14px 24px",
    margin: "2px 8px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#e2e8f0",
    fontSize: "15.5px",
  },
  navIcon: { fontSize: "23px", width: "34px", color: "#94a3b8" },
  navText: { marginLeft: "14px" },

  logoutContainer: { padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "14px 20px",
    background: "transparent",
    border: "none",
    color: "#e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
  },

  profileDropdown: {
    position: "absolute",
    top: "195px",
    left: "24px",
    width: "230px",
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(148, 163, 184, 0.4)",
    borderRadius: "12px",
    padding: "8px 0",
    zIndex: 1002,
    boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
  },
  dropdownItem: {
    padding: "12px 20px",
    color: "#e2e8f0",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  notifDropdown: {
    position: "absolute",
    top: "125px",
    left: "70px",
    width: "290px",
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(28px)",
    border: "1px solid rgba(148, 163, 184, 0.4)",
    borderRadius: "12px",
    zIndex: 1002,
    maxHeight: "420px",
    overflowY: "auto",
  },
  dropdownHeader: { padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: "600" },
  notifCard: { padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  notifMessage: { marginTop: "6px", fontSize: "13.5px", opacity: 0.8 },
  emptyState: { padding: "40px 20px", textAlign: "center", opacity: 0.6 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: {
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(24px)",
    padding: "28px",
    borderRadius: "14px",
    width: "340px",
    border: "1px solid rgba(148, 163, 184, 0.4)",
  },
  modalTitle: { margin: "0 0 12px", fontSize: "19px" },
  modalText: { margin: "0 0 24px", opacity: 0.85 },
  modalButtons: { display: "flex", gap: "12px" },
  cancelBtn: { flex: 1, padding: "13px", background: "rgba(51, 65, 85, 0.9)", border: "none", borderRadius: "10px", color: "#fff" },
  confirmBtn: { flex: 1, padding: "13px", background: "#ef4444", border: "none", borderRadius: "10px", color: "#fff" },
};

export default Navbar;