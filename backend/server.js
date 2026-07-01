import express from "express";
import axios from "axios";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Load service account
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// Firebase Init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const CHAPA_SECRET = process.env.CHAPA_SECRET;

app.get("/", (req, res) => {
  res.send("Cheer ET Backend is running 🚀");
});

app.post("/api/donate", async (req, res) => {
  try {
    const { amount, donorName, message, creatorUsername, streamerId, email } = req.body;

    if (!amount || !donorName || !streamerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tx_ref = `CHEER-${Date.now()}`;

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

    const chapaResponse = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount: Number(amount),
        currency: "ETB",
        email: email || "donor@cheeret.com",
        tx_ref,
        callback_url: "https://cheerapi.onrender.com/api/chapa/verify",
        return_url: "https://your-frontend.com/success",
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
    console.error("DONATE ERROR:", err.message);
    res.status(500).json({ error: "Donation failed", details: err.message });
  }
});

app.get("/api/chapa/verify", async (req, res) => {
  try {
    const { trx_ref } = req.query;
    if (!trx_ref) return res.status(400).send("Missing trx_ref");

    console.log("🔄 VERIFY START:", trx_ref);

    const verify = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${trx_ref}`,
      { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } }
    );

    const data = verify.data.data;

    if (data.status !== "success") {
      return res.send("Payment failed");
    }

    const docRef = db.collection("donations").doc(trx_ref);
    const snap = await docRef.get();

    if (!snap.exists) return res.status(404).send("Donation not found");

    const donation = snap.data();

    if (donation.paymentStatus === "completed") return res.send("Already processed");

    await docRef.update({
      paymentStatus: "completed",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("users").doc(donation.streamerId).set({
      balance: admin.firestore.FieldValue.increment(Number(donation.amount)),
    }, { merge: true });

    console.log("✅ Payment Completed:", trx_ref);
    res.send("Payment completed successfully");

  } catch (err) {
    console.error("VERIFY ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Cheer ET Server running on port ${PORT}`);
  console.log("✅ Firebase initialized using serviceAccountKey.json");
});