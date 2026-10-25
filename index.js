const express = require('express');
const { FingerprintGenerator } = require('fingerprint-generator');

const SUPPORTED_BROWSERS = [
    'chrome',
    'firefox',
    'safari',
    'edge',
];

const SUPPORTED_OPERATING_SYSTEMS = [
    'windows',
    'macos',
    'linux',
    'android',
    'ios',
];

const SUPPORTED_DEVICES = ['desktop', 'mobile'];

const app = express();
const fingerprintGenerator = new FingerprintGenerator();

// Middleware to parse JSON bodies
app.use(express.json());

const parseQueryList = (value, supportedValues) => {
    if (value === undefined) {
        return undefined;
    }

    const items = value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    if (items.length === 0) {
        return undefined;
    }

    const invalidItems = items.filter((item) => !supportedValues.includes(item));

    if (invalidItems.length > 0) {
        const error = new Error(`Invalid value(s): ${invalidItems.join(', ')}`);
        error.statusCode = 400;
        throw error;
    }

    return [...new Set(items)];
};

/**
 * @route GET /fingerprint
 * @query {boolean} [enableMobile=false] - Set to true to include mobile device fingerprints.
 * @description Generates a fingerprint with realistic distribution (desktop by default)
 */
app.get('/fingerprint', (req, res) => {
    const enableMobile = ['true', '1'].includes((req.query.enableMobile || '').toString().toLowerCase());
    const devices = enableMobile ? ['desktop', 'mobile'] : ['desktop'];

    const { fingerprint } = fingerprintGenerator.getFingerprint({
        devices,
    });

    res.json(fingerprint);
});

/**
 * @route GET /fingerprint/by-options
 * @query {string} [browsers] - Comma-separated list of browsers. Supported values: chrome, firefox, safari, edge.
 * @query {string} [operatingSystems] - Comma-separated list of operating systems. Supported values: windows, macos, linux, android, ios.
 * @query {string} [devices] - Comma-separated list of devices. Supported values: desktop, mobile.
 * @description Generates a fingerprint using the supplied filters.
 */
app.get('/fingerprint/by-options', (req, res) => {
    try {
        const browsers = parseQueryList(req.query.browsers, SUPPORTED_BROWSERS);
        const operatingSystems = parseQueryList(req.query.operatingSystems, SUPPORTED_OPERATING_SYSTEMS);
        const devices = parseQueryList(req.query.devices, SUPPORTED_DEVICES);

        const options = {};

        if (browsers) {
            options.browsers = browsers;
        }

        if (operatingSystems) {
            options.operatingSystems = operatingSystems;
        }

        if (devices) {
            options.devices = devices;
        }

        if (!options.devices) {
            options.devices = ['desktop'];
        }

        const { fingerprint } = fingerprintGenerator.getFingerprint(options);

        res.json(fingerprint);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to generate fingerprint.', details: error.message });
    }
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

/**
 * @route GET /health
 * @description Returns "Healthy" if the API is reachable
 */
app.get('/health', (req, res) => {
    res.type('text/plain').send('Healthy');
});

// Start the server
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = {
    app,
    SUPPORTED_BROWSERS,
    SUPPORTED_OPERATING_SYSTEMS,
    SUPPORTED_DEVICES,
};
