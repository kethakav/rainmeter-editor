import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { layerManager } from '@/services/LayerManager';
import { localFontManager } from '@/services/LocalFontManager';
import { useLayerContext } from '@/context/LayerContext';
import { IText } from 'fabric';
import { SingleFontLoad } from '@/services/singleFontLoad';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '../ui/sidebar';
import PropertyInput from '../customUI/PropertyInput';
import { Axis3D, Blend, Type } from 'lucide-react';
import { Button } from '../ui/button';
import { open } from '@tauri-apps/plugin-dialog';
import { basename, join, resourceDir } from '@tauri-apps/api/path';
import { copyFile } from '@tauri-apps/plugin-fs';

const TextLayerProperties: React.FC = () => {

    const canvas = layerManager.getCanvas();
    const { selectedLayer } = useLayerContext();
    const selectedLayerId = selectedLayer?.id;

    const [measureType, setMeasureType] = useState<string>('custom-text');
    const [category, setCategory] = useState<string>('');

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

    const loadFonts = async () => {
        try {
            console.log('Loading fonts...');
            const fonts = await localFontManager.scanLocalFonts();
            // Ensure we have valid font names before updating state
            const validFonts = fonts
                .filter(font => font && font.name) // Filter out any null or undefined values
                .map(font => font.name);
            
            console.log('Found fonts:', validFonts);
            setSystemFonts(validFonts);
        } catch (error) {
            console.error('Error loading fonts:', error);
        }
    };

    useEffect(() => {
        loadFonts();
        // preloadCustomFonts();
    }, []);

    useEffect(() => {
        // Update text layer properties logic
        const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        const updateLayerProperties = () => {
            if (layer && layer.type === 'text') {
                const { type, category: newCategory } = getMeasureTypeAndCategory(layer.measure || 'custom-text');
                const textLayer = layer.fabricObject as IText;
                setTextLayerProperties({
                    x: textLayer.left.toString(),
                    y: textLayer.top.toString(),
                    rotation: textLayer.angle.toString(),
                    color: (textLayer.fill as string === 'black') ? '#000000' : textLayer.fill as string || '#000000',
                    font: textLayer.fontFamily,
                    fontSize: textLayer.fontSize.toString(),
                    opacity: textLayer.opacity.toString(),
                    measure: layer.measure || 'custom-text',
                });
                setMeasureType(type);
                setCategory(newCategory);
            }
        }
        updateLayerProperties();

        if (canvas) {
            canvas.on('selection:created', updateLayerProperties);
            canvas.on('selection:updated', updateLayerProperties);
            canvas.on('object:modified', updateLayerProperties);
            canvas.on('object:added', updateLayerProperties);
            canvas.on('object:moving', updateLayerProperties);
        }

        return () => {
            if (canvas) {
                canvas.off('selection:created', updateLayerProperties);
                canvas.off('selection:updated', updateLayerProperties);
                canvas.off('object:modified', updateLayerProperties);
                canvas.off('object:added', updateLayerProperties);
                canvas.off('object:moving', updateLayerProperties);
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
                if (field === 'measure') {
                    layerManager.updateMeasureForSelectedLayer(value);
                }
                // Add more properties as needed
                textLayer.setCoords();
                canvas?.renderAll();
            }
        }
        // Update text layer properties logic
    };

    const handleMeasureTypeChange = (value: string) => {

        setMeasureType(value);
        if (value === 'time-date') {
            setCategory('time'); // Add the correct one
            handleInputChange('measure', 'time-hour-minute-24');
        } else if (value === 'cpu') {
            setCategory('cpu');
            handleInputChange('measure', 'cpu-average');
        } else if (value === 'disk') {
            setCategory('disk');
            handleInputChange('measure', 'disk-c-label');
        } else {
            setCategory('');
            handleInputChange('measure', 'custom-text');
        }
    }

    const handleCategorychange = (value: string) => {
        setCategory(value);
        if (value === 'time') {
            handleInputChange('measure', 'time-hour-minute-24');
        } else if (value === 'date') {
            handleInputChange('measure', 'date-yyyy-mm-dd');
        }
    }

    const handleFontUpload = async () => {
        try {
            const selectedFile = await open({
                multiple: true,
                directory: false,
                filters: [
                    { name: 'Fonts', extensions: ['ttf', 'otf'] }
                ]
            });

            if (!selectedFile) return;

            const fontPath = await resourceDir() + `/_up_/public/fonts/`;
            
            // Handle both single file and multiple file selections
            const files = Array.isArray(selectedFile) ? selectedFile : [selectedFile];
            
            const fontUploadPromises = files.map(async (path: string) => {
                try {
                    const fontName = await basename(path);
                    if (!fontName) return;
                    
                    const newPath = await join(fontPath, fontName);
                    console.log(`Copying font from ${path} to ${newPath}`);
                    await copyFile(path, newPath);
                } catch (error) {
                    console.error(`Error processing font ${path}:`, error);
                }
            });

            await Promise.all(fontUploadPromises);
            console.log('All fonts uploaded successfully');
            
            // Force a refresh of the font list
            await loadFonts();
            
            // Trigger a re-render of the select component
            setSystemFonts(prev => [...prev]);
        } catch (error) {
            console.error('Error in handleFontUpload:', error);
        }
    };

    return (
        <div>
            <SidebarGroup>
                <SidebarGroupLabel>Skin Properties</SidebarGroupLabel>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Transform</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* X Position */}
                    <PropertyInput 
                        id='text-x' 
                        label='X' 
                        value={textLayerProperties.x} 
                        onChange={value => handleInputChange('x', value)}   
                    />

                    {/* Y Position */}
                    <PropertyInput 
                        id='text-y' 
                        label='Y' 
                        value={textLayerProperties.y} 
                        onChange={value => handleInputChange('y', value)}
                    />
                </div>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Rotation */}
                    <PropertyInput 
                        id='text-rotation' 
                        label='Rotation'
                        icon={Axis3D}
                        value={textLayerProperties.rotation} 
                        onChange={value => handleInputChange('rotation', value)}
                    />
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Color</SidebarGroupLabel>
                <div className='flex space-x-4 px-2 py-2'>
                    <div className="flex items-center rounded-md border border-input pl-2 w-24">
                        <Input
                        id="text-color"
                        type="color"
                        className="w-8 h-8 border-none shadow-none pl-0 mx-0 mb-0.5 focus-visible:ring-transparent"
                        value={textLayerProperties.color}
                        onChange={e => handleInputChange('color', e.target.value)}
                        />
                        <Label className="text-xs mb-0.5 pl-0">{textLayerProperties.color.toUpperCase()}</Label>
                    </div>
                    {/* Opacity */}
                    <div className="relative flex items-center">
                        <PropertyInput 
                            id='text-opacity' 
                            label='Opacity'
                            icon={Blend} 
                            value={(Number(textLayerProperties.opacity) * 100).toString()} // Display as percentage
                            onChange={value => handleInputChange('opacity', (Number(value) / 100).toString())} // Convert back to decimal
                        />
                        <span className="absolute right-2 text-gray-500">%</span> {/* Display percentage sign inside the input */}
                    </div>
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Typography</SidebarGroupLabel>
                <div className="flex-col space-y-4 px-2 py-2">
                    {/* Source */}
                    <Button 
                        variant="outline" 
                        onClick={handleFontUpload}
                        className="shadow-none"
                        >
                        Add Your Font File(s)
                    </Button>
                    {/* Font Family */}
                    <Select
                        value={textLayerProperties.font}
                        onValueChange={handleInputChange.bind(null, 'font') as any}
                        defaultValue='Times New Roman'
                    >
                        <SelectTrigger id="font-select" className='w-52 shadow-none'>
                            <SelectValue placeholder="Times New Roman" />
                        </SelectTrigger>
                        <SelectContent>
                            {systemFonts.map(font => (
                                <SelectItem key={font} value={font}>{font}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Font Size */}
                    <PropertyInput 
                        id='text-font-size' 
                        label='Font Size' 
                        icon={Type}
                        value={textLayerProperties.fontSize} 
                        onChange={value => handleInputChange('fontSize', value)}
                    />
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup className='pb-0'>
                <SidebarGroupLabel>Measure Type</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Select Measure Type */}
                    <Select
                        value={measureType}
                        onValueChange={handleMeasureTypeChange}
                        defaultValue='custom-text'
                    >
                        <SelectTrigger id="measure-select" className='w-52 shadow-none'>
                            <SelectValue placeholder="Custom Text" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='custom-text'>Custom Text</SelectItem>
                            <SelectItem value='time-date'>Time/Date</SelectItem>
                            <SelectItem value="cpu">CPU</SelectItem>
                            <SelectItem value="disk">Disk</SelectItem>
                            <SelectItem value="ram">RAM (Coming Soon)</SelectItem>
                            <SelectItem value="network">Network (Coming Soon)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </SidebarGroup>
            {measureType === 'time-date' && (
                <SidebarGroup className='py-0'>
                    <SidebarGroupLabel>Time/Date</SidebarGroupLabel>
                    <div className="flex space-x-4 px-2 py-2">
                        {/* Select Measure Category */}
                        <Select
                            value={category}
                            onValueChange={handleCategorychange}
                            defaultValue='time'
                        >
                            <SelectTrigger id="category-select" className='w-52 shadow-none'>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='time'>Time</SelectItem>
                                <SelectItem value='date'>Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </SidebarGroup>
            )}
            {category === 'time' && (
                <SidebarGroup className='py-0'>
                    <SidebarGroupLabel>Time Measure</SidebarGroupLabel>
                    <div className='flex space-x-4 px-2 py-2'>
                        {/* Select Time Measure */}
                        <Select
                            value={textLayerProperties.measure}
                            onValueChange={handleInputChange.bind(null, 'measure') as any}
                            defaultValue='time-hour-minute-24'
                        >
                            <SelectTrigger id="time-select" className='w-52 shadow-none'>
                                <SelectValue placeholder="Select Time Measure" />
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
                </SidebarGroup>
            )}
            {category === 'date' && (
                <SidebarGroup className='py-0'>
                    <SidebarGroupLabel>Date Measure</SidebarGroupLabel>
                    <div className='flex space-x-4 px-2 py-2'>
                        {/* Select Date Measure */}
                        <Select
                            value={textLayerProperties.measure}
                            onValueChange={handleInputChange.bind(null, 'measure') as any}
                            defaultValue='date-yyyy-mm-dd'
                        >
                            <SelectTrigger id="date-select" className='w-52 shadow-none'>
                                <SelectValue placeholder="Select Date Measure" />
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
                </SidebarGroup>
            )}
            {measureType === 'cpu' && (
                <SidebarGroup className='py-0'>
                    <SidebarGroupLabel>CPU Measure</SidebarGroupLabel>
                    <div className='flex space-x-4 px-2 py-2'>
                        {/* Select CPU Measure */}
                        <Select
                            value={textLayerProperties.measure}
                            onValueChange={handleInputChange.bind(null, 'measure') as any}
                            defaultValue='cpu-total'
                        >
                            <SelectTrigger id="cpu-select" className='w-52 shadow-none'>
                                <SelectValue placeholder="Select CPU Measure" />
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
                </SidebarGroup>
            )}
            {measureType === 'disk' && (
                <SidebarGroup className='py-0'>
                    <SidebarGroupLabel>Disk Measure</SidebarGroupLabel>
                    <div className='flex space-x-4 px-2 py-2'>
                        {/* Select Disk Measure */}
                        <Select
                            value={textLayerProperties.measure}
                            onValueChange={handleInputChange.bind(null, 'measure') as any}
                            defaultValue='disk-total'
                        >
                            <SelectTrigger id="disk-select" className='w-52 shadow-none'>
                                <SelectValue placeholder="Select Disk Measure" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="disk-c-label">Disk C Label</SelectItem>
                               <SelectItem value="disk-c-total-space">Disk C Total Space</SelectItem>
                               <SelectItem value="disk-c-free-space">Disk C Free Space</SelectItem>
                               <SelectItem value="disk-c-used-space">Disk C Used Space</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </SidebarGroup>
            )}
        </div>
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
        // <Card className='w-50 m-4 rounded-2xl'>
        //   <CardHeader className='font-semibold text-xl border-b'>Text Properties</CardHeader>
        //   <CardContent>
        //     <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(100vh - 256px)' }}>
        //       <ScrollArea className="h-full">
        //         <div className="px-4 pb-4">
        //           <div className="space-y-4">
        //             <div className="flex space-x-4">
        //               {/* X Position */}
        //               <div className="space-y-2">
        //                 <Label htmlFor="text-x">X</Label>
        //                 <Input
        //                   id="text-x"
        //                   placeholder="X"
        //                   value={textLayerProperties.x}
        //                   onChange={e => handleInputChange('x', e.target.value)}
        //                   className="w-20"
                          
        //                 />
        //               </div>
        //               {/* Y Position */}
        //               <div className="space-y-2">
        //                 <Label htmlFor="text-y">Y</Label>
        //                 <Input
        //                   id="text-y"
        //                   placeholder="Y"
        //                   value={textLayerProperties.y}
        //                   onChange={e => handleInputChange('y', e.target.value)}
        //                   className="w-20"
        //                 />
        //               </div>
        //             </div>
        //             <div className="flex space-x-4">
        //               {/* Font Size */}
        //               <div className="space-y-2">
        //                 <Label htmlFor="text-font-size">Font Size</Label>
        //                 <Input
        //                   id="text-font-size"
        //                   placeholder="Font Size"
        //                   value={textLayerProperties.fontSize}
        //                   onChange={e => handleInputChange('fontSize', e.target.value)}
        //                   className="w-20"
        //                 />
        //               </div>
        //               {/* Rotation */}
        //               <div className="space-y-2">
        //                 <Label htmlFor="text-rotation">Rotation</Label>
        //                 <Input
        //                   id="text-rotation"
        //                   placeholder="Rotation"
        //                   value={textLayerProperties.rotation}
        //                   onChange={e => handleInputChange('rotation', e.target.value)}
        //                   className="w-20"
        //                 />
        //               </div>
        //             </div>
        //             {/* Color */}
        //             <div className="space-y-2">
        //               <Label htmlFor="text-color">Color</Label>
        //               <Input
        //                 id="text-color"
        //                 type="color"
        //                 className="h-10 w-44"
        //                 value={textLayerProperties.color}
        //                 onChange={e => handleInputChange("color", e.target.value)}
        //               />
        //             </div>

        //             {/* Opacity Slider */}
        //             <div className="space-y-2">
        //               <Label htmlFor="text-opacity">Opacity</Label>
        //               <Slider
        //                 id="text-opacity"
        //                 value={[parseFloat(textLayerProperties.opacity)]}
        //                 min={0}
        //                 max={1}
        //                 step={0.01}
        //                 onValueChange={(value) => handleInputChange("opacity", value[0].toString())}
        //                 className="w-44"
        //               />
        //               <div className="text-sm text-muted-foreground">
        //                 Opacity: {(parseFloat(textLayerProperties.opacity) * 100).toFixed(0)}%
        //               </div>
        //             </div>
                    
        //             {/* Font Select */}
        //             <div className="space-y-2">
        //               <Label htmlFor="font-select" className="block text-sm font-medium text-gray-700 mb-1">
        //                 Font
        //               </Label>
        //               <Select
        //                 value={textLayerProperties.font}
        //                 onValueChange={handleInputChange.bind(null, 'font') as any}
        //                 defaultValue='Times New Roman'
        //               >
        //                 <SelectTrigger id="font-select" className='w-44'>
        //                   <SelectValue placeholder="Times New Roman" />
        //                 </SelectTrigger>
        //                 <SelectContent>
        //                   {systemFonts.map(font => (
        //                     <SelectItem key={font} value={font}>{font}</SelectItem>
        //                   ))}
        //                 </SelectContent>
        //               </Select>
        //             </div>
        //             {/* Measure Type */}
                    
        //           </div>
        //         </div>
        //       </ScrollArea>
        //     </div>
        //   </CardContent>
        // </Card>
    );
};

export default TextLayerProperties;