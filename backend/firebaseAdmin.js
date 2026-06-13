import admin from "firebase-admin";

import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync(
    "./serviceAccountKey.json",
    "utf-8"
  )
);

if (!admin.apps.length) {

  admin.initializeApp({

    credential:
      admin.credential.cert(serviceAccount)

  });
console.log(
  "SERVICE ACCOUNT EXISTS:",
  fs.existsSync("./serviceAccountKey.json")
);
}

const db = admin.firestore();

export { db };