import React, { useEffect, useRef } from 'react';
import { Canvas, FabricObject, Group } from 'fabric';
import { canvasManager } from '../services/CanvasManager';
import { layerManager } from '@/services/LayerManager';
import { useLayerContext } from '@/context/LayerContext';

const CanvasRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { setSelectedLayerId, setSelectedLayer } = useLayerContext();

  useEffect(() => {
  const disableRefresh = () => {
    document.addEventListener('keydown', function (event) {
      // Prevent F5 or Ctrl+R (Windows/Linux) and Command+R (Mac) from refreshing the page
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r') || (event.metaKey && event.key === 'r')) {
        event.preventDefault();
      }
    });

    document.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });
  };

  disableRefresh();

  // Other existing code continues here...

  return () => {
    // Cleanup event listeners to prevent memory leaks
    document.removeEventListener('keydown', disableRefresh);
    document.removeEventListener('contextmenu', disableRefresh);
  };
}, []);

  useEffect(() => {
    // Function to convert HSL to Hex
    function hslToHex(h: number, s: number, l: number): string {
      h = Number(h);
      s = Number(s);
      l = Number(l);

      if (isNaN(h) || isNaN(s) || isNaN(l)) {
        console.warn('Invalid HSL values:', { h, s, l });
        return '#000000';
      }

      s /= 100;
      l /= 100;

      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c/2;
      let r = 0, g = 0, b = 0;

      if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
      } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
      } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
      } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
      } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
      } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
      }

      const toHex = (n: number): string => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function getCSSVariableValue(variableName: string): string {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
    }

    function cssVariableToHex(variableName: string): string {
      const hslValue = getCSSVariableValue(variableName);
      const hslMatch = hslValue.match(/(\d+(\.\d+)?)/g);
      
      if (!hslMatch || hslMatch.length < 3) {
        console.warn('Invalid HSL format:', hslValue);
        return '#000000';
      }

      const [h, s, l] = hslMatch.map(Number);
      return hslToHex(h, s, l);
    }

    if (canvasRef.current) {
      const canvas = new Canvas(canvasRef.current, {
        preserveObjectStacking: true,
        height: window.innerHeight - 64,
        width: window.innerWidth,
        backgroundColor: cssVariableToHex('--card'),
      });

      canvasManager.setCanvas(canvas);
      layerManager.setCanvas(canvas);
      canvas.renderAll();

      layerManager.setSkinBackground();

      const handleSelectionEvent = (event: any) => {
        if (!event.selected) return;
        if (event.selected.length > 1) {
          const obj = canvas.getActiveObject();
          if (obj) {
            obj.hasControls = false;
          }
          return;
        }
        
        const selectedObject = event.selected[0];
        const layer = layerManager.getLayerByFabricObject(selectedObject);
        
        if (layer?.UIElements) {
          setSelectedLayerId(layer.id);
          setSelectedLayer(layer);
          layer.UIElements.set({
            visible:true,
          })
          const UIGroup = layer.UIElements as Group;
          // UIGroup.bringObjectToFront(UIGroup);
          canvas.bringObjectToFront(UIGroup);
          // set other layers' UIElements invisible
          layerManager.getLayers().filter(l => l.id !== layer.id).forEach(l => {
            l.UIElements.set({
              visible: false,
            });
          });
        } else {
          console.warn("No corresponding layer found for the selected object.");
        }
      };

      const handleMouseDown = (event: any) => {
        const pointer = canvas.getPointer(event.e);
        
        if (layerManager.activeTool === 'select') {
          const target = canvas.findTarget(event.e);
          if (target) {
            const layer = layerManager.getLayers().find(layer => layer.fabricObject === target);
            if (layer) {
              setSelectedLayerId(layer.id);
              setSelectedLayer(layer);
            }
          } else {
            canvas.discardActiveObject();
            setSelectedLayerId(null);
            setSelectedLayer(null);
          }
        } else {
          layerManager.addLayerWithMouse(pointer.x, pointer.y);
        }
      };

      const handleObjectMoving = (event: any) => {
        var x = event.e.movementX;
        var y = event.e.movementY;
        const movingObject = event.target;
        console.log('Object moving:', movingObject);
        if (movingObject._objects) {
          console.log('Multiple objects moving');
          movingObject._objects.forEach((obj: FabricObject) => {
            const layer = layerManager.getLayerByFabricObject(obj);
            if (layer?.UIElements) {
              layer.UIElements.set({
                left: layer.UIElements.left + x,
                top: layer.UIElements.top + y
              });
              layer.UIElements.setCoords();
              canvas.renderAll();
            }
          });
        }
        else {
          const layer = layerManager.getLayerByFabricObject(movingObject);
          
          if (layer?.UIElements) {
            // Update UIElements position to match the fabric object
            layer.UIElements.set({
              left: layer.UIElements.left + x,
              top: layer.UIElements.top + y
            });
            layer.UIElements.setCoords();
            canvas.renderAll();
          }
        }
      };

      const handleResize = () => {
        const currentWidth = canvas.getWidth();
        const currentHeight = canvas.getHeight();

        if (currentWidth < window.innerWidth){
          canvas.setWidth(window.innerWidth);
        }
        if (currentHeight <( window.innerHeight - 64)){
          canvas.setHeight(window.innerHeight - 64);
        }
        canvas.renderAll();
      };
    
      window.addEventListener('resize', handleResize);
      canvas.on('selection:created', handleSelectionEvent);
      canvas.on('selection:updated', handleSelectionEvent);
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('object:moving', handleObjectMoving);

      return () => {
        canvas.off('selection:created', handleSelectionEvent);
        canvas.off('selection:updated', handleSelectionEvent);
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('object:moving', handleObjectMoving);
        canvas.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return (
    <div className="flex items-center justify-center bg-gray-100 h-full">
      <div className="max-w-full max-h-full overflow-auto" style={{ maxHeight: `calc(100vh - 64px)`, maxWidth: '100vw' }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default CanvasRenderer;