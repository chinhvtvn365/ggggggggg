"use client";

import Map from "./map";
import { proxyService } from "@/services/proxy/proxy.service";
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@heroui/react";
import moment from "moment";

const timeRangeOptions = [
  { label: "7 ngày qua", value: "7days" },
  { label: "30 ngày qua", value: "30days" },
  { label: "3 tháng qua", value: "3months" },
  { label: "6 tháng qua", value: "6months" },
  { label: "Năm nay", value: "thisyear" },
  { label: "Năm trước", value: "lastyear" },
];

const BanDo = () => {
  const [dataMap, setDataMap] = useState([]);

  // Filter states
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedTimeRange, setSelectedTimeRange] = useState("");
  // Dùng chuỗi "YYYY-MM-DD" cho ngày
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push({ label: i.toString(), value: i.toString() });
    }
    return years;
  }, [currentYear]);

  // Calculate date range based on filters
  const getDateRangeFromFilters = (
    yearVal: string,
    timeRange: string,
    startD: string,
    endD: string,
  ) => {
    let startDate, endDate;
    const today = new Date();

    if (startD && endD) {
      startDate = new Date(startD);
      endDate = new Date(endD);
    } else if (timeRange) {
      endDate = today;
      switch (timeRange) {
        case "7days":
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3months":
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
          break;
        case "6months":
          startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
          break;
        case "thisyear":
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
          break;
        case "lastyear":
          startDate = new Date(today.getFullYear() - 1, 0, 1);
          endDate = new Date(today.getFullYear() - 1, 11, 31);
          break;
        default:
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
      }
    } else {
      const parsedYear = parseInt(yearVal, 10) || currentYear;
      startDate = new Date(parsedYear, 0, 1);
      endDate = new Date(parsedYear, 11, 31);
    }

    if (!startDate || isNaN(startDate.getTime())) {
      startDate = new Date(currentYear, 0, 1);
    }
    if (!endDate || isNaN(endDate.getTime())) {
      endDate = new Date(currentYear, 11, 31);
    }

    return { startDate, endDate };
  };

  const handeleGetMapData = async (y = selectedYear, tr = selectedTimeRange, sd = startDateStr, ed = endDateStr) => {
    try {
      const { startDate, endDate } = getDateRangeFromFilters(y, tr, sd, ed);
      const res = await proxyService.get("/api/app/phan-anh/thong-ke-xa-ban-do", {
        TuNgay: moment(startDate).format("YYYY-MM-DD"),
        DenNgay: moment(endDate).format("YYYY-MM-DD"),
      });
      if (res?.data && res.status === 200 && (res.data as any).communeData) {
        setDataMap((res.data as any).communeData);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu bản đồ:", error);
    }
  };

  useEffect(() => {
    handeleGetMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dashboard-container relative w-full h-full">
      {/* Filter Panel */}
      <div className="filter-panel-wrapper absolute top-2 left-2 p-2" style={{ zIndex: "99" }}>
        <div className="filter-panel bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Năm:</label>
            <div className="w-32">
              <select
                aria-label="Chọn Năm"
                value={selectedYear}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setSelectedYear(val);
                    setSelectedTimeRange("");
                    setStartDateStr("");
                    setEndDateStr("");
                    setTimeout(() => handeleGetMapData(val, "", "", ""), 100);
                  }
                }}
                className="w-full h-10 px-3 pr-8 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 hover:border-blue-400 bg-white shadow-sm appearance-none cursor-pointer"
              >
                <option value="" disabled>Chọn năm</option>
                {yearOptions.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Thời gian:</label>
            <div className="w-40">
              <select
                aria-label="Thời gian"
                value={selectedTimeRange}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTimeRange(val);
                  setStartDateStr("");
                  setEndDateStr("");
                  setTimeout(() => handeleGetMapData(selectedYear, val, "", ""), 100);
                }}
                className="w-full h-10 px-3 pr-8 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 hover:border-blue-400 bg-white shadow-sm appearance-none cursor-pointer"
              >
                <option value="">Chọn thời gian</option>
                {timeRangeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Khoảng ngày:</label>
            <div className="flex items-center gap-2 flex-nowrap">
               <input 
                 type="date" 
                 className="h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 hover:border-blue-400 bg-white shadow-sm"
                 value={startDateStr}
                 onChange={(e) => {
                    const val = e.target.value;
                    setStartDateStr(val);
                    setSelectedTimeRange("");
                    if (val && endDateStr) {
                       setTimeout(() => handeleGetMapData(selectedYear, "", val, endDateStr), 100);
                    }
                 }}
               />
               <span className="text-slate-400">-</span>
               <input 
                 type="date" 
                 className="h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 hover:border-blue-400 bg-white shadow-sm"
                 value={endDateStr}
                 onChange={(e) => {
                    const val = e.target.value;
                    setEndDateStr(val);
                    setSelectedTimeRange("");
                    if (startDateStr && val) {
                       setTimeout(() => handeleGetMapData(selectedYear, "", startDateStr, val), 100);
                    }
                 }}
               />
            </div>
          </div>

          <Button 
            isIconOnly 
            color="primary" 
            variant="primary" 
            className="w-10 h-10 min-w-10 shadow-md hover:scale-105 transition-transform"
            onPress={() => {
              const current = new Date().getFullYear().toString();
              setSelectedYear(current);
              setSelectedTimeRange("");
              setStartDateStr("");
              setEndDateStr("");
              setTimeout(() => handeleGetMapData(current, "", "", ""), 100);
            }} 
            title="Tải lại dữ liệu"
          >
            <i className="fa-solid fa-arrows-rotate text-white text-lg"></i>
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-140px)] w-full overflow-hidden rounded-xl border border-slate-200 shadow-xl bg-white relative">
        <Map center={{ lat: 9.2184657, lng: 105.2668833 }} zoom={9.6} data={dataMap || []} statusList={{}} options={{}} />
      </div>
    </div>
  );
};

export default BanDo;
