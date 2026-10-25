# Fingerprint Generator API

A simple Node.js API that generates realistic browser fingerprints using the `fingerprint-generator` library. This tool is useful for web scraping, automation, and testing where you need to simulate different browser environments.

## Features

- **Realistic Distributions**: Generates fingerprints that follow real-world browser and OS usage patterns.
- **Customizable**: Filter by browsers, operating systems, devices, and locales.
- **Dockerized**: Easy to deploy using Docker.
- **CI/CD Ready**: Includes GitHub Actions for automatic builds and deployments.

## API Endpoints

### 1. Get Random Fingerprint
Generates a fingerprint with realistic distribution (desktop by default).

- **URL**: `/fingerprint`
- **Method**: `GET`
- **Query Params**:
  - `enableMobile` (boolean, default: `false`): Set to `true` to include mobile device fingerprints.

### 2. Get Fingerprint by Options
Generates a fingerprint using simple filters.

- **URL**: `/fingerprint/by-options`
- **Method**: `GET`
- **Query Params**:
  - `browsers` (string): Comma-separated list (e.g., `chrome,firefox`).
  - `operatingSystems` (string): Comma-separated list (e.g., `windows,macos`).
  - `devices` (string): Comma-separated list (e.g., `desktop,mobile`).

### 3. Generate Advanced Fingerprint
Detailed filtering via JSON body.

- **URL**: `/generate-fingerprint`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "browsers": ["chrome", "firefox"],
    "operatingSystems": ["windows"],
    "devices": ["desktop"],
    "locales": ["en-US", "en-GB"]
  }
  ```

### 4. Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: `Healthy`

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- npm

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3000`.

### Testing
Run the automated test suite (Node.js built-in test runner + Supertest):
```bash
npm test
```
Use `npm run test:watch` to re-run tests on file changes.

## Docker

### Build and Run Locally
```bash
docker build -t fingerprint-generator .
docker run -p 3000:3000 fingerprint-generator
```

## Deployment

The project is configured with GitHub Actions to:
1. Build and push a Docker image to `docker.gsoftwarelab.com`.
2. Create a GitHub Release when a new version is pushed to the `main` branch.

**Note**: Remember to bump the `version` in `package.json` before pushing to `main` to trigger the release process.
