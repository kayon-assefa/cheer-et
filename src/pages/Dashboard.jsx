// Dashboard.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { auth, db } from "../firebase";
import { doc, collection, onSnapshot, updateDoc, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * ✅ Same DATA logic as your current dashboard
 * ✅ New UI matches the Withdraw page (Apple-pay inspired glass + gradient card)
 * ✅ Adds:
 * - Eye toggle for balance
 * - Breakdown card (Total, Commission, Available)
 * - Recent payout requests card (last 5) WITHOUT indexes (client-side sort)
 * - Pending payout banner (locks withdraw button)
 * - Keeps Donation/TTS toggles + analytics chart + top donators + recent donations
 */

function Dashboard() {
  const COMMISSION_RATE = 0.1;

  const [user, setUser] = useState({});
  const [balance, setBalance] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [donators, setDonators] = useState(0);
  const [topDonators, setTopDonators] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [recent, setRecent] = useState([]);

  const [payouts, setPayouts] = useState([]);
  const [pendingPayout, setPendingPayout] = useState(null);

  const [showBalance, setShowBalance] = useState(true);
const [showSubCount, setShowSubCount] = useState(true);
  const prevCount = useRef(0);
  const audio = useRef(null);

  // 🔔 notification permission
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
    audio.current = new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3");
  }, []);

  const commission = useMemo(() => {
    const t = Number(totalRaised || 0);
    return Math.max(0, t * COMMISSION_RATE);
  }, [totalRaised]);

  // ✅ AUTH + SNAPSHOTS (same logic, upgraded UI)
  useEffect(() => {
    let unsubUser = () => {};
    let unsubDonations = () => {};
    let unsubPayouts = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;

      // USER DATA
      unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        setUser(snap.data() || {});
      });

      // DONATIONS (same as your code)
      unsubDonations = onSnapshot(collection(db, "donations"), (snapshot) => {
        let total = 0;
        let donorsMap = {};
        let daily = {};
        let donationsArr = [];

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.streamerId === currentUser.uid) {
            total += Number(d.amount || 0);
            donationsArr.push(d);

            donorsMap[d.name] = (donorsMap[d.name] || 0) + Number(d.amount || 0);

            const date = d.createdAt?.seconds
              ? new Date(d.createdAt.seconds * 1000)
              : new Date();

            const day = date.getDate();
            daily[day] = (daily[day] || 0) + Number(d.amount || 0);
          }
        });

        // 🔊 sound
        if (donationsArr.length > prevCount.current) {
          try {
            audio.current?.play();
          } catch {}
        }
        prevCount.current = donationsArr.length;

        setTotalRaised(total);
        setBalance(total * (1 - COMMISSION_RATE));
        setDonators(Object.keys(donorsMap).length);

        setTopDonators(
          Object.entries(donorsMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
        );

        let chartArr = [];
        for (let i = 1; i <= 30; i++) {
          chartArr.push({ day: i, amount: daily[i] || 0 });
        }
        setChartData(chartArr);
        setRecent(donationsArr.slice(-5).reverse());
      });

      // PAYOUTS (no index): filter by uid then sort client-side
      const payoutQ = query(
        collection(db, "payout"),
        where("uid", "==", currentUser.uid)
      );

      unsubPayouts = onSnapshot(
        payoutQ,
        (snap) => {
          const arr = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));

          arr.sort((a, b) => {
            const ta = a?.createdAt?.seconds ? a.createdAt.seconds : 0;
            const tb = b?.createdAt?.seconds ? b.createdAt.seconds : 0;
            return tb - ta;
          });

          setPayouts(arr.slice(0, 5));

          const pend =
            arr.find(
              (p) => String(p.status || "pending").toLowerCase() === "pending"
            ) || null;
          setPendingPayout(pend);
        },
        (err) => {
          console.error("payout snapshot error:", err);
          setPayouts([]);
          setPendingPayout(null);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubUser();
      unsubDonations();
      unsubPayouts();
    };
  }, []);

  // 🔔 notification
  function sendNotification(msg) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(msg);
    }
  }

  // toggle
  async function updateToggle(field, value) {
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { [field]: value });

    if (field === "ttsEnabled") {
      sendNotification(value ? "Your Cheer ET TTS is On🔊" : "Your Cheer ET TTS is Off");
    }
    if (field === "donationEnabled") {
      sendNotification(value ? "Your Cheer ET Donations are On 💸" : "Your Cheer ET Donations are Off");
    }
  }

  return (
    <div className="appLayout">
      <Navbar />

      <div className="content">
        {/* TOP GRADIENT BALANCE CARD (withdraw-page style) */}
        <div className="appleBalanceCard">
          <div className="appleBalanceLeft">
            <p className="subText">Welcome</p>
            <h2 className="appleTitle">{user.username || "User"}</h2>

            <div className="appleBalanceRow">
              <h1 className="appleBalanceValue">
                {showBalance ? `${balance.toFixed(2)} ETB` : "****"}
              </h1>

              <button
                className="appleEyeBtn"
                onClick={() => setShowBalance((s) => !s)}
                aria-label={showBalance ? "Hide balance" : "Show balance"}
                title={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>

            <p className="subText">Available Balance</p>
          </div>

          <div className="appleBalanceRight">
            {pendingPayout ? (
              <div className="pendingMini">
                <div className="pendingMiniTitle">Payout in review</div>
                <div className="pendingMiniSub">
                  Pending: <b>{Number(pendingPayout.amount || 0).toFixed(2)} ETB</b>
                </div>
                <button
                  className="withdrawBtn"
                  onClick={() => (window.location.href = "/support")}
                >
                  Support
                </button>
              </div>
            ) : (
              <button
                className="withdrawBtn"
                onClick={() => (window.location.href = "/withdraw")}
              >
                Withdraw
              </button>
            )}
          </div>
        </div>

        {/* Breakdown (Total / Commission / Available) */}
        <div className="appleCard">
          <div className="appleCardHeader">
            <h3 className="appleCardTitle">Balance breakdown</h3>
            <div className="pill">Commission {Math.round(COMMISSION_RATE * 100)}%</div>
          </div>

          <div className="breakdownBox">
            <Row label="Total Raised" value={`${Number(totalRaised || 0).toFixed(2)} ETB`} />
            <Row label="Commission" value={`- ${Number(commission || 0).toFixed(2)} ETB`} />
            <Divider />
            <Row label="Available Balance" value={`${Number(balance || 0).toFixed(2)} ETB`} strong />
          </div>
        </div>

        {/* GRID: Total Raised & Donators (same content, new card style) */}
        <div className="grid">
          <div className="appleCard">
            <p className="subText">Total Raised</p>
            <h3 className="bigNumber">{Number(totalRaised || 0).toFixed(2)} ETB</h3>
          </div>

          <div className="appleCard">
            <p className="subText">Donators</p>
            <h3 className="bigNumber">{donators}</h3>
          </div>
        </div>

        {/* GRID: Donation toggle & TTS toggle */}
        <div className="grid">
          <div className="appleCard">
            <div className="toggleRow">
              <h3 className="appleCardTitle">Donation</h3>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={user.donationEnabled || false}
                  onChange={(e) => updateToggle("donationEnabled", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <p className="subText">
              Turn ON to accept donations.
            </p>
          </div>

          <div className="appleCard">
            <div className="toggleRow">
              <h3 className="appleCardTitle">TTS</h3>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={user.ttsEnabled || false}
                  onChange={(e) => updateToggle("ttsEnabled", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <p className="subText">
              Text-to-speech donation alerts.
            </p>
          </div>
        </div>

        {/* Daily Analytics */}
        <div className="appleCard">
          <div className="appleCardHeader">
            <h3 className="appleCardTitle">Daily Analytics</h3>
            <div className="pill">Last 30 days</div>
          </div>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#f3f3f3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent payout requests */}
        <div className="appleCard">
          <div className="appleCardHeader">
            <h3 className="appleCardTitle">Recent payout requests</h3>
            <button
              className="miniLinkBtn"
              onClick={() => (window.location.href = "/support")}
            >
              Need help?
            </button>
          </div>

          {payouts.length === 0 ? (
            <div className="emptyState">
              No payout requests yet.
              <div className="emptyHint">Your last 5 payout requests will appear here.</div>
            </div>
          ) : (
            <div className="payoutList">
              {payouts.map((p) => {
                const st = String(p.status || "pending").toLowerCase();
                const badge = statusBadge(st);
                return (
                  <div key={p.id} className="payoutRow">
                    <div>
                      <div className="payoutAmount">
                        {Number(p.amount || 0).toFixed(2)} ETB
                      </div>
                      <div className="payoutSub">
                        {(p.method || "—") + " • " + maskBank(p.bankNumber)}
                      </div>
                    </div>

                    <div className="payoutRight">
                      <div className={`badgeChip ${badge.className}`}>
                        {badge.label}
                      </div>
                      <div className="payoutDate">{formatDate(p.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Donators + Recent Donations */}
        <div className="grid">
          <div className="appleCard">
            <div className="appleCardHeader">
              <h3 className="appleCardTitle">Top Donators</h3>
              <div className="pill">Top 3</div>
            </div>

            {topDonators.length === 0 ? (
              <div className="emptyState">No data yet.</div>
            ) : (
              topDonators.map((d, i) => (
                <p key={i} className="listLine">
                  <span className="listName">{d[0]}</span>
                  <span className="listValue">{Number(d[1] || 0).toFixed(2)} ETB</span>
                </p>
              ))
            )}
          </div>

          <div className="appleCard">
            <div className="appleCardHeader">
              <h3 className="appleCardTitle">Recent Donations</h3>
              <div className="pill">Last 5</div>
            </div>

            {recent.length === 0 ? (
              <div className="emptyState">No donations yet.</div>
            ) : (
              recent.map((d, i) => (
                <p key={i} className="listLine">
                  <span className="listName">{d.name || "Anonymous"}</span>
                  <span className="listValue">{Number(d.amount || 0).toFixed(2)} ETB</span>
                </p>
              ))
            )}
          </div>
        </div>

        <div className="footerNote">
          Cheer ET under by Kayon Tech
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

/* ---------- helpers/components ---------- */

function Row({ label, value, strong }) {
  return (
    <div className="rowLine">
      <div className="rowLabel">{label}</div>
      <div className={`rowValue ${strong ? "rowValueStrong" : ""}`}>{value}</div>
    </div>
  );
}
function Divider() {
  return <div className="dividerLine" />;
}

function maskBank(n) {
  const s = String(n || "");
  if (s.length <= 4) return s || "—";
  return `${s.slice(0, 2)}••••••${s.slice(-2)}`;
}

function formatDate(ts) {
  try {
    if (!ts) return "—";
    const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function statusBadge(status) {
  if (status === "paid" || status === "completed")
    return { label: "Paid", className: "paid" };
  if (status === "approved" || status === "processing")
    return { label: "Processing", className: "processing" };
  if (status === "rejected" || status === "failed")
    return { label: "Rejected", className: "rejected" };
  return { label: "Pending", className: "pending" };
}

/* ---------- icons ---------- */

function EyeOpenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.2 12s3.6-7 9.8-7 9.8 7 9.8 7-3.6 7-9.8 7S2.2 12 2.2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 12s3.6-7 9-7c2.1 0 4 .7 5.6 1.7M21 12s-3.6 7-9 7c-2.1 0-4-.7-5.6-1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 4l16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}