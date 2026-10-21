const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("👉 MONGO_URI =", process.env.MONGO_URI); // DEBUG

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected ✅");
    } catch (err) {
        console.error("Mongo Error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;