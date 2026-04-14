"use client";

import React, { useState } from "react";
import { Modal, Button } from "@heroui/react";
import proxyService from "@/services/proxy/proxy.service";
import { useAppDispatch } from "@/lib/hooks";

interface ActiveModalProps {
  api: string;
  isOpen: boolean;
  onClose: () => void;
  status: boolean; // true = activate, false = deactivate
  selectedIds: string[];
  data: Record<string, unknown>[];
  setBack: (data: Record<string, unknown>[]) => void;
  setSelected: (val: Record<string, unknown>[] | null) => void;
  setHasChangeData: (val: boolean) => void;
}

const ActiveModal: React.FC<ActiveModalProps> = ({
  api,
  isOpen,
  onClose,
  status,
  selectedIds,
  data,
  setBack,
  setSelected,
  setHasChangeData,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {


    try {
      setLoading(true);
      
      // Build FormData like original code
      const formdata = new FormData();
      selectedIds.forEach((element, idx) => {
        formdata.append(`ids[${idx}]`, element);
      });
      formdata.append("type", status !== null ? String(status) : "true");

      const res = await proxyService.put(api, formdata);
      
      if (res.status === 200 && res.data) {
        // Filter successful items
        const successRequest = res.data.filter((item: any) => item.isSuccess).map((item: any) => item.id);
        
        // Update data with new isActive status
        const newData = data.map(item => {
          const found = successRequest.find(x => x === item.id);
          if (found) {
            return {
              ...item,
              isActive: status
            };
          }
          return item;
        });
        

        
        // Update state like original code
        setBack(newData);
        setSelected(null);
        setHasChangeData(true);
        onClose();
      }
    } catch (error: any) {

    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container placement="top">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  status ? "bg-green-100" : "bg-orange-100"
                }`}>
                  <i className={`pi ${status ? "pi-check-circle" : "pi-times-circle"} text-xl ${
                    status ? "text-green-600" : "text-orange-600"
                  }`} />
                </div>
                <Modal.Heading>Xác nhận</Modal.Heading>
              </div>
            </Modal.Header>
            <Modal.Body>
              <p>
                Bạn có chắc chắn muốn {status ? "kích hoạt" : "bỏ kích hoạt"} <b>{selectedIds.length}</b> bản ghi đã chọn?
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline"
                onPress={onClose}
                isDisabled={loading}
              >
                <i className="pi pi-times mr-1" />
                Hủy
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit}
                isLoading={loading}
                isDisabled={loading}
              >
                <i className="pi pi-check mr-1" />
                Xác nhận
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default ActiveModal;
