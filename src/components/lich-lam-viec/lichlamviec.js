import React, { useEffect, useState } from "react"
import styles from "./lichlamviec.module.scss"
import { proxyService } from "@/utilities/proxyServices"
import { useRouter } from "next/router"
import LichLamViecVnpt from "./LichLamViecVnpt"
import moment from "moment"

export const LichLamViecComponent = ({ style, className, name, maxHeight }) => {
  const router = useRouter()
  const [scheduleScope, setScheduleScope] = useState()
  const [scheduleUnitList, setScheduleUnitList] = useState({})
  const [selectedUnitId, setSelectedUnitId] = useState(null)
  const [workScheduleData, setWorkScheduleData] = useState([])
  const [workScheduleDataVnpt, setWorkScheduleDataVnpt] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [danhMucPhanLoai, setDanhMucPhanLoai] = useState([])
  const [showAllUnits, setShowAllUnits] = useState(false)
  const [firstLoad, setFirstLoad] = useState(false)
  const isFullScreen = style?.maxWidth == "100%"
  const maxPagePerLoad = 10
  const maxVisibleUnitChips = 15

  const fetchDanhMucDungChung = async () => {
    try {
      const res = await proxyService.get("/api/app/danh-muc/phan-cap", {
        isActive: true,
        SkipCount: 0,
        MaxResultCount: 25,
        Ma: "PhanLoaiDonVi",
      })

      if (res && res?.data?.items && res.data.items.length > 0) {
        setDanhMucPhanLoai(res.data.items[0].childs.sort((a, b) => b.ten.localeCompare(a.ten)))

        // Nếu chưa chọn phạm vi, chọn phạm vi đầu tiên làm mặc định
        if (!scheduleScope) {
          setScheduleScope(res.data.items[0].childs[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching common categories:", error)
    }
  }

  const fetchDanhMucDonVi = async (scope) => {
    try {
      if (scheduleUnitList[scope] && scheduleUnitList[scope].length > 0) {
        return // Đã tải dữ liệu cho phạm vi này rồi
      }

      let unitList = { ...scheduleUnitList }
      unitList[scope] = []

      // const res = await proxyService.get("/api/app/organization-unit/phan-cap-fe", {
      //   isActive: true,
      //   chucNangXuLy: "LichLamViec",
      //   phanLoai: scope,
      // })

      const vnptUnits = (await proxyService.get("/api/app/work-schedule/vnpt-unit"))?.data
      if (vnptUnits) {
        vnptUnits.forEach((unit) => {
          unitList[scope].push({ id: unit.id, name: unit.name, externalApi: true, code: unit.id })
        })
      }
      setScheduleUnitList(unitList)

      if (!selectedUnitId) {
        // Kiểm tra nếu có tham số ma-don-vi trong URL thì chọn đơn vị tương ứng
        if (router?.pathname == "/lich-lam-viec" && router?.query["ma-don-vi"] && !firstLoad) {
          let found = false
          let maDonVi = router.query["ma-don-vi"]
          let scopeKeysList = Object.keys(unitList)

          // Tìm mã đơn vị trong tất cả các loại phạm vi
          for (let index = 0; index < scopeKeysList.length; index++) {
            const scopeUnit = unitList[scopeKeysList[index]]
            if (!scopeUnit || scopeUnit.length == 0) continue
            for (let j = 0; j < scopeUnit.length; j++) {
              const unit = scopeUnit[j]

              if (unit.code == maDonVi) {
                setScheduleScope(scope)
                setSelectedUnitId(unit.id)
                found = true
                setFirstLoad(true)
                break
              }
            }
            if (found) break
          }

          // Trường hợp không tìm thấy mã đơn vị trong danh sách => gọi lại với scope tiếp theo
          if (!found && danhMucPhanLoai.length > 1) {
            await fetchDanhMucDonVi(danhMucPhanLoai[1].id)
          }
        } else {
          setSelectedUnitId(unitList[scope][0]?.id)
          if (router && router?.pathname == "/lich-lam-viec") {
            const queryParams = new URLSearchParams(router.query)
            queryParams.set("ma-don-vi", unitList[scope][0]?.code || "")
            router.replace(`${router.pathname}?${queryParams.toString()}`, undefined, { shallow: true })
            setFirstLoad(true)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching organization units:", error)
    }
  }

  const fetchData = async (unitId, skipCount, maxResultCount) => {
    try {
      const res = await proxyService.get("/api/app/work-schedule", {
        isActive: true,
        organizationUnitId: unitId,
        skipCount: skipCount,
        maxResultCount: maxResultCount,
        sorting: "CreationTime desc",
      })

      if (res && res?.data) {
        setWorkScheduleData(res?.data)
      }
    } catch (error) {
      console.error("Error fetching work schedule data:", error)
    }
  }

  // Hàm kiểm tra người dùng đang dùng thiết bị di động hay máy tính để bàn
  const isMobileDevice = () => {
    // https://www.geeksforgeeks.org/javascript/how-to-detect-whether-the-website-is-being-opened-in-a-mobile-device-or-a-desktop-in-javascript/

    /* Storing user's device details in a variable*/
    let details = navigator.userAgent

    /* Creating a regular expression 
    containing some mobile devices keywords 
    to search it in details string*/
    let regexp = /android|iphone|kindle|ipad/i

    /* Using test() method to search regexp in details
    it returns boolean value*/
    let isMobileDevice = regexp.test(details)

    if (isMobileDevice) {
      return true
    } else {
      return false
    }
  }

  // Hàm tạo đường dẫn đầy đủ cho file
  const getFullFileUrl = (filePath) => {
    if (!filePath) return ""
    const baseUrl = process.env.NEXT_PUBLIC_ASSETS_URL
    return filePath.startsWith("http") ? filePath : `${baseUrl}${filePath}`
  }

  const handleScopeChange = (scope) => {
    setScheduleScope(scope)
    setSelectedUnitId(scheduleUnitList[scope]?.[0]?.id)
    setWorkScheduleData([])
    setCurrentPage(0)
    setShowAllUnits(false)
  }

  // Lấy danh sách đơn vị theo phạm vi hiện tại
  const unitsForScope = scheduleUnitList[scheduleScope] || []
  console.log(
    `%c[ERR #2 %c08:55:25]%c`,
    "color:#F44336;font-weight:bold",
    "color:#00E5FF;font-weight:bold",
    "color:inherit",
    `scheduleUnitList`,
    scheduleUnitList
  )

  const isExternalApiUnit = unitsForScope.find((unit) => unit.id === selectedUnitId)?.externalApi || false

  // Tính toán các đơn vị hiển thị dựa theo số lượng ký tự
  // ! có thể thêm chiều rộng parent để tính xem tối đa bao nhiêu ký tự có thể hiển thị
  const { visibleUnits, isUnitsOverflowing } = React.useMemo(() => {
    const CHARS_LIMIT_FOR_LINES = isFullScreen ? 620 : 300 // Giới hạn ký tự để hiển thị trong 3 dòng
    if (showAllUnits) return { visibleUnits: unitsForScope, isUnitsOverflowing: false }
    const arr = []
    let total = 0
    for (let i = 0; i < unitsForScope.length; i++) {
      const name = unitsForScope[i].name || ""
      // Nếu là chữ in hoa thì tính gấp rưỡi số ký tự
      const add = name.replace(/[^A-Z]/g, "").length * 1.5 + name.replace(/[A-Z]/g, "").length
      if (total + add > CHARS_LIMIT_FOR_LINES) break
      arr.push(unitsForScope[i])
      total += add
    }
    return { visibleUnits: arr, isUnitsOverflowing: arr.length < unitsForScope.length }
  }, [unitsForScope, showAllUnits])

  useEffect(() => {
    fetchDanhMucDungChung()
  }, [])

  useEffect(() => {
    if (scheduleScope && router.isReady) {
      fetchDanhMucDonVi(scheduleScope)
    }
  }, [scheduleScope])

  // useEffect(() => {
  //   fetchData(selectedUnitId);
  // }, [selectedUnitId]);

  const getCurrentWeekRange = () => {
    const now = new Date()

    const day = now.getDay() || 7 // Sunday = 7
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - day + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(0, 0, 0, 0)

    return {
      fromDate: startOfWeek.toISOString(),
      toDate: endOfWeek.toISOString(),
    }
  }

  useEffect(() => {
    if (workScheduleData.length - 1 <= currentPage && selectedUnitId) {
      const baseUnit = unitsForScope.find((unit) => unit.id === selectedUnitId)
      if (!baseUnit.externalApi) {
        fetchData(selectedUnitId, workScheduleData.length, maxPagePerLoad)
      } else {
        fetchVnpt(selectedUnitId)
      }
    }
  }, [currentPage, selectedUnitId])

  const fetchVnpt = async (unitId, fromDate, toDate) => {
    if (!fromDate || !toDate) {
      fromDate = getCurrentWeekRange().fromDate
      toDate = getCurrentWeekRange().toDate
    }

    try {
      const res = await proxyService.get(`/api/app/work-schedule/working-vnpt/`, {
        unitId: unitId,
        fromDate: moment(fromDate).format("YYYY-MM-DD"),
        toDate: moment(toDate).format("YYYY-MM-DD"),
      })

      if (res && res?.data) {
        setWorkScheduleDataVnpt(res?.data)
      }
    } catch (error) {
      console.error("Error fetching work schedule data:", error)
    }
  }

  return (
    <>
      <section className={`${styles.scheduleSection} ${className} h-full`} style={style}>
        <div className={styles.scheduleHeader}>
          <h2 className={styles.scheduleTitle}>{name || "Lịch làm việc"}</h2>
          {/* <div className="flex flex-row gap-1">
          </div> */}
        </div>

        <div className={styles.scheduleContent}>
          <div className={styles.scheduleUnitList}>
            {visibleUnits.length > 0 &&
              visibleUnits.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  className={`${styles.scheduleUnitChip} ${unit.id === selectedUnitId ? styles["scheduleUnitChip--active"] : ""}`}
                  onClick={() => {
                    if (router && router?.pathname == "/lich-lam-viec") {
                      const queryParams = new URLSearchParams(router.query)
                      queryParams.set("ma-don-vi", unit?.code || "")
                      router.replace(`${router.pathname}?${queryParams.toString()}`, undefined, { shallow: true })
                    }
                    setSelectedUnitId(unit.id)
                    setWorkScheduleData([])
                    setCurrentPage(0)
                  }}>
                  {unit.name}
                </button>
              ))}

            {(isUnitsOverflowing || unitsForScope.length > maxVisibleUnitChips) && (
              <button
                type="button"
                className={`${styles.scheduleUnitChip} ${styles["scheduleUnitChip--more"] || ""}`}
                onClick={() => setShowAllUnits(!showAllUnits)}>
                {showAllUnits ? (
                  <span>
                    <i className="pi pi-angle-double-left" style={{ fontSize: "0.8rem" }}></i> Thu gọn
                  </span>
                ) : (
                  `+${unitsForScope.length - visibleUnits.length} đơn vị`
                )}
              </button>
            )}

            {/* {scheduleUnitList && Object.keys(scheduleUnitList).length > 0 &&
              Object.entries(scheduleUnitList).map(([unitId, unitName]) => (
                <button
                  key={unitId}
                  type="button"
                  className={`${styles.scheduleUnitChip} ${unitId === selectedUnitId ? styles["scheduleUnitChip--active"] : ""
                    }`}
                  onClick={() => {
                    setSelectedUnitId(unitId);
                    setWorkScheduleData([]);
                    setCurrentPage(0);
                  }}>
                  {unitName}
                </button>
              ))
            } */}
          </div>

          {!isExternalApiUnit && (
            <div className={styles.scheduleControlsRow}>
              <button
                type="button"
                className={styles.scheduleNavBtn}
                style={{
                  visibility:
                    currentPage === workScheduleData.length - 1 || workScheduleData.length === 0 ? "hidden" : "visible",
                }}
                onClick={() => {
                  setCurrentPage(currentPage + 1)
                }}>
                <i className="pi pi-chevron-left"></i>
              </button>

              <div className={styles.scheduleWeekCenter}>
                <div className={styles.scheduleWeekDisplay}>
                  {workScheduleData?.[currentPage]?.title ?? "Chưa có lịch làm việc"}
                  {/* LỊCH LÀM VIỆC TUẦN CỦA TRƯỞNG BAN - PHÓ TRƯỞNG BAN (Từ ngày 10 tháng 11 năm 2025 đến ngày 14 tháng 11
                năm 2025) */}
                </div>
              </div>

              <button
                type="button"
                className={styles.scheduleNavBtn}
                style={{ visibility: currentPage === 0 ? "hidden" : "visible" }}
                onClick={() => {
                  setCurrentPage(currentPage - 1)
                }}>
                <i className="pi pi-chevron-right"></i>
              </button>
            </div>
          )}

          {isExternalApiUnit ? (
            <>
              <LichLamViecVnpt
                scheduleData={workScheduleDataVnpt}
                setScheduleData={setWorkScheduleDataVnpt}
                onChangeDate={({ from, to }) => {
                  fetchVnpt(selectedUnitId, from, to)
                }}
              />
            </>
          ) : (
            <>
              <div className={styles.scheduleImageWrap}>
                {workScheduleData?.[currentPage] && (
                  <>
                    {/* Trường hợp có tập tin đính kèm ưu tiên trước, đến đường dẫn và cuối cùng là nội dung */}
                    {workScheduleData[currentPage]?.attachedFileDetail?.[0] ? (
                      <>
                        {/* Trường hợp là file PDF và không phải thiết bị di động sẽ sử dụng trình đọc file PDF của trình duyệt để hiển thị */}
                        {workScheduleData[currentPage]?.attachedFileDetail?.[0]?.type == "application/pdf" &&
                        !isMobileDevice() ? (
                          <embed
                            src={
                              getFullFileUrl(workScheduleData[currentPage].attachedFileDetail[0].path) +
                              "#page=1&zoom=page-width&view=FitH"
                            }
                            style={{
                              border: 0,
                              width: "100%",
                              height: maxHeight ? `${maxHeight - 320}px` : isFullScreen ? "95vh" : "300px",
                            }}
                          />
                        ) : (
                          <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(getFullFileUrl(workScheduleData[currentPage].attachedFileDetail[0].path))}&embedded=true`}
                            style={{
                              border: 0,
                              width: "100%",
                              height: maxHeight ? `${maxHeight - 320}px` : isFullScreen ? "95vh" : "300px",
                            }}
                          />
                        )}
                      </>
                    ) : workScheduleData[currentPage]?.workScheduleLink &&
                      workScheduleData[currentPage]?.workScheduleLink !== "" ? (
                      // Trick lỏ che scrollbar iframe
                      <div
                        className="w-full"
                        style={{ height: maxHeight ? `${maxHeight - 320}px` : isFullScreen ? "95vh" : "300px" }}>
                        <iframe
                          src={workScheduleData[currentPage]?.workScheduleLink}
                          style={{ border: 0, width: "100%", height: "100%" }}
                        />
                      </div>
                    ) : (
                      <div
                        className="p-1 schedule-content-wrapper"
                        // LƯU Ý QUAN TRỌNG: Chỉ sử dụng thuộc tính này với dữ liệu ĐÁNG TIN CẬY!
                        dangerouslySetInnerHTML={{ __html: workScheduleData[currentPage]?.content || "" }}
                        style={{
                          minHeight: "25vh",
                          maxHeight: maxHeight ? `${maxHeight - 320}px` : isFullScreen ? "95vh" : "300px",
                          overflowY: "auto",
                          width: "100%",
                          maxWidth: "100%",
                        }}
                      />
                    )}

                    {/* Truong hop co duong dan uu tien truoc, den file va cuoi cung la noi dung */}
                    {/* {
                  :
                  workScheduleData[currentPage]?.attachedFileDetail?.[0] ?
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(getFullFileUrl(workScheduleData[currentPage].attachedFileDetail[0].path))}&embedded=true`}
                      style={{ border: 0, width: "100%", height: "60vh" }}
                    />
                  :
                  // Neu khong co duong dan hay file thi moi hien noi dung
                  <div
                    className="p-2"
                    // LƯU Ý QUAN TRỌNG: Chỉ sử dụng thuộc tính này với dữ liệu ĐÁNG TIN CẬY!
                    dangerouslySetInnerHTML={{ __html: workScheduleData[currentPage]?.content || "" }}
                    style={{ minHeight: "25vh" }}
                  />
                } */}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
