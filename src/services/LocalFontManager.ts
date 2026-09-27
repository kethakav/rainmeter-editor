import { readDir } from "@tauri-apps/plugin-fs";
import { appLocalDataDir, join, resourceDir } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";
import { getFontMetadataFromFile } from "./getFontName";

interface FontCache {
  [key: string]: {
    name: string;
    familyName: string;
    subfamily: string;
    src: string;
    path: string;
  };
}

const fontCache: FontCache = {}; // Cache for font data

export const ensureLocalFontDirectory = async () => {
  const fontPath = await join(await appLocalDataDir(), "fonts");
  await mkdir(fontPath, { recursive: true });
  return fontPath;
};

export const getLocalFontDirectory = async () =>
  join(await appLocalDataDir(), "fonts");

export const localFontManager = {
  async scanLocalFonts() {
    try {
      console.log("Scanning local fonts...");
      const localFontPath = await ensureLocalFontDirectory();
      const bundledFontPath = await join(
        await resourceDir(),
        "_up_",
        "public",
        "fonts",
      );
      const scannedFonts = (
        await Promise.all(
          [localFontPath, bundledFontPath].map(async (fontPath) => {
            try {
              const entries = await readDir(fontPath);
              const fontFiles = entries.filter(
                (entry) =>
                  entry.name?.toLowerCase().endsWith(".ttf") ||
                  entry.name?.toLowerCase().endsWith(".otf"),
              );

              return Promise.all(
                fontFiles.map(async (entry) => {
                  const path = await join(fontPath, entry.name!);
                  const metadata = await getFontMetadataFromFile(path);
                  return {
                    name: metadata?.name || "",
                    familyName: metadata?.familyName || "",
                    subfamily: metadata?.subfamily || "",
                    src: entry.name!,
                    path,
                  };
                }),
              );
            } catch (error) {
              console.warn(`Could not scan font directory ${fontPath}:`, error);
              return [];
            }
          }),
        )
      ).flat();

      Object.keys(fontCache).forEach((name) => delete fontCache[name]);
      scannedFonts.forEach((font) => {
        fontCache[font.path] = font;
      });

      console.log("Current font cache:", fontCache);

      // Return all cached fonts
      return Object.values(fontCache);
    } catch (error) {
      console.error("Error scanning local fonts:", error);
      return []; // Return an empty array in case of error
    }
  },

  getCachedFonts() {
    return Object.values(fontCache); // Method to access cached fonts
  },
};
