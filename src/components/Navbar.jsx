import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";

function Navbar() {

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [userData, setUserData] = useState(null);   // ← Added

  const location = useLocation();

  // Fetch User Profile from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(collection(db, "donations"), (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.streamerId === user.uid) {
          count++;
        }
      });
      setNotifications(count);
    });

    return () => unsub();
  }, []);

  const menu = [
    { name: "Dashboard", icon: "bi-speedometer2", path: "/dashboard" },
    { name: "Donation", icon: "bi-cash-stack", path: "/donation" },
    { name: "Withdraw", icon: "bi-wallet2", path: "/withdraw" },
    { name: "Settings", icon: "bi-gear", path: "/settings" }
  ];

  return (
    <>
      {/* MOBILE TOP */}
      <div className="mobileTop">
        <i className="bi bi-list" onClick={() => setOpen(true)}></i>
        <h3></h3>
      </div>

      {/* OVERLAY */}
      {open && <div className="overlay" onClick={() => setOpen(false)}></div>}

      {/* NAVBAR */}
      <div className={`navbar ${collapsed ? "collapsed" : ""} ${open ? "open" : ""}`}>

        <div className="navHeader">
          <h2>{collapsed ? "" : " Cheer ET"}</h2>
         
        </div>

        {/* PROFILE - Now using Firestore photoURL */}
        <div className="profile">
          <img
            src={userData?.photoURL || auth.currentUser?.photoURL || ""}
            alt="avatar"
            onError={(e) => e.target.src = ""}
          />
          
        </div>

        {/* MENU */}
        {menu.map((item, i) => {
          const active = location.pathname === item.path;
          return (
            <Link
              to={item.path}
              key={i}
              className={`navItem ${active ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <i className={`bi ${item.icon}`}></i>
              {!collapsed && <span>{item.name}</span>}

              {item.name === "Donation" && notifications > 0 && (
                <div className="badge">{notifications}</div>
              )}
            </Link>
          );
        })}

      </div>
    </>
  );
}

export default Navbar;