const mongoose = require('mongoose');

const scenarioSchema = mongoose.Schema({
    geolocalisation: {
        latitude: Number,
        longitude: Number
    },
    name: String,
    texteNotification: String,
    description: String,
    resumeDescription: String,
    theme: String,
    duree: [Number], // [heures, minutes, secondes]
    nbDeLike: Number,
    // notesJoueurs: Number,
    // noteMoyenne: Number,
    epreuves: [{ type: mongoose.Schema.Types.ObjectId, ref: "Epreuve" }], // Épreuves du scénario
});

const Scenario = mongoose.model('scenarios', scenarioSchema);

module.exports = Scenario;