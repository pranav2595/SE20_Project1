const { db, admin } = require("../util/admin");
const firebase = require("firebase");
const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require("../util/validators");
const config = require("../util/config");
const { uuid } = require("uuidv4");
firebase.initializeApp(config);

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };
  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.json(error);

  const noImg = "no-img.png";

  async function validate_data_server_side() {
    let handle = await db
      .doc(`/users/${newUser.handle}`)
      .get()
      .catch((e) => {
        return res.status(500).json({ error: "there was error" });
      });
    if (handle.exists) {
      return res.json({ handle: "This handle already exists" });
    } else {
      let data = await firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
        .catch((e) => {
          return res.status(500).json({ error: e });
        });
      let userId = data.user.uid;
      let data_token = await data.user.getIdToken();
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId,
      };
      await db
        .doc(`/users/${newUser.handle}`)
        .set(userCredentials)
        .catch((e) => {
          return res.json({ error: e });
        });
      return res.status(201).json({ data_token });
    }
  }

  try {
    validate_data_server_side();
  } catch (err) {
    console.log("err", err);
  }
};

exports.login = async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  const { valid, errors } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  let data = await firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .catch((e) => {
      return res.json({ error: e });
    });
  let token = await data.user.getIdToken().catch((e) => {
    return res.json({ error: e });
  });
  return res.json({ token1: token });
};

//Add user Details
exports.addUserDetails = async (req, res) => {
  console.log(req.body);
  let userDetails = reduceUserDetails(req.body);
  await db
    .doc(`/users/${req.user.handle.handle}`)
    .update(userDetails)
    .catch((e) => {
      return res.status(500).json({ error: e });
    });
  return res.json({ message: "Details added sucessfully" });
};

//Get user details

exports.getAuthenticatedUser = async (req, res) => {
  let userData = {};
  console.log(req.user);

  let doc = await db
    .doc(`/users/${req.user.handle.handle}`)
    .get()
    .catch((e) => {
      return res.status(500).json({ error: e });
    });
  console.log("here is doc:::");

  if (doc.exists) {
    userData.credentials = doc.data();
    console.log(userData.credentials);
    let likes = await db
      .collection("likes")
      .where("userHandle", "==", req.user.handle.handle)
      .get()
      .catch((e) => {
        return res.status(500).json({ error: e });
      });
    userData.likes = [];
    likes.forEach((doc) => {
      userData.likes.push(doc.data());
    });
  }
  return res.json(userData);
};

//upload Image Profile
exports.uploadImage = async (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });
  let imageToBeUploaded = {};
  let imageFileName;
  let generatedToken = uuid();

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket(`${config.storageBucket}`)
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            firebaseStorageDownloadToken: generatedToken,
          },
        },
      })
      .then(() => {
        // Append token to url
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
        console.log(`${req.user.handle}`);
        return db.doc(`/users/${req.user.handle.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err });
      });
  });
  busboy.end(req.rawBody);
};

//Get any users details
exports.getUserDetails = async (req, res) => {
  let userData = {};
  let doc = await db
    .doc(`/users/${req.params.handle}`)
    .get()
    .catch((e) => {
      return res.status(500).json({ error: e });
    });
  if (doc.exists) {
    userData.user = doc.data();
    let data = await db
      .collection("screams")
      .where("userHandle", "==", req.params.handle)
      .orderBy("createdAt", "desc")
      .get()
      .catch((e) => {
        return res.status(500).json({ error: e });
      });
    userData.screams = [];
    data.forEach((doc) => {
      userData.screams.push({
        body: doc.data().body,
        createdAt: doc.data().createdAt,
        userHandle: doc.data().userHandle,
        userImage: doc.data().userImage,
        likeCount: doc.data().likeCount,
        commentCount: doc.data().commentCount,
        screamId: doc.Id,
      });
    });
    return res.json(userData);
  } else {
    return res.status(404).json({ error: "user not found" });
  }
};

exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: "Notifications marked read" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
