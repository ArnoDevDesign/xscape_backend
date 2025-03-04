var express = require("express");
var router = express.Router();
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
// import { v2 as cloudinary } from 'cloudinary';

// /* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  User.findOne({email: req.body.email}).then((data) => {
    if (data) {
      res.json({ result: false, error: "User already exists" });
    } else {
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        token: uid2(32),
        totalPoints: 0,
        avatar: req.body.avatar,
        scenarios: [],
      });
      newUser.save().then((data) => {
        res.json({ result: true, token: data.token });
      });
    }
  })
 }) ;

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
      console.log(data);
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

// PAGE PROFILE : route pour afficher les infos de l'utilisateur
router.get("/:token", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.token })
      // récupère les scénario associés au username via la clé étrangère "scenario"
      // .populate('scenarios', 'name')
      // Sélection des champs nécessaires dont les infos doivent être remontés
      .select("username email totalPoints scenarios avatar");
    // vérifie si un utilisateur existe
    if (!user) {
      return res.json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    res.json({ message: "Erreur", details: error.message });
  }
});

// PAGE PROFILE : route pour modifier le username et l'image de l'avatar via le lien en BDD qui fait référence à l'image hébergée sur cloudinary
router.put("/updateProfil", async (req, res) => {
  try {
    const { token, username, avatar } = req.body;
    // Vérifie que le token est bien fourni
    if (!token) {
      return res.json({ message: "Token manquant" });
    }
    // Création objet de modification
    const update = {};
    if (username) {
      update.username = username;
    }
    if (avatar) {
      update.avatar = avatar;
    }
    // Recherche l'utilisateur avec le token
    const actionUpdate = await User.updateOne({ token }, update);
    console.log(ops);

    if (actionUpdate.modifiedCount === 0) {
      res.json({ message: "Utilisateur non trouvé / Non modifié" });
    } else {
      res.json({ message: "Profil mis à jour" });
    }
  } catch (error) {
    res.json({ message: "Erreur", details: error.message });
  }
});

module.exports = router;
