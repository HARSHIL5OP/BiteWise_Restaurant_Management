import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Groq instance
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Razorpay instance
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 IMPORTANT: root test
app.get("/", (req, res) => {
    res.json({ status: "API working" });
});

// 🔹 ORDER ROUTE → /order
app.get("/order", async (req, res) => {
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

// 🔹 VERIFY ROUTE → /verify
app.post("/verify", async (req, res) => {
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

// 🔹 AI INGREDIENT SUGGESTION ROUTE → /api/ai/suggest-ingredients
app.post("/api/ai/suggest-ingredients", async (req, res) => {
    try {
        const { dishName } = req.body;
        
        if (!dishName) {
            return res.status(400).json({ error: "Dish name is required" });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: 'You are a professional chef assistant. Suggest ingredients with approximate quantities. Return a valid JSON object with an "ingredients" array. Example: { "ingredients": [{"name": "chicken", "quantity": "500g"}] }'
                },
                {
                    role: "user",
                    content: `Give ingredients for dish: ${dishName} in JSON format.`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        const responseContent = chatCompletion.choices[0]?.message?.content;
        const parsed = JSON.parse(responseContent);
        
        res.json(parsed.ingredients || []);
    } catch (err) {
        console.error("AI Suggestion Error:", err);
        res.status(500).json({ error: "Failed to generate AI suggestion" });
    }
});

app.listen(8080, () => {
    console.log("Server running on port 8080");
});
