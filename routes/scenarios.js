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

//ROUTE GET all scenarios listing :
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
      // currentEpreuve: session.currentEpreuve,  // Données complètes de l'épreuve
      // etapes: session.currentEpreuve.etapes,  // Données complètes des étapes
    });

  } catch (error) {
    console.log("Erreur dans la route GET /currentEpreuve", error);
    res.json({ result: false, error: "Erreur serveur !" });
  }
});

//ROUTE GET data descriptionEpreuve by scenario and name :
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

//ROUTE GET indice and goodFrequence of etapes by scenario and name :
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
    const indices = Object.fromEntries( // méthode Object.fromEntries() permet de transformer une liste de paires de clés/valeurs en un objet
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

//ROUTE GET etapes by scenario and name : COPIE COPIE COPIE
router.get("/validatedEpreuves/:scenarioId/:participantId", async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;

    // Récupérer la session avec currentEpreuve et validatedEpreuves
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate("currentEpreuve")
      .populate("validatedEpreuves");

    if (!session) {
      return res.status(404).json({ result: false, error: "Session non trouvée" });
    }

    // Récupérer le scénario et sa liste d'épreuves ordonnées
    const scenario = await Scenario.findById(scenarioId).populate("epreuves");
    if (!scenario) {
      return res.status(404).json({ result: false, error: "Scénario non trouvé" });
    }

    let nextEpreuve = null;

    // Si une épreuve est en cours et validée, chercher la suivante
    if (session.currentEpreuve) {
      const currentIndex = scenario.epreuves.findIndex(epreuve =>
        epreuve._id.toString() === session.currentEpreuve._id.toString()
      );

      // Vérifier si une autre épreuve suit après l'épreuve actuelle
      if (currentIndex !== -1 && currentIndex + 1 < scenario.epreuves.length) {
        nextEpreuve = scenario.epreuves[currentIndex + 1];
      }
    } else {
      // Si aucune épreuve en cours, prendre la première de la liste
      nextEpreuve = scenario.epreuves.length > 0 ? scenario.epreuves[0] : null;
    }

    // Si une épreuve doit être mise à jour
    if (session.currentEpreuve && session.currentEpreuve.status === "completed" && session.currentEpreuve.isSuccess) {
      await Session.findByIdAndUpdate(session._id, {
        $push: { validatedEpreuves: session.currentEpreuve._id }, // Ajouter l'épreuve validée
        currentEpreuve: nextEpreuve ? nextEpreuve._id : null // Définir l'épreuve suivante
      });

      // Mettre à jour l'objet session pour le retour de la requête
      session.validatedEpreuves.push(session.currentEpreuve);
      session.currentEpreuve = nextEpreuve;
    }

    // Vérifier si une épreuve est définie
    if (!session.currentEpreuve) {
      return res.json({ message: "Toutes les épreuves ont été complétées !" });
    }

    // Charger les détails de l'épreuve actuelle avec les étapes
    const currentEpreuve = await Epreuve.findById(session.currentEpreuve._id)
      .populate("etapes");

    if (!currentEpreuve) {
      return res.status(404).json({ result: false, error: "Épreuve non trouvée" });
    }

    // Extraire indices et expectedAnswer
    const indices = Object.fromEntries(
      currentEpreuve.etapes.map((data, index) => [`indice${index + 1}`, data.indice])
    );

    const expectedAnswers = Object.fromEntries(
      currentEpreuve.etapes.map((data, index) => [`expectedAnswer${index + 1}`, data.expectedAnswer])
    );

    // Réponse JSON avec toutes les données
    res.json({
      session,
      currentEpreuve,
      indices,
      expectedAnswers
    });

  } catch (error) {
    console.log("Erreur dans la route GET /etapes", error);
    res.status(500).json({ result: false, error: "Erreur serveur !" });
  }
});


// ------ROUTE GET if scenario exist and isSuccess is true : (A MODIFIER !!!!)
router.get("/isSuccess/:name", (req, res) => {
  try {
    if (!checkBody(req.params, ["name"])) {
      res.json({ result: false, error: "Pas de scenario trouvé avec ce nom !" });
      return;
    }
    Scenario.findOne({ name: req.params.name, isSuccess: true })
      .then(data => {
        res.json(data);
        console.log(data);
      });
  } catch (error) {
    console.log('route get isSuccess', error)
  }
});


//ROUTE POST update scrore by scenario and name :


module.exports = router;