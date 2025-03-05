var express = require('express');
var router = express.Router();
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
// import { v2 as cloudinary } from 'cloudinary';

// /* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});


router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        username: null,
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


// PAGE PROFILE : route pour modifier le username et l'image de l'avatar via le lien en BDD qui fait référence à l'image hébergée sur cloudinary
router.put('/updateProfil', async (req, res) => {
  try {
    const user = await User.findOne({ token: token });
    if (token) {
      console.log(token)
      user.token = req.body.token;
      user.username = req.body.username;
      user.avatar = req.body.avatar;
    }
    // Enregistrement des modifications
    await user.save();

    // Réponse avec les nouvelles données de l'utilisateur
    res.json({ message: 'Profil mis à jour', user });
  } catch (error) {
    res.json({ message: 'Erreur', details: error.message });
  }
})

module.exports = router;
