import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

// Firebase imports
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEiXY9U0g96-XEShJ7n_d5QLjyJiar1YY",
  authDomain: "cheer-et.firebaseapp.com",
  projectId: "cheer-et",
  storageBucket: "cheer-et.firebasestorage.app",
  messagingSenderId: "228115400890",
  appId: "1:228115400890:web:6f9b0af9123dc4d7d5da83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const root = ReactDOM.createRoot(document.getElementById("root"));

async function checkServerStatus() {
  try {
    // Check system collection → assuming document ID is "status"
    const statusDoc = await getDoc(doc(db, "system", "status"));

    if (statusDoc.exists()) {
      const data = statusDoc.data();

      if (data.server === false) {
        // Redirect to maintenance page
        window.location.href = "./server-down.html";
        return;
      }
    }

    // If server is true or document doesn't exist → render the app
    renderApp();

  } catch (error) {
    console.error("Error checking server status:", error);
    // In case of error, you can choose to show the app or maintenance page
    renderApp();
  }
}

function renderApp() {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Start checking
checkServerStatus();