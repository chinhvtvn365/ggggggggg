"use client";

import React, { useEffect, useState } from "react";
import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import { appendFileInfoToFormData } from "@/components/layouts/admin/commons/table/FileSubmitHandler";
import "moment/locale/vi";
import { DELETE_TYPE_MULTI } from "@/constants/datatable.enum";
import proxyService from "@/services/proxy/proxy.service";
import moment from "moment";

// Import needed components
import ScheduleBossesDisplay from "@/components/lich-lam-viec/ScheduleBossesDisplay";

const AddEdit = React.lazy(() => import("@/components/lich-lam-viec/AddEditLichLamViec"));

export default function LichLamViec() {
  const [dataOrganizationUnit, setDataOrganizationUnit] = useState<{ value: string; label: string }[]>([]);
  const [crawlFreqModal, setCrawlFreqModal] = useState(false);
  const [paramData, setParamData] = useState({
    lastUpdatedTime: new Date(Date.now() - 15 * 60 * 1000),
    latestError: "",
  });

  useEffect(() => {
    loadOrganizationUnits();
    getParamData();
  }, []);

  const loadOrganizationUnits = async () => {
    try {
      const response = await proxyService.get("/api/app/work-schedule/vnpt-unit");
      if (response && response.data) {
        const units = response.data as { id: string; name: string }[];
        setDataOrganizationUnit(units.map((unit) => ({ value: unit.id, label: unit.name })));
      }
    } catch (error) {
      console.error("Error loading organization units:", error);
    }
  };

  const getSafeLastUpdatedTime = (value: string | Date | null | undefined) => {
    const fallback = new Date(Date.now() - 15 * 60 * 1000);
    if (!value) return fallback;
    const date = new Date(value);
    if (isNaN(date.getTime())) return fallback;
    if (date.getFullYear() <= 1) return fallback;
    return date;
  };

  const getParamData = async () => {
    try {
      const res = await proxyService.get(`/api/app/shared-parameter/by-key?key=VNPT_AUTH`);
      if (res.status === 200 && res.data) {
        const dataStr = (res.data as Record<string, any>).value;
        const json = dataStr ? JSON.parse(dataStr) : {};
        setParamData(
          json
            ? {
                lastUpdatedTime: getSafeLastUpdatedTime(json.LastUpdatedTime),
                latestError: json.LatestError || "",
              }
            : {
                lastUpdatedTime: new Date(Date.now() - 15 * 60 * 1000),
                latestError: "",
              }
        );
      }
    } catch (error) {
      console.log("Chưa có cấu hình, sử dụng mặc định");
    }
  };

  const transformDataBinding = (dataBinding: Record<string, any>[]) => {
    return dataBinding.map((item) => handleScheduleData(item));
  };

  const createDataForm = (data: Record<string, any>) => {
    const dateMoment = moment(data.date ?? new Date(), "DD/MM/YYYY").locale("en");
    const form = new FormData();
    form.append("title", data.title || "");
    form.append("agentId", data.agentId || "");
    form.append("organizationUnitId", data.organizationUnitId || "");
    form.append("date", dateMoment.format("YYYY-MM-DD"));
    form.append("dayOfWeek", dateMoment.format("ddd").toUpperCase());

    if (data?.scheduleBosses?.length > 0) {
      data.scheduleBosses.forEach((boss: any, index: number) => {
        form.append(`scheduleBosses[${index}].username`, boss.username || "");
        form.append(`scheduleBosses[${index}].position`, boss.position || "");

        if (boss.parameters?.length > 0) {
          boss.parameters.forEach((param: any, paramIndex: number) => {
            form.append(`scheduleBosses[${index}].parameters[${paramIndex}].codeTime`, param.codeTime || "");
            form.append(`scheduleBosses[${index}].parameters[${paramIndex}].content`, param.content || "");
            form.append(`scheduleBosses[${index}].parameters[${paramIndex}].place`, param.place || "");
            form.append(`scheduleBosses[${index}].parameters[${paramIndex}].participation`, param.participation || "");
          });
        }
      });
    }

    appendFileInfoToFormData(form, null, null, data.attachedFile, "attachedFile");

    return form;
  };

  const handleScheduleData = (data: Record<string, any>) => {
    const dateMoment = moment(data.date, "DD/MM/YYYY").locale("en");
    return {
      ...data,
      date: dateMoment.format("YYYY-MM-DD"),
      day: dateMoment.format("ddd").toUpperCase(),
    };
  };

  const metadata = {
    serverSide: {
      api: "/api/app/work-schedule",
      transformStrategy: transformDataBinding,
    },
    table: {
      pagination: true,
      permission: "WorkSchedule.Default",
      columns: [
        {
          name: "Tiêu đề",
          dataField: "title",
          filterBy: "title",
          width: "30%",
          dataFormatEdit: (row: any) => {
            return <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors duration-200">{row.title}</span>;
          },
        },
        {
          name: "Đơn vị",
          dataField: "agentName",
          filterBy: "agentId",
          width: "15%",
        },
        {
          name: "Lịch lãnh đạo",
          dataField: "scheduleBosses",
          width: "40%",
          dataFormat: (row: any) => {
            return <ScheduleBossesDisplay scheduleBosses={row.scheduleBosses} />;
          },
        },
      ],
      tableStyles: {
        stripedRows: false,
        showGridlines: false,
      },
    },
    filterTools: {
      inputPlaceholder: "Tìm kiếm theo tiêu đề",
      components: [
        {
          name: "agentId",
          data: dataOrganizationUnit,
          filterByDataField: "agentId",
          placeholder: "- Chọn đơn vị -",
        },
      ],
    },
    crudButtons: {
      create: {
        active: true,
        isSubmitFile: true,
        permission: "WorkSchedule.Default.Create",
        defaultValues: {
          title: "",
          agentId: "",
          date: new Date(),
          scheduleBosses: [
            {
              username: "",
              position: "",
              parameters: [
                {
                  codeTime: "SANG",
                  content: "",
                  place: "",
                  participation: "",
                },
              ],
            },
          ],
        },
        classNameModal: "",
        style: {},
        uiConfigs: {
          headerText: "Thêm lịch làm việc",
          modalWidth: "1200px" // Using standard modal string for full width instead of style object
        },
        dataSource: { dataOrganizationUnit },
        component: AddEdit,
        transform2BE: (data: Record<string, unknown>) => {
          return createDataForm(data);
        },
        handleResponseData: (data: Record<string, unknown>) => {
          return handleScheduleData(data);
        },
        api: "/api/app/work-schedule",
      },
      update: {
        active: true,
        isSubmitFile: true,
        permission: "WorkSchedule.Default.Update",
        classNameModal: "",
        style: {},
        uiConfigs: {
          headerText: "Cập nhật lịch làm việc",
          modalWidth: "1200px"
        },
        dataSource: { dataOrganizationUnit },
        component: AddEdit,
        transform2BE: (data: Record<string, unknown>) => {
          return createDataForm(data);
        },
        handleResponseData: (data: Record<string, unknown>) => {
          return handleScheduleData(data);
        },
        api: "/api/app/work-schedule",
      },
      delete: {
        active: true,
        permission: "WorkSchedule.Default.Delete",
        type: DELETE_TYPE_MULTI,
        api: "/api/app/work-schedule",
        callback: () => {},
        params: "Ids",
      },
      customList: [
        {
          label: (
            <div>
              <div>Lịch làm việc</div>
              <small>Cập nhật: {moment(paramData?.lastUpdatedTime).locale("vi").fromNow()}</small>
            </div>
          ),
          className: "",
          color: "info",
          icon: "pi pi-calendar",
          onClick: () => {
            window.open("/lich-lam-viec");
          },
        },
        {
          label: "Cấu hình",
          className: "",
          color: "primary",
          icon: "pi pi-cog",
          onClick: () => setCrawlFreqModal(true),
        },
      ],
    },
  };

  return (
    <>
      <DataTable metadata={metadata} />
      {/* Remove CrawlFreqConfigModal if not adapted yet, or adapt it later if required to prevent crash */}
    </>
  );
}
