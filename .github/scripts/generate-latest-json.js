const fs = require('fs');
const path = require('path');

const version = process.env.GITHUB_REF_NAME || 'v0.0.0';
const notes = process.env.RELEASE_NOTES || '';

// Find the signature file (adjust the path if your bundle structure is different)
const bundleDir = path.join(__dirname, '../../src-tauri/target/release/bundle/nsis');
const files = fs.readdirSync(bundleDir);
const sigFile = files.find(f => f.endsWith('.sig'));
const signature = sigFile ? fs.readFileSync(path.join(bundleDir, sigFile), 'utf8').trim() : '';

const url = `https://github.com/kethakav/rainmeter-editor/releases/download/${version}/RainmeterEditorSetup.exe`;

const latest = {
  version,
  notes,
  signature,
  url
};

fs.writeFileSync('latest.json', JSON.stringify(latest, null, 2));
console.log('latest.json generated');