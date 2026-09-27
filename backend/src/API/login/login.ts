import express from "express";
import { login, googleLogin } from "../../Application/login/login";
import { authenticateToken, authorizeRole } from "../../middleware/authentication";

const loginRouter = express.Router();

loginRouter.route("/login").post(login);
loginRouter.route("/login/google").post(googleLogin);

export default loginRouter;