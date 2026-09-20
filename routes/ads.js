const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const CATEGORIES = ['For Sale', 'Services', 'Rentals', 'Jobs', 'Lost & Found'];

// Helper: auto-expire ads whose expires_at has passed
async function autoExpireAds() {
    await pool.query(
        `UPDATE ads SET status = 'expired' WHERE status = 'active' AND expires_at < NOW()`
    );
}

// GET all ads (with filter by category + sort), only active, not expired
router.get('/', async (req, res) => {
    try {
        await autoExpireAds();

        const { category, sort } = req.query;
        let query = `
            SELECT ads.*, users.name AS poster_name,
                (SELECT COUNT(*) FROM enquiries WHERE enquiries.ad_id = ads.id) AS enquiry_count
            FROM ads
            JOIN users ON ads.user_id = users.id
            WHERE ads.status = 'active'
        `;
        const params = [];

        if (category && CATEGORIES.includes(category)) {
            query += ' AND ads.category = ?';
            params.push(category);
        }

        if (sort === 'lowest_price') {
            query += ' ORDER BY ads.featured DESC, ads.price ASC';
        } else {
            // default: newest first
            query += ' ORDER BY ads.featured DESC, ads.posted_at DESC';
        }

        const [rows] = await pool.query(query, params);
        res.json({ ads: rows, categories: CATEGORIES });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching ads.' });
    }
});

// GET ads posted by the logged-in user (My Ads)
router.get('/mine', requireAuth, async (req, res) => {
    try {
        await autoExpireAds();
        const [rows] = await pool.query(
            `SELECT ads.*,
                (SELECT COUNT(*) FROM enquiries WHERE enquiries.ad_id = ads.id) AS enquiry_count
             FROM ads WHERE user_id = ? ORDER BY posted_at DESC`,
            [req.user.id]
        );
        res.json({ ads: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching your ads.' });
    }
});

// GET single ad detail
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        await autoExpireAds();
        const [rows] = await pool.query(
            `SELECT ads.*, users.name AS poster_name
             FROM ads JOIN users ON ads.user_id = users.id
             WHERE ads.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ad not found.' });
        }
        const ad = rows[0];
        const isOwner = req.user && req.user.id === ad.user_id;
        res.json({ ad, isOwner });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching ad.' });
    }
});

// CREATE a new ad
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, category, description, price, contact, featured } = req.body;

        if (!title || !category || !description || !contact) {
            return res.status(400).json({ error: 'Title, category, description and contact are required.' });
        }
        if (!CATEGORIES.includes(category)) {
            return res.status(400).json({ error: 'Invalid category.' });
        }

        const [result] = await pool.query(
            `INSERT INTO ads (user_id, title, category, description, price, contact, expires_at, featured)
             VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?)`,
            [req.user.id, title, category, description, price || 0, contact, !!featured]
        );

        res.status(201).json({ message: 'Ad posted successfully.', adId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error posting ad.' });
    }
});

// Mark ad as CLOSED (owner only)
router.put('/:id/close', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ads WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Ad not found.' });
        if (rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only close your own ads.' });
        }

        await pool.query(`UPDATE ads SET status = 'closed' WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Ad marked as closed.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error closing ad.' });
    }
});

// RENEW ad (bonus feature) - extends expires_at by 30 days from now
router.put('/:id/renew', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ads WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Ad not found.' });
        if (rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only renew your own ads.' });
        }

        await pool.query(
            `UPDATE ads SET expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY), status = 'active' WHERE id = ?`,
            [req.params.id]
        );
        res.json({ message: 'Ad renewed for 30 more days.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error renewing ad.' });
    }
});

// Toggle FEATURED (bonus feature) - pins ad to top
router.put('/:id/feature', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ads WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Ad not found.' });
        if (rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only feature your own ads.' });
        }

        const newFeatured = !rows[0].featured;
        await pool.query('UPDATE ads SET featured = ? WHERE id = ?', [newFeatured, req.params.id]);
        res.json({ message: newFeatured ? 'Ad featured (pinned to top).' : 'Ad unfeatured.', featured: newFeatured });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating featured status.' });
    }
});

module.exports = router;