import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getCurrentUser, googleLogin, loginUser,registerUser } from '../controllers/userController.js';
const userRouter = express.Router();

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);
userRouter.post("/google",googleLogin);
userRouter.get("/me",authMiddleware,getCurrentUser);

export default userRouter;
