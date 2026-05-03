import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
const Home = () => {
  const [isAmharic, setIsAmharic] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ months: 0, days: 0, hours: 0 });

  useEffect(() => {
    const target = new Date('2026-06-16T00:00:00').getTime();
    const interval = setInterval(() => {
      const diff = target - new Date().getTime();
      if (diff > 0) {
        setTimeLeft({
          months: Math.floor(diff / (1000 * 60 * 60 * 24 * 30)),
          days: Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);
const navigate = useNavigate();
  const t = isAmharic ? {
    heroTitle: "ስሜቶችን እየፈጠርክ ገንዘብ ያግኙ",
    heroDesc: "ተከታታዮችዎን ወደ ገቢ ይቀይሩ በቀላል ሊንክ",
    createBtn: "ገጽዎን ይፍጠሩ",
    countTitle: "የመክፈቻ ቆጠራ",
    left: "እስከ መክፈቻው",
    toggle: "EN"
  } : {
    heroTitle: "Get paid while creating moments",
    heroDesc: "Turn your audience into income with a simple link built for Ethiopian creators.",
    createBtn: "Create Your Page",
    countTitle: "Launch Countdown",
    left: "left for launch",
    toggle: "አማ"
  };

  return (
    <>
      <style>{`
        :root {
          --bg1: #0b0f14;
          --bg2: #121821;
          --glass: rgba(255,255,255,0.08);
          --border: rgba(255,255,255,0.15);
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          background: linear-gradient(180deg, var(--bg1), var(--bg2));
          color: #f5f7fa;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial;
        }
        .glass {
          background: var(--glass);
          border: 1px solid var(--border);
          backdrop-filter: blur(20px);
          border-radius: 18px;
        }
        .btn {
          padding: 16px 36px;
          background: linear-gradient(90deg, #6aa8ff, #9bc4ff);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn:hover { transform: scale(1.05); }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: 'rgba(31,45,66,0.9)', backdropFilter: 'blur(18px)', zIndex: 100
      }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Cheer ET</h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setIsAmharic(!isAmharic)} 
            className="glass" 
            style={{ padding: '8px 16px' }}
          >
            {t.toggle}
          </button>
          <button 
         onClick={() => navigate('/login')}
            className="glass" 
            style={{ padding: '8px 20px' }}
          >
            Login
          </button>
          <button 
            onClick={() => window.location.href = '/register'} 
            className="btn"
          >
            Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ paddingTop: '160px', textAlign: 'center', paddingBottom: '100px' }}>
        <h1 style={{
          fontSize: '4.5rem',
          lineHeight: 1.1,
          background: 'linear-gradient(90deg, #fff, #7e8fff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '20px'
        }}>
          {t.heroTitle}
        </h1>
        <p style={{ fontSize: '1.35rem', maxWidth: '620px', margin: '0 auto 40px', opacity: 0.9 }}>
          {t.heroDesc}
        </p>

        <button 
          onClick={() => window.location.href = '/register'} 
          className="btn"
        >
          {t.createBtn}
        </button>
      </section>

      {/* Countdown */}
      <section style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '30px' }}>{t.countTitle}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', flexWrap: 'wrap' }}>
          <div><span style={{ fontSize: '4rem', fontWeight: 800, display: 'block' }}>{timeLeft.months}</span> Months</div>
          <div><span style={{ fontSize: '4rem', fontWeight: 800, display: 'block' }}>{timeLeft.days}</span> Days</div>
          <div><span style={{ fontSize: '4rem', fontWeight: 800, display: 'block' }}>{timeLeft.hours}</span> Hours</div>
        </div>
        <p style={{ marginTop: '20px', opacity: 0.7 }}>{t.left}</p>
      </section>

      <footer style={{ textAlign: 'center', padding: '80px 20px', color: '#888' }}>
        Cheer ET • Addis Ababa • Powered by Chapa • 2026
      </footer>
    </>
  );
};

export default Home;