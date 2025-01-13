import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { layerManager } from '@/services/LayerManager';

const Toolbar: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('select');

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

  const isSelected = (tool: string) => selectedTool === tool;  

  return (
    <TooltipProvider>
      <div className="h-16 m-4 w-fit bg-card border rounded-2xl shadow flex items-center justify-between px-4">
        
        <div className="flex items-center justify-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isSelected('select') ? 'default' : 'ghost'}
                size="icon"
                onClick={handleSelectTool}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                  <path d="M13 13l6 6"/>
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M4 7V4h16v3"/>
                  <path d="M9 20h6"/>
                  <path d="M12 4v16"/>
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="sr-only">Image</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Image Tool</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleAddRotator}
                variant={isSelected('rotator') ? 'default' : 'ghost'}
                size="icon"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  {/* Outer circle of speedometer */}
                  <circle cx="12" cy="12" r="9" />
                  
                  {/* Needle */}
                  <path d="M12 12 L16 7" strokeWidth="2.5" />
                  
                  {/* Center dot */}
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="3" y="11" width="18" height="2" rx="1" ry="1"/>
                </svg>
                <span className="sr-only">Bar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bar Tool</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Toolbar;