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
    <aside
      className="w-72 bg-white flex flex-col overflow-hidden relative shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] z-30 stagger-fade-in"
    >
      <div className="px-6 py-6 border-b border-slate-200/50 bg-white">
        <Link href="/" className="flex items-center gap-3 relative group">
          <Image
            src="/layout/images/logo.png"
            height={44}
            width={44}
            alt="Quốc huy"
            className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xl text-slate-900 font-extrabold uppercase tracking-tight font-sans leading-tight">
              CHÍNH QUYỀN ĐIỆN TỬ
            </span>
          </div>
        </Link>
      
        {/* Search Input */}
        {/* <div className="relative">
          <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-white text-xs pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-2.5 text-xs bg-white/20 border border-white/30 text-white placeholder:text-white rounded-lg hover:border-white/50 hover:bg-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40 focus:bg-white/30 transition-all"
          />
        </div> */}
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 relative bg-white
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-white
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:m-1
        [&::-webkit-scrollbar-thumb]:bg-slate-200
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:hover:bg-slate-300
        [&::-webkit-scrollbar-thumb]:transition-colors">
        <AdminMenu model={model} />
      </div>
    </aside>
  );
}