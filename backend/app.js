const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// අපි හදපු User Schema එක මෙතනට ගන්නවා
const User = require('./models/User');

const app = express();

// Middleware (මේවා අනිවාර්යයි)
app.use(cors());
app.use(express.json());

// MongoDB Connection
const URL = process.env.MONGODB_URL;

mongoose.connect(URL)
    .then(() => console.log("SUCCESS: Team Database Connected!"))
    .catch((err) => console.log("DB Connection Error: ", err));

// --- මේවා තමයි අලුත් Routes ---

// 1. Signup Route (අලුත් User කෙනෙක් ඇඩ් කරන්න)
app.post('/signup', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(200).send("User Successfully Saved to Team DB!");
    } catch (err) {
        res.status(400).send("Signup Error: " + err.message);
    }
});

// 2. Login Route (DB එකේ ඉන්න User කෙනෙක්ව check කරන්න)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.status(200).send("SUCCESS: Login Successful!");
        } else {
            res.status(401).send("FAILED: Invalid Username or Password.");
        }
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});