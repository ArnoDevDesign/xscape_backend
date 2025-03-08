const mongoose = require('mongoose');

const scenarioSchema = mongoose.Schema({
    geolocalisation: {
        latitude: Number,
        longitude: Number
    },
    name: String,
    notification: String,
    infoScenario: String,
    introScenario: String,
    descriptionScenario: String,
    conclusionScenario: String,
    theme: String,
    duree: Number,
    nbDeLike: Number,
    difficulte: String,
    // notesJoueurs: Number,
    // noteMoyenne: Number,
    epreuves: [{ type: mongoose.Schema.Types.ObjectId, ref: "epreuves" }], // Épreuves du scénario
});

const Scenario = mongoose.model('scenarios', scenarioSchema);

module.exports = Scenario;