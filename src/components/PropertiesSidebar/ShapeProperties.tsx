import { useLayerContext } from "@/context/LayerContext";
import { layerManager } from "@/services/LayerManager";
import { Circle, Line, Rect, Triangle } from "fabric";
import { useEffect, useState } from "react";
import { SidebarGroup, SidebarGroupLabel, SidebarSeparator } from "../ui/sidebar";
import PropertyInput from "../customUI/PropertyInput";
import { Blend } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// Helper: hex (#RRGGBB) + opacity (0-1) → rgba string
function hexToRgba(hex: string, opacity: number): string {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
}

// Helper: extract hex color from fill/stroke which may be hex or rgba
function extractHexColor(color: string | null | undefined, fallback: string): string {
    if (!color) return fallback;
    if (color.startsWith('#')) return color;
    // parse rgba(r,g,b,a)
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return fallback;
}

// Helper: extract opacity from fill/stroke which may be hex or rgba
function extractOpacity(color: string | null | undefined, fallback: number): number {
    if (!color) return fallback;
    if (color.startsWith('#')) return 1;
    const match = color.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)/);
    if (match) return parseFloat(match[1]);
    return fallback;
}

const ShapeLayerProperties: React.FC = () => {

    const canvas = layerManager.getCanvas();
    const { selectedLayer } = useLayerContext();
    const selectedLayerId = selectedLayer?.id;

    const [shapeLayerProperties, setShapeLayerProperties] = useState({
        x: '',
        y: '',
        width: '',
        height: '',
        fill: '#4A90D9',
        fillOpacity: '1',
        stroke: '#2C5F8A',
        strokeOpacity: '1',
        strokeWidth: '2',
        rotation: '0',
        cornerRadius: '0',
        shapeType: 'rect',
    });

    useEffect(() => {
        const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        const updateLayerProperties = () => {
            if (layer && layer.type === 'shape') {
                const shape = layer.fabricObject;
                const shapeType = layer.properties?.find(p => p.property === 'shapeType')?.value || 'rect';
                
                let width = '100';
                let height = '100';
                let cornerRadius = '0';

                if (shapeType === 'rect') {
                    const rect = shape as Rect;
                    width = (rect.width * rect.scaleX).toString();
                    height = (rect.height * rect.scaleY).toString();
                    cornerRadius = (rect.rx || 0).toString();
                } else if (shapeType === 'circle') {
                    const circle = shape as Circle;
                    width = (circle.radius * 2 * circle.scaleX).toString();
                    height = (circle.radius * 2 * circle.scaleY).toString();
                } else if (shapeType === 'triangle') {
                    const tri = shape as Triangle;
                    width = (tri.width * tri.scaleX).toString();
                    height = (tri.height * tri.scaleY).toString();
                } else if (shapeType === 'line') {
                    const line = shape as Line;
                    width = (line.width * line.scaleX).toString();
                    height = (line.strokeWidth || 3).toString();
                }

                // Extract hex + opacity from rgba fill/stroke
                const fillHex = extractHexColor(shape.fill as string, '#4A90D9');
                const fillOpacity = extractOpacity(shape.fill as string, 1);
                const strokeHex = extractHexColor(shape.stroke as string, '#2C5F8A');
                const strokeOpacity = extractOpacity(shape.stroke as string, 1);

                setShapeLayerProperties({
                    x: Math.round(shape.left || 0).toString(),
                    y: Math.round(shape.top || 0).toString(),
                    width: Math.round(Number(width)).toString(),
                    height: Math.round(Number(height)).toString(),
                    fill: fillHex,
                    fillOpacity: fillOpacity.toString(),
                    stroke: strokeHex,
                    strokeOpacity: strokeOpacity.toString(),
                    strokeWidth: (shape.strokeWidth ?? 2).toString(),
                    rotation: Math.round(shape.angle || 0).toString(),
                    cornerRadius: cornerRadius,
                    shapeType: shapeType,
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
            canvas.on('object:scaling', updateLayerProperties);
            canvas.on('object:rotating', updateLayerProperties);
        }

        return () => {
            if (canvas) {
                canvas.off('selection:created', updateLayerProperties);
                canvas.off('selection:updated', updateLayerProperties);
                canvas.off('object:modified', updateLayerProperties);
                canvas.off('object:added', updateLayerProperties);
                canvas.off('object:moving', updateLayerProperties);
                canvas.off('object:scaling', updateLayerProperties);
                canvas.off('object:rotating', updateLayerProperties);
            }
        }
    }, [selectedLayerId]);

    const handleInputChange = (field: keyof typeof shapeLayerProperties, value: string) => {
        if (selectedLayerId) {
            const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
            if (layer && layer.type === 'shape') {
                const shape = layer.fabricObject;
                const shapeType = layer.properties?.find(p => p.property === 'shapeType')?.value || 'rect';

                // We always keep shape.opacity at 1 and encode opacity into rgba colors
                shape.set({ opacity: 1 });

                if (field === 'x') {
                    shape.set({ left: Number(value) });
                } else if (field === 'y') {
                    shape.set({ top: Number(value) });
                } else if (field === 'rotation') {
                    const newAngle = Number(value);
                    // Rotate around center to match Rainmeter's center-based rotation
                    const center = shape.getCenterPoint();
                    shape.set({ angle: newAngle });
                    shape.setPositionByOrigin(center, 'center', 'center');
                } else if (field === 'fill') {
                    // Update fill hex, preserving current fill opacity
                    const currentFillOpacity = Number(shapeLayerProperties.fillOpacity);
                    if (shapeType === 'line') {
                        shape.set({ stroke: hexToRgba(value, currentFillOpacity) });
                    } else {
                        shape.set({ fill: hexToRgba(value, currentFillOpacity) });
                    }
                } else if (field === 'fillOpacity') {
                    // Update fill opacity, preserving current fill hex
                    const opacity = Number(value);
                    if (shapeType === 'line') {
                        const currentHex = shapeLayerProperties.stroke;
                        shape.set({ stroke: hexToRgba(currentHex, opacity) });
                    } else {
                        const currentHex = shapeLayerProperties.fill;
                        shape.set({ fill: hexToRgba(currentHex, opacity) });
                    }
                } else if (field === 'stroke') {
                    // Update stroke hex, preserving current stroke opacity
                    const currentStrokeOpacity = Number(shapeLayerProperties.strokeOpacity);
                    shape.set({ stroke: hexToRgba(value, currentStrokeOpacity) });
                } else if (field === 'strokeOpacity') {
                    // Update stroke opacity, preserving current stroke hex
                    const opacity = Number(value);
                    const currentHex = shapeLayerProperties.stroke;
                    shape.set({ stroke: hexToRgba(currentHex, opacity) });
                } else if (field === 'strokeWidth') {
                    shape.set({ strokeWidth: Number(value) });
                } else if (field === 'width') {
                    const numValue = Math.max(1, Number(value));
                    if (shapeType === 'circle') {
                        const circle = shape as Circle;
                        circle.set({ radius: numValue / 2 });
                        circle.scaleX = 1;
                    } else if (shapeType === 'line') {
                        const line = shape as Line;
                        line.scaleX = numValue / (line.width || 1);
                    } else {
                        shape.scaleX = numValue / (shape.width || 1);
                    }
                } else if (field === 'height') {
                    const numValue = Math.max(1, Number(value));
                    if (shapeType === 'circle') {
                        const circle = shape as Circle;
                        circle.set({ radius: numValue / 2 });
                        circle.scaleY = 1;
                    } else if (shapeType === 'line') {
                        shape.set({ strokeWidth: numValue });
                    } else {
                        shape.scaleY = numValue / (shape.height || 1);
                    }
                } else if (field === 'cornerRadius') {
                    if (shapeType === 'rect') {
                        const rect = shape as Rect;
                        const rv = Math.max(0, Number(value));
                        rect.set({ rx: rv, ry: rv });
                    }
                }

                setShapeLayerProperties(prev => ({ ...prev, [field]: value }));
                shape.setCoords();
                canvas?.renderAll();
            }
        }
    }

    const isLine = shapeLayerProperties.shapeType === 'line';
    const isRect = shapeLayerProperties.shapeType === 'rect';

    return (
        <div>
            <SidebarGroup>
                <SidebarGroupLabel>
                    {shapeLayerProperties.shapeType === 'rect' && 'Rectangle Properties'}
                    {shapeLayerProperties.shapeType === 'circle' && 'Circle Properties'}
                    {shapeLayerProperties.shapeType === 'triangle' && 'Triangle Properties'}
                    {shapeLayerProperties.shapeType === 'line' && 'Line Properties'}
                </SidebarGroupLabel>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Transform</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* X Position */}
                    <PropertyInput 
                        id='shape-x' 
                        label='X' 
                        value={shapeLayerProperties.x} 
                        onChange={value => handleInputChange('x', value)}   
                    />
                    {/* Y Position */}
                    <PropertyInput 
                        id='shape-y' 
                        label='Y' 
                        value={shapeLayerProperties.y} 
                        onChange={value => handleInputChange('y', value)}
                    />
                </div>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Width */}
                    <PropertyInput 
                        id='shape-width' 
                        label={isLine ? 'Length' : 'W'} 
                        value={shapeLayerProperties.width} 
                        onChange={value => handleInputChange('width', value)}
                    />
                    {/* Height */}
                    {!isLine && (
                        <PropertyInput 
                            id='shape-height' 
                            label='H' 
                            value={shapeLayerProperties.height} 
                            onChange={value => handleInputChange('height', value)}
                        />
                    )}
                </div>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Rotation */}
                    <PropertyInput 
                        id='shape-rotation' 
                        label='Angle' 
                        value={shapeLayerProperties.rotation} 
                        onChange={value => handleInputChange('rotation', value)}
                    />
                </div>
                {isRect && (
                    <div className="flex space-x-4 px-2 py-2">
                        <PropertyInput 
                            id='shape-corner-radius' 
                            label='Radius' 
                            value={shapeLayerProperties.cornerRadius} 
                            onChange={value => handleInputChange('cornerRadius', value)}
                        />
                    </div>
                )}
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>{isLine ? 'Color' : 'Fill'}</SidebarGroupLabel>
                <div className='flex space-x-4 px-2 py-2'>
                    <div className="flex items-center rounded-md border border-input pl-2 w-24">
                        <Input
                            id="shape-fill-color"
                            type="color"
                            className="w-8 h-8 border-none shadow-none pl-0 mx-0 mb-0.5 focus-visible:ring-transparent"
                            value={isLine ? shapeLayerProperties.stroke : shapeLayerProperties.fill}
                            onChange={e => handleInputChange(isLine ? 'stroke' : 'fill', e.target.value)}
                        />
                        <Label className="text-xs mb-0.5 pl-0">
                            {(isLine ? shapeLayerProperties.stroke : shapeLayerProperties.fill).toUpperCase()}
                        </Label>
                    </div>
                    {/* Fill Opacity */}
                    <div className="relative flex items-center">
                        <PropertyInput 
                            id='shape-fill-opacity' 
                            label='Opacity'
                            icon={Blend} 
                            value={Math.round(Number(shapeLayerProperties.fillOpacity) * 100).toString()}
                            onChange={value => handleInputChange('fillOpacity', (Number(value) / 100).toString())}
                        />
                        <span className="absolute right-2 text-gray-500">%</span>
                    </div>
                </div>
            </SidebarGroup>
            {!isLine && (
                <>
                    <SidebarSeparator />
                    <SidebarGroup>
                        <SidebarGroupLabel>Stroke</SidebarGroupLabel>
                        <div className='flex space-x-4 px-2 py-2'>
                            <div className="flex items-center rounded-md border border-input pl-2 w-24">
                                <Input
                                    id="shape-stroke-color"
                                    type="color"
                                    className="w-8 h-8 border-none shadow-none pl-0 mx-0 mb-0.5 focus-visible:ring-transparent"
                                    value={shapeLayerProperties.stroke}
                                    onChange={e => handleInputChange('stroke', e.target.value)}
                                />
                                <Label className="text-xs mb-0.5 pl-0">{shapeLayerProperties.stroke.toUpperCase()}</Label>
                            </div>
                            <PropertyInput 
                                id='shape-stroke-width' 
                                label='Width' 
                                value={shapeLayerProperties.strokeWidth} 
                                onChange={value => handleInputChange('strokeWidth', value)}
                            />
                        </div>
                        <div className='flex space-x-4 px-2 py-2'>
                            {/* Stroke Opacity */}
                            <div className="relative flex items-center">
                                <PropertyInput 
                                    id='shape-stroke-opacity' 
                                    label='Opacity'
                                    icon={Blend} 
                                    value={Math.round(Number(shapeLayerProperties.strokeOpacity) * 100).toString()}
                                    onChange={value => handleInputChange('strokeOpacity', (Number(value) / 100).toString())}
                                />
                                <span className="absolute right-2 text-gray-500">%</span>
                            </div>
                        </div>
                    </SidebarGroup>
                </>
            )}
            {isLine && (
                <>
                    <SidebarSeparator />
                    <SidebarGroup>
                        <SidebarGroupLabel>Thickness</SidebarGroupLabel>
                        <div className='flex space-x-4 px-2 py-2'>
                            <PropertyInput 
                                id='shape-stroke-width' 
                                label='Width' 
                                value={shapeLayerProperties.strokeWidth} 
                                onChange={value => handleInputChange('strokeWidth', value)}
                            />
                        </div>
                    </SidebarGroup>
                </>
            )}
        </div>
    )
}

export default ShapeLayerProperties;
