import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { layerManager } from '@/services/LayerManager';
import { CircleGauge, Image, Minus, MousePointer, Type, Square, Circle, Triangle, Slash, Shapes, ChevronDown } from 'lucide-react';

const Toolbar: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedShapeType, setSelectedShapeType] = useState<string>('rect');

  useEffect(() => {
    // Update the selected tool when it changes
    const handleToolChange = () => {
      setSelectedTool(layerManager.activeTool);
    };

    // Subscribe to tool changes
    layerManager.subscribeToToolChanges(handleToolChange);

    // Clean up the subscription when the component unmounts
    return () => {
      layerManager.unsubscribeFromToolChanges(handleToolChange);
    };
  }, []);

  const handleSelectTool = () => {
    layerManager.setActiveTool('select');
  };

  const handleAddText = () => {
    layerManager.setActiveTool('text');
  };

  const handleAddImage = () => {
    layerManager.setActiveTool('image');
  };

  const handleAddRotator = () => {
    layerManager.setActiveTool('rotator');
  };

  const handleAddBar = () => {
    layerManager.setActiveTool('bar');
  };

  const handleAddShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'line') => {
    setSelectedShapeType(shapeType);
    layerManager.setShapeSubType(shapeType);
    layerManager.setActiveTool('shape');
  };

  const isSelected = (tool: string) => selectedTool === tool;

  const shapeIcon = () => {
    switch (selectedShapeType) {
      case 'rect': return <Square className="w-4 h-4" />;
      case 'circle': return <Circle className="w-4 h-4" />;
      case 'triangle': return <Triangle className="w-4 h-4" />;
      case 'line': return <Slash className="w-4 h-4" />;
      default: return <Shapes className="w-4 h-4" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-4">
        <div className="h-14 w-fit bg-sidebar-accent border rounded-xl shadow-none flex items-center justify-between px-3">

          <div className="flex items-center justify-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelected('select') ? 'default' : 'ghost'}
                  size="icon"
                  onClick={handleSelectTool}
                >
                  <MousePointer />
                  <span className="sr-only">Select</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select Tool</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleAddText}
                  variant={isSelected('text') ? 'default' : 'ghost'}
                  size="icon"
                >
                  <Type />
                  <span className="sr-only">Text</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Text Tool</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleAddImage}
                  variant={isSelected('image') ? 'default' : 'ghost'}
                  size="icon"
                >
                  <Image />
                  <span className="sr-only">Image</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Image Tool</p>
              </TooltipContent>
            </Tooltip>

            {/* Shape Tool with dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={isSelected('shape') ? 'default' : 'ghost'}
                      className="gap-0.5 px-2"
                    >
                      {shapeIcon()}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                      <span className="sr-only">Shape</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Shape Tool</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="center" side="top" className="min-w-[140px]">
                <DropdownMenuItem onClick={() => handleAddShape('rect')} className="gap-2 cursor-pointer">
                  <Square className="w-4 h-4" />
                  Rectangle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddShape('circle')} className="gap-2 cursor-pointer">
                  <Circle className="w-4 h-4" />
                  Circle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddShape('triangle')} className="gap-2 cursor-pointer">
                  <Triangle className="w-4 h-4" />
                  Triangle
                </DropdownMenuItem>
                {/* The line tool is currently not working properly. Fix this later */}
                {/* <DropdownMenuItem onClick={() => handleAddShape('line')} className="gap-2 cursor-pointer">
                  <Slash className="w-4 h-4" />
                  Line
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleAddRotator}
                  variant={isSelected('rotator') ? 'default' : 'ghost'}
                  size="icon"
                >
                  <CircleGauge />
                  <span className="sr-only">Rotator</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rotator Tool</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleAddBar}
                  variant={isSelected('bar') ? 'default' : 'ghost'}
                  size="icon"
                >
                  <Minus />
                  <span className="sr-only">Bar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bar Tool</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Toolbar;