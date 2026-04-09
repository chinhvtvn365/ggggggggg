"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@heroui/react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import { DATATABLE_MODAL_UPDATE_MODE } from "@/constants/datatable.enum";
import { proxyService } from "@/services";
import { updateAdditionalTotalRows } from "@/lib/features/datatable/datatableSlice";
import fileSubmitHandler from "./FileSubmitHandler";

// --- INTERFACES ---
interface UpdateModalProps {
  dataSource?: any;
  data: any;
  defaultValues?: any;
  component: React.ComponentType<any>;
  whenClose: (data: any) => void;
  api: string;
  headers?: any;
  uiConfigs?: {
    headerText?: string;
    modalWidth?: string;
  };
  transform2BE?: (data: any) => Promise<any> | any;
  handleResponseData?: (data: any) => any;
  className?: string;
  style?: React.CSSProperties;
  toggle: () => void;
  isOpen: boolean; // đổi từ modal sang isOpen theo HeroUI
  metadata: any;
  isSubmitFile?: boolean;
  disableFields?: string[];
  customFooter?: React.ReactNode | ((props: { formData: any; onClose: () => void }) => React.ReactNode);
}

const UpdateModal: React.FC<UpdateModalProps> = (props) => {
  const {
    dataSource,
    data,
    defaultValues,
    component,
    whenClose,
    api,
    headers,
    uiConfigs,
    transform2BE,
    handleResponseData,
    className,
    toggle,
    isOpen,
    metadata,
    isSubmitFile = false,
    disableFields = [],
    customFooter = null,
  } = props;

  // --- REDUX ---
  const dispatch = useAppDispatch();
  const datatableReducer = useAppSelector((state) => state.datatableReducer);

  // --- FORM STATE ---
  const [formConfigs, setFormConfigs] = useState({});

  // Build defaultValues from data to ensure all inputs start as controlled (not undefined)
  const getDefaultValues = (rawData: any) => {
    if (!rawData) return {};
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawData)) {
      sanitized[key] = value === undefined || value === null ? "" : value;
    }
    return sanitized;
  };

  const methods = useForm({ defaultValues: getDefaultValues(data) });
  const { handleSubmit, reset, watch, control } = methods;

  const customList = metadata?.crudButtons?.update?.customList;
  const customCallback = metadata?.crudButtons?.update?.customCallback;

  // Cấu hình methods mở rộng cho component con
  const extendedMethods = {
    ...methods,
    formConfigs,
    setFormConfigs,
    modalMode: { mode: DATATABLE_MODAL_UPDATE_MODE, update: true },
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (data) {
      const temp = { ...data };
      if (temp.danhSachTapTin) {
        temp.fileInfos = temp.danhSachTapTin;
      }
      // Always sanitize undefined/null → "" to keep all inputs controlled
      const sanitizedData = getDefaultValues(temp);
      reset(sanitizedData);
    }
  }, [data, reset]);

  // --- LOGIC XỬ LÝ SỐ LIỆU TỔNG HỢP ---
  const handleUpdateAdditionalTotalRows = (updatedData: any) => {
    const classificationMap: Record<string, string> = {
      tichcuc: 'tichCuc',
      tieucuc: 'tieuCuc',
      trunglap: 'trungLap'
    };

    const previousClassification = data?.phanLoai;
    const newClassification = updatedData?.phanLoai;

    if (previousClassification === newClassification) return;

    const updatedAdditionalTotalRows = { ...datatableReducer.additionalTotalRows };

    if (previousClassification && classificationMap[previousClassification]) {
      const key = classificationMap[previousClassification];
      if (updatedAdditionalTotalRows[key] > 0) {
        updatedAdditionalTotalRows[key] -= 1;
      }
    }

    if (classificationMap[newClassification]) {
      const key = classificationMap[newClassification];
      updatedAdditionalTotalRows[key] = (updatedAdditionalTotalRows[key] || 0) + 1;
    }

    dispatch(updateAdditionalTotalRows(updatedAdditionalTotalRows));
  };

  // --- ACTIONS ---
  const onSubmit = async (formData: any) => {
    let finalData = { ...formData };

    if (isSubmitFile) {
      try {
        finalData = await fileSubmitHandler(finalData, true);
      } catch (ex) {
        console.error("File upload error:", ex);
        return;
      }
    }

    const payload = typeof transform2BE === "function" ? await transform2BE(finalData) : finalData;
    if (!payload) return;

    try {
      const result = await proxyService.put(`${api}/${finalData.id}`, payload, headers);
      if (result.data) {
        toggle();
        const serverData = result.data as any;
        const resData: any = typeof handleResponseData === "function" ? handleResponseData(serverData) : finalData;
        
        if (finalData.hasOwnProperty("concurrencyStamp") && (serverData as any).concurrencyStamp) {
          (resData as any).concurrencyStamp = (serverData as any).concurrencyStamp;
        }

        if (resData?.phanLoai) handleUpdateAdditionalTotalRows(resData);
        
        whenClose(resData);
        reset();
      }
    } catch (err: any) {
      console.error("Update API Error:", err);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={toggle}
    >
      <Modal.Backdrop className="bg-black/80 modal-backdrop">
        <Modal.Container className="items-center justify-start pt-16 modal-container" placement="top">
          <Modal.Dialog className={`bg-white rounded-xl ${uiConfigs?.modalWidth || 'max-w-3xl'} w-full max-h-[88vh] flex flex-col shadow-2xl modal-dialog`}>
            <Modal.CloseTrigger className="text-gray-400 hover:text-gray-600" />
            <Modal.Header className="">
              <Modal.Heading className="text-base font-semibold text-gray-900">
                {uiConfigs?.headerText || "Cập nhật dữ liệu"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="p-3 max-h-[calc(94vh-140px)] overflow-y-auto compact-form">
          <FormProvider {...extendedMethods}>
            <form id="update-modal-form" className={className} onSubmit={handleSubmit(onSubmit)}>
              {React.createElement(component, {
                dataSource,
                data,
                disableFields,
                defaultValues,
                ...(customCallback != null ? { customCallback } : {})
              })}
            </form>
          </FormProvider>
            </Modal.Body>

            <Modal.Footer className="border-t border-gray-200 px-6 py-3.5 bg-gray-50 flex flex-wrap gap-2">
          {/* Custom Footer Logic */}
          {customFooter && (
            <div className="mr-auto">
              {typeof customFooter === "function"
                ? customFooter({ formData: watch(), onClose: toggle })
                : customFooter}
            </div>
          )}

          {/* Custom List Actions (Radio/Buttons) */}
          {!data?.disabled && customList?.map((item: any, index: number) => {
            if (item.type === "radio-group") {
              return (
                <div key={`radio-group-${index}`} className={item.className}>
                  <Controller
                    name={item.name}
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-2 items-center">
                        {item.options.map((option: any) => (
                          <label 
                            key={option.value} 
                            className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded border hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="radio"
                              value={option.value}
                              checked={field.value === option.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="cursor-pointer"
                            />
                            {item.hasIcon && <i className={option.icon} />}
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                </div>
              );
            }
            if (item.type === "button") {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={item.onClick}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                    item.outlined 
                      ? 'border-2 border-current bg-transparent hover:bg-gray-50' 
                      : item.text 
                      ? 'bg-transparent hover:bg-gray-100' 
                      : 'text-white'
                  } ${
                    item.color === 'danger' 
                      ? 'text-red-600 bg-red-600' 
                      : item.color === 'warning' 
                      ? 'text-yellow-600 bg-yellow-600' 
                      : item.color === 'success' 
                      ? 'text-green-600 bg-green-600' 
                      : 'text-blue-600 bg-blue-600'
                  }`}
                >
                  <i className={item.icon} />
                  {item.label}
                </button>
              );
            }
            return null;
          })}

          <div className="flex gap-2 ml-auto">
       
            {!data?.disabled && (
              <button 
                type="submit"
                form="update-modal-form"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-200 font-medium border-none"
              >
                <i className="fas fa-save" />
                Lưu
              </button>
            )}
                 <button 
              type="button"
              onClick={toggle}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-slate-600 hover:bg-slate-700 transition-all duration-200 font-medium border-none"
            >
              <i className="fas fa-times" />
              Đóng
            </button>
          </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default UpdateModal;