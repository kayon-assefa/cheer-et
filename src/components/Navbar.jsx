import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [userData, setUserData] = useState(null);

  const location = useLocation();
  const user = auth.currentUser;

  // Fetch user data
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "donations"), (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        if (doc.data().streamerId === user.uid) count++;
      });
      setNotifications(count);
    });
    return () => unsub();
  }, [user]);

  const menu = [
    { name: "Dashboard", icon: "bi-speedometer2", path: "/dashboard" },
    { name: "Donation", icon: "bi-cash-stack", path: "/donation" },
    { name: "Withdraw", icon: "bi-wallet2", path: "/withdraw" },
    { name: "Settings", icon: "bi-gear", path: "/settings" },
  ];

  const avatarSrc = userData?.photoURL || user?.photoURL || "https://via.placeholder.com/48";

  return (
    <>
      {/* Mobile Top Bar */}
      <div style={styles.mobileTop}>
        <i className="bi bi-list" style={styles.menuIcon} onClick={() => setOpen(true)}></i>
        <h3 style={styles.logoMobile}>Cheer ET</h3>
        <img src={avatarSrc} alt="avatar" style={styles.mobileAvatar} />
      </div>

      {/* Overlay */}
      {open && <div style={styles.overlay} onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <div style={{
        ...styles.navbar,
        transform: open ? "translateX(0)" : "translateX(-100%)"
      }}>
        
        {/* Neon Logo */}
        <div style={styles.header}>
          <h2 style={styles.logo}>CHEER ET</h2>
        </div>

        {/* Profile */}
        <div style={styles.profile}>
          <img
            src={avatarSrc}
            alt="Profile"
            style={styles.avatar}
            onError={(e) => (e.target.src = "https://via.placeholder.com/48")}
          />
          <div style={styles.userInfo}>
            <p style={styles.userName}>
              {userData?.displayName || user?.displayName || "Streamer"}
            </p>
            <p style={styles.userEmail}>{user?.email}</p>
          </div>
        </div>

        {/* Menu */}
        <div style={styles.menuContainer}>
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                to={item.path}
                key={item.name}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? "rgba(59, 130, 246, 0.25)" : "transparent",
                }}
                onClick={() => setOpen(false)}
              >
                <i className={`bi ${item.icon}`} style={styles.navIcon} />
                <span style={styles.navText}>{item.name}</span>

                {item.name === "Donation" && notifications > 0 && (
                  <div style={styles.badge}>{notifications}</div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div style={styles.logoutContainer}>
          <button onClick={() => auth.signOut()} style={styles.logoutButton}>
            <i className="bi bi-box-arrow-right" style={styles.navIcon} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  mobileTop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "65px",
    background: "linear-gradient(90deg, #1e3a8a, #3b82f6)",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    zIndex: 1000,
    color: "white",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  menuIcon: { fontSize: "30px", cursor: "pointer" },
  logoMobile: { flex: 1, textAlign: "center", margin: 0, fontSize: "21px", fontWeight: "700" },
  mobileAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    zIndex: 999,
  },

  navbar: {
    position: "fixed",
    top: "65px",
    left: 0,
    bottom: 0,
    width: "260px",
    background: "linear-gradient(180deg, rgba(30, 64, 175, 0.85), rgba(15, 23, 42, 0.9))",
    backdropFilter: "blur(18px)",
    borderRight: "1px solid rgba(147, 197, 253, 0.3)",
    color: "#e0f2fe",
    zIndex: 1001,
    transition: "transform 0.4s ease",
    boxShadow: "3px 0 15px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    padding: "28px 20px 20px",
    borderBottom: "1px solid rgba(147, 197, 253, 0.2)",
  },
  logo: {
    margin: 0,
    fontSize: "27px",
    fontWeight: "900",
    letterSpacing: "2px",
    background: "linear-gradient(90deg, #93c5fd, #e0f2fe)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 20px rgba(147, 197, 253, 0.8)",
  },

  profile: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    borderBottom: "1px solid rgba(147, 197, 253, 0.2)",
  },
  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "2px solid #60a5fa",
  },
  userInfo: { flex: 1 },
  userName: { margin: "0 0 4px 0", fontWeight: "600", fontSize: "16px" },
  userEmail: { margin: 0, fontSize: "13px", opacity: 0.85 },

  menuContainer: { flex: 1, padding: "12px 8px" },

  navItem: {
    display: "flex",
    alignItems: "center",
    padding: "15px 20px",
    margin: "6px 8px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#e0f2fe",
    transition: "all 0.3s ease",
  },
  navIcon: { fontSize: "22px", width: "32px" },
  navText: { marginLeft: "14px", fontWeight: "500" },

  badge: {
    marginLeft: "auto",
    backgroundColor: "#ef4444",
    color: "white",
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "9999px",
  },

  logoutContainer: {
    padding: "16px 8px",
    borderTop: "1px solid rgba(147, 197, 253, 0.2)",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "15px 20px",
    margin: "0 8px",
    background: "transparent",
    border: "none",
    color: "#e0f2fe",
    borderRadius: "10px",
    cursor: "pointer",
  },
};

export default Navbar;