import React, { useEffect, useState, KeyboardEvent, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLayerContext } from '@/context/LayerContext';
import { layerManager } from '@/services/LayerManager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FabricImage, FabricObject, Group, IText, Rect } from 'fabric';
import { localFontManager } from '@/services/LocalFontManager';
import { SingleFontLoad } from '@/services/singleFontLoad';
import { Card, CardContent, CardHeader } from './ui/card';
import { Slider } from "@/components/ui/slider"

const PropertiesSidebar: React.FC = () => {
  const { selectedLayerId, selectedLayer } = useLayerContext();
  const xInputRef = useRef<HTMLInputElement>(null);
  const yInputRef = useRef<HTMLInputElement>(null);

  const [textLayerProperties, setTextLayerProperties] = useState({
    x: '',
    y: '',
    rotation: '',
    color: '#000000',
    font: 'Arial',
    measure: 'custom-text',
    fontSize: '12',
    opacity: '1', // Add opacity with default value 1 (fully opaque)
  });

  const [imageLayerProperties, setImageLayerProperties] = useState({
    x: '',
    y: '',
    height: '',
    width: '',
    rotation: '',
    source: '',
    measure: 'static-image',
  });

  const [rotatorLayerProperties, setRotatorLayerProperties] = useState({
    x: '',
    y: '',
    height: '',
    width: '',
    offsetX: '',
    offsetY: '',
    rotation: '',
    startAngle: '',
    rotationAngle: '',
    source: '',
    measure: 'rotator-time-second',
  });

  const [barLayerProperties, setBarLayerProperties] = useState({
    x: '',
    y: '',
    height: '',
    width: '',
    backgroundFill: '',
    backgroundOpacity: '',
    foregroundFill: '',
    foregroundOpacity: '',
    measure: 'static-image',
  });

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [measureType, setMeasureType] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const loadFonts = async () => {
      const fonts = await localFontManager.scanLocalFonts();
      setSystemFonts(fonts.map(font => font.name)); // Set the name property
    };

    loadFonts();
    // preloadCustomFonts();
  }, []);

  const getMeasureTypeAndCategory = (measure: string) => {
    if (measure === 'custom-text') {
      return { type: 'custom-text', category: '' };
    }

    if (measure.startsWith('time-')) {
      return { type: 'time-date', category: 'time' };
    }

    if (measure.startsWith('date-')) {
      return { type: 'time-date', category: 'date' };
    }

    if (measure.startsWith('cpu-')) {
      return { type: 'cpu', category: measure };
    }

    if (measure.startsWith('disk-')) {
      return { type: 'disk', category: measure };
    }

    if (measure.startsWith('rotator-time-')) {
      return { type: 'time', category: '' };
    }
    if (measure.startsWith('rotator-cpu-')) {
      return { type: 'cpu', category: '' };
    }
    if (measure.startsWith('rotator-disk-')) {
      return { type: 'disk', category: '' };
    }

    return { type: 'custom-text', category: '' };
  };

  useEffect(() => {
    const updateLayerProperties = () => {
      if (selectedLayerId) {
        const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        if (layer) {
          if (layer.type === 'text') {
            const text = layer.fabricObject as IText;
            const measure = layer.measure || 'custom-text';
            const { type, category: newCategory } = getMeasureTypeAndCategory(measure);

            setTextLayerProperties({
              x: text.left?.toString() || '0',
              y: text.top?.toString() || '0',
              rotation: text.angle?.toString() || '0',
              color: text.fill?.toString() || '#000000',
              opacity: text.opacity?.toString() || '1', // Add opacity property
              font: text.fontFamily || 'Arial',
              measure: measure,
              fontSize: text.fontSize?.toString() || '12',
            });

            setMeasureType(type);
            setCategory(newCategory);
          } else if (layer.type === 'image') {
            const image = layer.fabricObject as FabricImage;
            const measure = layer.measure || 'static-image';
            console.log(image.width);
            console.log(image.height);

            setImageLayerProperties({
              x: image.left?.toString() || '0',
              y: image.top?.toString() || '0',
              height: (image.scaleY * image.height)?.toString() || '100',
              width: (image.scaleX * image.width)?.toString() || '100',
              rotation: image.angle?.toString() || '0',
              source: layer.imageSrc || '',
              measure: measure,
            });

            // Optionally, manage measureType and category for images if applicable
            // For now, we'll reset them
            setMeasureType('');
            setCategory('');
          } else if (layer.type === 'rotator') {
            const rotator = layer.fabricObject as FabricImage;
            const measure = layer.measure || 'rotator-time-second';
            const { type, category: newCategory } = getMeasureTypeAndCategory(measure);

            setRotatorLayerProperties({
              x: rotator.left?.toString() || '0',
              y: rotator.top?.toString() || '0',
              height: (rotator.scaleY * rotator.height)?.toString() || '100',
              width: (rotator.scaleX * rotator.width)?.toString() || '100',
              offsetX: layer.properties.find(prop => prop.property === 'offsetX')?.value.toString() || '0',
              offsetY: layer.properties.find(prop => prop.property === 'offsetY')?.value.toString() || '0',
              startAngle: layer.properties.find(prop => prop.property === 'startAngle')?.value.toString() || '0',
              rotationAngle: layer.properties.find(prop => prop.property === 'rotationAngle')?.value.toString() || '90',
              rotation: rotator.angle?.toString() || '0',
              source: layer.imageSrc || '',
              measure: measure,
            });

            // Optionally, manage measureType and category for images if applicable
            // For now, we'll reset them
            setMeasureType(type);
            setCategory(newCategory);
          } else if (layer.type === 'bar') {
            const bar = layer.fabricObject as FabricImage;
            const measure = layer.measure || 'static-image';
            console.log(bar.width);
            console.log(bar.height);
            const barGroup = layer.fabricObject as Group;
            const background = barGroup._objects[0] as Rect;
            const foreground = barGroup._objects[1] as Rect

            setBarLayerProperties({
              x: bar.left?.toString() || '0',
              y: bar.top?.toString() || '0',
              height: (bar.scaleY * bar.height)?.toString() || '100',
              width: (bar.scaleX * bar.width)?.toString() || '100',
              backgroundFill: background.fill?.toString() || '#000000',
              backgroundOpacity: background.opacity?.toString() || '1',
              foregroundFill: foreground.fill?.toString() || '#000000',
              foregroundOpacity: foreground.opacity?.toString() || '1',
              measure: measure,
            });

            // Optionally, manage measureType and category for images if applicable
            // For now, we'll reset them
            setMeasureType('');
            setCategory('');
          }
        }
      }
    };

    updateLayerProperties();

    const canvas = layerManager.getCanvas();
    if (canvas) {
      canvas.on('selection:created', updateLayerProperties);
      canvas.on('selection:updated', updateLayerProperties);
      canvas.on('object:modified', updateLayerProperties);
      canvas.on('object:added', updateLayerProperties);
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!isInputFocused && selectedLayerId) {
        const stepSize = event.shiftKey ? 10 : 1;
        const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        const canvas = layerManager.getCanvas();

        if (layer && canvas) {
          switch (event.key) {
            case 'ArrowUp':
              event.preventDefault();
              layer.fabricObject.top = (layer.fabricObject.top || 0) - stepSize;
              break;
            case 'ArrowDown':
              event.preventDefault();
              layer.fabricObject.top = (layer.fabricObject.top || 0) + stepSize;
              break;
            case 'ArrowLeft':
              event.preventDefault();
              layer.fabricObject.left = (layer.fabricObject.left || 0) - stepSize;
              break;
            case 'ArrowRight':
              event.preventDefault();
              layer.fabricObject.left = (layer.fabricObject.left || 0) + stepSize;
              break;
            default:
              return; // Exit for keys that are not arrow keys
          }
          layer.fabricObject.setCoords();
          canvas.renderAll();
          updateLayerProperties();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown as unknown as EventListener);

    return () => {
      if (canvas) {
        canvas.off('selection:created', updateLayerProperties);
        canvas.off('selection:updated', updateLayerProperties);
        canvas.off('object:modified', updateLayerProperties);
        canvas.off('object:added', updateLayerProperties);
      }
      window.removeEventListener('keydown', handleGlobalKeyDown as unknown as EventListener);
    };
  }, [selectedLayerId, isInputFocused]);

  // Handlers for Text Layer
  const handleTextInputChange = (field: keyof typeof textLayerProperties, value: string) => {
    setTextLayerProperties(prev => ({ ...prev, [field]: value }));
    if (field === 'x' || field === 'y') {
      updateTextLayerPosition(field, value);
    }
    if (field === 'fontSize') {
      updateFontSize(value);
    }
    if (field === 'rotation') {
      updateTextLayerRotation(value);
    }
  };

  const handleFontChange = async (font: string) => {
    // Update the font in the canvas
    await SingleFontLoad(font);
    layerManager.updateFontForSelectedLayer(font);

    // Update the font in the component's state to reflect the change in the dropdown
    setTextLayerProperties(prev => ({
      ...prev,
      font: font
    }));
  };

  const handleColorChange = (value: string) => {
    console.log(value);
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'text') {
      console.log(layer.fabricObject);
      layer.fabricObject.set({ fill: value });
      
      setTextLayerProperties(prev => ({ ...prev, color: value }));
      canvas?.renderAll();
    }
  };

  const handleOpacityChange = (value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
  
    if (layer && layer.type === 'text') {
      layer.fabricObject.set({ opacity: parseFloat(value) }); // Update opacity on the object
  
      setTextLayerProperties(prev => ({ ...prev, opacity: value })); // Update state
      canvas?.renderAll();
    }
  };

  const handleTextMeasureChange = (measure: string) => {
    console.log(measure);
    layerManager.updateMeasureForSelectedLayer(measure);
    setTextLayerProperties(prev => ({
      ...prev,
      measure: measure
    }));

    if (measure.startsWith('time-')) {
      setMeasureType('time-date');
      setCategory('time');
    } else if (measure.startsWith('date-')) {
      setMeasureType('time-date');
      setCategory('date');
    } else if (measure.startsWith('cpu-')) {
      setMeasureType('cpu');
      setCategory(measure);
    } else if (measure.startsWith('disk-')) {
      setMeasureType('disk');
      setCategory(measure);
    } else {
      setMeasureType('custom-text');
      setCategory('');
    }
  };

  const handleTextMeasureTypeChange = (value: string) => {
    setMeasureType(value);
    if (value === 'time-date') {
      setCategory('time');
      handleTextMeasureChange('time-hour-minute-24');
    }
    if (value === 'cpu') {
      setCategory('cpu-average');
      handleTextMeasureChange('cpu-average');
    }
    if (value === 'disk') {
      setCategory('disk-c-label');
      handleTextMeasureChange('disk-c-label');
    }
  };

  const handleTextCategoryChange = (value: string) => {
    if (value === 'time') {
      setCategory('time');
      handleTextMeasureChange('time-hour-minute-24');
    }
    if (value === 'date') {
      setCategory('date');
      handleTextMeasureChange('date-yyyy-mm-dd');
    }
  };

  const handleRotatorMeasureChange = (measure: string) => {
    console.log(measure);
    layerManager.updateMeasureForSelectedLayer(measure);
    setRotatorLayerProperties(prev => ({
      ...prev,
      measure: measure
    }));
  };

  const handleRotatorMeasureTypeChange = (value: string) => {
    setMeasureType(value);
    // Set default measure for each type
    if (value === 'time') {
      handleRotatorMeasureChange('rotator-time-second');
    } else if (value === 'cpu') {
      handleRotatorMeasureChange('rotator-cpu-average');
    } else if (value === 'disk') {
      handleRotatorMeasureChange('rotator-disk-c-usage');
    }
  };

  const updateTextLayerPosition = (field: 'x' | 'y', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer) {
      const numValue = Number(value);

      if (field === 'x') {
        layer.fabricObject.left = numValue;
      } else if (field === 'y') {
        layer.fabricObject.top = numValue;
      }

      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateTextLayerRotation = (value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer) {
      const numValue = Number(value);
      layer.fabricObject.angle = numValue;
      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateFontSize = (value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'text') {
      const numValue = Number(value);
      const txt = layer.fabricObject as IText;
      txt.set({ fontSize: numValue });
      txt.setCoords();
      canvas?.renderAll();
      setTextLayerProperties(prev => ({
        ...prev,
        fontSize: numValue.toString()
      }));
    }
  };

  

  const handleTextKeyDown = (field: 'x' | 'y' | 'fontSize' | 'rotation', event: KeyboardEvent<HTMLInputElement>) => {
    const stepSize = event.shiftKey ? 10 : 1;

    if (event.key === 'Enter') {
      if (field === 'x' || field === 'y') {
        updateTextLayerPosition(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'fontSize') {
        updateFontSize((event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'rotation') {
        updateTextLayerRotation((event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();

      const currentValue = Number(textLayerProperties[field]);
      const newValue = event.key === 'ArrowUp'
        ? currentValue + stepSize
        : currentValue - stepSize;

      setTextLayerProperties(prev => ({
        ...prev,
        [field]: newValue.toString()
      }));

      if (field === 'x' || field === 'y') {
        updateTextLayerPosition(field, newValue.toString());
      } else if (field === 'fontSize') {
        updateFontSize(newValue.toString());
      } else if (field === 'rotation') {
        updateTextLayerRotation(newValue.toString());
      }
    }
  };

  const handleTextPositionBlur = (field: 'x' | 'y') => {
    updateTextLayerPosition(field, textLayerProperties[field]);
  };

  const handleTextRotationBlur = (field: 'rotation') => {
    updateTextLayerRotation(textLayerProperties[field]);
  };

  // Handlers for Image Layer
  const handleImageInputChange = (field: keyof typeof imageLayerProperties, value: string) => {
    setImageLayerProperties(prev => ({ ...prev, [field]: value }));
    if (field === 'x' || field === 'y') {
      updateImageLayerPosition(field, value);
    }
    if (field === 'width' || field === 'height') {
      updateImageLayerDimensions(field, value);
    }
    if (field === 'rotation') {
      updateImageLayerRotation(value);
    }
  };

  const updateImageLayerPosition = (field: 'x' | 'y', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer) {
      const numValue = Number(value);

      if (field === 'x') {
        layer.fabricObject.left = numValue;
      } else if (field === 'y') {
        layer.fabricObject.top = numValue;
      }

      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateImageLayerDimensions = (field: 'width' | 'height', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'image') {
      const numValue = Number(value);
      if (field === 'width') {
        layer.fabricObject.scaleX = numValue / (layer.fabricObject.width || 1);
        setImageLayerProperties(prev => ({
          ...prev,
          width: numValue.toString()
        }));
      } else if (field === 'height') {
        layer.fabricObject.scaleY = numValue / (layer.fabricObject.height || 1);
        setImageLayerProperties(prev => ({
          ...prev,
          height: numValue.toString()
        }));
      }

      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateImageLayerRotation = (value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'image') {
      const numValue = Number(value);
      layer.fabricObject.set('angle', numValue);
      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const handleImageKeyDown = (field: 'x' | 'y' | 'width' | 'height' | 'rotation', event: KeyboardEvent<HTMLInputElement>) => {
    const stepSize = event.shiftKey ? 10 : 1;

    if (event.key === 'Enter') {
      if (field === 'x' || field === 'y') {
        updateImageLayerPosition(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'width' || field === 'height') {
        updateImageLayerDimensions(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'rotation') {
        updateImageLayerRotation((event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();

      const currentValue = Number(imageLayerProperties[field]);
      const newValue = event.key === 'ArrowUp'
        ? currentValue + stepSize
        : currentValue - stepSize;

      setImageLayerProperties(prev => ({
        ...prev,
        [field]: newValue.toString()
      }));

      if (field === 'x' || field === 'y') {
        updateImageLayerPosition(field, newValue.toString());
      } else if (field === 'width' || field === 'height') {
        updateImageLayerDimensions(field, newValue.toString());
      } else if (field === 'rotation') {
        updateImageLayerRotation(newValue.toString());
      }
    }
  };

  // Handlers for Rotator Layer
  const handleRotatorInputChange = (field: keyof typeof rotatorLayerProperties, value: string) => {
    setRotatorLayerProperties(prev => ({ ...prev, [field]: value }));
    if (field === 'x' || field === 'y') {
      updateRotatorLayerPosition(field, value);
    }
    if (field === 'width' || field === 'height') {
      updateRotatorLayerDimensions(field, value);
    }
    if (field === 'rotation') {
      updateRotatorLayerRotation(value);
    }
    if (field === 'offsetX' || field === 'offsetY') {
      updateRotatorLayerOffset(field, value);
    }
    if (field === 'startAngle' || field === 'rotationAngle') {
      updateRotatorLayerRotationAngles(field, value);
      if (field === 'startAngle') {
        updateRotatorLayerRotation((Number(value) + 90).toString());
      }
    }
    if (field === 'source') {
      console.log(value);
      layerManager.updateImageForSelectedLayer(value);
    }
  };

  const updateRotatorLayerPosition = (field: 'x' | 'y', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer) {
      const numValue = Number(value);

      if (field === 'x') {
        layer.fabricObject.left = numValue;
      } else if (field === 'y') {
        layer.fabricObject.top = numValue;
      }

      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateRotatorLayerDimensions = (field: 'width' | 'height', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'rotator') {
      const numValue = Number(value);
      if (field === 'width') {
        layer.fabricObject.scaleX = numValue / (layer.fabricObject.width || 1);
        setRotatorLayerProperties(prev => ({
          ...prev,
          width: numValue.toString()
        }));
      } else if (field === 'height') {
        layer.fabricObject.scaleY = numValue / (layer.fabricObject.height || 1);
        setRotatorLayerProperties(prev => ({
          ...prev,
          height: numValue.toString()
        }));
      }

      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateRotatorLayerRotation = (value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'rotator') {
      const numValue = Number(value);
      layer.fabricObject.set('angle', numValue);
      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateRotatorLayerOffset = (field: 'offsetX' | 'offsetY', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'rotator') {
      const numValue = Number(value);
      const prop = layer.properties.find(prop => prop.property === field);
      if (prop) {
        prop.value = numValue.toString();
      } else {
        layer.properties.push({ property: field, value: numValue.toString() });
      }
      // update fabricobject.UIElements
      if (field === 'offsetX') {
        layer.UIElements.set('left', layer.fabricObject.left + numValue);
      } else if (field === 'offsetY') {
        layer.UIElements.set('top', layer.fabricObject.top + numValue);
      }
      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateRotatorLayerRotationAngles = (field: 'startAngle' | 'rotationAngle', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'rotator') {
      const numValue = Number(value);
      const prop = layer.properties.find(prop => prop.property === field);
      if (prop) {
        prop.value = numValue.toString();
      } else {
        layer.properties.push({ property: field, value: numValue.toString() });
      }

      const UIGroup = layer.UIElements as Group;
      const rangeIndicator = UIGroup._objects[1] as FabricObject;

      if (field === 'startAngle') {
        rangeIndicator.set('startAngle', numValue);
      } else if (field === 'rotationAngle') {
        rangeIndicator.set('endAngle', numValue);
      }
      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const handleRotatorKeyDown = (field: 'x' | 'y' | 'width' | 'height' | 'rotation', event: KeyboardEvent<HTMLInputElement>) => {
    const stepSize = event.shiftKey ? 10 : 1;

    if (event.key === 'Enter') {
      if (field === 'x' || field === 'y') {
        updateRotatorLayerPosition(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'width' || field === 'height') {
        updateRotatorLayerDimensions(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'rotation') {
        updateRotatorLayerRotation((event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();

      const currentValue = Number(rotatorLayerProperties[field]);
      const newValue = event.key === 'ArrowUp'
        ? currentValue + stepSize
        : currentValue - stepSize;

      setRotatorLayerProperties(prev => ({
        ...prev,
        [field]: newValue.toString()
      }));

      if (field === 'x' || field === 'y') {
        updateRotatorLayerPosition(field, newValue.toString());
      } else if (field === 'width' || field === 'height') {
        updateRotatorLayerDimensions(field, newValue.toString());
      } else if (field === 'rotation') {
        updateRotatorLayerRotation(newValue.toString());
      }
    }
  };

  // Handlers for Bar Layer
  const handleBarInputChange = (field: keyof typeof barLayerProperties, value: string) => {
    setBarLayerProperties(prev => ({ ...prev, [field]: value }));
    if (field === 'x' || field === 'y') {
      updateBarLayerPosition(field, value);
    }
    if (field === 'width' || field === 'height') {
      updateBarLayerDimensions(field, value);
    }
  };

  const updateBarLayerPosition = (field: 'x' | 'y', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer) {
      const numValue = Number(value);

      if (field === 'x') {
        layer.fabricObject.left = numValue;
      } else if (field === 'y') {
        layer.fabricObject.top = numValue;
      }

      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const updateBarLayerDimensions = (field: 'width' | 'height', value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'bar') {
      const numValue = Number(value);
      if (field === 'width') {
        layer.fabricObject.scaleX = numValue / (layer.fabricObject.width || 1);
        setBarLayerProperties(prev => ({
          ...prev,
          width: numValue.toString()
        }));
      } else if (field === 'height') {
        layer.fabricObject.scaleY = numValue / (layer.fabricObject.height || 1);
        setBarLayerProperties(prev => ({
          ...prev,
          height: numValue.toString()
        }));
      }

      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
  };

  const handleBarKeyDown = (field: 'x' | 'y' | 'width' | 'height', event: KeyboardEvent<HTMLInputElement>) => {
    const stepSize = event.shiftKey ? 10 : 1;

    if (event.key === 'Enter') {
      if (field === 'x' || field === 'y') {
        updateBarLayerPosition(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'width' || field === 'height') {
        updateBarLayerDimensions(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();

      const currentValue = Number(barLayerProperties[field]);
      const newValue = event.key === 'ArrowUp'
        ? currentValue + stepSize
        : currentValue - stepSize;

      setBarLayerProperties(prev => ({
        ...prev,
        [field]: newValue.toString()
      }));

      if (field === 'x' || field === 'y') {
        updateBarLayerPosition(field, newValue.toString());
      } else if (field === 'width' || field === 'height') {
        updateBarLayerDimensions(field, newValue.toString());
      }
    }
  };

  const handleBarBackgroundFillChange = (value: string) => {
    console.log(value);
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'bar') {
      console.log(layer.fabricObject);
      const barGroup = layer.fabricObject as Group;
      const backgroundRect = barGroup._objects[0] as Rect;
      backgroundRect.set({ fill: value });
      
      setBarLayerProperties(prev => ({ ...prev, backgroundFill: value }));
      canvas?.renderAll();
    }
  };

  const handleBarBackgroundOpacityChange = (value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
  
    if (layer && layer.type === 'bar') {
      const barGroup = layer.fabricObject as Group;
      const backgroundRect = barGroup._objects[0] as Rect;
      backgroundRect.set({ opacity: parseFloat(value) }); // Update opacity on the object
  
      setBarLayerProperties(prev => ({ ...prev, backgroundOpacity: value })); // Update state
      canvas?.renderAll();
    }
  };

  const handleBarForegroundFillChange = (value: string) => {
    console.log(value);
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'bar') {
      console.log(layer.fabricObject);
      const barGroup = layer.fabricObject as Group;
      const foregroundRect = barGroup._objects[1] as Rect;
      foregroundRect.set({ fill: value });
      
      setBarLayerProperties(prev => ({ ...prev, foregroundFill: value }));
      canvas?.renderAll();
    }
  };

  const handleBarForegroundOpacityChange = (value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
  
    if (layer && layer.type === 'bar') {
      const barGroup = layer.fabricObject as Group;
      const foregroundRect = barGroup._objects[1] as Rect;
      foregroundRect.set({ opacity: parseFloat(value) }); // Update opacity on the object
  
      setBarLayerProperties(prev => ({ ...prev, foregroundOpacity: value })); // Update state
      canvas?.renderAll();
    }
  };  

  const handleBarMeasureChange = (measure: string) => {
    console.log(measure);
    layerManager.updateMeasureForSelectedLayer(measure);
    setBarLayerProperties(prev => ({
      ...prev,
      measure: measure
    }));
  }

  return (
    <>
      {selectedLayerId && selectedLayer?.type === 'text' && (
        <Card className='w-50 m-4 rounded-2xl'>
          <CardHeader className='font-semibold text-xl border-b'>Text Properties</CardHeader>
          <CardContent>
            <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(100vh - 256px)' }}>
              <ScrollArea className="h-full">
                <div className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      {/* X Position */}
                      <div className="space-y-2">
                        <Label htmlFor="text-x">X</Label>
                        <Input
                          ref={xInputRef}
                          id="text-x"
                          placeholder="X"
                          value={textLayerProperties.x}
                          onChange={e => handleTextInputChange('x', e.target.value)}
                          onKeyDown={e => handleTextKeyDown('x', e)}
                          onBlur={() => {
                            handleTextPositionBlur('x');
                            setIsInputFocused(false);
                          }}
                          onFocus={() => setIsInputFocused(true)}
                          className="w-20"
                        />
                      </div>
                      {/* Y Position */}
                      <div className="space-y-2">
                        <Label htmlFor="text-y">Y</Label>
                        <Input
                          ref={yInputRef}
                          id="text-y"
                          placeholder="Y"
                          value={textLayerProperties.y}
                          onChange={e => handleTextInputChange('y', e.target.value)}
                          onKeyDown={e => handleTextKeyDown('y', e)}
                          onBlur={() => {
                            handleTextPositionBlur('y');
                            setIsInputFocused(false);
                          }}
                          onFocus={() => setIsInputFocused(true)}
                          className="w-20"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      {/* Font Size */}
                      <div className="space-y-2">
                        <Label htmlFor="text-font-size">Font Size</Label>
                        <Input
                          id="text-font-size"
                          placeholder="Font Size"
                          value={textLayerProperties.fontSize}
                          onChange={e => handleTextInputChange('fontSize', e.target.value)}
                          onKeyDown={e => handleTextKeyDown('fontSize', e)}
                          onBlur={() => {
                            updateFontSize(textLayerProperties.fontSize);
                            setIsInputFocused(false);
                          }}
                          onFocus={() => setIsInputFocused(true)}
                          className="w-20"
                        />
                      </div>
                      {/* Rotation */}
                      <div className="space-y-2">
                        <Label htmlFor="text-rotation">Rotation</Label>
                        <Input
                          id="text-rotation"
                          placeholder="Rotation"
                          value={textLayerProperties.rotation}
                          onChange={e => handleTextInputChange('rotation', e.target.value)}
                          onKeyDown={e => handleTextKeyDown('rotation', e)}
                          onBlur={() => {
                            handleTextRotationBlur('rotation');
                            setIsInputFocused(false);
                          }}
                          onFocus={() => setIsInputFocused(true)}
                          className="w-20"
                        />
                      </div>
                    </div>
                    {/* Color */}
                    <div className="space-y-2">
                      <Label htmlFor="text-color">Color</Label>
                      <Input
                        id="text-color"
                        type="color"
                        className="h-10 w-44"
                        value={textLayerProperties.color}
                        onChange={e => handleColorChange(e.target.value)}
                      />
                    </div>

                    {/* Opacity Slider */}
                    <div className="space-y-2">
                      <Label htmlFor="text-opacity">Opacity</Label>
                      <Slider
                        id="text-opacity"
                        value={[parseFloat(textLayerProperties.opacity)]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => handleOpacityChange(value[0].toString())}
                        className="w-44"
                      />
                      <div className="text-sm text-muted-foreground">
                        Opacity: {(parseFloat(textLayerProperties.opacity) * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    {/* Font Select */}
                    <div className="space-y-2">
                      <Label htmlFor="font-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Font
                      </Label>
                      <Select
                        value={textLayerProperties.font}
                        onValueChange={handleFontChange}
                        defaultValue='Times New Roman'
                      >
                        <SelectTrigger id="font-select" className='w-44'>
                          <SelectValue placeholder="Times New Roman" />
                        </SelectTrigger>
                        <SelectContent>
                          {systemFonts.map(font => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Measure Type */}
                    <div className="space-y-2 w-44">
                      <Label htmlFor="text-measure-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Measure Type
                      </Label>
                      <Select onValueChange={handleTextMeasureTypeChange} value={measureType}>
                        <SelectTrigger id="measure-type-select" className="w-44">
                          <SelectValue placeholder="Select Measure Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom-text">Custom Text</SelectItem>
                          <SelectItem value="time-date">Time/Date</SelectItem>
                          <SelectItem value="cpu">CPU</SelectItem>
                          <SelectItem value="disk">Disk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category based on Measure Type */}
                    {measureType === 'time-date' && (
                      <div className="space-y-2">
                        <Label htmlFor="text-category-select" className="block text-sm font-medium text-gray-700 mb-1 w-44">
                          Category
                        </Label>
                        <Select onValueChange={handleTextCategoryChange} value={category}>
                          <SelectTrigger id="text-category-select" className="w-44">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="time">Time</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {measureType === 'cpu' && (
                      <div className="space-y-2">
                        <Label htmlFor="text-category-select" className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </Label>
                        <Select onValueChange={handleTextMeasureChange} value={category}>
                          <SelectTrigger id="text-category-select" className="w-44">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cpu-average">Average CPU Usage</SelectItem>
                            <SelectItem value="cpu-core-1">Core 1 Usage</SelectItem>
                            <SelectItem value="cpu-core-2">Core 2 Usage</SelectItem>
                            <SelectItem value="cpu-core-3">Core 3 Usage</SelectItem>
                            <SelectItem value="cpu-core-4">Core 4 Usage</SelectItem>
                            <SelectItem value="cpu-core-5">Core 5 Usage</SelectItem>
                            <SelectItem value="cpu-core-6">Core 6 Usage</SelectItem>
                            <SelectItem value="cpu-core-7">Core 7 Usage</SelectItem>
                            <SelectItem value="cpu-core-8">Core 8 Usage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {measureType === 'disk' && (
                      <div className="space-y-2">
                        <Label htmlFor="text-category-select" className="block text-sm font-medium text-gray-700 mb-1 w-44">
                          Disk
                        </Label>
                        <Select onValueChange={handleTextMeasureChange} value={category}>
                          <SelectTrigger id="text-category-select" className="w-44">
                            <SelectValue placeholder="Select Disk Property" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disk-c-label">Disk C Label</SelectItem>
                            <SelectItem value="disk-c-total-space">Disk C Total Space</SelectItem>
                            <SelectItem value="disk-c-free-space">Disk C Free Space</SelectItem>
                            <SelectItem value="disk-c-used-space">Disk C Used Space</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Measure based on Measure Type and Category */}
                    {measureType === 'time-date' && category === 'time' && (
                      <div className="space-y-2">
                        <Label htmlFor="text-measure-select" className="block text-sm font-medium text-gray-700 mb-1 w-44">
                          Measure
                        </Label>
                        <Select onValueChange={handleTextMeasureChange} value={textLayerProperties.measure}>
                          <SelectTrigger id="text-measure-select" className="w-44">
                            <SelectValue placeholder="Select Measure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="time-hour-minute-24">15:15 (Time 24 hr)</SelectItem>
                            <SelectItem value="time-hour-minute-12">03:15 PM (Time 12 hr)</SelectItem>
                            <SelectItem value="time-hour-24">15 (Hour 24 hr)</SelectItem>
                            <SelectItem value="time-hour-12">03 (Hour 12 hr)</SelectItem>
                            <SelectItem value="time-minute">30 (Minute)</SelectItem>
                            <SelectItem value="time-second">45 (Second)</SelectItem>
                            <SelectItem value="time-am-pm">PM (AM / PM Indicator)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {measureType === 'time-date' && category === 'date' && (
                      <div className="space-y-2">
                        <Label htmlFor="text-measure-select" className="block text-sm font-medium text-gray-700 mb-1">
                          Measure
                        </Label>
                        <Select onValueChange={handleTextMeasureChange} value={textLayerProperties.measure}>
                          <SelectTrigger id="text-measure-select" className="w-44">
                            <SelectValue placeholder="Select Measure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date-yyyy-mm-dd">2025-01-01 (yyyy-mm-dd)</SelectItem>
                            <SelectItem value="date-mm-dd-yy">01/01/25 (mm/dd/yy)</SelectItem>
                            <SelectItem value="date-month-number">01 (Month Number)</SelectItem>
                            <SelectItem value="date-month-full">January (Month Name Full)</SelectItem>
                            <SelectItem value="date-month-short">Jan (Month Name Short)</SelectItem>
                            <SelectItem value="date-day-number">01 (Day Number)</SelectItem>
                            <SelectItem value="date-day-full">Monday (Day Name Full)</SelectItem>
                            <SelectItem value="date-day-short">Mon (Day Name Short)</SelectItem>
                            <SelectItem value="date-year-short">25 (Year Short)</SelectItem>
                            <SelectItem value="date-year-full">2025 (Year Full)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLayerId && selectedLayer?.type === 'image' && (
        <Card className='w-50 m-4 rounded-2xl'>
          <CardHeader className='font-semibold text-xl border-b'>Image Properties</CardHeader>
          <CardContent>
            <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(100vh - 256px)' }}>
              <ScrollArea className="h-full">
                <div className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* X Position */}
                    <div className="space-y-2">
                      <Label htmlFor="image-x">X</Label>
                      <Input
                        ref={xInputRef}
                        id="image-x"
                        placeholder="X"
                        value={imageLayerProperties.x}
                        onChange={e => handleImageInputChange('x', e.target.value)}
                        onKeyDown={e => handleImageKeyDown('x', e)}
                        onBlur={() => {
                          updateImageLayerPosition('x', imageLayerProperties.x);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Y Position */}
                    <div className="space-y-2">
                      <Label htmlFor="image-y">Y</Label>
                      <Input
                        ref={yInputRef}
                        id="image-y"
                        placeholder="Y"
                        value={imageLayerProperties.y}
                        onChange={e => handleImageInputChange('y', e.target.value)}
                        onKeyDown={e => handleImageKeyDown('y', e)}
                        onBlur={() => {
                          updateImageLayerPosition('y', imageLayerProperties.y);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Width */}
                    <div className="space-y-2">
                      <Label htmlFor="image-width">Width</Label>
                      <Input
                        id="image-width"
                        placeholder="Width"
                        value={imageLayerProperties.width}
                        onChange={e => handleImageInputChange('width', e.target.value)}
                        onKeyDown={e => handleImageKeyDown('width', e)}
                        onBlur={() => {
                          updateImageLayerDimensions('width', imageLayerProperties.width);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Height */}
                    <div className="space-y-2">
                      <Label htmlFor="image-height">Height</Label>
                      <Input
                        id="image-height"
                        placeholder="Height"
                        value={imageLayerProperties.height}
                        onChange={e => handleImageInputChange('height', e.target.value)}
                        onKeyDown={e => handleImageKeyDown('height', e)}
                        onBlur={() => {
                          updateImageLayerDimensions('height', imageLayerProperties.height);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Rotation */}
                    <div className="space-y-2">
                      <Label htmlFor="image-rotation">Rotation</Label>
                      <Input
                        id="image-rotation"
                        placeholder="Rotation"
                        value={imageLayerProperties.rotation}
                        onChange={e => handleImageInputChange('rotation', e.target.value)}
                        onKeyDown={e => handleImageKeyDown('rotation', e)}
                        onBlur={() => {
                          updateImageLayerRotation(imageLayerProperties.rotation);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    
                  </div>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rotator props */}
      {selectedLayerId && selectedLayer?.type === 'rotator' && (
        <Card className='w-50 m-4 rounded-2xl'>
          <CardHeader className='font-semibold text-xl border-b'>Rotator Properties</CardHeader>
          <CardContent>
            <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(100vh - 256px)' }}>
              <ScrollArea className="h-full">
                <div className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Change Rotator Image */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-image">Rotator Image</Label>
                      <Input
                        id="rotator-image"
                        type='file'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileURL = URL.createObjectURL(file);
                            console.log(fileURL);
                            handleRotatorInputChange('source', fileURL);
                          }
                        }}
                        onBlur={() => {
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* X Position */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-x">X</Label>
                      <Input
                        ref={xInputRef}
                        id="rotator-x"
                        placeholder="X"
                        value={rotatorLayerProperties.x}
                        onChange={e => handleRotatorInputChange('x', e.target.value)}
                        onKeyDown={e => handleRotatorKeyDown('x', e)}
                        onBlur={() => {
                          updateRotatorLayerPosition('x', rotatorLayerProperties.x);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Y Position */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-y">Y</Label>
                      <Input
                        ref={yInputRef}
                        id="rotator-y"
                        placeholder="Y"
                        value={rotatorLayerProperties.y}
                        onChange={e => handleRotatorInputChange('y', e.target.value)}
                        onKeyDown={e => handleRotatorKeyDown('y', e)}
                        onBlur={() => {
                          updateRotatorLayerPosition('y', rotatorLayerProperties.y);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Width */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-width">Width</Label>
                      <Input
                        id="rotator-width"
                        placeholder="Width"
                        value={rotatorLayerProperties.width}
                        onChange={e => handleRotatorInputChange('width', e.target.value)}
                        onKeyDown={e => handleRotatorKeyDown('width', e)}
                        onBlur={() => {
                          updateRotatorLayerDimensions('width', rotatorLayerProperties.width);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Height */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-height">Height</Label>
                      <Input
                        id="rotator-height"
                        placeholder="Height"
                        value={rotatorLayerProperties.height}
                        onChange={e => handleRotatorInputChange('height', e.target.value)}
                        onKeyDown={e => handleRotatorKeyDown('height', e)}
                        onBlur={() => {
                          updateRotatorLayerDimensions('height', rotatorLayerProperties.height);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Rotation */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-rotation">Rotation</Label>
                      <Input
                        id="rotator-rotation"
                        placeholder="Rotation"
                        value={rotatorLayerProperties.rotation}
                        onChange={e => handleRotatorInputChange('rotation', e.target.value)}
                        onKeyDown={e => handleRotatorKeyDown('rotation', e)}
                        onBlur={() => {
                          updateRotatorLayerRotation(rotatorLayerProperties.rotation);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* OffsetX */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-offset-x">Offset X</Label>
                      <Input
                        id="rotator-offset-x"
                        placeholder="Offset X"
                        value={rotatorLayerProperties.offsetX}
                        onChange={e => handleRotatorInputChange('offsetX', e.target.value)}
                        onBlur={() => {
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* OffsetX */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-offset-y">Offset Y</Label>
                      <Input
                        id="rotator-offset-y"
                        placeholder="Offset Y"
                        value={rotatorLayerProperties.offsetY}
                        onChange={e => handleRotatorInputChange('offsetY', e.target.value)}
                        onBlur={() => {
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Start Angle */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-start-angle">Start Angle</Label>
                      <Input
                        id="rotator-start-angle"
                        placeholder="Start Angle"
                        value={rotatorLayerProperties.startAngle}
                        onChange={e => handleRotatorInputChange('startAngle', e.target.value)}
                        onBlur={() => {
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Rotation Angle */}
                    <div className="space-y-2">
                      <Label htmlFor="rotator-rotation-angle">Rotation Angle</Label>
                      <Input
                        id="rotator-rotation-angle"
                        placeholder="Rotation Angle"
                        value={rotatorLayerProperties.rotationAngle}
                        onChange={e => handleRotatorInputChange('rotationAngle', e.target.value)}
                        onBlur={() => {
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Measure Type */}
                    <div className="space-y-2 w-44">
                      <Label htmlFor="rotator-measure-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Measure Type
                      </Label>
                      <Select onValueChange={handleRotatorMeasureTypeChange} value={measureType}>
                        <SelectTrigger id="rotator-measure-type-select" className="w-44">
                          <SelectValue placeholder="Select Measure Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">Time</SelectItem>
                          <SelectItem value="cpu">CPU</SelectItem>
                          <SelectItem value="disk">Disk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Measures based on Type */}
                    {measureType === 'time' && (
                      <div className="space-y-2">
                        <Label htmlFor="rotator-measure-select" className="block text-sm font-medium text-gray-700 mb-1 w-44">
                          Time Measure
                        </Label>
                        <Select onValueChange={handleRotatorMeasureChange} value={rotatorLayerProperties.measure}>
                          <SelectTrigger id="rotator-measure-select" className="w-44">
                            <SelectValue placeholder="Select Time Measure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rotator-time-second">Seconds</SelectItem>
                            <SelectItem value="rotator-time-minute">Minutes</SelectItem>
                            <SelectItem value="rotator-time-hour">Hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {measureType === 'cpu' && (
                      <div className="space-y-2">
                        <Label htmlFor="rotator-measure-select" className="block text-sm font-medium text-gray-700 mb-1 w-44">
                          CPU Measure
                        </Label>
                        <Select onValueChange={handleRotatorMeasureChange} value={rotatorLayerProperties.measure}>
                          <SelectTrigger id="rotator-measure-select" className="w-44">
                            <SelectValue placeholder="Select CPU Measure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rotator-cpu-average">Average CPU Usage</SelectItem>
                            <SelectItem value="rotator-cpu-core-1">Core 1 Usage</SelectItem>
                            <SelectItem value="rotator-cpu-core-2">Core 2 Usage</SelectItem>
                            <SelectItem value="rotator-cpu-core-3">Core 3 Usage</SelectItem>
                            <SelectItem value="rotator-cpu-core-4">Core 4 Usage</SelectItem>
                            <SelectItem value="rotator-cpu-core-5">Core 5 Usage</SelectItem>
                            <SelectItem value="rotator-cpu-core-6">Core 6 Usage</SelectItem>
                            <SelectItem value="rotator-cpu-core-7">Core 7 Usage</SelectItem>
                            <SelectItem value="rotator-cpu-core-8">Core 8 Usage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {measureType === 'disk' && (
                      <div className="space-y-2">
                        <Label htmlFor="rotator-measure-select" className="block text-sm font-medium text-gray-700 mb-1 w-44">
                          Disk Measure
                        </Label>
                        <Select onValueChange={handleRotatorMeasureChange} value={rotatorLayerProperties.measure}>
                          <SelectTrigger id="rotator-measure-select" className="w-44">
                            <SelectValue placeholder="Select Disk Measure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rotator-disk-c-usage">Disk C Usage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Props */}
      {selectedLayerId && selectedLayer?.type === 'bar' && (
        <Card className='w-50 m-4 rounded-2xl'>
          <CardHeader className='font-semibold text-xl border-b'>Bar Properties</CardHeader>
          <CardContent>
            <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(100vh - 256px)' }}>
              <ScrollArea className="h-full">
                <div className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* X Position */}
                    <div className="space-y-2">
                      <Label htmlFor="bar-x">X</Label>
                      <Input
                        ref={xInputRef}
                        id="bar-x"
                        placeholder="X"
                        value={barLayerProperties.x}
                        onChange={e => handleBarInputChange('x', e.target.value)}
                        onKeyDown={e => handleBarKeyDown('x', e)}
                        onBlur={() => {
                          updateBarLayerPosition('x', barLayerProperties.x);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Y Position */}
                    <div className="space-y-2">
                      <Label htmlFor="bar-y">Y</Label>
                      <Input
                        ref={yInputRef}
                        id="bar-y"
                        placeholder="Y"
                        value={barLayerProperties.y}
                        onChange={e => handleBarInputChange('y', e.target.value)}
                        onKeyDown={e => handleBarKeyDown('y', e)}
                        onBlur={() => {
                          updateBarLayerPosition('y', barLayerProperties.y);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Width */}
                    <div className="space-y-2">
                      <Label htmlFor="bar-width">Width</Label>
                      <Input
                        id="bar-width"
                        placeholder="Width"
                        value={barLayerProperties.width}
                        onChange={e => handleBarInputChange('width', e.target.value)}
                        onKeyDown={e => handleBarKeyDown('width', e)}
                        onBlur={() => {
                          updateBarLayerDimensions('width', barLayerProperties.width);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>
                    {/* Height */}
                    <div className="space-y-2">
                      <Label htmlFor="bar-height">Height</Label>
                      <Input
                        id="bar-height"
                        placeholder="Height"
                        value={barLayerProperties.height}
                        onChange={e => handleBarInputChange('height', e.target.value)}
                        onKeyDown={e => handleBarKeyDown('height', e)}
                        onBlur={() => {
                          updateBarLayerDimensions('height', barLayerProperties.height);
                          setIsInputFocused(false);
                        }}
                        onFocus={() => setIsInputFocused(true)}
                      />
                    </div>

                    {/* Background Fill */}
                    <div className="space-y-2">
                      <Label htmlFor="bar-background-color">Background Fill</Label>
                      <Input
                        id="bar-background-color"
                        type="color"
                        className="h-10 w-44"
                        value={barLayerProperties.backgroundFill}
                        onChange={e => handleBarBackgroundFillChange(e.target.value)}
                      />
                    </div>

                    {/* background Opacity Slider */}
                    <div className="space-y-2">
                      <Label htmlFor="bar-background-opacity">Background Opacity</Label>
                      <Slider
                        id="bar-background-opacity"
                        value={[parseFloat(barLayerProperties.backgroundOpacity)]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => handleBarBackgroundOpacityChange(value[0].toString())}
                        className="w-44"
                      />
                      <div className="text-sm text-muted-foreground">
                        Opacity: {(parseFloat(barLayerProperties.backgroundOpacity) * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    {/* Bar Fill */}
                    <div className="space-y-2">
                      <Label htmlFor="bar-foreground-color">Bar Fill</Label>
                      <Input
                        id="bar-foreground-color"
                        type="color"
                        className="h-10 w-44"
                        value={barLayerProperties.foregroundFill}
                        onChange={e => handleBarForegroundFillChange(e.target.value)}
                      />
                    </div>

                    {/* Foreground Opacity Slider */}
                    <div className="space-y-2">
                      <Label htmlFor="bar-foreground-opacity">Bar Opacity</Label>
                      <Slider
                        id="bar-foreground-opacity"
                        value={[parseFloat(barLayerProperties.foregroundOpacity)]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => handleBarForegroundOpacityChange(value[0].toString())}
                        className="w-44"
                      />
                      <div className="text-sm text-muted-foreground">
                        Opacity: {(parseFloat(barLayerProperties.foregroundOpacity) * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    {/* Measure */}
                    <div className="space-y-2 w-44">
                      <Label htmlFor="bar-measure-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Measure
                      </Label>
                      <Select onValueChange={handleBarMeasureChange} value={barLayerProperties.measure}>
                        <SelectTrigger id="bar-measure-type-select" className="w-44">
                          <SelectValue placeholder="Select Measure" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar-cpu">CPU</SelectItem>
                          <SelectItem value="bar-disk">Disk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default PropertiesSidebar;