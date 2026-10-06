/**
 * Seed script: Finance Companies
 *
 * Inserts/updates the initial FinanceCompany records from
 * backend/data/financeCompaniesSeedData.js.
 *
 * NOTE: This script is NOT run automatically by the application. It must be
 * executed manually, e.g.:
 *   node scripts/seedFinanceCompanies.js
 *
 * It is idempotent - re-running it upserts by company `name` instead of
 * creating duplicates.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const FinanceCompany = require('../models/FinanceCompany');
const FINANCE_COMPANIES_SEED_DATA = require('../data/financeCompaniesSeedData');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartauto-hub';

async function seedFinanceCompanies() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log(`📦 Seeding ${FINANCE_COMPANIES_SEED_DATA.length} finance companies...`);

    for (const companyData of FINANCE_COMPANIES_SEED_DATA) {
      const result = await FinanceCompany.findOneAndUpdate(
        { name: companyData.name },
        { $set: companyData },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
      console.log(`  ✅ Upserted: ${result.name} (${result._id})`);
    }

    console.log('\n✨ Finance companies seeded successfully!');
    process.exit(0);
    } catch (error) {
    console.error('Error seeding finance companies:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedFinanceCompanies();
