import { layerManager } from '@/services/LayerManager';
import { IText } from 'fabric';
import { localFontManager } from './LocalFontManager';

export const SingleFontLoad = async (fontName: string) => {
  const customFonts = await localFontManager.scanLocalFonts();
  const loadedFontNames: string[] = [];

  // Populate loadedFontNames with currently loaded fonts
  document.fonts.forEach((fontFace) => {
    loadedFontNames.push(fontFace.family);
  });

  console.log("font to load", fontName);

  const fontToLoad = customFonts.find(font => font.name === fontName);

  if (!fontToLoad) {
    console.warn(`Font ${fontName} not found in custom fonts.`);
    return loadedFontNames; // Return the current loaded font names if the font is not found
  }

  // Check if the font is already loaded
  if (loadedFontNames.includes(fontToLoad.name)) {
    console.log(`Font ${fontToLoad.name} is already loaded.`);
    // return loadedFontNames; // Skip loading this font
  }

  const modSrc = `/fonts/${fontToLoad.src}`;
  const fontFace = new FontFace(fontToLoad.name, `url(${modSrc})`);

  const properFontName = fontFace.status;

  console.log("properFontName", properFontName);

  try {
    const loadedFace = await fontFace.load();
    document.fonts.add(loadedFace);
    loadedFontNames.push(fontToLoad.name); // Add the loaded font name to the array

    const canvas = layerManager.getCanvas();
    if (canvas) {
      canvas.getObjects().forEach(obj => {
        const txt = obj as IText;
        if (obj.type === 'text' && txt.fontFamily === fontToLoad.name) {
          canvas.requestRenderAll();
        }
      });
    }
  } catch (error) {
    console.error(`Error loading font ${fontToLoad.name}:`, error);
  }

  return loadedFontNames; // Return the array of loaded font names
};
