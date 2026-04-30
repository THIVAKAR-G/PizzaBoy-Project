import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleNumber: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Available", "Assigned", "Offline"],
      default: "Available",
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const deliveryPartnerModel =
  mongoose.models.deliveryPartner ||
  mongoose.model("deliveryPartner", deliveryPartnerSchema);

export default deliveryPartnerModel;
