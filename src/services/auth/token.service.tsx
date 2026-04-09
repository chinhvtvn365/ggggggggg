import { 
  LOCAL_STORAGE_TOKEN, 
  LOCAL_STORAGE_USER_INFO, 
  USER_ROLE 
} from "@/constants/auth.enum";
import { cacheService } from "../cache.service";

/**
 * Interface định nghĩa các phương thức của tokenService
 */
export interface ITokenService {
  isAuthenticated: () => boolean;
  storeToken: (token: string) => void;
  clear: () => void;
  getToken: () => string | null;
  getCsrfToken: () => string | null;
}

export const tokenService: ITokenService = {
  isAuthenticated,
  storeToken,
  clear,
  getToken,
  getCsrfToken,
};

/**
 * Kiểm tra người dùng đã đăng nhập hay chưa
 */
function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Lưu trữ Access Token vào bộ nhớ cache (localStorage)
 */
function storeToken(token: string): void {
  cacheService.set(LOCAL_STORAGE_TOKEN, token);
}

/**
 * Xóa sạch thông tin xác thực (Token, User Info, Roles và Cookies)
 */
function clear(): void {
  cacheService.remove(LOCAL_STORAGE_TOKEN);
  cacheService.remove(LOCAL_STORAGE_USER_INFO);
  cacheService.remove(USER_ROLE);
  clearCookies();
}

/**
 * Xóa toàn bộ cookies của trình duyệt liên quan đến domain hiện tại
 */
const clearCookies = (): void => {
  if (typeof document === "undefined") return;

  document.cookie.split(";").forEach((cookie) => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });
};

/**
 * Lấy Access Token hiện tại
 */
function getToken(): string | null {
  return cacheService.get(LOCAL_STORAGE_TOKEN);
}

/**
 * Lấy CSRF Token từ Cookie phục vụ cho bảo mật API
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const name = "XSRF-TOKEN";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

export default tokenService;