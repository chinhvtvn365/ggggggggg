"use client";

import React from "react";
import { useRouter } from "next/navigation"; // App Router dùng next/navigation
import { Button } from "@heroui/react";
import PublicLayout from "./(public)/layout";

export default function NotFound() {
  const router = useRouter();

  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-[70vh] overflow-hidden">
        <div className="flex flex-col items-center justify-center">
          {/* Hiệu ứng gradient bao quanh tương tự code cũ nhưng dùng Tailwind v4 */}
          <div className="p-[0.3rem] rounded-[56px] bg-linear-to-b from-blue-500/40 to-transparent">
            <div className="w-full bg-content1 py-12 px-10 sm:px-20 flex flex-col items-center rounded-[53px] shadow-lg">
              <span className="text-primary font-bold text-4xl">404</span>

              <h1 className="text-foreground font-bold text-5xl mt-4 mb-2">
                Không tìm thấy
              </h1>

              <div className="text-gray-500 mb-8 text-lg">
                Nội dung yêu cầu không tồn tại
              </div>

              <img
                src="/layout/images/asset-access.svg"
                alt="Error"
                className="mb-8 w-full max-w-[300px]"
              />

              <Button
                color="primary"
                variant="light"
                onPress={() => router.push("/")}
                size="lg"
                className="font-semibold"
              >
                <i className="pi pi-arrow-left mr-2" />
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
