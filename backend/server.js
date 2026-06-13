import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

import { db } from "./firebaseAdmin.js";

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.json());

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("Cheer ET Backend Running");
});

/* =========================
   CREATE PAYMENT
========================= */

app.post("/api/create-payment", async (req, res) => {
  try {
    const { amount, name, tx_ref } = req.body;

    console.log("CREATE PAYMENT:", tx_ref);

    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount,
        currency: "ETB",
        email: "cheeret@gmail.com",
        first_name: name,
        last_name: "Supporter",
        tx_ref,

        callback_url:
          "https://cheerapi.onrender.com/api/verify",

        return_url:
          "https://cheer-et.web.app/payment-success",

        customization: {
          title: "CheerET",
          description: "Support creator"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );
console.log("SECRET EXISTS:", !!process.env.CHAPA_SECRET);
console.log(
  "SECRET PREFIX:",
  process.env.CHAPA_SECRET?.substring(0, 12)
);
    console.log("CHAPA SUCCESS");

    res.json({
      checkout_url: response.data.data.checkout_url
    });

  } catch (err) {
    console.log("CREATE PAYMENT ERROR:");
    console.log(err.response?.data || err.message);

    res.status(500).json({
      error: "Payment failed"
    });
  }
});

/* =========================
   VERIFY (CHAPA CALLBACK)
========================= */

app.get("/api/verify", async (req, res) => {
  try {
    console.log("========== VERIFY CALLBACK ==========");
    console.log("QUERY:", JSON.stringify(req.query, null, 2));

    console.log(
      "SECRET PREFIX:",
      process.env.CHAPA_SECRET?.substring(0, 15)
    );

    const tx_ref =
      req.query.tx_ref ||
      req.query.trx_ref;

    console.log("TX_REF:", tx_ref);
    console.log("TRX_REF:", req.query.trx_ref);

    if (!tx_ref) {
      console.log("NO TX_REF FOUND");
      return res.status(200).json({
        message: "No tx_ref"
      });
    }

    const verifyUrl =
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`;

    console.log("VERIFY URL:", verifyUrl);

    const verify = await axios.get(
      verifyUrl,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(
      "VERIFY RESPONSE:",
      JSON.stringify(verify.data, null, 2)
    );

    const paymentData = verify.data;

    if (
      paymentData.status === "success" &&
      paymentData.data?.status === "success"
    ) {
      console.log("PAYMENT SUCCESS");

      const snap = await db
        .collection("donations")
        .where("tx_ref", "==", tx_ref)
        .get();

      console.log("DOCS FOUND:", snap.size);

      if (!snap.empty) {
        const doc = snap.docs[0];

        await doc.ref.update({
          paymentStatus: "successful",
          completedAt: new Date()
        });

        console.log("UPDATED TO COMPLETED");
      } else {
        console.log("DONATION NOT FOUND");
      }
    } else {
      console.log("PAYMENT FAILED");
    }

    return res.status(200).send("OK");

  } catch (err) {
    console.log("========== VERIFY ERROR ==========");
console.log("STATUS:", err.response?.status);
console.log("DATA:", JSON.stringify(err.response?.data, null, 2));
console.log("MESSAGE:", err.message);
  }
});
/* =========================
   START SERVER (RENDER FIX)
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
/* =========================
   VERIFY (CHAPA CALLBACK)
========================= */
