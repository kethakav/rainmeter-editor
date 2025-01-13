import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { layerManager } from '@/services/LayerManager';
import { localFontManager } from '@/services/LocalFontManager';
import { useLayerContext } from '@/context/LayerContext';
import { IText } from 'fabric';
import { SingleFontLoad } from '@/services/singleFontLoad';
import { Card, CardContent, CardHeader } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const TextLayerProperties: React.FC = () => {

    const canvas = layerManager.getCanvas();
    const { selectedLayer } = useLayerContext();
    const selectedLayerId = selectedLayer?.id;

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
        // Update text layer properties logic
        const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        const updateLayerProperties = () => {
            if (layer && layer.type === 'text') {
                const textLayer = layer.fabricObject as IText;
                setTextLayerProperties({
                    x: textLayer.left.toString(),
                    y: textLayer.top.toString(),
                    rotation: textLayer.angle.toString(),
                    color: textLayer.fill as string,
                    font: textLayer.fontFamily,
                    fontSize: textLayer.fontSize.toString(),
                    opacity: textLayer.opacity.toString(),
                    measure: layer.measure || 'custom-text',
                });
            }
        }
        updateLayerProperties();

        if (canvas) {
            canvas.on('selection:created', updateLayerProperties);
            canvas.on('selection:updated', updateLayerProperties);
            canvas.on('object:modified', updateLayerProperties);
            canvas.on('object:added', updateLayerProperties);
        }

        return () => {
            if (canvas) {
                canvas.off('selection:created', updateLayerProperties);
                canvas.off('selection:updated', updateLayerProperties);
                canvas.off('object:modified', updateLayerProperties);
                canvas.off('object:added', updateLayerProperties);
            }
        }
        
    }, [selectedLayerId]);

    const handleInputChange = async (field: keyof typeof textLayerProperties, value: string) => {
        setTextLayerProperties(prev => ({ ...prev, [field]: value }));
        if (selectedLayerId) {
            const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
            if (layer && layer.type === 'text') {
                const textLayer = layer.fabricObject as IText;
                if (field === 'x') {
                    textLayer.set({
                        left: Number(value)
                    })
                }
                if (field === 'y') {
                    textLayer.set({
                        top: Number(value)
                    })
                }
                if (field === 'rotation') {
                    textLayer.set({
                        angle: Number(value)
                    })
                }
                if (field === 'color') {
                    textLayer.set({
                        fill: value
                    })
                }
                if (field === 'font') {
                    await SingleFontLoad(value);
                    layerManager.updateFontForSelectedLayer(value);
                }
                if (field === 'fontSize') {
                    textLayer.set({
                        fontSize: Number(value)
                    })
                }
                if (field === 'opacity') {
                    textLayer.set({
                        opacity: Number(value)
                    })
                }
                // Add more properties as needed
                textLayer.setCoords();
                canvas?.renderAll();
            }
        }
        // Update text layer properties logic
    };

    return (
        // <div>
        // <Label htmlFor='text-x'>X</Label>
        // <Input id='text-x' value={textLayerProperties.x} onChange={e => handleInputChange('x', e.target.value)} />
        // <Label htmlFor='text-y'>Y</Label>
        // <Input id='text-y' value={textLayerProperties.y} onChange={e => handleInputChange('y', e.target.value)} />
        // <Label htmlFor='text-font-size'>Font Size</Label>
        // <Input id='text-font-size' value={textLayerProperties.fontSize} onChange={e => handleInputChange('fontSize', e.target.value)} />
        // <Label htmlFor='text-rotation'>Rotation</Label>
        // <Input id='text-rotation' value={textLayerProperties.rotation} onChange={e => handleInputChange('rotation', e.target.value)} />
        // <Label htmlFor='text-color'>Color</Label>
        // <Input id='text-color' type='color' value={textLayerProperties.color} onChange={e => handleInputChange('color', e.target.value)} />
        // {/* Add more properties as needed */}
        // </div>
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
                          id="text-x"
                          placeholder="X"
                          value={textLayerProperties.x}
                          onChange={e => handleInputChange('x', e.target.value)}
                          className="w-20"
                          
                        />
                      </div>
                      {/* Y Position */}
                      <div className="space-y-2">
                        <Label htmlFor="text-y">Y</Label>
                        <Input
                          id="text-y"
                          placeholder="Y"
                          value={textLayerProperties.y}
                          onChange={e => handleInputChange('y', e.target.value)}
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
                          onChange={e => handleInputChange('fontSize', e.target.value)}
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
                          onChange={e => handleInputChange('rotation', e.target.value)}
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
                        onChange={e => handleInputChange("color", e.target.value)}
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
                        onValueChange={(value) => handleInputChange("opacity", value[0].toString())}
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
                        onValueChange={handleInputChange.bind(null, 'font') as any}
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
                    
                  </div>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
    );
};

export default TextLayerProperties;