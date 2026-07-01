import express from "express";
import axios from "axios";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(express.json());
app.use(cors());

/**
 * =========================
 * FIREBASE INIT (FIXED)
 * =========================
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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

/**
 * =========================
 * CREATE DONATION
 * =========================
 */
app.post("/api/create-payment", async (req, res) => {
    console.log("POST RECEIVED");
  console.log(req.body);
  try {
    const {
      amount,
      donorName,
      message,
      creatorUsername,
      streamerId,
      email
    } = req.body;

    const tx_ref = `CHEER-${Date.now()}`;

    // Save donation
    await db.collection("donations").doc(tx_ref).set({
      amount,
      donorName,
      message: message || "",
      creatorUsername,
      streamerId,
      paymentStatus: "pending",
      tx_ref,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send to Chapa
    const chapa = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount,
        currency: "ETB",
        email: email || "test@example.com",
        tx_ref,
        callback_url: "https://cheerapi.onrender.com/api/chapa/verify",
        return_url: "https://your-frontend.com/success",
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET}`,
        },
      }
    );

    console.log("CHAPA INIT SUCCESS:", tx_ref);

   res.json({
  checkout_url: chapa.data.data.checkout_url,
});
app.get("/", (req, res) => {
  res.send("Cheer ET API is running");
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Donation failed" });
  }
});

/**
 * =========================
 * VERIFY PAYMENT (MAIN FIX)
 * =========================
 */
app.get("/api/chapa/verify", async (req, res) => {
  try {
    const { trx_ref } = req.query;

    console.log("VERIFY START:", trx_ref);

    const verify = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${trx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET}`,
        },
      }
    );

    const data = verify.data.data;

    console.log("CHAPA STATUS:", data.status);

    if (data.status !== "success") {
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

    console.log("UPDATING FIRESTORE...");

    // UPDATE DONATION
    await docRef.update({
      paymentStatus: "completed",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // UPDATE USER BALANCE
    await db.collection("users").doc(donation.streamerId).set(
      {
        balance: admin.firestore.FieldValue.increment(Number(donation.amount)),
      },
      { merge: true }
    );

    console.log("DONE SUCCESS");

    res.send("Payment completed successfully");

  } catch (err) {
    console.error("VERIFY ERROR:", err.message);
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
  console.log("Server running on port", PORT);
});
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log(
  "PRIVATE KEY EXISTS:",
  !!process.env.FIREBASE_PRIVATE_KEY
);
console.log(
  "PRIVATE KEY START:",
  process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30)
);