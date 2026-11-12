const fs = require('fs');
const path = require('path');

const outputDirectory = path.join(__dirname, 'dist');
const frontendFiles = [
  'index.html',
  'about.html',
  'contact.html',
  'admin.html',
  'styles.css',
  'script.js'
];
const renderApiUrl = process.env.RENDER_API_URL?.trim().replace(/\/+$/, '')
  || 'https://sketch-gg29.onrender.com';

if (renderApiUrl) {
  const parsedApiUrl = new URL(renderApiUrl);
  if (parsedApiUrl.protocol !== 'https:') {
    throw new Error('RENDER_API_URL must use HTTPS.');
  }
}

fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of frontendFiles) {
  fs.copyFileSync(path.join(__dirname, file), path.join(outputDirectory, file));
}

fs.writeFileSync(
  path.join(outputDirectory, 'api-config.js'),
  `window.API_BASE_URL = ${JSON.stringify(renderApiUrl)};\n`
);
