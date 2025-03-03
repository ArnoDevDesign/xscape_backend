const mongoose = require('mongoose');

const commentaireSchema = mongoose.Schema({
    joueur: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: "Scenario" },
    note: {
        type: Number,
        min: 1, max: 3
    }, // Note sur 3 étoiles
    message: String, // Commentaire du joueur 
    date: { type: Date, default: Date.now },
});

const Commentaire = mongoose.model('commentaires', commentaireSchema);

module.exports = Commentaire;