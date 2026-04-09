import { proxyService } from '@/services/proxy/proxy.service';

import CryptoJS from "crypto-js";
import utilsService from "@/services/utils/utils.service";
import { AES_KEY } from "@/constants/auth.enum";

// Định nghĩa interface cho kết quả trả về
export interface AuthResult {
    accessToken: string;
    userId: string;
    roles: string[];
    [key: string]: unknown;
}

interface AuthResponse {
    result: AuthResult;
    status?: number;
    statusText?: string;
}

interface LoginParams {
    username?: string;
    password?: string;
    email?: string;
    [key: string]: unknown;
}

const authenticateService = {
    authenticate,
    postAuthenMail,
    postAuthenUsername,
    encrypt,
};

async function authenticate(username: string, password: string, newPassword?: string): Promise<AuthResult | string> {
    const iv = utilsService.generateIV();
    const result = await proxyService.post<AuthResponse>(
        "/api/TokenAuth/Authenticate",
        {
            username,
            password: encrypt(password, iv),
            newPassword: newPassword ? encrypt(newPassword, iv) : null,
        },
        { iv } // Custom header hoặc params tùy theo proxyService
    );

    if (result.status === 202) return result.statusText || "Accepted";
    return result.data.result;
}

async function postAuthenMail(params: LoginParams): Promise<AuthResult | string> {
    const result = await proxyService.post<AuthResponse>("/api/TokenAuth/LoginMS", params);
    if (result.status === 202) return result.statusText || "Accepted";
    return result.data.result;
}

async function postAuthenUsername(params: LoginParams): Promise<AuthResult | string> {
    const result = await proxyService.post<AuthResponse>("/api/TokenAuth/LoginUserName", params);
    if (result.status === 202) return result.statusText || "Accepted";
    return result.data.result;
}

function encrypt(password: string, iv: string): string {
    return CryptoJS.AES.encrypt(password, CryptoJS.enc.Utf8.parse(AES_KEY), {
        iv: CryptoJS.enc.Utf8.parse(iv),
    }).toString();
}

export default authenticateService;