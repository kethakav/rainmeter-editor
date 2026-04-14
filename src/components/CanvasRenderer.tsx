import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, FabricObject, Group, Point } from 'fabric';
import { canvasManager } from '../services/CanvasManager';
import { layerManager } from '@/services/LayerManager';
import { useLayerContext } from '@/context/LayerContext';
import { useTheme } from './theme-provider';
import ZoomControl from './ZoomControl';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

const CanvasRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { setSelectedLayer } = useLayerContext();
  const { theme } = useTheme();
  const canvasInstanceRef = useRef<Canvas | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  const spaceHeldRef = useRef(false);

  // Utility functions for color conversion
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
    const m = l - c / 2;
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

  const applyZoom = useCallback((canvas: Canvas, newZoom: number, pointX?: number, pointY?: number) => {
    const clampedZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);

    if (pointX !== undefined && pointY !== undefined) {
      // Zoom towards cursor position
      canvas.zoomToPoint(new Point(pointX, pointY), clampedZoom);
    } else {
      // Zoom towards canvas center
      const center = canvas.getCenterPoint();
      canvas.zoomToPoint(new Point(center.x, center.y), clampedZoom);
    }

    canvas.renderAll();
    setZoomLevel(clampedZoom);
  }, []);

  const handleZoomFromControl = useCallback((newZoom: number) => {
    const canvas = canvasInstanceRef.current;
    if (canvas) {
      applyZoom(canvas, newZoom);
    }
  }, [applyZoom]);

  const handleResetZoom = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (canvas) {
      // Reset viewport transform to identity
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.renderAll();
      setZoomLevel(1);
    }
  }, []);

  const handleZoomToFit = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    const skinBg = layerManager.getSkinBackground();
    if (!skinBg) return;

    const bound = skinBg.getBoundingRect();
    const canvasW = canvas.getWidth();
    const canvasH = canvas.getHeight();

    const scaleX = canvasW / bound.width;
    const scaleY = canvasH / bound.height;
    const zoom = Math.min(scaleX, scaleY) * 0.85; // 85% to give some padding
    const clampedZoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);

    // Center on the skin background
    const centerX = bound.left + bound.width / 2;
    const centerY = bound.top + bound.height / 2;

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.zoomToPoint(new Point(canvasW / 2, canvasH / 2), clampedZoom);

    // Pan so the skin background center is at canvas center
    const vpt = canvas.viewportTransform;
    vpt[4] = canvasW / 2 - centerX * clampedZoom;
    vpt[5] = canvasH / 2 - centerY * clampedZoom;
    canvas.setViewportTransform(vpt);

    canvas.renderAll();
    setZoomLevel(clampedZoom);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new Canvas(canvasRef.current, {
        preserveObjectStacking: true,
        height: window.innerHeight - 7,
        width: window.innerWidth - 500,
        backgroundColor: cssVariableToHex('--card'),
      });
      canvasInstanceRef.current = canvas;
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
          setSelectedLayer(layer);
          layer.UIElements.set({
            visible: true,
          })
          const UIGroup = layer.UIElements as Group;
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

      // Native DOM handlers for middle-click panning
      // (Fabric.js only fires mouse:down for left-click, so middle-click must use native events)
      const handleNativeMouseDown = (e: MouseEvent) => {
        if (e.button === 1) {
          e.preventDefault();
          isPanningRef.current = true;
          lastPanPointRef.current = { x: e.clientX, y: e.clientY };
          canvas.selection = false;
          canvas.setCursor('grabbing');
        }
      };

      const handleNativeMouseMove = (e: MouseEvent) => {
        if (isPanningRef.current && lastPanPointRef.current) {
          const dx = e.clientX - lastPanPointRef.current.x;
          const dy = e.clientY - lastPanPointRef.current.y;

          const vpt = canvas.viewportTransform;
          vpt[4] += dx;
          vpt[5] += dy;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();

          lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        }
      };

      const handleNativeMouseUp = (e: MouseEvent) => {
        if (e.button === 1 && isPanningRef.current) {
          isPanningRef.current = false;
          lastPanPointRef.current = null;
          canvas.selection = true;
          canvas.setCursor('default');
        }
      };

      const handleMouseDown = (event: any) => {
        const e = event.e as MouseEvent;

        // Space + left click panning
        if (spaceHeldRef.current && e.button === 0) {
          isPanningRef.current = true;
          lastPanPointRef.current = { x: e.clientX, y: e.clientY };
          canvas.selection = false;
          canvas.setCursor('grabbing');
          e.preventDefault();
          return;
        }

        const pointer = canvas.getPointer(event.e);

        if (layerManager.activeTool === 'select') {
          const target = canvas.findTarget(event.e);
          if (target) {
            const layer = layerManager.getLayers().find(layer => layer.fabricObject === target);
            if (layer) {
              setSelectedLayer(layer);
            }
          } else {
            canvas.discardActiveObject();
            setSelectedLayer(null);
          }
        } else {
          layerManager.addLayerWithMouse(pointer.x, pointer.y);
        }
      };

      const handleMouseMove = (event: any) => {
        if (isPanningRef.current && lastPanPointRef.current) {
          const e = event.e as MouseEvent;
          const dx = e.clientX - lastPanPointRef.current.x;
          const dy = e.clientY - lastPanPointRef.current.y;

          const vpt = canvas.viewportTransform;
          vpt[4] += dx;
          vpt[5] += dy;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();

          lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        }
      };

      const handleMouseUp = (_event: any) => {
        if (isPanningRef.current) {
          isPanningRef.current = false;
          lastPanPointRef.current = null;
          canvas.selection = true;
          canvas.setCursor('default');
        }
      };

      const handleMouseWheel = (event: any) => {
        const e = event.e as WheelEvent;

        // Ctrl/Cmd + scroll = zoom
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();

          const delta = e.deltaY;
          let newZoom = canvas.getZoom();

          // Smooth zoom step
          newZoom *= 0.999 ** delta;
          newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);

          const pointer = canvas.getViewportPoint(e);
          canvas.zoomToPoint(new Point(pointer.x, pointer.y), newZoom);
          canvas.renderAll();
          setZoomLevel(newZoom);
        } else {
          // Plain scroll = pan
          e.preventDefault();
          const vpt = canvas.viewportTransform;
          vpt[4] -= e.deltaX;
          vpt[5] -= e.deltaY;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
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

        if (currentWidth < window.innerWidth - 500) {
          canvas.setWidth(window.innerWidth - 500);
        }
        if (currentHeight < (window.innerHeight - 7)) {
          canvas.setHeight(window.innerHeight - 7);
        }
        canvas.renderAll();
      };

      // Keyboard event handlers for space bar panning
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !spaceHeldRef.current) {
          spaceHeldRef.current = true;
          if (canvas) {
            canvas.setCursor('grab');
            canvas.selection = false;
            // Temporarily disable all object selection
            canvas.forEachObject((obj) => {
              obj.set('evented', false);
            });
          }
        }
        // Ctrl+0 to reset zoom
        if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleResetZoom();
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          spaceHeldRef.current = false;
          isPanningRef.current = false;
          lastPanPointRef.current = null;
          if (canvas) {
            canvas.setCursor('default');
            canvas.selection = true;
            // Re-enable object selection
            canvas.forEachObject((obj) => {
              obj.set('evented', true);
            });
          }
        }
      };

      // Attach native DOM listeners for middle-click panning on the wrapper
      const wrapper = wrapperRef.current;
      if (wrapper) {
        wrapper.addEventListener('mousedown', handleNativeMouseDown);
        wrapper.addEventListener('mousemove', handleNativeMouseMove);
        wrapper.addEventListener('mouseup', handleNativeMouseUp);
      }

      window.addEventListener('resize', handleResize);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      canvas.on('selection:created', handleSelectionEvent);
      canvas.on('selection:updated', handleSelectionEvent);
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
      canvas.on('mouse:wheel', handleMouseWheel);
      canvas.on('object:moving', handleObjectMoving);

      return () => {
        canvas.off('selection:created', handleSelectionEvent);
        canvas.off('selection:updated', handleSelectionEvent);
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
        canvas.off('mouse:wheel', handleMouseWheel);
        canvas.off('object:moving', handleObjectMoving);
        canvas.dispose();
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (wrapper) {
          wrapper.removeEventListener('mousedown', handleNativeMouseDown);
          wrapper.removeEventListener('mousemove', handleNativeMouseMove);
          wrapper.removeEventListener('mouseup', handleNativeMouseUp);
        }
        canvasInstanceRef.current = null;
      };
    }
  }, []);

  // Update canvas background color when theme changes
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (canvas) {
      canvas.set({ backgroundColor: cssVariableToHex('--card') });
      canvas.renderAll();
    }
  }, [theme]);

  return (
    <div ref={wrapperRef} className="relative flex items-center justify-center bg-card h-full overflow-hidden">
      <div className="max-h-full max-w-full" style={{ maxHeight: 'calc(100vh - 7px)', maxWidth: 'calc(100vw - 500px)' }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <ZoomControl
        zoom={zoomLevel}
        onZoomChange={handleZoomFromControl}
        onResetZoom={handleResetZoom}
        onZoomToFit={handleZoomToFit}
        min={MIN_ZOOM}
        max={MAX_ZOOM}
      />
    </div>
  );
};

export default CanvasRenderer;