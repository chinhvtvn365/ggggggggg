"use client";

import React, { useEffect, useContext, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuContext } from "./context/menucontext";
import { MenuItem } from "@/types/menu";

interface AdminMenuItemProps {
  item: MenuItem;
  root?: boolean;
  index: number;
  parentKey?: string;
  className?: string;
}

// Helper function for className merging
const cn = (...classes: (string | boolean | undefined | null | Record<string, boolean | undefined>)[]) => {
  return classes
    .map((cls) => {
      if (!cls) return "";
      if (typeof cls === "string") return cls;
      if (typeof cls === "object") {
        return Object.keys(cls)
          .filter((key) => cls[key])
          .join(" ");
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
};

const AdminMenuItem = (props: AdminMenuItemProps) => {
  const { activeMenu, setActiveMenu } = useContext(MenuContext);
  const pathname = usePathname();
  const { item, index, root, parentKey } = props;
  const depth = parentKey ? parentKey.split("-").length : 0;

  const key = useMemo(
    () => (parentKey ? `${parentKey}-${index}` : String(index)),
    [parentKey, index]
  );

  // Helper xử lý logic path
  const getEffectivePath = (path: string) => {
    if (path.startsWith("/system/")) {
      const slug = path.replace("/system/", "");
      const parts = slug.split("/");
      return `/pages/system/${parts[0]}`;
    }
    return path;
  };

  const effectivePath = useMemo(() => getEffectivePath(pathname), [pathname]);

  const isActiveRoute = useMemo(() => {
    if (!item.to) return false;
    return (
      effectivePath === item.to ||
      (effectivePath.includes(item.to) &&
        effectivePath.endsWith("add-edit") &&
        item.to !== "/pages")
    );
  }, [item.to, effectivePath]);

  const active = useMemo(() => {
    return activeMenu === key || activeMenu.startsWith(key + "-");
  }, [activeMenu, key]);

  useEffect(() => {
    if (isActiveRoute) {
      setActiveMenu(key);
    }
  }, [isActiveRoute, key, setActiveMenu]);

  const itemClick = (event: React.MouseEvent) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    if (item.command) {
      item.command({ originalEvent: event, item });
    }

    if (item.items) {
      setActiveMenu(active ? parentKey || "" : key);
    } else {
      setActiveMenu(key);
    }
  };
  const subMenu = item.items && item.visible !== false && (
    <ul
      className={cn(
        "layout-submenu overflow-hidden transition-all duration-300 ease-in-out",
        root
          ? "mt-0.5 mb-1.5 space-y-0 relative before:absolute before:left-[17px] before:top-0 before:bottom-0 before:w-[1px] before:bg-slate-100 before:rounded-full ml-0 pl-3"
          : "mt-0.5 space-y-0 pl-3",
        "max-h-[2000px] opacity-100" // Always expanded
      )}
    >
      {item.items.map((child, i) => (
        <AdminMenuItem
          item={child}
          index={i}
          parentKey={key}
          key={child.label}
        />
      ))}
    </ul>
  );

  const isChildItem = depth >= 2;
  const hasItems = item.items && item.items.length > 0;

  const commonClasses = cn(
    "flex items-center cursor-pointer transition-all duration-200 no-underline relative group/item",
    "px-3 py-1.5 text-sm rounded-lg gap-2 mx-1 my-0",
    isChildItem
      ? "font-normal hover:bg-slate-100/50"
      : "font-bold",
    item.class,
    isActiveRoute
      ? "bg-blue-100/40 text-blue-950 shadow-sm"
      : "hover:bg-slate-100/80 text-slate-700 hover:text-slate-950"
  );

  return (
    <li
      className={cn("list-none mb-1 transition-all duration-300", {
        "layout-root-menuitem": root,
        "active-menuitem": active,
        "bg-slate-50/50 rounded-xl py-1 my-1.5 border border-slate-100/30 shadow-[0_1px_3px_rgba(0,0,0,0.01)]": root && hasItems,
      })}
    >
      {root && item.label && item.visible !== false && !item.to && !item.items && (
        <div className="mb-1.5 mt-4 px-4 flex items-center cursor-default">
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-900 border-b-2 border-blue-600/20 pb-0.5">
            {item.label}
          </span>
        </div>
      )}

      {item.visible !== false && (
        <>
          {item.to && !item.items ? (
            <Link
              href={item.to}
              target={item.target}
              onClick={(e) => {
                if (item?.moTabMoi) {
                  e.preventDefault();
                  window.open(item.to, "_blank");
                } else {
                  itemClick(e);
                }
              }}
              className={commonClasses}
              tabIndex={0}
            >
              {item.icon && (
                <div className={cn(
                  "flex justify-center shrink-0 transition-opacity",
                  root ? "w-5 opacity-100" : "w-5 opacity-80 group-hover/item:opacity-100"
                )}>
                  <i className={cn(item.icon, root ? "text-[16px]" : "text-[14px]", isActiveRoute ? "text-blue-700" : "text-slate-500 group-hover/item:text-blue-600")} />
                </div>
              )}
              {!item.icon && isChildItem && (
                <div className="w-5 flex justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/item:bg-blue-600" />
                </div>
              )}
              <span className={cn(
                "flex-1 truncate transition-colors",
                isChildItem ? "text-[12px] font-normal" : "text-[13px] font-semibold",
                isActiveRoute ? "text-blue-700 font-bold" : "text-slate-700 group-hover/item:text-slate-900"
              )}>{item.label}</span>
              {isActiveRoute && (
                <div className="absolute left-[-4px] top-1.5 bottom-1.5 w-[3.5px] bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
              )}
            </Link>
          ) : (
            <div
              onClick={(e) => itemClick(e)}
              className={cn(commonClasses, "group/parent pr-3", {
                "text-blue-950": active && !isActiveRoute
              })}
            >
              {item.icon && (
                <div className="w-5 flex justify-center shrink-0 opacity-100 transition-opacity">
                  <i className={cn(item.icon, "text-[16px]", active ? "text-blue-700" : "text-slate-600 group-hover/parent:text-blue-600")} />
                </div>
              )}
              <span className={cn(
                "flex-1 truncate transition-colors text-[12.5px] font-extrabold",
                active ? "text-blue-700" : "text-slate-700 group-hover/item:text-slate-900"
              )}>{item.label}</span>
              <i className={cn(
                "fas fa-chevron-right text-[8px] transition-transform duration-200",
                active ? "rotate-90 text-blue-700" : "text-slate-400"
              )} />
            </div>
          )}
        </>
      )}

      {subMenu}
    </li>
  );
};

export default AdminMenuItem;