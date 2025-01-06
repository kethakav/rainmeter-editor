// ExportToINI.ts
import { copyFile } from '@tauri-apps/plugin-fs';
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

interface RainmeterSkinProperties {
  allowScrollResize: boolean
}

interface RainmeterVariable {
  key: string;
  value: string;
}

interface RainmeterMeasure {
  type: 'Time' | 'Calc' | 'String' | 'Plugin' | 'CPU' | 'FreeDiskSpace';
  name: string;
  options: Record<string, string>;
}

interface RainmeterMeter {
  type: 'String' | 'Image' | 'Shape';
  name: string;
  measureName?: string;
  measureName2?: string;
  measureName3?: string;
  measureName4?: string;
  measureName5?: string;
  measureName6?: string;
  measureName7?: string;
  measureName8?: string;
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
  public properties: RainmeterSkinProperties = { allowScrollResize: false };
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
BackgroundMode=2
SolidColor=0,0,0,1
DynamicWindowSize=1
AccurateText=1
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

    // Add scoll resizing here ==================================================================

    if (this.properties.allowScrollResize) {
      exportContent += 'MouseScrollUpAction=[!SetVariable Scale "(#Scale#+#ScrollMouseIncrement#)"][!WriteKeyValue Variables Scale "(#Scale#+#ScrollMouseIncrement#)"][!Refresh] \n';
      exportContent += 'MouseScrollDownAction=[!SetVariable Scale "(#Scale#-#ScrollMouseIncrement# < 0.2 ? 0.2 : #Scale#-#ScrollMouseIncrement#)"][!WriteKeyValue Variables Scale "(#Scale#-#ScrollMouseIncrement# < 0.2 ? 0.2 : #Scale#-#ScrollMouseIncrement#)"][!Refresh]\n';
      exportContent += '\n';
    } else {
      exportContent += '\n';
    }
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
        if (meter.measureName2) {
          exportContent += `MeasureName2=${meter.measureName2}\n`;
        }
        if (meter.measureName3) {
          exportContent += `MeasureName3=${meter.measureName3}\n`;
        }
        if (meter.measureName4) {
          exportContent += `MeasureName4=${meter.measureName4}\n`;
        }
        if (meter.measureName5) {
          exportContent += `MeasureName5=${meter.measureName5}\n`;
        }
        if (meter.measureName6) {
          exportContent += `MeasureName6=${meter.measureName6}\n`;
        }
        if (meter.measureName7) {
          exportContent += `MeasureName7=${meter.measureName7}\n`;
        }
        if (meter.measureName8) {
          exportContent += `MeasureName8=${meter.measureName8}\n`;
        }

        
        Object.entries(meter.options).forEach(([key, value]) => {
          exportContent += `${key}=${value}\n`;
        });
        
        exportContent += '\n';
      });

    return exportContent;
  }
}

// Add a function to check if the font file exists in the public/fonts directory
async function fontExistsInPublic(fontName: string): Promise<boolean> {
  console.log("Font name", fontName);
  const fontPath = await resourceDir() + `/_up_/public/fonts/${fontName}`;
  return await exists(fontPath);
}


// Modify the exportSkin function
export const exportSkin = async (resourcePath: string, metadata: { name: string; author: string; version: string; description: string }, allowScrollResize: boolean) => {
  const scaleCorrection = 1.33;
  const layers = layerManager.getLayers();
  const exporter = new RainmeterSkinExporter({
    name: metadata.name,
    author: metadata.author,
    version: metadata.version,
    description: metadata.description,
  });

  exporter.properties.allowScrollResize = allowScrollResize;
  
  const systemFonts = localFontManager.getCachedFonts();

  const fontsToCopy = new Set<string>(); // To track fonts to copy
  const imagesToCopy: string[] = []; // To track images to copy

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

  exporter.addVariable('Scale', '1.0');
  exporter.addVariable('ScrollMouseIncrement', '0.05');

  const addStringMeterLayerOneMeasure = (exporter: RainmeterSkinExporter, layer: any, text: IText, fontFace: string, stringStyle: string, adjustedX: number, adjustedY: number, strCont: string) => {
    
    exporter.addLayer({
      meter: {
        type: 'String',
        name: layer.name,
        measureName: 'Measure' + layer.name,
        options: {
          FontFace: fontFace,
          FontSize: ('(' + (text.fontSize / scaleCorrection).toString() + ' * #Scale#)'),
          FontColor: layer.fabricObject.fill ? hexToRgb(layer.fabricObject.fill) : '0,0,0',
          StringStyle: stringStyle,
          X: ('(' + adjustedX.toString() + ' * #Scale#)'),
          Y: ('(' + adjustedY.toString() + ' * #Scale#)'),
          Angle: (layer.fabricObject.angle * (Math.PI / 180)).toString(),
          AntiAlias: "1",
          Text: strCont,
        }
      }
    });
  };

  layers.forEach(layer => {
    const adjustedX = layer.fabricObject.left - minX; // Adjust x value
    const adjustedY = layer.fabricObject.top - minY; // Adjust y value
    if (layer.type === 'text') {
      const text = layer.fabricObject as IText;

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
              FontSize: ('(' + (text.fontSize / scaleCorrection).toString() + ' * #Scale#)'),
              FontColor: layer.fabricObject.fill ? hexToRgb(layer.fabricObject.fill) : '0,0,0',
              StringStyle: stringStyle,
              X: ('(' + adjustedX.toString() + ' * #Scale#)'),
              Y: ('(' + adjustedY.toString() + ' * #Scale#)'),
              Angle: (layer.fabricObject.angle * (Math.PI / 180)).toString(),
              AntiAlias: "1",
              Text: text.text,
            }
          }
        });
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-yyyy-mm-dd") { // Date ====================================================
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%F',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
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
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-month-number") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%m',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-month-full") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%B',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-month-short") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%b',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-day-number") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%d',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-day-full") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%A',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-day-short") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%a',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-year-short") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%g',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "date-year-full") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%G',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "time-hour-minute-24") { // Time ====================================================
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%H:%M',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "time-hour-minute-24") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%I:%M %p',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "time-hour-24") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%H',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "time-hour-12") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%I',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "time-minute") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%M',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "time-second") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%S',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "time-am-pm") {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
              Format: '%p',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-average") { // CPU ====================================================
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-core-1") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '1',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-core-2") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '2',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-core-3") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '3',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-core-4") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '4',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-core-5") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '5',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-core-6") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '6',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-core-7") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '7',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "cpu-core-8") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '8',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1%');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "disk-c-label") { // DISK ====================================================
        exporter.addLayer({
          measure: {
            type: 'FreeDiskSpace',
            name: 'Measure' + layer.name,
            options: {
              Drive: 'C:',
              Label: '1',
              UpdateDivider: '5',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "disk-c-total-space") { 
        exporter.addLayer({
          measure: {
            type: 'FreeDiskSpace',
            name: 'Measure' + layer.name,
            options: {
              Drive: 'C:',
              Total: '1',
              UpdateDivider: '5',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1 B');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "disk-c-free-space") { 
        exporter.addLayer({
          measure: {
            type: 'FreeDiskSpace',
            name: 'Measure' + layer.name,
            options: {
              Drive: 'C:',
              UpdateDivider: '5',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1 B');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } else if (layer.measure === "disk-c-used-space") { 
        exporter.addLayer({
          measure: {
            type: 'FreeDiskSpace',
            name: 'Measure' + layer.name,
            options: {
              Drive: 'C:',
              InvertMeasure: '1',
              UpdateDivider: '5',
            }
          }
        });
        addStringMeterLayerOneMeasure(exporter, layer, text, fontFace, stringStyle, adjustedX, adjustedY, '%1 B');
        if (font) {
          fontsToCopy.add(font.src); // Track the font
        }
      } 
    } else if (layer.type === 'image') {
        if (!imagesToCopy.includes(layer.imageSrc)) {
          imagesToCopy.push(layer.imageSrc); // Track the image
        }
        exporter.addLayer({
          meter: {
            type: 'Image',
            name: layer.name,
            options: {
              ImageName: '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
              W: ('(' + (layer.fabricObject.scaleX * layer.fabricObject.width).toString() + ' * #Scale#)'),
              H: ('(' + (layer.fabricObject.scaleY * layer.fabricObject.height).toString() + ' * #Scale#)'),
              X: ('(' + (adjustedX).toString() + ' * #Scale#)'),
              Y: ('(' + (adjustedY).toString() + ' * #Scale#)'),
              Angle: (layer.fabricObject.angle * (Math.PI / 180)).toString(),
            }
          }
        });
    }
  });

  // Check and copy the fonts
  for (const font of fontsToCopy) {
    console.log(font);
    const fontExists = await fontExistsInPublic(font);
    if (fontExists) {
      console.log
      const sourcePath = await resourceDir() + `/_up_/public/fonts/${font}`;
      const destinationPath = `${resourcePath}/Fonts/${font}`;
      await copyFile(sourcePath, destinationPath);
    }
  }

  // Check and copy the images
  imagesToCopy.forEach(async (image, index) => {
    console.log(image);
    // const imageExists = await imageExistsInPublic(image);
    const sourcePath = image;
    const destinationPath = `${resourcePath}/Images/${index.toString() + '.png'}`;
    await copyFile(sourcePath, destinationPath);
  });

  // Generate the INI content
  const iniContent = exporter.export();

  return iniContent;
}

export const handleCreateDirectory = async (metadata: { name: string; author: string; version: string; description: string },  allowScrollResize: boolean): Promise<boolean> => {
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
    const ImageDirectoryPath = `${newDirectoryPath}/${resDirectory}/Images`;

    // Create the new directory
    try {
      await mkdir(newDirectoryPath);
      await mkdir(ResDirectoryPath);
      await mkdir(FontDirectoryPath);
      await mkdir(ImageDirectoryPath);

      const iniContent = await exportSkin(ResDirectoryPath, metadata, allowScrollResize);

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