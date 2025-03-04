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

  // Check if the user has not already been registered
  router.put("/updateProfil", async (req, res) => {
    try {
      const token = req.headers.authorization; // Récupération du token dans les headers
      const { username, avatar } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token manquant" });
      }

      const user = await User.findOne({ token });

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      if (username) user.username = username;
      if (avatar) user.avatar = avatar;

      await user.save();

      res.status(200).json({ message: "Profil mis à jour", user });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur serveur", details: error.message });
    }
  });
});

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
