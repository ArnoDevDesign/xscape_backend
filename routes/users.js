var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Session = require("../models/sessions");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;

//// ROUTE GET users listing
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});


//// ROUTE SIGNUP : route pour créer un nouvel utilisateur
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
        res.json({ result: true, token: data.token, _id: data._id});
      });
    }
  })
});


//// ROUTE SIGNIN : route pour connecter un utilisateur
router.post("/signin", async (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log("Route signin :", user);

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
   // Met à jour le token de l'utilisateur dans la base de données
      const updatedUser = await User.updateOne({ email: req.body.email },{ $set: { token: uid2(32) } });

      // Si l'utilisateur a bien été mis à jour, on retourne le nouveau token et les infos nécessaires
      if (updatedUser.modifiedCount > 0) {
        return res.json({
          result: true,
          token: user.token,
          username: user.username,
          avatar: user.avatar,
          _id: user._id,
        });
      } else {
        return res.json({ result: false, error: "Failed to update token" });
      }
    } else {
      return res.json({ result: false, error: "User not found or wrong password" });
    }
  } catch (error) {
    console.error("Error during signin:", error);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});


//// PAGE PROFILE : route pour afficher les infos de l'utilisateur
router.get("/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .then((user) => {
      if (!user) {
        return res.json({ message: "Utilisateur non trouvé" });
      }

      // Récupérer toutes les sessions terminées de cet utilisateur
      Session.find({ participant: user._id, status: "completed" })
        .populate("scenario")
        .then((completedSessions) => {
          // Extraire uniquement les titres des scénarios terminés
          const completedScenarios = completedSessions.map((data, index) => {
            console.log(`Index: ${index} Scenario name : ${data.scenarios.name}`);
            return data.scenarios.name;
          });

          res.json({
            email: user.email,
            totalPoints: user.totalPoints,
            scenarios: completedScenarios, // Liste des titres des scénarios terminés
          });
        })
        .catch((error) => {
          res.json({ message: "Erreur lors de la récupération des sessions", details: error.message });
        });
    })
    .catch((error) => {
      res.json({ message: "Erreur lors de la récupération de l'utilisateur", details: error.message });
    });
});


//// ROUTE UPDATEPROFIL : route pour modifier le username et l'image de l'avatar via le lien en BDD qui fait référence à l'image hébergée sur cloudinary
router.put("/updateProfil", async (req, res) => {
  try {
    const { token, username, avatar } = req.body;

    if (!token) {
      return res.json({ result: false, error: "Token manquant" });
    }

    // Création objet de modification
    const update = {};
    if (username) {
      const user = await User.findOne({ username });

      if (user && user.token !== token) {
        return res.json({ result: false, error: "Username already exists" });
      } else {
        update.username = username;
      }
    }
    if (avatar) {
      update.avatar = avatar;
    }
    // Recherche l'utilisateur avec le token
    const actionUpdate = await User.updateOne({ token }, update);
    console.log(actionUpdate);

    if (actionUpdate.modifiedCount === 0) {
      res.json({ result: false, message: "Aucune modification apportée" });
    } else {
      res.json({ result: true, message: "Profil mis à jour" });
    }
  } catch (error) {
    res.json({ result: false, error: "Erreur interne", details: error.message });
  }
});


//// ROUTE DELETE TOKEN : route pour supprimer le token de l'utilisateur
router.put("/deleteToken", async (req, res) => {
  try {
    const { token } = req.body; 
    const updateResult = await User.updateOne({ token }, { $set: { token: null } });

    if (updateResult.modifiedCount === 0) {
      return res.json({ result: false, message: "Token introuvable" });
    }

    res.json({ result: true, message: "Token supprimé" });

  } catch (error) {
    console.error("Erreur dans la route DELETE /deleteToken :", error);
    res.status(500).json({ result: false, message: "Erreur serveur" });
  }
});
module.exports = router;
