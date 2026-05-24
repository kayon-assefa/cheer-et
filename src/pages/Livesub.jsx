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
  BarChartFill, ArrowRepeat, Check,
} from "react-bootstrap-icons";

const LiveSub = () => {
  const [userData, setUserData]               = useState(null);
  const [currentUser, setCurrentUser]         = useState(null);
  const [count, setCount]                     = useState(0);
  const [menuOpen, setMenuOpen]               = useState(false);
  const [theme, setTheme]                     = useState("dark");
  const [goal, setGoal]                       = useState(0);
  const [goalInput, setGoalInput]             = useState("");
  const [showGoalInput, setShowGoalInput]     = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [congrats, setCongrats]               = useState(false);
  
  const [resetOffset, setResetOffset] = useState(0);
const [showProgressBar, setShowProgressBar] = useState(false);
const [showSubCount, setShowSubCount] = useState(true);
const [recentAlert, setRecentAlert] = useState(null);
  // Sub Timer
  const [showTimerPopup, setShowTimerPopup]   = useState(false);
  const [timerDoc, setTimerDoc]               = useState(null);
  const [timerForm, setTimerForm]             = useState({
    name: "", durationType: "hour", durationValue: 1,
    minsAdded: 5, unit: "sub",
  });
  const [timeLeft, setTimeLeft]               = useState(null);

  const prevCountRef  = useRef(0);
  const timerInterval = useRef(null);
  const alertTimeout  = useRef(null);

  const isPremium    = userData?.premium === "active" || userData?.premium === "plus";
  const displayCount = Math.max(0, count - resetOffset);
  const progressPct  = goal > 0 ? Math.min(100, (displayCount / goal) * 100) : 0;

useEffect(() => {
  const t   = localStorage.getItem("livesub_theme") || "dark";
  const g   = localStorage.getItem("livesub_goal");
  const pb  = localStorage.getItem("livesub_progressbar") === "true";
  const subVisible = localStorage.getItem("livesub_showcount");

  setTheme(t);

  if (g) {
    setGoal(Number(g));
    setGoalInput(g);
  }

  if (subVisible !== null) {
    setShowSubCount(subVisible === "true");
  }

  setShowProgressBar(pb);
}, []);

  /* ── Auth + user data ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) { setIsLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) { console.error(e); }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  /* ── Donations listener ── */
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "donations"), (snap) => {
      let total     = 0;
      let latestSub = null;
      let latestTs  = 0;

      snap.forEach((d) => {
        const data = d.data();
        if (
  data.streamerId === currentUser.uid &&
  (
    data.paymentStatus === "completed" ||
    data.status === "success"
  )
) {
          total++;
          const t = data.createdAt?.seconds || 0;
          if (t > latestTs) { latestTs = t; latestSub = data; }
        }
      });

      if (total > prevCountRef.current && prevCountRef.current !== 0) {
        playSound();
        if (latestSub) {
          clearTimeout(alertTimeout.current);
          setRecentAlert(latestSub);
          alertTimeout.current = setTimeout(() => setRecentAlert(null), 5500);
        }
        addTimeToTimer(currentUser.uid);
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

  /* ── Timer listener ── */
  useEffect(() => {
    if (!currentUser) return;
    const ref   = doc(db, "subTimers", currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setTimerDoc(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [currentUser]);

  /* ── Timer countdown tick ── */
  useEffect(() => {
    clearInterval(timerInterval.current);
    if (!timerDoc) { setTimeLeft(null); return; }
    const tick = () => {
      if (timerDoc.paused) {
        setTimeLeft(timerDoc.remainingMs ?? 0);
      } else {
        const end = timerDoc.endTime?.toMillis?.() ?? timerDoc.endTime;
        setTimeLeft(Math.max(0, end - Date.now()));
      }
    };
    tick();
    timerInterval.current = setInterval(tick, 1000);
    return () => clearInterval(timerInterval.current);
  }, [timerDoc]);

  /* ── Helpers ── */
  const addTimeToTimer = async (uid) => {
    try {
      const ref  = doc(db, "subTimers", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data  = snap.data();
      const addMs = (data.minsAdded || 0) * 60_000;
      if (!data.paused) {
        const end = data.endTime?.toMillis?.() ?? data.endTime;
        await updateDoc(ref, { endTime: Timestamp.fromMillis(end + addMs) });
      } else {
        await updateDoc(ref, { remainingMs: (data.remainingMs || 0) + addMs });
      }
    } catch (e) { console.error(e); }
  };
  const toggleSubCount = () => {
  const next = !showSubCount;

  setShowSubCount(next);

  localStorage.setItem(
    "livesub_showcount",
    String(next)
  );

  setMenuOpen(false);
};

  const startTimer = async () => {
    if (!currentUser || !timerForm.name.trim()) return;
    const ms =
      timerForm.durationType === "hour"
        ? timerForm.durationValue * 3_600_000
        : timerForm.durationValue * 86_400_000;
    await setDoc(doc(db, "subTimers", currentUser.uid), {
      name      : timerForm.name.trim(),
      minsAdded : Number(timerForm.minsAdded),
      unit      : timerForm.unit,
      endTime   : Timestamp.fromMillis(Date.now() + ms),
      startMs   : ms,
      paused    : false,
      remainingMs: null,
      startTime : Timestamp.now(),
      streamerId: currentUser.uid,
    });
    setShowTimerPopup(false);
  };

  const pauseResumeTimer = async () => {
    if (!currentUser || !timerDoc) return;
    const ref = doc(db, "subTimers", currentUser.uid);
    if (!timerDoc.paused) {
      const rem = (timerDoc.endTime?.toMillis?.() ?? timerDoc.endTime) - Date.now();
      await updateDoc(ref, { paused: true, remainingMs: Math.max(0, rem) });
    } else {
      await updateDoc(ref, {
        paused: false,
        endTime: Timestamp.fromMillis(Date.now() + (timerDoc.remainingMs || 0)),
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
        name        : timerDoc.name || "",
        durationType: "hour",
        durationValue: 1,
        minsAdded   : timerDoc.minsAdded || 5,
        unit        : timerDoc.unit || "sub",
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

  const handleReset = () => { setResetOffset(count); setMenuOpen(false); };

  const changeTheme = (t) => {
    setTheme(t);
    localStorage.setItem("livesub_theme", t);
    setMenuOpen(false);
  };

const saveGoal = () => {
  const n = Number(goalInput);

  if (n > 0) {
    setGoal(n);
    localStorage.setItem("livesub_goal", n);

    // hide input after saving
    setShowGoalInput(false);

    // close menu too
    setMenuOpen(false);
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
    if (!ms || ms <= 0) return "00:00:00";
    const s  = Math.floor(ms / 1000);
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    const p  = (n) => String(n).padStart(2, "0");
    if (h >= 24) {
      const d = Math.floor(h / 24);
      return `${d}d ${p(h % 24)}:${p(m)}:${p(sc)}`;
    }
    return `${p(h)}:${p(m)}:${p(sc)}`;
  };

  // Timer elapsed % for the bar
  const timerPct = timerDoc && timeLeft != null
    ? Math.max(0, Math.min(100,
        timerDoc.paused
          ? (1 - timeLeft / (timerDoc.startMs || 1)) * 100
          : (1 - timeLeft / ((timerDoc.endTime?.toMillis?.() - timerDoc.startTime?.toMillis?.()) || 1)) * 100
      ))
    : 0;

  return (
    <div className={`live-container ${theme}`}>

      {/* ── Menu trigger ── */}
      <div className="top-left">
        <button className="menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
          <ThreeDotsVertical size={20} />
        </button>

        {menuOpen && (
          <div className="menu">
            <span className="menu-label">Themes</span>
            <button onClick={() => changeTheme("dark")}>Dark</button>
            <button onClick={() => changeTheme("light")}>Light</button>
            <button onClick={() => changeTheme("default")}>Gradient</button>
            <button onClick={() => changeTheme("chroma")}>Chroma Key</button>
<button onClick={toggleSubCount}>
  {showSubCount ? "Hide" : "Show"} Subscriber Count
</button>

            <div className="menu-divider" />
            <span className="menu-label">Tools</span>

            <button onClick={() => { setShowGoalInput(!showGoalInput); setMenuOpen(false); }}>
              <PlusCircle size={14} /> Set Goal
            </button>
            <button onClick={toggleProgressBar}>
              <BarChartFill size={14} /> {showProgressBar ? "Hide" : "Show"} Progress Bar
            </button>
            <button onClick={handleReset}>
              <ArrowRepeat size={14} /> Reset Count
            </button>

            {isPremium && !timerDoc && (
              <button className="menu-sub-btn" onClick={() => { setShowTimerPopup(true); setMenuOpen(false); }}>
                Sub Timer
              </button>
            )}

            {!isPremium && (
              <button className="menu-upgrade-btn" onClick={() => window.location.href = "/premium"}>
                Upgrade
              </button>
            )}

            {timerDoc && (
              <>
                <div className="menu-divider" />
                <span className="menu-label">Sub Timer</span>
                <button onClick={pauseResumeTimer}>
                  {timerDoc.paused
                    ? <><PlayFill size={14} /> Resume</>
                    : <><PauseFill size={14} /> Pause</>}
                </button>
                <button onClick={editTimer}>
                  <PencilSquare size={14} /> Edit
                </button>
                <button className="menu-danger" onClick={deleteTimer}>
                  <Trash size={14} /> Delete
                </button>
              </>
            )}

            <div className="menu-divider" />
            <button onClick={toggleFullscreen}>Fullscreen</button>
          </div>
        )}
      </div>

      {/* ── Goal input panel ── */}
      {showGoalInput && (
        <div className="goal-panel">
          <input
            type="number"
            placeholder="Subscriber goal"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveGoal()}
          />
          <button onClick={saveGoal}><Check size={16} /></button>
        </div>
      )}

      {/* ── Live badge ── */}
      <div className="live-badge">
        <span className="live-dot" />
        LIVE
      </div>

      {/* ── Center ── */}
      <div className="center">
        {isLoading ? (
          <div className="loader">
            <span /><span /><span />
          </div>
        ) : (
          <>
            <img
              src={userData?.photoURL || ""}
              alt="avatar"
              className="avatar"
            />

            <div className="username-row">
              <span className="username">{userData?.username || "User"}</span>
              {userData?.verified && (
                <img src="/verified.png" className="verified-badge" alt="" />
              )}
            </div>

          {showSubCount && (
  <>
    <div className="count-wrap">
      <span className="count-num">
        {displayCount.toLocaleString()}
      </span>
    </div>

    <p className="count-label">SUBSCRIBERS</p>
  </>
)}

            {/* Goal — only if user set one */}
            {goal > 0 && (
              <div className="goal-row">
                {displayCount.toLocaleString()}
                <span className="goal-slash"> / </span>
                {goal.toLocaleString()}
              </div>
            )}

            {/* Progress bar — only if enabled AND goal is set */}
            {showProgressBar && goal > 0 && (
              <div className="progress-wrap">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="progress-pct">{progressPct.toFixed(0)}%</span>
              </div>
            )}

            {/* Sub Timer — Twitch hype-train style */}
            {timerDoc && timeLeft != null && (
              <div className={`sub-train ${timerDoc.paused ? "is-paused" : ""}`}>
                <div className="train-top">
                  <span className="train-name">{timerDoc.name}</span>
                  <span className="train-time">{formatTime(timeLeft)}</span>
                </div>
                <div className="train-track">
                  <div className="train-fill" style={{ width: `${100 - timerPct}%` }} />
                </div>
                <div className="train-meta">
                  {timerDoc.paused
                    ? "Paused"
                    : `+${timerDoc.minsAdded} min per ${timerDoc.unit === "birr" ? "Birr" : "sub"}`}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── New sub alert ── */}
      {recentAlert && (
        <div className="sub-alert">
          <Trophy size={18} className="alert-icon" />
          <div className="alert-body">
            <span className="alert-label">New Subscriber</span>
            <span className="alert-name">{recentAlert.donorName || "Anonymous"}</span>
          </div>
        </div>
      )}

      {/* ── Goal reached overlay ── */}
      {congrats && (
        <div className="congrats-overlay">
          <Trophy size={72} className="congrats-trophy" />
          <h1>GOAL REACHED</h1>
        </div>
      )}

      {/* ── Timer setup popup ── */}
      {showTimerPopup && isPremium && (
        <div className="modal-bg" onClick={() => setShowTimerPopup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sub Timer</h3>
            <p className="modal-sub">Each subscriber extends your countdown.</p>

            <label>Session Name</label>
            <input
              type="text"
              placeholder="e.g. Tonight's Stream"
              value={timerForm.name}
              onChange={(e) => setTimerForm({ ...timerForm, name: e.target.value })}
            />

            <label>Starting Duration</label>
            <div className="input-row">
              <input
                type="number"
                min="1"
                value={timerForm.durationValue}
                onChange={(e) => setTimerForm({ ...timerForm, durationValue: Number(e.target.value) })}
              />
              <select
                value={timerForm.durationType}
                onChange={(e) => setTimerForm({ ...timerForm, durationType: e.target.value })}
              >
                <option value="hour">Hour(s)</option>
                <option value="day">Day(s)</option>
              </select>
            </div>

            <label>Time Added Per</label>
            <div className="input-row">
              <input
                type="number"
                min="1"
                placeholder="Minutes"
                value={timerForm.minsAdded}
                onChange={(e) => setTimerForm({ ...timerForm, minsAdded: Number(e.target.value) })}
              />
              <select
                value={timerForm.unit}
                onChange={(e) => setTimerForm({ ...timerForm, unit: e.target.value })}
              >
                <option value="sub">Per Sub</option>
                <option value="birr">Per Birr</option>
                <option value="min">Per Min</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowTimerPopup(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={startTimer}
                disabled={!timerForm.name.trim()}
              >
                {timerDoc ? "Update" : "Start"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu on backdrop */}
      {menuOpen && (
        <div className="backdrop" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
};

export default LiveSub;