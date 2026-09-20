const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adsRoutes = require('./routes/ads');
const enquiriesRoutes = require('./routes/enquiries');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/enquiries', enquiriesRoutes);

// Fallback to login page for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Classifieds Board server running on http://localhost:${PORT}`);
});