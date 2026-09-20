const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// SEND an enquiry on an ad (anyone can send, name + message)
router.post('/:adId', async (req, res) => {
    try {
        const { name, message } = req.body;
        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required.' });
        }

        const [adRows] = await pool.query('SELECT id FROM ads WHERE id = ?', [req.params.adId]);
        if (adRows.length === 0) {
            return res.status(404).json({ error: 'Ad not found.' });
        }

        await pool.query(
            'INSERT INTO enquiries (ad_id, name, message) VALUES (?, ?, ?)',
            [req.params.adId, name, message]
        );

        res.status(201).json({ message: 'Enquiry sent successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error sending enquiry.' });
    }
});

// GET enquiries for an ad (owner only)
router.get('/:adId', requireAuth, async (req, res) => {
    try {
        const [adRows] = await pool.query('SELECT * FROM ads WHERE id = ?', [req.params.adId]);
        if (adRows.length === 0) {
            return res.status(404).json({ error: 'Ad not found.' });
        }
        if (adRows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only view enquiries for your own ads.' });
        }

        const [rows] = await pool.query(
            'SELECT * FROM enquiries WHERE ad_id = ? ORDER BY sent_at DESC',
            [req.params.adId]
        );
        res.json({ enquiries: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching enquiries.' });
    }
});

module.exports = router;