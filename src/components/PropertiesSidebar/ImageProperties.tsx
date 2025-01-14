import { useEffect, useState } from "react";
import PropertyInput from "../customUI/PropertyInput";
import { SidebarGroup, SidebarGroupLabel, SidebarSeparator } from "../ui/sidebar";
import { Axis3D } from "lucide-react";
import { layerManager } from "@/services/LayerManager";
import { useLayerContext } from "@/context/LayerContext";
import { FabricImage } from "fabric";

const ImageLayerProperties: React.FC = () => {

    const canvas = layerManager.getCanvas();
    const { selectedLayer } = useLayerContext();
    const selectedLayerId = selectedLayer?.id;

    const [imageLayerProperties, setImageLayerProperties] = useState({
        x: '',
        y: '',
        rotation: '',
        height: '',
        width: ''
    })

    useEffect(() => {
        const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
        const updateLayerProperties = () => {
            if (layer && layer.type === 'image') {
                const imageLayer = layer.fabricObject as FabricImage;
                setImageLayerProperties({
                    x: imageLayer.left.toString(),
                    y: imageLayer.top.toString(),
                    rotation: imageLayer.angle.toString(),
                    height: (imageLayer.scaleY * imageLayer.height).toString(),
                    width: (imageLayer.scaleX * imageLayer.width).toString()
                })
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
    }, [])

    const handleInputChange = (field: keyof typeof imageLayerProperties, value: string) => {
        if (selectedLayerId) {
            const layer = layerManager.getLayers().find(layer => layer.id === selectedLayerId);
            if (layer && layer.type === 'image') {
                const imageLayer = layer.fabricObject as FabricImage;
                if (field === 'x') {
                    imageLayer.set({ left: Number(value) });
                } else if (field === 'y') {
                    imageLayer.set({ top: Number(value) });
                } else if (field === 'rotation') {
                    imageLayer.set({ angle: Number(value) });
                } 
                const numValue = Math.max(1, Number(value)); // Ensure minimum value is 1
                if (field === 'width') {
                    imageLayer.scaleX = numValue / (imageLayer.width || 1);
                    setImageLayerProperties(prev => ({
                    ...prev,
                    width: numValue.toString()
                    }));
                } if (field === 'height') {
                    imageLayer.scaleY = numValue / (imageLayer.height || 1);
                    setImageLayerProperties(prev => ({
                    ...prev,
                    height: numValue.toString()
                    }));
                }

                setImageLayerProperties(prev => ({ ...prev, [field]: value }));

                imageLayer.setCoords();
                canvas?.renderAll();
            }
        }

    }

    return (
        <div>
            <SidebarGroup>
                <SidebarGroupLabel>Image Properties</SidebarGroupLabel>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>Transform</SidebarGroupLabel>
                <div className="flex space-x-4 px-2 py-2">
                    {/* X Position */}
                    <PropertyInput 
                        id='image-x' 
                        label='X' 
                        value={imageLayerProperties.x} 
                        onChange={value => handleInputChange('x', value)}   
                    />

                    {/* Y Position */}
                    <PropertyInput 
                        id='image-y' 
                        label='Y' 
                        value={imageLayerProperties.y} 
                        onChange={value => handleInputChange('y', value)}
                    />
                </div>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Width */}
                    <PropertyInput 
                        id='image-width' 
                        label='W' 
                        value={imageLayerProperties.width} 
                        onChange={value => handleInputChange('width', value)}
                    />

                    {/* Height */}
                    <PropertyInput 
                        id='image-height' 
                        label='H' 
                        value={imageLayerProperties.height} 
                        onChange={value => handleInputChange('height', value)}
                    />
                </div>
                <div className="flex space-x-4 px-2 py-2">
                    {/* Rotation */}
                    <PropertyInput 
                        id='image-rotation' 
                        label='Rotation'
                        icon={Axis3D}
                        value={imageLayerProperties.rotation} 
                        onChange={value => handleInputChange('rotation', value)}
                    />
                </div>
            </SidebarGroup>
            <SidebarSeparator />
        </div>
    );
}

export default ImageLayerProperties;