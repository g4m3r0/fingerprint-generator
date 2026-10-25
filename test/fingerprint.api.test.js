const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { app } = require('../index');

const assertFingerprintShape = (fingerprint) => {
    assert.equal(typeof fingerprint, 'object');
    assert.notEqual(fingerprint, null);
    assert.equal(typeof fingerprint.navigator, 'object');
    assert.equal(typeof fingerprint.navigator.userAgent, 'string');
    assert.ok(fingerprint.navigator.userAgent.length > 0);
    assert.equal(typeof fingerprint.screen, 'object');
    assert.equal(typeof fingerprint.screen.width, 'number');
    assert.equal(typeof fingerprint.screen.height, 'number');
    assert.ok(Array.isArray(fingerprint.fonts));
};

describe('GET /health', () => {
    it('returns a plain text healthy response', async () => {
        const response = await request(app).get('/health').expect(200);

        assert.match(response.headers['content-type'], /text\/plain/);
        assert.equal(response.text, 'Healthy');
    });
});

describe('GET /fingerprint', () => {
    it('generates a desktop fingerprint by default', async () => {
        const response = await request(app).get('/fingerprint').expect(200);

        assertFingerprintShape(response.body);
    });

    it('accepts enableMobile=true', async () => {
        const response = await request(app).get('/fingerprint').query({ enableMobile: 'true' }).expect(200);

        assertFingerprintShape(response.body);
    });

    it('treats enableMobile=1 as enabled', async () => {
        const response = await request(app).get('/fingerprint').query({ enableMobile: '1' }).expect(200);

        assertFingerprintShape(response.body);
    });
});

describe('GET /fingerprint/by-options', () => {
    it('generates a fingerprint matching the requested browser and OS', async () => {
        const response = await request(app)
            .get('/fingerprint/by-options')
            .query({ browsers: 'chrome', operatingSystems: 'windows', devices: 'desktop' })
            .expect(200);

        assertFingerprintShape(response.body);
        assert.match(response.body.navigator.userAgent, /Chrome\//);
        assert.match(response.body.navigator.userAgent, /Windows/);
    });

    it('is case-insensitive and accepts comma-separated values', async () => {
        const response = await request(app)
            .get('/fingerprint/by-options')
            .query({ browsers: 'Chrome, FIREFOX', operatingSystems: 'Linux,MacOS' })
            .expect(200);

        assertFingerprintShape(response.body);
    });

    it('defaults to desktop devices when none are provided', async () => {
        const response = await request(app)
            .get('/fingerprint/by-options')
            .query({ browsers: 'firefox' })
            .expect(200);

        assertFingerprintShape(response.body);
    });

    it('rejects unsupported browsers', async () => {
        const response = await request(app)
            .get('/fingerprint/by-options')
            .query({ browsers: 'opera' })
            .expect(400);

        assert.equal(response.body.error, 'Invalid value(s): opera');
    });

    it('rejects unsupported operating systems', async () => {
        const response = await request(app)
            .get('/fingerprint/by-options')
            .query({ operatingSystems: 'beos' })
            .expect(400);

        assert.equal(response.body.error, 'Invalid value(s): beos');
    });

    it('rejects unsupported devices', async () => {
        const response = await request(app)
            .get('/fingerprint/by-options')
            .query({ devices: 'tablet' })
            .expect(400);

        assert.equal(response.body.error, 'Invalid value(s): tablet');
    });
});

describe('GET /configurations/:locales/:browsers/:devices', () => {
    it('returns the provided configuration as arrays', async () => {
        const response = await request(app)
            .get('/configurations/en-US,de/chrome,firefox/desktop,mobile')
            .expect(200);

        assert.deepEqual(response.body, {
            locales: ['en-US', 'de'],
            browsers: ['chrome', 'firefox'],
            devices: ['desktop', 'mobile'],
        });
    });
});

describe('POST /generate-fingerprint', () => {
    it('generates a fingerprint from the supplied settings', async () => {
        const response = await request(app)
            .post('/generate-fingerprint')
            .send({
                browsers: ['firefox'],
                operatingSystems: ['linux'],
                devices: ['desktop'],
                locales: ['en-US'],
            })
            .expect(200);

        assertFingerprintShape(response.body);
        assert.match(response.body.navigator.userAgent, /Firefox\//);
    });

    it('rejects non-array inputs', async () => {
        const response = await request(app)
            .post('/generate-fingerprint')
            .send({ browsers: 'chrome', operatingSystems: ['windows'], devices: ['desktop'], locales: ['en-US'] })
            .expect(400);

        assert.equal(response.body.error, 'All inputs must be arrays.');
    });

    it('rejects missing inputs', async () => {
        const response = await request(app).post('/generate-fingerprint').send({}).expect(400);

        assert.equal(response.body.error, 'All inputs must be arrays.');
    });

    it('rejects more than ten locales', async () => {
        const response = await request(app)
            .post('/generate-fingerprint')
            .send({
                browsers: ['chrome'],
                operatingSystems: ['windows'],
                devices: ['desktop'],
                locales: Array.from({ length: 11 }, (_, index) => `locale-${index}`),
            })
            .expect(400);

        assert.equal(response.body.error, 'Locales array must not exceed 10 items.');
    });

    it('returns a JSON error when the generator rejects the options', async () => {
        const response = await request(app)
            .post('/generate-fingerprint')
            .send({
                browsers: ['opera'],
                operatingSystems: ['windows'],
                devices: ['desktop'],
                locales: ['en-US'],
            })
            .expect(500);

        assert.equal(response.body.error, 'Failed to generate fingerprint.');
        assert.equal(typeof response.body.details, 'string');
    });
});

describe('unknown routes', () => {
    it('returns 404', async () => {
        await request(app).get('/does-not-exist').expect(404);
    });
});
