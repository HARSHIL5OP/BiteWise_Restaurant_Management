const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.get('/order', async (req, res) => {
    try {
        const amount = parseFloat(req.query.amount) || 1; // Default to 1 INR if not specified
        const data = await instance.orders.create({
            "amount": Math.round(amount * 100),
            "currency": "INR",
            "receipt": "ORD_ID_" + Date.now(),
        });
        res.json({
            amount: data.amount,
            orderID: data.id,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", instance.key_secret)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.listen(8080, () => {
    console.log("Server running on port 8080");
});
