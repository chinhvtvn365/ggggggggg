"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { hide } from "@/lib/features/snackbar/snackBarSlice";

const styleMap = {
  success: {
    wrap: "bg-emerald-50 border-emerald-200 text-emerald-900",
    icon: "fas fa-circle-check text-emerald-600",
  },
  error: {
    wrap: "bg-rose-50 border-rose-200 text-rose-900",
    icon: "fas fa-circle-xmark text-rose-600",
  },
  warning: {
    wrap: "bg-amber-50 border-amber-200 text-amber-900",
    icon: "fas fa-triangle-exclamation text-amber-600",
  },
  info: {
    wrap: "bg-sky-50 border-sky-200 text-sky-900",
    icon: "fas fa-circle-info text-sky-600",
  },
};

export default function SnackBar() {
  const dispatch = useAppDispatch();
  const { isShow, title, message, snackBarType, delay } = useAppSelector(
    (state) => state.snackBarReducer,
  );

  useEffect(() => {
    if (!isShow) return;
    const timeout = setTimeout(() => {
      dispatch(hide());
    }, delay || 3000);

    return () => clearTimeout(timeout);
  }, [dispatch, isShow, delay]);

  if (!isShow) return null;

  const tone = styleMap[snackBarType] || styleMap.info;

  return (
    <div className="fixed right-4 top-4 z-[10050] max-w-sm w-[calc(100vw-2rem)]">
      <div className={`rounded-xl border shadow-lg px-4 py-3 ${tone.wrap}`}>
        <div className="flex items-start gap-3">
          <i className={`${tone.icon} mt-0.5`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">{title || "Thông báo"}</p>
            <p className="text-sm leading-5 break-words">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
