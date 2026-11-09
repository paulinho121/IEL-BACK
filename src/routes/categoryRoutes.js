const { Router } = require("express");
const controller = require("../controllers/categoryController");
const auth = require("../middleware/auth");

const router = Router();

// "/search" vem antes de "/:id" para não ser confundido com um id
router.get("/search", controller.search);
router.get("/:id", controller.show);
router.post("/", auth, controller.store);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.destroy);

module.exports = router;
