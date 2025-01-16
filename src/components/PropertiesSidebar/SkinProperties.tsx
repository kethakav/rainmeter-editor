import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { layerManager } from '@/services/LayerManager';
import { Group, Rect } from 'fabric';
import { SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '../ui/sidebar';
import PropertyInput from '../customUI/PropertyInput';
import { Card } from '../ui/card';

const SkinProperties: React.FC = () => {

    const canvas = layerManager.getCanvas();
    
    const [skinProperties, setSkinProperties] = useState({
        x: '',
        y: '',
        height: '',
        width: '',
        backgroundColor: '#FFFFFF',
    });

    useEffect(() => {
        const skinBackground = layerManager.getSkinBackground() as Group;
        const backgroundRect = skinBackground._objects[0] as Rect;
        const updateLayerProperties = () => {
            setSkinProperties({
                x: skinBackground.left.toString(),
                y: skinBackground.top.toString(),
                height: backgroundRect.height.toString(),
                width: backgroundRect.width.toString(),
                backgroundColor: canvas?.backgroundColor?.toString() || '#FFFFFF',
            })
        };
        updateLayerProperties();
        if (canvas) {
            canvas.on('object:modified', updateLayerProperties);
            canvas.on('object:moving', updateLayerProperties);
        }
        return () => {
            if (canvas) {
                canvas.off('object:modified', updateLayerProperties);
                canvas.off('object:moving', updateLayerProperties);
            }
        }
    }, [canvas]);

    const handleInputChange = (field: keyof typeof skinProperties, value: string) => {
        const skinBackground = layerManager.getSkinBackground() as Group;
        const backgroundRect = skinBackground._objects[0] as Rect;
        // Update skin position or dimensions logic
        if (skinBackground && backgroundRect) {
            if (field === 'x') {
                skinBackground.left = Number(value);
            }
            if (field === 'y') {
                skinBackground.top = Number(value);
            }
        }
        const numValue = Math.max(1, Number(value)); // Ensure minimum value is 1
        if (field === 'width') {
            backgroundRect.set({ 
            width: numValue,
            left: 0,
            top: 0
            }); // Update the rect's width
            // Update the group width while keeping the child objects positions the same
            skinBackground.set({ width: numValue }); 
            setSkinProperties(prev => ({
            ...prev,
            width: numValue.toString()
            }));
        } if (field === 'height') {
            backgroundRect.set({ 
            height: numValue,
            left: 0,
            top: 0
            }); // Update the rect's height
            // Update the group height while keeping the child objects positions the same
            skinBackground.set({ height: numValue });
            setSkinProperties(prev => ({
            ...prev,
            height: numValue.toString()
            }));
        }
        if (field === 'backgroundColor') {
            canvas?.set({ backgroundColor: value });
        }
    
        setSkinProperties(prev => ({ ...prev, [field]: value }));
        backgroundRect.setCoords();
        skinBackground.setCoords(); // Update the group's coordinates
        canvas?.renderAll();
    };

    return (
        // <div>
        // <Label htmlFor='skin-x'>X</Label>
        // <Input id='skin-x' value={skinProperties.x} onChange={e => handleInputChange('x', e.target.value)} />
        // <Label htmlFor='skin-y'>Y</Label>
        // <Input id='skin-y' value={skinProperties.y} onChange={e => handleInputChange('y', e.target.value)} />
        // <Label htmlFor='skin-width'>Width</Label>
        // <Input id='skin-width' value={skinProperties.width} onChange={e => handleInputChange('width', e.target.value)} />
        // <Label htmlFor='skin-height'>Height</Label>
        // <Input id='skin-height' value={skinProperties.height} onChange={e => handleInputChange('height', e.target.value)} />
        // <Label htmlFor='skin-background-color'>Background Color</Label>
        // <Input id='skin-background-color' type='color' value={skinProperties.backgroundColor} onChange={e => handleInputChange('backgroundColor', e.target.value)} />
        // </div>
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
                        id='skin-x' 
                        label='X' 
                        value={skinProperties.x} 
                        onChange={value => handleInputChange('x', value)}   
                    
                    />

                    {/* Y Position */}
                    <PropertyInput 
                        id='skin-y' 
                        label='Y' 
                        value={skinProperties.y} 
                        onChange={value => handleInputChange('y', value)}
                    />
                </div>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Width */}
                    <PropertyInput 
                        id='skin-width' 
                        label='W' 
                        value={skinProperties.width} 
                        onChange={value => handleInputChange('width', value)}
                    />
                    {/* Height */}
                    <PropertyInput 
                        id='skin-height' 
                        label='H' 
                        value={skinProperties.height} 
                        onChange={value => handleInputChange('height', value)}
                    />
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Background Color</SidebarGroupLabel>
                <div className='flex space-x-4 px-2 py-2'>
                    <div className="flex items-center rounded-md border border-input pl-2 w-24">
                        <Input
                        id="skin-background-color"
                        type="color"
                        className="w-8 h-8 border-none rounded-full shadow-none pl-0 mb-0.5 focus-visible:ring-transparent"
                        value={skinProperties.backgroundColor}
                        onChange={e => handleInputChange('backgroundColor', e.target.value)}
                        />
                        <Label className="text-xs mb-0.5">{skinProperties.backgroundColor.toUpperCase()}</Label>
                    </div>
                </div>
            </SidebarGroup>
            <SidebarGroup>
                <Card className='shadow-none bg-sidebar'>
                    <div className="p-4">
                        <p className="text-sm">When designing a Rainmeter skin, the background color you see in the editor is just a visual reference to help you during development. You can set this color to match your desktop's color scheme to better visualize how the skin will look, but this color won't be included in the final skin - the background will be transparent when you actually use it on your desktop.</p>
                    </div>
                </Card>
            </SidebarGroup>
        </div>
        // <Card className='w-50 m-4 rounded-2xl'>
        //   <CardHeader className='font-semibold text-xl border-b'>Skin Properties</CardHeader>
        //   <CardContent>
        //     <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(100vh - 256px)' }}>
        //       <ScrollArea className="h-full">
        //         <div className="pb-4">
        //           <div className="space-y-4">
                    // <div className="flex space-x-4">
                    //   {/* X Position */}
                    //   <div className='space-y-2'>
                    //     <Label htmlFor='skin-x'>X</Label>
                    //     <Input 
                    //       id='skin-x' 
                    //       placeholder='X' 
                    //       value={skinProperties.x} 
                    //       onChange={e => handleInputChange('x', e.target.value)}
                    //       className='w-20' 
                    //     />
                    //   </div>

                    //   {/* Y Position */}
                    //   <div className='space-y-2'>
                    //     <Label htmlFor='skin-y'>Y</Label>
                    //     <Input 
                    //       id='skin-y' 
                    //       placeholder='Y' 
                    //       value={skinProperties.y} 
                    //       onChange={e => handleInputChange('y', e.target.value)} 
                    //       className='w-20'
                    //     />
                    //   </div>
                    // </div>
        //             <div className="flex space-x-4">
        //               {/* Width */}
        //               <div className='space-y-2'>
        //                 <Label htmlFor='skin-width'>Width</Label>
        //                 <Input 
        //                   id='skin-width' 
        //                   placeholder='Width' 
        //                   value={skinProperties.width} 
        //                   onChange={e => handleInputChange('width', e.target.value)} 
        //                   className='w-20'
        //                 />
        //               </div>
        //               {/* Height */}
        //               <div className='space-y-2'>
        //                 <Label htmlFor='skin-height'>Height</Label>
        //                 <Input 
        //                   id='skin-height' 
        //                   placeholder='Height' 
        //                   value={skinProperties.height} 
        //                   onChange={e => handleInputChange('height', e.target.value)} 
        //                   className='w-20'
        //                 />
        //               </div>
        //             </div>
        //             <Separator />
                    // {/* Background Color */}
                    // <div className="space-y-2">
                    //   <Label htmlFor="skin-background-color">Background Color</Label>
                    //   <Input
                    //     id="skin-background-color"
                    //     type="color"
                    //     className="h-10 w-44"
                    //     value={skinProperties.backgroundColor}
                    //     onChange={e => handleInputChange('backgroundColor', e.target.value)}
                    //   />
                    // </div>
        //           </div>
        //         </div>
        //       </ScrollArea>
        //     </div>
        //   </CardContent>
        // </Card>
    );
};

export default SkinProperties;