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
import { FabricImage, IText } from 'fabric';
import { localFontManager } from '@/services/LocalFontManager';
import { SingleFontLoad } from '@/services/singleFontLoad';
import { Card, CardContent, CardHeader } from './ui/card';

const PropertiesSidebar: React.FC = () => {
  const { selectedLayerId, selectedLayer } = useLayerContext();
  const xInputRef = useRef<HTMLInputElement>(null);
  const yInputRef = useRef<HTMLInputElement>(null);

  const [textLayerProperties, setTextLayerProperties] = useState({
    x: '',
    y: '',
    color: '#000000',
    font: 'Arial',
    measure: 'custom-text',
    fontSize: '12',
  });

  const [imageLayerProperties, setImageLayerProperties] = useState({
    x: '',
    y: '',
    height: '',
    width: '',
    source: '',
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
              color: text.fill?.toString() || '#000000',
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
              source: layer.imageSrc || '',
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

  const handleMeasureChange = (measure: string) => {
    console.log(measure);
    layerManager.updateMeasureForSelectedLayer(measure);
    setTextLayerProperties(prev => ({
      ...prev,
      measure: measure
    }));
  };

  const handleMeasureTypeChange = (value: string) => {
    setMeasureType(value);
    if (value === 'time-date') {
      setCategory('time');
      handleMeasureChange('time-hour-minute-24');
    }
    if (value === 'cpu') {
      setCategory('cpu-average');
      handleMeasureChange('cpu-average');
    }
    if (value === 'disk') {
      setCategory('disk-c-label');
      handleMeasureChange('disk-c-label');
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    handleMeasureChange(value);
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

  const handleTextKeyDown = (field: 'x' | 'y' | 'fontSize', event: KeyboardEvent<HTMLInputElement>) => {
    const stepSize = event.shiftKey ? 10 : 1;

    if (event.key === 'Enter') {
      if (field === 'x' || field === 'y') {
        updateTextLayerPosition(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'fontSize') {
        updateFontSize((event.target as HTMLInputElement).value);
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
      }
    }
  };

  const handleTextPositionBlur = (field: 'x' | 'y') => {
    updateTextLayerPosition(field, textLayerProperties[field]);
  };

  const handleColorChange = (value: string) => {
    const canvas = layerManager.getCanvas();
    const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

    if (layer && layer.type === 'text') {
      layer.fabricObject.fill = value;
      setTextLayerProperties(prev => ({ ...prev, color: value }));
      layer.fabricObject.setCoords();
      canvas?.renderAll();
    }
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
    if (field === 'source') {
      // updateImageSource(value);
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

  // const updateImageSource = (source: string) => {
  //   const canvas = layerManager.getCanvas();
  //   const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);

  //   // if (layer && layer.type === 'image') {
  //   //   layer.fabricObject.setSrc(source, () => {
  //   //     canvas?.renderAll();
  //   //   });
  //   //   setImageLayerProperties(prev => ({
  //   //     ...prev,
  //   //     source: source
  //   //   }));
  //   // }
  // };

  const handleImageKeyDown = (field: 'x' | 'y' | 'width' | 'height', event: KeyboardEvent<HTMLInputElement>) => {
    const stepSize = event.shiftKey ? 10 : 1;

    if (event.key === 'Enter') {
      if (field === 'x' || field === 'y') {
        updateImageLayerPosition(field, (event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
      } else if (field === 'width' || field === 'height') {
        updateImageLayerDimensions(field, (event.target as HTMLInputElement).value);
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
      }
    }
  };

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
                      />
                    </div>
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
                      />
                    </div>
                    {/* Color */}
                    <div className="space-y-2">
                      <Label htmlFor="text-color">Color</Label>
                      <Input
                        id="text-color"
                        type="color"
                        className="h-10"
                        value={textLayerProperties.color}
                        onChange={e => handleColorChange(e.target.value)}
                      />
                    </div>
                    {/* Font Select */}
                    <div className="space-y-2">
                      <Label htmlFor="font-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Font
                      </Label>
                      <Select
                        value={textLayerProperties.font}
                        onValueChange={handleFontChange}
                      >
                        <SelectTrigger id="font-select">
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                          {systemFonts.map(font => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Measure Type */}
                    <div className="space-y-2">
                      <Label htmlFor="text-measure-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Measure Type
                      </Label>
                      <Select onValueChange={handleMeasureTypeChange} value={measureType}>
                        <SelectTrigger id="measure-type-select">
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
                        <Label htmlFor="text-category-select" className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </Label>
                        <Select onValueChange={handleCategoryChange} value={category}>
                          <SelectTrigger id="text-category-select">
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
                        <Select onValueChange={handleCategoryChange} value={category}>
                          <SelectTrigger id="text-category-select">
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
                        <Label htmlFor="text-category-select" className="block text-sm font-medium text-gray-700 mb-1">
                          Disk
                        </Label>
                        <Select onValueChange={handleCategoryChange} value={category}>
                          <SelectTrigger id="text-category-select">
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
                        <Label htmlFor="text-measure-select" className="block text-sm font-medium text-gray-700 mb-1">
                          Measure
                        </Label>
                        <Select onValueChange={handleMeasureChange} value={textLayerProperties.measure}>
                          <SelectTrigger id="text-measure-select">
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
                        <Select onValueChange={handleMeasureChange} value={textLayerProperties.measure}>
                          <SelectTrigger id="text-measure-select">
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
                    {/* Measure Type (if applicable for images) */}
                    {/* Uncomment and modify if image layers have measure types */}
                    {/* 
                    <div className="space-y-2">
                      <Label htmlFor="image-measure-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Measure Type
                      </Label>
                      <Select onValueChange={handleMeasureTypeChange} value={measureType}>
                        <SelectTrigger id="image-measure-type-select">
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
                    */}
                    {/* Additional properties based on measureType and category can be added here */}
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