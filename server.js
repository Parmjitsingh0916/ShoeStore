require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== ROUTES =====
const productRoutes = require('./routes/products');
const authRoutes    = require('./routes/auth');
const orderRoutes   = require('./routes/order');
const adminRoutes   = require('./routes/admin');

app.use('/api/products', productRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);

// ===== CONNECT MONGODB THEN START SERVER =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  })
  .catch(err => {
    console.log('MongoDB connection error ❌:', err.message);
  });