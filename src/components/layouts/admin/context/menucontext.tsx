"use client";

import React, { createContext, useState, ReactNode } from "react";

interface MenuContextType {
  activeMenu: string;
  setActiveMenu: (key: string) => void;
}

export const MenuContext = createContext<MenuContextType>({
  activeMenu: "",
  setActiveMenu: () => {},
});

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider = ({ children }: MenuProviderProps) => {
  const [activeMenu, setActiveMenu] = useState<string>("");

  return (
    <MenuContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </MenuContext.Provider>
  );
};
