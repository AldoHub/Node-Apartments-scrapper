const express = require("express");
const router = express.Router();
const apartmentsController = require("../controllers/apartmentsController");

router.get("/", apartmentsController.getApartments);

module.exports = router;