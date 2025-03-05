const express = require("express");
const router = express.Router();
const Scenario = require('../models/scenarios');

//ROUTE GET scenarios listing :
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