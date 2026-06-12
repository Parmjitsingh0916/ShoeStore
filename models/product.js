const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  category:    { type: String, required: true, enum: ['running', 'casual', 'sport', 'hiking'] },
  gender:      { type: String, required: true, enum: ['men', 'women', 'kids'] },
  description: { type: String, default: '' },
  stock:       { type: Number, default: 0 },
  badge:       { type: String, default: '' },
  image:       { type: String, default: '' },   // main image (image1)
  image2:      { type: String, default: '' },   // second image
  image3:      { type: String, default: '' },   // third image
  colours:     { type: [String], default: [] },
  colourNames: { type: [String], default: [] },
  sizes:       { type: [mongoose.Schema.Types.Mixed], default: [] },
  material:    { type: String, default: '' },
  sole:        { type: String, default: '' },
  closure:     { type: String, default: '' },
  weight:      { type: String, default: '' },
  rating:      { type: Number, default: 0 },
  reviews:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);