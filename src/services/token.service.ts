import { LOCAL_STORAGE_TOKEN, LOCAL_STORAGE_USER_INFO, USER_ROLE } from "@/constants/auth.enum";
import { cacheService } from "./cache.service";

export const tokenService = {
    isAuthenticated,
    storeToken,
    clear,
    getToken,
    getCsrfToken,
};

function isAuthenticated(): boolean {
    return getToken() !== null;
}

function storeToken(token: string): void {
    cacheService.set(LOCAL_STORAGE_TOKEN, token);
}

function clear(): void {
    cacheService.remove(LOCAL_STORAGE_TOKEN);
    cacheService.remove(LOCAL_STORAGE_USER_INFO);
    cacheService.remove(USER_ROLE);
    clearCookies();
}

const clearCookies = (): void => {
    if (typeof document === "undefined") return;
    document.cookie.split(";").forEach((cookie) => {
        document.cookie = cookie
            .replace(/^ +/, "")
            .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
};

function getToken(): string | null {
    return cacheService.get(LOCAL_STORAGE_TOKEN);
}

function getCsrfToken(): string | null {
    if (typeof document === "undefined") return null;
    const name = "XSRF-TOKEN";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

export default tokenService;