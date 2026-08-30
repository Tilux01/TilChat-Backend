const express = require("express");
const cors = require("cors");
const webpush = require("web-push");
const admin = require("firebase-admin");
require("dotenv").config();
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tilchat-91043-default-rtdb.firebaseio.com"
});

// VAPID KEYS
webpush.setVapidDetails(
  "mailto:israeladekola8@gmail.com",
  "BI39fB0i19JTHx18xGN7ZToHxgJJMg_Mk_xyMmZozNMoDMx4-tTzi6V2e5tZpkxJVxhy0ImL2m_82cZ0E78K3zc",
  "qz8zy8h1gyvdwPZI6yrBcYQURV4UtP2A13BhD4yKVx4"
);

// SAVE SUBSCRIPTION
app.post("/save-subscription", async (req, res) => {
  const { userId, subscription } = req.body;

  try {
    // Save subscription in your DB
    await admin.database().ref(`Users/${userId}/subscription`).set(subscription);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// SEND NOTIFICATION
app.post("/send-notification", async (req, res) => {
  const { toUserId, message, fromUser } = req.body;
  // const fromUser = "TIlux"

  try {
  const snap = await admin.database().ref(`Users/${toUserId}/subscription`).once("value");
  const subscription = snap.val();
  if (!subscription) return res.json({ success: false, error: "No subscription found" });
    console.log(fromUser);
    
  const payload = JSON.stringify({
    notification: { title: fromUser, body: message, icon: "/icon.png" }
  });

  await webpush.sendNotification(subscription, payload);

  res.json({ success: true });

} catch (err) {
  console.log("Web Push Error:", err);

  // Remove subscription if 410 Gone
  if (err.statusCode === 410 || err.statusCode === 404) {
    console.log("Subscription is gone, removing from DB");
    await admin.database().ref(`Users/${toUserId}/subscription`).remove();
  }

  res.json({ success: false, error: err.message });
}

});

app.listen(3001, () => console.log("Push Server Running on 3001"));
