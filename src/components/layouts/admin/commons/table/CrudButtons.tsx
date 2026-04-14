"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button, Tooltip, Modal } from "@heroui/react";
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

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Look for the portal target in the layout
    const target = document.getElementById("admin-page-actions");
    if (target) {
      setPortalTarget(target);
    }
  }, []);

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
        deleteBtn.params || "ids",
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
        (deleteBtn.type === DELETE_TYPE_MULTI || !deleteBtn.type) &&
        (!deleteBtn.permission || deleteBtn.permission in granted) && (
          <Button
            variant="danger"
            isDisabled={!selected || selected.length <= 0}
            onPress={openDeleteModal}
          >
            <i className="fas fa-trash-alt" />
            Xóa {selected && selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
        )}

      {metadata &&
        customLeftToolbarList?.map(
          (item: Record<string, unknown>, idx: number) => (
            <Button
              key={idx}
              variant={
                item.outlined ? "outline" : item.text ? "ghost" : "primary"
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
              variant="secondary"
              isDisabled={!selected || selected.length <= 0}
              onPress={() => setConfirmUpdate({ open: true, status: false })}
            >
              <i className="fas fa-times-circle" />
              Bỏ kích hoạt
            </Button>
            <Button
              variant="primary"
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
              variant={
                item.color === "danger"
                  ? "danger"
                  : item.color === "warning"
                    ? "secondary"
                    : item.color === "success"
                      ? "primary"
                      : "primary"
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

  const content = (
    <>
      {renderLeftToolbar()}
      {renderRightToolbar()}

      <Modal isOpen={isDeleteOpen} onOpenChange={(open) => !open && closeDeleteModal()}>
        <Modal.Backdrop>
          <Modal.Container placement="top">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Xác nhận xóa</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>
                  Bạn có chắc chắn muốn xóa {selected?.length} bản ghi đã chọn?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={closeDeleteModal}>
                  Đóng
                </Button>
                <Button variant="danger" onPress={() => handleDeleteSelected(closeDeleteModal)}>
                  Xóa
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

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
    </>
  );

  if (portalTarget) {
    return createPortal(content, portalTarget);
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className || ""}`}
    >
      {content}
    </div>
  );
};

export default CrudButtons;
