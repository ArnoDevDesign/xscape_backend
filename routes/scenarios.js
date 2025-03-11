const express = require("express");
const router = express.Router();
const User = require("../models/users");
const Scenario = require('../models/scenarios');
const Session = require('../models/sessions');
const Epreuve = require('../models/epreuves');
const Etape = require('../models/etapes');
const { checkBody } = require("../modules/checkBody");

/// ROUTE GET scenarios listing
router.get("/test", function (req, res, next) {
  res.send("respond with a resource");
});


//// ROUTE GET all scenarios listing :
router.get("/", (req, res) => {
  Scenario.find().then(data => {
    res.json(data);
    console.log(data.name);
  })
});


//// ROUTE GET scenarios by name when click on play :
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


//// ROUTE GET all data session by scenario and name :
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

//// ROUTE POST create session by scenario and name when start game : 
router.post("/createSession/:scenarioId/:participantId", async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;

    // Vérifier si la session existe déjà
    let session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate("currentEpreuve")
      .populate("validatedEpreuves")
      .populate({
        path: "scenario",
        populate: { path: "epreuves", model: "epreuves" },
      });
    // console.log("nom du scenario", session.scenario.name);
    if (session) {
      // Si la session existe, on renvoie les infos nécessaires au front pour reprendre la partie
      return res.json({
        result: true,
        message: "Reprise de la session",
        scenarioId: session.scenario._id,
        validatedEpreuves: session.validatedEpreuves.length, // Liste des épreuves validées
        currentEpreuve: session.currentEpreuve, //Infos de l'épreuve en cours
        totalPoints: session.totalPoints,
        numberEpreuves: session.scenario.epreuves.length,
      });
    }
    // console.log("si une session est tourvée", session);
    // Si aucune session n'existe, on récupère le scénario pour récupérer la première épreuve
    const scenario = await Scenario.findById(scenarioId).populate("epreuves");
    console.log("Scénario trouvé :", scenario);
    if (!scenario || scenario.epreuves.length === 0) {
      return res.status(404).json({ result: false, error: "Scénario ou épreuves non trouvées" });
    }

    // Créer une nouvelle session
    const newSession = new Session({
      participant: participantId,
      startDate: Date.now(),
      endDate: null,
      scenario: scenarioId,
      validatedEpreuves: [],
      currentEpreuve: scenario.epreuves[0], // Commence avec la première épreuve
      status: "ongoing",
      isSuccess: false,
      totalPoints: 0,
    });
    // console.log("Nouvelle session à créer :", newSession);
    await newSession.save();

    res.json({
      result: true,
      message: "Nouvelle session créée",
      scenarioId: scenario._id,
      currentEpreuve: scenario.epreuves[0],
      validatedEpreuves: [],
      // totalPoints: totalPoints,
      numberEpreuves: scenario.epreuves.length,
    });

  } catch (error) {
    console.log("Erreur dans la route POST /createSession", error);
    res.status(500).json({ result: false, error: "Erreur serveur !" });
  }
});

//// ROUTE UPDATE restart session by scenario and name when restart scenario :
router.put("/updateSession/:scenarioId/:participantId", async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;
    const { restart } = req.body; // Attendre un booléen dans le body

    // Récupérer la session
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId }).populate("scenario");

    if (!session) {
      return res.status(404).json({ result: false, error: "Session non trouvée" });
    }

    console.log("Session trouvée :", session);

    if (restart) {
      // Réinitialiser la session
      session.startDate = Date.now();
      session.endDate = null;
      session.validatedEpreuves = [];
      session.currentEpreuve = session.scenario.epreuves[0]; // Première épreuve
      session.status = "ongoing";
      session.isSuccess = false;
      session.totalPoints = 0;
      await session.save();

      res.json({ result: true, message: "Session réinitialisée avec succès" });
    } else {
      // Récupérer l'utilisateur
      const user = await User.findById(participantId);

      if (!user) {
        return res.status(404).json({ result: false, error: "Utilisateur non trouvé" });
      }

      // Ajouter les points de la session à l'utilisateur
      user.totalPoints = (Number(user.totalPoints) || 0) + (Number(session.totalPoints) || 0);
      await user.save();

      // Supprimer la session
      await Session.deleteOne({ _id: session._id });

      res.json({
        result: true,
        message: "Scénario terminé et score ajouté à l'utilisateur",
        totalPointsSession: session.totalPoints,
        totalPointsUser: user.totalPoints,
      });
    }
  } catch (error) {
    console.error("Erreur dans la route PUT /updateSession", error);
    res.status(500).json({ result: false, error: "Erreur serveur !" });
  }
});



//// ROUTE GET data descriptionEpreuve by scenario and name :
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


//// ROUTE GET indice and goodFrequence of etapes by scenario and name :
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

    //recherche des valeurs des indices, expectedAnswer et text des étapes : 
    // console.log(".map des étapes :", session.currentEpreuve.etapes.map((data, index) =>
    //   [`expectedText${index + 1}`, data.text]))
    // méthode Object.fromEntries() permet de transformer une liste de paires de clés/valeurs en un objet

    const indices = Object.fromEntries(
      session.currentEpreuve.etapes.map((data, index) =>
        [`indice${index + 1}`, data.indice])
    );
    const expectedAnswers = Object.fromEntries(
      session.currentEpreuve.etapes.map((data, index) =>
        [`answer${index + 1}`, data.expectedAnswer])
    );
    const expectedText = Object.fromEntries(
      session.currentEpreuve.etapes.map((data, index) =>
        [`expectedText${index + 1}`, data.text])
    );

    res.json({
      indice1: indices.indice1,
      indice2: indices.indice2,
      indice3: indices.indice3,
      indice4: indices.indice4,
      expectedAnswer1: expectedAnswers.answer1,
      expectedAnswer2: expectedAnswers.answer2,
      expectedAnswer3: expectedAnswers.answer3,
      expectedAnswer4: expectedAnswers.answer4,
      text1: expectedText.expectedText1,
      text2: expectedText.expectedText2,
      text3: expectedText.expectedText3,
      text4: expectedText.expectedText4,
      score: session.currentEpreuve.points,
    });

    console.log("points de l'épreuve", session.currentEpreuve.points)

  } catch (error) {
    console.log("Erreur dans la route GET /currentEpreuve", error);
    res.json({ result: false, error: "Erreur serveur !" });
  }
});

//// ROUTE GET if scenario exist and isSuccess is true : (A MODIFIER !!!!)
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


//// ROUTE PUT update scrore and validatedEpreuves by scenario and name : 
router.put('/validedAndScore/:scenarioId/:participantId', async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;
    const { score, result } = req.body;
    console.log("Total des points reçu du front", score);

    // Récupérer la session
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate("currentEpreuve")
      .populate("validatedEpreuves")
      .populate({
        path: "scenario",
        populate: { path: "epreuves", model: "epreuves" },
      });

    if (!session || !session.currentEpreuve) {
      return res.status(404).json({ result: false, error: "Session ou épreuve non trouvée" });
    }

    // console.log("Session trouvée :", session);

    if (session) {
      // Vérifier que totalPoints est bien un nombre et l'ajouter au score temporaire
      session.totalPoints = (Number(session.totalPoints) || 0) + (Number(score) || 0);
      console.log("Total des points accumulés dans la session :", session.totalPoints);

      // Ajouter l'épreuve validée à validatedEpreuves
      session.validatedEpreuves.push(session.currentEpreuve._id);
      await session.save();
      // console.log("Epreuve validée ajoutée :", session.validatedEpreuves);

      // Trouver l’épreuve suivante
      const scenario = session.scenario;
      const indexCurrentEpreuve = scenario.epreuves.findIndex(
        (epreuve) => epreuve._id.toString() === session.currentEpreuve._id.toString()
      );

      let nextEpreuve = null;
      if (indexCurrentEpreuve !== -1 && indexCurrentEpreuve < scenario.epreuves.length - 1) {
        nextEpreuve = scenario.epreuves[indexCurrentEpreuve + 1];
      }

      if (nextEpreuve) {
        // Mettre à jour la session avec la nouvelle épreuve
        session.currentEpreuve = nextEpreuve._id;
        session.isSuccess = false; // Reset pour la prochaine épreuve
        await session.save();
        // console.log("Epreuve suivante identifiée ", nextEpreuve);

        res.json({
          result: true,
          message: "Score mis à jour et passage à l'épreuve suivante",
          totalPoints: session.totalPoints,
          nextEpreuve,
        });

      } else {
        // DERNIÈRE épreuve -> Ajouter le score final à l'utilisateur
        const user = await User.findById(participantId);
        console.log("Utilisateur trouvé :", user);
        if (user) {
          // Ajouter le total des points accumulés au score du joueur
          user.totalPoints = (Number(user.totalPoints) || 0) + (Number(session.totalPoints) || 0);
          console.log("Score final ajouté à l'utilisateur :", user.totalPoints);

          // Vérifier si le scénario est déjà enregistré et l'ajouter si besoin
          if (!user.scenarios.some(s => s.toString() === scenarioId.toString())) {
            user.scenarios.push(scenarioId);
          }
          await user.save();

        } else {
          console.log("Utilisateur non trouvé, impossible d'ajouter le score.");
          return res.status(404).json({ result: false, error: "Utilisateur non trouvé" });
        }

        // Supprimer la session
        await Session.deleteOne({ _id: session._id });

        res.json({
          result: true,
          message: "Scénario terminé et score ajouté à l'utilisateur",
          totalPointsSession: session.totalPoints,
          totalPointsUser: user.totalPoints,
        });
      }
    } else {
      res.json({ result: false, message: "L'épreuve en cours n'est pas encore terminée" });
    }
  } catch (error) {
    console.error("Erreur dans la route PUT /updateScore", error);
    res.status(500).json({ result: false, error: "Erreur serveur !" });
  }
});


//// Route PUT calcul duration of scenario by participant and scenario : 
// A MAJ ET A TESTER !
// Voir pour Calcul du temps passé en temps réel côté client (Front-End) 
// Voir pour la mise à jour la durée côté serveur (Back-End)
// router.put('/calculateDuration/:scenarioId/:participantId', async (req, res) => {
//   try {
//     const { scenarioId, participantId } = req.params;

//     const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
//       .populate("scenario");

//     if (!session) {
//       return res.status(404).json({ result: false, error: "Session non trouvée" });
//     }

//     // Récupérer la durée du scénario (en minutes) à partir du schéma Scenario
//     const scenario = session.scenario;
//     const initialDuration = scenario.duree;
//     if (!initialDuration) {
//       return res.status(400).json({ result: false, error: "Durée du scénario non définie" });
//     }

//     // Calculer la durée totale passée sur la session
//     const startDate = session.startDate;
//     const endDate = session.endDate || new Date(); // Si la session n'est pas encore terminée, utiliser l'heure actuelle

//     // Calcul de la durée totale de la session en minutes
//     const totalDurationSpent = (new Date(endDate) - new Date(startDate)) / 60000;

//     // Calculer le temps restant
//     const remainingDuration = Math.max(0, initialDuration - totalDurationSpent); // Ne pas avoir de durée négative

//     // Enregistrer cette information dans le profil de l'utilisateur
//     const user = await User.findById(participantId);
//     if (!user) {
//       return res.status(404).json({ result: false, error: "Utilisateur non trouvé" });
//     }

//     // Ajouter cette session avec la durée calculée
//     const durationData = {
//       totalDuration: initialDuration,  // Durée initiale du scénario
//       timeSpent: totalDurationSpent,   // Temps total passé dans la session
//       remainingTime: remainingDuration, // Temps restant
//     };

//     // Ajouter cette information à la liste des sessions terminées pour l'utilisateur
//     user.scenarios.push({ scenarioId, durationData, });

//     // Sauvegarder l'utilisateur avec les nouvelles données
//     await user.save();

//     // Retourner la réponse avec la durée calculée
//     res.json({
//       result: true,
//       message: "Durée du scénario calculée avec succès",
//       durationData,
//     });
//   } catch (error) {
//     console.error("Erreur dans la route PUT /calculateDuration", error);
//     res.status(500).json({ result: false, error: "Erreur serveur !" });
//   }
// });


// createSession // validedAndScore // updateSession
module.exports = router;