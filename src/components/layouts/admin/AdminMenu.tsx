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
      <ul className="layout-menu admin-menu-root list-none p-0 m-0 space-y-0.5">
        {model.map((item, i) => {
          return !item.seperator ? (
            <AdminMenuItem item={item} root={true} index={i} key={item.label} />
          ) : (
            <li
              className="menu-separator admin-menu-separator"
              key={`sep-${i}`}
            ></li>
          );
        })}
      </ul>
    </MenuProvider>
  );
};

export default AdminMenu;