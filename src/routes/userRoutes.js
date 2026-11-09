const { Router } = require("express");
const controller = require("../controllers/userController");
const auth = require("../middleware/auth");

const router = Router();

// Cadastro e login ficam abertos: sem eles ninguém conseguiria obter um token
router.post("/token", controller.token);
router.post("/", controller.store);

router.get("/:id", controller.show);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.destroy);

module.exports = router;
