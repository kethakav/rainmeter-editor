import { useLayerContext } from "@/context/LayerContext";
import { layerManager } from "@/services/LayerManager";
import { Group, Rect } from "fabric";
import { useEffect, useState } from "react";
import { SidebarGroup, SidebarGroupLabel, SidebarSeparator } from "../ui/sidebar";
import PropertyInput from "../customUI/PropertyInput";
import { Axis3D, Blend } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const BarLayerProperties: React.FC = () => {

    const canvas = layerManager.getCanvas();
    const { selectedLayer } = useLayerContext();
    const selectedLayerId = selectedLayer?.id;

    const [barLayerProperties, setBarLayerProperties] = useState({
        x: '',
        y: '',
        height: '',
        width: '',
        backgroundFill: '',
        backgroundOpacity: '',
        foregroundFill: '',
        foregroundOpacity: '',
        measure: 'bar-cpu',
    });

    useEffect(() => {
        const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        const updateLayerProperties = () => {
            if (layer && layer.type === 'bar') {
                const bar = layer.fabricObject;
                    
                if (layer.measure === '') {
                    layer.measure = 'bar-cpu';
                }
                const measure = layer.measure || 'bar-cpu';
                const barGroup = layer.fabricObject as Group;
                const background = barGroup._objects[0] as Rect;
                const foreground = barGroup._objects[1] as Rect

                setBarLayerProperties({
                x: bar.left?.toString() || '0',
                y: bar.top?.toString() || '0',
                height: (barGroup.height * barGroup.scaleY)?.toString() || '100',
                width: (barGroup.width * barGroup.scaleX)?.toString() || '100',
                backgroundFill: background.fill?.toString() || '#000000',
                backgroundOpacity: background.opacity?.toString() || '1',
                foregroundFill: foreground.fill?.toString() || '#000000',
                foregroundOpacity: foreground.opacity?.toString() || '1',
                measure: measure,
                });
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

    const handleInputChange = (field: keyof typeof barLayerProperties, value: string) => {
        if (selectedLayerId) {
            const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
            if (layer && layer.type === 'bar') {
                const bar = layer.fabricObject as Group;
                const background = bar._objects[0] as Rect;
                const foreground = bar._objects[1] as Rect;

                if (field === 'x') {
                    bar.set({ left: Number(value) });
                } else if (field === 'y') {
                    bar.set({ top: Number(value) });
                } 

                const numValue = Math.max(1, Number(value)); // Ensure minimum value is 1
                if (field === 'width') {
                    bar.scaleX = numValue / (bar.width || 1);
                    setBarLayerProperties(prev => ({
                      ...prev,
                      width: numValue.toString()
                    }));
                }
                if (field === 'height') {
                    bar.scaleY = numValue / (bar.height || 1);
                    setBarLayerProperties(prev => ({
                      ...prev,
                      height: numValue.toString()
                    }));
                }
                if (field === 'backgroundFill') {
                    background.set({ fill: value });
                }
                if (field === 'backgroundOpacity') {
                    background.set({ opacity: Number(value) });
                }
                if (field === 'foregroundFill') {
                    foreground.set({ fill: value });
                }
                if (field === 'foregroundOpacity') {
                    foreground.set({ opacity: Number(value) });
                }
                if (field === 'measure') {
                    layerManager.updateMeasureForSelectedLayer(value);
                }

                setBarLayerProperties(prev => ({ ...prev, [field]: value }));

                bar.setCoords();
                canvas?.renderAll();
            }
        }
    }

    return(
        <div>
            <SidebarGroup>
                <SidebarGroupLabel>Bar Properties</SidebarGroupLabel>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Transform</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* X Position */}
                    <PropertyInput 
                        id='bar-x' 
                        label='X' 
                        value={barLayerProperties.x} 
                        onChange={value => handleInputChange('x', value)}   
                    />

                    {/* Y Position */}
                    <PropertyInput 
                        id='bar-y' 
                        label='Y' 
                        value={barLayerProperties.y} 
                        onChange={value => handleInputChange('y', value)}
                    />
                </div>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Width */}
                    <PropertyInput 
                        id='bar-width' 
                        label='W' 
                        value={barLayerProperties.width} 
                        onChange={value => handleInputChange('width', value)}
                    />

                    {/* Height */}
                    <PropertyInput 
                        id='bar-height' 
                        label='H' 
                        value={barLayerProperties.height} 
                        onChange={value => handleInputChange('height', value)}
                    />
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Foreground</SidebarGroupLabel>
                <div className='flex space-x-4 px-2 py-2'>
                    <div className="flex items-center rounded-md border border-input pl-2 w-24">
                        <Input
                        id="bar-foreground-color"
                        type="color"
                        className="w-8 h-8 border-none shadow-none pl-0 mx-0 mb-0.5 focus-visible:ring-transparent"
                        value={barLayerProperties.foregroundFill}
                        onChange={e => handleInputChange('foregroundFill', e.target.value)}
                        />
                        <Label className="text-xs mb-0.5 pl-0">{barLayerProperties.foregroundFill.toUpperCase()}</Label>
                    </div>
                    {/* Opacity */}
                    <div className="relative flex items-center">
                        <PropertyInput 
                            id='bar-foreground-opacity' 
                            label='Opacity'
                            icon={Blend} 
                            value={(Number(barLayerProperties.foregroundOpacity) * 100).toString()} // Display as percentage
                            onChange={value => handleInputChange('foregroundOpacity', (Number(value) / 100).toString())} // Convert back to decimal
                        />
                        <span className="absolute right-2 text-gray-500">%</span> {/* Display percentage sign inside the input */}
                    </div>
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Background</SidebarGroupLabel>
                <div className='flex space-x-4 px-2 py-2'>
                    <div className="flex items-center rounded-md border border-input pl-2 w-24">
                        <Input
                        id="bar-background-color"
                        type="color"
                        className="w-8 h-8 border-none shadow-none pl-0 mx-0 mb-0.5 focus-visible:ring-transparent"
                        value={barLayerProperties.backgroundFill}
                        onChange={e => handleInputChange('backgroundFill', e.target.value)}
                        />
                        <Label className="text-xs mb-0.5 pl-0">{barLayerProperties.backgroundFill.toUpperCase()}</Label>
                    </div>
                    {/* Opacity */}
                    <div className="relative flex items-center">
                        <PropertyInput 
                            id='bar-background-opacity' 
                            label='Opacity'
                            icon={Blend} 
                            value={(Number(barLayerProperties.backgroundOpacity) * 100).toString()} // Display as percentage
                            onChange={value => handleInputChange('backgroundOpacity', (Number(value) / 100).toString())} // Convert back to decimal
                        />
                        <span className="absolute right-2 text-gray-500">%</span> {/* Display percentage sign inside the input */}
                    </div>
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup className='py-0'>
                <SidebarGroupLabel>Bar Measure</SidebarGroupLabel>
                <div className='flex space-x-4 px-2 py-2'>
                    {/* Select Disk Measure */}
                    <Select
                        value={barLayerProperties.measure}
                        onValueChange={handleInputChange.bind(null, 'measure') as any}
                        defaultValue='bar-cpu'
                    >
                        <SelectTrigger id="disk-select" className='w-52 shadow-none'>
                            <SelectValue placeholder="Select Bar Measure" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bar-cpu">CPU</SelectItem>
                            <SelectItem value="bar-disk">Disk</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </SidebarGroup>
        </div>
    )
}

export default BarLayerProperties;