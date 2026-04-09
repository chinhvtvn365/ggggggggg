import proxyService from "@/services/proxy/proxy.service";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";

// --- CONSTANTS & TYPES ---
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB per chunk

export interface FileSubmitData {
  isSubmitFile?: boolean;
  data: (File | Record<string, unknown>)[];
  folder: string;
}

interface FileInfo {
  name: string;
  order: number;
  loaiTapTin?: string;
  showingName?: string;
  isVanBan?: boolean;
  soVanBan?: string;
  kyHieu?: string;
  ngayBanHanh?: string | Date;
  fileField?: string;
  initOrder?: number;
}

/**
 * Xử lý tải lên toàn bộ tệp tin trong object data trước khi submit form
 */
const fileSubmitHandler = async (data: Record<string, unknown>, checkNestedObject = false): Promise<Record<string, unknown>> => {
  const fields = Object.entries(data);

  if (!checkNestedObject) {
    for (const [fieldName, fieldValue] of fields) {
      if (fieldValue?.isSubmitFile) {
        if (fieldValue.data?.length === 1) {
          const uploadFile = await uploadSingleFile(fieldValue.data[0], fieldValue.folder);
          data[fieldName] = uploadFile;
        } else {
          const uploadedFiles = await uploadMultiFiles(fieldValue.data, fieldValue.folder);
          data[fieldName] = uploadedFiles;
        }
      }
    }
  } else {
    const fileObjs: Record<string, { files: File[]; folder: string }> = {};
    
    for (const [fieldName, fieldValue] of fields) {
      if (fieldValue?.isSubmitFile) {
        fileObjs[fieldName] = { files: fieldValue.data, folder: fieldValue.folder };
      }
      
      if (Array.isArray(fieldValue)) {
        fieldValue.forEach((item, index) => {
          if (typeof item === "object") {
            Object.entries(item as Record<string, unknown>).forEach(([nestedKey, nestedValue]) => {
              const submitValue = nestedValue as { isSubmitFile?: boolean; data?: File[]; folder?: string };
              if (submitValue?.isSubmitFile) {
                fileObjs[`${fieldName}[${index}].${nestedKey}`] = { 
                  files: submitValue.data || [], 
                  folder: submitValue.folder || "" 
                };
              }
            });
          }
        });
      }
    }

    for (const [fieldName, fieldValue] of Object.entries(fileObjs)) {
      if (fieldValue.files?.length === 1) {
        data[fieldName] = await uploadSingleFile(fieldValue.files[0], fieldValue.folder);
      } else {
        data[fieldName] = await uploadMultiFiles(fieldValue.files, fieldValue.folder);
      }
    }
  }

  return data;
};

export default fileSubmitHandler;

/**
 * Tải lên nhiều tệp tin, tự động phân loại tệp lớn/nhỏ
 */
export const uploadMultiFiles = async (dsFiles: (File | Record<string, unknown>)[], folder = "tong-hop"): Promise<Record<string, unknown>[]> => {
  if (!Array.isArray(dsFiles)) return dsFiles;

  const { nonFiles, files } = dsFiles.reduce(
    (result, item) => {
      const fileObj = item instanceof File ? item : item?.inMemoryFile;
      if (fileObj instanceof File) {
        result.files.push(fileObj);
      } else if (item) {
        result.nonFiles.push(item);
      }
      return result;
    },
    { files: [] as File[], nonFiles: [] as Record<string, unknown>[] }
  );

  let output = [...nonFiles];
  const formUpload = new FormData();
  let smallFilesCount = 0;
  const largeFiles: File[] = [];

  files.forEach((file: File) => {
    if (file.size <= MAX_FILE_SIZE) {
      formUpload.append(`files`, file);
      smallFilesCount++;
    } else {
      largeFiles.push(file);
    }
  });

  if (smallFilesCount > 0) {
    const res = await proxyService.post<Record<string, unknown>[]>(`/api/app/file-upload/UploadMulti?folder=${folder}`, formUpload);
    if (res.data) output = [...output, ...res.data];
  }

  for (const file of largeFiles) {
    const res = await uploadLargeFile(file, folder);
    if (res.status === 200 && res.data?.isSuccess) {
      output.push(res.data.data);
    }
  }

  return output;
};

/**
 * Tải lên tệp đơn lẻ
 */
export const uploadSingleFile = async (file: File | Record<string, unknown>, folder = "tong-hop"): Promise<Record<string, unknown>> => {
  const fileObj = file instanceof File ? file : file?.inMemoryFile;
  if (!(fileObj instanceof File)) return file;

  if (fileObj.size <= MAX_FILE_SIZE) {
    const form = new FormData();
    form.append("file", fileObj);
    const res = await proxyService.post<Record<string, unknown>>(`/api/app/file-upload/UploadSingle?folder=${folder}`, form);
    return res?.data || file;
  } else {
    const res = await uploadLargeFile(fileObj, folder);
    return res?.data?.data || file;
  }
};

/**
 * Xử lý tải tệp tin dung lượng lớn bằng cách chia nhỏ (Chunks)
 */
const uploadLargeFile = async (file: File, folder = "tong-hop") => {
  const fileID = uuidv4();
  const totalChunks = Math.ceil(file.size / MAX_FILE_SIZE);

  await proxyService.post("/api/app/file-upload/CheckFile", {}, null, { totalBytes: file.size });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * MAX_FILE_SIZE;
    const end = Math.min(start + MAX_FILE_SIZE, file.size);
    const chunk = file.slice(start, end);

    await proxyService.post("/api/app/file-upload/UploadChunks", chunk, 
      { "Content-Type": "application/json" }, 
      {
        id: i.toString(),
        totalBytes: file.size,
        fileName: `${fileID}-${file.name}`,
      }
    );
  }

  return await proxyService.post("/api/app/file-upload/UploadComplete", {
    FileName: `${fileID}-${file.name}`,
    Name: file.name,
    Id: fileID,
    ChucNang: folder,
  });
};

/**
 * Gắn thông tin tệp tin vào FormData chuẩn Backend ABP
 */
export const appendFileInfoToFormData = (
  formData: FormData,
  fileInfos: FileInfo[],
  fileInfosField: string,
  danhSachTapTinId: unknown,
  danhSachTapTinIdField: string,
  formatDate: ((date: Date | string) => string) | null = null
) => {
  if (Array.isArray(fileInfos)) {
    fileInfos.forEach((info, index) => {
      let fileId = null;
      if (Array.isArray(danhSachTapTinId)) {
        fileId = danhSachTapTinId.find((x) => x.name === info.name)?.id;
      } else {
        fileId = danhSachTapTinId?.id ?? danhSachTapTinId;
      }

      formData.append(`${fileInfosField}[${index}].fileId`, fileId || "");
      formData.append(`${fileInfosField}[${index}].order`, (info.order ?? index).toString());
      formData.append(`${fileInfosField}[${index}].loaiTapTin`, info.loaiTapTin || "");
      formData.append(`${fileInfosField}[${index}].showingName`, info.showingName || "");

      if (info.isVanBan) {
        formData.append(`${fileInfosField}[${index}].isVanBan`, "true");
        formData.append(`${fileInfosField}[${index}].soVanBan`, info.soVanBan || "");
        formData.append(`${fileInfosField}[${index}].kyHieu`, info.kyHieu || "");
        const formattedDate = formatDate ? formatDate(info.ngayBanHanh) : moment(info.ngayBanHanh).toISOString();
        formData.append(`${fileInfosField}[${index}].ngayBanHanh`, formattedDate || "");
      } else {
        formData.append(`${fileInfosField}[${index}].isVanBan`, "false");
      }
    });
  }

  if (danhSachTapTinId !== true && danhSachTapTinId) {
    if (Array.isArray(danhSachTapTinId)) {
      danhSachTapTinId.forEach((f, i) => formData.append(`${danhSachTapTinIdField}[${i}]`, f?.id ?? f));
    } else {
      formData.append(danhSachTapTinIdField, danhSachTapTinId?.id ?? danhSachTapTinId);
    }
  }
};