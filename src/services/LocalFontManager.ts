import { readDir } from '@tauri-apps/plugin-fs';
import { resourceDir } from '@tauri-apps/api/path';
import { getFontNameFromFile } from './getFontName'; // Importing the function

interface FontCache {
  [key: string]: { name: string; src: string };
}

const fontCache: FontCache = {}; // Cache for font data

export const localFontManager = {
  async scanLocalFonts() {
    try {
      console.log("Scanning local fonts...");
      const resourcePath = await resourceDir();
      const fontPath = `${resourcePath}/_up_/public/fonts`;
      console.log(`Font path: ${fontPath}`);

      // Read the directory entries
      const entries = await readDir(fontPath);
      console.log('Entries:', entries);

      // Filter entries for font files
      const fontFiles = entries.filter(entry => 
        entry.name?.toLowerCase().endsWith('.ttf') || 
        entry.name?.toLowerCase().endsWith('.otf')
      );

      // Process new font files and update the cache
      const newFonts = await Promise.all(fontFiles.map(async entry => {
        if (!fontCache[entry.name]) { // Only process fonts not already in the cache
          const fontData = {
            name: await getFontNameFromFile(`${fontPath}/${entry.name}`) || '', // Get the font name
            src: entry.name,
          };
          fontCache[entry.name] = fontData; // Add to cache
          return fontData; // Return the new font data
        }
        return null; // Skip already cached fonts
      }));

      const addedFonts = newFonts.filter(font => font !== null); // Filter out nulls (already cached fonts)

      if (addedFonts.length > 0) {
        console.log('New fonts added to cache:', addedFonts);
      } else {
        console.log('No new fonts found.');
      }

      console.log('Current font cache:', fontCache);

      // Return all cached fonts
      return Object.values(fontCache);
    } catch (error) {
      console.error('Error scanning local fonts:', error);
      return []; // Return an empty array in case of error
    }
  },

  getCachedFonts() {
    return Object.values(fontCache); // Method to access cached fonts
  }
};
