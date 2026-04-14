"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dropdown, Button, Avatar } from "@heroui/react";
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
    <header className="h-16 border-b flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        {onMenuToggle && (
          <Button
            isIconOnly
            variant="ghost"
            onPress={onMenuToggle}
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars text-lg" />
          </Button>
        )}

        <Link href="/quan-tri" className="hidden sm:flex items-center gap-4">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <Image
              src="/layout/images/logo.png"
              height={44}
              width={44}
              alt="Logo"
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[19px] font-bold uppercase tracking-tight leading-loose whitespace-nowrap">
              Chính quyền điện tử
            </span>
          </div>
        </Link>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button
          as={Link}
          href="/"
          target="_blank"
          size="sm"
          variant="outline"
          className="hidden md:flex"
        >
          <i className="fas fa-home text-sm" />
          <span>Trang chủ</span>
        </Button>

        <Dropdown>
          <Dropdown.Trigger>
            <Button variant="ghost" size="sm">
              <span className="text-xs font-bold hidden lg:block">
                {userInfo?.firstName || "Quản trị viên"}
              </span>
              <Avatar src="/layout/images/avatar-default.png" size="sm" />
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
                  <i className="fas fa-user-circle" />
                  <span>Thông tin cá nhân</span>
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