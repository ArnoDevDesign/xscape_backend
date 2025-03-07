const request = require('supertest');
const app = require('../app');
const Scenario = require('../models/scenarios');

//Test route GET des données des collections schémas de jeux : 
// sessions, épreuves et étapes épreuves

// Données en dur pour les tests :
const dataBDD = {
    _id: "67c99f0ee8a286da20ae480f",
    participant: "67c5fc2b16905edcd7e37291",
    startDate: "2024-03-01T10:00:00.000Z",
    endDate: "2024-03-01T11:30:00.000Z",
    scenario: "67c89b3211fe5eeab54f1ecb",
    validatedEpreuves: [],
    currentEpreuve: {
      _id: "67c9d02310fb029639e5b675",
      name: "frequence radio",
      difficulte: "facile",
      points: 300,
      descriptionEpreuve: "Alerte ! Ici Joachim ! Mauvaise nouvelle... La capsule a activé un champ magnétique qui brouille les communications ! J’ai essayé d’envoyer un message, mais il est totalement distordu. Vous devez retrouver la bonne fréquence pour que je puisse vous parler et vous guider !",
      etapeEpreuves: [
        {
          name: "fréquence 1",
          text: "",
          type: "question",
          indice: "the frequence is 88.9",
          indiceUsed: "false",
          link: "",
          expectedAnswer: "98.8",
        },
      ],
    },
    status: "pending",
    isSuccess: true,
}

//Test de la route GET /sessions/:scenarioId/:participantId 
it('GET /sessions/:scenarioId/:participantId', async () => {
    const res = await request(app)
    .get(`/etapesEpreuves/67c89b3211fe5eeab54f1ecb/67c5fc2b16905edcd7e37291`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(dataBDD);
});
