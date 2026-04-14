import { proxyService } from '@/services/proxy/proxy.service';
import CryptoJS from "crypto-js";
import moment from "moment";
import { AES_IV, AES_KEY, LOCAL_STORAGE_USER_INFO } from "@/constants/auth.enum";
import { cacheService } from "../cache.service";

// --- INTERFACES ---
interface PaginationParams {
  page?: number;
  prePage?: string;
  nextPage?: string;
  firstPage?: string;
  lastPage?: string;
  className?: string;
  noDataText?: string;
}

interface DanhMucItem {
  id: string;
  ma: string;
  ten: string;
  tenVietTat: string;
  [key: string]: unknown;
}

interface DanhMucMapping {
  maChucNang: string;
  setState: (data: DanhMucItem[]) => void;
  type?: string | null;
  type2?: string | null;
  preferFullLabel?: boolean;
}
const paginationOptions = (params: PaginationParams) => ({
  page: params.page || 1,
  prePage: params.prePage || "<",
  nextPage: params.nextPage || ">",
  firstPage: params.firstPage || "Trang đầu",
  lastPage: params.lastPage || "Trang cuối",
  className: params.className || "pagination-table",
  noDataText: params.noDataText || "Không tìm thấy dữ liệu",
});
const buildFormData = (data: Record<string, unknown>, excludedFields?: string[], arrayFields: string[] = []): FormData => {
  let defaultExcludedFields = [
    "id", "creationTime", "creatorId", "lastModificationTime", 
    "lastModifierId", "isDeleted", "deleterId", "deletionTime",
  ];
  if (excludedFields && Array.isArray(excludedFields)) {
    defaultExcludedFields = [...defaultExcludedFields, ...excludedFields];
  }
  const formData = new FormData();

  if (arrayFields && Array.isArray(arrayFields)) {
    arrayFields.forEach((field) => {
      const dataArray = data?.[field];
      if (dataArray && Array.isArray(dataArray)) {
        dataArray.forEach((item: Record<string, unknown>, index: number) => {
          if (item instanceof Object) {
            Object.entries(item).forEach(([key, value]) => {
              const stringValue = value?.toString() ?? "";
              formData.append(`${field}[${index}].${key}`, stringValue);
            });
          }
        });
      }
    });
  }

  Object.entries(data).forEach(([key, value]) => {
    if (defaultExcludedFields.includes(key)) return;
    if (value instanceof Date) {
      formData.append(key, moment(value).format("YYYY-MM-DD"));
      return;
    }
    if (typeof value === "boolean") {
      formData.append(key, value.toString());
      return;
    }
    if (value === null || value === undefined || value instanceof Object) return;
    formData.append(key, String(value));
  });

  if (!data?.["isActive"]) formData.append("isActive", "true");
  return formData;
};

const normalizeString = (str: string | null | undefined): string => {
  if (!str) return "";
  return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
};

const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const yyyymmddFormatTimeString = (str: string | Date | null | undefined): string => {
  if (!str) return "";
  const date = new Date(str);
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();
  return [dd > 9 ? dd : `0${dd}`, mm > 9 ? mm : `0${mm}`, yyyy].join("/");
};

const formattedDateValue = (str: string | Date | null | undefined): string => {
  if (!str) return "";
  return moment(str).format("YYYY-MM-DD");
};

const numberWithCommas = (x: number | string): string => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const numberWithDots = (x: number | string): string => {
  return x.toString().replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const generateIV = (): string =>
  (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)).substring(0, 16);

const base64ToArray = (base64String: string): string => {
  if (typeof window === "undefined") return "";
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  return window.atob(base64);
};

const encryptAES = (text: string, iv: string): string => {
  return CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(AES_KEY), {
    iv: CryptoJS.enc.Utf8.parse(iv),
  }).toString();
};

const decryptAES = (encryptedBase64: string): unknown => {
  if (!encryptedBase64) return null;
  const decrypted = CryptoJS.AES.decrypt(encryptedBase64, CryptoJS.enc.Utf8.parse(AES_KEY), {
    iv: CryptoJS.enc.Utf8.parse(AES_IV),
  });
  try {
    const str = decrypted.toString(CryptoJS.enc.Utf8);
    return str.length > 0 ? JSON.parse(str) : -1;
  } catch (e) {
    return e;
  }
};

const setUserInfo = (tokenJson: Record<string, unknown>): void => {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);
  cacheService.set(
    LOCAL_STORAGE_USER_INFO,
    encryptAES(JSON.stringify({ ...tokenJson, expiryDate: expiryDate.getTime() }), AES_IV)
  );
};

const fetchDanhMuc = async (danhMucMapping: DanhMucMapping[]): Promise<Record<string, unknown>> => {
  try {
    const danhSachMaChucNang = danhMucMapping.map((item) => item.maChucNang);
    if (danhSachMaChucNang.length === 0) return {} as Record<string, unknown>;
    const queryString = danhSachMaChucNang.map((ma) => `DanhSachMaChucNang=${ma}`).join("&");
    const res = await proxyService.get<Record<string, DanhMucItem[]>>(`/api/app/danh-muc/danh-sach-ma?${queryString}`);
    if (res && res.status === 200 && res.data) {
      danhMucMapping.forEach((map) => {
        const dataArray = res.data[map.maChucNang];
        if (Array.isArray(dataArray)) {
          const formatData = dataArray.map((x: DanhMucItem) => ({
            ...x,
            label: map.preferFullLabel ? (x?.ten || x?.tenVietTat) : (x?.tenVietTat !== "null" ? x.tenVietTat : x.ten),
            value: map.type === null ? x.id : x.ma,
          }));
          map.setState(formatData);
        }
      });
      return res.data as Record<string, unknown>;
    }
  } catch (error) {
    console.error("Error fetching DanhMuc:", error);
  }
  return {} as Record<string, unknown>;
};

const getVerificationStatusInBlockchain = async (id: string | number | null = null, api: string) => {
  return await proxyService.get(`${api}/${id}`);
};

const convertToRoman = (num: number): string => {
  const romanNumerals = [
    ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
    ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"],
    ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"],
    ["", "M", "MM", "MMM"],
  ];
  if (num <= 0 || num > 3999) return "Range 1-3999";
  const numArray = num.toString().split("").reverse();
  let roman = "";
  for (let i = 0; i < numArray.length; i++) {
    roman = romanNumerals[i][parseInt(numArray[i])] + roman;
  }
  return roman;
};

const roundUpToThousands = (num: number): number => Math.ceil(num / 1000) * 1000;

const formatVietnamPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("84")) cleaned = "0" + cleaned.slice(2);
  if (cleaned.length === 10) return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  if (cleaned.length === 11) return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
  return phone;
};

const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length >= 3 ? "*".repeat(cleanPhone.length - 3) + cleanPhone.slice(-3) : phone;
};

const convertTotalSecondsToTimeString = (duration: number): string => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  return [hours, minutes, seconds].map(v => String(v).padStart(2, "0")).join(":");
};

const debounce = <T extends (...args: unknown[]) => unknown>(func: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
};

const onDownloadFileSecured = async (path: string, handleException?: (err: unknown) => void, downloadXml = false) => {
  try {
    const res = await proxyService.post<{ url?: string }>(`/api/app/data/token`, { filePath: path });
    if (res.data.url) {
      if (downloadXml) {
        const fileResponse = await fetch(res.data.url);
        const blob = await fileResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = path.split(/[/\\]/).pop() || "file.xml";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        window.open(res.data.url, "_blank");
      }
    }
  } catch (err) {
    if (handleException) handleException(err);
  }
};

const buildExpectedRange = (rangeKey: string, yearNum: number): [Date | null, Date | null] => {
  const now = new Date();
  const m = now.getMonth();
  switch (rangeKey) {
    case "nam": return [new Date(yearNum, 0, 1), new Date(yearNum, 11, 31)];
    case "thang": return [new Date(yearNum, m, 1), new Date(yearNum, m + 1, 0)];
    case "quy": return [new Date(yearNum, Math.floor(m / 3) * 3, 1), new Date(yearNum, (Math.floor(m / 3) * 3) + 3, 0)];
    default: return [null, null];
  }
};

const utilsService = {
  paginationOptions,
  buildFormData,
  normalizeString,
  removeAccents,
  generateIV,
  base64ToArray,
  encryptAES,
  decryptAES,
  setUserInfo,
  fetchDanhMuc,
  yyyymmddFormatTimeString,
  formattedDateValue,
  numberWithCommas,
  numberWithDots,
  getVerificationStatusInBlockchain,
  convertToRoman,
  roundUpToThousands,
  formatVietnamPhoneNumber,
  formatPhone,
  convertTotalSecondsToTimeString,
  debounce,
  formatFileSize,
  onDownloadFileSecured,
  buildExpectedRange,
};

export default utilsService;