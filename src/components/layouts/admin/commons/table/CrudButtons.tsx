"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, Tooltip } from "@heroui/react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import proxyService from "@/services/proxy/proxy.service";
import CreateModal from "./CreateModal";
import ActiveModal from "./ActiveModal";
import { DELETE_TYPE_MULTI } from "@/constants/datatable.enum";
import {
  updateTotalRows,
  updateAdditionalTotalRows,
} from "@/lib/features/datatable/datatableSlice";

// Classification label options (fallback if not available)
const classificationLabelOptions = [
  { value: "TichCuc", label: "Tích cực" },
  { value: "TieuCuc", label: "Tiêu cực" },
  { value: "TrungLap", label: "Trung lập" },
];

// --- INTERFACES ---
interface CrudButtonsProps {
  metadata: Record<string, unknown>;
  data: Record<string, unknown>[];
  className?: string;
  setHasChangeData: (val: boolean) => void;
  setBack: (data: Record<string, unknown>[]) => void;
  selected: Record<string, unknown>[] | null;
  setSelected: (val: Record<string, unknown>[] | null) => void;
  granted: Record<string, unknown>;
}

const CrudButtons: React.FC<CrudButtonsProps> = ({
  metadata,
  data,
  className,
  setHasChangeData,
  setBack,
  selected,
  setSelected,
  granted,
}) => {
  const dispatch = useAppDispatch();
  const datatableReducer = useAppSelector((state) => state.datatableReducer);
  const totalCount = datatableReducer.totalRows;

  const metadata_data = metadata as {
    crudButtons: {
      create: Record<string, unknown>;
      delete: Record<string, unknown>;
      active: Record<string, unknown>;
      customList: Record<string, unknown>[];
      customLeftToolbarList: Record<string, unknown>[];
    };
    customFooter: React.ReactNode;
  };

  const createBtn = metadata_data.crudButtons.create;
  const deleteBtn = metadata_data.crudButtons.delete;
  const activeBtn = metadata_data.crudButtons.active;
  const customList = metadata_data.crudButtons.customList;
  const customLeftToolbarList = metadata_data.crudButtons.customLeftToolbarList;

  // --- STATE ---
  const [dataSource, setDataSource] = useState<Record<string, unknown>[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const openDeleteModal = useCallback(() => setIsDeleteOpen(true), []);
  const closeDeleteModal = useCallback(() => setIsDeleteOpen(false), []);
  const [confirmUpdate, setConfirmUpdate] = useState({
    open: false,
    status: true,
  });

  // State for ActiveModal (for customList buttons)
  const [activeModal, setActiveModal] = useState<{
    open: boolean;
    status: boolean;
  }>({
    open: false,
    status: true,
  });

  useEffect(() => {
    if (data) setDataSource(data);
  }, [data]);

  // --- LOGIC XỬ LÝ XÓA ---
  const removeCheckedItems = (ids: string[]) => {
    dispatch(updateTotalRows(totalCount - ids.length));

    const temp = data.filter((x) => !ids.includes(x.id));
    const deletedItems = data.filter((x) => ids.includes(x.id));

    // Cập nhật lại số liệu thống kê (Tích cực/Tiêu cực/Trung lập)
    if (deletedItems.some((x) => x?.phanLoai)) {
      let countPos = 0,
        countNeg = 0,
        countNeu = 0;
      deletedItems.forEach((item) => {
        if (item.phanLoai === classificationLabelOptions[0].value) countPos++;
        else if (item.phanLoai === classificationLabelOptions[1].value)
          countNeg++;
        else if (item.phanLoai === classificationLabelOptions[2].value)
          countNeu++;
      });

      const updatedAdditonal = {
        tichCuc:
          (datatableReducer?.additionalTotalRows?.tichCuc || 0) - countPos,
        tieuCuc:
          (datatableReducer?.additionalTotalRows?.tieuCuc || 0) - countNeg,
        trungLap:
          (datatableReducer?.additionalTotalRows?.trungLap || 0) - countNeu,
      };
      dispatch(updateAdditionalTotalRows(updatedAdditonal));
    }

    setSelected(null);
    setDataSource(temp);
    setBack(temp);
    setHasChangeData(true);
  };

  const handleDeleteSelected = async (onClose: () => void) => {
    if (!selected) return;
    const ids = selected.map((val) => val.id);
    try {
      const res = await proxyService.multipleDeleteAPI(
        deleteBtn.api,
        ids,
        deleteBtn.params,
      );
      if (res.status === 204) {
        removeCheckedItems(ids);
        if (typeof deleteBtn.callback === "function") deleteBtn.callback();
        onClose();
      }
    } catch (error) {
      console.error("Delete multi error:", error);
    }
  };

  // --- RENDER HELPERS ---
  const renderLeftToolbar = () => (
    <div className="flex flex-wrap gap-2 items-center">
      {metadata &&
        createBtn?.active &&
        createBtn.component &&
        (!createBtn.permission || createBtn.permission in granted) && (
          <CreateModal
            isSubmitFile={createBtn.isSubmitFile}
            className={createBtn.className}
            defaultValues={createBtn.defaultValues}
            dataSource={createBtn.dataSource}
            style={metadata.crudButtons.create.style}
            uiConfigs={createBtn.uiConfigs}
            component={createBtn.component}
            transform2BE={createBtn.transform2BE}
            api={createBtn.api}
            headers={createBtn.headers}
            handleResponseData={createBtn.handleResponseData}
            whenClose={(newRow) => {
              const temp = dataSource || [];
              const displayStratetry =
                typeof metadata.displayStratetry === "function"
                  ? metadata.displayStratetry([newRow, ...temp])
                  : [newRow, ...temp];
              setBack(displayStratetry);
              setDataSource(displayStratetry);
              setHasChangeData(true);
              if (createBtn.callback) createBtn.callback(newRow);
            }}
            customFooter={metadata.customFooter}
            navigate={createBtn.navigate}
          />
        )}

      {deleteBtn &&
        deleteBtn?.active &&
        deleteBtn.type === DELETE_TYPE_MULTI &&
        (!deleteBtn.permission || deleteBtn.permission in granted) && (
          <Button
            className={(deleteBtn.className as string) || "bg-rose-50 text-rose-600 font-bold rounded-lg hover:bg-rose-100 transition-all shadow-none"}
            isDisabled={!selected || selected.length <= 0}
            onPress={openDeleteModal}
          >
            <i className="fas fa-trash-alt mr-1" />
            Xóa {selected && selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
        )}

      {metadata &&
        customLeftToolbarList?.map(
          (item: Record<string, unknown>, idx: number) => (
            <Button
              key={idx}
              variant={
                item.outlined ? "bordered" : item.text ? "light" : "solid"
              }
              className={
                item.color
                  ? `bg-${item.color}-600 text-white rounded-lg h-9 px-4 font-semibold`
                  : "bg-blue-600 text-white rounded-lg h-9 px-4 font-semibold"
              }
              onPress={item.onClick as () => void}
            >
              <i className={`${item.icon as string}`} />
              {item.label as string}
            </Button>
          ),
        )}
    </div>
  );

  const renderRightToolbar = () => (
    <div className="flex flex-wrap gap-2 items-center">
      {activeBtn?.active &&
        (!activeBtn.permission || activeBtn.permission in granted) && (
          <div className="flex gap-2">
            <Button
              className="btn-warning"
              isDisabled={!selected || selected.length <= 0}
              onPress={() => setConfirmUpdate({ open: true, status: false })}
            >
              <i className="fas fa-times-circle" />
              Bỏ kích hoạt
            </Button>
            <Button
              className="btn-primary"
              isDisabled={!selected || selected.length <= 0}
              onPress={() => setConfirmUpdate({ open: true, status: true })}
            >
              <i className="fas fa-check-circle" />
              Kích hoạt
            </Button>
          </div>
        )}

      {customList?.map((item: Record<string, unknown>, idx: number) => {
        const hasPerm =
          !item.permission || (item.permission as string) in granted;
        if (!hasPerm) return null;

        // Check if button should be disabled
        const btnDisabled =
          item.disabled ||
          ((!selected || selected.length === 0) &&
            (item.requiresSelection as boolean));

        return (
          <Tooltip
            key={idx}
            content={(item.tooltip || item.label) as string}
            placement="bottom"
          >
            <Button
              isDisabled={btnDisabled as boolean}
              className={
        
                item.color === "warning"
                  ? "btn-warning"
                  : item.color === "success"
                    ? "btn-success"
                    : item.color === "primary"
                      ? "btn-primary"
                    : item.color === "danger"
                      ? "btn-danger"
                      : "btn-primary"
              }
              onPress={(e) => {
                // Helper functions for customList buttons
                const helpers = {
                  openActiveModal: (status: boolean) => {
                    if (!selected || selected.length === 0) return;
                    setActiveModal({ open: true, status });
                  },
                };

                const onClick = item.onClick as (
                  e: any,
                  selected: Record<string, unknown>[] | null,
                  helpers: typeof helpers,
                ) => unknown;
                const res = onClick(e, selected, helpers);
                if (item.callback) {
                  const callback = item.callback as (
                    res: unknown,
                    data: Record<string, unknown>[],
                    setBack: (data: Record<string, unknown>[]) => void,
                  ) => void;
                  callback(res, data, setBack);
                }
              }}
            >
              {item.icon && <i className={item.icon as string} />}
              {item.label && (
                <span className="">{item.label as string}</span>
              )}
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );

  if (createBtn?.hideToolsBar) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-1 bg-white rounded-xl border border-slate-200 ${className || ""}`}
    >
      {renderLeftToolbar()}
      {renderRightToolbar()}

      {/* ── Delete Confirmation Overlay ── */}
      {isDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <div className="absolute inset-0" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6" style={{ zIndex: 1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-lg text-orange-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Xác nhận xóa</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa{" "}
              <b className="text-gray-900">{selected?.length}</b> bản ghi đã chọn?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleDeleteSelected(closeDeleteModal)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition-all font-medium"
              >
                <i className="fas fa-trash-alt" />
                Xóa
              </button>
              <button
                onClick={closeDeleteModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-medium"
              >
                <i className="fas fa-times" />
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {activeBtn?.api && (
        <ActiveModal
          api={activeBtn.api as string}
          isOpen={confirmUpdate.open || activeModal.open}
          onClose={() => {
            setConfirmUpdate({ open: false, status: true });
            setActiveModal({ open: false, status: true });
          }}
          status={confirmUpdate.open ? confirmUpdate.status : activeModal.status}
          selectedIds={selected?.map((item) => item.id as string) || []}
          data={data}
          setBack={setBack}
          setSelected={setSelected}
          setHasChangeData={setHasChangeData}
        />
      )}
    </div>
  );
};

export default CrudButtons;
