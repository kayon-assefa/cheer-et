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

    const {
      amount,
      name,
      tx_ref
    } = req.body;

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
          "http://localhost:5173/payment-success",

        customization: {
          title: "CheerET",
          description: "Support creator"
        }
      },

      {
        headers: {

          Authorization:
            `Bearer ${process.env.CHAPA_SECRET}`,

          "Content-Type":
            "application/json"

        }
      }
    );

    console.log("CHAPA SUCCESS");

    res.json({

      checkout_url:
        response.data.data.checkout_url

    });

  } catch (err) {

    console.log("CREATE PAYMENT ERROR:");

    console.log(
      err.response?.data || err.message
    );

    res.status(500).json({
      error: "Payment failed"
    });
  }
});

/* =========================
   VERIFY PAYMENT
========================= */

app.get("/api/verify", async (req, res) => {

  try {

    console.log("========== WEBHOOK ==========");

    console.log(
  JSON.stringify(req.body, null, 2)
);

const tx_ref =
  req.query.trx_ref ||
  req.query.tx_ref;

console.log("TX_REF:", tx_ref);
    console.log("TX_REF:", tx_ref);

    if (!tx_ref) {

      console.log("NO TX REF");

      return res.status(200).json({
        message: "No tx_ref"
      });

    }

    const verify = await axios.get(

      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,

      {
        headers: {
          Authorization:
            `Bearer ${process.env.CHAPA_SECRET}`
        }
      }
    );

    console.log("VERIFY RESPONSE:");

    console.log(verify.data);

    const paymentData = verify.data;

    if (

      paymentData.status === "success" &&
      paymentData.data.status === "success"

    ) {

      console.log("PAYMENT SUCCESS");

      const snap = await db
        .collection("donations")
        .where("tx_ref", "==", tx_ref)
        .get();

      console.log("DOCS FOUND:", snap.size);

      if (!snap.empty) {

        const doc = snap.docs[0];

 try {

  await doc.ref.update({

    paymentStatus: "successful",

    completedAt: new Date()

  });

  console.log("UPDATED TO COMPLETED");

} catch (updateErr) {

  console.log("UPDATE ERROR:");

  console.log(updateErr);

}

      } else {

        console.log("DONATION NOT FOUND");

      }

    } else {

      console.log("PAYMENT FAILED");

    }

    return res.status(200).json({
      success: true
    });

  } catch (err) {

    console.log("WEBHOOK ERROR:");

    console.log(
      err.response?.data || err.message
    );

    return res.status(500).json({
      error: true
    });
  }
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Backend running on port ${PORT}`
  );

});