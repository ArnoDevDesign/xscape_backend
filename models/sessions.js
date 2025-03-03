const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema({
    participant: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Joueur
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: "Scenario" }, // Scénario joué
    validatedEpreuves: [{ type: mongoose.Schema.Types.ObjectId, ref: "Epreuve" }], // Épreuves validées
    currentEpreuve: { type: mongoose.Schema.Types.ObjectId, ref: "Epreuve" }, // Épreuve en cours
    status: {
        type: String,
        enum: ["ongoing", "completed", "paused"]
    },
    isSuccess: Boolean, // Victoire ou non
});

const Session = mongoose.model('sessions', sessionSchema);

module.exports = Session;