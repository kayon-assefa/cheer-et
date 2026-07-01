import express from "express";
import axios from "axios";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(express.json());
app.use(cors());

/**
 * =========================
 * FIREBASE INIT (Fixed for Render)
 * =========================
 */
if (!admin.apps.length) {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  const privateKey = rawKey
    .replace(/\\n/g, '\n')
    .replace(/"/g, '')
    .trim();

  console.log("🔑 Private Key Length:", privateKey.length);
  console.log("🔑 Private Key Starts:", privateKey.substring(0, 60) + "...");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

/**
 * =========================
 * CHAPA SECRET
 * =========================
 */
const CHAPA_SECRET = process.env.CHAPA_SECRET;

if (!CHAPA_SECRET) {
  console.error("❌ CHAPA_SECRET is not set!");
}

/**
 * =========================
 * ROOT ROUTE
 * =========================
 */
app.get("/", (req, res) => {
  res.send("Cheer ET Backend is running 🚀");
});

/**
 * =========================
 * CREATE DONATION
 * =========================
 */
app.post("/api/donate", async (req, res) => {
  try {
    const {
      amount,
      donorName,
      message,
      creatorUsername,
      streamerId,
      email
    } = req.body;

    if (!amount || !donorName || !streamerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tx_ref = `CHEER-${Date.now()}`;

    // Save pending donation
    await db.collection("donations").doc(tx_ref).set({
      amount: Number(amount),
      donorName,
      message: message || "",
      creatorUsername,
      streamerId,
      paymentStatus: "pending",
      tx_ref,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Initialize Chapa Payment
    const chapaResponse = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount: Number(amount),
        currency: "ETB",
        email: email || "donor@cheeret.com",
        tx_ref,
        callback_url: "https://cheerapi.onrender.com/api/chapa/verify",
        return_url: "https://your-frontend-domain.com/success",
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Chapa Init Success:", tx_ref);
    res.json(chapaResponse.data);

  } catch (err) {
    console.error("DONATE ERROR:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "Donation failed",
      details: err.response?.data || err.message 
    });
  }
});

/**
 * =========================
 * VERIFY PAYMENT
 * =========================
 */
app.get("/api/chapa/verify", async (req, res) => {
  try {
    const { trx_ref } = req.query;
    if (!trx_ref) return res.status(400).send("Missing trx_ref");

    console.log("🔄 VERIFY START:", trx_ref);

    const verify = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${trx_ref}`,
      {
        headers: { Authorization: `Bearer ${CHAPA_SECRET}` },
      }
    );

    const data = verify.data.data;

    if (data.status !== "success") {
      console.log("❌ Payment not successful:", data.status);
      return res.send("Payment failed");
    }

    const docRef = db.collection("donations").doc(trx_ref);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).send("Donation not found");
    }

    const donation = snap.data();

    if (donation.paymentStatus === "completed") {
      return res.send("Already processed");
    }

    // Update donation
    await docRef.update({
      paymentStatus: "completed",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user balance
    await db.collection("users").doc(donation.streamerId).set({
      balance: admin.firestore.FieldValue.increment(Number(donation.amount)),
    }, { merge: true });

    console.log("✅ Payment Completed:", trx_ref);
    res.send("Payment completed successfully");

  } catch (err) {
    console.error("VERIFY ERROR:", err.response?.data || err.message);
    res.status(500).send("Server error");
  }
});

/**
 * =========================
 * START SERVER
 * =========================
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Cheer ET Server running on port ${PORT}`);
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing");
  console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ Set" : "❌ Missing");
});