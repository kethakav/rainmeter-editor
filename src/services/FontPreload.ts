import { layerManager } from '@/services/LayerManager';
import { IText } from 'fabric';
import { localFontManager } from './LocalFontManager';

export const preloadCustomFonts = async () => {
  const customFonts = await localFontManager.scanLocalFonts();
  const loadedFontNames: string[] = [];

  // Populate loadedFontNames with currently loaded fonts
  document.fonts.forEach((fontFace) => {
    loadedFontNames.push(fontFace.family);
  });

  await Promise.all(customFonts.map(async font => {
    // Check if the font is already loaded
    if (loadedFontNames.includes(font.name)) {
      console.log(`Font ${font.name} is already loaded.`);
      return; // Skip loading this font
    }

    const modSrc = `/fonts/${font.src}`;
    const fontFace = new FontFace(font.name, `url(${modSrc})`);

    try {
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);
      loadedFontNames.push(font.name); // Add the loaded font name to the array

      const canvas = layerManager.getCanvas();
      if (canvas) {
        canvas.getObjects().forEach(obj => {
          const txt = obj as IText;
          if (obj.type === 'text' && txt.fontFamily === font.name) {
            canvas.requestRenderAll();
          }
        });
      }
    } catch (error) {
      console.error(`Error loading font ${font.name}:`, error);
    }
  }));

  return loadedFontNames; // Return the array of loaded font names
};