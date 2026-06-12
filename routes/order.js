const express = require('express');
const router  = express.Router();
const Order   = require('../models/order');

// POST — place a new order
router.post('/', async (req, res) => {
  try {
    const { items, total, delivery } = req.body;

    const order = new Order({ items, total, delivery });
    await order.save();

    res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order.' });
  }
});

// GET — get all orders (admin use)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;