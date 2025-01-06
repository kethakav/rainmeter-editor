import React, { useEffect, useRef } from 'react';
import { ActiveSelection, Canvas, Control, Group } from 'fabric';
import { canvasManager } from '../services/CanvasManager';
import { layerManager } from '@/services/LayerManager';
import { useLayerContext } from '@/context/LayerContext';
import { prototype } from 'events';

const CanvasRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { setSelectedLayerId, setSelectedLayer } = useLayerContext();

  useEffect(() => {
    // Function to convert HSL to Hex
    function hslToHex(h: number, s: number, l: number): string {
      // Make sure we're working with numbers
      h = Number(h);
      s = Number(s);
      l = Number(l);

      // Validate inputs
      if (isNaN(h) || isNaN(s) || isNaN(l)) {
        console.warn('Invalid HSL values:', { h, s, l });
        return '#000000'; // Default to black if conversion fails
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

    // Function to get computed CSS variable value
    function getCSSVariableValue(variableName: string): string {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
    }

    // Function to parse HSL string and convert to hex
    function cssVariableToHex(variableName: string): string {
      const hslValue = getCSSVariableValue(variableName);
      
      // Handle different HSL formats
      const hslMatch = hslValue.match(/(\d+(\.\d+)?)/g);
      
      if (!hslMatch || hslMatch.length < 3) {
        console.warn('Invalid HSL format:', hslValue);
        return '#000000'; // Default to black if parsing fails
      }

      const [h, s, l] = hslMatch.map(Number);
      return hslToHex(h, s, l);
    }

    if (canvasRef.current) {
      const canvas = new Canvas(canvasRef.current, {
        preserveObjectStacking: true,
        height: window.innerHeight,
        width: window.innerWidth,
        backgroundColor: cssVariableToHex('--card'),
      });

      canvasManager.setCanvas(canvas);
      layerManager.setCanvas(canvas);
      canvas.renderAll();

      Group.prototype.hasControls = false;

      // Rest of your event handlers...
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
        const layer = layerManager
          .getLayers()
          .find(layer => layer.fabricObject === selectedObject);
      
        if (layer) {
          setSelectedLayerId(layer.id);
          setSelectedLayer(layer);
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

      const handleResize = () => {
        canvas.setWidth(window.innerWidth);
        canvas.setHeight(window.innerHeight);
        canvas.renderAll();
      };
    
      window.addEventListener('resize', handleResize);
      canvas.on('selection:created', handleSelectionEvent);
      canvas.on('selection:updated', handleSelectionEvent);
      canvas.on('mouse:down', handleMouseDown);

      return () => {
        canvas.off('selection:created', handleSelectionEvent);
        canvas.off('selection:updated', handleSelectionEvent);
        canvas.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default CanvasRenderer;