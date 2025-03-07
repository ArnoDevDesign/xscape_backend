const express = require("express");
const router = express.Router();
const User = require("../models/users");
const Scenario = require('../models/scenarios');
const Session = require('../models/sessions');
const Epreuve = require('../models/epreuves');
const Etape = require('../models/etapes');
const { checkBody } = require("../modules/checkBody");

// // ROUTE GET scenarios listing
router.get("/test", function (req, res, next) {
  res.send("respond with a resource");
});

//ROUTE GET scenarios listing :
router.get("/", (req, res) => {
  Scenario.find().then(data => {
    res.json(data);
    console.log(data.name);
  })
});

//ROUTE GET scenarios by name :
router.get("/:name", (req, res) => {
  try {
    if (!checkBody(req.params, ["name"])) {
      res.json({ result: false, error: "Pas de scenario trouvée avec ce nom !" });
      return;
    }
    Scenario.findOne({ name: req.params.name })
      .then(data => {
        res.json(data);
        console.log(data);
      })
  } catch (error) {
    console.log('route get name', error);
    res.json({ result: false, error: "Pas de scenario trouvée avec ce nom !" });
  }
});

//ROUTE GET etapesEpreuves by name :
router.get("/etapes/:scenarioId/:participantId", async (req, res) => {
  console.log("Params reçus :", req.params);
  try {
    const { scenarioId, participantId } = req.params;

    // Trouver la session correspondante et les clés étrangères associées
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate("currentEpreuve");

    if (!session || !session.currentEpreuve) {
      return res.status(404).json({ result: false, error: "Session ou épreuve non trouvée" });
    }

    // 📌 Récupérer l'épreuve AVEC les détails des étapes
    const currentEpreuve = await Epreuve.findById(session.currentEpreuve._id)
      .populate({
        path: "etapes", // 🔥 On peuple le champ "etapes"
        model: "etapes", // 📌 Assure-toi que c'est bien le bon nom du modèle
      });

    if (!currentEpreuve) {
      return res.status(404).json({ result: false, error: "Épreuve non trouvée" });
    }

    console.log("Epreuve trouvée :", currentEpreuve);

    // 📌 Retourner la session, l'épreuve et les étapes DÉTAILLÉES
    res.json({
      session,         // ✅ Données complètes de la session
      currentEpreuve,  // ✅ Données complètes de l'épreuve
      etapes: currentEpreuve.etapes, // ✅ Détail des étapes
    });
  } catch (error) {
    console.log("Erreur dans la route GET /currentEpreuve", error);
    res.json({ result: false, error: "Erreur serveur !" });
  }
});



// //ROUTE GET if scenario exist and isSuccess is true :
// router.get("/isSuccess/:name", (req,res) => {
//    try {
//     if (!checkBody(req.params, ["name"])) {
//     res.json({result: false, error: "Pas de scenario trouvé avec ce nom !"});
//     return;
//    }
//    Scenario.findOne({name: req.params.name, isSuccess: true}) 
//    .then(data => {
//     res.json(data);
//     console.log(data);
//    });
//   } catch (error) {
//     console.log('route get isSuccess', error)
//   }
// });

module.exports = router;