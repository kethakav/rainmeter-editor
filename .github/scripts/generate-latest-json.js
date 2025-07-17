// .github/scripts/generate-latest-json.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version = process.env.GITHUB_REF_NAME || 'v0.0.0';
const notes = process.env.RELEASE_NOTES || '';

// Find the signature file (adjust the path if your bundle structure is different)
const bundleDir = path.join(__dirname, '../../src-tauri/target/release/bundle/nsis');
const files = fs.readdirSync(bundleDir);
const sigFile = files.find(f => f.endsWith('.sig'));
const signature = sigFile ? fs.readFileSync(path.join(bundleDir, sigFile), 'utf8').trim() : '';

// Remove leading 'v' from version for filename
const versionForFilename = version.startsWith('v') ? version.slice(1) : version;
const url = `https://github.com/kethakav/rainmeter-editor/releases/download/${version}/Rainmeter.Editor_${versionForFilename}_x64_en-US.msi`;

const latest = {
  version,
  notes,
  signature,
  url
};

fs.writeFileSync('latest.json', JSON.stringify(latest, null, 2));
console.log('latest.json generated');