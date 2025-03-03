const mongoose = require('mongoose');

const epreuveSchema = mongoose.Schema({
    name: String,
    difficulte: Number, 
    points: Number, 
    etapeEpreuve: [{ type: mongoose.Schema.Types.ObjectId, ref: "EtapeEpreuve" }], // Étapes de l’épreuve
});

const Epreuve = mongoose.model('epreuves', epreuveSchema);

module.exports = Epreuve;