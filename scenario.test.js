Nous voulons tester la route qui permet de récupérer les informations d'un scénario.
afin de pouvoir afficher les markers sur la carte et récupérer les informations des scenarios
Nous allons donc tester la route GET /scenario

const request = require('supertest');
const app = require('./app');
const Scenario = require('../models/scenarios');

it('GET /scenario', async () => {
    const res = await request(app).get('/scenarios');
   
    expect(res.statusCode).toBe(200);
    expect(res.body.stock).toEqual([
        {
          "geolocalisation": {
            "latitude": 48.8795,
            "longitude": 2.309
          },
          "epreuves": [],
          "_id": "67c89b3211fe5eeab54f1ecb",
          "conclusionScenario": "Dans un dernier effort, vous reconnectez les câbles de la capsule et enclenchez le reset. Une lumière éclatante envahit l’open-space… puis tout redevient normal. Plus de failles, plus d’époques entremêlées… sauf peut-être ce fax des années 80 qui traîne encore sur une table. Joachim jure de ne plus toucher à la capsule temporelle… mais on le connaît, ce n’est qu’une question de temps avant qu’il ne recommence !",
          "descriptionScenario": "La capsule s'est activée toute seule, a rétréci et s’est perdue dans l’open-space. Problème : Elle émet un signal capté par des extraterrestres pas franchement amicaux… Vous avez 30 minutes avant qu’ils ne débarquent et transforment votre bureau en élevage de blobs galactiques ! Votre mission : retrouver la capsule, l’agrandir et stopper l’invasion !",
          "duree": 30,
          "infoScenario": "Une expérimentation a dégénéré… et le chaos s’installe ! ",
          "introScenario": "Retrouvez une capsule rétrécie avant l’arrivée d’extraterrestres hostiles.",
          "name": "La Capsule Perdue",
          "nbDeLike": 666,
          "notification": "Une expérience a mal tourné... et maintenant, tout est hors de contrôle !",
          "theme": "Science-fiction",
          "difficulte": "Facile"
        },
      ]);
});