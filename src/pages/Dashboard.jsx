import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

/* ─── Commission rate ──────────────────────────────────────────
   Display-only constant used to render the breakdown card below.
   IMPORTANT: this constant must be kept in sync with (or ideally
   read from) the same rate your Cloud Functions use server-side.
   The dashboard NEVER mutates balances directly — see the note
   above `availableBalance` further down for the full explanation. */
const COMMISSION_RATE = 0.10;

/* ─── Avatar accent palette (matches design system) ─────────── */
const AVATAR_COLORS = [
  "linear-gradient(135deg,#0a84ff,#2563eb)",   // blue
  "linear-gradient(135deg,#5856d6,#8b7bf0)",   // purple
  "linear-gradient(135deg,#34c759,#1fa851)",   // green
  "linear-gradient(135deg,#ff9f0a,#ffb340)",   // orange
  "linear-gradient(135deg,#ff453a,#ff6961)",   // red
  "linear-gradient(135deg,#ffd60a,#ffb340)",   // yellow
];

/** Deterministic accent color for a given name, so the same donor
 *  always gets the same fallback avatar color. */
function colorForName(name) {
  const str = String(name || "?");
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ─── Confetti ─────────────────────────────────────────────── */
function spawnConfetti() {
  const colors = ["#0a84ff","#34c759","#ffd60a","#5856d6","#ff9f0a","#ff453a"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.className = "confettiPiece";
    el.style.cssText = `
      left:${Math.random()*100}vw;top:-12px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${1.2+Math.random()*1.8}s;
      animation-delay:${Math.random()*0.6}s;
      transform:rotate(${Math.random()*360}deg);
    `;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

/* ─── Chart tooltip ────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"rgba(2,11,26,0.92)",
      backdropFilter:"blur(12px) saturate(140%)",
      WebkitBackdropFilter:"blur(12px) saturate(140%)",
      border:"1px solid rgba(255,255,255,0.14)",
      borderRadius:10,padding:"8px 12px",fontSize:13,color:"#fff",
      boxShadow:"0 12px 32px rgba(0,0,0,0.45)",
    }}>
      <div style={{opacity:0.6,marginBottom:4}}>{label}</div>
      <div style={{fontWeight:800}}>{Number(payload[0].value).toFixed(2)} ETB</div>
    </div>
  );
}

/* ─── Avatar (real photo → colorful initials fallback) ───────
   FIX: uses local error state instead of directly mutating the
   DOM node's style, so React re-renders the fallback correctly
   (the old `e.target.style.display="none"` approach left a blank
   gap with no fallback initials rendered at all). */
function Avatar({ name, photo, size = 34, fontSize = 11 }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Reset error state if the photo prop itself changes (e.g. donor's
  // photo becomes available later after being merged from another doc).
  useEffect(() => { setImgFailed(false); }, [photo]);

  if (photo && !imgFailed) {
    return (
      <img
        src={photo}
        alt={name || "Donor"}
        className="listAvatarImg"
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className="listAvatarPlaceholder"
      style={{ width: size, height: size, fontSize, background: colorForName(name) }}
    >
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

/* ─── date helpers (FIX #4: use full YYYY-MM-DD keys, not
   date.getDate(), so donations from different months never
   collide on the same "day number" bucket) ─────────────────── */
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function shortLabel(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
/** Builds an ordered array of the last `days` date keys ending today,
 *  each pre-seeded to 0, so the chart never has gaps and never merges
 *  across month boundaries. */
function buildEmptyDailyBuckets(days = 30) {
  const buckets = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({ key: dateKey(d), day: shortLabel(d), amount: 0 });
  }
  return buckets;
}

/* ─── Main Dashboard ───────────────────────────────────────── */
export default function Dashboard() {
  const [authUser,       setAuthUser]       = useState(null);
  const [authResolved,   setAuthResolved]   = useState(false);
  const [user,           setUser]           = useState({});
  const [loading,        setLoading]        = useState(true);

  /* granular load flags — dashboard only leaves skeleton state
     once EVERY data source has reported at least once. This is
     what prevents the "flash of 0 / empty state" bug. */
  const [userLoaded,      setUserLoaded]      = useState(false);
  const [donationsLoaded, setDonationsLoaded] = useState(false);
  const [payoutsLoaded,   setPayoutsLoaded]   = useState(false);
  const [eventsLoaded,    setEventsLoaded]    = useState(false);

  /* donations */
  const [totalRaised,    setTotalRaised]    = useState(0);
  const [donators,       setDonators]       = useState(0);
  const [topDonators,    setTopDonators]    = useState([]);
  const [chartData,      setChartData]      = useState(() => buildEmptyDailyBuckets(30));
  const [recent,         setRecent]         = useState([]);
  const [todayAmt,       setTodayAmt]       = useState(0);
  const [weekAmt,        setWeekAmt]        = useState(0);
  const [monthAmt,       setMonthAmt]       = useState(0);

  /* payouts */
  const [payouts,        setPayouts]        = useState([]);
  const [pendingPayout,  setPendingPayout]  = useState(null);

  /* events */
  const [activeEvent,    setActiveEvent]    = useState(null);
  const [upcomingEvent,  setUpcomingEvent]  = useState(null);
  const [eventCountdown, setEventCountdown] = useState("");

  /* ui */
  const [showBalance,    setShowBalance]    = useState(true);
  const [toasts,         setToasts]         = useState([]);
  const [navOpen,        setNavOpen]        = useState(false);

  // FIX #3: dedicated "initial load" ref for the donations stream.
  // Only after the FIRST snapshot has been processed do we start
  // treating new documents as genuinely new (sound + toast + notif).
  // This replaces the old prevCount-based heuristic, which could
  // still misfire on the very first paint if arr.length ever passed
  // through the (stale) `donationsLoaded` flag mid-render.
  const isInitialDonationsLoad = useRef(true);
  const prevDonationIds  = useRef(new Set());
  const prevTotal        = useRef(0);
  const isInitialMilestoneCheck = useRef(true);

  const audioRef     = useRef(null);
  const toastId      = useRef(0);

  /* ── audio init ──────────────────────────────────────────── */
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
    const a = new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3");
    a.preload = "auto";
    audioRef.current = a;
  }, []);

  /* ── flip `loading` off only once all 4 sources are in ──────
     Runs whenever any of the 4 flags changes. */
  useEffect(() => {
    if (userLoaded && donationsLoaded && payoutsLoaded && eventsLoaded) {
      setLoading(false);
    }
  }, [userLoaded, donationsLoaded, payoutsLoaded, eventsLoaded]);

  /* ── toast ───────────────────────────────────────────────── */
  const addToast = useCallback(({ title, sub, icon = "bi-gift", color = "green" }) => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, title, sub, icon, color }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const sendNotif = useCallback((msg) => {
    if ("Notification" in window && Notification.permission === "granted")
      new Notification(msg);
  }, []);

  /* ── milestone confetti ──────────────────────────────────── */
  useEffect(() => {
    // FIX: skip the very first time totalRaised is populated from the
    // initial snapshot — otherwise a creator who already has e.g. 5000
    // ETB raised gets a false "milestone reached" confetti blast on
    // every page load.
    if (isInitialMilestoneCheck.current) {
      isInitialMilestoneCheck.current = false;
      prevTotal.current = totalRaised;
      return;
    }
    const milestones = [500,1000,5000,10000,50000];
    if (milestones.includes(Math.floor(totalRaised)) && totalRaised > prevTotal.current) {
      spawnConfetti();
      addToast({ title:"Milestone reached!", sub:`${totalRaised.toFixed(0)} ETB raised`, icon:"bi-trophy", color:"yellow" });
    }
    prevTotal.current = totalRaised;
  }, [totalRaised, addToast]);

  /* ── event countdown ─────────────────────────────────────── */
  useEffect(() => {
    if (!upcomingEvent) return;
    const tick = () => {
      const start = upcomingEvent.startTime?.seconds
        ? new Date(upcomingEvent.startTime.seconds * 1000)
        : new Date(upcomingEvent.startTime);
      const diff = start - Date.now();
      if (diff <= 0) { setEventCountdown("Starting now"); return; }
      const h = Math.floor(diff/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      setEventCountdown(h>0 ? `${h}h ${m}m away` : m>0 ? `${m}m ${s}s away` : `${s}s away`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [upcomingEvent]);

  /* ── auth listener ───────────────────────────────────────── */
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (cu) => {
      setAuthUser(cu || null);
      setAuthResolved(true);
      if (!cu) {
        // Signed out — nothing to load, drop straight out of skeleton state.
        setUserLoaded(true);
        setDonationsLoaded(true);
        setPayoutsLoaded(true);
        setEventsLoaded(true);
      }
    });
    return () => unsubAuth();
  }, []);

  /* ── FIX #2: stabilize Firestore query/ref objects with useMemo.
     Previously these were re-created every time the auth callback
     fired, which — because a *new* Query object is a new reference
     every render — made any effect depending on "the query" resubscribe
     needlessly. Now they only change when the signed-in uid changes. */
  const userDocRef = useMemo(
    () => (authUser ? doc(db, "users", authUser.uid) : null),
    [authUser]
  );

  const donationsQuery = useMemo(
    () => (authUser
      ? query(
          collection(db, "donations"),
          where("streamerId", "==", authUser.uid),
          where("paymentStatus", "==", "completed"),
          orderBy("createdAt", "desc")
        )
      : null),
    [authUser]
  );

  const payoutQuery = useMemo(
    () => (authUser
      ? query(collection(db, "payout"), where("uid", "==", authUser.uid))
      : null),
    [authUser]
  );

  // events collection itself doesn't need a per-user filter server-side
  // (ownership is filtered client-side below), so the ref only needs to
  // be created once. It's still gated behind `authUser` so we don't pay
  // for a subscription while signed out.
  const eventsCollectionRef = useMemo(() => collection(db, "events"), []);

  /* ── reset per-session guards whenever the signed-in user changes ─ */
  useEffect(() => {
    isInitialDonationsLoad.current = true;
    isInitialMilestoneCheck.current = true;
    prevDonationIds.current = new Set();
    prevTotal.current = 0;
  }, [authUser]);

  /* ── subscribe: user doc ─────────────────────────────────────
     Balance read from currentBalance field. This field is the
     single source of truth for what the creator can withdraw;
     the client never computes or writes it. onSnapshot means any
     Cloud Function write to this doc (after a donation or payout)
     reflects in the UI immediately, with no manual refresh. */
  useEffect(() => {
    if (!userDocRef) return;
    const unsub = onSnapshot(
      userDocRef,
      (snap) => {
        setUser(snap.data() || {});
        setUserLoaded(true);
      },
      (err) => {
        console.error("user snapshot error:", err);
        setUserLoaded(true);
      }
    );
    return () => unsub();
  }, [userDocRef]);

  /* ── subscribe: donations ────────────────────────────────────
     ONLY completed donations count toward totals/balance. Filtering
     server-side (not client-side) means we never even download
     pending/failed docs into the revenue calculations. */
  useEffect(() => {
    if (!donationsQuery) return;
    const unsub = onSnapshot(
      donationsQuery,
      (snapshot) => {
        let total = 0;
        const donorsMap = {}; // name -> { amount, photo }
        // FIX #4: bucket by full YYYY-MM-DD key so different months
        // never collide on the same "day of month" number.
        const buckets = buildEmptyDailyBuckets(30);
        const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));
        const arr = [];
        const currentIds = new Set();

        const now   = Date.now();
        const day0  = new Date(); day0.setHours(0,0,0,0);
        const week0 = new Date(now - 7*86400000);
        const mon0  = new Date(now - 30*86400000);
        let todayT=0, weekT=0, monthT=0;

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const amt  = Number(d.amount || 0);
          const date = d.createdAt?.seconds
            ? new Date(d.createdAt.seconds * 1000) : new Date();
          const photo = d.donorPhoto || d.photoURL || null;

          total += amt;
          arr.push({ ...d, _id: docSnap.id, _date: date, _photo: photo });
          currentIds.add(docSnap.id);

          const key = d.name || "Anonymous";
          const existing = donorsMap[key] || { amount: 0, photo: null };
          donorsMap[key] = {
            amount: existing.amount + amt,
            photo: existing.photo || photo, // keep first known photo for this donor
          };

          const k = dateKey(date);
          if (bucketIndex.has(k)) {
            buckets[bucketIndex.get(k)].amount += amt;
          }
          if (date >= day0)  todayT += amt;
          if (date >= week0) weekT  += amt;
          if (date >= mon0)  monthT += amt;
        });

        // FIX #3: only fire sound/toast/notification for donations that
        // are genuinely new since the LAST snapshot, and never on the
        // very first snapshot after mount/sign-in (page load, refresh,
        // tab refocus should all be silent).
        if (!isInitialDonationsLoad.current) {
          const newIds = [...currentIds].filter(id => !prevDonationIds.current.has(id));
          if (newIds.length > 0) {
            const newestDoc = arr.find(d => d._id === newIds[0]) ||
              [...arr].sort((a,b)=>b._date-a._date)[0];
            audioRef.current?.play().catch(() => {});
            addToast({
              title: `${newestDoc?.name || "Someone"} donated`,
              sub:   `${Number(newestDoc?.amount||0).toFixed(2)} ETB`,
              icon:  "bi-heart-fill",
              color: "green",
            });
            sendNotif(`New donation: ${Number(newestDoc?.amount||0).toFixed(2)} ETB from ${newestDoc?.name||"Anonymous"}`);
          }
        } else {
          isInitialDonationsLoad.current = false;
        }
        prevDonationIds.current = currentIds;

        setTotalRaised(total);
        setTodayAmt(todayT);
        setWeekAmt(weekT);
        setMonthAmt(monthT);
        setDonators(Object.keys(donorsMap).length);
        setTopDonators(
          Object.entries(donorsMap)
            .sort((a,b)=>b[1].amount-a[1].amount)
            .slice(0,3)
        );
        setChartData(buckets);
        setRecent([...arr].sort((a,b)=>b._date-a._date).slice(0,5));
        setDonationsLoaded(true);
      },
      (err) => {
        console.error("donations snapshot error:", err);
        setDonationsLoaded(true);
      }
    );
    return () => unsub();
  }, [donationsQuery, addToast, sendNotif]);

  /* ── subscribe: payouts ──────────────────────────────────── */
  useEffect(() => {
    if (!payoutQuery) return;
    const unsub = onSnapshot(
      payoutQuery,
      (snap) => {
        const arr = [];
        snap.forEach(d => arr.push({ id:d.id, ...d.data() }));
        arr.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
        setPayouts(arr.slice(0,5));
        setPendingPayout(arr.find(p=>statusNorm(p.status)==="pending")||null);
        setPayoutsLoaded(true);
      },
      (err) => {
        console.error("payout snapshot error:", err);
        setPayouts([]); setPendingPayout(null);
        setPayoutsLoaded(true);
      }
    );
    return () => unsub();
  }, [payoutQuery]);

  /* ── subscribe: events ───────────────────────────────────── */
  useEffect(() => {
    if (!authUser) return;
    const unsub = onSnapshot(
      eventsCollectionRef,
      (snap) => {
        const now = Date.now();
        let live=null, upcoming=null;
        snap.forEach((docSnap) => {
          const ev = { id:docSnap.id, ...docSnap.data() };
          if (ev.ownerId && ev.ownerId !== authUser.uid) return;
          const start = ev.startTime?.seconds
            ? new Date(ev.startTime.seconds*1000) : new Date(ev.startTime);
          const end = new Date(start.getTime() + (ev.duration||60)*60000);
          if (start <= now && now <= end) {
            live = { ...ev, _start:start, _end:end };
          } else if (start > now) {
            if (!upcoming || start < upcoming._start)
              upcoming = { ...ev, _start:start, _end:end };
          }
        });
        setActiveEvent(live);
        setUpcomingEvent(upcoming);
        setEventsLoaded(true);
      },
      (err) => {
        console.error("events snapshot error:", err);
        setEventsLoaded(true);
      }
    );
    return () => unsub();
  }, [eventsCollectionRef, authUser]);

  /* ── toggle ──────────────────────────────────────────────── */
  const updateToggle = useCallback(async (field, value) => {
    if (!authUser) return;
    try {
      await updateDoc(doc(db,"users",authUser.uid), { [field]:value });
      if (field==="ttsEnabled")      sendNotif(value?"TTS enabled":"TTS disabled");
      if (field==="donationEnabled") sendNotif(value?"Donations open":"Donations paused");
    } catch (err) {
      console.error(`failed to update ${field}:`, err);
      addToast({ title:"Update failed", sub:"Please try again", icon:"bi-exclamation-triangle", color:"yellow" });
    }
  }, [authUser, sendNotif, addToast]);

  /* ─────────────────────────────────────────────────────────────
     BALANCE SOURCE OF TRUTH — READ ONLY ON THE CLIENT
     ─────────────────────────────────────────────────────────────
     `availableBalance` is read straight from `users/{uid}.currentBalance`
     via the live onSnapshot listener above, so any Cloud Function write
     (after a donation completes or a payout is approved) is reflected
     in the UI the moment Firestore delivers the update — no polling,
     no manual refresh, no client-side arithmetic on the balance itself.
     The dashboard never increments/decrements this value itself.

     The actual balance math MUST happen server-side, in Cloud
     Functions, e.g.:
       - onCreate/onUpdate trigger on a `donations` doc transitioning
         to paymentStatus === "completed" →
           currentBalance += amount * (1 - COMMISSION_RATE)
         (i.e. add the NET amount, after the platform's 10% cut —
         never the gross donation amount).
       - onUpdate trigger on a `payout` doc transitioning to
         status === "paid"/"approved" →
           currentBalance -= payout.amount
     Both writes should run inside a Firestore transaction so
     concurrent donations/payouts can't race each other or double-
     count. `totalRaised` below (computed client-side from the
     completed-donations query) is for DISPLAY of the breakdown
     card only — it is never written back to the user doc.
     ───────────────────────────────────────────────────────────── */
 const availableBalance = Number(
  user.currentBalance ?? user.balance ?? 0
);
  const commission = useMemo(
    () => Math.max(0, totalRaised * COMMISSION_RATE), // display only
    [totalRaised]
  );

  /* ── loading skeleton ────────────────────────────────────── */
  if (!authResolved || loading) {
    return (
      <div className="appLayout">
        <Navbar />
        <div className="content">
          <div className="skeletonBase skeletonLine" style={{width:"40%", height:52, borderRadius:"50%", maxWidth:52}} />
          <div className="skeletonBase skeletonHero" style={{marginTop:16}} />
          <div className="statsGrid" style={{marginTop:16}}>
            {[1,2,3,4].map(i=><div key={i} className="skeletonBase skeletonCard"/>)}
          </div>
          <div className="skeletonBase skeletonChart" style={{marginTop:16}} />
          <div className="grid" style={{marginTop:16}}>
            <div className="skeletonBase skeletonCard"/>
            <div className="skeletonBase skeletonCard"/>
          </div>
        </div>
      </div>
    );
  }

  const liveMinLeft = activeEvent
    ? Math.max(0, Math.round((activeEvent._end - Date.now())/60000)) : 0;
  const initials = (user.username||"U").slice(0,2).toUpperCase();
  const isVerified = user.verified === true;

  return (
    <div className="appLayout">
      {/* ── local styling: glassmorphism, hover polish, responsiveness ──
          Scoped with the cheerDash-- prefix so it layers safely on top
          of the shared dashboard.css without fighting existing rules. */}
      <style>{`
        .cheerDash-glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(18px) saturate(150%);
          -webkit-backdrop-filter: blur(18px) saturate(150%);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow: 0 8px 28px rgba(0,0,0,0.28);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, background 0.22s ease;
          will-change: transform;
        }
        .cheerDash-glass:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.18);
          box-shadow: 0 16px 40px rgba(0,0,0,0.38);
          background: rgba(255,255,255,0.06);
        }
        .cheerDash-glass:active { transform: translateY(-1px); }

        .cheerDash-heroGlass {
          background: linear-gradient(135deg, rgba(10,132,255,0.22), rgba(88,86,214,0.16));
          backdrop-filter: blur(22px) saturate(160%);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 20px 48px rgba(10,132,255,0.16), 0 8px 24px rgba(0,0,0,0.3);
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }
        .cheerDash-heroGlass:hover {
          box-shadow: 0 24px 56px rgba(10,132,255,0.22), 0 10px 28px rgba(0,0,0,0.36);
          transform: translateY(-2px);
        }

        .cheerDash-statCard {
          background: rgba(255,255,255,0.035);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .cheerDash-statCard:hover {
          transform: translateY(-3px) scale(1.01);
          border-color: rgba(10,132,255,0.35);
          box-shadow: 0 14px 32px rgba(0,0,0,0.32);
        }

        .cheerDash-eventBanner {
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .cheerDash-eventBanner:hover {
          transform: translateY(-2px);
          filter: brightness(1.06);
          box-shadow: 0 12px 30px rgba(0,0,0,0.3);
        }

        .cheerDash-listLine {
          border-radius: 12px;
          transition: background 0.18s ease, transform 0.18s ease;
        }
        .cheerDash-listLine:hover {
          background: rgba(255,255,255,0.05);
          transform: translateX(2px);
        }

        .cheerDash-withdrawBtn {
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .cheerDash-withdrawBtn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.08);
          box-shadow: 0 10px 24px rgba(10,132,255,0.35);
        }
        .cheerDash-withdrawBtn:active:not(:disabled) { transform: translateY(0); }

        .cheerDash-fab {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .cheerDash-fab:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 14px 32px rgba(10,132,255,0.4);
        }

        @media (max-width: 768px) {
          .cheerDash-glass:hover, .cheerDash-statCard:hover,
          .cheerDash-eventBanner:hover, .cheerDash-heroGlass:hover {
            transform: none; /* avoid janky hover-lift on touch devices */
          }
        }
      `}</style>

      <Navbar navOpen={navOpen} setNavOpen={setNavOpen} />

      {navOpen && (
        <div className="overlay" onClick={()=>setNavOpen(false)} role="presentation"/>
      )}

      <div className="content">

        {/* ── profile header ─────────────────────────────── */}
        <div className="profileHeader cheerDash-glass">
          {user.photoURL
            ? <img src={user.photoURL} alt={user.username} className="profileAvatar"/>
            : <div className="profileAvatarPlaceholder">{initials}</div>
          }
          <div className="profileInfo">
            <div className="profileName">
              {user.username || "Creator"}
              {isVerified && (
                <img
                  src="/verified.png"
                  alt="Verified creator"
                  className="verifiedBadge"
                  title="Verified"
                />
              )}
            </div>
            <div className="profileSub">
              <span><i className="bi bi-people-fill"/>&nbsp;{donators} supporters</span>
              <span><i className="bi bi-cash-stack"/>&nbsp;{Number(totalRaised).toFixed(0)} ETB raised</span>
            </div>
          </div>
          <div className="lastActive">
            <i className="bi bi-shield-fill-check" style={{color:"var(--green)"}}/>
            Secured by Chapa
          </div>
        </div>

        {/* ── live event banner ──────────────────────────── */}
        {activeEvent && (
          <div
            className="eventBanner cheerDash-eventBanner"
            onClick={()=>window.location.href=`/donations?event=${activeEvent.id}`}
            role="button" tabIndex={0}
            onKeyDown={e=>e.key==="Enter"&&(window.location.href=`/donations?event=${activeEvent.id}`)}
          >
            <div className="liveDot"/>
            <div className="liveLabel">Live</div>
            <div className="eventName">{activeEvent.name}</div>
            <div className="eventTime">
              <i className="bi bi-clock" style={{marginRight:4}}/>{liveMinLeft} min left
            </div>
            <div className="eventArrow"><i className="bi bi-chevron-right"/></div>
          </div>
        )}

        {/* No live event — show the upcoming one, styled inactive
            (grayscale + reduced opacity) via .countdownBanner--inactive */}
        {!activeEvent && upcomingEvent && (
          <div
            className="eventBanner countdownBanner countdownBanner--inactive cheerDash-eventBanner"
            onClick={()=>window.location.href=`/donations?event=${upcomingEvent.id}`}
            role="button" tabIndex={0}
            onKeyDown={e=>e.key==="Enter"&&(window.location.href=`/donations?event=${upcomingEvent.id}`)}
          >
            <i className="bi bi-calendar-event" style={{color:"var(--blue-primary)"}}/>
            <div className="eventName">{upcomingEvent.name}</div>
            <div className="eventTime">{eventCountdown}</div>
            <div className="eventArrow"><i className="bi bi-chevron-right"/></div>
          </div>
        )}

        {/* ── hero balance card ──────────────────────────── */}
        <div className="heroCard cheerDash-heroGlass" style={{marginTop:16}}>
          <div className="heroInner">
            <div className="heroLeft">
              <div className="heroLabel">Available Balance</div>
              <div className="heroName">{user.username || "Creator"}</div>

              <div className="heroBalanceRow">
                <div className="heroBalance">
                  {showBalance ? `${availableBalance.toFixed(2)} ETB` : "•••• ETB"}
                </div>
                <button
                  className="heroEyeBtn"
                  onClick={()=>setShowBalance(s=>!s)}
                  aria-label={showBalance?"Hide balance":"Show balance"}
                >
                  <i className={`bi ${showBalance?"bi-eye":"bi-eye-slash"}`} style={{fontSize:18}}/>
                </button>
              </div>

              <div className="heroMeta">
                <div className="heroMetaItem">
                  <i className="bi bi-people"/>&nbsp;{donators} donors
                </div>
                <div className="heroMetaItem">
                  <i className="bi bi-percent"/>&nbsp;{Math.round(COMMISSION_RATE*100)}% fee
                </div>
                {totalRaised > 0 && (
                  <div className="trendPill">
                    <i className="bi bi-arrow-up-right"/>&nbsp;Active
                  </div>
                )}
              </div>

              {/* sparkline — fixed height wrapper prevents -1 error */}
              <div className="heroSparkline">
                <div style={{width:"100%",height:50}}>
                  <ResponsiveContainer width="100%" height={50}>
                    <LineChart data={chartData}>
                      <Line
                        type="monotone" dataKey="amount"
                        stroke="rgba(255,255,255,0.60)" strokeWidth={1.5} dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="heroRight">
              {pendingPayout ? (
                <div className="pendingMini">
                  <div className="pendingMiniTitle">
                    <i className="bi bi-clock-history" style={{marginRight:6,color:"var(--yellow)"}}/>
                    Payout in review
                  </div>
                  <div className="pendingMiniSub">
                    Pending: {Number(pendingPayout.amount||0).toFixed(2)} ETB
                  </div>
                  <button className="withdrawBtn cheerDash-withdrawBtn" onClick={()=>window.location.href="/support"}>
                    <i className="bi bi-headset"/>&nbsp;Contact support
                  </button>
                </div>
              ) : (
                <button
                  className="withdrawBtn cheerDash-withdrawBtn"
                  onClick={()=>window.location.href="/withdraw"}
                  disabled={availableBalance <= 0}
                  title={availableBalance<=0?"No balance to withdraw":"Request payout"}
                >
                  <i className="bi bi-send"/>&nbsp;Withdraw
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── stats grid ─────────────────────────────────── */}
        <div className="statsGrid" style={{marginTop:16}}>
          <StatCard label="Today"      value={todayAmt}   />
          <StatCard label="This week"  value={weekAmt}    />
          <StatCard label="This month" value={monthAmt}   />
          <StatCard label="All time"   value={totalRaised} highlight />
        </div>

        {/* ── balance breakdown ──────────────────────────── */}
        <div className="appleCard cheerDash-glass">
          <div className="appleCardHeader">
            <h2 className="appleCardTitle">Balance breakdown</h2>
            <span className="pill pill--blue">
              <i className="bi bi-percent" style={{marginRight:4}}/>
              {Math.round(COMMISSION_RATE*100)}% fee
            </span>
          </div>
          {/*
            Total raised   = gross sum of completed donations (client-computed, display only)
            Commission     = 10% platform fee (display only — same rate the Cloud
                              Function uses when crediting `currentBalance`)
            Available bal. = NET balance, read directly from `users.currentBalance`.
                              This is never derived on the client; it is only ever
                              written by trusted server-side Cloud Functions.
          */}
          <div className="breakdownBox">
            <BreakdownRow label="Total raised (gross)" value={`${Number(totalRaised).toFixed(2)} ETB`}/>
            <BreakdownRow label={`Platform commission (−${Math.round(COMMISSION_RATE*100)}%)`}
              value={`− ${Number(commission).toFixed(2)} ETB`}
              valueStyle={{color:"var(--red)"}}/>
            <div className="dividerLine"/>
            <BreakdownRow label="Available balance (net)" value={`${availableBalance.toFixed(2)} ETB`} strong/>
          </div>
          <div className="trustRow">
            <i className="bi bi-shield-lock-fill"/>
            <span>Payments processed securely by Chapa. Balance updates after confirmation, calculated server-side.</span>
          </div>
        </div>

        {/* ── toggles ────────────────────────────────────── */}
        <div className="grid">
          <div className="appleCard cheerDash-glass">
            <div className="toggleRow">
              <div>
                <h3 className="appleCardTitle">Accept donations</h3>
                <p className="subText" style={{marginTop:4}}>
                  {user.donationEnabled ? "Donation page is live" : "Donations are paused"}
                </p>
              </div>
              <label className="switch" aria-label="Toggle donations">
                <input type="checkbox" checked={!!user.donationEnabled}
                  onChange={e=>updateToggle("donationEnabled",e.target.checked)}/>
                <span className="slider"/>
              </label>
            </div>
          </div>
          <div className="appleCard cheerDash-glass">
            <div className="toggleRow">
              <div>
                <h3 className="appleCardTitle">TTS alerts</h3>
                <p className="subText" style={{marginTop:4}}>
                  {user.ttsEnabled ? "Voice alerts are active" : "Text-to-speech is off"}
                </p>
              </div>
              <label className="switch" aria-label="Toggle TTS">
                <input type="checkbox" checked={!!user.ttsEnabled}
                  onChange={e=>updateToggle("ttsEnabled",e.target.checked)}/>
                <span className="slider"/>
              </label>
            </div>
          </div>
        </div>

        {/* ── daily analytics chart ──────────────────────── */}
        <div
          className="appleCard cheerDash-glass"
          style={{cursor:"pointer"}}
          onClick={()=>window.location.href="/donations"}
          title="View full donation history"
        >
          <div className="appleCardHeader">
            <h2 className="appleCardTitle">Daily analytics</h2>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span className="pill">Last 30 days</span>
              <span className="pill pill--blue"><i className="bi bi-arrow-right"/></span>
            </div>
          </div>

          {/* explicit pixel height on wrapper + inner div, not "100%" */}
          <div className="chartOuterWrap">
            <div className="chartInnerWrap">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}
                  margin={{top:8,right:8,left:0,bottom:0}}>
                  <XAxis dataKey="day"
                    tick={{fill:"rgba(255,255,255,0.38)",fontSize:11}}
                    axisLine={false} tickLine={false}
                    interval="preserveStartEnd"/>
                  <YAxis
                    tick={{fill:"rgba(255,255,255,0.38)",fontSize:11}}
                    axisLine={false} tickLine={false} width={44}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Line type="monotone" dataKey="amount"
                    stroke="var(--blue-primary)" strokeWidth={2.5}
                    dot={false} isAnimationActive={false}
                    activeDot={{r:5,fill:"#fff",stroke:"var(--blue-primary)",strokeWidth:2}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── payout requests ────────────────────────────── */}
        <div className="appleCard cheerDash-glass">
          <div className="appleCardHeader">
            <h2 className="appleCardTitle">Payout requests</h2>
            <button className="miniLinkBtn" onClick={()=>window.location.href="/support"}>
              <i className="bi bi-headset" style={{marginRight:6}}/>Need help?
            </button>
          </div>
          {payouts.length === 0 ? (
            <div className="emptyState">
              <i className="bi bi-send" style={{fontSize:22,opacity:0.4,display:"block",marginBottom:8}}/>
              No payout requests yet
              <div className="emptyHint">Your last 5 payout requests will appear here.</div>
            </div>
          ) : (
            <div className="payoutList">
              {payouts.map(p => {
                const badge = statusBadge(statusNorm(p.status));
                return (
                  <div key={p.id} className="payoutRow cheerDash-listLine">
                    <div>
                      <div className="payoutAmount">{Number(p.amount||0).toFixed(2)} ETB</div>
                      <div className="payoutSub">{p.method||"—"} &nbsp;·&nbsp; {maskBank(p.bankNumber)}</div>
                    </div>
                    <div className="payoutRight">
                      <span className={`badgeChip ${badge.cls}`}>{badge.label}</span>
                      <div className="payoutDate">{fmtDate(p.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── top donators + recent donations ────────────── */}
        <div className="grid">
          <div className="appleCard cheerDash-glass">
            <div className="appleCardHeader">
              <h2 className="appleCardTitle">Top supporters</h2>
              <span className="pill">Top 3</span>
            </div>
            {topDonators.length === 0
              ? <div className="emptyState">No donations yet.</div>
              : topDonators.map(([name, info], i) => (
                <div key={name} className="listLine cheerDash-listLine">
                  <span className={`listRank ${["gold","silver","bronze"][i]||""}`}>
                    {i===0 ? <i className="bi bi-trophy-fill"/> : i+1}
                  </span>
                  <Avatar name={name} photo={info.photo} size={34} fontSize={11} />
                  <div className="listMeta">
                    <div className="listName">{name}</div>
                  </div>
                  <div className="listValue">{Number(info.amount).toFixed(2)} ETB</div>
                </div>
              ))
            }
          </div>

          <div className="appleCard cheerDash-glass">
            <div className="appleCardHeader">
              <h2 className="appleCardTitle">Recent donations</h2>
              <span className="pill">Last 5</span>
            </div>
            {recent.length === 0
              ? <div className="emptyState">No donations yet.</div>
              : recent.map((d) => (
                <div key={d._id} className="listLine cheerDash-listLine">
                  <Avatar name={d.name || "Anonymous"} photo={d._photo} size={34} fontSize={11} />
                  <div className="listMeta">
                    <div className="listName">{d.name||"Anonymous"}</div>
                    <div className="listSub">{fmtDate(d.createdAt)}</div>
                  </div>
                  <div className="listValue listValue--green">
                    {Number(d.amount||0).toFixed(2)} ETB
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* ── trust bar ──────────────────────────────────── */}
        <div className="trustBar">
          <div className="trustItem"><i className="bi bi-shield-lock-fill"/>Secured by Chapa</div>
          <div className="trustItem"><i className="bi bi-clock-history"/>Payouts 24–48 hrs</div>
          <div className="trustItem"><i className="bi bi-receipt"/>Full history</div>
          <div className="trustItem"><i className="bi bi-lock-fill"/>Encrypted</div>
        </div>

        <div className="footerNote">Cheer ET — powered by Kayon Tech</div>
      </div>

      {/* ── mobile FAB ─────────────────────────────────────── */}
      {!pendingPayout && availableBalance > 0 && (
        <button className="fab cheerDash-fab" onClick={()=>window.location.href="/withdraw"}
          aria-label="Withdraw funds">
          <i className="bi bi-send"/>
        </button>
      )}

      {/* ── toasts ─────────────────────────────────────────── */}
      <div className="toastContainer" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast cheerDash-glass">
            <div className="toastIcon" style={t.color==="yellow"
              ? {background:"rgba(255,214,10,0.16)",borderColor:"rgba(255,214,10,0.28)",color:"var(--yellow)"}
              : {}}>
              <i className={`bi ${t.icon}`}/>
            </div>
            <div className="toastBody">
              <div className="toastTitle">{t.title}</div>
              <div className="toastSub">{t.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── sub-components ──────────────────────────────────────────── */
function StatCard({ label, value, highlight }) {
  return (
    <div className={`statCard cheerDash-statCard${highlight ? " statCard--highlight" : ""}`}>
      <div className="statLabel">{label}</div>
      <div className="statValue" style={highlight?{color:"var(--blue-primary)"}:{}}>
        {Number(value||0).toFixed(2)}
        <span style={{fontSize:"0.55em",fontWeight:600,opacity:0.7,marginLeft:4}}>ETB</span>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, strong, valueStyle={} }) {
  return (
    <div className="rowLine">
      <span className="rowLabel">{label}</span>
      <span className={strong?"rowValueStrong":"rowValue"} style={valueStyle}>{value}</span>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */
function statusNorm(s) { return String(s||"pending").toLowerCase(); }

function statusBadge(status) {
  if (status==="paid"||status==="completed")    return {label:"Paid",       cls:"paid"};
  if (status==="approved"||status==="processing") return {label:"Processing",cls:"processing"};
  if (status==="rejected"||status==="failed")   return {label:"Rejected",   cls:"rejected"};
  return {label:"Pending", cls:"pending"};
}

function maskBank(n) {
  const s = String(n||"");
  if (s.length<=4) return s||"—";
  return `${s.slice(0,2)}••••${s.slice(-2)}`;
}

function fmtDate(ts) {
  try {
    if (!ts) return "—";
    const d = ts?.seconds ? new Date(ts.seconds*1000) : new Date(ts);
    return d.toLocaleString("en-ET",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
  } catch { return "—"; }
}