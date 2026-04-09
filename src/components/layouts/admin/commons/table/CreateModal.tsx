"use client";

import React, { Fragment, useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import proxyService from "@/services/proxy/proxy.service";
import {
  updateTotalRows,
  onTriggerOpenCreateModal,
} from "@/lib/features/datatable/datatableSlice";
import fileSubmitHandler from "./FileSubmitHandler";
import { DATATABLE_MODAL_CREATE_MODE } from "@/constants/datatable.enum";

// --- INTERFACES ---
interface CreateModalProps {
  defaultValues?: Record<string, unknown>;
  btnClassName?: string;
  btnStyle?: React.CSSProperties;
  btnRaised?: boolean;
  dataSource?: Record<string, unknown>;
  component: React.ComponentType<{
    data?: Record<string, unknown>;
    dataSource?: Record<string, unknown>;
  }>;
  whenClose: (data: Record<string, unknown> | null) => void;
  api: string;
  headers?: Record<string, string>;
  uiConfigs?: {
    headerText?: string;
    submitButtonLabel?: string;
    modalWidth?: string;
  };
  transform2BE?: (
    data: Record<string, unknown>,
  ) =>
    | Promise<FormData | Record<string, unknown>>
    | FormData
    | Record<string, unknown>;
  handleResponseData?: (
    data: Record<string, unknown>,
  ) => Record<string, unknown>;
  className?: string;
  text?: string;
  data?: Record<string, unknown>;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  isSubmitFile?: boolean;
  disableOnOpenDefaultValues?: boolean;
  customLabel?: string;
  disableFields?: string[];
  modalType?: string;
  navigate?: string | null;
  customFooter?: React.ReactNode;
}

const CreateModal: React.FC<CreateModalProps> = (props) => {
  const {
    defaultValues,
    dataSource,
    component,
    whenClose,
    api,
    headers,
    uiConfigs,
    transform2BE,
    handleResponseData,
    className,
    data,
    disabled,
    onClick,
    isSubmitFile = false,
    disableOnOpenDefaultValues = false,
    customLabel,
    disableFields = [],
    modalType,
    navigate = null,
    customFooter = null,
  } = props;

  const router = useRouter();
  const dispatch = useAppDispatch();
  const [modal, setModal] = useState(false);
  const [formConfigs, setFormConfigs] = useState({});
  const lastOpenedRef = React.useRef<string | null>(null);

  const datatableReducer = useAppSelector((state) => state.datatableReducer);
  const totalCount = useAppSelector((state) => state.datatableReducer.totalRows);

  const sanitizeValues = (values: Record<string, unknown> | undefined) => {
    if (!values) return {};
    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value === undefined || value === null ? "" : value,
      ]),
    );
  };

  const methods = useForm({ defaultValues: sanitizeValues(defaultValues) });
  const { handleSubmit, reset } = methods;

  const extendedMethods = {
    ...methods,
    formConfigs,
    setFormConfigs,
    modalMode: { mode: DATATABLE_MODAL_CREATE_MODE, create: true },
  };

  const toggle = () => {
    if (!modal) lastOpenedRef.current = null;
    reset(sanitizeValues(defaultValues));
    setModal((prev) => !prev);
  };

  useEffect(() => {
    const currentKey = JSON.stringify(datatableReducer.defaultCreateModalValues);
    if (
      !modal &&
      !disableOnOpenDefaultValues &&
      datatableReducer.defaultCreateModalValues &&
      Object.keys(datatableReducer.defaultCreateModalValues)?.length > 0 &&
      (!datatableReducer.defaultCreateModalValues?.modalType ||
        datatableReducer.defaultCreateModalValues?.modalType === modalType) &&
      lastOpenedRef.current !== currentKey
    ) {
      lastOpenedRef.current = currentKey;
      reset(sanitizeValues(datatableReducer.defaultCreateModalValues));
      setModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datatableReducer.defaultCreateModalValues, disableOnOpenDefaultValues]);

  useEffect(() => {
    const defaultValuesData = datatableReducer?.defaultCreateValues?.data;
    if (
      !modal &&
      defaultValuesData &&
      Object.keys(datatableReducer?.defaultCreateValues?.data)?.length > 0
    ) {
      reset(sanitizeValues(defaultValuesData));
      if (datatableReducer?.defaultCreateValues?.isToggle) setModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datatableReducer.defaultCreateValues]);

  const onSubmit = async (formData: Record<string, unknown>) => {
    if (isSubmitFile) {
      try {
        formData = await fileSubmitHandler(formData, true);
      } catch (ex) {
        console.error("fileSubmitHandler error", ex);
        return;
      }
    }

    const payload =
      typeof transform2BE === "function" ? await transform2BE(formData) : formData;
    if (!payload) return;

    proxyService
      .post(api, payload, headers)
      .then((result) => {
        if (result.data) {
          toggle();
          formData.id = (result.data as Record<string, unknown>).id;
          const resData =
            typeof handleResponseData === "function"
              ? handleResponseData(result.data as Record<string, unknown>)
              : formData;
          whenClose(resData);
          dispatch(updateTotalRows(totalCount + 1));
          if (
            datatableReducer.defaultCreateModalValues &&
            Object.keys(datatableReducer.defaultCreateModalValues)?.length > 0
          ) {
            dispatch(onTriggerOpenCreateModal({}));
          }
        }
      })
      .catch((err: unknown) => {
        console.error("Submission error:", err);
      });
  };

  const handleClose = () => {
    if (
      datatableReducer.defaultCreateModalValues &&
      Object.keys(datatableReducer.defaultCreateModalValues)?.length > 0
    ) {
      dispatch(onTriggerOpenCreateModal({}));
    }
    toggle();
  };

  return (
    <Fragment>
      {!disabled && (
        <Button
          onClick={() => {
            if (navigate) {
              router.push(navigate);
            } else {
              toggle();
              if (typeof onClick === "function") onClick();
            }
          }}
          className={className || "btn-success"}
        >
          <i className="fa-solid fa-plus" />
          {customLabel ?? "Thêm"}
        </Button>
      )}

      {/* ── Custom Modal Overlay (replaces HeroUI Modal compound – avoids collection error) ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-4 px-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <div className="absolute inset-0" onClick={handleClose} />
          <div
            className="relative bg-white rounded-xl shadow-2xl flex flex-col w-full"
            style={{ maxWidth: uiConfigs?.modalWidth || "780px", maxHeight: "92vh", zIndex: 1 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                {uiConfigs?.headerText ?? "Thêm mới"}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1 compact-form">
              <FormProvider {...extendedMethods}>
                <form
                  id="create-modal-form"
                  className={className}
                  onSubmit={handleSubmit(onSubmit)}
                >
                  {React.createElement(component, {
                    dataSource,
                    data,
                    disableFields,
                    defaultValues,
                  } as any)}
                </form>
              </FormProvider>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 justify-end px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
              {customFooter}
              <button
                type="submit"
                form="create-modal-form"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-all font-medium"
              >
                <i className="fas fa-save" />
                {uiConfigs?.submitButtonLabel ?? "Lưu"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-slate-500 hover:bg-slate-600 transition-all font-medium"
              >
                <i className="fas fa-times" />
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default CreateModal;
