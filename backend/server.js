import express from "express";
import axios from "axios";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(express.json());
app.use(cors());

/**
 * FIREBASE INIT - Final Clean Version
 */
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .trim();

  console.log("🔑 Key Length:", privateKey ? privateKey.length : 0);
console.log("CHAPA KEY EXISTS:", !!process.env.CHAPA_SECRET);
console.log("CHAPA KEY PREFIX:", process.env.CHAPA_SECRET?.substring(0, 12));
console.log("CHAPA KEY LENGTH:", process.env.CHAPA_SECRET?.length);

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

app.get("/", (req, res) => res.send("Cheer ET Backend is running 🚀"));

app.post("/api/donate", async (req, res) => {
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
      email: "cheeret67@gmail.com",           // Fixed email
      first_name: donorName.split(" ")[0] || "Cheer",
      last_name: "Donor",
      tx_ref: tx_ref,
      title: `Cheer @${creatorUsername}`,
      description: message || "Thank you!",
      callback_url: "https://cheerapi.onrender.com/api/chapa/verify",
      return_url: "https://cheer-et.web.app/payment-success",
    };
console.log("CHAPA KEY EXISTS:", !!process.env.CHAPA_SECRET);
console.log("CHAPA KEY PREFIX:", process.env.CHAPA_SECRET?.substring(0, 12));
console.log("CHAPA KEY LENGTH:", process.env.CHAPA_SECRET?.length);
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

    console.log(" Chapa Success:", tx_ref);
    res.json(chapaResponse.data);

  } catch (err) {
    console.error("DONATE ERROR:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "Donation failed", 
      chapaError: err.response?.data 
    });
  }
});

app.get("/api/chapa/verify", async (req, res) => {
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

    console.log(" Completed:", tx_ref);
    res.send("Payment completed successfully");

  } 
  
  catch (err) {
    console.error("VERIFY ERROR:", err.message);
    res.status(500).send("Server error");
  }

});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});