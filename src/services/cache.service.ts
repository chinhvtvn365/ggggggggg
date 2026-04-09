export const cacheService = {
    get,
    set,
    remove
};

function get<T = unknown>(key: string): T | string | null {
    const stringValue = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!stringValue) return null;
    try {
        return JSON.parse(stringValue) as T;
    } catch {
        return stringValue;
    }
}

function set(key: string, value: string | number | boolean | object): void {
    if (typeof window === "undefined") return;
    
    let stringValue: string;

    switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
            stringValue = value.toString();
            break;
        case 'object':
            stringValue = JSON.stringify(value);
            break;
        default:
            return;
    }

    localStorage.setItem(key, stringValue);
}

function remove(key: string): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(key);
    }
}

export default cacheService;