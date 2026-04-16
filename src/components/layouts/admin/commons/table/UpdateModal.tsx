"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button } from "@heroui/react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import { DATATABLE_MODAL_UPDATE_MODE } from "@/constants/datatable.enum";
import { proxyService } from "@/services";
import { updateAdditionalTotalRows } from "@/lib/features/datatable/datatableSlice";
import { open, close } from "@/lib/features/loading/loadingSlice";
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
    style,
    toggle,
    isOpen,
    metadata,
    isSubmitFile = false,
    disableFields = [],
    customFooter = null,
  } = props;

  const resolvedModalMaxWidth =
    uiConfigs?.modalWidth ||
    (typeof style?.width === "string" ? style.width : undefined) ||
    "50vw";

  // --- REDUX ---
  const dispatch = useAppDispatch();
  const datatableReducer = useAppSelector((state) => state.datatableReducer);

  // --- FORM STATE ---
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);
    dispatch(open());
    let finalData = { ...formData };

    if (isSubmitFile) {
      try {
        finalData = await fileSubmitHandler(finalData, true);
      } catch (ex) {
        console.error("File upload error:", ex);
        setSubmitting(false);
        dispatch(close());
        return;
      }
    }

    const payload = typeof transform2BE === "function" ? await transform2BE(finalData) : finalData;
    if (!payload) {
      setSubmitting(false);
      dispatch(close());
      return;
    }

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
    } finally {
      setSubmitting(false);
      dispatch(close());
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={toggle}
    >
      <Modal.Backdrop>
        <Modal.Container placement="top">
          <Modal.Dialog
            className="admin-form-modal-dialog"
            style={{
              maxWidth: resolvedModalMaxWidth,
              maxHeight: "95vh",
              ...style,
            }}
          >
            <Modal.CloseTrigger />
            <Modal.Header className="admin-form-modal-header">
              <Modal.Heading>
                {uiConfigs?.headerText || "Cập nhật dữ liệu"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="admin-form-modal-body">
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

            <Modal.Footer className="admin-form-modal-footer">
          {/* Custom Footer Logic */}
          {customFooter && (
            <div>
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
                <Button
                  key={index}
                  type="button"
                  variant={
                    item.color === "danger"
                      ? "danger"
                      : item.outlined
                        ? "outline"
                        : item.text
                          ? "ghost"
                          : "primary"
                  }
                  onPress={item.onClick}
                >
                  <i className={item.icon} />
                  {item.label}
                </Button>
              );
            }
            return null;
          })}

          <div className="ml-auto flex items-center gap-2">
            {!data?.disabled && (
              <Button
                size="md"
                type="submit"
                form="update-modal-form"
                variant="primary"
                isDisabled={submitting}
              >
                <i className={`fas mr-1 ${submitting ? "fa-spinner fa-spin" : "fa-save"}`} />
                Lưu
              </Button>
            )}
            <Button
              size="md"
              type="button"
              variant="tertiary"
              isDisabled={submitting}
              onPress={toggle}
            >
              <i className="fas fa-times mr-1" />
              Đóng
            </Button>
          </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default UpdateModal;