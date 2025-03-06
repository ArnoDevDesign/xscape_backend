const express = require("express");
const router = express.Router();
const Scenario = require('../models/scenarios');
const { checkBody } = require("../modules/checkBody");

// // ROUTE GET scenarios listing
router.get("/test", function (req, res, next) {
  res.send("respond with a resource");
});

//ROUTE GET scenarios listing :
router.get("/", (req, res) => {
  Scenario.find().then(data => {
    res.json(data);
    console.log(data.name);
  })
});

//ROUTE GET scenarios by name :
router.get("/:name", (req, res) => {
  if (!checkBody(req.params, ["name"])) {
    res.json({ result: false, error: "Pas de scenario trouvée avec ce nom !" });
    return;
  }
  Scenario.findOne({ name: req.params.name })
    .then(data => {
      res.json(data);
      console.log(data);
    })
});

module.exports = router;