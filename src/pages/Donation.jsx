/**
 * Donation.jsx — Cheer ET Donation Dashboard
 * ─────────────────────────────────────────────────────────────────────────
 * REQUIRES in index.html <head>:
 *   <link rel="stylesheet"
 *     href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
 *
 * Firebase document shape:
 *   donations : { streamerId, donorName, amount, message, paymentStatus, createdAt }
 *   goals     : { ownerId, name, target, endDate, image, createdAt }
 *   events    : { ownerId, name, startTime, duration, createdAt }
 *   users     : { banned, premium }   (premium: "active"|"premium"|"plus" or absent → basic)
 *
 * Dependencies: firebase, react-router-dom, recharts, canvas-confetti,
 *               html2canvas, jspdf
 */

import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection, query, where, orderBy, limit,
  onSnapshot, addDoc, deleteDoc, doc, getDoc, serverTimestamp,
} from "firebase/firestore";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../styles/donation.css";

/* ─── Firebase singletons ───────────────────────────────────────────────── */
const auth = getAuth();
const db   = getFirestore();

/* ─── Constants ─────────────────────────────────────────────────────────── */
const ETB_RATE   = 158;
const PAGE_SIZE  = 20;
const PIE_COLORS = ["#0071e3","#3b82f6","#60a5fa","#93c5fd","#1d4ed8","#2563eb","#7c3aed"];
const PLAN_LIMITS = {
  basic  : { goals: 1, events: 1 },
  premium: { goals: 3, events: 2 },
  plus   : { goals: 3, events: 3 },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const getPlan = (ud) => {
  if (!ud) return "basic";
  const p = ud.premium;
  if (p === "plus") return "plus";
  if (p === "active" || p === "premium") return "premium";
  return "basic";
};

const fmt = (n, cur) =>
  cur === "USD"
    ? `$${(n / ETB_RATE).toFixed(2)}`
    : `${Number(n).toLocaleString()} ETB`;

const toDate = (ts) => ts?.toDate?.() ?? new Date(ts ?? 0);

const msForRange = (r) =>
  ({ "24 Hours": 864e5, "7 Days": 7*864e5, "30 Days": 30*864e5,
     "Month": 30*864e5, "Year": 365*864e5 }[r] ?? 7*864e5);

const dateKey = (ts, range) => {
  const d = toDate(ts);
  return range === "24 Hours"
    ? d.toLocaleTimeString("en-US", { hour: "2-digit", hour12: true })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function buildHeatmap(donations) {
  const map = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  donations.forEach((d) => {
    const k = toDate(d.createdAt).toISOString().slice(0, 10);
    if (k in map) map[k] += d.amount ?? 0;
  });
  return Object.entries(map).map(([date, amount]) => ({ date, amount }));
}

function exportCSV(donations, currency) {
  const unit = currency === "USD" ? "USD" : "ETB";
  const rows = [
    ["Donor", "Message", `Amount (${unit})`, "Date"],
    ...donations.map((d) => [
      `"${d.donorName ?? "Anonymous"}"`,
      `"${(d.message ?? "").replace(/"/g, '""')}"`,
      currency === "USD" ? (d.amount / ETB_RATE).toFixed(2) : d.amount,
      toDate(d.createdAt).toLocaleString(),
    ]),
  ];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" })
  );
  a.download = "donations.csv";
  a.click();
}

function fireConfetti() {
  confetti({
    particleCount: 140, spread: 80, origin: { y: 0.6 },
    colors: ["#0071e3","#60a5fa","#fff","#93c5fd","#3b82f6"],
  });
}

/* Push notification helper (browser) */
async function sendPushNotif(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function ProgressRing({ pct, size = 46, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(pct, 100) / 100) * c;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#0071e3" strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset .8s ease" }} />
      <text x={size/2} y={size/2+4} textAnchor="middle"
        fill="#60a5fa" fontSize={9} fontWeight={700}>
        {Math.min(pct, 100)}%
      </text>
    </svg>
  );
}

function Heatmap({ data }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="heatmap">
      {data.map(({ date, amount }) => (
        <div
          key={date}
          className="heatmap-cell"
          title={`${date}: ${amount.toLocaleString()} ETB`}
          style={{ background: `rgba(0,113,227,${0.08 + (amount/max)*0.9})` }}
        />
      ))}
    </div>
  );
}

function SkeletonCards() {
  return (
    <>
      {[1,2,3,4].map((i) => (
        <div key={i} className="stat-card">
          <div className="sk-line" style={{ width: 36, height: 36, borderRadius: 9, marginBottom: 14 }} />
          <div className="sk-line" style={{ width: "68%", height: 26, marginBottom: 8 }} />
          <div className="sk-line" style={{ width: "45%", height: 13 }} />
        </div>
      ))}
    </>
  );
}

function SkeletonRows() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 12, padding: "8px 0" }}>
      {[1,2,3].map((i) => (
        <div key={i} className="sk-line" style={{ height: 56, borderRadius: 12 }} />
      ))}
    </div>
  );
}

/* Pie custom label */
const RAD = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RAD)}
      y={cy + r * Math.sin(-midAngle * RAD)}
      fill="#fff" textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontWeight={700}
    >
      {name}
    </text>
  );
}

const TTP = {
  contentStyle: {
    background: "rgba(10,18,40,.97)",
    border: "1px solid rgba(96,165,250,.2)",
    borderRadius: 10, color: "#e2e8f0", fontSize: 12,
  },
  labelStyle: { color: "#94a3b8" },
};

/* useCountUp */
function useCountUp(target, dur = 1000) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    cancelAnimationFrame(raf.current);
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return val;
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════════*/
export default function Donation() {
  const navigate = useNavigate();

  /* ── auth + user data ── */
  const [user,     setUser]     = useState(null);
  const [userData, setUserData] = useState(null);
  const [authReady,setAuthReady]= useState(false);

  /* ── data ── */
  const [allDonations, setAllDonations] = useState([]); // all from Firestore
  const [goals,        setGoals]        = useState([]);
  const [events,       setEvents]       = useState([]);
  const [notifs,       setNotifs]       = useState([]);

  /* ── pagination ── */
  const [donPage, setDonPage] = useState(1);

  /* ── ui flags ── */
  const [online,         setOnline]        = useState(navigator.onLine);
  const [showBanned,     setShowBanned]    = useState(false);
  const [showGoalModal,  setShowGoalModal] = useState(false);
  const [showEventModal, setShowEventModal]= useState(false);
  const [showCertModal,  setShowCertModal] = useState(false);
  const [showNotif,      setShowNotif]     = useState(false);
  const [showUpgrade,    setShowUpgrade]   = useState(false);
  const [showShare,      setShowShare]     = useState(false);
  const [upgradeReason,  setUpgradeReason] = useState("");
  const [certGoal,       setCertGoal]      = useState(null);
  const [livePopup,      setLivePopup]     = useState(null);

  /* ── chart/filter ── */
  const [timeRange,  setTimeRange]  = useState("7 Days");
  const [chartType,  setChartType]  = useState("Line");
  const [activeCard, setActiveCard] = useState("revenue");
  const [currency,   setCurrency]   = useState("ETB");
  const [searchQ,    setSearchQ]    = useState("");

  /* ── goal form ── */
  const [gName,   setGName]   = useState("");
  const [gTarget, setGTarget] = useState("");
  const [gDate,   setGDate]   = useState("");
  const [gImage,  setGImage]  = useState(null);
  const [gSaving, setGSaving] = useState(false);
  const [gError,  setGError]  = useState("");

  /* ── event form ── */
  const [eName,   setEName]   = useState("");
  const [eStart,  setEStart]  = useState("");
  const [eDur,    setEDur]    = useState("");
  const [eSaving, setESaving] = useState(false);
  const [eError,  setEError]  = useState("");

  /* ── refs ── */
  const certRef    = useRef(null);
  const leaderRef  = useRef(null);
  const notifRef   = useRef(null);
  const prevDonLen = useRef(0);
  const notifiedEvents = useRef(new Set());
  const notifiedGoals  = useRef(new Set());

  const [certId] = useState(
    () => `CHEER-CER-${Math.floor(100 + Math.random() * 900)}`
  );

  /* ── online/offline ── */
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);

  /* ── close notif panel on outside click ── */
  useEffect(() => {
    if (!showNotif) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotif]);

  /* ── auth ── */
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/login"); return; }
      setUser(u);
      /* fetch user doc for plan + banned */
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : {};
        setUserData(data);
        if (data.banned === true) setShowBanned(true);
      } catch (_) { /* no doc → basic */ }
      setAuthReady(true);
      /* request notification permission early */
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    });
  }, []);

  /* ── donations (paymentStatus = completed, all records) ── */
  useEffect(() => {
    if (!authReady || !user) return;
    const q = query(
      collection(db, "donations"),
      where("streamerId", "==", user.uid),
      where("paymentStatus", "==", "completed"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        /* live popup only on real new doc (not initial load) */
        if (prevDonLen.current > 0 && docs.length > prevDonLen.current) {
          const newest = docs[0];
          setLivePopup(newest);
          fireConfetti();
          const msg = `${newest.donorName ?? "Someone"} donated ${fmt(newest.amount ?? 0, currency)}`;
          setNotifs((n) => [
            { id: Date.now(), text: msg, time: new Date().toLocaleTimeString() },
            ...n.slice(0, 19),
          ]);
          setTimeout(() => setLivePopup(null), 7000);
        }
        prevDonLen.current = docs.length;
        setAllDonations(docs);
      },
      () => {}
    );
    return unsub;
  }, [authReady, user]);

  /* ── goals ── */
  useEffect(() => {
    if (!authReady || !user) return;
    const q = query(
      collection(db, "goals"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q, { includeMetadataChanges: false },
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setGoals(docs);
      },
      () => {}
    );
    return unsub;
  }, [authReady, user]);

  /* ── events ── */
  useEffect(() => {
    if (!authReady || !user) return;
    const q = query(
      collection(db, "events"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q, { includeMetadataChanges: false },
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(docs);
      },
      () => {}
    );
    return unsub;
  }, [authReady, user]);

  /* ── push notifications for events (start/end) ── */
  useEffect(() => {
    if (!events.length) return;
    const interval = setInterval(() => {
      const now = Date.now();
      events.forEach((ev) => {
        const start = new Date(ev.startTime).getTime();
        const end   = start + (ev.duration ?? 0) * 60000;
        const startKey = `${ev.id}-start`;
        const endKey   = `${ev.id}-end`;
        if (Math.abs(now - start) < 31000 && !notifiedEvents.current.has(startKey)) {
          notifiedEvents.current.add(startKey);
          sendPushNotif("Event Started!", `"${ev.name}" is now live.`);
          setNotifs((n) => [{
            id: Date.now(), time: new Date().toLocaleTimeString(),
            text: `Event "${ev.name}" has started!`,
          }, ...n.slice(0, 19)]);
        }
        if (Math.abs(now - end) < 31000 && !notifiedEvents.current.has(endKey)) {
          notifiedEvents.current.add(endKey);
          sendPushNotif("Event Ended", `"${ev.name}" has ended.`);
          setNotifs((n) => [{
            id: Date.now(), time: new Date().toLocaleTimeString(),
            text: `Event "${ev.name}" has ended.`,
          }, ...n.slice(0, 19)]);
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [events]);

  /* ── push notifications for goals achieved ── */
  useEffect(() => {
    goals.forEach((goal) => {
      if (notifiedGoals.current.has(goal.id)) return;
      const raised = goalRaised(goal);
      if (raised >= goal.target) {
        notifiedGoals.current.add(goal.id);
        sendPushNotif("Goal Achieved!", `You reached your goal "${goal.name}"! 🎉`);
        setNotifs((n) => [{
          id: Date.now(), time: new Date().toLocaleTimeString(),
          text: `Goal "${goal.name}" achieved!`,
        }, ...n.slice(0, 19)]);
      }
    });
  }, [goals, allDonations]);

  /* ── derived analytics ── */
  const plan         = useMemo(() => getPlan(userData), [userData]);
  const totalRevenue = useMemo(() => allDonations.reduce((s, d) => s + (d.amount ?? 0), 0), [allDonations]);
  const totalDonors  = useMemo(() => new Set(allDonations.map((d) => d.donorName ?? d.email ?? d.id)).size, [allDonations]);
  const avgDonation  = useMemo(() => allDonations.length ? Math.round(totalRevenue / allDonations.length) : 0, [totalRevenue, allDonations]);
  const predicted30  = useMemo(() => {
    const last = allDonations.filter((d) => Date.now() - toDate(d.createdAt) < 30 * 864e5);
    return Math.round((last.reduce((s, d) => s + (d.amount ?? 0), 0) / 30) * 30 * 1.1);
  }, [allDonations]);

  const hotTime = useMemo(() => {
    const h = {};
    allDonations.forEach((d) => {
      const hr = toDate(d.createdAt).getHours();
      h[hr] = (h[hr] ?? 0) + 1;
    });
    const peak = Object.entries(h).sort((a, b) => b[1] - a[1])[0];
    if (!peak) return "N/A";
    const n = parseInt(peak[0]);
    return `${n === 0 ? 12 : n > 12 ? n - 12 : n}:00 ${n < 12 ? "AM" : "PM"}`;
  }, [allDonations]);

  const activityLevel = useMemo(() => {
    const cnt = allDonations.filter((d) => Date.now() - toDate(d.createdAt) < 864e5).length;
    if (cnt > 20) return "Very High";
    if (cnt > 10) return "High";
    if (cnt > 3)  return "Medium";
    return "Low";
  }, [allDonations]);

  const heatmapData = useMemo(() => buildHeatmap(allDonations), [allDonations]);

  const leaderboard = useMemo(() => {
    const som = new Date(); som.setDate(1); som.setHours(0, 0, 0, 0);
    const map = {};
    allDonations
      .filter((d) => toDate(d.createdAt) >= som)
      .forEach((d) => {
        const n = d.donorName ?? "Anonymous";
        map[n] = (map[n] ?? 0) + (d.amount ?? 0);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [allDonations]);

  /* ── chart data ── */
  const chartData = useMemo(() => {
    const ms  = msForRange(timeRange);
    const map = {};
    allDonations
      .filter((d) => Date.now() - toDate(d.createdAt) < ms)
      .forEach((d) => {
        const k = dateKey(d.createdAt, timeRange);
        map[k]  = (map[k] ?? 0) + (activeCard === "donors" ? 1 : (d.amount ?? 0));
      });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  }, [allDonations, timeRange, activeCard]);

  /* ── pagination ── */
  const filteredDonations = useMemo(
    () =>
      allDonations.filter(
        (d) =>
          (d.donorName ?? "").toLowerCase().includes(searchQ.toLowerCase()) ||
          (d.message ?? "").toLowerCase().includes(searchQ.toLowerCase())
      ),
    [allDonations, searchQ]
  );
  const totalPages     = Math.max(1, Math.ceil(filteredDonations.length / PAGE_SIZE));
  const pagedDonations = useMemo(
    () => filteredDonations.slice((donPage - 1) * PAGE_SIZE, donPage * PAGE_SIZE),
    [filteredDonations, donPage]
  );

  /* ── goal helpers ── */
  function goalRaised(goal) {
    const created = toDate(goal.createdAt);
    return allDonations
      .filter((d) => toDate(d.createdAt) >= created)
      .reduce((s, d) => s + (d.amount ?? 0), 0);
  }

  const activeGoals = useMemo(
    () =>
      goals.filter((g) => {
        const pct = (goalRaised(g) / g.target) * 100;
        const exp = new Date(g.endDate) < new Date() && pct < 100;
        return !exp && pct < 100;
      }),
    [goals, allDonations]
  );

  /* ── count-up ── */
  const cRev  = useCountUp(totalRevenue);
  const cDon  = useCountUp(totalDonors);
  const cAvg  = useCountUp(avgDonation);
  const cPred = useCountUp(predicted30);

  /* ── actions ── */
  const createGoal = async () => {
    setGError("");
    if (!gName.trim() || !gTarget || !gDate) {
      setGError("Please fill in all required fields.");
      return;
    }
    const limit = PLAN_LIMITS[plan].goals;
    if (activeGoals.length >= limit) {
      setUpgradeReason(
        `Your ${plan} plan allows only ${limit} active goal${limit > 1 ? "s" : ""}. Delete or complete a goal first, or upgrade.`
      );
      setShowGoalModal(false);
      setShowUpgrade(true);
      return;
    }
    setGSaving(true);
    try {
      await addDoc(collection(db, "goals"), {
        ownerId:   user.uid,
        name:      gName.trim(),
        target:    parseFloat(gTarget),
        endDate:   gDate,
        image:     gImage ?? null,
        createdAt: serverTimestamp(),
      });
      setShowGoalModal(false);
      setGName(""); setGTarget(""); setGDate(""); setGImage(null);
    } catch (err) {
      setGError("Failed to save goal. Check your connection.");
      console.error("createGoal error:", err);
    } finally {
      setGSaving(false);
    }
  };

  const createEvent = async () => {
    setEError("");
    if (!eName.trim() || !eStart || !eDur) {
      setEError("Please fill in all required fields.");
      return;
    }
    const limit = PLAN_LIMITS[plan].events;
    if (events.length >= limit) {
      setUpgradeReason(
        `Your ${plan} plan allows only ${limit} event${limit > 1 ? "s" : ""}. Delete an event or upgrade.`
      );
      setShowEventModal(false);
      setShowUpgrade(true);
      return;
    }
    setESaving(true);
    try {
      await addDoc(collection(db, "events"), {
        ownerId:   user.uid,
        name:      eName.trim(),
        startTime: eStart,
        duration:  parseInt(eDur, 10),
        createdAt: serverTimestamp(),
      });
      setShowEventModal(false);
      setEName(""); setEStart(""); setEDur("");
    } catch (err) {
      setEError("Failed to save event. Check your connection.");
      console.error("createEvent error:", err);
    } finally {
      setESaving(false);
    }
  };

  const openCert = async (goal) => {
    setCertGoal(goal);
    setShowCertModal(true);
    const raised = goalRaised(goal);
    const days   = Math.max(
      1,
      Math.ceil((Date.now() - toDate(goal.createdAt)) / 864e5)
    );
    try {
      await addDoc(collection(db, "certificates"), {
        ownerId:       user.uid,
        email:         user.email,
        username:      user.displayName ?? user.email,
        certId,
        amount:        raised,
        goalName:      goal.name,
        daysTook:      days,
        completedDate: new Date().toISOString(),
        createdAt:     serverTimestamp(),
      });
    } catch (_) {}
  };

  const downloadCertPDF = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, {
      scale: 2, useCORS: true, backgroundColor: "#060e1e",
    });
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2],
    });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`${certId}.pdf`);
  };

  const downloadSummaryPDF = async () => {
    const el = document.getElementById("dash-main");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 1.2, backgroundColor: "#0f172a" });
    const pdf = new jsPDF({ unit: "px", format: [canvas.width / 1.2, canvas.height / 1.2] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 1.2, canvas.height / 1.2);
    pdf.save("dashboard-summary.pdf");
  };

  const downloadLeaderImg = async () => {
    if (!leaderRef.current) return;
    const canvas = await html2canvas(leaderRef.current, { scale: 2, backgroundColor: "#060e1e" });
    const a = document.createElement("a");
    a.href = canvas.toDataURL(); a.download = "top-donors.png"; a.click();
  };

  const shareLeaderImg = async () => {
    if (!leaderRef.current) return;
    const canvas = await html2canvas(leaderRef.current, { scale: 2, backgroundColor: "#060e1e" });
    canvas.toBlob(async (blob) => {
      try {
        await navigator.share({
          files: [new File([blob], "top-donors.png", { type: "image/png" })],
          title: "Top Donors — Cheer ET",
        });
      } catch (_) {}
    });
  };

  const handleGImage = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setGImage(ev.target.result);
    r.readAsDataURL(f);
  };

  /* ── chart renderer ── */
  const renderChart = () => {
    if (!chartData.length)
      return (
        <div className="empty-chart">
          <i className="bi bi-bar-chart-line" />
          <span>No data for this period</span>
        </div>
      );

    const grid  = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />;
    const xAxis = <XAxis dataKey="date" tick={{ fill:"#94a3b8", fontSize:11 }} axisLine={false} tickLine={false} />;
    const yAxis = <YAxis tick={{ fill:"#94a3b8", fontSize:11 }} axisLine={false} tickLine={false} />;
    const tip   = <Tooltip {...TTP} />;

    if (chartType === "Line")
      return (
        <AreaChart data={chartData} margin={{ top:10, right:16, bottom:0, left:0 }}>
          <defs>
            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0071e3" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#0071e3" stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}{xAxis}{yAxis}{tip}
          <Area type="monotone" dataKey="amount" stroke="#0071e3" strokeWidth={2.5}
            fill="url(#ag)" dot={false} activeDot={{ r:5, fill:"#60a5fa" }} />
        </AreaChart>
      );

    if (chartType === "Bar")
      return (
        <BarChart data={chartData} margin={{ top:10, right:16, bottom:0, left:0 }}>
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#0071e3" />
            </linearGradient>
          </defs>
          {grid}{xAxis}{yAxis}{tip}
          <Bar dataKey="amount" fill="url(#bg)" radius={[6,6,0,0]} />
        </BarChart>
      );

    if (chartType === "Pie") {
      const pd = chartData.slice(-8);
      return (
        <PieChart>
          {tip}
          <Legend iconType="circle" wrapperStyle={{ color:"#94a3b8", fontSize:11, paddingTop:8 }} />
          <Pie data={pd} dataKey="amount" nameKey="date"
            cx="50%" cy="48%" outerRadius="68%" innerRadius="32%"
            paddingAngle={3} stroke="none"
            labelLine={false} label={<PieLabel />}>
            {pd.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      );
    }

    if (chartType === "Radar") {
      const rd = chartData.slice(-7);
      return (
        <RadarChart data={rd} cx="50%" cy="50%" outerRadius="62%">
          <PolarGrid stroke="rgba(255,255,255,0.07)" />
          <PolarAngleAxis dataKey="date" tick={{ fill:"#94a3b8", fontSize:10 }} />
          {tip}
          <Radar dataKey="amount" stroke="#60a5fa" fill="#0071e3" fillOpacity={0.28}
            dot={{ fill:"#60a5fa", r:3 }} activeDot={{ r:5 }} />
        </RadarChart>
      );
    }
    return null;
  };

  /* ── cert values ── */
  const certRaised = certGoal ? goalRaised(certGoal) : 0;
  const certDays   = certGoal
    ? Math.max(1, Math.ceil((Date.now() - toDate(certGoal.createdAt)) / 864e5))
    : 0;

  /* ── stat card definitions ── */
  const STAT_CARDS = [
    {
      key: "revenue", label: "Total Revenue", icon: "bi-currency-exchange",
      display: currency === "USD" ? `$${(totalRevenue/ETB_RATE).toFixed(2)}` : `${cRev.toLocaleString()} ETB`,
    },
    { key: "donors", label: "Total Donors", icon: "bi-people-fill", display: cDon },
    {
      key: "average", label: "Avg Donation", icon: "bi-graph-up-arrow",
      display: currency === "USD" ? `$${(avgDonation/ETB_RATE).toFixed(2)}` : `${cAvg.toLocaleString()} ETB`,
    },
    {
      key: "predicted", label: "Predicted (30d)", icon: "bi-stars",
      display: currency === "USD" ? `$${(predicted30/ETB_RATE).toFixed(2)}` : `${cPred.toLocaleString()} ETB`,
    },
  ];

  const METRICS = [
    { key:"revenue",   label:"Total Revenue", val: fmt(totalRevenue, currency), icon:"bi-currency-exchange", click:true },
    { key:"donors",    label:"Total Donors",  val: totalDonors,                 icon:"bi-people-fill",       click:true },
    { key:"average",   label:"Avg Donation",  val: fmt(avgDonation, currency),  icon:"bi-graph-up-arrow",    click:true },
    { key:"predicted", label:"Predicted",     val: fmt(predicted30, currency),  icon:"bi-magic",             click:true },
    { key:"hottime",   label:"Hot Time",      val: hotTime,                     icon:"bi-clock-history",     click:false },
    { key:"activity",  label:"Activity",      val: activityLevel,               icon:"bi-lightning-charge",  click:false },
  ];

  /* ══════════════════════════════════════════════════════════════════
     LOADING — full-screen skeleton until auth is ready
  ══════════════════════════════════════════════════════════════════ */
  if (!authReady) {
    return (
      <div className="full-loader">
        <div className="fl-logo">CHEER ET</div>
        <div className="fl-bar"><div className="fl-fill" /></div>
        <div className="fl-msg">Loading your dashboard...</div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className="dash-root">

      {/* ── Offline bar ── */}
      {!online && (
        <div className="offline-bar">
          <i className="bi bi-wifi-off" /> Internet connection lost — Reconnecting...
        </div>
      )}

      {/* ══ BANNED MODAL ══ */}
      {showBanned && (
        <div className="modal-overlay">
          <div className="modal-box banned-box">
            <div className="banned-icon-wrap">
              <i className="bi bi-shield-x" />
            </div>
            <h2 className="banned-title">Account Banned</h2>
            <p className="banned-detail">
              Your account has been suspended due to a violation of Cheer ET's community
              guidelines. You may submit an appeal and our moderation team will review your
              case within 3–5 business days.
            </p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => navigate("/appeal")}>
                <i className="bi bi-send-fill" /> Submit Appeal
              </button>
              <button className="btn-ghost" onClick={() => setShowBanned(false)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ UPGRADE MODAL ══ */}
      {showUpgrade && (
        <div className="modal-overlay" onClick={() => setShowUpgrade(false)}>
          <div className="modal-box upgrade-box" onClick={(e) => e.stopPropagation()}>
            <div className="upgrade-icon-wrap"><i className="bi bi-rocket-takeoff-fill" /></div>
            <h2>Upgrade Your Plan</h2>
            <p className="upgrade-reason">{upgradeReason}</p>
            <div className="upgrade-plans">
              <div className="upgrade-plan">
                <div className="uplan-name">Premium</div>
                <ul className="uplan-list">
                  <li><i className="bi bi-check2-circle" /> 3 active goals</li>
                  <li><i className="bi bi-check2-circle" /> 2 simultaneous events</li>
                  <li><i className="bi bi-check2-circle" /> Priority support</li>
                </ul>
              </div>
              <div className="upgrade-plan upgrade-plan--plus">
                <div className="uplan-badge">Best Value</div>
                <div className="uplan-name">Plus</div>
                <ul className="uplan-list">
                  <li><i className="bi bi-check2-circle" /> 3 active goals</li>
                  <li><i className="bi bi-check2-circle" /> 3 simultaneous events</li>
                  <li><i className="bi bi-check2-circle" /> All features unlocked</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => navigate("/upgrade")}>
                <i className="bi bi-arrow-up-circle-fill" /> Upgrade Now
              </button>
              <button className="btn-ghost" onClick={() => setShowUpgrade(false)}>Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Live popup ── */}
      {livePopup && (
        <div className="live-popup">
          <div className="live-dot" />
          <div className="live-content">
            <strong>{livePopup.donorName ?? "Anonymous"}</strong> just donated{" "}
            <span className="live-amount">{fmt(livePopup.amount ?? 0, currency)}</span>
            {livePopup.message && <div className="live-msg">"{livePopup.message}"</div>}
          </div>
          <button className="live-close" onClick={() => setLivePopup(null)}>
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {/* ── Notification panel (outside-click closes) ── */}
      {showNotif && (
        <div className="notif-panel" ref={notifRef}>
          <div className="notif-head">
            <span>Notifications</span>
            <button className="btn-ghost-xs" onClick={() => setNotifs([])}>Clear all</button>
          </div>
          {notifs.length === 0 ? (
            <div className="notif-empty">
              <i className="bi bi-bell-slash" /> All caught up
            </div>
          ) : (
            notifs.map((n) => (
              <div key={n.id} className="notif-item">
                <i className="bi bi-lightning-charge-fill notif-icon" />
                <div>
                  <div className="notif-text">{n.text}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══ ACTION CARD (replaces navbar / top bar) ══ */}
      <div className="action-card">
        <div className="action-card-brand">
          <span className="ac-logo">CHEER ET</span>
          <span className={`ac-plan ac-plan--${plan}`}>{plan}</span>
        </div>
        <div className="action-card-btns">
          <button className="ac-btn ac-btn--primary" onClick={() => setShowGoalModal(true)}>
            <i className="bi bi-bullseye" /><span>Goal</span>
          </button>
          <button className="ac-btn ac-btn--secondary" onClick={() => setShowEventModal(true)}>
            <i className="bi bi-camera-video-fill" /><span>Event</span>
          </button>
          <button className="ac-btn" onClick={() => navigate("/livesub")}>
            <i className="bi bi-broadcast" /><span>Live Sub</span>
          </button>
          <button className="ac-btn" onClick={() => exportCSV(allDonations, currency)}>
            <i className="bi bi-file-earmark-spreadsheet-fill" /><span>CSV</span>
          </button>
          <button className="ac-btn" onClick={downloadSummaryPDF}>
            <i className="bi bi-file-earmark-pdf-fill" /><span>PDF</span>
          </button>
          <button
            className={`ac-btn${notifs.length > 0 ? " ac-btn--notif" : ""}`}
            onClick={() => setShowNotif((p) => !p)}
          >
            <i className="bi bi-bell-fill" />
            {notifs.length > 0 && <span className="ac-notif-dot">{Math.min(notifs.length, 99)}</span>}
            <span>Alerts</span>
          </button>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <main className="dash-main" id="dash-main">

        {/* ─ Currency toggle ─ */}
        <div className="top-row">
          <div className="currency-toggle">
            <button className={`cur-btn${currency === "ETB" ? " active" : ""}`} onClick={() => setCurrency("ETB")}>ETB</button>
            <button className={`cur-btn${currency === "USD" ? " active" : ""}`} onClick={() => setCurrency("USD")}>USD</button>
          </div>
          <span className="rate-note">1 USD = {ETB_RATE} ETB</span>
        </div>

        {/* ─ Stat cards ─ */}
        <section className="stat-cards">
          {!authReady ? (
            <SkeletonCards />
          ) : (
            STAT_CARDS.map((c) => (
              <div
                key={c.key}
                className={`stat-card${activeCard === c.key ? " stat-card--active" : ""}`}
                onClick={() => setActiveCard(c.key)}
              >
                <div className="stat-top">
                  <div className="stat-icon-wrap"><i className={`bi ${c.icon}`} /></div>
                  {activeCard === c.key && <div className="stat-active-dot" />}
                </div>
                <div className="stat-val">{c.display}</div>
                <div className="stat-lbl">{c.label}</div>
                {activeCard === c.key && <div className="stat-bar" />}
              </div>
            ))
          )}
        </section>

        {/* ─ Chart section ─ */}
        <section className="chart-section">
          <div className="chart-controls">
            <div className="control-group">
              <span className="ctrl-lbl">Period</span>
              <div className="pill-row">
                {["24 Hours","7 Days","30 Days","Month","Year"].map((r) => (
                  <button key={r}
                    className={`pill${timeRange === r ? " pill--active" : ""}`}
                    onClick={() => setTimeRange(r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="control-group">
              <span className="ctrl-lbl">Chart Type</span>
              <div className="pill-row">
                {["Line","Bar","Pie","Radar"].map((t) => (
                  <button key={t}
                    className={`pill${chartType === t ? " pill--active" : ""}`}
                    onClick={() => setChartType(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!authReady ? (
            <div className="sk-line" style={{ height: 260, borderRadius: 14 }} />
          ) : (
            <div className="chart-canvas">
              <ResponsiveContainer width="100%" height={260}>
                {renderChart()}
              </ResponsiveContainer>
            </div>
          )}

          {/* Metric strip */}
          <div className="metric-strip">
            {METRICS.map((m) => (
              <div
                key={m.key}
                className={`metric-chip${activeCard === m.key && m.click ? " metric-chip--active" : ""}`}
                onClick={() => m.click && setActiveCard(m.key)}
                style={{ cursor: m.click ? "pointer" : "default" }}
              >
                <i className={`bi ${m.icon} mc-icon`} />
                <div className="mc-val">{m.val}</div>
                <div className="mc-lbl">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="heatmap-row">
            <span className="hm-label">Last 14 Days</span>
            <Heatmap data={heatmapData} />
          </div>
        </section>

        {/* ─ Goals + Events ─ */}
        <div className="two-col">

          {/* Goals */}
          <section className="panel">
            <div className="panel-hd">
              <span className="panel-title"><i className="bi bi-bullseye" /> Goals</span>
              <div className="panel-hd-r">
                <button className="btn-primary-sm" onClick={() => setShowGoalModal(true)}>
                  <i className="bi bi-plus-lg" /> New
                </button>
              </div>
            </div>
            <div className="plan-cap-note">
              <i className="bi bi-info-circle" /> {activeGoals.length} / {PLAN_LIMITS[plan].goals} active goals
            </div>

            {!authReady ? <SkeletonRows /> : goals.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-bullseye empty-ico" />
                <p>No goals yet. Create one to start tracking your fundraising progress.</p>
              </div>
            ) : (
              goals.map((goal) => {
                const raised  = goalRaised(goal);
                const pct     = Math.min(Math.round((raised / goal.target) * 100), 100);
                const expired = new Date(goal.endDate) < new Date() && pct < 100;
                const done    = pct >= 100;
                return (
                  <div key={goal.id} className={`goal-card${done ? " goal-card--done" : ""}`}>
                    <div className="goal-row">
                      {goal.image && <img src={goal.image} alt="" className="goal-img" />}
                      <div className="goal-info">
                        <div className="goal-name">{goal.name}</div>
                        <div className="goal-meta">
                          Target: {fmt(goal.target, currency)} &bull; Ends {new Date(goal.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="goal-right">
                        <ProgressRing pct={pct} />
                        <button
                          className="icon-btn"
                          onClick={() => deleteDoc(doc(db, "goals", goal.id))}
                          title="Delete goal"
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </div>
                    </div>
                    {done ? (
                      <div className="goal-done-msg">
                        <i className="bi bi-trophy-fill" /> Goal achieved! Congratulations!
                        <button className="btn-cert" onClick={() => openCert(goal)}>
                          <i className="bi bi-award-fill" /> Generate Certificate
                        </button>
                      </div>
                    ) : expired ? (
                      <div className="goal-expired">
                        <i className="bi bi-clock" /> Expired — Try Again
                      </div>
                    ) : (
                      <>
                        <div className="goal-bar-wrap">
                          <div className="goal-bar">
                            <div className="goal-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="goal-raised-note">
                          {fmt(raised, currency)} raised of {fmt(goal.target, currency)}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* Right col */}
          <div className="right-col">

            {/* Events */}
            <section className="panel">
              <div className="panel-hd">
                <span className="panel-title"><i className="bi bi-camera-video-fill" /> Events</span>
                <button className="btn-primary-sm" onClick={() => setShowEventModal(true)}>
                  <i className="bi bi-plus-lg" /> New
                </button>
              </div>
              <div className="plan-cap-note">
                <i className="bi bi-info-circle" /> {events.length} / {PLAN_LIMITS[plan].events} events
              </div>

              {!authReady ? <SkeletonRows /> : events.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-camera-video empty-ico" />
                  <p>No events scheduled. Create your first stream!</p>
                </div>
              ) : (
                events.map((ev) => {
                  const start = new Date(ev.startTime);
                  const end   = new Date(start.getTime() + (ev.duration ?? 0) * 60000);
                  const live  = new Date() >= start && new Date() <= end;
                  return (
                    <div key={ev.id} className={`event-card${live ? " event-card--live" : ""}`}>
                      <div className="event-info">
                        {live && <span className="live-badge"><i className="bi bi-broadcast" /> LIVE</span>}
                        <div className="event-name">{ev.name}</div>
                        <div className="event-meta">
                          {start.toLocaleString()} &bull; {ev.duration} min
                        </div>
                      </div>
                      <button className="icon-btn" onClick={() => deleteDoc(doc(db, "events", ev.id))}>
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  );
                })
              )}
            </section>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <section className="panel">
                <div className="panel-hd">
                  <span className="panel-title"><i className="bi bi-trophy-fill" /> Top Donors</span>
                  <button className="btn-outline-sm" onClick={() => setShowShare(true)}>
                    <i className="bi bi-share-fill" /> Share
                  </button>
                </div>
                {leaderboard.map(([name, amt], i) => (
                  <div key={name} className="lb-row">
                    <span className={`lb-rank lb-rank--${i + 1}`}>#{i + 1}</span>
                    <span className="lb-name">{name}</span>
                    <span className="lb-amt">{fmt(amt, currency)}</span>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>

        {/* ─ Donations timeline ─ */}
        <section className="panel">
          <div className="panel-hd">
            <span className="panel-title"><i className="bi bi-activity" /> Donations</span>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span className="donations-count">{filteredDonations.length} total</span>
              <input
                className="search-input"
                placeholder="Search donors..."
                value={searchQ}
                onChange={(e) => { setSearchQ(e.target.value); setDonPage(1); }}
              />
            </div>
          </div>

          {!authReady ? <SkeletonRows /> : pagedDonations.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-cash-coin empty-ico" />
              <p>No donations yet. Share your link to start receiving donations!</p>
            </div>
          ) : (
            <>
              <div className="timeline">
                {pagedDonations.map((d, i) => (
                  <div
                    key={d.id}
                    className={`tl-item${i === 0 && donPage === 1 ? " tl-item--new" : ""}`}
                  >
                    <div className="tl-dot" />
                    <div className="tl-card">
                      <div className="tl-top">
                        <span className="tl-name">{d.donorName ?? "Anonymous"}</span>
                        <span className="tl-amt">{fmt(d.amount ?? 0, currency)}</span>
                      </div>
                      {d.message && <div className="tl-msg">"{d.message}"</div>}
                      <div className="tl-time">{toDate(d.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pg-btn"
                    disabled={donPage === 1}
                    onClick={() => setDonPage((p) => p - 1)}
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - donPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="pg-dots">...</span>
                      ) : (
                        <button
                          key={p}
                          className={`pg-btn${donPage === p ? " pg-btn--active" : ""}`}
                          onClick={() => setDonPage(p)}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    className="pg-btn"
                    disabled={donPage === totalPages}
                    onClick={() => setDonPage((p) => p + 1)}
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ─ Footer ─ */}
        <div className="dash-footer">Powered by <strong>Ander Kayon Tech</strong></div>
      </main>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}

      {/* Create Goal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <i className="bi bi-bullseye modal-ico" />
              <h2>Create Goal</h2>
            </div>
            {gError && <div className="form-error"><i className="bi bi-exclamation-triangle" /> {gError}</div>}
            <div className="form-field">
              <label>Goal Name <span className="req">*</span></label>
              <input className="form-input" placeholder="e.g. New Microphone"
                value={gName} onChange={(e) => setGName(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Target Amount (ETB) <span className="req">*</span></label>
              <input className="form-input" type="number" placeholder="10000"
                value={gTarget} onChange={(e) => setGTarget(e.target.value)} />
            </div>
            <div className="form-field">
              <label>End Date <span className="req">*</span></label>
              <input className="form-input" type="date"
                value={gDate} onChange={(e) => setGDate(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Goal Image <span className="form-opt">(optional)</span></label>
              <input type="file" accept="image/*" onChange={handleGImage} className="form-file" />
              {gImage && <img src={gImage} alt="preview" className="img-preview" />}
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={createGoal} disabled={gSaving}>
                {gSaving ? <><i className="bi bi-hourglass-split" /> Saving...</> : <><i className="bi bi-check2-circle" /> Create Goal</>}
              </button>
              <button className="btn-ghost" onClick={() => setShowGoalModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <i className="bi bi-camera-video-fill modal-ico" />
              <h2>Create Event</h2>
            </div>
            {eError && <div className="form-error"><i className="bi bi-exclamation-triangle" /> {eError}</div>}
            <div className="form-field">
              <label>Event Name <span className="req">*</span></label>
              <input className="form-input" placeholder="Friday Night Stream"
                value={eName} onChange={(e) => setEName(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Start Time <span className="req">*</span></label>
              <input className="form-input" type="datetime-local"
                value={eStart} onChange={(e) => setEStart(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Duration (minutes) <span className="req">*</span></label>
              <input className="form-input" type="number" placeholder="120"
                value={eDur} onChange={(e) => setEDur(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={createEvent} disabled={eSaving}>
                {eSaving ? <><i className="bi bi-hourglass-split" /> Saving...</> : <><i className="bi bi-check2-circle" /> Create Event</>}
              </button>
              <button className="btn-ghost" onClick={() => setShowEventModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate */}
      {showCertModal && certGoal && (
        <div className="modal-overlay cert-overlay" onClick={() => setShowCertModal(false)}>
          <div className="cert-modal-wrap" onClick={(e) => e.stopPropagation()}>
            <div className="certificate" ref={certRef}>
              <div className="cert-border-frame" />
              <svg className="cert-doodle" viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0071e3" stopOpacity=".12" />
                    <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="700" height="420" fill="url(#rg)" />
                <circle cx="80"  cy="80"  r="55" fill="none" stroke="#60a5fa" strokeOpacity=".1"  strokeWidth="1.5" />
                <circle cx="620" cy="340" r="70" fill="none" stroke="#3b82f6" strokeOpacity=".08" strokeWidth="1.5" />
                <circle cx="350" cy="210" r="140" fill="none" stroke="#0071e3" strokeOpacity=".05" strokeWidth="1" />
                <path d="M0,280 Q175,160 350,280 T700,280" fill="none" stroke="#60a5fa" strokeOpacity=".08" strokeWidth="1.5" />
                <path d="M0,120 Q175,40 350,120 T700,120"  fill="none" stroke="#3b82f6" strokeOpacity=".06" strokeWidth="1" />
                <line x1="0" y1="0" x2="700" y2="420" stroke="#60a5fa" strokeOpacity=".04" strokeWidth="1" />
                <line x1="700" y1="0" x2="0" y2="420" stroke="#60a5fa" strokeOpacity=".04" strokeWidth="1" />
              </svg>
              <div className="cert-inner">
                <div className="cert-brand">CHEER ET</div>
                <div className="cert-title">Achievement of Influence</div>
                <div className="cert-line" />
                <div className="cert-body">
                  This certificate is proudly presented for completing the challenge to raise{" "}
                  <span className="cert-hl">{certRaised.toLocaleString()} ETB</span>{" "}
                  in <span className="cert-hl">{certDays} days</span>
                  {certDays < 14 && <span className="cert-hl-green"> — achieved in under 14 days!</span>}
                </div>
                <div className="cert-username">{user?.displayName ?? "Valued Streamer"}</div>
                <div className="cert-stats-row">
                  <div className="cert-stat-card">
                    <div className="csc-lbl">Amount Raised</div>
                    <div className="csc-val">{certRaised.toLocaleString()} ETB</div>
                  </div>
                  <div className="cert-stat-card">
                    <div className="csc-lbl">Completed Date</div>
                    <div className="csc-val">{new Date().toLocaleDateString()}</div>
                  </div>
                  <div className="cert-sig-col">
                    <img src="/signature.png" alt="Signature" className="cert-sig-img"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                </div>
                <div className="cert-id">{certId}</div>
              </div>
            </div>
            <div className="cert-actions">
              <button className="btn-primary cert-dl-btn" onClick={downloadCertPDF}>
                <i className="bi bi-download" /> Download PDF Certificate
              </button>
              <button className="btn-ghost" onClick={() => setShowCertModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Share leaderboard */}
      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal-box share-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <i className="bi bi-trophy-fill modal-ico" />
              <h2>Share Top Donors</h2>
            </div>
            <div className="share-card" ref={leaderRef}>
              <div className="share-brand">CHEER ET</div>
              <div className="share-title">Top Donors This Month</div>
              <div className="share-divider" />
              {leaderboard.map(([name, amt], i) => (
                <div key={name} className="slb-row">
                  <span className={`slb-rank slb-rank--${i + 1}`}>#{i + 1}</span>
                  <span className="slb-name">{name}</span>
                  <span className="slb-amt">{fmt(amt, currency)}</span>
                </div>
              ))}
              <div className="share-footer">cheer-et.com</div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={downloadLeaderImg}>
                <i className="bi bi-download" /> Download
              </button>
              <button className="btn-secondary" onClick={shareLeaderImg}>
                <i className="bi bi-send-fill" /> Share
              </button>
              <button className="btn-ghost" onClick={() => setShowShare(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}