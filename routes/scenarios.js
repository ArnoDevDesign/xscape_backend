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

//ROUTE GET all data session by scenario and name :
router.get("/sessionAll/:scenarioId/:participantId", async (req, res) => {
  console.log("Params reçus :", req.params);
  try {
    const { scenarioId, participantId } = req.params;

    // Données de la session correspondante et les clés étrangères associées
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate({
        path: "currentEpreuve",  // On peuple l'épreuve actuelle
        populate: {              // On peuple les étapes de l'épreuve en même temps
          path: "etapes",
          model: "etapes",      // Assure-toi que c'est bien le bon modèle pour les étapes
        },
      });

    if (!session || !session.currentEpreuve) {
      return res.status(404).json({ result: false, error: "Session ou épreuve non trouvée" });
    }

    console.log("Session et épreuve avec étapes trouvées :", session);

    // Retourner les données complètes de la session avec les données de l'épreuve et des étapes
    res.json({
      session,               // Données complètes de la session
      currentEpreuve: session.currentEpreuve,  // Données complètes de l'épreuve
      etapes: session.currentEpreuve.etapes,  // Données complètes des étapes
    });

  } catch (error) {
    console.log("Erreur dans la route GET /currentEpreuve", error);
    res.json({ result: false, error: "Erreur serveur !" });
  }
});

//ROUTE GET descriptionEpreuve by scenario and name :
router.get("/descriptionEpreuve/:scenarioId/:participantId", async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;
    // Données de la session correspondante et les clés étrangères associées
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate({
        path: "currentEpreuve",
        populate: {
          path: "etapes",
          model: "etapes",
        },
      });

    if (!session || !session.currentEpreuve) {
      return res.status(404).json({ result: false, error: "Session ou épreuve non trouvée" });
    }
    console.log("Session et épreuve avec étapes trouvées :", session);

    res.json({
      descriptionEpreuveData: session.currentEpreuve.descriptionEpreuve
    });

  } catch (error) {
    console.log("Erreur dans la route GET /currentEpreuve", error);
    res.json({ result: false, error: "Erreur serveur !" });
  }
});


//ROUTE GET etapes by scenario and name :
router.get("/etapes/:scenarioId/:participantId", async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;
    // Données de la session correspondante et les clés étrangères associées
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate({
        path: "currentEpreuve",
        populate: {
          path: "etapes",
          model: "etapes",
        },
      });

    if (!session || !session.currentEpreuve) {
      return res.status(404).json({ result: false, error: "Session ou épreuve non trouvée" });
    }
    console.log("Session et épreuve avec étapes trouvées :", session);
    //recherche des valeurs des indices et expectedAnswer
    const indices = Object.fromEntries(
      session.currentEpreuve.etapes.map((data, index) =>
        [`indice${index + 1}`, data.indice])
    );

    const expectedAnswers = Object.fromEntries(
      session.currentEpreuve.etapes.map((data, index) =>
        [`expectedAnswer${index + 1}`, data.expectedAnswer])
    );

    res.json({
      indice1: indices.indice1,
      indice2: indices.indice2,
      indice3: indices.indice3,
      goodFrequence1: expectedAnswers.expectedAnswer1,
      goodFrequence2: expectedAnswers.expectedAnswer2,
      goodFrequence3: expectedAnswers.expectedAnswer3
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