"use client";

import { useState, useCallback, useEffect } from "react";
import { Breadcrumbs } from "@heroui/react";
import AdminSidebar, {
  Breadcrumb,
} from "@/components/layouts/admin/AdminSidebar";
import AdminHeader from "@/components/layouts/admin/AdminHeader";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "admin-sidebar-collapsed";

interface UserInfo {
  firstName?: string;
  currentUser?: string;
  isAdminLogin?: boolean;
  role?: string[];
  [key: string]: unknown;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [breadcrumbsData, setBreadcrumbsDataState] = useState<Breadcrumb[]>([]);
  const [, setUserInfoState] = useState<UserInfo | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return sessionStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1";
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      isSidebarCollapsed ? "1" : "0"
    );
  }, [isSidebarCollapsed]);

  const setBreadcrumbsData = useCallback((data: Breadcrumb[]) => {
    setBreadcrumbsDataState(data);
  }, []);

  const setUserInfo = useCallback((info: UserInfo | null) => {
    setUserInfoState(info);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const expandDesktopSidebar = useCallback(() => {
    setIsSidebarCollapsed(false);
  }, []);

  return (
    <div className="admin-layout-root flex h-screen">
      <AdminSidebar
        setBreadcrumbsData={setBreadcrumbsData}
        setUserInfo={setUserInfo}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
        onRequestExpandDesktop={expandDesktopSidebar}
      />
      <div className="admin-layout-content flex flex-col flex-1 overflow-hidden">
        <AdminHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onDesktopMenuToggle={toggleDesktopSidebar}
          onMobileMenuOpen={openMobileSidebar}
        />

        <main className="admin-layout-main flex-1 overflow-y-auto w-full px-3 py-3 md:px-3 md:py-3">
          <div className="admin-breadcrumb-bar flex items-center justify-between gap-3">
            <div className="min-w-0">
              {breadcrumbsData.length > 0 && (
                <Breadcrumbs>
                  <Breadcrumbs.Item key="home" href="/quan-tri">
                    <span className="inline-flex items-center gap-1">
                      Trang chủ
                    </span>
                  </Breadcrumbs.Item>
                  {breadcrumbsData.map((item, index) => (
                    <Breadcrumbs.Item key={index} href={item.url}>
                      <span className="">{item.label}</span>
                    </Breadcrumbs.Item>
                  ))}
                </Breadcrumbs>
              )}
            </div>

            <div
              id="admin-page-actions"
              className="admin-page-actions flex items-center gap-2 ml-auto"
            />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
