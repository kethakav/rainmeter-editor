// ExportToINI.ts
import { writeTextFile, BaseDirectory, copyFile } from '@tauri-apps/plugin-fs';
import { layerManager } from './LayerManager';
import { IText, TFiller } from 'fabric';
import { open} from '@tauri-apps/plugin-dialog';
import { mkdir, writeFile, exists } from '@tauri-apps/plugin-fs'; // Imp
import { resourceDir } from '@tauri-apps/api/path';
import { localFontManager } from './LocalFontManager';
// import { appDataDir } from '@tauri-apps/api/path';

// Types for Rainmeter Skin Components
interface RainmeterMetadata {
    name: string;
    author: string;
    version: string;
    description: string;
}

interface RainmeterVariable {
  key: string;
  value: string;
}

interface RainmeterMeasure {
  type: 'Time' | 'Calc' | 'String' | 'Plugin';
  name: string;
  options: Record<string, string>;
}

interface RainmeterMeter {
  type: 'String' | 'Image' | 'Shape';
  name: string;
  measureName?: string;
  options: Record<string, string | TFiller>;
}

interface RainmeterSkinLayer {
  measure?: RainmeterMeasure;
  meter?: RainmeterMeter;
}

class RainmeterSkinExporter {
  private baseTemplate: string;
  private layers: RainmeterSkinLayer[] = [];
  private metadata: RainmeterMetadata;
  private variables: RainmeterVariable[] = [];

  constructor(metadata: RainmeterMetadata) {
    this.metadata = metadata;
    this.baseTemplate = this.createBaseTemplate();
  }

  private createBaseTemplate(): string {
    return `[Metadata]
Name=${this.metadata.name}
Author=${this.metadata.author}
Version=${this.metadata.version}
Description=${this.metadata.description}

[Rainmeter]
Update=1000
`;
  }

  addVariable(key: string, value: string): this {
    this.variables.push({ key, value });
    return this;
  }

  addLayer(layer: RainmeterSkinLayer): this {
    this.layers.push(layer);
    return this;
  }

  export(): string {
    let exportContent = this.baseTemplate;

    // Add Variables section
    if (this.variables.length > 0) {
      exportContent += '[Variables]\n';
      this.variables.forEach(variable => {
        exportContent += `${variable.key}=${variable.value}\n`;
      });
      exportContent += '\n';
    }

    // Add Measures
    this.layers
      .filter(layer => layer.measure)
      .forEach((layer) => {
        const measure = layer.measure!;
        exportContent += `[${measure.name}]\n`;
        exportContent += `Measure=${measure.type}\n`;
        
        Object.entries(measure.options).forEach(([key, value]) => {
          exportContent += `${key}=${value}\n`;
        });
        
        exportContent += '\n';
      });

    // Add Meters
    this.layers
      .filter(layer => layer.meter)
      .forEach((layer) => {
        const meter = layer.meter!;
        exportContent += `[${meter.name}]\n`;
        exportContent += `Meter=${meter.type}\n`;
        
        if (meter.measureName) {
          exportContent += `MeasureName=${meter.measureName}\n`;
        }
        
        Object.entries(meter.options).forEach(([key, value]) => {
          exportContent += `${key}=${value}\n`;
        });
        
        exportContent += '\n';
      });

    return exportContent;
  }
}
  
// Example Usage in a Vue Component
export function useRainmeterSkinExporter() {
  const createDayOfWeekSkin = async () => {
      const exporter = new RainmeterSkinExporter({
          name: 'Day Of The Week',
          author: 'Your Name',
          version: '1.0',
          description: 'Displays the current day of the week'
      });
  
      exporter
          .addVariable('FontName', 'Roboto')
          .addVariable('FontSize', '72')
          .addVariable('FontColor', '255,255,255')
          .addLayer({
              measure: {
                  type: 'Time',
                  name: 'MeasureDay',
                  options: {
                      Format: '%A'
                  }
              }
          })
          .addLayer({
              meter: {
                  type: 'String',
                  name: 'MeterDay',
                  measureName: 'MeasureDay',
                  options: {
                      FontSize: '#FontSize#',
                      FontFace: '#FontName#',
                      FontColor: '#FontColor#',
                      Align: 'C',
                      X: '0',
                      Y: '0',
                      AntiAlias: '1',
                      Text: '"%1"'
                  }
              }
          });
  
      const iniContent = exporter.export();
  
      // Show a save dialog to the user
      // const filePath = await save({ filters: [{ name: 'INI files', extensions: ['ini'] }] });
  
      if (BaseDirectory.AppData) {
          // Write the file to the selected path
          await writeTextFile('test.ini', iniContent, {
              baseDir: BaseDirectory.LocalData,
          });
          // await writeTextFile(filePath, iniContent);
      }
      return iniContent;
  };

  return {
    createDayOfWeekSkin
  };
}

// Add a function to check if the font file exists in the public/fonts directory
async function fontExistsInPublic(fontName: string): Promise<boolean> {
  console.log("Font name", fontName);
  const fontPath = await resourceDir() + `/_up_/public/fonts/${fontName}`;
  return await exists(fontPath);
}


// Modify the exportSkin function
export const exportSkin = async (exportPath: string, metadata: { name: string; author: string; version: string; description: string }) => {
  const scaleCorrection = 1.4;
  const layers = layerManager.getLayers();
  const exporter = new RainmeterSkinExporter({
    name: metadata.name,
    author: metadata.author,
    version: metadata.version,
    description: metadata.description,
  });

  const systemFonts = localFontManager.getCachedFonts();

  const fontsToCopy = new Set<string>(); // To track fonts to copy

  const minX = layers.reduce((min, layer) => {
    if (layer.fabricObject && layer.fabricObject.left !== undefined) {
      return Math.min(min, layer.fabricObject.left);
    }
    return min;
  }, Infinity);

  const minY = layers.reduce((min, layer) => {
    if (layer.fabricObject && layer.fabricObject.top !== undefined) {
      return Math.min(min, layer.fabricObject.top);
    }
    return min;
  }, Infinity);

  const addMeterLayer = (exporter: RainmeterSkinExporter, layer: any, text: IText, fontFace: string, stringStyle: string, adjustedX: number, adjustedY: number) => {
    
    exporter.addLayer({
      meter: {
        type: 'String',
        name: layer.name,
        measureName: 'Measure' + layer.name,
        options: {
          FontFace: fontFace,
          FontSize: text.fontSize.toString(),
          FontColor: layer.fabricObject.fill ? hexToRgb(layer.fabricObject.fill) : '0,0,0',
          StringStyle: stringStyle,
          X: (adjustedX * scaleCorrection).toString(),
          Y: (adjustedY * scaleCorrection).toString(),
          AntiAlias: "1",
          Text: '%1',
        }
      }
    });
  };

  layers.forEach(layer => {
    if (layer.type === 'text') {
      const text = layer.fabricObject as IText;
      const adjustedX = layer.fabricObject.left - minX; // Adjust x value
      const adjustedY = layer.fabricObject.top - minY; // Adjust y value

      const font = systemFonts.find(font => font.name === text.fontFamily);
      // console.log('tt', font);

      let stringStyle = "normal";
      let fontFace = text.fontFamily;

      if(text.fontFamily.includes(" Bold")) {
        stringStyle = "bold";
        fontFace = text.fontFamily.replace(" Bold", "");
      }

      if(text.fontFamily.includes(" Italic")) {
        stringStyle = "italic";
        fontFace = text.fontFamily.replace(" Italic", "");
      }

      if(text.fontFamily.includes(" Regular")) {
        stringStyle = "normal";
        fontFace = text.fontFamily.replace(" Regular", "");
      }

      if (layer.measure === "custom-text") {
        exporter.addLayer({
          meter: {
            type: 'String',
            name: layer.name,
            options: {
              FontFace: fontFace,
              FontSize: text.fontSize.toString(),
              FontColor: layer.fabricObject.fill ? hexToRgb(layer.fabricObject.fill) : '0,0,0',
              StringStyle: stringStyle,
              X: (adjustedX * scaleCorrection).toString(),
              Y: (adjustedY * scaleCorrection).toString(),
              AntiAlias: "1",
              Text: text.text,
            }
          }
        });
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-yyyy-mm-dd") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%F',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-mm-dd-yy") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%D',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "short-weekday") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%a',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "full-weekday") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%A',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "short-month") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%b',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "full-month") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%B',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "zero-day") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%d',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "space-day") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%e',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "short-year") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%g',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "full-year") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%G',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "hour-24") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%H',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "hour-12") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%I',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "month-number") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%m',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "minute-number") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%M',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "second-number") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%S',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "am-pm") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%p',
            }
          }
        });
        addMeterLayer(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY);
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } 
    }
  });

  // Check and copy the fonts
  for (const font of fontsToCopy) {
    console.log(font);
    const fontExists = await fontExistsInPublic(font);
    if (fontExists) {
      console.log
      const sourcePath = await resourceDir() + `/_up_/public/fonts/${font}`;
      const destinationPath = `${exportPath}/${font}`;
      await copyFile(sourcePath, destinationPath);
    }
  }

  // Generate the INI content
  const iniContent = exporter.export();

  return iniContent;
}

export const handleCreateDirectory = async (metadata: { name: string; author: string; version: string; description: string }): Promise<boolean> => {
  // Open dialog for the user to select a directory

  
  const selectedDirectory = await open({
    title: 'Select a Directory',
    directory: true,
  });

  let newDirectoryName = 'rmEditorSkin';

  if (selectedDirectory) {
    // Specify the new directory name
    if (metadata.name !== '') {
      newDirectoryName = metadata.name;
    }
    const newDirectoryPath = `${selectedDirectory}/${newDirectoryName}`;

    const resDirectory = '@Resources';
    const ResDirectoryPath = `${newDirectoryPath}/${resDirectory}`;
    const FontDirectoryPath = `${newDirectoryPath}/${resDirectory}/Fonts`;

    // Create the new directory
    try {
      await mkdir(newDirectoryPath);
      await mkdir(ResDirectoryPath);
      await mkdir(FontDirectoryPath);

      const iniContent = await exportSkin(FontDirectoryPath, metadata);

      // await copyFile(await resourceDir() + "/_up_/public/fonts/Tuesday Night.otf", `${FontDirectoryPath}/Tuesday Night.otf`);

      // Create the sample .txt file in the new directory
      const sampleFilePath = `${newDirectoryPath}/skin.ini`; // Specify the file path
      const sampleContent = iniContent; // Content for the sample file

      // Convert string to Uint8Array
      const encoder = new TextEncoder();
      const encodedContent = encoder.encode(sampleContent);

      await writeFile(sampleFilePath, encodedContent);

      return true;
    } catch (error) {
      console.error('Failed to create directory or file:', error);
      return false;
    }
  }

  return false;
};

function hexToRgb(hex: string | TFiller): string {
  // Remove the '#' character if present
  // if hex is string
  if (typeof hex === 'string') {
    hex = hex.replace(/^#/, '');

    // Parse the hex color
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    // Return RGB string in the desired format
    return `${r},${g},${b}`;
  }

  return "0,0,0";
}