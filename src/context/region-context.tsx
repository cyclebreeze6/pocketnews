
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface RegionContextType {
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRegion, setSelectedRegionState] = useState<string>('Global');

  useEffect(() => {
    try {
      const storedRegion = localStorage.getItem('selectedRegion');
      if (storedRegion) {
        setSelectedRegionState(storedRegion);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
  }, []);

  const setSelectedRegion = (region: string) => {
    try {
      setSelectedRegionState(region);
      localStorage.setItem('selectedRegion', region);
    } catch (error) {
      console.error("Could not write to localStorage:", error);
    }
  };

  return (
    <RegionContext.Provider value={{ selectedRegion, setSelectedRegion }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = (): RegionContextType => {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
