import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { OAuth2Client } from "google-auth-library";
import userModel from "../models/userModel.js";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getCurrentUser = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).select("name email");

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        if (!user.password) {
            return res.json({ success: false, message: "This account uses Google sign-in" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user._id);
        res.json({ success: true, token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            authProvider: "local",
        });
        const user = await newUser.save();
        const token = createToken(user._id);
        res.json({ success: true, token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const googleLogin = async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.json({ success: false, message: "Google credential is required" });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload?.email) {
            return res.json({ success: false, message: "Unable to get Google account details" });
        }

        let user = await userModel.findOne({ email: payload.email });

        if (!user) {
            user = await userModel.create({
                name: payload.name || payload.email.split("@")[0],
                email: payload.email,
                password: null,
                authProvider: "google",
                googleId: payload.sub,
            });
        } else {
            user.googleId = payload.sub;
            if (!user.name) {
                user.name = payload.name || payload.email.split("@")[0];
            }
            if (!user.password) {
                user.authProvider = "google";
            }
            await user.save();
        }

        const token = createToken(user._id);
        res.json({ success: true, token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Google authentication failed" });
    }
};

export { loginUser, registerUser, googleLogin, getCurrentUser };
