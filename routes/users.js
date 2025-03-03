var express = require('express');
var router = express.Router();
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

// /* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['email','username', 'password'])) 
    {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Vérifie si l'utilisateur n'est pas déjà inscrit
  User.findOne({ username: req.body.username }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        password: hash,
        token: uid2(32),
        totalPoints: null,
        avatar: null,
        scenarios: null,
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
        console.log(newDoc)
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});



router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  
  User.findOne({ email: req.body.email }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
      console.log(data)
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});



// PAGE PROFILE : route pour afficher les infos de l'utilisateur
router.get('/:token', async (req, res) => {
  try {
      const user = await User.findOne({ token: req.params.token })
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

