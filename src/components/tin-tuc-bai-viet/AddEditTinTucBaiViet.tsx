"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { REQUIRED } from "@/constants/datatable.enum";
import { proxyService } from "@/services";

import Textbox from "@/components/controls/Textbox";
import DropdownControl from "@/components/controls/DropdownControl";
import CalendarControl from "@/components/controls/CalendarControl";
import SunEditorField from "../controls/SunEditorField";

// Utilities
const removeVietnameseTones = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

interface TinTucDetail {
  mucDoUuTien?: number;
  hinhAnh?: unknown;
  HinhAnh?: unknown;
  [key: string]: unknown;
}

const AddEditTinTucBaiViet = ({ data, dataSource }: any) => {
  const methods = useFormContext();
  const { control, setValue, getValues } = methods;

  const isThongBao = dataSource?.MaLoaiTinTuc === "thong-bao";
  const [randomValue] = useState(() => Math.floor(Math.random() * 10000));
  const inputFile = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<string | null>(null);
  const isClient = typeof window !== "undefined";
  const loaiTinTucOptions = useMemo(
    () => dataSource?.LoaiTinTuc || dataSource?.dsLoaiBanTin || [],
    [dataSource],
  );
  const initialChuDeOptions = useMemo(
    () => dataSource?.ChuDe || dataSource?.dsChuDe || [],
    [dataSource],
  );

  const resolveImagePreview = useCallback((source: unknown): string | null => {
    const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL || "";

    const resolveCandidate = (candidate: unknown): string | null => {
      if (!candidate) return null;

      if (Array.isArray(candidate) && candidate.length > 0) {
        return resolveCandidate(candidate[0]);
      }

      if (typeof candidate === "string") {
        return candidate.startsWith("http") || candidate.startsWith("data:")
          ? candidate
          : ASSETS_URL + candidate;
      }

      if (candidate && typeof candidate === "object") {
        const obj = candidate as Record<string, unknown>;
        const path =
          obj.dataUrl ||
          obj.path ||
          obj.url ||
          obj.fileUrl ||
          obj.fullPath ||
          obj.link;

        if (typeof path === "string") {
          if (path.startsWith("data:") || path.startsWith("http")) {
            return path;
          }
          return ASSETS_URL + path;
        }
      }

      return null;
    };

    if (!source || typeof source !== "object") return resolveCandidate(source);

    const sourceObj = source as Record<string, unknown>;
    return resolveCandidate(sourceObj.hinhAnh ?? sourceObj.HinhAnh ?? source);
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!data?.id) return;
    try {
      const res = await proxyService.get<TinTucDetail>(`/api/app/tin-tuc-bai-viet/${data.id}`);
      if (res?.status === 200 && res.data) {
        Object.entries(res.data).forEach(([key, val]) => setValue(key as any, val));
        setValue("UuTien", res.data?.mucDoUuTien === 1);
        const previewSource = res.data?.hinhAnh ?? res.data?.HinhAnh ?? data?.hinhAnh ?? data?.HinhAnh;
        setImagePreviews(resolveImagePreview(previewSource));
      }
    } catch (err) {
      console.error(err);
    }
  }, [data, setValue, resolveImagePreview]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (data?.id) fetchDetail();
  }, [data?.id, fetchDetail]);

  useEffect(() => {
    if (loaiTinTucOptions.length === 1 && !getValues("loaiTinTuc")) {
      setValue("loaiTinTuc", loaiTinTucOptions[0]?.value);
    }
    if (initialChuDeOptions.length > 0 && !getValues("newsTopic")) {
      setValue("newsTopic", initialChuDeOptions[0]?.value);
    }
  }, [loaiTinTucOptions, initialChuDeOptions, setValue, getValues]);

  return (
    <div className="p-2 space-y-6">
      {/* KHỐI 1: THÔNG TIN CHUNG */}
      <div>
        <h5 className="text-lg font-semibold text-blue-700 pb-2">Thông tin chung</h5>
        <div className="grid grid-cols-12 gap-x-5">
          {loaiTinTucOptions.length > 1 && (
            <div className="col-span-12 md:col-span-6">
              <DropdownControl
                label="Loại tin tức"
                name="loaiTinTuc"
                options={loaiTinTucOptions}
                placeholder="Chọn loại tin tức"
                layout="horizontal"
                labelWidth="col-span-4"
              />
            </div>
          )}

          <div className="col-span-12 md:col-span-12">
            <Textbox
              label="Tiêu đề bài viết"
              name="tieuDe"
              rules={{
                required: "Vui lòng nhập tiêu đề bài viết",
                validate: (value) => 
                  value?.trim().length >= 10 || "Tiêu đề phải có ít nhất 10 ký tự"
              }}
              layout="horizontal"
              labelWidth="col-span-2"
              inputWidth="col-span-10"
              change={(e: any) => {
                const value = e.target.value;
                const slug = `${removeVietnameseTones(value.toLowerCase())}-${randomValue}`
                  .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
                
                if (!data?.id) {
                  setValue("tuKhoaSEO", value);
                  setValue("tieuDeSEO", value);
                  setValue("moTaTuKhoa", value);
                  if (!getValues("duongDanThanThien")) {
                    setValue("duongDanThanThien", slug);
                  }
                }
              }}
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Đường dẫn"
              name="duongDanThanThien"
              rules={REQUIRED}
              layout="horizontal"
              labelWidth="col-span-4"
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <CalendarControl
              label="Ngày xuất bản"
              name="ngayXuatBan"
              rules={REQUIRED}
              layout="horizontal"
              labelWidth="col-span-4"
            />
          </div>

          {isThongBao && (
            <div className="col-span-12 md:col-span-6">
              <DropdownControl
                label="Chủ đề"
                name="newsTopic"
                options={initialChuDeOptions}
                rules={REQUIRED}
                placeholder="Chọn chủ đề"
                layout="horizontal"
                labelWidth="col-span-4"
              />
            </div>
          )}
          
          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Nguồn tin"
              name="nguonTin"
              placeholder="Nhập đường link (nếu có)"
              layout="horizontal"
              labelWidth="col-span-4"
            />
          </div>

          <div className="col-span-12 md:col-span-8">
            <Textbox
              label="Nội dung tóm tắt"
              name="noiDungTomTat"
              rules={REQUIRED}
              textAreaRow={5}
              layout="horizontal"
              labelWidth="col-span-3"
              inputWidth="col-span-9"
            />
          </div>

          {/* UPLOAD ẢNH KHỐI LÊN BÊN PHẢI */}
          <div className="col-span-12 md:col-span-4 pl-4 border-l border-gray-200">
            <Controller
              name="hinhAnh"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col items-center">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện</label>
                  <div
                    className="relative group cursor-pointer border-2 border-dashed border-gray-300 w-full rounded-lg overflow-hidden flex items-center justify-center hover:border-blue-500 transition-colors bg-gray-50 h-[140px]"
                    onClick={() => inputFile.current?.click()}
                  >
                    {imagePreviews ? (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imagePreviews} 
                          alt="Thumbnail Preview" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                           <i className="fa-solid fa-camera text-white text-2xl mb-1"></i>
                           <span className="text-white text-xs font-medium">Thay đổi ảnh</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <i className="fa-regular fa-image text-3xl mb-2"></i>
                        <span className="text-xs font-medium">Click để chọn ảnh</span>
                      </div>
                    )}
                  </div>
                  <small className="text-gray-500 text-[11px] mt-2 text-center">JPG, PNG, GIF (Tối đa 5MB)</small>
                  
                  <input
                    ref={inputFile}
                    type="file"
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert("File quá lớn. Vui lòng chọn ảnh < 5MB.");
                          return;
                        }
                        setImagePreviews(URL.createObjectURL(file));
                        field.onChange(file);
                      }
                    }}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>

        <div className="col-span-12 overflow-hidden">
          <SunEditorField
            label={<span>Nội dung</span>}
            name="noiDung"
            configs={{
              direction: "horizontal",
              height: "300px",
              layout: "2|10",
            }}
            labelWidth="col-span-2"
            inputWidth="col-span-10"
            defaultValue=""
            rules={{
              required: "Nội dung bài viết là bắt buộc",
              validate: (value: string) => {
                if (!value || value.trim() === "") {
                  return "Vui lòng nhập nội dung bài viết"
                }
                // Loại bỏ HTML tags và kiểm tra có text thực sự không
                const textContent = value.replace(/<[^>]*>/g, "").trim()
                if (textContent.length === 0) {
                  return "Nội dung bài viết không được để trống"
                }
                if (textContent.length < 50) {
                  return "Nội dung bài viết phải có ít nhất 50 ký tự"
                }
                return true
              },
            }}
            className=""
            editorLoaded={isClient}
            change={() => {}}
          />
        </div>

    </div>
  );
};

export default AddEditTinTucBaiViet;
