import express  from "express"
import http from "http"
import cors from 'cors'
import { Server } from "socket.io"
import { connectDB } from "./config/db.js"
import userRouter from "./routes/userRoute.js"
import foodRouter from "./routes/foodRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import deliveryPartnerRouter from "./routes/deliveryPartnerRoute.js"

// app config
const app = express()
const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});


// middlewares
app.use(express.json())
app.use(cors())
app.set("io", io);

// db connection
connectDB()

io.on("connection", (socket) => {
    socket.on("order:join", (orderId) => {
        socket.join(`order:${orderId}`);
    });

    socket.on("order:leave", (orderId) => {
        socket.leave(`order:${orderId}`);
    });
});

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/food", foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/cart", cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/delivery-partner", deliveryPartnerRouter)

app.get("/", (req, res) => {
    res.send("API Working")
  });

server.listen(port, () => console.log(`Server started on http://localhost:${port}`))
