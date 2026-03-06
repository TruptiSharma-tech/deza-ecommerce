import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const count = await User.countDocuments();
        const users = await User.find().select("name email role");
        console.log("TOTAL USERS IN DB:", count);
        console.log("USERS LIST:", users);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
