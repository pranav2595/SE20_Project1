const admin = require('firebase-admin')
const serviceAccount = require("../socialape-c629a-firebase-adminsdk-hidjt-8436695534.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://socialape-c629a.firebaseio.com'
  });

const db = admin.firestore();

module.exports={ admin, db}