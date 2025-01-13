"use client"

// import * as React from "react"
import { useEffect, useState } from "react"
import {
  AudioWaveform,
  Blocks,
  Calendar,
  Command,
  Home,
  Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react"

// import { NavFavorites } from "@/components/nav-favorites"
// import { NavMain } from "@/components/nav-main"
// import { NavSecondary } from "@/components/nav-secondary"
// import { NavWorkspaces } from "@/components/nav-workspaces"
// import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { layerManager } from "@/services/LayerManager";
import { Button } from "./ui/button";
import { FaTrash, FaFont, FaImage, FaClock, FaMinus } from "react-icons/fa";
import { useLayerContext } from "@/context/LayerContext";
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import Toolbar from "./Toolbar";
import { Type, Image, Gauge, Minus, Trash } from 'lucide-react';

interface Layer {
    id: string;
    name: string;
    type: string;
  }
  
  interface SortableItemProps {
    layer: Layer;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
  }
  
  const SortableItem: React.FC<SortableItemProps> = ({ layer, isSelected, onSelect, onDelete }) => {
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
  
    const handleDelete = () => {
      layerManager.removeLayer(layer.id);
      onDelete(layer.id);
    };
  
    return (
        <div ref={setNodeRef} style={style} className="flex items-center group"> {/* Added hover effect for the item */}
          <SidebarMenuButton
            {...attributes} {...listeners}
            className="flex-grow justify-start"
            variant={isSelected ? 'outline' : 'default'}
            onClick={handleClick}
          >
            <span>
                {/* Conditional rendering for icons based on layer type */}
                {layer.type === 'text' && <Type style={{ height: '14px' }} />} 
                {layer.type === 'image' && <Image style={{ height: '14px' }} />}
                {layer.type === 'rotator' && <Gauge style={{ height: '14px' }} />}
                {layer.type === 'bar' && <Minus style={{ height: '14px' }} />}
            </span>
            <span className={``}>
                {layer.name.replace(/(\D)(\d)/, '$1 $2')}
            </span>
          </SidebarMenuButton>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-sidebar-foreground/20 hover:text-destructive"
          >
            <Trash />
          </Button>
        </div>
      );
  };

const SidebarLeft: React.FC = () => {

    const [layers, setLayers] = useState<Layer[]>(layerManager.getLayers());
  const { selectedLayer, setSelectedLayer } = useLayerContext();

  const setSelectedLayerId = (id: string) => {
    const layer = layerManager.getLayers().find(layer => layer.id === id);
    if (!layer) return;
    setSelectedLayer(layer);
  };

  const selectedLayerId = selectedLayer?.id;

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

  const handleDeleteLayer = () => {
    setLayers(layerManager.getLayers().reverse());
  };
  return (
    <Sidebar>
        <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Acme Inc</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton>
                    <span>
                        <Search style={{ height: '14px' }} />
                    </span>
                    <span>Search</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu> */}
      </SidebarHeader>
        {/* <Toolbar /> */}
        <SidebarContent >
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Layers</SidebarGroupLabel>
          <SidebarMenu>
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
                  <SidebarMenuItem key={layer.id}>
                    <SortableItem
                      layer={layer}
                      isSelected={layer.id === selectedLayerId}
                      onSelect={setSelectedLayerId}
                      onDelete={handleDeleteLayer}
                    />
                  </SidebarMenuItem>
                ))}
              </SortableContext>
            </DndContext>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
        {/* <SidebarRail /> */}
        <SidebarSeparator className="mx-0" />
        <SidebarFooter>
                    Footer
        </SidebarFooter>
    </Sidebar>
  )
}

export default SidebarLeft;

// export function SidebarLeft({
//   ...props
// }: React.ComponentProps<typeof Sidebar>) {
//   return (
//     <Sidebar className="border-r-0" {...props}>
    //   <SidebarHeader>
    //     {/* <TeamSwitcher teams={data.teams} />
    //     <NavMain items={data.navMain} /> */}
    //   </SidebarHeader>
//       <SidebarContent>
//         {/* <NavFavorites favorites={data.favorites} />
//         <NavWorkspaces workspaces={data.workspaces} />
//         <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
//       </SidebarContent>
//       <SidebarRail />
//     </Sidebar>
//   )
// }
