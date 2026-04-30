import deliveryPartnerModel from "../models/deliveryPartnerModel.js";

const defaultPartners = [
  { name: "Arun Kumar", phone: "9876543210", vehicleNumber: "TN 38 AB 1024" },
  { name: "Vikram S", phone: "9876501234", vehicleNumber: "TN 38 CP 2211" },
  { name: "Rahul Das", phone: "9876512345", vehicleNumber: "TN 37 DK 4512" },
];

const listDeliveryPartners = async (req, res) => {
  try {
    const count = await deliveryPartnerModel.countDocuments();

    if (count === 0) {
      await deliveryPartnerModel.insertMany(defaultPartners);
    }

    const partners = await deliveryPartnerModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: partners });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to fetch delivery partners" });
  }
};

const createDeliveryPartner = async (req, res) => {
  try {
    const { name, phone, vehicleNumber } = req.body;

    const partner = await deliveryPartnerModel.create({
      name,
      phone,
      vehicleNumber,
    });

    res.json({ success: true, data: partner });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Unable to create delivery partner" });
  }
};

export { listDeliveryPartners, createDeliveryPartner };
