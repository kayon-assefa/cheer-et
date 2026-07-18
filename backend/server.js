import express from "express";
import axios from "axios";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(express.json());
app.use(cors());

/**
 * FIREBASE INIT
 */
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .trim();

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();
const CHAPA_SECRET = process.env.CHAPA_SECRET;

// ====================== DONATION ROUTES (Your existing code) ======================
app.get("/", (req, res) => res.send("Cheer ET Backend is running 🚀"));

app.post("/api/donate", async (req, res) => {
  // ... your existing donation code (unchanged) ...
  try {
    const { amount, donorName, message, creatorUsername, streamerId } = req.body;

    if (!amount || amount < 100 || !donorName || !streamerId) {
      return res.status(400).json({ error: "Minimum 100 ETB and name required" });
    }

    const tx_ref = `CHEER-${Date.now()}`;

    await db.collection("donations").doc(tx_ref).set({
      amount: Number(amount),
      donorName: donorName.trim(),
      message: message || "",
      creatorUsername,
      streamerId,
      paymentStatus: "pending",
      tx_ref,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const chapaPayload = {
      amount: Number(amount),
      currency: "ETB",
      email: "cheeret67@gmail.com",
      first_name: donorName.split(" ")[0] || "Cheer",
      last_name: "Donor",
      tx_ref: tx_ref,
      title: `Cheer @${creatorUsername}`,
      description: message || "Thank you!",
      callback_url: "https://cheerapi.onrender.com/api/chapa/verify",
      return_url: "https://cheer-et.web.app/payment-success",
    };

    const chapaResponse = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      chapaPayload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(chapaResponse.data);
  } catch (err) {
    console.error("DONATE ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Donation failed", chapaError: err.response?.data });
  }
});

app.get("/api/chapa/verify", async (req, res) => {
  // ... your existing verify code (unchanged) ...
  try {
    const { trx_ref } = req.query;
    if (!trx_ref) return res.status(400).send("Missing trx_ref");

    const verify = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${trx_ref}`,
      { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } }
    );

    const data = verify.data.data;
    if (data.status !== "success") return res.send("Payment failed");

    const docRef = db.collection("donations").doc(trx_ref);
    const snap = await docRef.get();

    if (!snap.exists) return res.status(404).send("Donation not found");

    const donation = snap.data();
    if (donation.paymentStatus === "completed") return res.send("Already processed");

    await docRef.update({ paymentStatus: "completed", paidAt: admin.firestore.FieldValue.serverTimestamp() });

    await db.collection("users").doc(donation.streamerId).set({
      balance: admin.firestore.FieldValue.increment(Number(donation.amount)),
    }, { merge: true });

    res.send("Payment completed successfully");
  } catch (err) {
    console.error("VERIFY ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

// ====================== NEW: PREMIUM ROUTES ======================

app.post("/api/premium/create", async (req, res) => {
  try {
    const { userId, email, amount = 500, first_name = "User" } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "userId and email are required" });
    }

    const tx_ref = `PREMIUM-${userId}-${Date.now()}`;

    const chapaPayload = {
      amount: Number(amount),
      currency: "ETB",
      email: email,
      first_name: first_name,
      tx_ref: tx_ref,
      title: "Cheer ET Premium Subscription",
      description: "30 Days Premium Access",
      callback_url: `${process.env.BACKEND_URL}/api/premium/verify?tx_ref=${tx_ref}`,
      return_url: `${process.env.FRONTEND_URL}/premium/success`,
    };

    const chapaResponse = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      chapaPayload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Save pending payment
    await db.collection("premiumPayments").doc(tx_ref).set({
      userId,
      tx_ref,
      amount: Number(amount),
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json(chapaResponse.data);
  } catch (err) {
    console.error("PREMIUM CREATE ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create premium payment" });
  }
});

app.get("/api/premium/verify", async (req, res) => {
  try {
    const { tx_ref } = req.query;
    if (!tx_ref) return res.status(400).send("Missing tx_ref");

    const verify = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } }
    );

    const data = verify.data.data;

    if (data.status === "success") {
      // Update payment
      await db.collection("premiumPayments").doc(tx_ref).update({
        status: "completed",
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Get userId from payment record
      const paymentSnap = await db.collection("premiumPayments").doc(tx_ref).get();
      const payment = paymentSnap.data();

      if (payment?.userId) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await db.collection("users").doc(payment.userId).update({
          premium: true,
          premiumPlan: "monthly",
          premiumStartedAt: new Date(),
          premiumExpiresAt: expiryDate
        });
      }

      return res.redirect(`${process.env.FRONTEND_URL}/premium/success?tx_ref=${tx_ref}`);
    }

    res.send("Payment verification failed");
  } catch (err) {
    console.error("PREMIUM VERIFY ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});