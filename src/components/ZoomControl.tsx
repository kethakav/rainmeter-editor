import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Minus, Plus, Maximize, RotateCcw } from 'lucide-react';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetZoom: () => void;
  onZoomToFit: () => void;
  min?: number;
  max?: number;
}

const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];

const ZoomControl: React.FC<ZoomControlProps> = ({
  zoom,
  onZoomChange,
  onResetZoom,
  onZoomToFit,
  min = 0.1,
  max = 5,
}) => {
  const handleZoomOut = () => {
    // Find the next step down
    const currentIdx = ZOOM_STEPS.findIndex(s => s >= zoom);
    const nextIdx = Math.max(0, (currentIdx <= 0 ? 0 : currentIdx - 1));
    const newZoom = Math.max(min, ZOOM_STEPS[nextIdx]);
    onZoomChange(newZoom);
  };

  const handleZoomIn = () => {
    // Find the next step up
    const currentIdx = ZOOM_STEPS.findIndex(s => s > zoom);
    const nextIdx = currentIdx === -1 ? ZOOM_STEPS.length - 1 : Math.min(ZOOM_STEPS.length - 1, currentIdx);
    const newZoom = Math.min(max, ZOOM_STEPS[nextIdx]);
    onZoomChange(newZoom);
  };

  const displayPercent = Math.round(zoom * 100);

  return (
    <TooltipProvider>
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-sidebar-accent border rounded-xl px-2 py-1.5 shadow-sm z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= min}
              className="h-7 w-7"
            >
              <Minus className="h-3.5 w-3.5" />
              <span className="sr-only">Zoom Out</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onResetZoom}
              className="min-w-[50px] text-center text-xs font-medium tabular-nums px-1 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              {displayPercent}%
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Reset to 100% (Ctrl+0)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= max}
              className="h-7 w-7"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="sr-only">Zoom In</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomToFit}
              className="h-7 w-7"
            >
              <Maximize className="h-3.5 w-3.5" />
              <span className="sr-only">Zoom to Fit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Zoom to Fit</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onResetZoom}
              className="h-7 w-7"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="sr-only">Reset View</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Reset View</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ZoomControl;
