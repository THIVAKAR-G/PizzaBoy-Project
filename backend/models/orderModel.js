import mongoose from "mongoose";

const buildTrackingNumber = () =>
  `#${Math.floor(10000000 + Math.random() * 90000000).toString()}`;

const buildInvoiceNumber = () =>
  `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: {
      type: String,
      enum: ["Placed", "Preparing", "Assigned", "On the Way", "Delivered", "Cancelled"],
      default: "Placed",
    },
    statusTimeline: {
      type: [
        {
          status: { type: String, required: true },
          note: { type: String, default: "" },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: () => [{ status: "Placed", note: "Order received", changedAt: new Date() }],
    },
    trackingNumber: { type: String, required: true, unique: true, default: buildTrackingNumber },
    invoiceNumber: { type: String, required: true, unique: true, default: buildInvoiceNumber },
    date: { type: Date, default: Date.now() },
    payment: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ["Online", "COD"], default: "Online" },
    assignedDeliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "deliveryPartner",
      default: null,
    },
    trackingEnabled: { type: Boolean, default: false },
    restaurantLocation: {
      lat: { type: Number, default: 11.017 },
      lng: { type: Number, default: 76.989 },
      label: { type: String, default: "Pizza Boy Kitchen" },
    },
    deliveryTracking: {
      currentLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        updatedAt: { type: Date, default: null },
      },
      startedAt: { type: Date, default: null },
      estimatedDurationMinutes: { type: Number, default: 18 },
      locationHistory: {
        type: [
          {
            lat: Number,
            lng: Number,
            updatedAt: { type: Date, default: Date.now },
          },
        ],
        default: [],
      },
      deliveredAt: { type: Date, default: null },
    },
  },
  { minimize: false }
);

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
