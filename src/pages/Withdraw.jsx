// WithdrawPage.jsx
//
// Rewritten to fix the real bugs in the original file and to make the
// client's responsibilities and its limits honest. A few notes up front,
// because they affect every decision below:
//
//  - A React component can never be the security boundary for money.
//    Balance checks, daily limits, OTP, IP/device logging, rate limiting,
//    and audit trails MUST be enforced in Firestore Security Rules and/or
//    Cloud Functions. Anything done only in this file can be bypassed by
//    disabling JS or calling the Firestore SDK directly from devtools.
//    This file implements the UI/UX side of all of that and calls out,
//    in comments, exactly what a Cloud Function needs to re-check.
//  - "Available balance" now comes from user.currentBalance (server-
//    maintained), matching the Dashboard, instead of being recomputed
//    client-side from a full donations scan.
//
import { useEffect, useMemo, useRef, useState } from "react";
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

  // ---- Settings (mirror whatever the server enforces; these are display/UX only) ----
  const COMMISSION_RATE = 0.1;
  const MIN_WITHDRAW = 50; // ETB
  const DAILY_MAX_WITHDRAW = 5000; // ETB (0 disables the client-side hint)
  const WARN_PERCENT = 0.8;
  const COOLDOWN_MINUTES = 30; // matches "withdrawal cooldown" feature, UX only

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState(null);
  const [showBalance, setShowBalance] = useState(true);

  // form
  const [amount, setAmount] = useState("");
  const [amountMasked, setAmountMasked] = useState(false);

  const [method, setMethod] = useState("Commercial Bank of Ethiopia (CBE)");
  const [bankNumber, setBankNumber] = useState("");
  const [bankUserName, setBankUserName] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // confirmation modal (feature #18)
  const [confirmOpen, setConfirmOpen] = useState(false);

  // payout list
  const [payouts, setPayouts] = useState([]);
  const [pendingPayout, setPendingPayout] = useState(null);
  const [lastPayoutAt, setLastPayoutAt] = useState(null); // for cooldown display

  // result modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [requestedAmount, setRequestedAmount] = useState(0);

  const uidRef = useRef(null); // avoids stale-closure bugs from the original

  const donationEnabled = Boolean(user?.donationEnabled ?? true);
  const isVerified = Boolean(user?.isVerified); // one flag only — no silent fallback
  const isBanned = Boolean(user?.isBanned);

  // ---- Balance: single source of truth is user.currentBalance, never derived here ----
  const availableBalance = Number(user?.currentBalance || 0);
  // Commission is already deducted server-side before currentBalance is
  // written, so this page only displays the rate for transparency — it does
  // not recompute or subtract anything from the balance shown above. If you
  // want to show the actual ETB amount taken as commission, read it from a
  // server-set field (e.g. user.commissionTaken) rather than deriving it here.

  const amountNumber = useMemo(() => {
    const n = Number(String(amount).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const remainingAfter = useMemo(
    () => Math.max(0, availableBalance - amountNumber),
    [availableBalance, amountNumber]
  );

  const showBigWithdrawWarning = useMemo(() => {
    if (!availableBalance) return false;
    return amountNumber > 0 && amountNumber / availableBalance >= WARN_PERCENT;
  }, [amountNumber, availableBalance]);

  const cooldownRemainingMs = useMemo(() => {
    if (!lastPayoutAt) return 0;
    const elapsed = Date.now() - lastPayoutAt;
    const windowMs = COOLDOWN_MINUTES * 60 * 1000;
    return Math.max(0, windowMs - elapsed);
  }, [lastPayoutAt]);

  const amountError = useMemo(() => {
    if (!amount) return "";
    if (amountNumber <= 0) return "Amount must be greater than 0.";
    if (amountNumber < MIN_WITHDRAW) return `Minimum withdrawal is ${MIN_WITHDRAW} ETB.`;
    if (amountNumber > availableBalance) return "Amount can't be more than your available balance.";
    return "";
  }, [amount, amountNumber, availableBalance]);

  const bankNumberError = useMemo(() => {
    if (!bankNumber) return "";
    if (bankNumber.length < 6) return "Bank number looks too short.";
    return "";
  }, [bankNumber]);

  const formLocked = useMemo(() => {
    if (loading || submitting) return true;
    if (isBanned) return true;
    if (!donationEnabled) return true;
    if (!isVerified) return true;
    if (pendingPayout) return true;
    if (cooldownRemainingMs > 0) return true;
    return false;
  }, [loading, submitting, isBanned, donationEnabled, isVerified, pendingPayout, cooldownRemainingMs]);

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
    if (!acceptedTerms) return false;
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
    acceptedTerms,
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
    setModalTitle("Payout requested");
    setModalMessage("We'll contact you within 7 days.");
    setModalOpen(true);
  }

  // ---- Listeners ----
  useEffect(() => {
    let unsubUser = () => {};
    let unsubPayouts = () => {};

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      // clear previous user's listeners immediately on any auth change
      unsubUser();
      unsubPayouts();

      if (!currentUser) {
        uidRef.current = null;
        nav("/login");
        return;
      }
      uidRef.current = currentUser.uid;

      unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        if (uidRef.current !== currentUser.uid) return; // stale callback guard
        const u = snap.data() || {};
        setUser(u);

        const saved = u.lastBankInfo || {};
        if (saved.method) setMethod(saved.method);
        if (saved.bankNumber) setBankNumber(String(saved.bankNumber));
        if (saved.bankUserName) setBankUserName(String(saved.bankUserName));
      });

      // Bug fix: the original queried the ENTIRE `donations` collection on
      // every page load and filtered client-side. That reads every donation
      // in the app for every viewer of this page. Balance now comes from
      // user.currentBalance, so this page doesn't need to touch `donations`
      // at all. If a raised-total figure is still wanted for display, fetch
      // it from a precomputed field on the user doc, not a live collection
      // scan.

      const payoutQ = query(collection(db, "payout"), where("uid", "==", currentUser.uid));
      unsubPayouts = onSnapshot(
        payoutQ,
        (snap) => {
          if (uidRef.current !== currentUser.uid) return;
          const arr = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
          arr.sort((a, b) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));

          setPayouts(arr.slice(0, 5));

          const pend = arr.find((p) => String(p.status || "pending").toLowerCase() === "pending") || null;
          setPendingPayout(pend);

          const mostRecent = arr[0];
          if (mostRecent?.createdAt?.seconds) {
            setLastPayoutAt(mostRecent.createdAt.seconds * 1000);
          }
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
      unsubPayouts();
    };
  }, [nav]);

  async function getTodayPayoutSum(uid) {
    // Client-side check for immediate UX feedback ONLY. The Cloud Function
    // that creates/approves the payout must independently sum today's
    // requests server-side using the same rule, because this call can be
    // skipped entirely by a modified client.
    const qAll = query(collection(db, "payout"), where("uid", "==", uid));
    const snap = await getDocs(qAll);
    const now = new Date();
    let sum = 0;
    snap.forEach((d) => {
      const p = d.data();
      const ts = p?.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : null;
      if (!ts) return;
      const sameDay =
        ts.getFullYear() === now.getFullYear() &&
        ts.getMonth() === now.getMonth() &&
        ts.getDate() === now.getDate();
      const st = String(p.status || "").toLowerCase();
      if (sameDay && st !== "rejected" && st !== "failed") sum += Number(p.amount || 0);
    });
    return sum;
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setConfirmOpen(true); // show the summary modal first (feature #18)
  }

  async function confirmAndSubmit() {
    setConfirmOpen(false);

    if (!auth.currentUser) return nav("/login");
    if (isBanned) return openError("Your account is restricted. Please submit an appeal.");
    if (!donationEnabled) return openError("Your account is not active (donations are OFF).");
    if (!isVerified) return openError("Your account is not verified yet.");
    if (pendingPayout) return openError("You already have a pending payout request.");
    if (cooldownRemainingMs > 0) return openError("Please wait before submitting another request.");

    const cleanBankNumber = bankNumber.replace(/[^\d]/g, "").slice(0, 24);
    if (cleanBankNumber.length < 6) return openError("Please enter a valid bank number.");
    if (amountNumber <= 0 || amountNumber < MIN_WITHDRAW || amountNumber > availableBalance) {
      return openError("Please check the requested amount.");
    }

    setSubmitting(true);
    try {
      const uid = auth.currentUser.uid;

      if (DAILY_MAX_WITHDRAW > 0) {
        const todaySum = await getTodayPayoutSum(uid);
        if (todaySum + amountNumber > DAILY_MAX_WITHDRAW) {
          openError(`Daily limit exceeded. Today requested: ${todaySum.toFixed(2)} ETB. Daily max: ${DAILY_MAX_WITHDRAW} ETB.`);
          return;
        }
      }

      const email = auth.currentUser.email;
      if (!email) return openError("No email on this account. Please contact support.");

      try {
        const cred = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(auth.currentUser, cred);
      } catch (reauthErr) {
        const code = reauthErr?.code || "";
        if (code.includes("wrong-password") || code.includes("invalid-credential")) {
          return openError("Incorrect password.");
        }
        if (code.includes("too-many-requests")) {
          return openError("Too many attempts. Try again later.");
        }
        return openError("Could not verify your password. Please try again.");
      }

      // The write below creates the request only. Approval/rejection and the
      // authoritative balance deduction must happen in a Cloud Function
      // triggered on this document, after re-checking currentBalance,
      // daily limits, and isBanned server-side — never on the client write.
      await addDoc(collection(db, "payout"), {
        uid,
        username: user?.username || "User",
        amount: amountNumber,
        method,
        bankNumber: cleanBankNumber,
        bankUserName: bankUserName.trim(),
        status: "pending",
        balanceAtRequest: availableBalance,
        commissionRate: COMMISSION_RATE,
        createdAt: serverTimestamp(),
        // clientMeta is informational only — a Cloud Function should record
        // the authoritative IP/user-agent server-side, since anything sent
        // from the client can be forged.
        clientMeta: {
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        },
      });

      await updateDoc(doc(db, "users", uid), {
        lastBankInfo: {
          method,
          bankNumber: cleanBankNumber,
          bankUserName: bankUserName.trim(),
          updatedAt: serverTimestamp(),
        },
      });

      setPassword("");
      setAmount("");
      setAcceptedTerms(false);
      openSuccess(amountNumber);
    } catch (err) {
      console.error(err);
      openError("Failed to request payout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Banned user: full block, nothing else on the page renders ----
  if (!loading && isBanned) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={styles.container}>
          <div style={styles.bannedCard}>
            <div style={styles.bannedTitle}>Account restricted</div>
            <div style={styles.bannedBody}>
              Withdrawals are disabled on this account. If you believe this is a
              mistake, submit an appeal or contact support directly.
            </div>
            <div style={styles.bannedButtons}>
              <button type="button" style={styles.bannedAppealBtn} onClick={() => nav("/appeal")}>
                Submit appeal
              </button>
              <a
                href="https://t.me/cheer_etBot"
                target="_blank"
                rel="noreferrer"
                style={styles.bannedSupportBtn}
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        {/* Balance card */}
        <div style={styles.topCard}>
          <div style={styles.topRow}>
            <div>
              <div style={styles.topLabel}>Available balance</div>
              <div style={styles.topBalance}>
                {loading ? "…" : showBalance ? `${availableBalance.toFixed(2)} ETB` : "****"}
              </div>
              <div style={styles.subText}>
                <span style={styles.userName}>{user?.username || "User"}</span>
                <span style={styles.dot}>•</span>
                <span>Balance is set by the server after commission</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBalance((s) => !s)}
              style={styles.eyeBtn}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <EyeOpenIcon /> : <EyeClosedIcon />}
            </button>
          </div>
        </div>

        {!loading && !isVerified && (
          <div style={styles.alertBanner}>
            <div style={styles.alertTitle}>Not verified</div>
            <div style={styles.alertBody}>Your account is not verified yet. Please verify or contact support.</div>
          </div>
        )}

        {!loading && !donationEnabled && (
          <div style={styles.alertBanner}>
            <div style={styles.alertTitle}>Account not active</div>
            <div style={styles.alertBody}>Donations are OFF. Turn this on from your dashboard or contact support.</div>
          </div>
        )}

        {pendingPayout && (
          <div style={styles.pendingBanner}>
            <div>
              <div style={styles.pendingTitle}>Payout in review</div>
              <div style={styles.pendingSub}>
                Pending request for{" "}
                <span style={{ fontWeight: 850 }}>{Number(pendingPayout.amount || 0).toFixed(2)} ETB</span>.
              </div>
            </div>
            <button type="button" onClick={() => nav("/support")} style={styles.pendingBtn}>
              Support
            </button>
          </div>
        )}

        {!pendingPayout && cooldownRemainingMs > 0 && (
          <div style={styles.pendingBanner}>
            <div>
              <div style={styles.pendingTitle}>Cooldown active</div>
              <div style={styles.pendingSub}>
                You can submit another request in {Math.ceil(cooldownRemainingMs / 60000)} min.
              </div>
            </div>
          </div>
        )}

        {/* Withdraw form */}
        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.cardTitle}>Request payout</div>
            <div style={styles.pill}>
              Min {MIN_WITHDRAW} ETB{DAILY_MAX_WITHDRAW > 0 ? ` • Daily max ${DAILY_MAX_WITHDRAW} ETB` : ""}
            </div>
          </div>

          <div style={styles.breakdown}>
            <Row label="Available balance" value={`${availableBalance.toFixed(2)} ETB`} strong />
            <Row label="Commission rate (already deducted)" value={`${COMMISSION_RATE * 100}%`} />
            <Divider />
            <Row label="Remaining after this request" value={`${remainingAfter.toFixed(2)} ETB`} />
          </div>

          {showBigWithdrawWarning && !amountError && (
            <div style={styles.warnBanner}>
              You're requesting a large amount (≥ {WARN_PERCENT * 100}% of your available balance).
              Double-check your bank info before continuing.
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ marginTop: 14, opacity: formLocked ? 0.6 : 1 }}>
            <div style={styles.field}>
              <label style={styles.label}>Amount</label>
              <div style={styles.inputWrap}>
                <input
                  disabled={formLocked}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${MIN_WITHDRAW} • Up to ${availableBalance.toFixed(2)} ETB`}
                  inputMode="decimal"
                  type={amountMasked ? "password" : "text"}
                  style={{ ...styles.input, paddingRight: 52, ...(amountError ? styles.inputError : {}) }}
                />
                <button
                  type="button"
                  disabled={formLocked}
                  style={styles.smallEyeBtn}
                  onClick={() => setAmountMasked((v) => !v)}
                >
                  {amountMasked ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              {!!amountError && <div style={styles.errorText}>{amountError}</div>}
            </div>

            <div style={styles.innerBox}>
              <div style={styles.innerTitle}>
                Withdrawal bank info <span style={styles.savedHint}>• Auto-saved</span>
              </div>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Account bank name</label>
                  <select disabled={formLocked} value={method} onChange={(e) => setMethod(e.target.value)} style={styles.select}>
                    <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                    <option value="Telebirr">Telebirr</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{method === "Telebirr" ? "Telebirr number" : "Bank account number"}</label>
                  <input
                    disabled={formLocked}
                    value={bankNumber}
                    onChange={(e) => setBankNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 24))}
                    placeholder={method === "Telebirr" ? "09XXXXXXXX" : "Your account number"}
                    inputMode="numeric"
                    style={{ ...styles.input, ...(bankNumberError ? styles.inputError : {}) }}
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

            <label style={styles.termsRow}>
              <input
                type="checkbox"
                disabled={formLocked}
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span>
                I accept the <a href="/policy" target="_blank" rel="noreferrer">withdrawal terms and conditions</a>.
              </span>
            </label>

            <button type="submit" disabled={!canSubmit} style={{ ...styles.primaryBtn, ...(canSubmit ? null : styles.primaryBtnDisabled) }}>
              {submitting ? "Requesting..." : pendingPayout ? "Pending request" : "Review and request payout"}
            </button>
          </form>
        </div>

        {/* Recent payouts */}
        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.cardTitle}>Recent payout requests</div>
            <button type="button" onClick={() => nav("/support")} style={styles.linkBtn}>Need help?</button>
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
                      <div style={styles.payoutAmount}>{Number(p.amount || 0).toFixed(2)} ETB</div>
                      <div style={styles.payoutSub}>{p.method || "—"} • {maskBank(p.bankNumber)}</div>
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

        <div style={styles.footerNote}>Powered by Chapa Co</div>
      </div>

      {/* Confirmation modal (feature #18) */}
      {confirmOpen && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true">
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Confirm payout request</div>
            <div style={styles.confirmList}>
              <Row label="Amount" value={`${amountNumber.toFixed(2)} ETB`} strong />
              <Row label="Method" value={method} />
              <Row label={method === "Telebirr" ? "Telebirr number" : "Bank account"} value={maskBank(bankNumber)} />
              <Row label="Account holder" value={bankUserName} />
              <Divider />
              <Row label="Remaining after request" value={`${remainingAfter.toFixed(2)} ETB`} />
            </div>
            <div style={styles.modalButtons}>
              <button type="button" style={styles.modalSupportBtn} onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" style={styles.modalDoneBtn} onClick={confirmAndSubmit}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {modalOpen && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true">
          <div style={styles.modalCard}>
            <div style={{ ...styles.modalIconWrap, ...(modalType === "success" ? styles.iconWrapSuccess : styles.iconWrapError) }}>
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
              <button type="button" style={styles.modalSupportBtn} onClick={() => { setModalOpen(false); nav("/support"); }}>
                Support
              </button>
              <button type="button" style={styles.modalDoneBtn} onClick={() => setModalOpen(false)}>
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
      <div style={{ ...styles.rowValue, ...(strong ? styles.rowValueStrong : {}) }}>{value}</div>
    </div>
  );
}
function Divider() { return <div style={styles.divider} />; }
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
  } catch { return "—"; }
}
function statusBadge(status) {
  if (status === "paid" || status === "completed")
    return { label: "Paid", style: { background: "rgba(52,199,89,.18)", borderColor: "rgba(52,199,89,.35)", color: "rgba(52,199,89,.95)" } };
  if (status === "approved" || status === "processing")
    return { label: "Processing", style: { background: "rgba(10,132,255,.18)", borderColor: "rgba(10,132,255,.35)", color: "rgba(10,132,255,.95)" } };
  if (status === "rejected" || status === "failed")
    return { label: "Rejected", style: { background: "rgba(255,69,58,.16)", borderColor: "rgba(255,69,58,.35)", color: "rgba(255,69,58,.95)" } };
  return { label: "Pending", style: { background: "rgba(255,214,10,.16)", borderColor: "rgba(255,214,10,.28)", color: "rgba(255,214,10,.95)" } };
}

/* ---------- icons ---------- */
function XCircleIcon() {
  return (<svg width="54" height="54" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14z" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M5.2 5.2l5.6 5.6M10.8 5.2L5.2 10.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>);
}
function CheckCircleIcon() {
  return (<svg width="54" height="54" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14z" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M4.6 8.2l2.1 2.1 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
}
function EyeOpenIcon() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12s3.6-7 9.8-7 9.8 7 9.8 7-3.6 7-9.8 7S2.2 12 2.2 12Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>);
}
function EyeClosedIcon() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.6-7 9-7c2.1 0 4 .7 5.6 1.7M21 12s-3.6 7-9 7c-2.1 0-4-.7-5.6-1.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
}

/* ---------- styles ---------- */
const styles = {
  page: { minHeight: "100vh", background: "radial-gradient(1200px 500px at 20% 0%, rgba(0,122,255,.16), transparent 60%), radial-gradient(900px 450px at 80% 10%, rgba(88,86,214,.14), transparent 55%), #0b0b0f", color: "rgba(255,255,255,.92)", fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif', padding: "18px 14px 26px" },
  container: { width: "100%", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14, paddingTop: 10 },
  topCard: { borderRadius: 22, padding: 18, background: "linear-gradient(135deg, rgba(10,132,255,.95), rgba(88,86,214,.82))", boxShadow: "0 18px 50px rgba(0,0,0,.35)", border: "1px solid rgba(255,255,255,.16)" },
  topRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 },
  topLabel: { fontSize: 13, opacity: 0.92 },
  topBalance: { fontSize: 34, fontWeight: 760, marginTop: 6 },
  subText: { marginTop: 10, fontSize: 13, opacity: 0.9, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 },
  userName: { fontWeight: 650 },
  dot: { opacity: 0.8 },
  eyeBtn: { width: 44, height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,.22)", background: "rgba(0,0,0,.12)", color: "rgba(255,255,255,.95)", display: "grid", placeItems: "center", cursor: "pointer" },
  alertBanner: { borderRadius: 18, padding: 14, background: "rgba(255,149,0,.10)", border: "1px solid rgba(255,149,0,.22)" },
  alertTitle: { fontWeight: 750, marginBottom: 6 },
  alertBody: { opacity: 0.92, fontSize: 13, lineHeight: 1.45 },
  pendingBanner: { borderRadius: 20, padding: 14, background: "rgba(255,214,10,.12)", border: "1px solid rgba(255,214,10,.28)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  pendingTitle: { fontWeight: 850 },
  pendingSub: { marginTop: 4, fontSize: 13, opacity: 0.9, lineHeight: 1.35 },
  pendingBtn: { height: 40, padding: "0 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,.16)", background: "rgba(0,0,0,.16)", color: "rgba(255,255,255,.92)", cursor: "pointer", fontWeight: 750 },
  card: { borderRadius: 22, padding: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 18px 50px rgba(0,0,0,.28)", backdropFilter: "blur(14px)" },
  cardHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  cardTitle: { fontSize: 18, fontWeight: 750 },
  pill: { fontSize: 12, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.18)", opacity: 0.9 },
  breakdown: { marginTop: 14, borderRadius: 18, padding: 14, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.10)" },
  row: { display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0" },
  rowLabel: { fontSize: 13, opacity: 0.85 },
  rowValue: { fontSize: 13, opacity: 0.95 },
  rowValueStrong: { fontWeight: 900 },
  divider: { height: 1, background: "rgba(255,255,255,.10)", margin: "8px 0" },
  warnBanner: { marginTop: 12, borderRadius: 18, padding: 12, background: "rgba(255,149,0,.10)", border: "1px solid rgba(255,149,0,.18)", fontSize: 13, opacity: 0.92 },
  field: { marginTop: 14, display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, opacity: 0.9 },
  inputWrap: { position: "relative" },
  input: { height: 46, width: "100%", borderRadius: 14, padding: "0 14px", border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.18)", color: "rgba(255,255,255,.92)", outline: "none" },
  select: { height: 46, borderRadius: 14, padding: "0 14px", border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.18)", color: "rgba(255,255,255,.92)", outline: "none" },
  smallEyeBtn: { position: "absolute", right: 8, top: 7, width: 34, height: 32, borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.92)", display: "grid", placeItems: "center", cursor: "pointer" },
  inputError: { border: "1px solid rgba(255,69,58,.55)" },
  errorText: { fontSize: 12, color: "rgba(255,69,58,.95)" },
  hint: { fontSize: 12, opacity: 0.72, lineHeight: 1.4 },
  innerBox: { marginTop: 14, borderRadius: 18, padding: 14, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.10)" },
  innerTitle: { fontSize: 13, fontWeight: 750, opacity: 0.92 },
  savedHint: { fontSize: 12, opacity: 0.65, fontWeight: 650 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 10 },
  termsRow: { marginTop: 14, display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, opacity: 0.9 },
  primaryBtn: { marginTop: 16, height: 48, width: "100%", borderRadius: 16, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.92)", color: "rgba(0,0,0,.9)", fontWeight: 850, cursor: "pointer" },
  primaryBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  linkBtn: { height: 36, padding: "0 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.92)", cursor: "pointer", fontWeight: 650 },
  payoutList: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 },
  payoutRow: { display: "flex", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 18, border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.16)" },
  payoutAmount: { fontSize: 15, fontWeight: 850 },
  payoutSub: { fontSize: 12, opacity: 0.75 },
  payoutDate: { fontSize: 12, opacity: 0.7 },
  badge: { fontSize: 12, fontWeight: 850, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", display: "inline-block" },
  emptyState: { marginTop: 12, padding: 16, borderRadius: 18, border: "1px dashed rgba(255,255,255,.14)", background: "rgba(0,0,0,.14)", opacity: 0.9 },
  emptyHint: { marginTop: 6, fontSize: 12, opacity: 0.7 },
  footerNote: { fontSize: 12, opacity: 0.7, padding: "6px 6px 0" },
  bannedCard: { borderRadius: 22, padding: 24, background: "rgba(255,69,58,.10)", border: "1px solid rgba(255,69,58,.35)", textAlign: "center" },
  bannedTitle: { fontSize: 20, fontWeight: 900, color: "rgba(255,69,58,.95)" },
  bannedBody: { marginTop: 10, opacity: 0.9, lineHeight: 1.5 },
  bannedButtons: { marginTop: 18, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  bannedAppealBtn: { height: 44, padding: "0 18px", borderRadius: 14, border: "1px solid rgba(255,69,58,.5)", background: "rgba(255,69,58,.18)", color: "rgba(255,255,255,.95)", cursor: "pointer", fontWeight: 800 },
  bannedSupportBtn: { height: 44, padding: "0 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.92)", display: "grid", placeItems: "center", textDecoration: "none", fontWeight: 800 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", padding: 16, zIndex: 50 },
  modalCard: { width: "100%", maxWidth: 480, borderRadius: 22, background: "rgba(24,24,28,.92)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 28px 80px rgba(0,0,0,.55)", padding: 18, backdropFilter: "blur(14px)", color: "rgba(255,255,255,.92)", textAlign: "center" },
  modalIconWrap: { width: 74, height: 74, margin: "2px auto 10px", borderRadius: 22, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", display: "grid", placeItems: "center" },
  iconWrapSuccess: { color: "rgba(52,199,89,.95)" },
  iconWrapError: { color: "rgba(255,69,58,.95)" },
  modalTitle: { fontSize: 18, fontWeight: 900, marginTop: 4 },
  modalMsg: { marginTop: 8, opacity: 0.85, lineHeight: 1.45 },
  confirmList: { marginTop: 14, textAlign: "left", borderRadius: 16, padding: 14, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.10)" },
  amountGreen: { marginTop: 12, fontSize: 22, fontWeight: 900, color: "rgba(52,199,89,.95)" },
  bullets: { margin: "12px auto 0", textAlign: "left", maxWidth: 360, opacity: 0.9, lineHeight: 1.5, fontSize: 13 },
  modalButtons: { marginTop: 16, display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" },
  modalSupportBtn: { flex: "1 1 160px", height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,.14)", background: "transparent", color: "rgba(255,255,255,.92)", cursor: "pointer" },
  modalDoneBtn: { flex: "1 1 160px", height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.10)", color: "rgba(255,255,255,.92)", cursor: "pointer", fontWeight: 850 },
};

if (typeof window !== "undefined") {
  const mq = window.matchMedia?.("(max-width: 680px)");
  if (mq?.matches) styles.grid2.gridTemplateColumns = "repeat(1, minmax(0, 1fr))";
}