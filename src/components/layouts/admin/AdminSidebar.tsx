"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import proxyService from "@/services/proxy/proxy.service";
import AdminMenu from "@/components/layouts/admin/AdminMenu";
import { MenuItem } from "@/types/menu";
import cacheService from "@/services/cache.service";
import utilsService from "@/services/utils/utils.service";
import { LOCAL_STORAGE_USER_INFO } from "@/constants/auth.enum";

interface MenuItemRaw {
  name: string;
  path: string;
  iconClass?: string;
  moTabMoi?: boolean;
  children: MenuItemRaw[];
}

interface UserInfo {
  firstName?: string;
  currentUser?: string;
  isAdminLogin?: boolean;
  role?: string[];
  [key: string]: unknown;
}

export interface Breadcrumb {
  label: string;
  url: string;
}

// Helper function to convert API menu data to MenuItem format
const convertToModel = (data: MenuItemRaw[]): MenuItem[] => {
  return data.map((item) => ({
    label: item.name,
    to: item.path,
    moTabMoi: item?.moTabMoi || false,
    icon: item.iconClass,
    items: item.children.length ? convertToModel(item.children) : undefined,
  }));
};

interface AdminSidebarProps {
  setBreadcrumbsData?: (data: Breadcrumb[]) => void;
  setUserInfo?: (info: UserInfo | null) => void;
}

export default function AdminSidebar({ setBreadcrumbsData, setUserInfo: setParentUserInfo }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [model, setModel] = useState<MenuItem[]>([]);

  function findBreadcrumbs(
    menuItems: MenuItem[],
    currentPath: string
  ): Breadcrumb[] {
    const breadcrumbs: Breadcrumb[] = [];
    function traverse(menu: MenuItem[]): boolean {
      for (const item of menu) {
        breadcrumbs.push({ label: item.label, url: item.to || "#" });
        if (item.to === currentPath) return true;
        if (item.items && traverse(item.items)) return true;
        breadcrumbs.pop();
      }
      return false;
    }
    traverse(menuItems);
    return breadcrumbs;
  }

  useEffect(() => {
    // Load user info
    const loadUserInfo = () => {
      const user = cacheService.get(LOCAL_STORAGE_USER_INFO);
      if (user && typeof user === "string") {
        const userDes = utilsService.decryptAES(user);
        if (userDes && typeof userDes === "object") {
          const info = userDes as UserInfo;
          if (setParentUserInfo) setParentUserInfo(info);
        }
      } else {
        router.push(process.env.NEXT_PUBLIC_LOGIN_URL || "/login");
      }
    };
    loadUserInfo();
  }, [router, setParentUserInfo]);

  useEffect(() => {
    async function fetchData() {
      try {
        const resMenu = await proxyService.get<MenuItemRaw[]>(
          "/api/app/menu-management/hierarchy",
          {
            isActive: true,
            MenuGroup: "administration",
          }
        );
        if (resMenu?.status === 200 && resMenu.data) {
          const result = convertToModel(resMenu.data);
          setModel(result);
        }
      } catch (error) {
        console.error("Fetch sidebar data error:", error);
      }
    }
    void fetchData();
  }, []);

  useEffect(() => {
    if (setBreadcrumbsData) {
      let breadcrumbs = findBreadcrumbs(model, pathname);
      const exceptPaths = ["/quan-tri", "/quan-tri/page-analytics"];
      if (exceptPaths.includes(pathname)) {
        breadcrumbs = [];
      }
      setBreadcrumbsData(breadcrumbs);
    }
  }, [model, pathname, setBreadcrumbsData]);

  return (
    <aside className="w-[240px] flex flex-col overflow-hidden relative z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)] bg-white border-r border-slate-100">
      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto pt-6 pb-8 px-2
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-slate-100
        hover:[&::-webkit-scrollbar-thumb]:bg-blue-100/60
        transition-all scroll-smooth">
        <AdminMenu model={model} />
      </div>
    </aside>
  );
}