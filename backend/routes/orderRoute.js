import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  assignDeliveryPartner,
  geocodeAddressForCheckout,
  getInvoiceData,
  getTrackingDetails,
  listOrders,
  placeOrder,
  reverseGeocodeForCheckout,
  toggleTracking,
  updateStatus,
  updateTrackingLocation,
  userOrders,
  verifyOrder,
} from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.get("/list",listOrders);
orderRouter.get("/tracking/:orderId", authMiddleware, getTrackingDetails);
orderRouter.get("/invoice/:orderId", authMiddleware, getInvoiceData);
orderRouter.post("/geocode", authMiddleware, geocodeAddressForCheckout);
orderRouter.post("/reverse-geocode", authMiddleware, reverseGeocodeForCheckout);
orderRouter.post("/userorders",authMiddleware,userOrders);
orderRouter.post("/place",authMiddleware,placeOrder);
orderRouter.post("/status",updateStatus);
orderRouter.post("/assign", assignDeliveryPartner);
orderRouter.post("/tracking/toggle", toggleTracking);
orderRouter.post("/tracking/location", updateTrackingLocation);
orderRouter.post("/verify",verifyOrder);

export default orderRouter;
