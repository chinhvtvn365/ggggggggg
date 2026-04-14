import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { appStore } from "@/lib/store";
import { tokenService } from "../auth/token.service";
import { open, close } from "@/lib/features/loading/loadingSlice";
import { showError, showSuccess } from "@/lib/features/snackbar/snackBarSlice";

// --- INTERFACES ---
interface ErrorResponse {
  error?: {
    message?: string;
    details?: string | string[];
    code?: string;
    validationErrors?: Array<{
      message: string;
      members: string[];
    }>;
  };
}

interface RequestWithLoadingMeta extends InternalAxiosRequestConfig {
  _showLoading?: boolean;
}

const excludeUrl = [
  "/api/TokenAuth/Authenticate",
  "/api/TokenAuth/AuthenticateWithOtp",
  "/api/abp/antiforgery/token",
  "/api/app/menu-management",
  "/api/account/my-profile/change-password",
  "/api/account/my-profile/change-email",
  "/api/TokenAuth/VerifyCode",
  "/api/account/reset-password",
  "/api/account/reset-password-otp",
  "/api/account/send-password-reset-code",
  "/api/account/register",
  "/api/account/activate",
  "/api/account/send-activate-email",
  "/api/account/send-login-otp",
  "/api/app/data/token",
  "/api/app/app-logs/sms-log",
  "/api/app/page-view/track-page-view",
]
const excludedSuccessResult = [
  "/api/app/thong-tin-kiem-tra/send-emails",
  "/api/app/thong-bao-het-han-phieu-cbmp/send-emails",
  "/api/app/file-upload/CheckFile",
]
const ignoreLoadingUrls = [
  "/api/app/app-logs/sms-log",
  "/api/app/geo-commune",
];

const fileUploadUrls = [
  "/api/app/file-upload/UploadSingle",
  "/api/app/file-upload/UploadMulti",
  "/api/app/file-upload/UploadChunks",
  "/api/app/file-upload/UploadComplete",
];

// --- LOGIC CHÍNH ---

let isInterceptorSetup = false;

export const setupInterceptors = (): void => {
  // Chỉ setup 1 lần duy nhất
  if (isInterceptorSetup) {
    return;
  }
  
  isInterceptorSetup = true;
  
  let requestCounter = 0;
  let closeTimeout: ReturnType<typeof setTimeout> | null = null;

  const maybeCloseLoading = (): void => {
    if (closeTimeout) clearTimeout(closeTimeout);
    closeTimeout = setTimeout(() => {
      if (requestCounter === 0) {
        appStore.dispatch(close());
      }
    }, 300);
  };
  
  // --- REQUEST INTERCEPTOR ---
  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const requestConfig = config as RequestWithLoadingMeta;
      const isIgnored = ignoreLoadingUrls.some((path) => config.url?.includes(path));
      requestConfig._showLoading = !isIgnored;

      if (requestConfig._showLoading) {
        requestCounter++;
        appStore.dispatch(open());
      }

      // Gắn Token
      const token = tokenService.getToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (!token) {
      }

      // Gắn CSRF
      const csrfToken = tokenService.getCsrfToken();
      if (csrfToken && config.headers) {
        config.headers["X-CSRF-TOKEN"] = csrfToken;
      }

      return config;
    },
    (error: AxiosError): Promise<never> => {
      const requestConfig = error.config as RequestWithLoadingMeta | undefined;
      if (requestConfig?._showLoading) {
        if (requestCounter > 0) requestCounter--;
        maybeCloseLoading();
      }
      return Promise.reject(error);
    }
  );

  // --- RESPONSE INTERCEPTOR ---
  axios.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      const requestConfig = response.config as RequestWithLoadingMeta;
      if (requestConfig._showLoading) {
        if (requestCounter > 0) requestCounter--;
        if (requestCounter === 0) maybeCloseLoading();
      }

      const url = response.config.url || "";
      const baseUrl = process.env.NEXT_PUBLIC_BASEURL || "";
      const relativeUrl = url.replace(baseUrl, "");
      const urlWithoutParams = relativeUrl.split("?")[0];

      const isExactIgnored = excludeUrl.includes(relativeUrl) || fileUploadUrls.includes(urlWithoutParams);
      const isPartialIgnored = excludedSuccessResult.some((p) => relativeUrl.includes(p));

      // Hiển thị thông báo thành công cho PUT/POST/DELETE
      if (!isExactIgnored && !isPartialIgnored) {
        const method = response.config.method?.toLowerCase();
        if (method === "put") {
          appStore.dispatch(showSuccess({ message: "Cập nhật thành công" }));
        } else if (method === "post") {
          appStore.dispatch(showSuccess({ message: "Thêm mới thành công" }));
        } else if (method === "delete") {
          appStore.dispatch(showSuccess({ message: "Xóa thành công" }));
        }
      }

      return response;
    },
    (error: AxiosError<ErrorResponse>): Promise<never> => {
      const requestConfig = error.config as RequestWithLoadingMeta | undefined;
      if (requestConfig?._showLoading) {
        if (requestCounter > 0) requestCounter--;
        maybeCloseLoading();
      }

      if (!error.response) {
        appStore.dispatch(showError({ message: error.message || "Lỗi kết nối mạng" }));
        return Promise.reject(error);
      }

      const status = error.response.status;
      const errorData = error.response.data?.error;

      switch (status) {
        case 400: {
          let msg = "Yêu cầu không hợp lệ";
          if (errorData?.details) {
            if (typeof errorData.details === "string") {
              msg = errorData.details.replace(/\r?\n|\r/g, "");
            } else if (Array.isArray(errorData.details)) {
              msg = errorData.details.join(", ");
            }
          } else if (errorData?.message) {
            msg = errorData.message;
          }
          appStore.dispatch(showError({ message: msg, title: "Lỗi 400" }));
          break;
        }
        case 401:
          tokenService.clear();
          if (typeof window !== "undefined") {
            window.location.href = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
          }
          break;
        case 403:
          appStore.dispatch(showError({ message: "Bạn không có quyền thực hiện thao tác này" }));
          break;
        case 404:
          appStore.dispatch(showError({ message: "Không tìm thấy tài nguyên (404)" }));
          break;
        case 500:
          appStore.dispatch(showError({ message: "Lỗi hệ thống máy chủ (500)" }));
          break;
        default:
          appStore.dispatch(showError({ message: "Đã có lỗi xảy ra, vui lòng thử lại" }));
          break;
      }

      return Promise.reject(error);
    }
  );
};