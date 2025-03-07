const mongoose = require('mongoose');

const epreuveSchema = mongoose.Schema({
    name: String,
    descriptionEpreuve: String,
    difficulte: String, //à connecter avec la difficulté du scénario
    points: Number, 
    etapes: [{ type: mongoose.Schema.Types.ObjectId, ref: "etapes" }], // Étapes de l’épreuve
});

const Epreuve = mongoose.model('epreuves', epreuveSchema);

module.exports = Epreuve;