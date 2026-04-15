"use client";

import { useAppSelector } from "@/lib/hooks";

export default function GlobalLoading() {
  const isLoading = useAppSelector((state) => state.loadingReducer.isLoading);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="global-loading-overlay fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner-box" aria-hidden="true">
          <div className="configure-border-1">
            <div className="configure-core" />
          </div>
          <div className="configure-border-2">
            <div className="configure-core" />
          </div>
        </div>
        <p className="text-sm mt-2 font-semibold text-slate-700">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}
