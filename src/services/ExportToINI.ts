// ExportToINI.ts
import { copyFile } from '@tauri-apps/plugin-fs';
import { layerManager } from './LayerManager';
import { Group, IText, Rect, TFiller } from 'fabric';
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
  type: 'String' | 'Image' | 'Shape' | 'Rotator' | 'Bar' | 'Button' | 'Audio' | 'WebParser' | 'Measure' | 'Meter';
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
  private skinWidth: number = 0;
  private skinHeight: number = 0;
  public properties: RainmeterSkinProperties = { allowScrollResize: false };
  private variables: RainmeterVariable[] = [];

  constructor(metadata: RainmeterMetadata, skinWidth: number, skinHeight: number) {
    this.metadata = metadata;
    this.skinWidth = skinWidth;
    this.skinHeight = skinHeight;
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
SkinWidth=(${this.skinWidth.toString()} * #Scale#)
SkinHeight=(${this.skinHeight.toString()} * #Scale#)
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

function getRotatedBounds(width: number, height: number, angleInDegrees: number) {
  // Convert angle to radians
  const angle = Math.abs(angleInDegrees * Math.PI / 180);
  
  // Calculate the bounds of the rotated rectangle
  const absCos = Math.abs(Math.cos(angle));
  const absSin = Math.abs(Math.sin(angle));
  
  // Calculate the dimensions of the bounding box
  const boundWidth = width * absCos + height * absSin;
  const boundHeight = width * absSin + height * absCos;
  
  return {
    width: boundWidth,
    height: boundHeight,
    scale: Math.min(width / boundWidth, height / boundHeight)
  };
}


// Modify the exportSkin function
export const exportSkin = async (resourcePath: string, metadata: { name: string; author: string; version: string; description: string }, allowScrollResize: boolean) => {
  const scaleCorrection = 1.33;
  const layers = layerManager.getLayers();
  const skinBackground = layerManager.getSkinBackground();


  const exporter = new RainmeterSkinExporter({
    name: metadata.name,
    author: metadata.author,
    version: metadata.version,
    description: metadata.description,
  },
    skinBackground?.width || 0,
    skinBackground?.height || 0
);
  
  exporter.properties.allowScrollResize = allowScrollResize;
  
  const systemFonts = localFontManager.getCachedFonts();

  const fontsToCopy = new Set<string>(); // To track fonts to copy
  const imagesToCopy: string[] = []; // To track images to copy

  const minX = skinBackground?.left || 0;
  const minY = skinBackground?.top || 0;
  // const minX = layers.reduce((min, layer) => {
  //   if (layer.fabricObject && layer.fabricObject.left !== undefined) {
  //     return Math.min(min, layer.fabricObject.left);
  //   }
  //   return min;
  // }, Infinity);

  // const minY = layers.reduce((min, layer) => {
  //   if (layer.fabricObject && layer.fabricObject.top !== undefined) {
  //     return Math.min(min, layer.fabricObject.top);
  //   }
  //   return min;
  // }, Infinity);

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
          FontColor: layer.fabricObject.fill ? hexToRgb(layer.fabricObject.fill, layer.fabricObject.opacity) : '0,0,0,255',
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

  const addRotatorMeterLayerOneMeasure = (exporter: RainmeterSkinExporter, layer: any, adjustedX: number, adjustedY: number, width: number, height: number, ImageName: string, OffsetX: number, OffsetY: number, startAngle: number, rotationAngle: number, valueRemainder?: number) => {
    const options: any = {
        ImageName: ImageName,
        W: ('(' + (width).toString() + ' * #Scale#)'),
        H: ('(' + (height).toString() + ' * #Scale#)'),
        X: ('(' + (adjustedX).toString() + ' * #Scale#)'),
        Y: ('(' + (adjustedY).toString() + ' * #Scale#)'),
        StartAngle: ((startAngle) * (Math.PI / 180)).toString(),
        RotationAngle: ((rotationAngle) * (Math.PI / 180)).toString(),
        OffsetX: ('(' + (OffsetX + (width / 2)).toString() + ' * #Scale#)'),
        OffsetY: ('(' + (OffsetY + (height / 2)).toString() + ' * #Scale#)')
    };

    if (valueRemainder !== undefined) {
        options.ValueRemainder = valueRemainder.toString();
    }

    exporter.addLayer({
        meter: {
            type: 'Rotator',
            name: layer.name,
            measureName: 'Measure' + layer.name,
            options: options
        }
    });
  }

  const addBarMeterLayerOneMeasure = (exporter: RainmeterSkinExporter, layer: any, adjustedX: number, adjustedY: number, width: number, height: number) => {
    const barGroup = layer.fabricObject as Group;
    const background = barGroup._objects[0] as Rect;
    const foreground = barGroup._objects[1] as Rect;
    console.log(width, height);
    exporter.addLayer({
      meter: {
        type: 'Bar',
        name: layer.name,
        measureName: 'Measure' + layer.name,
        options: {
          X: ('(' + adjustedX.toString() + ' * #Scale#)'),
          Y: ('(' + adjustedY.toString() + ' * #Scale#)'),
          W: ('(' + (barGroup.width * barGroup.scaleX).toString() + ' * #Scale#)'),
          H: ('(' + (barGroup.height * barGroup.scaleY).toString() + ' * #Scale#)'),
          BarOrientation: 'Horizontal',
          BarColor: background.fill ? hexToRgb(background.fill, background.opacity) : '0,0,0,255',
          SolidColor: foreground.fill ? hexToRgb(foreground.fill, foreground.opacity) : '0,0,0,255',
        }
      }
    });
  }

  layers.forEach(layer => {
    const adjustedX = (layer.fabricObject.left - minX); // Adjust x value
    const adjustedY = (layer.fabricObject.top - minY); // Adjust y value
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
              FontColor: layer.fabricObject.fill ? hexToRgb(layer.fabricObject.fill, layer.fabricObject.opacity) : '0,0,0',
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
      } else if (layer.measure === "time-hour-minute-12") {
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
      // const alpha = layer.fabricObject.angle * (Math.PI / 180);
      // const gamma = Math.atan(layer.fabricObject.width / layer.fabricObject.height);
      // const beta = alpha + gamma;
      // const d = Math.sqrt(Math.pow(layer.fabricObject.width, 2) + Math.pow(layer.fabricObject.height, 2));
      // const correctedW = d * Math.sin(beta);
      // const correctedH = d * Math.cos(beta);
      const { width: correctedW, height: correctedH } = getRotatedBounds(
        layer.fabricObject.width * layer.fabricObject.scaleX, 
        layer.fabricObject.height * layer.fabricObject.scaleY, 
        layer.fabricObject.angle
      );
      // console log each step of the calculation
      
      exporter.addLayer({
        meter: {
          type: 'Image',
          name: layer.name,
          options: {
            ImageName: '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
            W: ('(' + (correctedW).toString() + ' * #Scale#)'),
            H: ('(' + (correctedH).toString() + ' * #Scale#)'),
            X: ('(' + (adjustedX - (correctedW / 2)).toString() + ' * #Scale#)'),
            Y: ('(' + (adjustedY - (correctedH / 2)).toString() + ' * #Scale#)'),
            ImageRotate: (layer.fabricObject.angle).toString(),
          }
        }
      });
    } else if (layer.type === 'rotator') {
      if (!imagesToCopy.includes(layer.imageSrc)) {
        imagesToCopy.push(layer.imageSrc); // Track the image
      }
      if (layer.measure === 'rotator-time-second') {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
          60
        )
      }
      else if (layer.measure === 'rotator-time-minute') {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
          3600
        )
      } else if (layer.measure === 'rotator-time-hour') {
        exporter.addLayer({
          measure: {
            type: 'Time',
            name: 'Measure' + layer.name,
            options: {
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
          43200
        )
      } else if (layer.measure === 'rotator-cpu-average') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-cpu-core-1') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '1',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-cpu-core-2') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '2',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-cpu-core-3') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '3',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-cpu-core-4') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '4',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-cpu-core-5') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '5',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-cpu-core-6') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '6',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-cpu-core-7') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '7',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-cpu-core-8') {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
              Processor: '8',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      } else if (layer.measure === 'rotator-disk-c-usage') {
        exporter.addLayer({
          measure: {
            type: 'FreeDiskSpace',
            name: 'Measure' + layer.name + 'Total',
            options: {
              Drive: 'C:',
              Total: '1',
              UpdateDivider: '5',
            }
          }
        })
        exporter.addLayer({
          measure: {
            type: 'FreeDiskSpace',
            name: 'Measure' + layer.name + 'Used',
            options: {
              Drive: 'C:',
              InvertMeasure: '1',
              UpdateDivider: '5',
            }
          }
        })
        exporter.addLayer({
          measure: {
            type: 'Calc',
            name: 'Measure' + layer.name,
            options: {
              Formula: "Measure" + layer.name + "Used / Measure" + layer.name + "Total",
              UpdateDivider: '5',
            }
          }
        })
        addRotatorMeterLayerOneMeasure(
          exporter,
          layer,
          adjustedX - layer.fabricObject.width / 2,
          adjustedY - layer.fabricObject.height / 2,
          layer.fabricObject.width * layer.fabricObject.scaleX,
          layer.fabricObject.height * layer.fabricObject.scaleY,
          '#@#Images/' + imagesToCopy.findIndex(img => img === layer.imageSrc).toString() + '.png',
          Number(layer.properties.find(prop => prop.property === 'offsetX')?.value),
          Number(layer.properties.find(prop => prop.property === 'offsetY')?.value),
          Number(layer.properties.find(prop => prop.property === 'startAngle')?.value),
          Number(layer.properties.find(prop => prop.property === 'rotationAngle')?.value),
        )
      }
    } else if (layer.type === 'bar') {
      if (layer.measure === "bar-cpu") {
        exporter.addLayer({
          measure: {
            type: 'CPU',
            name: 'Measure' + layer.name,
            options: {
            }
          }
        });
        addBarMeterLayerOneMeasure(exporter, layer, adjustedX, adjustedY, layer.fabricObject.width, layer.fabricObject.height);
      } else if (layer.measure === "bar-disk") {
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
        addBarMeterLayerOneMeasure(exporter, layer, adjustedX, adjustedY, layer.fabricObject.width, layer.fabricObject.height);
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

function hexToRgb(hex: string | TFiller, opacity: number): string {
  // Remove the '#' character if present
  // if hex is string
  if (typeof hex === 'string') {
    hex = hex.replace(/^#/, '');

    // Parse the hex color
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    // Convert opacity from 0-1 to 0-255
    const alpha = Math.round(opacity * 255);

    // Return RGB string in the desired format with opacity
    return `${r},${g},${b},${alpha}`;
  }

  return `0,0,0,${Math.round(opacity * 255)}`;
}