//LayerManager.ts
// import { useToolContext } from '@/context/ToolContext';
import { open} from '@tauri-apps/plugin-dialog';
import { arrayMove } from '@dnd-kit/sortable';
import { join, resourceDir } from '@tauri-apps/api/path';
import { Canvas, Circle, FabricObject, FabricObjectProps, Rect, Triangle, IText, FabricImage, Group, Line, Text} from 'fabric';
import { convertFileSrc } from '@tauri-apps/api/core';

// Enum for layer types
enum LayerType {
  TEXT = 'text',
  SHAPE = 'shape',
  IMAGE = 'image',
  ROTATOR = 'rotator',
  BAR = 'bar',
}

interface LayerProperties {
  property: string;
  value: string;
}

// Interface for layer properties
interface LayerConfig {
  id: string;
  // mmtype: string;
  type: LayerType;
  fabricObject: FabricObject;
  visible: boolean;
  locked: boolean;
  name: string;
  measure: string;
  fontName: string;
  imageSrc: string;
  UIElements: FabricObject;
  properties: LayerProperties[];
}

class LayerManager {
    private static instance: LayerManager | null = null;
    public canvas: Canvas | null = null;
    private skinBackground: FabricObject | null = null;

    public activeTool: string = 'select';
  
    public layers: LayerConfig[] = [];

    private listeners: (() => void)[] = [];
    

    private layerCounts: { [key in LayerType]: number } = {
      [LayerType.TEXT]: 0,
      [LayerType.SHAPE]: 0,
      [LayerType.IMAGE]: 0,
      [LayerType.ROTATOR]: 0,
      [LayerType.BAR]: 0,
    };
  
    private constructor() {} // Make the constructor private

    
  
    public static getInstance(): LayerManager {
      if (!LayerManager.instance) {
        LayerManager.instance = new LayerManager();
      }
      return LayerManager.instance;
    }
  
    public setCanvas(canvas: Canvas) {
      this.canvas = canvas;
    }

    public getCanvas() {
        return this.canvas;
    }

    public setSkinBackground() {
      if (this.canvas) {
        const skinBackground = new Rect({
          width: 400,
          height: 300,
          stroke: '#000000',
          fill: 'transparent',
          strokeWidth: 1,
          originX: 'center',
          originY: 'center',
          strokeDashArray: [5, 5],
          hasControls: false,
          hasBorders: false,
        });

        const backgroundText = new Text('Skin Background', {
          lockScalingX: true,
          lockScalingY: true,
          fontSize: 18,
          fontFamily: 'Arial',
          fill: '#000000',
          opacity: 0.2,
          originX: 'center',
          originY: 'center',
          hasControls: false,
          hasBorders: false,
        });

        const backgroundGroup = new Group([skinBackground, backgroundText], {
          left: 400,
          top: 200,        
          originX: 'left',
          originY: 'top',
          hasControls: false,
          hasBorders: false,
        });
        backgroundGroup.setCoords();
        // background group clipping so that it doesn't clip object when the objects are scaled
        
        backgroundGroup.set({
          visible: true,
        });
        this.skinBackground = backgroundGroup;

        this.canvas.sendObjectToBack(backgroundGroup);
        this.canvas.add(backgroundGroup);
        this.canvas.renderAll();
      }
    }

    public getSkinBackground() {
      return this.skinBackground;
    }

    private toolChangeListeners: (() => void)[] = [];

  setActiveTool(tool: string) {
    this.activeTool = tool;
    // Notify tool change listeners
    this.toolChangeListeners.forEach(listener => listener());
  }

  // Add methods to subscribe and unsubscribe to tool changes
  subscribeToToolChanges(listener: () => void) {
    this.toolChangeListeners.push(listener);
  }

  unsubscribeFromToolChanges(listener: () => void) {
    this.toolChangeListeners = this.toolChangeListeners.filter(l => l !== listener);
  }

  addLayerWithMouse(x: number, y: number) {
    if(this.canvas) {
      if (this.activeTool === 'text') {
        this.addTextLayer("New Text", x, y);
        this.setActiveTool('select');
      }
      if (this.activeTool === 'image') {
        this.addImageLayer(x, y);
        this.setActiveTool('select');
      }
      if (this.activeTool === 'rotator') {
        this.addRotatorLayer(x, y);
        this.setActiveTool('select');
      }
      if (this.activeTool === 'bar') {
        this.addBarLayer(x, y);
        this.setActiveTool('select');
      }
    }

    return;
  }

  // Add a new layer to the stack
  addLayer(type: LayerType, fabricObject: FabricObject, imageSrc: string = "", UIElements: FabricObject = new Group(), properties: LayerProperties[] = []) {
    if (this.canvas) {
      const newLayer: LayerConfig = {
        id: this.generateUniqueId(),
        // mmtype,
        type,
        fabricObject,
        visible: true,
        locked: false,
        name: this.generateLayerName(type),
        measure: "",
        fontName: "null",
        imageSrc: imageSrc,
        UIElements: UIElements,
        properties: properties,
      };

      // Set measure
      if (type === LayerType.TEXT) {
        newLayer.measure = "custom-text";
      }
      if (type === LayerType.ROTATOR) {
        newLayer.measure = "rotator-time-second";
      }

      // Add to canvas and layers array
      this.canvas.add(fabricObject);
      this.canvas.add(UIElements);
      this.layers.push(newLayer);
      this.notifyListeners();

      // Select the newly added layer
      this.selectLayer(newLayer.id);

    //   return newLayer;
    }
    // return null; // Return null if canvas is not set
  }

  // Add text layer
  addTextLayer(text: string = 'New Text', x: number, y: number) {
    
    if (this.canvas) {
        const textObject = new IText(text, {
        left: x,
        top: y,
        fill: 'black',
        fontSize: 24,
        hasControls: false,
        });
        console.log(this.layers);

        this.addLayer(LayerType.TEXT, textObject);
    } else {
        return null;
    }
  }

  public updateFontForSelectedLayer(font: string) {
    if (this.canvas) {
      console.log("update font");
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        const activeLayer = this.getLayerByFabricObject(activeObject);
        if (activeLayer) {
          activeLayer.fontName = font; // Update the font
        }
        activeObject.set('fontFamily', font); // Update the font
        this.canvas.renderAll(); // Re-render the canvas to reflect changes
      }
    }
  }

  public async updateImageForSelectedLayer(imageSource: string) {
    // const { setSelectedLayerId, setSelectedLayer } = useLayerContext();
    if (this.canvas) {
      console.log("update image");
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        const activeLayer = this.getLayerByFabricObject(activeObject);
        // Update the image source
        const fabricImage = activeObject as FabricImage;
        await fabricImage.setSrc(imageSource);
        if (activeLayer) {
          activeLayer.imageSrc = imageSource; // Update the image source
          const offsetX = activeLayer.properties.find(prop => prop.property === 'offsetX');
          const offsetY = activeLayer.properties.find(prop => prop.property === 'offsetY');
          if (offsetX) {
            offsetX.value = '0';
          }
          if (offsetY) {
            offsetY.value = '0';
          }
          // setSelectedLayerId(activeLayer.id);
          // setSelectedLayer(activeLayer);
        }
        // update properties Sidebar
        // this.updatePropertiesSidebar(activeLayer);

        
        // offsetX: layer.properties.find(prop => prop.property === 'offsetX')?.value.toString() || '0',

        activeLayer?.UIElements.set({
          visible: true,
          left: activeLayer.fabricObject.left,
          top: activeLayer.fabricObject.top
        });
        this.canvas.renderAll(); // Re-render the canvas to reflect changes
        
      }
    }
  }

  public getLayerByFabricObject(fabricObject: FabricObject) {
    return this.layers.find(layer => layer.fabricObject === fabricObject);
  }

  public updateMeasureForSelectedLayer(measure: string) {

    if (this.canvas) {
      console.log("update measure", measure);
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        const actLayer = this.getLayerByFabricObject(activeObject);
        if (actLayer) {
          actLayer.measure = measure; // Update the measure in the layerConfig
          // Time ========================================================================
          if (measure === "time-hour-minute-24") {
            activeObject.set('text', "15:15");
          }
          if (measure === "time-hour-minute-12") {
            activeObject.set('text', "03:15 PM");
          }
          if (measure === "time-hour-24") {
            activeObject.set('text', "15");
          }
          if (measure === "time-hour-12") {
            activeObject.set('text', "03");
          }
          if (measure === "time-minute") {
            activeObject.set('text', "30");
          }
          if (measure === "time-second") {
            activeObject.set('text', "45");
          }
          if (measure === "time-am-pm") {
            activeObject.set('text', "PM");
          }
          // Date ========================================================================
          if (measure === "date-yyyy-mm-dd") {
            activeObject.set('text', "2025-01-01");
          }
          if (measure === "date-mm-dd-yy") {
            activeObject.set('text', "01-01-25");
          }
          if (measure === "custom-text") {
            activeObject.set('text', "Custom Text");
          }
          if (measure === "date-month-number") {
            activeObject.set('text', "01");
          }
          if (measure === "date-month-full") {
            activeObject.set('text', "January");
          }
          if (measure === "date-month-short") {
            activeObject.set('text', "Jan");
          }
          if (measure === "date-day-number") {
            activeObject.set('text', "01");
          }
          if (measure === "date-day-full") {
            activeObject.set('text', "Monday");
          }
          if (measure === "date-day-short") {
            activeObject.set('text', "Mon");
          }
          if (measure === "date-year-short") {
            activeObject.set('text', "25");
          }
          if (measure === "date-year-full") {
            activeObject.set('text', "2025");
          }
          // CPU =============================================================================
          if (measure === "cpu-average") {
            activeObject.set('text', "69%");
          }
          if (measure === "cpu-core-1") {
            activeObject.set('text', "10%");
          }
          if (measure === "cpu-core-2") {
            activeObject.set('text', "20%");
          }
          if (measure === "cpu-core-3") {
            activeObject.set('text', "30%");
          }
          if (measure === "cpu-core-4") {
            activeObject.set('text', "40%");
          }
          if (measure === "cpu-core-5") {
            activeObject.set('text', "50%");
          }
          if (measure === "cpu-core-6") {
            activeObject.set('text', "60%");
          }
          if (measure === "cpu-core-7") {
            activeObject.set('text', "70%");
          }
          if (measure === "cpu-core-8") {
            activeObject.set('text', "80%");
          }
          // DISK ==============================================================================
          if (measure === "disk-c-label") {
            activeObject.set('text', "Windows");
          }
          if (measure === "disk-c-total-space") {
            activeObject.set('text', "123456789 B");
          }
          if (measure === "disk-c-free-space") {
            activeObject.set('text', "123456789 B");
          }
          if (measure === "disk-c-used-space") {
            activeObject.set('text', "123456789 B");
          }
          // RAM =============================================================================

          this.canvas.renderAll(); // Re-render the canvas to reflect changes
        }
      }
      // if (activeObject) {
      //   activeObject.set('fontFamily', measure); // Update the font
      //   this.canvas.renderAll(); // Re-render the canvas to reflect changes
      // }
    }
  }

  async addImageLayer(x: number, y: number) {
    if (this.canvas) {
        // Open a file dialog to select an image
        const selectedFile = await open({
            title: 'Select an Image',
            filters: [
                {
                    name: 'Images',
                    extensions: ['png'],
                },
            ],
        });
        

        // Check if a file was selected
        if (selectedFile) {
            // Convert to the appropriate format (string if selectedFile is a File)
            const sourcePath = await join(selectedFile as string);
            const assetUrl = convertFileSrc(sourcePath);
            console.log(sourcePath);
            console.log(assetUrl);
            
            // Use fromURL correctly with await
            try {
                const img: FabricImage = await FabricImage.fromURL(assetUrl, { crossOrigin: 'anonymous' });
                img.set({
                    left: x,
                    top: y,
                    outerHeight: img.height,
                    outerWidth: img.width,
                    scaleX: 1,
                    scaleY: 1,
                    hasControls: false,
                });
                this.addLayer(LayerType.IMAGE, img, sourcePath);
            } catch (error) {
                console.error("Error loading image:", error);
            }
        }
    } else {
        return null;
    }
  }

  async addRotatorLayer(x: number, y: number) {
    if (this.canvas) {
      const resPath = await resourceDir();
      const source = await join(resPath, '_up_/public/images/Needle.png');
      const assetUrl = convertFileSrc(source);
      console.log(assetUrl);
      
      // Use fromURL correctly with await
      try {
          const img: FabricImage = await FabricImage.fromURL(assetUrl, { crossOrigin: 'anonymous' });
          img.set({
              left: x,
              top: y,
              outerHeight: img.height,
              outerWidth: img.width,
              originX: 'center',
              originY: 'center',
              centeredScaling: true,
              centeredRotation: true,
              angle: 90,
              scaleX: 1,
              scaleY: 1,
              hasControls: false,
          });
          const rangeIndicator = new Circle({
            radius: 40,
            originX: 'center',
            originY: 'center',
            centeredScaling: true,
            centeredRotation: true,
            left: x,
            top: y,
            angle: 0,
            startAngle: 0,
            endAngle: 90,
            stroke: '#0F0',
            opacity: 0.5,
            strokeWidth: 25,
            fill: ''
          });
          const indLine = new Line([x, y, x + 50, y], {
            stroke: '#000',
            strokeWidth: 2,
            opacity: 0,
            hasControls: false,

          });
          const pivotPoint = new Circle({
            radius: 5,
            originX: 'center',
            originY: 'center',
            centeredScaling: true,
            centeredRotation: true,
            fill: '#FF0000',
            opacity: 0.5,
            left: x,
            top: y,
            hasControls: false,
        });
          const UIElements = new Group([pivotPoint, rangeIndicator, indLine], {
            visible: true,
            hasControls: false,
            interactive: false,
            selectable: false,
            perPixelTargetFind: true,
            originX: 'center',
            originY: 'center',
            centeredScaling: true,
            centeredRotation: true,
          });
          
          // set the UIElements visible

          // add layerProperties
          const layerProperties: LayerProperties[] = [
            {
              property: "offsetX",
              value: '0'
            },
            {
              property: "offsetY",
              value: '0'
            },
            {
              property: "startAngle",
              value: "0"
            },
            {
              property: "rotationAngle",
              value: "90"
            }
          ];
          this.addLayer(LayerType.ROTATOR, img, source, UIElements, layerProperties);
      } catch (error) {
          console.error("Error loading image:", error);
      }
        
    } else {
        return null;
    }
  }

  async addBarLayer(x: number, y: number) {
    if (this.canvas) {
      try {
        const background = new Rect({
          left: x,
          top: y,
          width: 200,
          height: 50,
          fill: '#000',
          hasControls: false,
        });
        const foreground = new Rect({
          left: x,
          top: y,
          width: 150,
          height: 50,
          fill: '#FFA500',
          hasControls: false,
        });
        const bar = new Group([background, foreground], {
          centeredScaling: true,
          centeredRotation: true,
          hasControls: false,
          perPixelTargetFind: true,
        });
        // const layerProperties: LayerProperties[] = [
        //   {
        //     property: "barOrientation",
        //     value: 'horizontal'
        //   },
        //   {
        //     property: "flip",
        //     value: '0'
        //   }
        // ];
        this.addLayer(LayerType.BAR, bar);
      } catch (error) {
        console.error("Error loading image:", error);
      }
    }
  }

  subscribeToLayerChanges(listener: () => void) {
    this.listeners.push(listener);
  }

  unsubscribeFromLayerChanges(listener: () => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Notify subscribers of layer changes
  private notifyLayerChange() {
    this.listeners.forEach(listener => listener());
}

  // Add shape layer
  addShapeLayer(type: 'rect' | 'circle' | 'triangle', options: Partial<FabricObjectProps> = {}) {
    if (this.canvas) {
        let shapeObject: FabricObject;
    
        switch(type) {
        case 'rect':
            shapeObject = new Rect({
            width: 100,
            height: 100,
            fill: 'blue',
            left: 100,
            top: 100,
            ...options
            });
            break;
        case 'circle':
            shapeObject = new Circle({
            radius: 50,
            fill: 'green',
            left: 100,
            top: 100,
            ...options
            });
            break;
        case 'triangle':
            shapeObject = new Triangle({
            width: 100,
            height: 100,
            fill: 'red',
            left: 100,
            top: 100,
            ...options
            });
            break;
        }

        this.addLayer(LayerType.SHAPE, shapeObject);
    } 
    // else {
    //     return null;
    // }
  }

  // Add image layer
//   addImageLayer(imageSource: string): Promise<LayerConfig> {
//     return new Promise((resolve, reject) => {
//       fabric.Image.fromURL(imageSource, (img) => {
//         img.set({
//           left: 100,
//           top: 100,
//           scaleX: 0.5,
//           scaleY: 0.5
//         });

//         const layer = this.addLayer(LayerType.IMAGE, img);
//         resolve(layer);
//       }, (error) => {
//         console.error('Error loading image:', error);
//         reject(error);
//       });
//     });
//   }


  // Remove a layer by ID
  removeLayer(layerId: string): void {
    if (this.canvas) {
        const layerIndex = this.layers.findIndex(layer => layer.id === layerId);
    
        if (layerIndex !== -1) {
        const layer = this.layers[layerIndex];
        
        // Remove from canvas
        this.canvas.remove(layer.fabricObject);
        this.canvas.remove(layer.UIElements);
        
        // Remove from layers array
        this.layers.splice(layerIndex, 1);
        
        // Render canvas
        this.canvas.renderAll();
        }
    }
  }

  public getSelectedLayerId(): string | null {
    const activeObject = this.canvas?.getActiveObject();
    const layer = this.layers.find(layer => layer.fabricObject === activeObject);
    return layer?.id ?? null;
  }

  // Method to move a layer in the layers array
  public moveLayer(layerId: string, direction: 'up' | 'down') {
    const layerIndex = this.layers.findIndex(layer => layer.id === layerId);
    if (layerIndex === -1) return; // Layer not found

    if (direction === 'up' && layerIndex > 0) {
        // Move layer up
        const newOrder = arrayMove(this.layers, layerIndex, layerIndex - 1);
        this.layers = newOrder;
    } else if (direction === 'down' && layerIndex < this.layers.length - 1) {
        // Move layer down
        const newOrder = arrayMove(this.layers, layerIndex, layerIndex + 1);
        this.layers = newOrder;
    }

    console.log("tt");
    this.updateCanvasLayerOrder();
    // Notify any subscribers that layers have changed
    this.notifyLayerChange();
}

  // Select a layer by ID
  public selectLayer(layerId: string): void {
    if (this.canvas) {
      console.log(layerId);
        const layer = this.layers.find(l => l.id === layerId);
    
        if (layer) {
        // Deselect all objects
        this.canvas.discardActiveObject();
        
        // Select the specific object
        this.canvas.setActiveObject(layer.fabricObject);
        
        this.canvas.renderAll();
        }
    }
  }

  // Accepts reordered layers array and updates the internal layers order
  public reorderLayers(newOrder: string[]): void {
    this.layers = newOrder.map(id => this.layers.find(layer => layer.id === id)!);
    this.notifyLayerChange(); // Notify subscribers about the updated order
  }

  // Toggle layer visibility
  toggleLayerVisibility(layerId: string): void {
    if (this.canvas) {
        const layer = this.layers.find(l => l.id === layerId);
    
        if (layer) {
        layer.visible = !layer.visible;
        layer.fabricObject.set('visible', layer.visible);
        this.canvas.renderAll();
        }
    }
  }

  // Lock/unlock layer
  toggleLayerLock(layerId: string): void {
    if (this.canvas) {
        const layer = this.layers.find(l => l.id === layerId);
    
        if (layer) {
        layer.locked = !layer.locked;
        layer.fabricObject.set('selectable', !layer.locked);
        this.canvas.renderAll();
        }
    }
  }

  public updateCanvasLayerOrder(): void {
    console.log("updating canvas");
    const selected = this.canvas?.getActiveObject();
    if (this.canvas) {
      // Remove all objects
      this.canvas.getObjects().forEach(obj => {
        if(this.canvas) {
            this.canvas.remove(obj)
        }
    });
      
      // Re-add in the correct order
      this.layers.forEach(layer => {
        if (this.canvas) {
          this.canvas.add(layer.fabricObject)
        }
    });
    if(selected) {
      this.canvas.setActiveObject(selected);
    }
      this.canvas.renderAll();
    } else {
      console.warn('Canvas is not set. Unable to update layer order.');
    }
  }
  

  // Generate unique ID for layers
  private generateUniqueId(): string {
    return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate default layer name
  private generateLayerName(type: LayerType): string {
    this.layerCounts[type] += 1;
    const typeLabels = {
      [LayerType.TEXT]: 'Text',
      [LayerType.SHAPE]: 'Shape',
      [LayerType.IMAGE]: 'Image',
      [LayerType.ROTATOR]: 'Rotator',
      [LayerType.BAR]: 'Bar',
    };
    
    return `${typeLabels[type]}${this.layerCounts[type]}`;
  }

  // Get all layers
  getLayers(): LayerConfig[] {
    return [...this.layers];
  }
}

export const layerManager = LayerManager.getInstance();