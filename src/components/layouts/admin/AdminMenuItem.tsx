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
        "layout-submenu admin-submenu overflow-hidden transition-all duration-300 ease-in-out",
        root
          ? "mt-0.5 mb-1 space-y-0.5 ml-0 pl-1"
          : "mt-0.5 space-y-0 pl-1",
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
  const isLevelOneChild = depth === 1;
  const hasItems = item.items && item.items.length > 0;

  const commonClasses = cn(
    "admin-menu-link flex items-center cursor-pointer transition-all duration-200 no-underline relative group/item",
    "px-2.5 py-1.5 text-sm rounded-lg gap-2 mx-0.5 my-0.5",
    isChildItem
      ? "font-medium"
      : isLevelOneChild
        ? "font-semibold"
      : "font-bold",
    item.class,
    isActiveRoute
      ? "admin-menu-link-active"
      : "admin-menu-link-idle"
  );

  return (
    <li
      className={cn("list-none mb-0.5 transition-all duration-300", {
        "layout-root-menuitem": root,
        "active-menuitem": active,
        "admin-menu-group": root && hasItems,
      })}
    >
      {root && item.label && item.visible !== false && !item.to && !item.items && (
        <div className="admin-menu-heading mb-1 mt-3 px-3 flex items-center cursor-default">
          <span className="admin-menu-heading-label text-[10px] font-black uppercase tracking-[0.12em] pb-0.5">
            {item.label}
          </span>
          <div className="admin-menu-heading-line ml-2 h-px flex-1" />
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
                  "admin-menu-icon-wrap flex justify-center shrink-0 transition-all duration-200",
                  root ? "w-5 opacity-100" : "w-5 opacity-80 group-hover/item:opacity-100"
                )}>
                  <i className={cn(item.icon, root ? "text-[16px]" : "text-[14px]", isActiveRoute ? "text-blue-700" : "text-slate-700 group-hover/item:text-slate-900")} />
                </div>
              )}
              {!item.icon && isChildItem && (
                <div className="w-5 flex justify-center shrink-0">
                  <div className="admin-menu-dot w-1.5 h-1.5 rounded-full transition-colors" />
                </div>
              )}
              <span className={cn(
                "admin-menu-label flex-1 truncate transition-colors",
                isChildItem
                  ? "text-[12px] font-medium"
                  : isLevelOneChild
                    ? "text-[12.5px] font-semibold"
                    : "text-[13px] font-bold",
                isActiveRoute
                  ? isLevelOneChild
                    ? "text-blue-700 font-semibold"
                    : "text-blue-700 font-bold"
                  : isLevelOneChild
                    ? "text-slate-800 group-hover/item:text-slate-900"
                    : "text-slate-700 group-hover/item:text-slate-900"
              )}>{item.label}</span>
            </Link>
          ) : (
            <div
              onClick={(e) => itemClick(e)}
              className={cn(commonClasses, "group/parent pr-3", {
                "text-slate-900": active && !isActiveRoute,
                "admin-menu-link-open": active && !isActiveRoute,
              })}
            >
              {item.icon && (
                <div className="admin-menu-icon-wrap w-5 flex justify-center shrink-0 opacity-100 transition-all duration-200">
                  <i className={cn(item.icon, "text-[16px]", active ? "text-blue-700" : "text-slate-700 group-hover/parent:text-slate-900")} />
                </div>
              )}
              <span className={cn(
                "admin-menu-label flex-1 truncate transition-colors text-[12.5px]",
                isLevelOneChild ? "font-bold" : "font-extrabold",
                active ? "text-blue-700" : "text-slate-700 group-hover/item:text-slate-900"
              )}>{item.label}</span>
              <i className={cn(
                "admin-menu-chevron fas fa-chevron-right text-[8px] transition-transform duration-200",
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