var express = require('express');
var router = express.Router();
const User = require('../models/users');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// route pour afficher les infos de l'utilisateur dans la page profile
router.get('/:username', async (req, res) => {
  try {
      const user = await User.findOne({ username: req.params.username })
          // récupère les scénario associés au username via la clé étrangère "scenario"
          // .populate('scenarios', 'name')
          // Sélection des champs nécessaires dont les infos doivent être remontés
          .select('username email totalPoints scenarios avatar'); 
      // vérifie si un utilisateur existe
      if (!user) {
          return res.json({ message: 'Utilisateur non trouvé' });
      }

      res.json(user);
  } catch (error) {
      res.json({ message: 'Erreur', details: error.message });
  }
});










module.exports = router;

