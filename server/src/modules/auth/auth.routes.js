const express = require("express");
const { register, login, me } = require("./auth.controller");
const { requireAuth } = require("../../middleware/auth");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);

module.exports = { authRouter };
