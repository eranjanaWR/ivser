/**
 * Script to create sample bidding vehicles for development/testing
 * Run: node scripts/createBiddingVehicles.js
 * Creates a mix of live and upcoming bidding vehicles
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const AuctionVehicle = require('../models/AuctionVehicle');
const User = require('../models/User');

const sampleVehicles = [
  // Live Vehicles (5 vehicles with bidding already started)
  {
    brand: 'Toyota',
    model: 'Camry',
    year: 2022,
    mileage: 15000,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Silver',
    engineCapacity: '2.5L',
    doors: 4,
    seats: 5,
    condition: 'excellent',
    description: 'Pristine condition Toyota Camry with low mileage. Full service history available.',
    features: ['Air Conditioning', 'Power Steering', 'Abs', 'Airbags', 'Bluetooth', 'Backup Camera'],
    location: { city: 'Colombo', state: 'Western', country: 'Sri Lanka' },
    startingPrice: 3500000,
    currentBid: 3800000,
    images: [
      'https://via.placeholder.com/400x300?text=Toyota+Camry+2022',
      'https://via.placeholder.com/400x300?text=Camry+Interior'
    ],
    // Live: started 2 hours ago, ends in 5 days
    auctionStartDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'live'
  },
  {
    brand: 'Honda',
    model: 'Accord',
    year: 2021,
    mileage: 22000,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Black',
    engineCapacity: '2.0L',
    doors: 4,
    seats: 5,
    condition: 'excellent',
    description: 'Well-maintained Honda Accord with premium interior features.',
    features: ['Climate Control', 'Cruise Control', 'Power Seats', 'Sunroof', 'Navigation System'],
    location: { city: 'Kandy', state: 'Central', country: 'Sri Lanka' },
    startingPrice: 3200000,
    currentBid: 3450000,
    images: [
      'https://via.placeholder.com/400x300?text=Honda+Accord+2021',
      'https://via.placeholder.com/400x300?text=Accord+Dashboard'
    ],
    auctionStartDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    status: 'live'
  },
  {
    brand: 'Hyundai',
    model: 'Santa Fe',
    year: 2023,
    mileage: 8000,
    fuelType: 'diesel',
    transmission: 'automatic',
    bodyType: 'suv',
    color: 'White',
    engineCapacity: '2.2L',
    doors: 5,
    seats: 7,
    condition: 'new',
    description: 'Brand new Hyundai Santa Fe SUV with all modern features and warranty.',
    features: ['Android Auto', 'Apple CarPlay', 'Panoramic Roof', 'Lexus Interior', '360 Camera'],
    location: { city: 'Galle', state: 'Southern', country: 'Sri Lanka' },
    startingPrice: 5500000,
    currentBid: 5900000,
    images: [
      'https://via.placeholder.com/400x300?text=Hyundai+Santa+Fe+2023',
      'https://via.placeholder.com/400x300?text=Santa+Fe+Exterior'
    ],
    auctionStartDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'live'
  },
  {
    brand: 'Nissan',
    model: 'Altima',
    year: 2020,
    mileage: 35000,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Red',
    engineCapacity: '2.5L',
    doors: 4,
    seats: 5,
    condition: 'good',
    description: 'Reliable Nissan Altima with excellent fuel efficiency.',
    features: ['Seat Warmers', 'Bluetooth', 'Power Windows', 'Electric Mirrors'],
    location: { city: 'Jaffna', state: 'Northern', country: 'Sri Lanka' },
    startingPrice: 2800000,
    currentBid: 3000000,
    images: [
      'https://via.placeholder.com/400x300?text=Nissan+Altima+2020',
      'https://via.placeholder.com/400x300?text=Altima+Side+View'
    ],
    auctionStartDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: 'live'
  },
  {
    brand: 'BMW',
    model: '320i',
    year: 2019,
    mileage: 45000,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Navy Blue',
    engineCapacity: '2.0L',
    doors: 4,
    seats: 5,
    condition: 'good',
    description: 'Luxury BMW 320i with full service history. Premium performance sedan.',
    features: ['M Sport Package', 'Leather Seats', 'Navigation', 'Premium Sound System'],
    location: { city: 'Matara', state: 'Southern', country: 'Sri Lanka' },
    startingPrice: 4500000,
    currentBid: 4750000,
    images: [
      'https://via.placeholder.com/400x300?text=BMW+320i+2019',
      'https://via.placeholder.com/400x300?text=BMW+Interior'
    ],
    auctionStartDate: new Date(Date.now() - 30 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'live'
  },

  // Upcoming Vehicles (5 vehicles with bidding not yet started)
  {
    brand: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2022,
    mileage: 18000,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Silver',
    engineCapacity: '2.0L',
    doors: 4,
    seats: 5,
    condition: 'excellent',
    description: 'Luxury Mercedes-Benz C-Class with advanced features. Coming soon to auction!',
    features: ['AIRMATIC Suspension', 'Command System', 'Panorama Sunroof', 'Premium Audio'],
    location: { city: 'Colombo', state: 'Western', country: 'Sri Lanka' },
    startingPrice: 6500000,
    currentBid: 6500000, // Starting price is current bid until first bid placed
    images: [
      'https://via.placeholder.com/400x300?text=Mercedes+C-Class+2022',
      'https://via.placeholder.com/400x300?text=Mercedes+Luxury'
    ],
    // Upcoming: starts in 2 hours, ends in 8 days
    auctionStartDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    status: 'upcoming'
  },
  {
    brand: 'Audi',
    model: 'A4',
    year: 2021,
    mileage: 28000,
    fuelType: 'diesel',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Black',
    engineCapacity: '2.0L',
    doors: 4,
    seats: 5,
    condition: 'excellent',
    description: 'Premium Audi A4 diesel with sophisticated design. Bidding opens in 6 hours!',
    features: ['Quattro AWD', 'Matrix LED Headlights', 'Virtual Cockpit', 'Bang & Olufsen Audio'],
    location: { city: 'Negombo', state: 'Western', country: 'Sri Lanka' },
    startingPrice: 5200000,
    currentBid: 5200000,
    images: [
      'https://via.placeholder.com/400x300?text=Audi+A4+2021',
      'https://via.placeholder.com/400x300?text=Audi+Performance'
    ],
    auctionStartDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    status: 'upcoming'
  },
  {
    brand: 'Volkswagen',
    model: 'Passat',
    year: 2022,
    mileage: 20000,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Grey',
    engineCapacity: '1.8L',
    doors: 4,
    seats: 5,
    condition: 'excellent',
    description: 'Stylish Volkswagen Passat with German engineering. Upcoming auction!',
    features: ['IQ.DRIVE Suite', 'DCC Suspension', 'Leather Interior', 'Fender Premium Audio'],
    location: { city: 'Ratnapura', state: 'Sabaragamuwa', country: 'Sri Lanka' },
    startingPrice: 3800000,
    currentBid: 3800000,
    images: [
      'https://via.placeholder.com/400x300?text=VW+Passat+2022',
      'https://via.placeholder.com/400x300?text=Passat+Elegance'
    ],
    auctionStartDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: 'upcoming'
  },
  {
    brand: 'Mazda',
    model: 'CX-5',
    year: 2023,
    mileage: 5000,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'suv',
    color: 'Pearl White',
    engineCapacity: '2.5L',
    doors: 5,
    seats: 5,
    condition: 'new',
    description: 'Brand new Mazda CX-5 crossover with premium features. Reserved for upcoming auction!',
    features: ['SKYACTIV Engine', 'i-ACTIVSENSE', 'Power Liftgate', 'Bose Premium Sound'],
    location: { city: 'Anuradhapura', state: 'North Central', country: 'Sri Lanka' },
    startingPrice: 4200000,
    currentBid: 4200000,
    images: [
      'https://via.placeholder.com/400x300?text=Mazda+CX-5+2023',
      'https://via.placeholder.com/400x300?text=CX-5+Crossover'
    ],
    auctionStartDate: new Date(Date.now() + 18 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
    status: 'upcoming'
  },
  {
    brand: 'Kia',
    model: 'Sportage',
    year: 2021,
    mileage: 32000,
    fuelType: 'diesel',
    transmission: 'automatic',
    bodyType: 'suv',
    color: 'Red',
    engineCapacity: '2.0L',
    doors: 5,
    seats: 5,
    condition: 'good',
    description: 'Dynamic Kia Sportage SUV with excellent safety features. Upcoming bidding session!',
    features: ['SmartStream Engine', 'Advanced Safety Assist', 'Panoramic Sunroof', 'Touchscreen Navigation'],
    location: { city: 'Kurunegala', state: 'North Western', country: 'Sri Lanka' },
    startingPrice: 3600000,
    currentBid: 3600000,
    images: [
      'https://via.placeholder.com/400x300?text=Kia+Sportage+2021',
      'https://via.placeholder.com/400x300?text=Sportage+Adventure'
    ],
    auctionStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    auctionEndDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    status: 'upcoming'
  }
];

const createBiddingVehicles = async () => {
  try {
    // Get the first seller (or create one for testing)
    let seller = await User.findOne({ role: { $in: ['seller', 'buyer/seller'] } });
    
    if (!seller) {
      console.log('No seller found. Please create a seller user first using createTestUser.js script');
      process.exit(1);
    }

    // Delete existing auction vehicles
    const deleteResult = await AuctionVehicle.deleteMany();
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing auction vehicles`);

    // Add sellerId to all vehicles
    const vehiclesWithSeller = sampleVehicles.map(vehicle => ({
      ...vehicle,
      sellerId: seller._id
    }));

    // Create all vehicles
    const createdVehicles = await AuctionVehicle.insertMany(vehiclesWithSeller);
    console.log(`\n✅ Created ${createdVehicles.length} bidding vehicles successfully!\n`);

    // Print summary
    const liveCount = createdVehicles.filter(v => v.status === 'live').length;
    const upcomingCount = createdVehicles.filter(v => v.status === 'upcoming').length;

    console.log('=== Bidding Vehicles Summary ===');
    console.log(`Live Vehicles: ${liveCount}`);
    console.log(`Upcoming Vehicles: ${upcomingCount}`);
    console.log(`Total: ${createdVehicles.length}`);
    console.log('================================\n');

    console.log('Live Vehicles:');
    createdVehicles.filter(v => v.status === 'live').forEach((v, idx) => {
      console.log(`  ${idx + 1}. ${v.year} ${v.brand} ${v.model} - LKR ${v.startingPrice.toLocaleString()}`);
    });

    console.log('\nUpcoming Vehicles:');
    createdVehicles.filter(v => v.status === 'upcoming').forEach((v, idx) => {
      const hoursUntilStart = Math.round((v.auctionStartDate - Date.now()) / (60 * 60 * 1000));
      console.log(`  ${idx + 1}. ${v.year} ${v.brand} ${v.model} - Starts in ${hoursUntilStart} hours`);
    });

    console.log('\n✨ You can now visit the bidding page to see these vehicles!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating bidding vehicles:', error);
    process.exit(1);
  }
};

// Run the script
createBiddingVehicles();
