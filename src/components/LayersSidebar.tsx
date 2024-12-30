import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { layerManager } from '@/services/LayerManager';
import { useLayerContext } from '@/context/LayerContext';
import { Card, CardContent, CardHeader } from './ui/card';

interface Layer {
  id: string;
  name: string;
}

interface SortableItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ layer, isSelected, onSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    layerManager.selectLayer(layer.id);
    onSelect(layer.id);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <div {...attributes} {...listeners} className="mr-2 cursor-move">
       ⠿
      </div>
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className="flex-grow justify-start"
        onClick={handleClick}
      >
        {layer.name}
      </Button>
    </div>
  );
};

const LayersSidebar: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>(layerManager.getLayers());
  const { selectedLayerId, setSelectedLayerId } = useLayerContext();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex(layer => layer.id === active.id);
      const newIndex = layers.findIndex(layer => layer.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newLayerOrder = arrayMove(layers, oldIndex, newIndex);
        layerManager.reorderLayers(newLayerOrder.map(layer => layer.id).reverse());
        setLayers(newLayerOrder);
        layerManager.updateCanvasLayerOrder();
        console.log("reordered");
      }
    }
  };

  useEffect(() => {
    const updateLayers = () => {
      setLayers(layerManager.getLayers().reverse());
    };

    layerManager.subscribeToLayerChanges(updateLayers);

    return () => {
      layerManager.unsubscribeFromLayerChanges(updateLayers);
    };
  }, []);

  // Update the selected layer state when the selectedLayerId changes
  useEffect(() => {
    setLayers((prevLayers) =>
      prevLayers.map((layer) => ({
        ...layer,
        isSelected: layer.id === selectedLayerId,
      }))
    );
  }, [selectedLayerId]);

  return (
    <Card className='w-50 m-4 rounded-2xl'>
      <CardHeader className='font-semibold text-xl border-b'>Layers</CardHeader>
      <CardContent>
        <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(100vh - 336px)' }}>
        <ScrollArea className="h-full">
          <div className="p-1 text-muted-foreground">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={layers.map(layer => layer.id)}
                strategy={verticalListSortingStrategy}
              >
                {layers.map((layer) => (
                  <SortableItem
                    key={layer.id}
                    layer={layer}
                    isSelected={layer.id === selectedLayerId}
                    onSelect={setSelectedLayerId}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </ScrollArea>
      </div>
      </CardContent>
    </Card>
    
  );
};

export default LayersSidebar;