import { readDir } from '@tauri-apps/plugin-fs';
import { resourceDir } from '@tauri-apps/api/path';
import { getFontNameFromFile } from './getFontName'; // Importing the function

const fontCache: { [key: string]: { name: string; src: string } } = {}; // Cache for font data

export const localFontManager = {
  async scanLocalFonts() {
    if (Object.keys(fontCache).length > 0) {
      console.log('Returning cached fonts:', fontCache);
      return Object.values(fontCache); // Return cached fonts if already loaded
    }

    try {
      console.log("Scanning local fonts...");
      const resourcePath = await resourceDir();
      const fontPath = `${resourcePath}/_up_/public/fonts`;
      console.log(`Font path: ${fontPath}`);

      // Read the directory entries
      const entries = await readDir(fontPath);
      console.log('Entries:', entries);

      // Filter and map entries to create an array of font files
      const fontFiles = await Promise.all(entries
        .filter(entry => 
          entry.name?.toLowerCase().endsWith('.ttf') || 
          entry.name?.toLowerCase().endsWith('.otf')
        )
        .map(async entry => {
          const fontData = {
            name: await getFontNameFromFile(`${fontPath}/${entry.name}`) || '', // Get the font name using the utility
            src: entry.name,
          };

          fontCache[entry.name] = fontData; // Cache the font data
          return fontData;
        })
      );

      // Log and return the array of font files
      console.log('Fonts loaded successfully:', fontFiles);
      return fontFiles; // This now clearly indicates it returns an array of font files
    } catch (error) {
      console.error('Error scanning local fonts:', error);
      return []; // Return an empty array in case of error
    }
  },
  
  getCachedFonts() {
    return Object.values(fontCache); // Method to access cached fonts
  }
};
