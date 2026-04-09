"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dropdown } from "@heroui/react";
import Image from "next/image";

import cacheService from "@/services/cache.service";
import proxyService from "@/services/proxy/proxy.service";
import tokenService from "@/services/token.service";
import utilsService from "@/services/utils/utils.service";
import { AES_IV, LOCAL_STORAGE_USER_INFO, USER_ROLE } from "@/constants/auth.enum";
import { dispatchLogout } from "@/services/auth/auth-sso.service";

interface UserInfo {
  firstName?: string;
  currentUser?: string;
  isAdminLogin?: boolean;
  role?: string[];
  [key: string]: unknown;
}

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
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
          escape(utilsService.base64ToArray(result.accessToken?.split(".")[1]))
        );
        const tokenJson = JSON.parse(tokenDecode) as Record<string, unknown>;
        tokenJson.userId = result.userId || "";
        utilsService.setUserInfo(tokenJson);
        cacheService.set(
          USER_ROLE,
          utilsService.encryptAES(JSON.stringify(result.roles), AES_IV)
        );

        window.location.href = "/quan-tri/system/users";
      }
    } catch (error) {
      console.error("Login as user error:", error);
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-[#0f6bbf] text-white shadow-sm flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars text-lg" />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/layout/images/logo.png"
            height={36}
            width={36}
            alt="Logo"
            className="rounded"
          />
          <div className="hidden sm:flex flex-col">
  
            <span className="text-xs font-semibold uppercase tracking-wide">
              Chính quyền điện tử
            </span>
          </div>
        </Link>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
       <Link
          href="/"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors text-md"
        >
          <i className="fas fa-home text-md" />
          <span className="font-medium">Trang chủ</span>
        </Link>

      <Dropdown>
          <Dropdown.Trigger>
            {/* FIX: Remove button wrapper to prevent nested button hydration error */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <span className="text-xs font-medium hidden lg:block text-white">
                {userInfo?.firstName || "User"}
              </span>
              <Image
                src="/layout/images/avatar-default.png"
                alt="User avatar"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border-2 border-white/30 group-hover:border-white transition-colors"
              />
              <i className="fas fa-chevron-down text-xs opacity-70 group-hover:opacity-100" />
            </div>
          </Dropdown.Trigger>
          
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu 
              aria-label="Profile Actions"
              onAction={(key) => {
                // Xử lý chuyển trang thay vì dùng onClick trong DropdownItem (Chuẩn HeroUI)
                if (key === "profile") router.push("/quan-tri/profile");
                if (key === "logout") handleLogout();
                if (key === "re-login" && userInfo?.currentUser) {
                  void handleLoginAsUser(userInfo.currentUser);
                }
              }}
            >
              <Dropdown.Item id="profile" textValue="Thông tin cá nhân">
                <div className="flex items-center gap-2">
                  <i className="fas fa-user-circle text-gray-400" />
                  <span>Thông tin cá nhân</span>
                </div>
              </Dropdown.Item>

              {userInfo?.isAdminLogin && !userInfo?.role?.includes("admin") && (
                <Dropdown.Item id="re-login" textValue="Đăng nhập lại">
                  <div className="flex items-center gap-2 text-primary font-medium">
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
    </header>
  );
}