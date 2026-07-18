const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/* ========== UPDATE BALANCE ON COMPLETED DONATION ========== */
exports.updateBalanceOnDonation = functions.firestore
  .document("donations/{donationId}")
  .onUpdate(async (change, context) => {
    
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger when paymentStatus becomes "completed"
    if (after.paymentStatus === "completed" && before.paymentStatus !== "completed") {
      
      const streamerId = after.streamerId;
      const amount = Number(after.amount || 0);
      const commission = amount * 0.10;
      const netAmount = amount - commission;

      if (!streamerId || netAmount <= 0) return;

      const userRef = admin.firestore().collection("users").doc(streamerId);

      await userRef.update({
        currentBalance: admin.firestore.FieldValue.increment(netAmount),
        totalRaised: admin.firestore.FieldValue.increment(amount)   // optional
      });

      console.log(`✅ Balance updated for ${streamerId} | +${netAmount} ETB (after 10% fee)`);
    }
  });

