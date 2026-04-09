/**
 * Định nghĩa kiểu dữ liệu cho thông tin Session
 */
export interface AuthSessionData {
    accessToken: string;
    refreshToken: string;
    idToken: string;
}

/**
 * Khởi tạo session xác thực
 * @param data Đối tượng chứa các loại token
 */
export const initAuthenticatedSession = (data: AuthSessionData): void => {
    if (typeof window !== "undefined") {
        sessionStorage.setItem("ACCESS_TOKEN", data.accessToken);
        sessionStorage.setItem("REFRESH_TOKEN", data.refreshToken);
        sessionStorage.setItem("ID_TOKEN", data.idToken);
    }
};

/**
 * Lấy tham số từ session storage
 * @param key Khóa cần lấy (ACCESS_TOKEN, REFRESH_TOKEN, hoặc ID_TOKEN)
 * @returns Giá trị chuỗi hoặc null nếu không tồn tại
 */
export const getSessionParameter = (key: string): string | null => {
    if (typeof window !== "undefined") {
        return sessionStorage.getItem(key);
    }
    return null;
};

/**
 * Reset session xác thực (Xóa toàn bộ token)
 */
export const resetAuthenticatedSession = (): void => {
    if (typeof window !== "undefined") {
        sessionStorage.removeItem("ACCESS_TOKEN");
        sessionStorage.removeItem("REFRESH_TOKEN");
        sessionStorage.removeItem("ID_TOKEN");
    }
};