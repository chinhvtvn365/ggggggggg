"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { SocketHelper } from "@/services/socket/socketio.service"; // Đổi đường dẫn service TS
import { setData } from "@/lib/features/socket/socketSlice";

const LoadSocketIO = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Chỉ chạy ở phía Client
    if (typeof window !== "undefined") {
      SocketHelper.connect(() => {
        SocketHelper.listenEvent((response: any) => {
          // Khi nhận được sự kiện, đẩy vào Redux để DataTable cập nhật
          dispatch(setData(response));
        });
      });
    }

    return () => {
      SocketHelper.disconnect();
    };
  }, [dispatch]);

  // Trả về null vì component này chỉ xử lý logic ngầm
  return null;
};

export default LoadSocketIO;