// src/context/LayerContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Define the type for the context
interface LayerContextType {
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
}

// Define the type for the provider's props
interface LayerProviderProps {
  children: React.ReactNode; // Add children prop type
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export const LayerProvider: React.FC<LayerProviderProps> = ({ children }) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  return (
    <LayerContext.Provider value={{ selectedLayerId, setSelectedLayerId }}>
      {children}
    </LayerContext.Provider>
  );
};

export const useLayerContext = () => {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error('useLayerContext must be used within a LayerProvider');
  }
  return context;
};
