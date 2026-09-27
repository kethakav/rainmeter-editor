import { readFile } from "@tauri-apps/plugin-fs";
// import { Font } from 'opentype.js';
// const FontName = require('fontname');
import * as FontName from "fontname";

export interface FontMetadata {
  name: string;
  familyName: string;
  subfamily: string;
}

export const getFontMetadataFromFile = async (
  filePath: string,
): Promise<FontMetadata | null> => {
  try {
    const fontData = await readFile(filePath);
    const fontMeta = FontName.parse(fontData)[0];
    console.log("fontMeta", fontMeta);

    const runtimeMetadata = fontMeta as typeof fontMeta & {
      fontFamily?: string;
      fontSubfamily?: string;
    };
    const familyName = runtimeMetadata?.fontFamily || fontMeta?.family;
    const name = fontMeta?.fullName || familyName;

    if (name && familyName) {
      return {
        name,
        familyName,
        subfamily: runtimeMetadata.fontSubfamily || fontMeta.style || "",
      };
    }

    throw new Error("Font name metadata is not available.");
  } catch (error) {
    console.error("Error reading font file:", error);
    return null;
  }
};

export const getFontNameFromFile = async (
  filePath: string,
): Promise<string | null> => {
  const metadata = await getFontMetadataFromFile(filePath);
  return metadata?.name || null;
};
