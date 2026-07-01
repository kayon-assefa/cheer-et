import { useEffect, useState, useRef, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  query,
  where,
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

/* ─── Commission rate ──────────────────────────────────────── */
const COMMISSION_RATE = 0.10;

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
      background:"rgba(2,11,26,0.95)",
      border:"1px solid rgba(255,255,255,0.12)",
      borderRadius:10,padding:"8px 12px",fontSize:13,color:"#fff",
    }}>
      <div style={{opacity:0.6,marginBottom:4}}>Day {label}</div>
      <div style={{fontWeight:800}}>{Number(payload[0].value).toFixed(2)} ETB</div>
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────────────────── */
export default function Dashboard() {
  const [authUser,       setAuthUser]       = useState(null);
  const [user,           setUser]           = useState({});
  const [loading,        setLoading]        = useState(true);

  /* donations */
  const [totalRaised,    setTotalRaised]    = useState(0);
  const [donators,       setDonators]       = useState(0);
  const [topDonators,    setTopDonators]    = useState([]);
  const [chartData,      setChartData]      = useState([]);
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

  const prevCount    = useRef(0);
  const prevTotal    = useRef(0);
  const audioRef     = useRef(null);
  const toastId      = useRef(0);

  /* ── audio init ──────────────────────────────────────────── */
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
    const a = new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3");
    a.preload = "auto";
    audioRef.current = a;
  }, []);

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

  /* ── firebase ────────────────────────────────────────────── */
  useEffect(() => {
    const unsubs = [];

    const unsubAuth = onAuthStateChanged(auth, (cu) => {
      if (!cu) { setLoading(false); return; }
      setAuthUser(cu);

      /* user doc — balance read from currentBalance field */
      unsubs.push(
        onSnapshot(doc(db, "users", cu.uid), (snap) => {
          setUser(snap.data() || {});
          setLoading(false);
        })
      );

      /* donations */
      unsubs.push(
        onSnapshot(collection(db, "donations"), (snapshot) => {
          let total = 0;
          const donorsMap = {};
          const daily = {};
          const arr = [];

          const now   = Date.now();
          const day0  = new Date(); day0.setHours(0,0,0,0);
          const week0 = new Date(now - 7*86400000);
          const mon0  = new Date(now - 30*86400000);
          let todayT=0, weekT=0, monthT=0;

          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.streamerId !== cu.uid) return;
            const amt  = Number(d.amount || 0);
            const date = d.createdAt?.seconds
              ? new Date(d.createdAt.seconds * 1000) : new Date();

            total += amt;
            arr.push({ ...d, _id: docSnap.id, _date: date });
            donorsMap[d.name] = (donorsMap[d.name] || 0) + amt;
            const day = date.getDate();
            daily[day] = (daily[day] || 0) + amt;
            if (date >= day0)  todayT += amt;
            if (date >= week0) weekT  += amt;
            if (date >= mon0)  monthT += amt;
          });

          /* sound + toast for new donation */
          if (arr.length > prevCount.current) {
            const newest = [...arr].sort((a,b)=>b._date-a._date)[0];
            audioRef.current?.play().catch(() => {});
            addToast({
              title: `${newest?.name || "Someone"} donated`,
              sub:   `${Number(newest?.amount||0).toFixed(2)} ETB`,
              icon:  "bi-heart-fill",
              color: "green",
            });
            sendNotif(`New donation: ${Number(newest?.amount||0).toFixed(2)} ETB from ${newest?.name||"Anonymous"}`);
          }
          prevCount.current = arr.length;

          setTotalRaised(total);
          setTodayAmt(todayT);
          setWeekAmt(weekT);
          setMonthAmt(monthT);
          setDonators(Object.keys(donorsMap).length);
          setTopDonators(
            Object.entries(donorsMap).sort((a,b)=>b[1]-a[1]).slice(0,3)
          );
          setChartData(
            Array.from({length:30},(_,i)=>({ day:i+1, amount:daily[i+1]||0 }))
          );
          setRecent([...arr].sort((a,b)=>b._date-a._date).slice(0,5));
        })
      );

      /* payouts */
      const payoutQ = query(collection(db,"payout"), where("uid","==",cu.uid));
      unsubs.push(
        onSnapshot(payoutQ, (snap) => {
          const arr = [];
          snap.forEach(d => arr.push({ id:d.id, ...d.data() }));
          arr.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
          setPayouts(arr.slice(0,5));
          setPendingPayout(arr.find(p=>statusNorm(p.status)==="pending")||null);
        }, (err) => {
          console.error("payout snapshot:", err);
          setPayouts([]); setPendingPayout(null);
        })
      );

      /* events */
      unsubs.push(
        onSnapshot(collection(db,"events"), (snap) => {
          const now = Date.now();
          let live=null, upcoming=null;
          snap.forEach((docSnap) => {
            const ev = { id:docSnap.id, ...docSnap.data() };
            if (ev.ownerId && ev.ownerId !== cu.uid) return;
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
        })
      );
    });

    return () => { unsubAuth(); unsubs.forEach(u=>u()); };
  }, [addToast, sendNotif]);

  /* ── toggle ──────────────────────────────────────────────── */
  const updateToggle = useCallback(async (field, value) => {
    if (!authUser) return;
    await updateDoc(doc(db,"users",authUser.uid), { [field]:value });
    if (field==="ttsEnabled")      sendNotif(value?"TTS enabled":"TTS disabled");
    if (field==="donationEnabled") sendNotif(value?"Donations open":"Donations paused");
  }, [authUser, sendNotif]);

  /* ── balance from users.currentBalance ───────────────────── */
  const availableBalance = Number(user.currentBalance || 0);
  const commission       = Math.max(0, totalRaised * COMMISSION_RATE);

  /* ── loading skeleton ────────────────────────────────────── */
  if (loading) {
    return (
      <div className="appLayout">
        <Navbar />
        <div className="content">
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

  return (
    <div className="appLayout">
      <Navbar navOpen={navOpen} setNavOpen={setNavOpen} />

      {/* mobile top bar */}
      <div className="mobileTopBar">
        <button className="toggleBtn" onClick={()=>setNavOpen(true)} aria-label="Open menu">
          <i className="bi bi-list" style={{fontSize:22}}/>
        </button>
        <span style={{fontWeight:800,fontSize:16}}>
          Cheer<span style={{color:"var(--blue-primary)"}}>ET</span>
        </span>
        <div style={{width:36}}/>
      </div>

      {navOpen && (
        <div className="overlay" onClick={()=>setNavOpen(false)} role="presentation"/>
      )}

      <div className="content">

        {/* ── profile header ─────────────────────────────── */}
        <div className="profileHeader">
          {user.photoURL
            ? <img src={user.photoURL} alt={user.username} className="profileAvatar"/>
            : <div className="profileAvatarPlaceholder">{initials}</div>
          }
          <div className="profileInfo">
            <div className="profileName">
              {user.username || "Creator"}
              <span className="verifiedBadge" title="Verified">
                <i className="bi bi-check"/>
              </span>
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
            className="eventBanner"
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

        {!activeEvent && upcomingEvent && (
          <div
            className="eventBanner countdownBanner"
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
        <div className="heroCard" style={{marginTop:16}}>
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
                    <LineChart data={chartData.length ? chartData : [{day:1,amount:0}]}>
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
                  <button className="withdrawBtn" onClick={()=>window.location.href="/support"}>
                    <i className="bi bi-headset"/>&nbsp;Contact support
                  </button>
                </div>
              ) : (
                <button
                  className="withdrawBtn"
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
        <div className="appleCard">
          <div className="appleCardHeader">
            <h2 className="appleCardTitle">Balance breakdown</h2>
            <span className="pill pill--blue">
              <i className="bi bi-percent" style={{marginRight:4}}/>
              {Math.round(COMMISSION_RATE*100)}% fee
            </span>
          </div>
          <div className="breakdownBox">
            <BreakdownRow label="Total raised"        value={`${Number(totalRaised).toFixed(2)} ETB`}/>
            <BreakdownRow label="Platform commission" value={`− ${Number(commission).toFixed(2)} ETB`}
              valueStyle={{color:"var(--red)"}}/>
            <div className="dividerLine"/>
            <BreakdownRow label="Available balance"   value={`${availableBalance.toFixed(2)} ETB`} strong/>
          </div>
          <div className="trustRow">
            <i className="bi bi-shield-lock-fill"/>
            <span>Payments processed securely by Chapa. Balance updates after confirmation.</span>
          </div>
        </div>

        {/* ── toggles ────────────────────────────────────── */}
        <div className="grid">
          <div className="appleCard">
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
          <div className="appleCard">
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
          className="appleCard"
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

          {/* FIXED: explicit pixel height on wrapper + inner div, not "100%" */}
          <div className="chartOuterWrap">
            <div className="chartInnerWrap">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData.length ? chartData : [{day:1,amount:0}]}
                  margin={{top:8,right:8,left:0,bottom:0}}>
                  <XAxis dataKey="day"
                    tick={{fill:"rgba(255,255,255,0.38)",fontSize:11}}
                    axisLine={false} tickLine={false}/>
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
        <div className="appleCard">
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
                  <div key={p.id} className="payoutRow">
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
          <div className="appleCard">
            <div className="appleCardHeader">
              <h2 className="appleCardTitle">Top supporters</h2>
              <span className="pill">Top 3</span>
            </div>
            {topDonators.length === 0
              ? <div className="emptyState">No donations yet.</div>
              : topDonators.map(([name,amt],i) => (
                <div key={i} className="listLine">
                  <span className={`listRank ${["gold","silver","bronze"][i]||""}`}>
                    {i===0 ? <i className="bi bi-trophy-fill"/> : i+1}
                  </span>
                  <div className="listAvatarPlaceholder" style={{fontSize:11}}>
                    {(name||"?").slice(0,2).toUpperCase()}
                  </div>
                  <div className="listMeta">
                    <div className="listName">{name}</div>
                  </div>
                  <div className="listValue">{Number(amt).toFixed(2)} ETB</div>
                </div>
              ))
            }
          </div>

          <div className="appleCard">
            <div className="appleCardHeader">
              <h2 className="appleCardTitle">Recent donations</h2>
              <span className="pill">Last 5</span>
            </div>
            {recent.length === 0
              ? <div className="emptyState">No donations yet.</div>
              : recent.map((d,i) => (
                <div key={i} className="listLine">
                  <div className="listAvatarPlaceholder" style={{fontSize:11}}>
                    {(d.name||"A").slice(0,2).toUpperCase()}
                  </div>
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
        <button className="fab" onClick={()=>window.location.href="/withdraw"}
          aria-label="Withdraw funds">
          <i className="bi bi-send"/>
        </button>
      )}

      {/* ── toasts ─────────────────────────────────────────── */}
      <div className="toastContainer" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast">
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
    <div className="statCard">
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