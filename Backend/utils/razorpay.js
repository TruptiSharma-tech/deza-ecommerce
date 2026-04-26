import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SdJA8ZBmvE42IN",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "c7vWYCsia23VKeyiXnWKkzn4",
});

export default razorpay;
