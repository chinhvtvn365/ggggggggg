import axios, { AxiosRequestConfig, AxiosResponse, ResponseType } from "axios";

export const proxyService = {
    get,
    post,
    put,
    getJSON,
    deleteAPI,
    multipleDeleteAPI,
};

async function getJSON<T = unknown>(
    url: string, 
    params: Record<string, unknown> | null = null, 
    headers: Record<string, string> | null = null, 
    responseType: ResponseType | null = null
): Promise<AxiosResponse<T>> {
    const options = buildOptions(headers, params);
    if (responseType) options.responseType = responseType;
    return axios.get<T>(url, options);
}

async function get<T = unknown>(
    url: string, 
    params: Record<string, unknown> | null = null, 
    headers: Record<string, string> | null = null, 
    responseType: ResponseType | null = null
): Promise<AxiosResponse<T>> {
    const options = buildOptions(headers, params);
    if (responseType) options.responseType = responseType;
    return await axios.get<T>(process.env.NEXT_PUBLIC_BASEURL + url, options);
}

async function post<T = unknown>(
    url: string, 
    data: unknown, 
    headers: Record<string, string> | null = null, 
    params: Record<string, unknown> | null = null, 
    responseType: ResponseType | null = null
): Promise<AxiosResponse<T>> {
    const options = buildOptions(headers, params, data);
    if (responseType) options.responseType = responseType;
    return axios.post<T>(process.env.NEXT_PUBLIC_BASEURL + url, data, options);
}

async function put<T = unknown>(
    url: string, 
    data: unknown, 
    headers: Record<string, string> | null = null, 
    params: Record<string, unknown> | null = null
): Promise<AxiosResponse<T>> {
    const options = buildOptions(headers, params, data);
    return axios.put<T>(process.env.NEXT_PUBLIC_BASEURL + url, data, options);
}

async function deleteAPI<T = unknown>(
    url: string, 
    headers: Record<string, string> | null = null, 
    params: Record<string, unknown> | null = null
): Promise<AxiosResponse<T>> {
    const options = buildOptions(headers, params);
    return axios.delete<T>(process.env.NEXT_PUBLIC_BASEURL + url, options);
}

async function multipleDeleteAPI<T = unknown>(
    url: string, 
    data: (string | number)[], 
    params: string, 
    headers: Record<string, string> | null = null
): Promise<AxiosResponse<T>> {
    const options = buildOptions(headers, null);
    let fullUrl = url;
    for (let i = 0; i < data.length; i++) {
        fullUrl += (i === 0 ? `?` : `&`) + `${params}=${data[i]}`;
    }
    return axios.delete<T>(process.env.NEXT_PUBLIC_BASEURL + fullUrl, options);
}

function buildOptions(
    headers: Record<string, string> | null, 
    params: Record<string, unknown> | null, 
    data?: unknown
): AxiosRequestConfig {
    const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json; charset=utf8",
        platform: "web",
    };

    const isFormData = data instanceof FormData;
    const finalHeaders = headers ? { ...defaultHeaders, ...headers } : defaultHeaders;

    if (isFormData) {
        delete finalHeaders["Content-Type"];
    }

    const options: AxiosRequestConfig = {
        headers: finalHeaders,
    };
    
    if (params) {
        options.params = params;
    }

    return options;
}

export default proxyService;