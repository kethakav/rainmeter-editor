// src/context/LayerContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Define the type for the Layer object (modify according to your layer structure)
interface Layer {
  id: string;
  name: string; // Add more properties as necessary
  type: string;
}

// Define the type for the context
interface LayerContextType {
  selectedLayerId: string | null;
  selectedLayer: Layer | null; // Add selectedLayer to context type
  setSelectedLayerId: (id: string | null) => void;
  setSelectedLayer: (layer: Layer | null) => void; // Add setter for selectedLayer
}

// Define the type for the provider's props
interface LayerProviderProps {
  children: React.ReactNode; // Add children prop type
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export const LayerProvider: React.FC<LayerProviderProps> = ({ children }) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null); // State for selectedLayer

  return (
    <LayerContext.Provider value={{ selectedLayerId, selectedLayer, setSelectedLayerId, setSelectedLayer }}>
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
