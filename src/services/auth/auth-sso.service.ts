import { getSessionParameter, resetAuthenticatedSession } from "./session.service";

export const sendAuthorizationRequest = (): void => {
    const authorizeRequest = `${process.env.NEXT_PUBLIC_AUTHORIZE_ENDPOINT}?response_type=${process.env.NEXT_PUBLIC_RESPONSE_TYPE}&scope=${process.env.NEXT_PUBLIC_SCOPE}&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}&client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}`;
    
    if (typeof window !== "undefined") {
        window.location.href = authorizeRequest;
    }
};

export const dispatchLogout = (): void => {
    const token = getSessionParameter("ID_TOKEN");
    if (!token) return;

    // Xóa session
    resetAuthenticatedSession();

    if (typeof window !== "undefined") {
        window.location.href = `${process.env.NEXT_PUBLIC_LOGOUT_URL}?id_token_hint=${token}&post_logout_redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}`;
    }
};