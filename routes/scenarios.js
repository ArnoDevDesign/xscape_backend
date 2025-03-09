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

//// ROUTE POST create session by scenario and name :
router.post("/createSession/:scenarioId/:participantId", async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;

    // Vérifier si la session existe déjà
    let session = await Session.findOne({ scenarioId: scenarioId, userId: participantId })
      .populate("currentEpreuve")
      .populate("validatedEpreuves")
      .populate({
        path: "scenario",
        populate: { path: "epreuves", model: "epreuves" },
      });

    if (session) {
      // Si la session existe, on renvoie les infos nécessaires au front pour reprendre la partie
      return res.json({
        result: true,
        message: "Reprise de la session",
        sessionId: session._id,
        scenarioId: session.scenario._id,
        currentEpreuve: session.currentEpreuve,
        validatedEpreuves: session.validatedEpreuves,
      });
    }
    console.log("si une session est tourvée", session);
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
      validatedEpreuves: [], // Aucune épreuve validée au début
      currentEpreuve: scenario.epreuves[0], // Commence avec la première épreuve
      status: "ongoing", // Session en cours
      isSuccess: false,
    });
    console.log("Nouvelle session à créer :", newSession);
    await newSession.save();

    res.json({
      result: true,
      message: "Nouvelle session créée",
      sessionId: newSession._id,
      scenarioId: scenario._id,
      currentEpreuve: scenario.epreuves[0],
      validatedEpreuves: [],
    });

  } catch (error) {
    console.log("Erreur dans la route POST /createSession", error);
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


//// ROUTE GET etapes by scenario and name : COPIE COPIE COPIE
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
// ?? Prévoir  le calcul de la durée de la session pour envoi à la fin du scénario ou la création d'un timer

router.put('/updateScore/:scenarioId/:participantId', async (req, res) => {
  try {
    const { scenarioId, participantId } = req.params;
    const { totalPoints } = req.body; // Score reçu depuis le front
    console.log("Total des points reçu du front", totalPoints);
    // 1️⃣ Récupérer la session avec l'épreuve actuelle
    const session = await Session.findOne({ scenario: scenarioId, participant: participantId })
      .populate("currentEpreuve")
      .populate("validatedEpreuves")
      .populate({
        path: "scenario",
        populate: {
          path: "epreuves",
          model: "epreuves",
        },
      });
    console.log("Session trouvée :", session);
    if (!session || !session.currentEpreuve) {
      return res.status(404).json({ result: false, error: "Session ou épreuve non trouvée" });
    }

    // 2️⃣ Vérifier si l’épreuve est terminée (isSuccess: true)
    if (session.isSuccess) {
      // 3️⃣ Mettre à jour les points de l'épreuve
      await Epreuve.findByIdAndUpdate(session.currentEpreuve._id, { $set: { points: totalPoints } });

      // 4️⃣ Ajouter l'épreuve validée à validatedEpreuves
      session.validatedEpreuves.push(session.currentEpreuve._id);
      console.log("Epreuve validée ajoutée :", session.validatedEpreuves);
      // 5️⃣ Trouver l’épreuve suivante
      const scenario = session.scenario;
      const indexCurrentEpreuve = scenario.epreuves.findIndex(
        (epreuve) => epreuve._id.toString() === session.currentEpreuve._id.toString()
      );

      let nextEpreuve = null;
      if (indexCurrentEpreuve !== -1 && indexCurrentEpreuve < scenario.epreuves.length - 1) {
        nextEpreuve = scenario.epreuves[indexCurrentEpreuve + 1];
      }

      if (nextEpreuve) {
        // 6️⃣ Mettre à jour la session avec la nouvelle épreuve
        session.currentEpreuve = nextEpreuve._id;
        session.isSuccess = false; // Reset pour la prochaine épreuve
        await session.save();

        res.json({
          result: true,
          message: "Score mis à jour et passage à l'épreuve suivante",
          totalPoints,
          nextEpreuve,
        });
      } else {
        // 7️⃣ C'est la DERNIÈRE épreuve -> Marquer le scénario comme terminé pour l'utilisateur
        const user = await User.findOne({ _id: participantId });

        if (user) {
          // Ajouter ce scénario à la liste des scénarios terminés par l'utilisateur
          if (!user.scenarios.includes(scenarioId)) {
            user.scenarios.push(scenarioId);
            await user.save();
          }
        }

        // 8️⃣ Supprimer la session car le scénario est terminé
        await Session.deleteOne({ _id: session._id });

        res.json({
          result: true,
          message: "Scénario terminé et ajouté à l'utilisateur",
          totalPoints,
          scenarioCompleted: scenarioId,
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


module.exports = router;