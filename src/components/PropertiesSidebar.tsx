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
import { IText } from 'fabric';
import { localFontManager } from '@/services/LocalFontManager';
import { SingleFontLoad } from '@/services/singleFontLoad';
import { Card, CardContent, CardHeader } from './ui/card';

const PropertiesSidebar: React.FC = () => {
  const { selectedLayerId } = useLayerContext();
  const xInputRef = useRef<HTMLInputElement>(null);
  const yInputRef = useRef<HTMLInputElement>(null);

  const [layerProperties, setLayerProperties] = useState({
    x: '',
    y: '',
    color: '#000000',
    font: 'Arial',
    measure: 'custom-text',
    fontSize: '12',
  });

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [systemFonts, setSystemFonts] = useState<string[]>([]);

  useEffect(() => {
    const loadFonts = async () => {
      const fonts = await localFontManager.scanLocalFonts();
      setSystemFonts(fonts.map(font => font.name)); // Set the name property
    };

    loadFonts();
    // preloadCustomFonts();
  }, []);


  useEffect(() => {
    const updateLayerProperties = () => {
      if (selectedLayerId) {
        const selectedLayer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        if (selectedLayer) {
          const text = selectedLayer.fabricObject as IText;
          setLayerProperties({
            x: selectedLayer.fabricObject.left.toString(),
            y: selectedLayer.fabricObject.top.toString(),
            color: selectedLayer.fabricObject.fill ? selectedLayer.fabricObject.fill.toString() : 'black',
            font: text.fontFamily || 'Arial', // Ensure a default font is always set
            measure: selectedLayer.measure || 'custom-text',
            fontSize: text.fontSize.toString(),
          });
        }
      }
    };

    updateLayerProperties();

    const canvas = layerManager.getCanvas();
    if(canvas) {
      canvas.on('selection:created', updateLayerProperties);
      canvas.on('object:modified', updateLayerProperties);
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!isInputFocused && selectedLayerId) {
        const stepSize = event.shiftKey ? 10 : 1;
        const selectedLayer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        const canvas = layerManager.getCanvas();

        if (selectedLayer && canvas) {
          switch(event.key) {
            case 'ArrowUp':
              event.preventDefault();
              selectedLayer.fabricObject.set({ 
                top: selectedLayer.fabricObject.top - stepSize 
              });
              canvas.renderAll();
              updateLayerProperties();
              break;
            case 'ArrowDown':
              event.preventDefault();
              selectedLayer.fabricObject.set({ 
                top: selectedLayer.fabricObject.top + stepSize 
              });
              canvas.renderAll();
              updateLayerProperties();
              break;
            case 'ArrowLeft':
              event.preventDefault();
              selectedLayer.fabricObject.set({ 
                left: selectedLayer.fabricObject.left - stepSize 
              });
              canvas.renderAll();
              updateLayerProperties();
              break;
            case 'ArrowRight':
              event.preventDefault();
              selectedLayer.fabricObject.set({ 
                left: selectedLayer.fabricObject.left + stepSize 
              });
              canvas.renderAll();
              updateLayerProperties();
              break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown as unknown as EventListener);

    return () => {
      if(canvas) {
        canvas.off('selection:created', updateLayerProperties);
        canvas.off('object:modified', updateLayerProperties);
      }
      window.removeEventListener('keydown', handleGlobalKeyDown as unknown as EventListener);
    };
  }, [selectedLayerId, isInputFocused]);

  const handleInputChange = (field: string, value: string) => {
    setLayerProperties(prev => ({ ...prev, [field]: value }));
  };

  const handleFontChange = async (font: string) => {
    // Update the font in the canvas
    await SingleFontLoad(font);
    layerManager.updateFontForSelectedLayer(font);
    
    // Update the font in the component's state to reflect the change in the dropdown
    setLayerProperties(prev => ({
      ...prev,
      font: font
    }));
  };

  const handleMeasureChange = (measure: string) => {
    console.log(measure);
    layerManager.updateMeasureForSelectedLayer(measure);
  };

  const updateLayerPosition = (field: 'x' | 'y', value: string) => {
    const canvas = layerManager.getCanvas();
    const selectedLayer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (selectedLayer) {
      const numValue = Number(value);

      if (field === 'x') {
        selectedLayer.fabricObject.set({ left: numValue });
      } else if (field === 'y') {
        selectedLayer.fabricObject.set({ top: numValue });
      }
    }
    canvas?.renderAll();
  };

  const updateFontSize = (value: string) => {
    const canvas = layerManager.getCanvas();
    const selectedLayer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (selectedLayer) {
      const numValue = Number(value);
      const txt = selectedLayer.fabricObject as IText;
      txt.set({ fontSize: numValue });
      canvas?.renderAll();
    }
  }

  const handleKeyDown = (field: 'x' | 'y' | 'fontSize', event: KeyboardEvent<HTMLInputElement>) => {
    const stepSize = event.shiftKey ? 10 : 1;

    if (event.key === 'Enter') {
      if (field === 'x' || field === 'y') {
        updateLayerPosition(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'fontSize') {
        updateFontSize((event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();

      const currentValue = Number(layerProperties[field]);
      const newValue = event.key === 'ArrowUp' 
        ? currentValue + stepSize 
        : currentValue - stepSize;

      const updatedProperties = { 
        ...layerProperties, 
        [field]: newValue.toString() 
      };

      setLayerProperties(updatedProperties);
      if (field === 'x' || field === 'y') {
        updateLayerPosition(field, newValue.toString());
      } else if (field === 'fontSize') {
        updateFontSize(newValue.toString());
      }
    }
  };

  const handlePositionBlur = (field: 'x' | 'y') => {
    updateLayerPosition(field, layerProperties[field]);
  };

  const handleColorChange = (value: string) => {
    const canvas = layerManager.getCanvas();
    const selectedLayer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (selectedLayer) {
      selectedLayer.fabricObject.set({ fill: value });
      setLayerProperties(prev => ({ ...prev, color: value }));
      canvas?.renderAll();
    }
  };

  return (
    <>
      {selectedLayerId ? (
        <Card className='w-50 m-4 rounded-2xl'>
          <CardHeader className='font-semibold text-xl border-b'>Properties</CardHeader>
          <CardContent>
            <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(100vh - 256px)' }}>
              <ScrollArea className="h-full">
                <div className="px-4 pb-4">
                  <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="x">X</Label>
                    <Input
                    ref={xInputRef}
                    id="x"
                    placeholder="X"
                    value={layerProperties.x}
                    onChange={e => handleInputChange('x', e.target.value)}
                    onKeyDown={e => handleKeyDown('x', e)}
                    onBlur={() => {
                      handlePositionBlur('x');
                      setIsInputFocused(false);
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="y">Y</Label>
                    <Input
                    ref={yInputRef}
                    id="y"
                    placeholder="Y"
                    value={layerProperties.y}
                    onChange={e => handleInputChange('y', e.target.value)}
                    onKeyDown={e => handleKeyDown('y', e)}
                    onBlur={() => {
                      handlePositionBlur('y');
                      setIsInputFocused(false);
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <Input
                    id="font-size"
                    placeholder="Font Size"
                    value={layerProperties.fontSize}
                    onChange={e => handleInputChange('fontSize', e.target.value)}
                    onKeyDown={e => handleKeyDown('fontSize', e)}
                    onBlur={() => {
                      updateFontSize(layerProperties.fontSize);
                      setIsInputFocused(false);
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                    id="color"
                    type="color"
                    className="h-10"
                    value={layerProperties.color}
                    onChange={e => handleColorChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Font
                    </Label>
                    <Select 
                    value={layerProperties.font}
                    onValueChange={handleFontChange}
                    >
                    <SelectTrigger id="font-select">
                      <SelectValue placeholder="Select a font">{layerProperties.font}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {systemFonts.map(font => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="measure-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Measure
                    </Label>
                    <Select onValueChange={handleMeasureChange} value={layerProperties.measure}>
                    <SelectTrigger id="measure-select">
                      <SelectValue defaultValue="custom-text" placeholder="Custom Text" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom-text">Custom Text</SelectItem>
                      <SelectItem value="date-yyyy-mm-dd">Date YYYY-MM-DD (2000-01-01)</SelectItem>
                      <SelectItem value="date-mm-dd-yy">Date MM/DD/YY (01/01/00)</SelectItem>
                      <SelectItem value="short-weekday">Short Weekday (Mon)</SelectItem>
                      <SelectItem value="full-weekday">Full Weekday (Monday)</SelectItem>
                      <SelectItem value="short-month">Short Month (Jan)</SelectItem>
                      <SelectItem value="full-month">Full Month (January)</SelectItem>
                      <SelectItem value="zero-day">Day of Month (01)</SelectItem>
                      <SelectItem value="space-day">Day of Month (1)</SelectItem>
                      <SelectItem value="short-year">Short Year (00)</SelectItem>
                      <SelectItem value="full-year">Full Year (2000)</SelectItem>
                      <SelectItem value="hour-24">Hour 24 (00 - 23)</SelectItem>
                      <SelectItem value="hour-12">Hour 12 (00 - 11)</SelectItem>
                      <SelectItem value="month-number">Month number (01)</SelectItem>
                      <SelectItem value="minute-number">Minute (01)</SelectItem>
                      <SelectItem value="second-number">Second (01)</SelectItem>
                      <SelectItem value="am-pm">AM / PM Indicator (AM)</SelectItem>
                    </SelectContent>
                    </Select>
                  </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
};

export default PropertiesSidebar;
