"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Dropdown } from "@heroui/react";
import { useRouter } from "next/navigation";
import AdminFooter from "@/components/layouts/admin/AdminFooter";
import AdminSidebar, {
  Breadcrumb,
} from "@/components/layouts/admin/AdminSidebar";
import cacheService from "@/services/cache.service";
import tokenService from "@/services/token.service";
import utilsService from "@/services/utils/utils.service";
import { AES_IV, USER_ROLE } from "@/constants/auth.enum";
import { dispatchLogout } from "@/services/auth/auth-sso.service";
import proxyService from "@/services/proxy/proxy.service";
// import "@/styles/admin.scss";

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
  const router = useRouter();
  const [breadcrumbsData, setBreadcrumbsDataState] = useState<Breadcrumb[]>([]);
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);

  const setBreadcrumbsData = useCallback((data: Breadcrumb[]) => {
    setBreadcrumbsDataState(data);
  }, []);

  const setUserInfo = useCallback((info: UserInfo | null) => {
    setUserInfoState(info);
  }, []);

  const handleLogout = () => {
    tokenService.clear();
    dispatchLogout();
    router.push("/");
  };

  const handleLoginAsUser = async (username: string) => {
    try {
      const response = await proxyService.post<{
        result: { accessToken: string; userId?: string; roles: string[] };
      }>("/api/TokenAuth/LoginUserName", {
        userName: username,
      });

      if (response?.status === 200 && response?.data?.result) {
        const result = response.data.result;
        tokenService.storeToken(result.accessToken);

        const tokenDecode = decodeURIComponent(
          escape(utilsService.base64ToArray(result.accessToken?.split(".")[1])),
        );
        const tokenJson = JSON.parse(tokenDecode) as Record<string, unknown>;
        tokenJson.userId = result.userId || "";
        utilsService.setUserInfo(tokenJson);
        cacheService.set(
          USER_ROLE,
          utilsService.encryptAES(JSON.stringify(result.roles), AES_IV),
        );

        window.location.href = "/quan-tri/system/users";
      }
    } catch (error) {
      console.error("Login as user error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <AdminSidebar
        setBreadcrumbsData={setBreadcrumbsData}
        setUserInfo={setUserInfo}
      />
      <div className="flex flex-col flex-1 overflow-hidden bg-slate-50 relative">
        <header className="flex h-14 bg-white/70 backdrop-blur-md shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] px-6 items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <i className="fas fa-home text-sm" />
            </Link>

              {breadcrumbsData.length > 0 && (
                <>
                  {breadcrumbsData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2.5">
                      <i className="fas fa-chevron-right text-[10px] text-slate-400" />
                      <Link
                        href={item.url}
                        className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors truncate font-admin-heading"
                      >
                        {item.label}
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                target="_blank"
                className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm"
              >
                <i className="fas fa-home text-sm" />
                <span className="font-medium">Trang chủ</span>
              </Link>

              <div className="flex items-center h-8 px-1.5 bg-transparent rounded-md border border-slate-200">
                <Dropdown>
                  <Dropdown.Trigger>
                    <div className="flex items-center gap-2 cursor-pointer group px-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600">
                        <i className="fas fa-user text-xs" />
                      </span>
                      <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors font-admin-heading">
                        {userInfo?.firstName || "User"}
                      </span>
                      <i className="fas fa-chevron-down text-[10px] text-slate-400 group-hover:text-blue-600 transition-all" />
                    </div>
                  </Dropdown.Trigger>

                  <Dropdown.Popover placement="bottom end">
                    <Dropdown.Menu
                      aria-label="Profile Actions"
                      onAction={(key) => {
                        if (key === "profile") router.push("/quan-tri/profile");
                        if (key === "logout") handleLogout();
                        if (key === "re-login" && userInfo?.currentUser) {
                          void handleLoginAsUser(userInfo.currentUser);
                        }
                      }}
                    >
                      <Dropdown.Item id="profile" textValue="Thông tin cá nhân">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-user-circle text-blue-600" />
                          <span>Thông tin cá nhân</span>
                        </div>
                      </Dropdown.Item>

                      {userInfo?.isAdminLogin &&
                        !userInfo?.role?.includes("admin") && (
                          <Dropdown.Item id="re-login" textValue="Đăng nhập lại">
                            <div className="flex items-center gap-2 text-blue-600 font-medium">
                              <i className="fas fa-sign-in-alt" />
                              <span>Đăng nhập {userInfo.currentUser}</span>
                            </div>
                          </Dropdown.Item>
                        )}

                      <Dropdown.Item
                        id="logout"
                        className="text-red-600"
                        textValue="Đăng xuất"
                      >
                        <div className="flex items-center gap-2">
                          <i className="fas fa-sign-out-alt" />
                          <span>Đăng xuất</span>
                        </div>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50">
          {children}
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
