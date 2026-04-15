const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://user:Passw0rd@ac-3e37udy.pdv1ocp.mongodb.net/smartauto?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('? MongoDB Connected');
  
  const boostSchema = require('./models/Boost');
  
  boostSchema.find().select('_id paymentMethod bankSlipPath cardProofPath paymentRefNumber').limit(5)
    .then(boosts => {
      console.log('?? Payment Proof Sample:');
      boosts.forEach((b, i) => {
        console.log(\nBoost :);
        console.log('  _id:', b._id);
        console.log('  paymentMethod:', b.paymentMethod);
        console.log('  bankSlipPath:', b.bankSlipPath);
        console.log('  cardProofPath:', b.cardProofPath);
        console.log('  hasProof:', !!(b.bankSlipPath || b.cardProofPath));
      });
      process.exit(0);
    })
    .catch(e => {
      console.error('? Query error:', e.message);
      process.exit(1);
    });
})
.catch(e => {
  console.error('? Connection error:', e.message);
  process.exit(1);
});
