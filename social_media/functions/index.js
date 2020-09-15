const functions = require("firebase-functions");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

const express = require("express");
const app = express();
const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream,
} = require("./handlers/screams");

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");
const { db } = require("./util/admin");
const FBAuth = require("./util/FBAuth");

//Scream Routes

app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postOneScream);
app.get("/scream/:screamId", getScream);
app.delete("/scream/:screamId", FBAuth, deleteScream);
app.get("/scream/:screamId/like", FBAuth, likeScream);
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream);
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);

//user routes

app.post("/signup", signup);
app.post("/login", login);
app.get("/user", FBAuth, getAuthenticatedUser);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user/:handle", getUserDetails);
app.post("/notification", FBAuth, markNotificationsRead);

exports.api = functions.region("us-central1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("us-central1")
  .firestore.document("likes/{id}")
  .onCreate(async (snapshot) => {
    let doc = await db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .catch((e) => {
        return res.status(500).json({ error: e });
      });
    if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
      await db
        .doc(`/notifications/${snapshot.id}`)
        .set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          type: "like",
          read: false,
          screamId: doc.id,
        })
        .catch((e) => {
          return res.status(500).json({ error: e });
        });
    }
  });

exports.createNotificatioOnComment = functions
  .region("us-central1")
  .firestore.document("comments/{id}")
  .onCreate(async (snapshot) => {
    let doc = await db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .catch((e) => {
        return res.status(500).json({ error: e });
      });
    if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
      await db
        .doc(`/notifications/${snapshot.id}`)
        .set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          type: "comment",
          read: false,
          screamId: doc.id,
        })
        .catch((e) => {
          return res.status(500).json({ error: e });
        });
    }
  });
exports.deleteNotificationOnUnlike = functions
  .region("us-central1")
  .firestore.document("comments/{id}")
  .onDelete(async (snapshot) => {
    await db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((e) => {
        return res.status(500).json({ error: e });
      });
  });

exports.onUserImageChange = functions
  .region("us-central1")
  .firestore.document("/users/{userId}")
  .onUpdate(async (change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl != change.after.data().imageUrl) {
      console.log("image has changed");
      const batch = db.batch();
      let docs = await db
        .collection("screams")
        .where("userHandle", "==", change.before.data().handle)
        .get();
      docs.forEach((doc) => {
        const scream = db.doc(`/scream/${doc.id}`);
        batch.update(scream, { userImage: change.after.data().imageUrl });
      });
      return batch.commit();
    } else return true;
  });

exports.onScreamDelete = functions
  .region("us-central1")
  .firestore.document("/scream/{screamId}")
  .onDelete(async (sanpshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    let docs = await db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get();
    docs.forEach((doc) => {
      batch.delete(db.doc(`/comments/${doc.id}`));
    });
    docs = await db.collection("likes").where("screamId", "==", screamId).get();
    docs.forEach((doc) => {
      batch.delete(db.doc(`/likes/${doc.id}`));
    });
    docs = await db
      .collection("notification")
      .where("screamId", "==", screamId)
      .get();
    docs.forEach((doc) => {
      batch.delete(db.doc(`/notification/${doc.id}`));
    });
  });
