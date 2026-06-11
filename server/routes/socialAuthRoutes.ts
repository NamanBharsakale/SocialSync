import express from "express";
import { generateAuthUrl, syncsAccounts } from "../controllers/socialAuthController.js";

const socialAuthRouter = express.Router()

socialAuthRouter.get("/:platform/url",generateAuthUrl)


socialAuthRouter.get("/sync",syncsAccounts)


export default socialAuthRouter;








