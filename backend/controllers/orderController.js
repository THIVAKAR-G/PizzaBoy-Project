import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import deliveryPartnerModel from "../models/deliveryPartnerModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const buildTrackingNumber = () =>
  `#${Math.floor(10000000 + Math.random() * 90000000).toString()}`;

const buildInvoiceNumber = () =>
  `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const normalizeOrderStatus = (status = "") => {
  const normalized = String(status).trim();

  switch (normalized) {
    case "Food Processing":
      return "Preparing";
    case "Out for Delivery":
      return "On the Way";
    default:
      return normalized || "Placed";
  }
};

const geocodeOrderAddress = async (address = {}) => {
  const queryCandidates = [
    [
      address.street,
      address.zipcode,
      "Coimbatore",
      "Tamil Nadu",
      "India",
    ],
    [
      address.street,
      "Coimbatore",
      "Tamil Nadu",
      "India",
    ],
    [
      address.street,
      address.zipcode,
      "Tamil Nadu",
      "India",
    ],
    [
      address.zipcode,
      "Coimbatore",
      "Tamil Nadu",
      "India",
    ],
    [
      address.formattedAddress,
    ],
  ]
    .map((parts) => parts.filter(Boolean).join(", ").trim())
    .filter(Boolean);

  if (!queryCandidates.length) {
    return null;
  }

  try {
    for (const query of queryCandidates) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=in&q=${encodeURIComponent(query)}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "PizzaBoyDelivery/1.0",
          },
        }
      );

      if (!response.ok) {
        continue;
      }

      const results = await response.json();
      const match = (results || []).find((result) => result?.lat && result?.lon);

      if (!match) {
        continue;
      }

      return {
        lat: Number(match.lat),
        lng: Number(match.lon),
        formattedAddress: match.display_name || query,
      };
    }

    return null;
  } catch (error) {
    console.log("Geocoding failed", error);
    return null;
  }
};

const reverseGeocodeCoordinates = async ({ lat, lng }) => {
  if (lat == null || lng == null) {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "PizzaBoyDelivery/1.0",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const address = result?.address || {};
    const displayName = result?.display_name || "";
    const postcodeMatch = displayName.match(/\b\d{6}\b/);
    const fallbackStreet = displayName
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");

    return {
      street:
        address.road ||
        address.suburb ||
        address.neighbourhood ||
        address.residential ||
        address.village ||
        address.town ||
        fallbackStreet,
      zipcode: address.postcode || postcodeMatch?.[0] || "",
      displayName,
      lat: Number(lat),
      lng: Number(lng),
    };
  } catch (error) {
    console.log("Reverse geocoding failed", error);
    return null;
  }
};

const calculateDistanceKm = (start, end) => {
  if (!start?.lat || !start?.lng || !end?.lat || !end?.lng) {
    return 0;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(end.lat - start.lat);
  const dLng = toRad(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const interpolateLocation = (start, end, progress) => ({
  lat: Number((start.lat + (end.lat - start.lat) * progress).toFixed(6)),
  lng: Number((start.lng + (end.lng - start.lng) * progress).toFixed(6)),
  updatedAt: new Date(),
});

const buildEstimatedDurationMinutes = (order) => {
  const distanceKm = calculateDistanceKm(order.restaurantLocation, order.address?.location);
  const minutes = Math.round(distanceKm * 4.5);
  return Math.min(Math.max(minutes, 8), 35);
};

const ensureLegacyOrderFields = (order) => {
  order.status = normalizeOrderStatus(order.status);

  if (!order.trackingNumber) {
    order.trackingNumber = buildTrackingNumber();
  }

  if (!order.invoiceNumber) {
    order.invoiceNumber = buildInvoiceNumber();
  }

  if (!Array.isArray(order.statusTimeline) || order.statusTimeline.length === 0) {
    order.statusTimeline = [
      {
        status: normalizeOrderStatus(order.status || "Placed"),
        note: "Order received",
        changedAt: order.date || new Date(),
      },
    ];
  } else {
    order.statusTimeline = order.statusTimeline.map((entry) => ({
      ...entry,
      status: normalizeOrderStatus(entry.status),
    }));
  }

  if (!order.restaurantLocation?.lat || !order.restaurantLocation?.lng) {
    order.restaurantLocation = {
      lat: 11.017,
      lng: 76.989,
      label: "Pizza Boy Kitchen",
    };
  }

  if (!order.deliveryTracking) {
    order.deliveryTracking = {};
  }

  if (!order.deliveryTracking.currentLocation?.lat || !order.deliveryTracking.currentLocation?.lng) {
    order.deliveryTracking.currentLocation = {
      lat: order.restaurantLocation.lat,
      lng: order.restaurantLocation.lng,
      updatedAt: new Date(),
    };
  }

  if (!Array.isArray(order.deliveryTracking.locationHistory)) {
    order.deliveryTracking.locationHistory = [];
  }

  if (!order.deliveryTracking.estimatedDurationMinutes) {
    order.deliveryTracking.estimatedDurationMinutes = buildEstimatedDurationMinutes(order);
  }
};

const hydrateOrderTrackingData = async (order) => {
  ensureLegacyOrderFields(order);
  let changed = false;

  if (
    (!order.address?.location?.lat || !order.address?.location?.lng) &&
    (order.address?.street || order.address?.zipcode)
  ) {
    const resolvedLocation = await geocodeOrderAddress(order.address);

    if (resolvedLocation) {
      order.address = {
        ...order.address,
        location: {
          lat: resolvedLocation.lat,
          lng: resolvedLocation.lng,
        },
        formattedAddress: order.address.formattedAddress || resolvedLocation.formattedAddress,
      };
      changed = true;
    }
  }

  if (!order.deliveryTracking.currentLocation?.lat || !order.deliveryTracking.currentLocation?.lng) {
    order.deliveryTracking.currentLocation = {
      lat: order.restaurantLocation.lat,
      lng: order.restaurantLocation.lng,
      updatedAt: new Date(),
    };
    changed = true;
  }

  if (order.deliveryTracking.locationHistory.length === 0) {
    order.deliveryTracking.locationHistory.push({
      lat: order.deliveryTracking.currentLocation.lat,
      lng: order.deliveryTracking.currentLocation.lng,
      updatedAt: order.deliveryTracking.currentLocation.updatedAt || new Date(),
    });
    changed = true;
  }

  if (
    order.assignedDeliveryPartner &&
    order.address?.location?.lat &&
    order.address?.location?.lng &&
    order.status !== "Delivered" &&
    (order.trackingEnabled || order.status === "Assigned" || order.status === "On the Way")
  ) {
    if (!order.trackingEnabled) {
      order.trackingEnabled = true;
      changed = true;
    }

    if (!order.deliveryTracking.startedAt) {
      order.deliveryTracking.startedAt = new Date();
      changed = true;
    }

    if (!order.deliveryTracking.estimatedDurationMinutes) {
      order.deliveryTracking.estimatedDurationMinutes = buildEstimatedDurationMinutes(order);
      changed = true;
    }

    const startedAtTime = new Date(order.deliveryTracking.startedAt).getTime();
    const durationMs = order.deliveryTracking.estimatedDurationMinutes * 60 * 1000;
    const elapsedMs = Math.max(Date.now() - startedAtTime, 0);
    const progress = Math.min(elapsedMs / durationMs, 1);
    const nextLocation = interpolateLocation(
      order.restaurantLocation,
      order.address.location,
      progress
    );

    if (
      !order.deliveryTracking.currentLocation?.lat ||
      !order.deliveryTracking.currentLocation?.lng ||
      Math.abs(order.deliveryTracking.currentLocation.lat - nextLocation.lat) > 0.00005 ||
      Math.abs(order.deliveryTracking.currentLocation.lng - nextLocation.lng) > 0.00005
    ) {
      order.deliveryTracking.currentLocation = nextLocation;
      order.deliveryTracking.locationHistory.push(nextLocation);
      changed = true;
    }

    if (progress > 0 && order.status === "Assigned") {
      appendStatusTimeline(order, "On the Way", "Delivery rider is moving to your location");
      changed = true;
    }

    if (progress >= 1 && order.status !== "Delivered") {
      appendStatusTimeline(order, "Delivered", "Order delivered automatically");
      order.trackingEnabled = false;
      order.payment = true;
      order.deliveryTracking.deliveredAt = new Date();
      changed = true;

      if (order.assignedDeliveryPartner?._id || order.assignedDeliveryPartner) {
        const partnerId = order.assignedDeliveryPartner?._id || order.assignedDeliveryPartner;
        await deliveryPartnerModel.findByIdAndUpdate(partnerId, {
          status: "Available",
          currentLocation: nextLocation,
        });
      }
    }
  }

  return changed;
};

const emitOrderEvent = (req, order) => {
  const io = req.app.get("io");
  if (!io) return;

  io.to(`order:${order._id}`).emit("order:updated", order);
  io.emit("admin:orders-updated", order);
};

const appendStatusTimeline = (order, status, note = "") => {
  const normalizedStatus = normalizeOrderStatus(status);
  order.status = normalizedStatus;
  order.statusTimeline.push({
    status: normalizedStatus,
    note,
    changedAt: new Date(),
  });
};

const ensureAssignedDeliveryPartner = async (order) => {
  if (!order?.assignedDeliveryPartner) {
    return order;
  }

  const assignedPartner = order.assignedDeliveryPartner;

  if (assignedPartner?.name) {
    return order;
  }

  const partnerId = assignedPartner?._id || assignedPartner;

  if (!partnerId) {
    return order;
  }

  const partner = await deliveryPartnerModel
    .findById(partnerId)
    .select("name phone vehicleNumber status currentLocation");

  if (partner) {
    order.assignedDeliveryPartner = partner;
  }

  return order;
};

const populateOrder = async (query) =>
  query.populate("assignedDeliveryPartner", "name phone vehicleNumber status currentLocation");

const placeOrder = async (req, res) => {
  try {
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
      paymentMethod: req.body.paymentMethod || "Online",
      trackingNumber: buildTrackingNumber(),
      invoiceNumber: buildInvoiceNumber(),
      deliveryTracking: {
        currentLocation: {
          lat: 11.017,
          lng: 76.989,
          updatedAt: new Date(),
        },
        estimatedDurationMinutes: 18,
        locationHistory: [
          {
            lat: 11.017,
            lng: 76.989,
            updatedAt: new Date(),
          },
        ],
      },
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    if (req.body.paymentMethod === "COD") {
      newOrder.payment = false;
      await newOrder.save();
      return res.json({ success: true, message: "Order placed successfully", orderId: newOrder._id });
    }

    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Charge",
        },
        unit_amount: 35 * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `http://localhost:5173/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `http://localhost:5173/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await populateOrder(orderModel.find({}).sort({ date: -1 }));
    await Promise.all(
      orders.map(async (order) => {
        const changed = await hydrateOrderTrackingData(order);
        await ensureAssignedDeliveryPartner(order);
        if (changed) {
          await order.save();
        }
      })
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await populateOrder(
      orderModel.find({ userId: req.body.userId }).sort({ date: -1 })
    );
    await Promise.all(
      orders.map(async (order) => {
        const changed = await hydrateOrderTrackingData(order);
        await ensureAssignedDeliveryPartner(order);
        if (changed) {
          await order.save();
        }
      })
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status, note = "" } = req.body;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    await hydrateOrderTrackingData(order);
    appendStatusTimeline(order, normalizeOrderStatus(status), note);

    if (status === "Delivered") {
      order.payment = true;
      order.trackingEnabled = false;
      order.deliveryTracking.deliveredAt = new Date();
      if (order.assignedDeliveryPartner) {
        await deliveryPartnerModel.findByIdAndUpdate(order.assignedDeliveryPartner, {
          status: "Available",
        });
      }
    }

    await order.save();
    const populatedOrder = await orderModel.findById(order._id).populate(
      "assignedDeliveryPartner",
      "name phone vehicleNumber status currentLocation"
    );
    emitOrderEvent(req, populatedOrder);

    res.json({ success: true, message: "Status Updated", data: populatedOrder });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    await hydrateOrderTrackingData(order);
    order.payment = true;
    await order.save();
      return res.json({ success: true, message: "Paid" });
    }

    await orderModel.findByIdAndDelete(orderId);
    res.json({ success: false, message: "Not Paid" });
  } catch (error) {
    res.json({ success: false, message: "Not Verified" });
  }
};

const assignDeliveryPartner = async (req, res) => {
  try {
    const { orderId, deliveryPartnerId } = req.body;
    const order = await orderModel.findById(orderId);
    const deliveryPartner = await deliveryPartnerModel.findById(deliveryPartnerId);

    if (!order || !deliveryPartner) {
      return res.json({ success: false, message: "Order or delivery partner not found" });
    }

    await hydrateOrderTrackingData(order);
    order.assignedDeliveryPartner = deliveryPartnerId;
    if (order.status === "Placed" || order.status === "Preparing") {
      appendStatusTimeline(order, "Assigned", `Assigned to ${deliveryPartner.name}`);
    }
    order.trackingEnabled = true;
    order.deliveryTracking.startedAt = new Date();
    order.deliveryTracking.estimatedDurationMinutes = buildEstimatedDurationMinutes(order);
    order.deliveryTracking.currentLocation = {
      lat: order.restaurantLocation.lat,
      lng: order.restaurantLocation.lng,
      updatedAt: new Date(),
    };
    order.deliveryTracking.locationHistory = [
      ...(order.deliveryTracking.locationHistory || []),
      {
        lat: order.restaurantLocation.lat,
        lng: order.restaurantLocation.lng,
        updatedAt: new Date(),
      },
    ];
    await order.save();

    deliveryPartner.status = "Assigned";
    await deliveryPartner.save();

    const populatedOrder = await orderModel.findById(order._id).populate(
      "assignedDeliveryPartner",
      "name phone vehicleNumber status currentLocation"
    );
    emitOrderEvent(req, populatedOrder);

    res.json({ success: true, data: populatedOrder });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to assign delivery partner" });
  }
};

const toggleTracking = async (req, res) => {
  try {
    const { orderId, enabled } = req.body;
    const order = await orderModel.findById(orderId).populate(
      "assignedDeliveryPartner",
      "name phone vehicleNumber status currentLocation"
    );

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    await hydrateOrderTrackingData(order);
    order.trackingEnabled = Boolean(enabled);

    if (enabled && order.status !== "On the Way" && order.status !== "Delivered") {
      appendStatusTimeline(order, "On the Way", "Delivery tracking started");
    }

    if (enabled && !order.deliveryTracking.startedAt) {
      order.deliveryTracking.startedAt = new Date();
      order.deliveryTracking.estimatedDurationMinutes = buildEstimatedDurationMinutes(order);
    }

    await order.save();
    emitOrderEvent(req, order);

    res.json({ success: true, data: order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to update tracking state" });
  }
};

const updateTrackingLocation = async (req, res) => {
  try {
    const { orderId, lat, lng } = req.body;
    const order = await orderModel.findById(orderId).populate(
      "assignedDeliveryPartner",
      "name phone vehicleNumber status currentLocation"
    );

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    await hydrateOrderTrackingData(order);
    const nextPoint = {
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: new Date(),
    };

    order.deliveryTracking.currentLocation = nextPoint;
    order.deliveryTracking.locationHistory.push(nextPoint);
    order.trackingEnabled = true;
    if (order.status !== "On the Way" && order.status !== "Delivered") {
      appendStatusTimeline(order, "On the Way", "Delivery partner started moving");
    }
    await order.save();

    if (order.assignedDeliveryPartner?._id) {
      await deliveryPartnerModel.findByIdAndUpdate(order.assignedDeliveryPartner._id, {
        currentLocation: nextPoint,
        status: "Assigned",
      });
    }

    emitOrderEvent(req, order);
    const changed = await hydrateOrderTrackingData(order);
    if (changed) {
      await order.save();
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to update location" });
  }
};

const getTrackingDetails = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.orderId).populate(
      "assignedDeliveryPartner",
      "name phone vehicleNumber status currentLocation"
    );

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    await ensureAssignedDeliveryPartner(order);
    res.json({ success: true, data: order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to fetch tracking details" });
  }
};

const getInvoiceData = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.orderId).populate(
      "assignedDeliveryPartner",
      "name phone vehicleNumber"
    );

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    const changed = await hydrateOrderTrackingData(order);
    await ensureAssignedDeliveryPartner(order);
    if (changed) {
      await order.save();
    }

    res.json({
      success: true,
      data: {
        invoiceNumber: order.invoiceNumber,
        trackingNumber: order.trackingNumber,
        status: order.status,
        date: order.date,
        deliveredAt: order.deliveryTracking?.deliveredAt || null,
        amount: order.amount,
        paymentMethod: order.paymentMethod,
        items: order.items,
        address: order.address,
        deliveryPartner: order.assignedDeliveryPartner,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to fetch invoice data" });
  }
};

const geocodeAddressForCheckout = async (req, res) => {
  try {
    const result = await geocodeOrderAddress(req.body || {});

    if (!result) {
      return res.json({ success: false, message: "Unable to resolve address" });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to geocode address" });
  }
};

const reverseGeocodeForCheckout = async (req, res) => {
  try {
    const { lat, lng } = req.body || {};
    const result = await reverseGeocodeCoordinates({ lat, lng });

    if (!result) {
      return res.json({ success: false, message: "Unable to resolve coordinates" });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to reverse geocode coordinates" });
  }
};

export {
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
};
