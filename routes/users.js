var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Session = require("../models/sessions");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
// import { v2 as cloudinary } from 'cloudinary';

// ROUTE GET users listing
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

// ROUTE SIGNUP : route pour créer un nouvel utilisateur
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  User.findOne({ email: req.body.email }).then((data) => {
    if (data) {
      res.json({ result: false, error: "User already exists" });
    } else {
      const newUser = new User({
        username: null,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        token: uid2(32),
        totalPoints: 0,
        avatar: null,
        scenarios: [],
      });
      newUser.save().then((data) => {
        res.json({ result: true, token: data.token });
      });
    }
  })
});

//ROUTE SIGNIN : route pour connecter un utilisateur
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    console.log(data);
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, username: data.username, avatar: data.avatar });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

// PAGE PROFILE : route pour afficher les infos de l'utilisateur
router.get("/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    // .populate("scenarios") // Récupère les scénarios associés à l'utilisateur
    .then((user) => {
      if (!user) {
        return res.json({ message: "Utilisateur non trouvé" });
      }
      res.json({
        email: user.email,
        totalPoints: user.totalPoints,
        // scenarios: user.scenarios // Contient directement les scénarios joués
      });
    })
    .catch((error) => {
      res.json({ message: "Erreur", details: error.message });
    });
});









// ROUTE PROFILE : route pour modifier le username et l'image de l'avatar via le lien en BDD qui fait référence à l'image hébergée sur cloudinary
router.put("/updateProfil", async (req, res) => {
  try {
    const { token, username, avatar } = req.body;

    if (!token) {
      return res.json({ result: false, error: "Token manquant" });
    }

    // Recherche de l'utilisateur avec son token
    const user = await User.findOne({ token });
    if (!user) {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    }

    // Vérifie si un autre utilisateur a déjà ce pseudo
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser.token !== token) {
        return res.json({ result: false, error: "Ce pseudo est déjà pris" });
      }
    }

    // Création de l'objet de mise à jour
    const update = {};
    if (username) update.username = username;
    if (avatar) update.avatar = avatar;

    // Mise à jour de l'utilisateur
    const actionUpdate = User.updateOne({ token }, update);

    if (actionUpdate.modifiedCount === 0) {
      res.json({ result: false, message: "Aucune modification apportée" });
    } else {
      res.json({ result: true, message: "Profil mis à jour" });
    }
  } catch (error) {
    res.json({ result: false, error: "Erreur interne", details: error.message });
  }
});

module.exports = router;
