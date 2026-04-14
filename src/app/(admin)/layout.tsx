"use client";

import { useState, useCallback } from "react";
import { Breadcrumbs } from "@heroui/react";
import AdminSidebar, {
  Breadcrumb,
} from "@/components/layouts/admin/AdminSidebar";
import AdminHeader from "@/components/layouts/admin/AdminHeader";

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

  const setBreadcrumbsData = useCallback((data: Breadcrumb[]) => {
    setBreadcrumbsDataState(data);
  }, []);

  const setUserInfo = useCallback((info: UserInfo | null) => {
    setUserInfoState(info);
  }, []);

  return (
    <div className="flex h-screen">
      <AdminSidebar
        setBreadcrumbsData={setBreadcrumbsData}
        setUserInfo={setUserInfo}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto w-full px-3 py-3 md:px-5 md:py-4 lg:px-6 lg:py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
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
              className="flex items-center gap-2 ml-auto"
            />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
