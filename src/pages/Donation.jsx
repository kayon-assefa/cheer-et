import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area
} from "recharts";

/* =========================
   COUNT UP HOOK (SAFE)
========================= */
function useCountUp(value, speed = 20) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = () => {
      start += Math.ceil(value / speed);
      if (start >= value) {
        setDisplay(value);
        return;
      }
      setDisplay(start);
      requestAnimationFrame(step);
    };
    step();
  }, [value]);

  return display;
}

/* =========================
   MAIN DASHBOARD
========================= */
export default function Dashboard() {
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [latest, setLatest] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isMobile, setIsMobile] = useState(false);

  /* MOBILE DETECT */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* FIREBASE REALTIME */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "donations"), (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate()
      }));

      setDonations(data);
      setLoading(false);

      if (data.length > 0) {
        setLatest(data[data.length - 1]);
        setTimeout(() => setLatest(null), 3000);
      }
    });

    return () => unsub();
  }, []);

  /* =========================
     ANALYTICS (ETB)
  ========================= */
  const total = useMemo(() =>
    donations.reduce((a, b) => a + Number(b.amount || 0), 0)
  , [donations]);

  const donors = donations.length;

  const top = useMemo(() =>
    donations.reduce((a, b) => (b.amount > (a?.amount || 0) ? b : a), {})
  , [donations]);

  const avg = donors ? total / donors : 0;
  const goal = 5000;
  const progress = Math.min((total / goal) * 100, 100);

  /* =========================
     CHART DATA (SAFE)
  ========================= */
  const chartData = useMemo(() => {
    const arr = Array.from({ length: 7 }, (_, i) => ({
      day: `D${i + 1}`,
      revenue: 0,
      donors: 0,
      activity: 0
    }));

    donations.forEach(d => {
      const i = Math.floor(Math.random() * 7);
      arr[i].revenue += Number(d.amount || 0);
      arr[i].donors += 1;
      arr[i].activity += 1;
    });

    return arr;
  }, [donations]);

  /* =========================
     FILTER
  ========================= */
  const filtered = useMemo(() => {
    return donations.filter(d => {
      if (filter === "name") return d.name?.toLowerCase().includes(search.toLowerCase());
      if (filter === "money") return Number(d.amount) >= Number(search || 0);
      return true;
    });
  }, [donations, filter, search]);

  /* =========================
     COUNTERS (ANIMATED)
  ========================= */
  const cTotal = useCountUp(total);
  const cDonors = useCountUp(donors);
  const cAvg = useCountUp(avg);

  /* =========================
     MOBILE BLOCK
  ========================= */
  if (isMobile) {
    return (
      <div className="mobileOverlay">
        <div className="mobileCard">
          <h2> Not Available</h2>
          <p>Open on PC for full dashboard experience</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      {/* LIVE POPUP */}
      {latest && (
        <div className="livePopup">
           {latest.name} donated {latest.amount} ETB
        </div>
      )}

      <div className="content">

        {/* TOP BAR */}
        <div className="topBar">
          <h2> Donation Dashboard</h2>

          <div className="topActions">
            <button onClick={()=>navigate("/livesub")} className="btnApple">
              Live Sub
            </button>

            <div className="notifWrap">
              
              <i class="bi bi-bell" onClick={()=>setNotifOpen(!notifOpen)}></i>

              {notifOpen && (
                <div className="notifPanel">
                  <div className="notifItem">New donation received</div>
                  <div className="notifItem">Goal updated</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COUNTERS */}
        <div className="grid">

          <div className="card glass">
            <h3>Total Revenue</h3>
            <h1>{cTotal} ETB</h1>
          </div>

          <div className="card glass">
            <h3>Total Donors</h3>
            <h1>{cDonors}</h1>
          </div>

          <div className="card glass">
            <h3>Average</h3>
            <h1>{cAvg.toFixed(0)} ETB</h1>
          </div>

          <div className="card glass">
            <h3>Top Donor</h3>
            <h1>{top?.name || "—"}</h1>
          </div>

          <div className="card glass full">
            <h3>Goal Progress</h3>
            <div className="goalBar">
              <div className="goalFill" style={{ width: `${progress}%` }} />
            </div>
            <p>{progress.toFixed(1)}% of {goal} ETB</p>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid">

          <div className="card glass full">
            <div className="cardHeader">
              <h3>Revenue Chart</h3>
              <button onClick={()=>navigate("/withdraw")} className="btnApple">
                Withdraw
              </button>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line dataKey="revenue" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card glass">
            <h3>Donors</h3>
            <BarChart width={300} height={200} data={chartData}>
              <XAxis dataKey="day" />
              <Bar dataKey="donors" fill="#22c55e" />
            </BarChart>
          </div>

          <div className="card glass">
            <h3>Activity</h3>
            <AreaChart width={300} height={200} data={chartData}>
              <Area dataKey="activity" fill="#8b5cf6" />
            </AreaChart>
          </div>

        </div>

        {/* SEARCH */}
        <div className="card glass">
          <div className="filterBar">
            <input
              className="inputApple"
              placeholder="Search..."
              onChange={(e)=>setSearch(e.target.value)}
            />

            <select onChange={(e)=>setFilter(e.target.value)} className="inputApple">
              <option value="all">All</option>
              <option value="name">Name</option>
              <option value="money">Money</option>
            </select>
          </div>

          {filtered.map((d,i)=>(
            <div key={d.id} className="donationRow">
              <div>
                <b>{i+1}. {d.name}</b>
                <p>{d.message}</p>
              </div>
              <div className="donationAmount">{d.amount} ETB</div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}