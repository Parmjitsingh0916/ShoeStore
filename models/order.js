const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items:    [{ name: String, price: Number, qty: Number }],
  total:    { type: Number, required: true },
  delivery: {
    name:     String,
    address1: String,
    address2: String,
    city:     String,
    postcode: String,
    email:    String,
    phone:    String,
  },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);