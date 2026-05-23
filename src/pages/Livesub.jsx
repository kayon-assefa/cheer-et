import React, { useEffect, useState } from "react";
import "../styles/livesub.css";
import { db, auth } from "../firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ThreeDotsVertical, PlusCircle, Trophy } from "react-bootstrap-icons";

const LiveSub = () => {
  const [userData, setUserData] = useState(null);
  const [count, setCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [goal, setGoal] = useState(0);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [congrats, setCongrats] = useState(false);

  // Load saved settings
  useEffect(() => {
    const savedTheme = localStorage.getItem("livesub_theme") || "dark";
    const savedGoal = localStorage.getItem("livesub_goal");

    setTheme(savedTheme);

    if (savedGoal) setGoal(Number(savedGoal));
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("livesub_theme", newTheme);
    setMenuOpen(false);
  };

  // ✅ FIXED USER DATA
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        // ONLY current logged in user
        const userRef = doc(db, "users", currentUser.uid);

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.error("User Load Error:", error);
      }

      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // ✅ FIXED DONATION COUNT
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;

      const unsub = onSnapshot(collection(db, "donations"), (snap) => {
        let total = 0;

        snap.forEach((doc) => {
          const d = doc.data();

          // ONLY current streamer donations
          if (d.streamerId === currentUser.uid) {
            total++;
          }
        });

        if (total > prevCount && prevCount !== 0) {
          playSound();

          if (goal > 0 && total >= goal && count < goal) {
            setCongrats(true);
            setTimeout(() => setCongrats(false), 5000);
          }
        }

        setPrevCount(count);
        setCount(total);
      });

      return () => unsub();
    });

    return () => unsubscribeAuth();
  }, [count, prevCount, goal]);

  const playSound = () => {
    const audio = new Audio("SFX.mp3");
    audio.volume = 0.35;
    audio.play().catch(() => {});
  };

  const saveGoal = () => {
    if (goal > 0) {
      localStorage.setItem("livesub_goal", goal);
      setShowGoalInput(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen();
    else document.exitFullscreen();

    setMenuOpen(false);
  };

  return (
    <div className={`live-container ${theme}`}>

      {/* Menu */}
      <div className="top-left">
        <ThreeDotsVertical
          size={26}
          onClick={() => setMenuOpen(!menuOpen)}
        />

        {menuOpen && (
          <div className="menu">
            <p onClick={() => changeTheme("dark")}>Dark Gray</p>
            <p onClick={() => changeTheme("light")}>Light</p>
            <p onClick={() => changeTheme("default")}>Gradient</p>
            <p onClick={() => changeTheme("chroma")}>Chroma Key</p>

            <hr />

            <p onClick={() => setShowGoalInput(!showGoalInput)}>
              <PlusCircle size={18} /> Add Goal
            </p>

            <p onClick={toggleFullscreen}>
              Fullscreen
            </p>
          </div>
        )}
      </div>

      {/* Goal Input */}
      {showGoalInput && (
        <div className="goal-input">
          <input
            type="number"
            placeholder="Enter goal Sub"
            value={goal || ""}
            onChange={(e) => setGoal(Number(e.target.value))}
          />

          <button onClick={saveGoal}>
            Save
          </button>
        </div>
      )}

      {/* Realtime */}
      <div className="realtime">
        <span className="wave-dot"></span>
        Live Updating
      </div>

      {/* Center */}
      <div className="center">
        {isLoading ? (
          <div className="loading">
            Loading...
          </div>
        ) : (
          <>
            <img
              src={userData?.photoURL || ""}
              alt="profile"
              className="profile"
            />

            <div className="name-row">
              <h2>
                {userData?.username || "User"}
              </h2>

              {userData?.verified && (
                <img
                  src="/verified.png"
                  className="verified"
                  alt="verified"
                />
              )}
            </div>

            <div className="counter">
              <span className="count-number">
                {count.toLocaleString()}
              </span>
            </div>

            <p className="label">
              TOTAL SUBS
            </p>

            {goal > 0 && (
              <div className="goal-display">
                {count.toLocaleString()} / {goal.toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Congrats */}
      {congrats && (
        <div className="congrats-overlay">
          <Trophy size={90} className="trophy" />
          <h1>GOAL REACHED!</h1>
        </div>
      )}
    </div>
  );
};

export default LiveSub;