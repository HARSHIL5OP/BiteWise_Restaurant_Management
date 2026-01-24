import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import crypto from "crypto";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Razorpay instance
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 IMPORTANT: root test
app.get("/", (req, res) => {
    res.json({ status: "API working" });
});

// 🔹 ORDER ROUTE → /api/order
app.get("/api/order", async (req, res) => {
    try {
        const amount = Number(req.query.amount || 1);

        const order = await instance.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: "ORD_" + Date.now(),
        });

        res.status(200).json({
            amount: order.amount,
            orderID: order.id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Order creation failed" });
    }
});

// 🔹 VERIFY ROUTE → /api/verify
app.post("/api/verify", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        if (expectedSign === razorpay_signature) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Verification failed" });
    }
});

// ❗ CRITICAL FOR VERCEL
export default app;
