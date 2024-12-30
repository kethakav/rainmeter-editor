import { readFile } from '@tauri-apps/plugin-fs';
// import { Font } from 'opentype.js';
// const FontName = require('fontname');
import * as FontName from 'fontname';

export const getFontNameFromFile = async (filePath: string): Promise<string | null> => {
  try {
    // Read the font file
    const fontData = await readFile(filePath);

    // Parse the font to get metadata
    const fontMeta = FontName.parse(fontData)[0];

    console.log("fontMeta", fontMeta);

    // Check if fontMeta is defined and return the font name
    if (fontMeta && fontMeta.fullName) {
      return fontMeta.fullName;
    } else {
      throw new Error('Font name metadata is not available.');
    }
  } catch (error) {
    console.error('Error reading font file:', error);
    return null;
  }
};
