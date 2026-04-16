"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dropdown, Button } from "@heroui/react";
import Image from "next/image";

import cacheService from "@/services/cache.service";
import proxyService from "@/services/proxy/proxy.service";
import tokenService from "@/services/token.service";
import utilsService from "@/services/utils/utils.service";
import {
  AES_IV,
  LOCAL_STORAGE_USER_INFO,
  USER_ROLE,
} from "@/constants/auth.enum";
import { dispatchLogout } from "@/services/auth/auth-sso.service";

interface UserInfo {
  firstName?: string;
  currentUser?: string;
  isAdminLogin?: boolean;
  role?: string[];
  [key: string]: unknown;
}

interface AdminHeaderProps {
  onDesktopMenuToggle?: () => void;
  onMobileMenuOpen?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function AdminHeader({
  onDesktopMenuToggle,
  onMobileMenuOpen,
  isSidebarCollapsed,
}: AdminHeaderProps) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Read from localStorage after mount (client-only)
    const loadUserInfo = () => {
      const user = cacheService.get(LOCAL_STORAGE_USER_INFO);
      if (user && typeof user === "string") {
        const userDes = utilsService.decryptAES(user);
        if (userDes && typeof userDes === "object") {
          setUserInfo(userDes as UserInfo);
        }
      } else {
        router.push(process.env.NEXT_PUBLIC_LOGIN_URL || "/login");
      }
    };
    loadUserInfo();
  }, [router]);

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
    <header className="admin-header-shell h-16 flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-30">
      {/* Left Section */}
      <div className="admin-header-left flex items-center gap-3 md:gap-5 min-w-0">
        <Link
          href="/quan-tri"
          className="admin-header-brand flex items-center gap-3 md:gap-4 min-w-0"
        >
          <div className="admin-header-logo relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center shrink-0">
            <Image
              src="/layout/images/logo.png"
              height={44}
              width={44}
              alt="Logo"
              className="object-contain w-auto h-auto"
            />
          </div>
          <div className="flex flex-col min-w-0 text-center">
            <span className="admin-header-brand-text text-base md:text-[22px] font-bold uppercase tracking-tight leading-[1.5] whitespace-nowrap text-center">
              Chính quyền điện tử
            </span>
          </div>
        </Link>
      </div>

      {/* Right Section */}
      <div className="admin-header-right flex items-center gap-2 md:gap-3">
        <Button
          size="sm"
          variant="outline"
          className="hidden md:flex h-9 px-3 bg-slate-100 hover:bg-slate-200"
          onPress={() => window.open("/", "_blank")}
        >
          <i className="fas fa-home text-sm" />
          <span>Trang chủ</span>
        </Button>

        <Dropdown>
          <Dropdown.Trigger>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 bg-slate-100 hover:bg-slate-200"
            >
              <span className="inline-flex items-center justify-center text-slate-600">
                <i className="fas fa-user text-sm" />
              </span>
              <span className="text-sm hidden lg:inline">
                {userInfo?.firstName || "Quản trị viên"}
              </span>
              <i className="fas fa-chevron-down text-[10px]" />
            </Button>
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
                  <i className="fas fa-user-circle text-base" />
                  <span className="text-sm font-medium">Thông tin cá nhân</span>
                </div>
              </Dropdown.Item>

              {userInfo?.isAdminLogin && !userInfo?.role?.includes("admin") && (
                <Dropdown.Item id="re-login" textValue="Đăng nhập lại">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-sign-in-alt" />
                    <span>Đăng nhập {userInfo.currentUser}</span>
                  </div>
                </Dropdown.Item>
              )}

              <Dropdown.Item
                id="logout"
                textValue="Đăng xuất"
                className="text-red-600"
              >
                <div className="flex items-center gap-2 text-red-600">
                  <i className="fas fa-sign-out-alt" />
                  <span className="font-medium">Đăng xuất</span>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </header>
  );
}
