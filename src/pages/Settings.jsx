import { useEffect, useState } from "react";
import "../styles/settings.css";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateEmail,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { QRCode } from "react-qr-code";

import Navbar from "../components/Navbar";   // Your existing navbar

export default function Settings() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [reauthModal, setReauthModal] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notif, setNotif] = useState(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("en");

  const notify = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 2800);
    if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(msg);
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return (window.location.href = "/login");
      setUser(u);

      const unsubDoc = onSnapshot(doc(db, "users", u.uid), (snap) => {
        const d = snap.data() || {};
        setData(d);
        setForm({
          username: d.username || "",
          phone: d.phone || "",
          telegram: d.telegram || "",
          followers: d.followers || "",
          method: d.lastBankInfo?.method || "CBE",
          bankNumber: d.lastBankInfo?.bankNumber || "",
          bankUserName: d.lastBankInfo?.bankUserName || "",
        });
        setLoading(false);
      });

      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: form.username,
        phone: form.phone,
        telegram: form.telegram,
        followers: form.followers,
      });
      notify("Profile updated successfully");
      setEditModal(false);
    } catch {
      notify("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveBank = async () => {
    await updateDoc(doc(db, "users", user.uid), {
      lastBankInfo: {
        method: form.method,
        bankNumber: form.bankNumber,
        bankUserName: form.bankUserName,
      },
    });
    notify("Bank info saved");
  };

  const reauth = async () => {
    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail);
      notify("Email updated successfully");
      setReauthModal(false);
      setEmailModal(false);
    } catch {
      notify("Wrong password");
    }
  };

  const overlayLink = `https://cheer-et.web.app/${data.username || ""}/overlays`;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      <Navbar />

      <div className="page">
        <div className="container">

          {/* PROFILE PREVIEW */}
          <div className="section">
            <div className="card preview-card">
              <div className="preview">
                <img src={data.photoURL || ""} alt="Profile" />
                <div className="profile-info">
                  <div className="username">
                    {form.username}
                    {data.verified && <img src="/verified.png" className="verified small" alt="verified" />}
                  </div>
                  <div className="sub">{user?.email}</div>
                  <div className="sub">{form.phone || "No phone"}</div>
                  <div className="sub">Followers: {form.followers || "0"}</div>
                  <div className="sub">Platform: Cheer ET</div>
                </div>
              </div>
              <button className="btn edit-btn" onClick={() => setEditModal(true)}>
                Edit Profile
              </button>
            </div>
          </div>

          {/* ACCOUNT & EMAIL */}
          <div className="section">
            <h3>Account</h3>
            <div className="card">
              <div className="info-row">
                <strong>Email:</strong> {user?.email}
              </div>
              
              {!user?.emailVerified && (
                <button className="btn" onClick={() => sendEmailVerification(user).then(() => notify("Verification email sent"))}>
                  Verify Email
                </button>
              )}
              
              <button className="btn" onClick={() => setEmailModal(true)}>
                Change Email
              </button>
              
              <button className="btn" onClick={() => sendPasswordResetEmail(auth, user.email).then(() => notify("Password reset link sent"))}>
                Reset Password
              </button>
            </div>
          </div>

          {/* DONATION */}
          <div className="section">
            <h3>Minimum Donation Price</h3>
            <div className="card">
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={data.minDonation || 100}
                onChange={(e) => updateDoc(doc(db, "users", user.uid), { minDonation: Number(e.target.value) })}
              />
              <div className="donation-value">{data.minDonation || 100} ETB</div>
            </div>
          </div>

          {/* FOLLOWERS */}
          <div className="section">
            <h3>Followers</h3>
            <div className="card">
              <input
                value={form.followers || ""}
                onChange={(e) => setForm({ ...form, followers: e.target.value })}
                placeholder="e.g. 10K+"
              />
              <button className="btn" onClick={() => updateDoc(doc(db, "users", user.uid), { followers: form.followers })}>
                Update Followers
              </button>
            </div>
          </div>

          {/* BANK INFO */}
          <div className="section">
            <h3>Bank Information</h3>
            <div className="card">
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="CBE">CBE</option>
                <option value="Telebirr">Telebirr</option>
              </select>

              <input placeholder="Account Number" value={form.bankNumber} onChange={(e) => setForm({ ...form, bankNumber: e.target.value })} />
              <input placeholder="Account Name" value={form.bankUserName} onChange={(e) => setForm({ ...form, bankUserName: e.target.value })} />

              <button className="btn" onClick={saveBank}>Save Bank Info</button>
            </div>
          </div>

          {/* OVERLAY */}
          <div className="section">
            <h3>Overlay Link</h3>
            <div className="card">
              <div className="overlay">{overlayLink}</div>
              <div className="qr">
                <QRCode value={overlayLink} size={130} />
              </div>
              <button className="btn" onClick={() => { navigator.clipboard.writeText(overlayLink); notify("Link copied!"); }}>
                Copy Link
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editModal && (
        <div className="modal">
          <div className="modal-card">
            <h3>Edit Profile</h3>
            <label>Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />

            <label>Phone Number</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

            <label>Telegram</label>
            <input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />

        

            <label style={{ margin: "16px 0 8px" }}>
              <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
              Enable Notifications
            </label>

            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button className="btn" onClick={saveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button className="btn secondary-btn" onClick={() => setEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modals */}
      {emailModal && (
        <div className="modal">
          <div className="modal-card">
            <h3>Change Email</h3>
            <input placeholder="New Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <button className="btn" onClick={() => setReauthModal(true)}>Continue</button>
            <button className="btn secondary-btn" onClick={() => setEmailModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {reauthModal && (
        <div className="modal">
          <div className="modal-card">
            <h3>Confirm Password</h3>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn" onClick={reauth}>Confirm</button>
          </div>
        </div>
      )}

      {notif && <div className="toast">{notif}</div>}
    </>
  );
}