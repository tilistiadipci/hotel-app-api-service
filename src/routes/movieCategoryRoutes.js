const router = require("express").Router();
const controller = require("../controllers/movieCategoryController");

// Protected by global apiKeyAuth
router.get("/", controller.getCategories);
router.get("/:uuid/movies", controller.getMoviesByCategory);

module.exports = router;
