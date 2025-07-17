const fs = require('fs');
const path = require('path');

const version = process.env.GITHUB_REF_NAME || 'v0.0.0';
const notes = process.env.RELEASE_NOTES || '';
const signature = 'TODO: Add signature generation logic if needed';
const url = `https://github.com/kethakav/rainmeter-editor/releases/download/${version}/RainmeterEditorSetup.exe`;

const latest = {
  version,
  notes,
  signature,
  url
};

fs.writeFileSync('latest.json', JSON.stringify(latest, null, 2));
console.log('latest.json generated');