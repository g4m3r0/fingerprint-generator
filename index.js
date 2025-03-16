const express = require('express');
const { FingerprintGenerator } = require('fingerprint-generator');

const app = express();
const fingerprintGenerator = new FingerprintGenerator();

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * @route GET /fingerprint
 * @description Generates a fingerprint with default settings
 */
app.get('/fingerprint', (req, res) => {
    const { fingerprint } = fingerprintGenerator.getFingerprint({
        locales: ['en', 'en-US'],
        browsers: ['chrome'],
        devices: ['desktop'],
    });

    res.json(fingerprint);
});

/**
 * @route GET /configurations/:locales/:browsers/:devices
 * @description Returns configurations based on URL parameters
 */
app.get('/configurations/:locales/:browsers/:devices', (req, res) => {
    const locales = req.params.locales.split(',');
    const browsers = req.params.browsers.split(',');
    const devices = req.params.devices.split(',');

    res.json({
        locales: locales,
        browsers: browsers,
        devices: devices,
    });
});

/**
 * @route POST /generate-fingerprint
 * @description Generates a fingerprint based on user-provided settings
 * @body {Array.<string>} browsers - List of browsers (e.g., 'chrome', 'firefox', 'safari')
 * @body {Array.<string>} operatingSystems - List of operating systems (e.g., 'windows', 'macos', 'linux', 'android', 'ios')
 * @body {Array.<string>} devices - List of devices (e.g., 'desktop', 'mobile')
 * @body {Array.<string>} locales - List of locales (max 10, e.g., 'en', 'en-US', 'de')
 */
app.post('/generate-fingerprint', (req, res) => {
    const { browsers, operatingSystems, devices, locales } = req.body;

    // Validate input
    if (!Array.isArray(browsers) || !Array.isArray(operatingSystems) || !Array.isArray(devices) || !Array.isArray(locales)) {
        return res.status(400).json({ error: 'All inputs must be arrays.' });
    }

    if (locales.length > 10) {
        return res.status(400).json({ error: 'Locales array must not exceed 10 items.' });
    }

    try {
        // Generate fingerprint
        const { fingerprint } = fingerprintGenerator.getFingerprint({
            browsers,
            operatingSystems,
            devices,
            locales,
        });

        // Return the fingerprint
        res.json(fingerprint);
    } catch (error) {
        // Handle errors from the fingerprint generator
        res.status(500).json({ error: 'Failed to generate fingerprint.', details: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
