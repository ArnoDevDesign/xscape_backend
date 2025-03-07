const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema({
    participant: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, // Joueur
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: "scenarios" }, // Scénario joué
    validatedEpreuves: [String], // Épreuves validées
    currentEpreuve: { type: mongoose.Schema.Types.ObjectId, ref: "epreuves" }, // Épreuve en cours
    status: {
        type: String,
        enum: ["ongoing", "completed", "paused"]
    },
    isSuccess: Boolean, // Victoire ou non
});

const Session = mongoose.model('sessions', sessionSchema);

module.exports = Session;