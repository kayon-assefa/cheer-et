import React, { useEffect, useState, useRef } from "react";
import "../styles/livesub.css";
import { db, auth } from "../firebase";
import {
  collection, onSnapshot, doc, getDoc,
  setDoc, deleteDoc, updateDoc, Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ThreeDotsVertical, PlusCircle, Trophy,
  PauseFill, PlayFill, Trash, PencilSquare,
  BarChartFill, StarFill, ClockFill, PersonFill,
  CheckCircleFill, Lightning, ArrowRepeat,
} from "react-bootstrap-icons";

const LiveSub = () => {
  const [userData, setUserData]         = useState(null);
  const [currentUser, setCurrentUser]   = useState(null);
  const [count, setCount]               = useState(0);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [theme, setTheme]               = useState("dark");
  const [goal, setGoal]                 = useState(0);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [isLoading, setIsLoading]       = useState(true);
  const [congrats, setCongrats]         = useState(false);
  const [resetOffset, setResetOffset]   = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [recentAlert, setRecentAlert]   = useState(null);
  const [subRate, setSubRate]           = useState(0);

  // Sub Timer
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [timerDoc, setTimerDoc]         = useState(null);
  const [timerForm, setTimerForm]       = useState({
    name: "", durationType: "hour", durationValue: 1, minPerBirr: 5,
  });
  const [timeLeft, setTimeLeft]         = useState(null);

  const prevCountRef  = useRef(0);
  const timerInterval = useRef(null);
  const subTimestamps = useRef([]);
  const alertTimeout  = useRef(null);

  const isPremium    = userData?.premium === "active" || userData?.premium === "plus";
  const displayCount = Math.max(0, count - resetOffset);
  const progressPct  = goal > 0 ? Math.min(100, (displayCount / goal) * 100) : 0;

  /* ─── Load saved settings ───────────────────────────────── */
  useEffect(() => {
    const savedTheme = localStorage.getItem("livesub_theme") || "dark";
    const savedGoal  = localStorage.getItem("livesub_goal");
    const savedPBar  = localStorage.getItem("livesub_progressbar") === "true";
    setTheme(savedTheme);
    if (savedGoal) setGoal(Number(savedGoal));
    setShowProgressBar(savedPBar);
  }, []);

  /* ─── Auth + user data ──────────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) { setIsLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) { console.error("User load error:", e); }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  /* ─── Donations listener ────────────────────────────────── */
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "donations"), (snap) => {
      let total      = 0;
      let latestSub  = null;
      let latestTime = 0;

      snap.forEach((d) => {
        const data = d.data();
        if (
          data.streamerId === currentUser.uid &&
          data.status     === "success"          // ← only count successful subs
        ) {
          total++;
          const t = data.createdAt?.seconds || 0;
          if (t > latestTime) { latestTime = t; latestSub = data; }
        }
      });

      if (total > prevCountRef.current && prevCountRef.current !== 0) {
        playSound();

        // Recent sub alert
        if (latestSub) {
          clearTimeout(alertTimeout.current);
          setRecentAlert(latestSub);
          alertTimeout.current = setTimeout(() => setRecentAlert(null), 6000);
        }

        // Sub/hr rate
        subTimestamps.current.push(Date.now());
        subTimestamps.current = subTimestamps.current.filter(
          (t) => Date.now() - t < 3_600_000
        );
        setSubRate(subTimestamps.current.length);

        // Add time to timer
        addTimeToTimer(currentUser.uid);

        // Goal reached
        if (goal > 0 && total >= goal && prevCountRef.current < goal) {
          setCongrats(true);
          setTimeout(() => setCongrats(false), 5000);
        }
      }

      prevCountRef.current = total;
      setCount(total);
    });
    return unsub;
  }, [currentUser, goal]);

  /* ─── Sub Timer listener ────────────────────────────────── */
  useEffect(() => {
    if (!currentUser) return;
    const ref  = doc(db, "subTimers", currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setTimerDoc(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [currentUser]);

  /* ─── Timer countdown ───────────────────────────────────── */
  useEffect(() => {
    clearInterval(timerInterval.current);
    if (!timerDoc) { setTimeLeft(null); return; }

    const tick = () => {
      if (timerDoc.paused) {
        setTimeLeft(timerDoc.remainingMs ?? 0);
      } else {
        const end       = timerDoc.endTime?.toMillis?.() ?? timerDoc.endTime;
        const remaining = end - Date.now();
        setTimeLeft(Math.max(0, remaining));
      }
    };
    tick();
    timerInterval.current = setInterval(tick, 1000);
    return () => clearInterval(timerInterval.current);
  }, [timerDoc]);

  /* ─── Helpers ───────────────────────────────────────────── */
  const addTimeToTimer = async (uid) => {
    try {
      const ref  = doc(db, "subTimers", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data   = snap.data();
      const addMs  = (data.minPerBirr || 0) * 60 * 1000;
      if (!data.paused) {
        const currentEnd = data.endTime?.toMillis?.() ?? data.endTime;
        await updateDoc(ref, { endTime: Timestamp.fromMillis(currentEnd + addMs) });
      } else {
        await updateDoc(ref, { remainingMs: (data.remainingMs || 0) + addMs });
      }
    } catch (e) { console.error("Timer update error:", e); }
  };

  const startTimer = async () => {
    if (!currentUser) return;
    const { name, durationType, durationValue, minPerBirr } = timerForm;
    const durationMs =
      durationType === "hour"
        ? durationValue * 3_600_000
        : durationValue * 86_400_000;

    await setDoc(doc(db, "subTimers", currentUser.uid), {
      name,
      minPerBirr : Number(minPerBirr),
      endTime    : Timestamp.fromMillis(Date.now() + durationMs),
      paused     : false,
      remainingMs: null,
      startTime  : Timestamp.now(),
      streamerId : currentUser.uid,
    });
    setShowTimerPopup(false);
  };

  const pauseResumeTimer = async () => {
    if (!currentUser || !timerDoc) return;
    const ref = doc(db, "subTimers", currentUser.uid);
    if (!timerDoc.paused) {
      const remaining = (timerDoc.endTime?.toMillis?.() ?? timerDoc.endTime) - Date.now();
      await updateDoc(ref, { paused: true, remainingMs: Math.max(0, remaining) });
    } else {
      await updateDoc(ref, {
        paused     : false,
        endTime    : Timestamp.fromMillis(Date.now() + (timerDoc.remainingMs || 0)),
        remainingMs: null,
      });
    }
    setMenuOpen(false);
  };

  const deleteTimer = async () => {
    if (!currentUser) return;
    await deleteDoc(doc(db, "subTimers", currentUser.uid));
    setMenuOpen(false);
  };

  const editTimer = () => {
    if (timerDoc) {
      setTimerForm({
        name         : timerDoc.name || "",
        durationType : "hour",
        durationValue: 1,
        minPerBirr   : timerDoc.minPerBirr || 5,
      });
    }
    setShowTimerPopup(true);
    setMenuOpen(false);
  };

  const playSound = () => {
    const audio = new Audio("SFX.mp3");
    audio.volume = 0.35;
    audio.play().catch(() => {});
  };

  const handleReset = () => {
    setResetOffset(count); // session-only; clears on reload
    setMenuOpen(false);
  };

  const changeTheme = (t) => {
    setTheme(t);
    localStorage.setItem("livesub_theme", t);
    setMenuOpen(false);
  };

  const saveGoal = () => {
    if (goal > 0) {
      localStorage.setItem("livesub_goal", goal);
      setShowGoalInput(false);
    }
  };

  const toggleProgressBar = () => {
    const next = !showProgressBar;
    setShowProgressBar(next);
    localStorage.setItem("livesub_progressbar", String(next));
    setMenuOpen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
    setMenuOpen(false);
  };

  const formatTime = (ms) => {
    if (ms == null || ms <= 0) return "00:00:00";
    const totalSec = Math.floor(ms / 1000);
    const h        = Math.floor(totalSec / 3600);
    const m        = Math.floor((totalSec % 3600) / 60);
    const s        = totalSec % 60;
    const pad      = (n) => String(n).padStart(2, "0");
    if (h >= 24) {
      const d  = Math.floor(h / 24);
      const rh = h % 24;
      return `${d}d ${pad(rh)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  /* ─── Render ────────────────────────────────────────────── */
  return (
    <div className={`live-container ${theme}`}>

      {/* ── Menu ── */}
      <div className="top-left">
        <div className="menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
          <ThreeDotsVertical size={24} />
        </div>

        {menuOpen && (
          <div className="menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-section-label">Themes</div>
            <p onClick={() => changeTheme("dark")}>🌑 Dark Gray</p>
            <p onClick={() => changeTheme("light")}>☀️ Light</p>
            <p onClick={() => changeTheme("default")}>🌊 Gradient</p>
            <p onClick={() => changeTheme("chroma")}>🟩 Chroma Key</p>

            <hr />
            <div className="menu-section-label">Settings</div>
            <p onClick={() => { setShowGoalInput(!showGoalInput); setMenuOpen(false); }}>
              <PlusCircle size={15} /> Set Goal
            </p>
            <p onClick={toggleProgressBar}>
              <BarChartFill size={15} /> {showProgressBar ? "Hide" : "Show"} Progress Bar
            </p>
            <p onClick={handleReset}>
              <ArrowRepeat size={15} /> Reset Count
            </p>

            {/* Timer controls — only when a timer is active */}
            {timerDoc && (
              <>
                <hr />
                <div className="menu-section-label">Timer</div>
                <p onClick={pauseResumeTimer}>
                  {timerDoc.paused
                    ? <><PlayFill size={15} /> Resume Timer</>
                    : <><PauseFill size={15} /> Pause Timer</>}
                </p>
                <p onClick={editTimer}><PencilSquare size={15} /> Edit Timer</p>
                <p onClick={deleteTimer} className="danger">
                  <Trash size={15} /> Delete Timer
                </p>
              </>
            )}

            <hr />
            <p onClick={toggleFullscreen}>⛶ Fullscreen</p>
          </div>
        )}
      </div>

      {/* ── Goal input ── */}
      {showGoalInput && (
        <div className="goal-input">
          <input
            type="number"
            placeholder="Set goal…"
            value={goal || ""}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
          <button onClick={saveGoal}>Save</button>
        </div>
      )}

      {/* ── Live indicator ── */}
      <div className="realtime">
        <span className="wave-dot" />
        Live Updating
      </div>

      {/* ── Premium / Upgrade button ── */}
      <div className="premium-wrap">
        {isPremium ? (
          <button
            className="premium-btn active-btn"
            onClick={() => {
              if (timerDoc) {
                setTimerForm({
                  name         : timerDoc.name || "",
                  durationType : "hour",
                  durationValue: 1,
                  minPerBirr   : timerDoc.minPerBirr || 5,
                });
              }
              setShowTimerPopup(true);
            }}
          >
            <StarFill size={13} /> Active
          </button>
        ) : (
          <button
            className="premium-btn upgrade-btn"
            onClick={() => (window.location.href = "/premium")}
          >
            <Lightning size={13} /> Upgrade
          </button>
        )}
      </div>

      {/* ── Center ── */}
      <div className="center">
        {isLoading ? (
          <div className="loading">
            <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
          </div>
        ) : (
          <>
            <div className="profile-ring">
              <img
                src={userData?.photoURL || ""}
                alt="profile"
                className="profile"
              />
            </div>

            <div className="name-row">
              <h2>{userData?.username || "User"}</h2>
              {userData?.verified && (
                <img src="/verified.png" className="verified" alt="verified" />
              )}
            </div>

            <div className="counter">
              <span className="count-number">{displayCount.toLocaleString()}</span>
            </div>

            <p className="label">TOTAL SUBS</p>

            {goal > 0 && (
              <div className="goal-display">
                <span className="goal-current">{displayCount.toLocaleString()}</span>
                <span className="goal-sep"> / </span>
                <span className="goal-total">{goal.toLocaleString()}</span>
              </div>
            )}

            {/* Progress bar */}
            {showProgressBar && goal > 0 && (
              <div className="progress-wrap">
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                  {progressPct >= 100 && (
                    <CheckCircleFill size={14} className="progress-complete" />
                  )}
                </div>
                <span className="progress-label">{progressPct.toFixed(1)}%</span>
              </div>
            )}

            {/* Stats row */}
            <div className="stats-row">
              <div className="stat-chip">
                <PersonFill size={12} /> {subRate}/hr
              </div>
              {goal > 0 && (
                <div className="stat-chip">
                  <BarChartFill size={12} /> {goal - displayCount > 0 ? `${goal - displayCount} to goal` : "Goal reached!"}
                </div>
              )}
            </div>

            {/* Sub Timer display */}
            {timerDoc && timeLeft !== null && (
              <div className={`timer-card ${timerDoc.paused ? "timer-paused" : ""}`}>
                <div className="timer-header">
                  <ClockFill size={13} className="timer-clock-icon" />
                  <span className="timer-name">{timerDoc.name}</span>
                  {timerDoc.paused && <span className="paused-badge">PAUSED</span>}
                </div>
                <div className="timer-countdown">{formatTime(timeLeft)}</div>
                <div className="timer-meta">+{timerDoc.minPerBirr} min per sub</div>
                <div className="timer-bar">
                  <div
                    className="timer-bar-fill"
                    style={{
                      width: timerDoc.startTime
                        ? `${Math.min(
                            100,
                            (1 - timeLeft /
                              ((timerDoc.endTime?.toMillis?.() ?? Date.now()) -
                               timerDoc.startTime.toMillis())) * 100
                          )}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Recent Sub Alert ── */}
      {recentAlert && (
        <div className="sub-alert">
          <div className="sub-alert-glow" />
          <Trophy size={20} className="alert-trophy" />
          <div className="alert-text">
            <span className="alert-title">New Subscriber!</span>
            <span className="alert-name">{recentAlert.donorName || "Anonymous"}</span>
          </div>
        </div>
      )}

      {/* ── Congrats overlay ── */}
      {congrats && (
        <div className="congrats-overlay">
          <Trophy size={90} className="trophy" />
          <h1>GOAL REACHED!</h1>
          <p>{displayCount.toLocaleString()} Subscribers</p>
        </div>
      )}

      {/* ── Timer Popup ── */}
      {showTimerPopup && isPremium && (
        <div className="modal-overlay" onClick={() => setShowTimerPopup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>⏱ Subscription Timer</h3>
            <p className="modal-subtitle">
              Each subscriber extends your session by the chosen minutes.
            </p>

            <label>Session Name</label>
            <input
              type="text"
              placeholder="e.g. Tonight's Stream"
              value={timerForm.name}
              onChange={(e) => setTimerForm({ ...timerForm, name: e.target.value })}
            />

            <label>Starting Duration</label>
            <div className="form-row">
              <input
                type="number"
                min="1"
                value={timerForm.durationValue}
                onChange={(e) =>
                  setTimerForm({ ...timerForm, durationValue: Number(e.target.value) })
                }
              />
              <select
                value={timerForm.durationType}
                onChange={(e) =>
                  setTimerForm({ ...timerForm, durationType: e.target.value })
                }
              >
                <option value="hour">Hour(s)</option>
                <option value="day">Day(s)</option>
              </select>
            </div>

            <label>Minutes Added per Subscriber (Birr)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={timerForm.minPerBirr}
              onChange={(e) =>
                setTimerForm({ ...timerForm, minPerBirr: Number(e.target.value) })
              }
            />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowTimerPopup(false)}>
                Cancel
              </button>
              <button
                className="btn-start"
                onClick={startTimer}
                disabled={!timerForm.name.trim()}
              >
                {timerDoc ? "✏️ Update Timer" : "▶ Start Timer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
};

export default LiveSub;