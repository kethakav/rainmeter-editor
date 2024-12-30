import React, { createContext, useContext, useCallback, useState } from 'react';

type ToolMode = 'default' | 'text' | 'shape' | 'image';

interface CanvasContextType {
  activeToolMode: ToolMode;
  setActiveToolMode: (mode: ToolMode) => void;
  onCanvasClick: (x: number, y: number) => void;
  setCanvasClickHandler: (handler: (x: number, y: number) => void) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeToolMode, setActiveToolMode] = useState<ToolMode>('default');
  const [canvasClickHandler, setCanvasClickHandler] = useState<(x: number, y: number) => void>(() => () => {});

  const onCanvasClick = useCallback((x: number, y: number) => {
    if (canvasClickHandler) {
      canvasClickHandler(x, y);
      
      // Automatically exit text mode after adding text
      if (activeToolMode === 'text') {
        setActiveToolMode('default');
      }
    }
  }, [canvasClickHandler, activeToolMode]);

  return (
    <CanvasContext.Provider value={{ 
      activeToolMode, 
      setActiveToolMode,
      onCanvasClick, 
      setCanvasClickHandler 
    }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within a CanvasProvider");
  }
  return context;
};