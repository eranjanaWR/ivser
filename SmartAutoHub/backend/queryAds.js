const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const Advertising = require("./models/Advertising");

const mongoUrl = process.env.MONGODB_URI;

async function queryAds() {
  try {
    await mongoose.connect(mongoUrl);
    const ads = await Advertising.find({});
    console.log("\n?? All Ads:");
    console.log("================");
    ads.forEach((ad, index) => {
      console.log(`${index + 1}. Name: ${ad.name}`);
      console.log(`   Status: ${ad.status}`);
      console.log(`   Type: ${ad.type}`);
    });
    console.log("================");
    console.log(`Total: ${ads.length} ads\n`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

queryAds();
