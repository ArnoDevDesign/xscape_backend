const express = require("express");
const router = express.Router();
const Scenario = require('../models/scenarios');
const { checkBody } = require("../modules/checkBody");

// // ROUTE GET scenarios listing
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

//ROUTE GET scenarios listing :
router.get("/test", (req, res) => {
    Scenario.find().then(data => {
      res.json(data);
  })
});


  // ROUTE  : route pour créer un nouveau scénario
// router.post("/create", (req, res) => {
//     if (!checkBody(req.body, ["title", "description", "author", "difficulty", "duration", "epreuves"])) {
//       res.json({ result: false, error: "Missing or empty fields" });
//       return;
//     }
//     const newScenario = new Scenario({
//       title: req.body.title,
//       description: req.body.description,


// router.post("/newScenario", (req, res) => {
//     if (!checkBody(req.body, ["email", "password"])) {
//       res.json({ result: false, error: "Missing or empty fields" });
//       return;
//     }
//     User.findOne({ email: req.body.email }).then((data) => {
//       if (data) {
//         res.json({ result: false, error: "User already exists" });
//       } else {
//         const newUser = new User({
//           username: null,
//           email: req.body.email,
//           password: bcrypt.hashSync(req.body.password, 10),
//           token: uid2(32),
//           totalPoints: 0,
//           avatar: null,
//           scenarios: [],
//         });
//         newUser.save().then((data) => {
//           res.json({ result: true, token: data.token });
//         });
//       }
//     })
//   });


    // geolocalisation: {
    //     latitude: Number,
    //     longitude: Number
    // },
    // name: String,
    // texteNotification: String,
    // description: String,
    // resumeDescription: String,
    // theme: String,
    // duree: [Number], // [heures, minutes, secondes]
    // nbDeLike: Number,
    // // notesJoueurs: Number,
    // // noteMoyenne: Number,
    // epreuves: [{ type: mongoose.Schema.Types.ObjectId, ref: "Epreuve" }], // Épreuves du scénario

    module.exports = router;