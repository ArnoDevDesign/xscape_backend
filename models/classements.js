const mongoose = require('mongoose');

const classementSchema = mongoose.Schema({
    joueur: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: "Scenario" },
    score: Number,
    temps: Number, // Temps en secondes (le plus court est le meilleur) 
    date: {
        type: Date,
        default: Date.now
    },
});

const Classement = mongoose.model('classements', classementSchema);

module.exports = Classement;