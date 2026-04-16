"use client";

import React, { useState, useEffect, Fragment } from "react";
import { Modal} from "@heroui/react";
import { AxiosResponse } from "axios";

import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import { DELETE_TYPE_SINGLE } from "@/constants/datatable.enum";
import { proxyService } from "@/services";
import { cacheService, tokenService } from "@/services";
import utilsService from "@/services/utils/utils.service";
import { AES_IV, USER_ROLE } from "@/constants/auth.enum";

// Lazy load Modal thêm/sửa
const AddEdit = React.lazy(() => import("@/components/system/users/AddEdit"));

const UserPage = () => {
  // Quản lý Modal phân quyền
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>({});
  
  // Quản lý Modal xác nhận đăng nhập
  const [isOpen, setIsOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<string | null>(null);
  
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const onOpenChange = (open: boolean) => setIsOpen(open);

  const [roles, setRoles] = useState<any[]>([]);
  const [oUnit, setOUnit] = useState<any[]>([]);
  const iv = utilsService.generateIV();

  useEffect(() => {
    getAssignableRoles();
    getOrganizeUnit();
  }, []);

  const getAssignableRoles = async () => {
    try {
      const res = await proxyService.get<{ items: any[] }>("/api/identity/users/assignable-roles") as AxiosResponse<{ items: any[] }>;
      if (res.status === 200 && res.data) {
        const roleOptions = res.data?.items.map((item: any) => ({
          label: item.name,
          value: item.id
        }));
        setRoles(roleOptions);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách vai trò:", error);
    }
  };

  const getOrganizeUnit = async () => {
    try {
      const res = await proxyService.get<any[]>("/api/app/organization-unit/phan-cap") as AxiosResponse<any[]>;
      if (res.status === 200 && res.data) {
        setOUnit(res.data.map((item: any) => ({
          label: item.shortName,
          value: item.id,
          level: item?.level,
        })));
      }
    } catch (error) {}
  };

  // Hàm xử lý đăng nhập với tư cách user khác
  const processLoginAsUser = async () => {
    if (!targetUser) return;
    try {
      const response = await proxyService.post<{ result: any }>("/api/TokenAuth/LoginUserName", {
        userName: targetUser,
      }) as AxiosResponse<{ result: any }>;

      if (response?.status === 200 && response?.data?.result) {
        const result = response.data.result;
        tokenService.storeToken(result.accessToken);

        const tokenDecode = decodeURIComponent(
          escape(utilsService.base64ToArray(result.accessToken?.split(".")[1]))
        );
        let tokenJson = JSON.parse(tokenDecode);
        tokenJson.userId = result.userId || "";
        utilsService.setUserInfo(tokenJson);

        cacheService.set(USER_ROLE, utilsService.encryptAES(JSON.stringify(result.roles), AES_IV));

        // Điều hướng sau khi thành công
        window.location.href = "/quan-tri";
      }
    } catch (error: any) {
      alert(error?.response?.data?.error?.message || "Không thể đăng nhập");
    } finally {
      onClose();
    }
  };

  const handleContentData = (data: any) => ({
    ...data,
    xuLyPhanAnh: data.extraProperties?.xuLyPhanAnh,
    yeuCauDoiMatKhau: data.extraProperties?.yeuCauDoiMatKhau,
    organizationUnitId: data.extraProperties?.organizationUnitId,
    organizationUnitName: data.extraProperties?.organizationUnitName,
  });

  const createDataForm = (data: any) => {
    const selectedRoles = data.roleName
      ? Object.entries(data.roleName)
          .filter(([_, value]) => value === true)
          .map(([key]) => key)
      : [];

    return {
      userName: data.userName,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: data.password ? utilsService.encryptAES(data.password, iv) : undefined,
      roleNames: selectedRoles,
      isActive: data.isActive,
      lockoutEnabled: data.lockoutEnabled,
      extraProperties: {
        yeuCauDoiMatKhau: data.yeuCauDoiMatKhau || false,
        xuLyPhanAnh: data.xuLyPhanAnh || false,
        organizationUnitId: data.organizationUnitId,
      },
    };
  };

  const metadata = {
    serverSide: {
      api: "/api/identity/users/filter",
      transformStrategy: (data: any[]) => data.map(handleContentData),
    },
    table: {
      pagination: true,
      permission: "AbpIdentity.Users",
      key: "id",
      columns: [
        {
          name: "Họ và tên",
          dataField: "name",
          dataFormatEdit: (row: any) => <span className="font-medium">{row.name}</span>,
        },
        {
          name: "Tài khoản",
          dataFormat: (row: any) => (
            <div 
              className="flex items-center gap-2 cursor-pointer group" 
              onClick={() => {
                setTargetUser(row.userName);
                onOpen();
              }}
              title="Đăng nhập với tài khoản này"
            >
              <i className="fa fa-sign-in text-blue-500 group-hover:text-blue-700 transition-colors"></i>
              <span className="group-hover:underline">{row?.userName}</span>
            </div>
          ),
        },
        { name: "Email", dataField: "email" },
        { name: "Điện thoại", dataField: "phoneNumber" },
        {
          name: "Phân quyền",
          dataFormat: (row: any) => (
            <div className="flex flex-wrap gap-1">
              {row.extraProperties?.roleNames?.map((item: string, index: number) => (
                <span 
                  key={index} 
                  className="px-2.5 py-1 text-xs rounded-full bg-blue-500 text-white font-semibold shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          ),
        },
        {
          name: "Đơn vị",
          dataFormat: (row: any) => {
            const unit = oUnit.find((x: any) => x.value === row?.organizationUnitId) as any;
            return <span>{unit?.label || "---"}</span>;
          },
        },
       
      ],
    },
    filterTools: {
      inputPlaceholder: "Tìm theo tên, tài khoản, email...",
      components: [
        {
          name: "organizationUnitId",
          data: oUnit,
          filterByDataField: "organizationUnitId",
          placeholder: "Đơn vị",
          searchable: true,
        },
        {
          name: "roleId",
          data: roles,
          filterByDataField: "roleId",
          placeholder: "Vai trò",
        },
      ],
    },
    crudButtons: {
      create: {
        active: true,
        permission: "AbpIdentity.Users.Create",
        style: { width: "800px" },
        uiConfigs: { headerText: "Thêm người dùng mới" },
        headers: { iv },
        dataSource: { roles, oUnit },
        component: AddEdit,
        transform2BE: (data: any) => createDataForm(data),
        handleResponseData: (data: any) => handleContentData(data),
        api: "/api/identity/users",
      },
      update: {
        active: true,
        permission: "AbpIdentity.Users.Update",
        style: { width: "800px" },
        uiConfigs: { headerText: "Cập nhật thông tin" },
        headers: { iv },
        dataSource: { roles, oUnit },
        component: AddEdit,
        transform2BE: (data: any) => createDataForm(data),
        handleResponseData: (data: any) => handleContentData(data),
        api: "/api/identity/users",
      },
      delete: {
        active: true,
        permission: "AbpIdentity.Users.Delete",
        type: DELETE_TYPE_SINGLE,
        api: "/api/identity/users",
      },
      customList: [
      ],
    },
  };

  return (
    <Fragment>
      <DataTable metadata={metadata} />

      {/* Modal xác nhận đăng nhập */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Backdrop className="bg-black/80 modal-backdrop">
          <Modal.Container className="items-center justify-center modal-container" placement="top">
            <Modal.Dialog className="bg-white rounded-xl max-w-md w-full shadow-2xl modal-dialog">
              <Modal.CloseTrigger />
              <Modal.Header className="">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
                    <i className="pi pi-exclamation-triangle text-xl text-yellow-600" />
                  </div>
                  <Modal.Heading className="text-lg font-semibold text-gray-900">
                    Xác nhận đăng nhập
                  </Modal.Heading>
                </div>
              </Modal.Header>
              <Modal.Body className="px-6 py-5">
                <div className="space-y-2 text-gray-700">
                  <p>
                    Bạn có chắc chắn muốn chuyển sang đăng nhập với tài khoản 
                    <span className="font-bold text-gray-900"> "{targetUser}"</span> không?
                  </p>
                  <p className="text-sm text-gray-500">
                    Hệ thống sẽ tự động chuyển hướng về trang quản trị sau khi thực hiện.
                  </p>
                </div>
              </Modal.Body>
              <Modal.Footer className="flex gap-2 justify-end px-6 py-3.5 bg-gray-50 border-t border-gray-200">
                <button 
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <i className="pi pi-times" />
                  Hủy
                </button>
                <button 
                  onClick={processLoginAsUser}
                  className="btn-primary"
                >
                  <i className="pi pi-sign-in" />
                  Đăng nhập
                </button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Modal phân quyền - Component không khả dụng */}
      {/* {permissionModalOpen && (
        <PermissionModal 
          modal={permissionModalOpen} 
          setModal={setPermissionModalOpen} 
          user={selectedUser} 
        />
      )} */}
    </Fragment>
  );
};

export default UserPage;