const mongoose = require('mongoose');

const etapeEpreuveSchema = mongoose.Schema({
    name: String,
    text: String,
    type: {
        type: String,
        enum: ["qr", "question", "puzzle"] // à alimenter en fonction des types de techno et système de jeux 
    },
    indice: String, 
    indiceUsed: Boolean,
    link: String, // Lien vers une ressource (image, vidéo, etc.) 
    expectedAnswer: String, // Réponse attendue
});

const EtapeEpreuve = mongoose.model('etapeEpreuves', etapeEpreuveSchema);

module.exports = EtapeEpreuve;