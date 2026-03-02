const router = require("express").Router();
const controller = require("../controllers/movieController");

// Protected by global apiKeyAuth
router.get("/", controller.getMovies);
router.get("/:uuid", controller.getMovieDetail);

module.exports = router;
