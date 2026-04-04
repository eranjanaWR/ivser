/**
 * Script to populate trending searches
 * Generates search history for vehicle models to populate trending section
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Search = require('../models/Search');
const ViewHistory = require('../models/ViewHistory');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartauto-hub';

async function populateTrendingSearches() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all unique vehicle models and their brands from database
    const vehicles = await Vehicle.find({ status: 'available' }).select('brand model year price').limit(100);
    
    if (vehicles.length === 0) {
      console.log('❌ No vehicles found in database. Please add vehicles first.');
      process.exit(1);
    }

    console.log(`📊 Found ${vehicles.length} vehicles in database`);

    // Get unique models sorted by frequency
    const modelMap = {};
    vehicles.forEach(v => {
      const key = `${v.brand}|${v.model}`;
      modelMap[key] = (modelMap[key] || 0) + 1;
    });

    // Get top models
    const topModels = Object.entries(modelMap)
      .map(([key, count]) => {
        const [brand, model] = key.split('|');
        return { brand, model, count, key };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log('🏆 Top models to populate:');
    topModels.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.brand} ${m.model} (${m.count} vehicles)`);
    });

    // Clear old search data
    console.log('\n🧹 Clearing old search history...');
    await Search.deleteMany({});
    await ViewHistory.deleteMany({});

    // Create search records for each top model
    console.log('\n➕ Creating search records...');
    
    for (const model of topModels) {
      // Create varying number of searches based on popularity
      const searchCount = Math.ceil((15 - topModels.indexOf(model)) * 5); // Scale down from ~75 to ~10
      
      for (let i = 0; i < searchCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // Random within last 30 days
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        await Search.create({
          searchQuery: model.model.toLowerCase(),
          searchType: 'model',
          filters: {
            brand: model.brand,
            model: model.model,
            search: `${model.brand} ${model.model}`
          },
          resultsCount: model.count,
          createdAt: createdAt
        });
      }

      console.log(`  ✅ Created ${searchCount} searches for ${model.brand} ${model.model}`);
    }

    // Create view history records
    console.log('\n➕ Creating view history records...');
    
    for (const model of topModels) {
      // Create varying number of views based on popularity
      const viewCount = Math.ceil((15 - topModels.indexOf(model)) * 8); // Scale higher for views
      
      for (let i = 0; i < viewCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const viewedAt = new Date();
        viewedAt.setDate(viewedAt.getDate() - daysAgo);

        await ViewHistory.create({
          vehicleId: vehicles.find(v => v.brand === model.brand && v.model === model.model)?._id || null,
          brand: model.brand,
          model: model.model,
          viewedAt: viewedAt
        });
      }

      console.log(`  ✅ Created ${viewCount} views for ${model.brand} ${model.model}`);
    }

    console.log('\n✨ Trending searches populated successfully!');
    console.log('🔄 Please refresh your browser to see the trending vehicles');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateTrendingSearches();
