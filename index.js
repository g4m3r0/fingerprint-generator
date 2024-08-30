const express = require('express');
const { FingerprintGenerator } = require('fingerprint-generator');

const app = express();
const fingerprintGenerator = new FingerprintGenerator();

app.get('/fingerprint', (req, res) => {
    const { fingerprint } = fingerprintGenerator.getFingerprint({
        locales: ['en', 'en-US'],
        browsers: ['chrome'],
        devices: ['desktop'],
    });

    res.json(fingerprint);
});

app.get('/configurations/:locales/:browsers/:devices', (req, res) => {
    const locales = req.params.locales.split(',');
    const browsers = req.params.browsers.split(',');
    const devices = req.params.devices.split(',');
  
    res.json({
      locales: locales,
      browsers: browsers,
      devices: devices
    });
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
