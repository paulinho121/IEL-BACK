const { Router } = require("express");
const controller = require("../controllers/productController");
const auth = require("../middleware/auth");

const router = Router();

router.get("/search", controller.search);
router.get("/:id", controller.show);
router.post("/", auth, controller.store);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.destroy);

module.exports = router;
