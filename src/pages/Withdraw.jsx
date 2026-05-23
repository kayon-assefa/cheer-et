// WithdrawPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";



export default function WithdrawPage() {
  const nav = useNavigate();

  // Settings
  const COMMISSION_RATE = 0.1;
  const MIN_WITHDRAW = 50; // ETB
  const DAILY_MAX_WITHDRAW = 5000; // ETB (0 disables)
  const WARN_PERCENT = 0.8; // warn if withdraw > 80% of available

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState({});
  const [totalRaised, setTotalRaised] = useState(0);

  const [showBalance, setShowBalance] = useState(true);

  // form
  const [amount, setAmount] = useState("");
  const [amountMasked, setAmountMasked] = useState(true);

  const [method, setMethod] = useState("CBE");
  const [bankNumber, setBankNumber] = useState("");
  const [bankUserName, setBankUserName] = useState("");
  const [password, setPassword] = useState("");

  // payout list
  const [payouts, setPayouts] = useState([]);
  const [pendingPayout, setPendingPayout] = useState(null);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [requestedAmount, setRequestedAmount] = useState(0);

  const donationEnabled = Boolean(user?.donationEnabled ?? true);
  const isVerified = Boolean(user?.isVerified ?? user?.verified ?? true);

  const commission = useMemo(() => {
    const t = Number(totalRaised || 0);
    return Math.max(0, t * COMMISSION_RATE);
  }, [totalRaised]);

  const availableBalance = useMemo(() => {
    const t = Number(totalRaised || 0);
    return Math.max(0, t * (1 - COMMISSION_RATE));
  }, [totalRaised]);

  const amountNumber = useMemo(() => {
    const n = Number(String(amount).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const remainingAfter = useMemo(() => {
    return Math.max(0, availableBalance - amountNumber);
  }, [availableBalance, amountNumber]);

  const showBigWithdrawWarning = useMemo(() => {
    if (!availableBalance) return false;
    return amountNumber > 0 && amountNumber / availableBalance >= WARN_PERCENT;
  }, [amountNumber, availableBalance]);

  const amountError = useMemo(() => {
    if (!amount) return "";
    if (amountNumber <= 0) return "Amount must be greater than 0.";
    if (amountNumber < MIN_WITHDRAW) return `Minimum withdrawal is ${MIN_WITHDRAW} ETB.`;
    if (amountNumber > availableBalance) return "Amount can’t be more than your available balance.";
    return "";
  }, [amount, amountNumber, availableBalance]);

  const bankNumberError = useMemo(() => {
    if (!bankNumber) return "";
    if (bankNumber.length < 6) return "Bank number looks too short.";
    return "";
  }, [bankNumber]);

  const formLocked = useMemo(() => {
    if (loading || submitting) return true;
    if (!donationEnabled) return true;
    if (!isVerified) return true;
    if (pendingPayout) return true; // pending lock
    return false;
  }, [loading, submitting, donationEnabled, isVerified, pendingPayout]);

  const canSubmit = useMemo(() => {
    if (formLocked) return false;
    if (!auth.currentUser) return false;

    if (!amount || amountNumber <= 0) return false;
    if (amountNumber < MIN_WITHDRAW) return false;
    if (amountNumber > availableBalance) return false;

    if (!method) return false;
    if (!bankNumber || bankNumber.length < 6) return false;
    if (!bankUserName || bankUserName.trim().length < 2) return false;

    if (!password || password.length < 6) return false;

    return true;
  }, [
    formLocked,
    amount,
    amountNumber,
    availableBalance,
    method,
    bankNumber,
    bankUserName,
    password,
  ]);

  function openError(msg) {
    setModalType("error");
    setModalTitle("Failed to request payout");
    setModalMessage(msg);
    setModalOpen(true);
  }

  function openSuccess(requested) {
    setRequestedAmount(requested);
    setModalType("success");
    setModalTitle("Successfully requested payout");
    setModalMessage("We’ll contact you within 7 days.");
    setModalOpen(true);
  }

  // Load listeners like your dashboard + payout list (no index) + bank info memory
  useEffect(() => {
    let unsubUser = () => {};
    let unsubDonations = () => {};
    let unsubPayouts = () => {};

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        nav("/login");
        return;
      }

      // user doc
      unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        const u = snap.data() || {};
        setUser(u);

        // ✅ Bank info memory (prefill)
        const saved = u.lastBankInfo || {};
        if (saved.method) setMethod(saved.method);
        if (saved.bankNumber) setBankNumber(String(saved.bankNumber));
        if (saved.bankUserName) setBankUserName(String(saved.bankUserName));
      });

      // donations sum (same logic as dashboard)
      unsubDonations = onSnapshot(collection(db, "donations"), (snapshot) => {
        let total = 0;
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d?.streamerId === currentUser.uid) total += Number(d.amount || 0);
        });
        setTotalRaised(total);
      });

      // payout list (uid filter only) -> sort client-side
      const payoutQ = query(collection(db, "payout"), where("uid", "==", currentUser.uid));
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

          const top5 = arr.slice(0, 5);
          setPayouts(top5);

          const pend = arr.find((p) => String(p.status || "pending").toLowerCase() === "pending") || null;
          setPendingPayout(pend);
        },
        (err) => {
          console.error("payout list error:", err);
          setPayouts([]);
          setPendingPayout(null);
        }
      );

      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubUser();
      unsubDonations();
      unsubPayouts();
    };
  }, [nav]);

  // helper: fetch all payouts once (for daily limit calc)
  async function getAllUserPayouts(uid) {
    const qAll = query(collection(db, "payout"), where("uid", "==", uid));
    const snap = await getDocs(qAll);
    const arr = [];
    snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
    return arr;
  }

  function isToday(ts) {
    if (!ts) return false;
    const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!auth.currentUser) return nav("/login");

    if (!donationEnabled) return openError("Your account is not active (donations are OFF).");
    if (!isVerified) return openError("Your account is not verified yet.");
    if (pendingPayout) return openError("You already have a pending payout request. Please wait or contact support.");

    if (amountNumber <= 0) return openError("Enter a valid amount.");
    if (amountNumber < MIN_WITHDRAW) return openError(`Minimum withdrawal is ${MIN_WITHDRAW} ETB.`);
    if (amountNumber > availableBalance) return openError("Amount exceeds your available balance.");

    if (!bankNumber || bankNumber.length < 6) return openError("Please enter a valid bank number.");
    if (!bankUserName || bankUserName.trim().length < 2) return openError("Please enter the account holder name.");
    if (!password || password.length < 6) return openError("Please enter your password.");

    setSubmitting(true);

    try {
      const uid = auth.currentUser.uid;

      // ✅ Daily max (client-side; no index)
      if (DAILY_MAX_WITHDRAW > 0) {
        const all = await getAllUserPayouts(uid);
        const todaySum = all
          .filter((p) => isToday(p.createdAt))
          .filter((p) => {
            const st = String(p.status || "").toLowerCase();
            return st !== "rejected" && st !== "failed";
          })
          .reduce((acc, p) => acc + Number(p.amount || 0), 0);

        if (todaySum + amountNumber > DAILY_MAX_WITHDRAW) {
          return openError(
            `Daily limit exceeded. Today requested: ${todaySum.toFixed(2)} ETB. Daily max: ${DAILY_MAX_WITHDRAW} ETB.`
          );
        }
      }

      // re-auth
      const email = auth.currentUser.email;
      if (!email) return openError("No email on this account. Please contact support.");

      const cred = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(auth.currentUser, cred);

      // ✅ save payout request
      await addDoc(collection(db, "payout"), {
        uid,
        username: user?.username || "User",

        amount: amountNumber,
        method,
        bankNumber,
        bankUserName,

        status: "pending",

        totalRaisedAtRequest: Number(totalRaised || 0),
        commissionRate: COMMISSION_RATE,
        commissionAtRequest: Number(commission || 0),
        availableBalanceAtRequest: Number(availableBalance || 0),

        createdAt: serverTimestamp(),
      });

      // ✅ Bank info memory: save last used bank info
      await updateDoc(doc(db, "users", uid), {
        lastBankInfo: {
          method,
          bankNumber,
          bankUserName,
          updatedAt: serverTimestamp(),
        },
      });

      // clear
      setPassword("");
      setAmount("");
      setAmountMasked(true);

      openSuccess(amountNumber);
    } catch (err) {
      console.error(err);
      const code = err?.code || "";
      if (code.includes("auth/wrong-password")) openError("Incorrect password.");
      else if (code.includes("auth/too-many-requests")) openError("Too many attempts. Try again later.");
      else openError("Failed to request payout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* Top balance card */}
        <div style={styles.topCard}>
          <div style={styles.topRow}>
            <div>
              <div style={styles.topLabel}>Available balance</div>
              <div style={styles.topBalance}>
                {showBalance ? `${availableBalance.toFixed(2)} ETB` : "****"}
              </div>

              <div style={styles.subText}>
                <span style={styles.userName}>{user?.username || "User"}</span>
                <span style={styles.dot}>•</span>
                <span>From total revenue − 10% commission</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBalance((s) => !s)}
              style={styles.eyeBtn}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
              title={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <EyeOpenIcon /> : <EyeClosedIcon />}
            </button>
          </div>
        </div>

        {/* Pending lock banner */}
        {pendingPayout && (
          <div style={styles.pendingBanner}>
            <div>
              <div style={styles.pendingTitle}>Payout in review</div>
              <div style={styles.pendingSub}>
                You have a pending request for{" "}
                <span style={{ fontWeight: 850 }}>
                  {Number(pendingPayout.amount || 0).toFixed(2)} ETB
                </span>
                . Please wait or contact support.
              </div>
            </div>
            <button
              type="button"
              onClick={() => nav("/support")}
              style={styles.pendingBtn}
            >
              Support
            </button>
          </div>
        )}

        {/* Withdraw card */}
        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.cardTitle}>Request payout</div>
            <div style={styles.pill}>
              Min {MIN_WITHDRAW} ETB
              {DAILY_MAX_WITHDRAW > 0 ? ` • Daily max ${DAILY_MAX_WITHDRAW} ETB` : ""}
            </div>
          </div>

          {!donationEnabled && (
            <div style={styles.alert}>
              <div style={styles.alertTitle}>Account not active</div>
              <div style={styles.alertBody}>
                Donations are OFF. Turn it ON in dashboard or contact support.
              </div>
            </div>
          )}

          {!isVerified && (
            <div style={styles.alert}>
              <div style={styles.alertTitle}>Not verified</div>
              <div style={styles.alertBody}>
                Your account is not verified yet. Please verify in stetting or Contact support to verify.
              </div>
            </div>
          )}

          {/* Breakdown */}
          <div style={styles.breakdown}>
            <Row label="Total revenue" value={`${Number(totalRaised || 0).toFixed(2)} ETB`} />
            <Row label="Commission (10%)" value={`- ${commission.toFixed(2)} ETB`} />
            <Divider />
            <Row label="Available balance" value={`${availableBalance.toFixed(2)} ETB`} strong />
            <Row label="Remaining after this request" value={`${remainingAfter.toFixed(2)} ETB`} />
          </div>

          {/* Big withdraw warning */}
          {showBigWithdrawWarning && !amountError && (
            <div style={styles.warnBanner}>
              You’re requesting a large amount (≥ 80% of your available balance).
              Double-check your bank info.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 14, opacity: formLocked ? 0.6 : 1 }}>
            {/* Amount */}
            <div style={styles.field}>
              <label style={styles.label}>Amount</label>
              <div style={styles.inputWrap}>
                <input
                  disabled={formLocked}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${MIN_WITHDRAW} • Up to ${availableBalance.toFixed(2)} ETB`}
                  inputMode="decimal"
                  style={{
                    ...styles.input,
                    paddingRight: 52,
                    ...(amountError ? styles.inputError : {}),
                    ...(amountMasked ? { WebkitTextSecurity: "disc" } : {}),
                  }}
                  onFocus={() => setAmountMasked(true)}
                />
                <button
                  type="button"
                  disabled={formLocked}
                  style={{
                    ...styles.smallEyeBtn,
                    ...(formLocked ? { cursor: "not-allowed", opacity: 0.6 } : {}),
                  }}
                  onClick={() => setAmountMasked((v) => !v)}
                >
                  {amountMasked ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              {!!amountError && <div style={styles.errorText}>{amountError}</div>}
            </div>

            {/* Bank info */}
            <div style={styles.innerBox}>
              <div style={styles.innerTitle}>
                Withdrawal bank info{" "}
                <span style={styles.savedHint}>• Auto-saved</span>
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Account bank name</label>
                  <select
                    disabled={formLocked}
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    style={styles.select}
                  >
                    <option value="CBE">CBE</option>
                    <option value="Telebirr">Telebirr</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    {method === "Telebirr" ? "Telebirr number" : "Bank account number"}
                  </label>
                  <input
                    disabled={formLocked}
                    value={bankNumber}
                    onChange={(e) =>
                      setBankNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 24))
                    }
                    placeholder={method === "Telebirr" ? "09XXXXXXXX" : "Your account number"}
                    inputMode="numeric"
                    style={{
                      ...styles.input,
                      ...(bankNumberError ? styles.inputError : {}),
                    }}
                  />
                  {!!bankNumberError && <div style={styles.errorText}>{bankNumberError}</div>}
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Account holder name</label>
                <input
                  disabled={formLocked}
                  value={bankUserName}
                  onChange={(e) => setBankUserName(e.target.value)}
                  placeholder="Full name on the account"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                disabled={formLocked}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                type="password"
                style={styles.input}
              />
              <div style={styles.hint}>We verify your password before creating a payout request.</div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                ...styles.primaryBtn,
                ...(canSubmit ? null : styles.primaryBtnDisabled),
              }}
            >
              {submitting ? "Requesting..." : pendingPayout ? "Pending request" : "Request payout"}
            </button>
          </form>
        </div>

        {/* Recent payout requests card */}
        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.cardTitle}>Recent payout requests</div>
            <button type="button" onClick={() => nav("/support")} style={styles.linkBtn}>
              Need help?
            </button>
          </div>

          {payouts.length === 0 ? (
            <div style={styles.emptyState}>
              No payout requests yet.
              <div style={styles.emptyHint}>Your latest requests will show here.</div>
            </div>
          ) : (
            <div style={styles.payoutList}>
              {payouts.map((p) => {
                const status = String(p.status || "pending").toLowerCase();
                const badge = statusBadge(status);
                return (
                  <div key={p.id} style={styles.payoutRow}>
                    <div>
                      <div style={styles.payoutAmount}>
                        {Number(p.amount || 0).toFixed(2)} ETB
                      </div>
                      <div style={styles.payoutSub}>
                        {p.method || "—"} • {maskBank(p.bankNumber)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ ...styles.badge, ...badge.style }}>{badge.label}</div>
                      <div style={styles.payoutDate}>{formatDate(p.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.footerNote}>
Powered by Chapa Co
        </div>
      </div>

      {/* Modal with Support + Done inside */}
      {modalOpen && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true">
          <div style={styles.modalCard}>
            <div
              style={{
                ...styles.modalIconWrap,
                ...(modalType === "success" ? styles.iconWrapSuccess : styles.iconWrapError),
              }}
            >
              {modalType === "success" ? <CheckCircleIcon /> : <XCircleIcon />}
            </div>

            <div style={styles.modalTitle}>{modalTitle}</div>

            {modalType === "success" ? (
              <>
                <div style={styles.modalMsg}>{modalMessage}</div>
                <div style={styles.amountGreen}>{requestedAmount.toFixed(2)} ETB</div>

                <ul style={styles.bullets}>
                  <li>We will try to contact you on Telegram or email.</li>
                  <li>Please keep your bank details correct to avoid delays.</li>
                </ul>
              </>
            ) : (
              <div style={styles.modalMsg}>{modalMessage}</div>
            )}

            <div style={styles.modalButtons}>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  nav("/support");
                }}
                style={styles.modalSupportBtn}
              >
                Support
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={styles.modalDoneBtn}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function Row({ label, value, strong }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLabel}>{label}</div>
      <div style={{ ...styles.rowValue, ...(strong ? styles.rowValueStrong : {}) }}>
        {value}
      </div>
    </div>
  );
}
function Divider() {
  return <div style={styles.divider} />;
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
    return {
      label: "Paid",
      style: {
        background: "rgba(52,199,89,.18)",
        borderColor: "rgba(52,199,89,.35)",
        color: "rgba(52,199,89,.95)",
      },
    };
  if (status === "approved" || status === "processing")
    return {
      label: "Processing",
      style: {
        background: "rgba(10,132,255,.18)",
        borderColor: "rgba(10,132,255,.35)",
        color: "rgba(10,132,255,.95)",
      },
    };
  if (status === "rejected" || status === "failed")
    return {
      label: "Rejected",
      style: {
        background: "rgba(255,69,58,.16)",
        borderColor: "rgba(255,69,58,.35)",
        color: "rgba(255,69,58,.95)",
      },
    };
  return {
    label: "Pending",
    style: {
      background: "rgba(255,214,10,.16)",
      borderColor: "rgba(255,214,10,.28)",
      color: "rgba(255,214,10,.95)",
    },
  };
}

/* ---------- icons ---------- */

function XCircleIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M5.2 5.2l5.6 5.6M10.8 5.2L5.2 10.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M4.6 8.2l2.1 2.1 4.7-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
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
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
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

/* ---------- styles ---------- */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 500px at 20% 0%, rgba(0,122,255,.16), transparent 60%), radial-gradient(900px 450px at 80% 10%, rgba(88,86,214,.14), transparent 55%), #0b0b0f",
    color: "rgba(255,255,255,.92)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: "18px 14px 26px",
  },
  container: {
    width: "100%",
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    paddingTop: 10,
  },

  topCard: {
    borderRadius: 22,
    padding: 18,
    background:
      "linear-gradient(135deg, rgba(10,132,255,.95), rgba(88,86,214,.82))",
    boxShadow: "0 18px 50px rgba(0,0,0,.35)",
    border: "1px solid rgba(255,255,255,.16)",
  },
  topRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  topLabel: { fontSize: 13, opacity: 0.92 },
  topBalance: { fontSize: 34, fontWeight: 760, marginTop: 6 },
  subText: {
    marginTop: 10,
    fontSize: 13,
    opacity: 0.9,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  userName: { fontWeight: 650 },
  dot: { opacity: 0.8 },
  eyeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.22)",
    background: "rgba(0,0,0,.12)",
    color: "rgba(255,255,255,.95)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },

  pendingBanner: {
    borderRadius: 20,
    padding: 14,
    background: "rgba(255,214,10,.12)",
    border: "1px solid rgba(255,214,10,.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  pendingTitle: { fontWeight: 850 },
  pendingSub: { marginTop: 4, fontSize: 13, opacity: 0.9, lineHeight: 1.35 },
  pendingBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(0,0,0,.16)",
    color: "rgba(255,255,255,.92)",
    cursor: "pointer",
    fontWeight: 750,
  },

  card: {
    borderRadius: 22,
    padding: 18,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.12)",
    boxShadow: "0 18px 50px rgba(0,0,0,.28)",
    backdropFilter: "blur(14px)",
  },
  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  cardTitle: { fontSize: 18, fontWeight: 750 },
  pill: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.18)",
    opacity: 0.9,
  },

  alert: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,149,0,.10)",
    border: "1px solid rgba(255,149,0,.22)",
  },
  alertTitle: { fontWeight: 750, marginBottom: 6 },
  alertBody: { opacity: 0.92, fontSize: 13, lineHeight: 1.45 },

  breakdown: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.10)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "7px 0",
  },
  rowLabel: { fontSize: 13, opacity: 0.85 },
  rowValue: { fontSize: 13, opacity: 0.95 },
  rowValueStrong: { fontWeight: 900 },
  divider: { height: 1, background: "rgba(255,255,255,.10)", margin: "8px 0" },

  warnBanner: {
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    background: "rgba(255,149,0,.10)",
    border: "1px solid rgba(255,149,0,.18)",
    fontSize: 13,
    opacity: 0.92,
  },

  field: { marginTop: 14, display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, opacity: 0.9 },

  inputWrap: { position: "relative" },
  input: {
    height: 46,
    width: "100%",
    borderRadius: 14,
    padding: "0 14px",
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(0,0,0,.18)",
    color: "rgba(255,255,255,.92)",
    outline: "none",
  },
  select: {
    height: 46,
    borderRadius: 14,
    padding: "0 14px",
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(0,0,0,.18)",
    color: "rgba(255,255,255,.92)",
    outline: "none",
  },
  smallEyeBtn: {
    position: "absolute",
    right: 8,
    top: 7,
    width: 34,
    height: 32,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    color: "rgba(255,255,255,.92)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  inputError: { border: "1px solid rgba(255,69,58,.55)" },
  errorText: { fontSize: 12, color: "rgba(255,69,58,.95)" },
  hint: { fontSize: 12, opacity: 0.72, lineHeight: 1.4 },

  innerBox: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.10)",
  },
  innerTitle: { fontSize: 13, fontWeight: 750, opacity: 0.92 },
  savedHint: { fontSize: 12, opacity: 0.65, fontWeight: 650 },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 10,
  },

  primaryBtn: {
    marginTop: 16,
    height: 48,
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(255,255,255,.92)",
    color: "rgba(0,0,0,.9)",
    fontWeight: 850,
    cursor: "pointer",
  },
  primaryBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },

  linkBtn: {
    height: 36,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    color: "rgba(255,255,255,.92)",
    cursor: "pointer",
    fontWeight: 650,
  },

  payoutList: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 },
  payoutRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.16)",
  },
  payoutAmount: { fontSize: 15, fontWeight: 850 },
  payoutSub: { fontSize: 12, opacity: 0.75 },
  payoutDate: { fontSize: 12, opacity: 0.7 },
  badge: {
    fontSize: 12,
    fontWeight: 850,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    display: "inline-block",
  },

  emptyState: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    border: "1px dashed rgba(255,255,255,.14)",
    background: "rgba(0,0,0,.14)",
    opacity: 0.9,
  },
  emptyHint: { marginTop: 6, fontSize: 12, opacity: 0.7 },

  footerNote: { fontSize: 12, opacity: 0.7, padding: "6px 6px 0" },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 50,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 22,
    background: "rgba(24,24,28,.92)",
    border: "1px solid rgba(255,255,255,.14)",
    boxShadow: "0 28px 80px rgba(0,0,0,.55)",
    padding: 18,
    backdropFilter: "blur(14px)",
    color: "rgba(255,255,255,.92)",
    textAlign: "center",
  },
  modalIconWrap: {
    width: 74,
    height: 74,
    margin: "2px auto 10px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    display: "grid",
    placeItems: "center",
  },
  iconWrapSuccess: { color: "rgba(52,199,89,.95)" },
  iconWrapError: { color: "rgba(255,69,58,.95)" },

  modalTitle: { fontSize: 18, fontWeight: 900, marginTop: 4 },
  modalMsg: { marginTop: 8, opacity: 0.85, lineHeight: 1.45 },
  amountGreen: { marginTop: 12, fontSize: 22, fontWeight: 900, color: "rgba(52,199,89,.95)" },

  bullets: {
    margin: "12px auto 0",
    textAlign: "left",
    maxWidth: 360,
    opacity: 0.9,
    lineHeight: 1.5,
    fontSize: 13,
  },

  modalButtons: { marginTop: 16, display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" },
  modalSupportBtn: { flex: "1 1 160px", height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,.14)", background: "transparent", color: "rgba(255,255,255,.92)", cursor: "pointer" },
  modalDoneBtn: { flex: "1 1 160px", height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.10)", color: "rgba(255,255,255,.92)", cursor: "pointer", fontWeight: 850 },
};

// Responsive
if (typeof window !== "undefined") {
  const mq = window.matchMedia?.("(max-width: 680px)");
  if (mq?.matches) styles.grid2.gridTemplateColumns = "repeat(1, minmax(0, 1fr))";
}