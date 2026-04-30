import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    cartData:{type:Object,default:{}},
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null }
}, { minimize: false })

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
