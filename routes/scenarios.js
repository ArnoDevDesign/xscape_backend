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
    let { restart } = req.body;

    // Convertir `restart` en booléen
    restart = restart === "true" || restart === true;

    // Vérifier si la session existe déjà
    let session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate({
        path: "scenario",
        populate: { path: "epreuves" },
      })
      .populate("currentEpreuve")
      .populate("validatedEpreuves");

    if (session) {
      if (restart) {
        // 🔄 Réinitialisation de la session
        session.startDate = Date.now();
        session.endDate = null;
        session.validatedEpreuves = [];
        session.currentEpreuve = session.scenario.epreuves[0]._id; // Première épreuve
        session.status = "ongoing";
        session.isSuccess = false;
        session.totalPoints = 0;
        await session.save();

        return res.json({ result: true, message: "Session réinitialisée avec succès" });
      } else {
        // 🔄 Reprise de la session existante
        return res.json({
          result: true,
          message: "Reprise de la session",
          scenarioId: session.scenario._id,
          validatedEpreuves: session.validatedEpreuves.length,
          currentEpreuve: session.currentEpreuve,
          totalPoints: session.totalPoints,
          numberEpreuves: session.scenario.epreuves.length,
        });
      }
    }

    // Si aucune session n'existe, récupérer le scénario et créer une nouvelle session
    const scenario = await Scenario.findById(scenarioId).populate("epreuves");
    if (!scenario || scenario.epreuves.length === 0) {
      return res.status(404).json({ result: false, error: "Scénario ou épreuves non trouvées" });
    }

    // Création de la session
    const newSession = new Session({
      participant: participantId,
      startDate: Date.now(),
      endDate: null,
      scenario: scenarioId,
      validatedEpreuves: [],
      currentEpreuve: scenario.epreuves[0]._id, // Première épreuve
      status: "ongoing",
      isSuccess: false,
      totalPoints: 0,
    });

    await newSession.save();

    res.json({ result: true, message: "Nouvelle session créée", scenarioId: scenario._id });

  } catch (error) {
    console.error("Erreur dans la route POST /session :", error);
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
// calculer la durée passée en fonction des addition des durées des épreuves validées
// calculer le temps restant en fonction de la durée max du scenario - durée passée
// Récupérer la session correspondante
// Calculer la durée totale passée sur la session
// Calculer le temps restant
// Sauvegarder les données de la session dans le profil de l'utilisateur
// Retourner la durée calculée

// const dayjs = require("dayjs"); // Importer DayJS pour gérer les dates
// const duration = require("dayjs/plugin/duration");
// dayjs.extend(duration);

router.get("/sessionTime/:scenarioId/:participantId", async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;

    // Récupérer la session et peupler les épreuves validées et le scénario
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate("validatedEpreuves") // Récupère toutes les épreuves validées
      .populate("scenario");

    if (!session) {
      return res.status(404).json({ result: false, error: "Session non trouvée" });
    }

    if (!session.scenario || !session.scenario.epreuves) {
      return res.status(500).json({ result: false, error: "Le scénario ne contient aucune épreuve" });
    }

    // Récupérer la durée maximale autorisée pour le scénario
    const maxDuration = session.scenario.maxDuration || 0; // En minutes

    // Calculer la durée totale passée en additionnant les durées des épreuves validées
    let totalElapsedMinutes = session.validatedEpreuves.reduce((total, epreuve) => {
      return total + (epreuve.duration || 0); // Chaque épreuve a une durée
    }, 0);

    // Calculer la durée de la session en cours
    let sessionStartTime = dayjs(session.startDate);
    let now = dayjs();
    let currentElapsed = now.diff(sessionStartTime, "minute"); // Minutes écoulées depuis le début de la session

    // Si l'utilisateur a fait une pause, il faut soustraire la durée de la pause
    if (session.pauseStart) {
      let pauseStartTime = dayjs(session.pauseStart);
      let pauseDuration = now.diff(pauseStartTime, "minute"); // Durée de la pause
      currentElapsed -= pauseDuration;
    }

    // Ajouter le temps écoulé en cours de session au total des épreuves validées
    totalElapsedMinutes += currentElapsed;

    // Calculer le temps restant
    let remainingTime = maxDuration - totalElapsedMinutes;
    remainingTime = remainingTime < 0 ? 0 : remainingTime; // Si le temps restant est négatif, mettre 0

    // Sauvegarder les données de la session dans le profil utilisateur
    const user = await User.findById(participantId);
    if (user) {
      user.lastSessionDuration = totalElapsedMinutes; // Enregistrer la durée passée
      await user.save();
    }

    // Retourner les résultats
    res.json({
      result: true,
      message: "Durée de session calculée",
      totalElapsedMinutes, // Durée totale écoulée
      remainingTime, // Temps restant
      maxDuration, // Durée max du scénario
      sessionStartTime: session.startDate, // Heure de début de la session
      isPaused: !!session.pauseStart, // Vérifier si la session est en pause
    });

  } catch (error) {
    console.error("Erreur dans la route GET /sessionTime :", error);
    res.status(500).json({ result: false, error: "Erreur serveur !" });
  }
});





module.exports = router;