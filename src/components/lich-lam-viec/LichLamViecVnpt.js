import React, { useState } from "react"
import { Button } from "primereact/button"
import moment from "moment"
import "primereact/resources/themes/lara-light-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"
import styles from "./lichlamviec.module.scss"

const UI_THEMES = {
  corporate: {
    name: "🏢 Professional Corporate",
    pageBackground: "#f1f5f9",
    cardBackground: "#ffffff",
    cardBorder: "1px solid #e2e8f0",
    cardShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
    headerColor: "#446589",
    headerAccent: "#1e40af",
    tableHeaderBg: "rgb(75 135 234)",
    tableHeaderText: "#ffffff",
    tableBorder: "1px solid #cbd5e1",
    todayBg: "rgb(50 130 201)",
    todayText: "#ffffff",
    todayCellBg: "#eff6ff",
    morning: {
      icon: "pi pi-sun",
      color: "#1e40af",
      bg: "#eff6ff",
      border: "#1e40af",
      badgeBg: "#1e40af",
      badgeText: "#ffffff",
    },
    afternoon: {
      icon: "pi pi-clock",
      color: "#475569",
      bg: "#f8fafc",
      border: "#475569",
      badgeBg: "#475569",
      badgeText: "#ffffff",
    },
    location: { icon: "pi pi-map-marker", color: "#64748b" },
    participation: { icon: "pi pi-users", color: "#1e40af" },
    calendar: { icon: "pi pi-calendar", color: "#1e40af" },
  },
  glassmorphism: {
    name: "🌊 Modern Glassmorphism",
    pageBackground: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    cardBackground: "rgba(255, 255, 255, 0.15)",
    cardBorder: "1px solid rgba(255, 255, 255, 0.3)",
    cardShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    cardBackdrop: "blur(10px)",
    headerColor: "#ffffff",
    headerAccent: "#ffffff",
    tableHeaderBg: "rgba(255, 255, 255, 0.2)",
    tableHeaderText: "#ffffff",
    tableBorder: "1px solid rgba(255, 255, 255, 0.2)",
    todayBg: "rgba(255, 255, 255, 0.3)",
    todayText: "#ffffff",
    todayCellBg: "rgba(255, 255, 255, 0.1)",
    morning: {
      icon: "pi pi-sun",
      color: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.2)",
      border: "rgba(251, 191, 36, 0.5)",
      badgeBg: "rgba(251, 191, 36, 0.9)",
      badgeText: "#1e293b",
    },
    afternoon: {
      icon: "pi pi-clock",
      color: "#60a5fa",
      bg: "rgba(96, 165, 250, 0.2)",
      border: "rgba(96, 165, 250, 0.5)",
      badgeBg: "rgba(96, 165, 250, 0.9)",
      badgeText: "#1e293b",
    },
    location: { icon: "pi pi-map-marker", color: "#f472b6" },
    participation: { icon: "pi pi-users", color: "#a78bfa" },
    calendar: { icon: "pi pi-calendar", color: "#ffffff" },
  },
  gradient: {
    name: "🎨 Vibrant Gradient",
    pageBackground: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    cardBackground: "#ffffff",
    cardBorder: "none",
    cardShadow: "0 10px 40px rgba(245, 87, 108, 0.3)",
    headerColor: "#1e293b",
    headerAccent: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    tableHeaderBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    tableHeaderText: "#ffffff",
    tableBorder: "1px solid #e0e7ff",
    todayBg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    todayText: "#ffffff",
    todayCellBg: "#fef3f2",
    morning: {
      icon: "pi pi-sun",
      color: "#f59e0b",
      bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      border: "#f59e0b",
      badgeBg: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
      badgeText: "#ffffff",
    },
    afternoon: {
      icon: "pi pi-clock",
      color: "#8b5cf6",
      bg: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
      border: "#8b5cf6",
      badgeBg: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
      badgeText: "#ffffff",
    },
    location: { icon: "pi pi-map-marker", color: "#ec4899" },
    participation: { icon: "pi pi-users", color: "#3b82f6" },
    calendar: { icon: "pi pi-calendar", color: "#f5576c" },
  },
  dark: {
    name: "🌙 Elegant Dark Premium",
    pageBackground: "#0f172a",
    cardBackground: "#1e293b",
    cardBorder: "1px solid #334155",
    cardShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
    headerColor: "#f1f5f9",
    headerAccent: "#a78bfa",
    tableHeaderBg: "#334155",
    tableHeaderText: "#e0e7ff",
    tableBorder: "1px solid #475569",
    todayBg: "#8b5cf6",
    todayText: "#ffffff",
    todayCellBg: "#312e81",
    morning: {
      icon: "pi pi-sun",
      color: "#fbbf24",
      bg: "#422006",
      border: "#78350f",
      badgeBg: "#fbbf24",
      badgeText: "#1e293b",
    },
    afternoon: {
      icon: "pi pi-clock",
      color: "#60a5fa",
      bg: "#1e3a8a",
      border: "#1e40af",
      badgeBg: "#60a5fa",
      badgeText: "#1e293b",
    },
    location: { icon: "pi pi-map-marker", color: "#f472b6" },
    participation: { icon: "pi pi-users", color: "#a78bfa" },
    calendar: { icon: "pi pi-calendar", color: "#a78bfa" },
  },
  minimal: {
    name: "📋 Clean Minimalist",
    pageBackground: "#fafafa",
    cardBackground: "#ffffff",
    cardBorder: "1px solid #e5e5e5",
    cardShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    headerColor: "#171717",
    headerAccent: "#404040",
    tableHeaderBg: "#fafafa",
    tableHeaderText: "#171717",
    tableBorder: "1px solid #e5e5e5",
    todayBg: "#e5e5e5",
    todayText: "#171717",
    todayCellBg: "#fafafa",
    morning: {
      icon: "pi pi-sun",
      color: "#737373",
      bg: "#fafafa",
      border: "#d4d4d4",
      badgeBg: "#171717",
      badgeText: "#ffffff",
    },
    afternoon: {
      icon: "pi pi-clock",
      color: "#737373",
      bg: "#f5f5f5",
      border: "#d4d4d4",
      badgeBg: "#525252",
      badgeText: "#ffffff",
    },
    location: { icon: "pi pi-map-marker", color: "#737373" },
    participation: { icon: "pi pi-users", color: "#525252" },
    calendar: { icon: "pi pi-calendar", color: "#171717" },
  },
}

const LichLamViecVnpt = ({ scheduleData, onChangeDate }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date())
  const [currentTheme, setCurrentTheme] = useState("corporate")

  const theme = UI_THEMES[currentTheme]

  // Get Monday of current week
  const getMondayOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Get week dates (Mon-Sun)
  const getWeekDates = (startDate) => {
    const dates = []
    const monday = getMondayOfWeek(startDate)
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  // Get Vietnamese day name
  const getVietnameseDayName = (date) => {
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    return dayNames[date.getDay()]
  }

  // Get week range text
  const getWeekRangeText = () => {
    const weekDates = getWeekDates(currentWeekStart)
    const firstDate = weekDates[0]
    const lastDate = weekDates[6]
    return `${moment(firstDate).format("DD/MM/YYYY")} - ${moment(lastDate).format("DD/MM/YYYY")}`
  }

  // Format date to dd/MM/yyyy
  const formatDateToDDMMYYYY = (date) => {
    return moment(date).format("DD/MM/YYYY")
  }

  // Get unique bosses from schedule data
  const getUniqueBosses = () => {
    const schedule = scheduleData
    const bossesMap = new Map()

    schedule.forEach((daySchedule) => {
      daySchedule.scheduleBosses?.forEach((boss) => {
        if (!bossesMap.has(boss.username)) {
          bossesMap.set(boss.username, { username: boss.username, position: boss.position })
        }
      })
    })

    const bosses = Array.from(bossesMap.values())
    if (bosses.length === 0) {
      return [{ username: "", position: "" }]
    }
    return bosses
  }

  // Get schedule for specific boss and date
  const getBossScheduleForDate = (bossUsername, dateStr) => {
    const schedule = scheduleData
    const daySchedule = schedule.find((d) => d.date === dateStr)
    if (!daySchedule) return null

    const bossSchedule = daySchedule.scheduleBosses?.find((b) => b.username === bossUsername)
    return bossSchedule
  }

  // Get schedule for specific boss, date, and time period
  const getBossScheduleByTimePeriod = (bossUsername, dateStr, timePeriod) => {
    const bossSchedule = getBossScheduleForDate(bossUsername, dateStr)
    if (!bossSchedule || !bossSchedule.parameters) return []

    return bossSchedule.parameters.filter((param) => param.codeTime === timePeriod)
  }

  const generateStarEndDatesOfWeek = (date) => {
    const weekDates = getWeekDates(date)
    return {
      from: weekDates[0],
      to: weekDates[6],
    }
  }
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 6)
    if (onChangeDate) {
      onChangeDate(generateStarEndDatesOfWeek(newDate))
    }

    setCurrentWeekStart(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 6)
    setCurrentWeekStart(newDate)
    if (onChangeDate) {
      onChangeDate(generateStarEndDatesOfWeek(newDate))
    }
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date())
    if (onChangeDate) {
      onChangeDate(generateStarEndDatesOfWeek(new Date()))
    }
  }
  const weekStart = moment(currentWeekStart).startOf("week").add(1, "day") // Monday
  const weekEnd = weekStart.clone().add(6, "days").endOf("day")

  return (
    scheduleData && (
      <div>
        <div
          style={{
            backgroundColor: theme.cardBackground,
            border: theme.cardBorder,
            borderRadius: "6px",
            boxShadow: theme.cardShadow,
            backdropFilter: theme.cardBackdrop,
            padding: "12px 16px",
          }}>
          <div style={{ marginBottom: "16px" }}>
            <div className={styles.scheduleNavigationWrapper}>
              <Button
                icon="pi pi-chevron-left"
                onClick={goToPreviousWeek}
                className={styles.prevButton}
                style={{
                  border: theme.tableBorder,
                  color: theme.headerColor,
                  backgroundColor: theme.cardBackground,
                  fontWeight: "600",
                  padding: "6px 10px",
                }}
                size="small"
              />
              <div className={styles.navigationCenter}>
                <div
                  className={styles.weekRangeDisplay}
                  style={{
                    background:
                      typeof theme.todayBg === "string" && theme.todayBg.startsWith("linear")
                        ? theme.todayBg
                        : theme.todayBg,
                    border: `1px solid ${typeof theme.todayBg === "string" && theme.todayBg.startsWith("linear") ? "transparent" : theme.todayBg}`,
                    color: theme.todayText,
                  }}>
                  {getWeekRangeText()}
                </div>
                <Button
                  className={styles.currentWeekButton}
                  label="Tuần hiện tại"
                  onClick={goToCurrentWeek}
                  disabled={moment().isBetween(weekStart, weekEnd, null, "[]")}
                  style={{
                    border: theme.tableBorder,
                    color: theme.headerColor,
                    backgroundColor: theme.cardBackground,
                    fontWeight: "600",
                    fontSize: "0.8rem",
                    padding: "6px 10px",
                  }}
                  size="small"
                />
              </div>
              <Button
                icon="pi pi-chevron-right"
                onClick={goToNextWeek}
                className={styles.nextButton}
                style={{
                  border: theme.tableBorder,
                  color: theme.headerColor,
                  backgroundColor: theme.cardBackground,
                  fontWeight: "600",
                  padding: "6px 10px",
                }}
                size="small"
              />
            </div>
          </div>

          <div style={{ overflowX: "auto", border: "1px solid #ccc" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px",
                fontFamily: "Times New Roman, serif",
              }}>
              <thead>
                <tr style={{ background: currentTheme.headerAccent, color: theme.tableHeaderText }}>
                  <th
                    style={{
                      padding: "8px",
                      border: "1px solid #000",
                      fontWeight: "bold",
                      textAlign: "center",
                      width: "80px",
                      background: theme.tableHeaderBg,
                      color: theme.tableHeaderText,
                      fontSize: "15px",
                    }}>
                    Buổi
                  </th>
                  {getUniqueBosses().map((boss, idx) => (
                    <th
                      key={idx}
                      style={{
                        padding: "8px",
                        border: "1px solid #000",
                        fontWeight: "bold",
                        textAlign: "center",
                        background: theme.tableHeaderBg,
                        color: theme.tableHeaderText,
                        minWidth: "200px",
                        fontSize: "15px",
                      }}>
                      <div style={{ fontSize: "15px", fontWeight: "bold", textTransform: "uppercase" }}>
                        {boss.username}
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: "normal", fontStyle: "italic" }}>{boss.position}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getWeekDates(currentWeekStart).map((date, dateIdx) => {
                  const dateStr = formatDateToDDMMYYYY(date)
                  const dayName = getVietnameseDayName(date)
                  const formattedDate = moment(date).format("DD/MM/YYYY")
                  const isToday = date.toDateString() === new Date().toDateString()
                  const rowBg = isToday ? "#ffffcc" : "#fff"
                  const headerBg = isToday ? "#ffffcc" : "#dbeafe"

                  return (
                    <React.Fragment key={dateIdx}>
                      {/* Date Header Row */}
                      <tr style={{ background: "#f9f9f9" }}>
                        <td
                          colSpan={getUniqueBosses().length + 1}
                          style={{
                            padding: "8px 12px",
                            border: "1px solid #000",
                            fontWeight: "bold",
                            background: headerBg,
                            color: "#000",
                            fontSize: "14px",
                            textAlign: "left",
                          }}>
                          {dayName}, ngày {formattedDate}
                        </td>
                      </tr>

                      {/* Morning Row */}
                      <tr>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #000",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontWeight: "bold",
                            background: rowBg,
                            color: "#000",
                          }}>
                          Sáng
                        </td>
                        {getUniqueBosses().map((boss, bossIdx) => {
                          const sangActivities = getBossScheduleByTimePeriod(boss.username, dateStr, "SANG")
                          return (
                            <td
                              key={bossIdx}
                              style={{
                                padding: "8px",
                                border: "1px solid #000",
                                verticalAlign: "top",
                                background: rowBg,
                                color: "#000",
                              }}>
                              {sangActivities.map((param, paramIdx) => (
                                <div
                                  key={paramIdx}
                                  style={{
                                    marginBottom: "8px",
                                    paddingBottom: paramIdx < sangActivities.length - 1 ? "8px" : "0",
                                    borderBottom: paramIdx < sangActivities.length - 1 ? "1px dashed #ccc" : "none",
                                  }}>
                                  <div style={{ marginBottom: "4px" }}>{param.content}</div>
                                  {param.place && <div>Tại: {param.place}</div>}
                                  {param.participation && <div>Thành phần: {param.participation}</div>}
                                </div>
                              ))}
                            </td>
                          )
                        })}
                      </tr>

                      {/* Afternoon Row */}
                      <tr>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #000",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontWeight: "bold",
                            background: rowBg,
                            color: "#000",
                          }}>
                          Chiều
                        </td>
                        {getUniqueBosses().map((boss, bossIdx) => {
                          const chieuActivities = getBossScheduleByTimePeriod(boss.username, dateStr, "CHIEU")
                          return (
                            <td
                              key={bossIdx}
                              style={{
                                padding: "8px",
                                border: "1px solid #000",
                                verticalAlign: "top",
                                background: rowBg,
                                color: "#000",
                              }}>
                              {chieuActivities.map((param, paramIdx) => (
                                <div
                                  key={paramIdx}
                                  style={{
                                    marginBottom: "8px",
                                    paddingBottom: paramIdx < chieuActivities.length - 1 ? "8px" : "0",
                                    borderBottom: paramIdx < chieuActivities.length - 1 ? "1px dashed #ccc" : "none",
                                  }}>
                                  <div style={{ marginBottom: "4px" }}>{param.content}</div>
                                  {param.place && <div>Tại: {param.place}</div>}
                                  {param.participation && <div>Thành phần: {param.participation}</div>}
                                </div>
                              ))}
                            </td>
                          )
                        })}
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  )
}

export default LichLamViecVnpt
