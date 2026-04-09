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
        "layout-submenu overflow-hidden transition-all duration-300 ease-in-out mt-0.5 space-y-0.5",
        root || active ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
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

  const commonClasses = cn(
    "flex items-center cursor-pointer transition-all duration-200 no-underline relative group/item",
    isChildItem
      ? "pl-9 pr-2.5 py-2 text-sm text-slate-500 rounded-md gap-2"
      : "px-2.5 py-2 text-sm font-medium text-slate-700 rounded-md gap-2",
    item.class,
    isActiveRoute
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)] pl-[calc(theme(spacing.2.5)-4px)] font-bold pointer-events-none"
      : "hover:bg-slate-50 hover:text-slate-800"
  );

  return (
    <li
      className={cn("list-none mb-0", {
        "layout-root-menuitem": root,
        "active-menuitem": active,
      })}
    >
      {root && item.visible !== false && (
        <div className="mb-1 mt-1 first:mt-1 px-2.5 py-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-admin-heading">
              {item.label}
            </span>
          </div>
        </div>
      )}

      {item.to && !item.items && item.visible !== false ? (
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
          {!isChildItem && item.icon && (
            <div className={cn(
              "flex items-center justify-center transition-all w-6 h-6 rounded-md text-base",
              isActiveRoute
                ? "text-white"
                : "text-slate-500 bg-transparent"
            )}>
              <i className={item.icon}></i>
            </div>
          )}
          {isChildItem && (
            <span
              aria-hidden
              className={cn(
                "inline-block w-1.5 h-1.5 rounded-full",
                isActiveRoute ? "bg-white" : "bg-slate-400"
              )}
            />
          )}
          <span className={cn("flex-1", isChildItem ? "font-normal" : "font-semibold", isActiveRoute && "font-semibold")}>{item.label}</span>
          
          {/* Active indicator */}
          {isActiveRoute && (
            <div className={cn(
              "rounded-full",
              "w-1.5 h-1.5 bg-white shadow-[0_0_8px_white]"
            )} />
          )}
          
          {/* Arrow indicator for root items */}
          {root && !isActiveRoute && (
            <i className="fas fa-chevron-right text-[9px] text-slate-400 opacity-0 group-hover/item:opacity-100 transition-all" />
          )}
        </Link>
      ) : null}

      {subMenu}
    </li>
  );
};

export default AdminMenuItem;