import { useLayerContext } from "@/context/LayerContext";
import { layerManager } from "@/services/LayerManager";
import { Circle, FabricImage, FabricObject, Group } from "fabric";
import { useEffect, useState } from "react";
import { SidebarGroup, SidebarGroupLabel, SidebarSeparator } from "../ui/sidebar";
import PropertyInput from "../customUI/PropertyInput";
import { CircleArrowOutUpRight, RotateCw, UnfoldHorizontal, UnfoldVertical } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const RotatorLayerProperties: React.FC = () => {

    const canvas = layerManager.getCanvas();
    const { selectedLayer } = useLayerContext();
    const selectedLayerId = selectedLayer?.id;

    const [measureType, setMeasureType] = useState<string>('custom-text');
    const [category, setCategory] = useState<string>('');

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

    const getMeasureTypeAndCategory = (measure: string) => {
        if (measure.startsWith('rotator-time-')) {
          return { type: 'time', category: '' };
        }
        if (measure.startsWith('rotator-cpu-')) {
          return { type: 'cpu', category: '' };
        }
        if (measure.startsWith('rotator-disk-')) {
          return { type: 'disk', category: '' };
        }
        return { type: 'time', category: '' };
    };

    useEffect(() => {
        const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        const updateLayerProperties = () => {
            if (layer && layer.type === 'rotator') {
                const rotatorLayer = layer.fabricObject as FabricImage;
                const measure = layer.measure || 'rotator-time-second';
                const { type, category: newCategory } = getMeasureTypeAndCategory(measure);
                console.log(category); // Do not delete, this is here because Tauri won't build the app with unused variables (category)

                setRotatorLayerProperties({
                    x: rotatorLayer.left?.toString() || '0',
                    y: rotatorLayer.top?.toString() || '0',
                    height: (rotatorLayer.scaleY * rotatorLayer.height)?.toString() || '100',
                    width: (rotatorLayer.scaleX * rotatorLayer.width)?.toString() || '100',
                    offsetX: layer.properties.find(prop => prop.property === 'offsetX')?.value.toString() || '0',
                    offsetY: layer.properties.find(prop => prop.property === 'offsetY')?.value.toString() || '0',
                    startAngle: layer.properties.find(prop => prop.property === 'startAngle')?.value.toString() || '0',
                    rotationAngle: layer.properties.find(prop => prop.property === 'rotationAngle')?.value.toString() || '90',
                    rotation: rotatorLayer.angle?.toString() || '0',
                    source: layer.imageSrc || '',
                    measure: measure,
                })

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

    }, [selectedLayerId])

    const handleInputChange = (field: keyof typeof rotatorLayerProperties, value: string) => {
        if (selectedLayerId) {
            const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
            if (layer && layer.type === 'rotator') {
                const rotatorLayer = layer.fabricObject as FabricImage;
                if (field === 'x') {
                    rotatorLayer.set({ left: Number(value) });
                } else if (field === 'y') {
                    rotatorLayer.set({ top: Number(value) });
                }


                const numValue = Math.max(1, Number(value)); // Ensure minimum value is 1
                if (field === 'width') {
                    rotatorLayer.scaleX = numValue / (rotatorLayer.width || 1);
                    setRotatorLayerProperties(prev => ({
                    ...prev,
                    width: numValue.toString()
                    }));
                } if (field === 'height') {
                    rotatorLayer.scaleY = numValue / (rotatorLayer.height || 1);
                    setRotatorLayerProperties(prev => ({
                    ...prev,
                    height: numValue.toString()
                    }));
                }

                if (field === 'offsetX' || field === 'offsetY') {
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
                }

                if (field === 'startAngle' || field === 'rotationAngle') {
                    const numValue = Number(value);
                    const prop = layer.properties.find(prop => prop.property === field);
                    if (prop) {
                        prop.value = numValue.toString();
                    } else {
                        layer.properties.push({ property: field, value: numValue.toString() });
                    }

                    const UIGroup = layer.UIElements as Group;
                    const rangeIndicator = UIGroup._objects[1] as Circle

                    if (field === 'startAngle') {
                        // rangeIndicator.set('startAngle', numValue);
                        rangeIndicator.set('angle', numValue - 90);
                        rotatorLayer.set('angle', numValue);
                    } else if (field === 'rotationAngle') {
                        rangeIndicator.set('endAngle', numValue);
                    }
                }
                if (field === 'source') {
                    console.log(value);
                    layerManager.updateImageForSelectedLayer(value);
                }
                if (field === 'measure') {
                    // layer.measure = value;
                    layerManager.updateMeasureForSelectedLayer(value);
                }

                setRotatorLayerProperties(prev => ({ ...prev, [field]: value }));

                rotatorLayer.setCoords();
                canvas?.renderAll();
            }
        }
    }

    const handleMeasureTypeChange = (value: string) => {
        setMeasureType(value);
        if (value === 'time') {
            setCategory('time'); // Add the correct one
            handleInputChange('measure', 'rotator-time-second');
        } else if (value === 'cpu') {
            setCategory('cpu'); // Add the correct one
            handleInputChange('measure', 'rotator-cpu-average');
        } else if (value === 'disk') {
            setCategory('disk'); // Add the correct one
            handleInputChange('measure', 'rotator-disk-c-usage');
        }
    }

    return(
        <div>
            <SidebarGroup>
                <SidebarGroupLabel>Rotator Properties</SidebarGroupLabel>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Change Rotator Image</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Source */}
                    <Input
                    id="rotator-image"
                    type='file'
                    className="w-52 shadow-none"
                    accept=".png"
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                        const fileURL = URL.createObjectURL(file);
                        console.log(fileURL);
                        handleInputChange('source', fileURL);
                        }
                    }}
                    />
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Transform</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* X Position */}
                    <PropertyInput 
                        id='rotator-x' 
                        label='X' 
                        value={rotatorLayerProperties.x} 
                        onChange={value => handleInputChange('x', value)}   
                    />

                    {/* Y Position */}
                    <PropertyInput 
                        id='rotator-y' 
                        label='Y' 
                        value={rotatorLayerProperties.y} 
                        onChange={value => handleInputChange('y', value)}
                    />
                </div>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Width */}
                    <PropertyInput 
                        id='rotator-width' 
                        label='W' 
                        value={rotatorLayerProperties.width} 
                        onChange={value => handleInputChange('width', value)}
                    />

                    {/* Height */}
                    <PropertyInput 
                        id='rotator-height' 
                        label='H' 
                        value={rotatorLayerProperties.height} 
                        onChange={value => handleInputChange('height', value)}
                    />
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Pivot Point</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Offset X */}
                    <PropertyInput 
                        id='rotator-offset-x' 
                        label='Offset X' 
                        icon={UnfoldHorizontal}
                        value={rotatorLayerProperties.offsetX} 
                        onChange={value => handleInputChange('offsetX', value)}   
                    />

                    {/* Offset Y */}
                    <PropertyInput 
                        id='rotator-offset-y' 
                        label='Offset Y' 
                        icon={UnfoldVertical}
                        value={rotatorLayerProperties.offsetY} 
                        onChange={value => handleInputChange('offsetY', value)}
                    />
                </div>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Rotation Angles</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Start Angle */}
                    <PropertyInput 
                        id='rotator-start-angle' 
                        label='Start Angle' 
                        icon={CircleArrowOutUpRight}
                        value={rotatorLayerProperties.startAngle} 
                        onChange={value => handleInputChange('startAngle', value)}
                    />

                    {/* Rotation Angle */}
                    <PropertyInput 
                        id='rotator-rotation-angle' 
                        label='Rotation Angle'
                        icon={RotateCw} 
                        value={rotatorLayerProperties.rotationAngle} 
                        onChange={value => handleInputChange('rotationAngle', value)}
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
                            <SelectValue placeholder="Select Measure Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='time'>Time</SelectItem>
                            <SelectItem value="cpu">CPU</SelectItem>
                            <SelectItem value="disk">Disk</SelectItem>
                            <SelectItem value="ram">RAM (Coming Soon)</SelectItem>
                            <SelectItem value="network">Network (Coming Soon)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </SidebarGroup>
            {measureType === 'time' && (
                <SidebarGroup className="pb-0">
                    <SidebarGroupLabel>Time Measure</SidebarGroupLabel>
                    <div className="flex space-x-4 px-2 py-2">
                        {/* Select Measure Category */}
                        <Select
                            value={rotatorLayerProperties.measure}
                            onValueChange={handleInputChange.bind(null, 'measure') as any}
                            defaultValue='time'
                        >
                            <SelectTrigger id="category-select" className='w-52 shadow-none'>
                                <SelectValue placeholder="Select Time Measure" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rotator-time-second">Seconds</SelectItem>
                                <SelectItem value="rotator-time-minute">Minutes</SelectItem>
                                <SelectItem value="rotator-time-hour">Hours</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </SidebarGroup>
            )}
            {measureType === 'cpu' && (
                <SidebarGroup className="pb-0">
                    <SidebarGroupLabel>CPU Measure</SidebarGroupLabel>
                    <div className="flex space-x-4 px-2 py-2">
                        {/* Select Measure Category */}
                        <Select
                            value={rotatorLayerProperties.measure}
                            onValueChange={handleInputChange.bind(null, 'measure') as any}
                            defaultValue='time'
                        >
                            <SelectTrigger id="category-select" className='w-52 shadow-none'>
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
                </SidebarGroup>
            )}
            {measureType === 'disk' && (
                <SidebarGroup className="pb-0">
                    <SidebarGroupLabel>Disk Measure</SidebarGroupLabel>
                    <div className="flex space-x-4 px-2 py-2">
                        {/* Select Measure Category */}
                        <Select
                            value={rotatorLayerProperties.measure}
                            onValueChange={handleInputChange.bind(null, 'measure') as any}
                            defaultValue='rotator-disk-c-usage'
                        >
                            <SelectTrigger id="category-select" className='w-52 shadow-none'>
                                <SelectValue placeholder="Select Disk Measure" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rotator-disk-c-usage">Disk C Usage</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </SidebarGroup>
            )}
        </div>
    )
}

export default RotatorLayerProperties;