"use client";

import React from "react";
import AdminMenuItem from "./AdminMenuItem";
import { MenuProvider } from "./context/menucontext";
import { MenuItem } from "@/types/menu";

interface AdminMenuProps {
  model: MenuItem[];
}

const AdminMenu = ({ model }: AdminMenuProps) => {
  return (
    <MenuProvider>
      <ul className="layout-menu list-none p-0 m-0">
        {model.map((item, i) => {
          return !item.seperator ? (
            <AdminMenuItem item={item} root={true} index={i} key={item.label} />
          ) : (
            <li
              className="menu-separator border-t border-slate-200 my-2"
              key={`sep-${i}`}
            ></li>
          );
        })}
      </ul>
    </MenuProvider>
  );
};

export default AdminMenu;