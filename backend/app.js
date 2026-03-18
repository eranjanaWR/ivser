const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// take .env file link 
const URL = process.env.MONGODB_URL;

mongoose.connect(URL)
    .then(() => {
        console.log("---------------------------------");
        console.log("SUCCESS: Team Database Connected!");
        console.log("---------------------------------");
    })
    .catch((err) => {
        console.log("DB Connection Error: ", err);
    });

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});