import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function PaymentSuccess() {

  useEffect(() => {

    confetti({
      particleCount: 200,
      spread: 120
    });

  }, []);

  return (
    <div
      style={{
        height: "100vh",
        background: "#0f0f0f",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        textAlign: "center",
        padding: "20px"
      }}
    >

      <h1
        style={{
          fontSize: "50px",
          marginBottom: "10px"
        }}
      >
        🎉
      </h1>

      <h2>Donation Successful</h2>

      <p>
        Thank you for supporting the creator.
      </p>

    </div>
  );
}