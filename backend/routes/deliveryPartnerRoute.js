import express from "express";
import {
  createDeliveryPartner,
  listDeliveryPartners,
} from "../controllers/deliveryPartnerController.js";

const deliveryPartnerRouter = express.Router();

deliveryPartnerRouter.get("/list", listDeliveryPartners);
deliveryPartnerRouter.post("/create", createDeliveryPartner);

export default deliveryPartnerRouter;
