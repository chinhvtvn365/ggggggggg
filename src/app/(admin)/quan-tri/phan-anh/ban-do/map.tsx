import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polygon,
  useLoadScript,
  MarkerClusterer,
  OverlayView,
} from "@react-google-maps/api"
import { Modal } from "@heroui/react"
import { useCallback, useState, useMemo, memo, useRef, useEffect } from "react"

const geoCaMau = require("../../../../../../public/GeoMap/geoCaMau.json")
const geoTinh = require("../../../../../../public/GeoMap/geoTinh.json")

const containerStyle = {
  width: "100%",
  height: "100%",
  flex: 1,
  position: "relative", // Thêm position
  zIndex: 1,
}
const modalMapStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "12px",
  overflow: "hidden",
}
// Mảng 64 màu cam gradient từ nhạt (#fff2c8) đến đậm (#755d00)
const COLOR_PALETTE = [
  "#FFF9E6",
  "#FFF7E0",
  "#FFF5DA",
  "#FFF3D4",
  "#FFF1CE",
  "#FFEFC8",
  "#FFEDC2",
  "#FFEBBC",
  "#FFE9B6",
  "#FFE7B0",
  "#FFE5AA",
  "#FFE3A4",
  "#FFE19E",
  "#FFDF98",
  "#FFDD92",
  "#FFDB8C",
  "#FFD986",
  "#FFD780",
  "#FFD57A",
  "#FFD374",
  "#FFD16E",
  "#FFCF68",
  "#FFCD62",
  "#FFCB5C",
  "#FFC956",
  "#FFC750",
  "#FFC54A",
  "#FFC344",
  "#FFC13E",
  "#FFBF38",
  "#FFBD32",
  "#FFBB2C",
  "#FFB926",
  "#FFB720",
  "#FFB51A",
  "#FFB314",
  "#FFB10E",
  "#FFAF08",
  "#FFAD02",
  "#FFA900",
  "#FFA500",
  "#FFA100",
  "#FF9D00",
  "#FF9900",
  "#FF9500",
  "#FF9100",
  "#FF8D00",
  "#FF8900",
  "#FF8500",
  "#FF8100",
  "#FF7D00",
  "#FF7900",
  "#FF7500",
  "#FF7100",
  "#FF6D00",
  "#FF6900",
  "#FF6500",
  "#FF6100",
  "#FF5D00",
  "#F55900",
  "#EB5500",
  "#E15100",
  "#D74D00",
  "#E65100",
]
const AnyReactComponent = ({ divComponent }) => {
  return (
    <div>
      <div className="hint">
        <div className="hint__content">{divComponent}</div>
      </div>
    </div>
  )
}
const XaLabel = memo(
  ({ tenXa, position }) => {
    const formatTenXa = useMemo(() => {
      const words = tenXa.split(" ")
      if (words.length <= 2) return tenXa

      const midPoint = Math.ceil(words.length / 2)
      const line1 = words.slice(0, midPoint).join(" ")
      const line2 = words.slice(midPoint).join(" ")

      return (
        <>
          <div>{line1}</div>
          <div>{line2}</div>
        </>
      )
    }, [tenXa])

    return (
      <OverlayView
        position={position}
        mapPaneName={OverlayView.OVERLAY_LAYER}
        getPixelPositionOffset={(width, height) => ({
          x: -(width / 2),
          y: -(height / 2),
        })}>
        <div
          className="xa-label"
          style={{
            position: "absolute",
            background: "transparent",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#000",
            // boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            transform: "translate3d(-50%, -50%, 0)", // Dùng translate3d để tối ưu GPU
            pointerEvents: "none",
            // border: "1.5px solid rgba(88, 134, 129, 0.4)",
            textAlign: "center",
            lineHeight: "1.3",
            minWidth: "80px",
            maxWidth: "120px",
            wordBreak: "keep-all",
            whiteSpace: "normal",
            userSelect: "none",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}>
          {formatTenXa}
        </div>
      </OverlayView>
    )
  },
  (prevProps, nextProps) => {
    // Chỉ re-render khi tenXa hoặc position thực sự thay đổi
    return (
      prevProps.tenXa === nextProps.tenXa &&
      prevProps.position.lat === nextProps.position.lat &&
      prevProps.position.lng === nextProps.position.lng
    )
  }
)
XaLabel.displayName = "XaLabel"

function Map({ center, zoom, data = [], statusList, options, loading = false }) {
  console.log(data[3])

  const [selected, setSelected] = useState(null)
  const [hoveredXa, setHoveredXa] = useState(null)
  const [selectedXa, setSelectedXa] = useState(null) // Xã được click
  const [showModal, setShowModal] = useState(false)
  const [mapRef, setMapRef] = useState(null)
  const [modalMapRef, setModalMapRef] = useState(null)
  const [currentZoom, setCurrentZoom] = useState(zoom || 10)
  const moveTimeoutRef = useRef(null)
  const mapContainerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hoveredMarker, setHoveredMarker] = useState(null) // Marker được hover
  const { dataMap, colorMap } = useMemo(() => {
    const map = {}
    const colors = {}

    // Tạo map data
    data?.forEach((item) => {
      map[item.maXa] = item
    })

    // Sort data theo value TĂNG dần (từ ít đến nhiều)
    const sortedData = [...(data || [])].sort((a, b) => a.value - b.value)

    // Gán màu cho từng xã (màu nhạt cho value nhỏ, đậm cho value lớn)
    sortedData.forEach((item, index) => {
      const colorIndex = Math.min(index, COLOR_PALETTE.length - 1)
      colors[item.maXa] = COLOR_PALETTE[colorIndex]
    })

    // Xử lý các xã có value bằng nhau - gán cùng màu
    for (let i = 0; i < sortedData.length; i++) {
      for (let j = i + 1; j < sortedData.length; j++) {
        if (sortedData[i].value === sortedData[j].value) {
          colors[sortedData[j].maXa] = colors[sortedData[i].maXa]
        } else {
          break
        }
      }
    }

    return { dataMap: map, colorMap: colors }
  }, [data])
  // Xử lý fullscreen
  const toggleFullscreen = useCallback(() => {
    const elem = mapContainerRef.current

    if (!document.fullscreenElement) {
      // Vào fullscreen
      if (elem.requestFullscreen) {
        elem.requestFullscreen()
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen()
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      // Thoát fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
      setIsFullscreen(false)
    }
  }, [])
  // Lắng nghe sự kiện fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("msfullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("msfullscreenchange", handleFullscreenChange)
    }
  }, [])
  // Hàm lấy màu theo mã xã
  const getColorByMaXa = useCallback(
    (maXa) => {
      return colorMap[maXa] || "transparent"
    },
    [colorMap]
  )
  const xaCenters = useMemo(() => {
    const centers = {}
    geoCaMau.features.forEach((feature) => {
      const maXa = feature.properties.ma_xa
      const coords = feature.geometry.coordinates[0][0]
      let totalLat = 0
      let totalLng = 0
      coords.forEach((coord) => {
        totalLng += coord[0]
        totalLat += coord[1]
      })
      centers[maXa] = {
        lat: totalLat / coords.length,
        lng: totalLng / coords.length,
      }
    })
    return centers
  }, [])
  // Bạn có thể tạo hàm helper này
  const formatTenXaString = (tenXa) => {
    const words = tenXa.split(" ")
    if (words.length <= 2) return tenXa

    const midPoint = Math.ceil(words.length / 2)
    const line1 = words.slice(0, midPoint).join(" ")
    const line2 = words.slice(midPoint).join(" ")
    return `${line1}\n${line2}` // Dùng \n để xuống dòng
  }
  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
      }
    }
  }, [])
  const getXaCenter = useCallback(
    (maXa) => {
      return xaCenters[maXa] || null
    },
    [xaCenters]
  )
  const getXaInfo = useCallback(
    (maXa) => {
      const feature = geoCaMau.features.find((f) => f.properties.ma_xa === maXa)
      if (!feature) return null

      const xaData = dataMap[maXa]
      return {
        maXa: maXa,
        ten_xa: feature.properties.ten_xa || "",
        value: xaData?.value || 0,
        location: xaData?.location || [],
        coordinates: feature.geometry.coordinates[0][0], // Tọa độ polygon xã
      }
    },
    [dataMap]
  )
  // Xử lý click vào polygon xã
  const onPolygonClick = useCallback(
    (maXa) => {
      console.log("🔍 Clicked vào xã:", maXa)

      const xaInfo = getXaInfo(maXa)
      if (!xaInfo) {
        console.warn("⚠️ Không tìm thấy thông tin xã:", maXa)
        return
      }

      console.log("📊 Thông tin xã:", xaInfo)

      const xaCenter = getXaCenter(maXa)
      if (xaCenter && mapRef) {
        mapRef.panTo(xaCenter)
      }

      setSelectedXa(xaInfo)
      setShowModal(true)
    },
    [dataMap, getXaCenter, getXaInfo, mapRef]
  )

  const onMarkerHover = useCallback((item) => {
    setSelected(item)
  }, [])

  const onMarkerOut = useCallback(() => {
    setSelected(null)
  }, [])

  const onPolygonMouseOver = useCallback((maXa) => {
    setHoveredXa(maXa)
  }, [])

  const onPolygonMouseOut = useCallback(() => {
    setHoveredXa(null)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setSelectedXa(null)
  }, [])

  const onLocationMarkerHover = useCallback((locationData) => {
    setHoveredMarker(locationData)
  }, [])

  const onLocationMarkerOut = useCallback(() => {
    setHoveredMarker(null)
  }, [])

  const getIconSize = () => {
    if (window.google && window.google.maps && window.google.maps.Size) {
      return new window.google.maps.Size(40, 40)
    }
    return undefined
  }

  const clusterOptions = {
    imagePath: "/GeoMap/icongooglemap/m",
    gridSize: 80,
    maxZoom: 14,
  }

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLEMAP_KEY,
  })
  const mapStyles = [
    {
      featureType: "poi", // Tắt tên các địa điểm (Points of Interest)
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative", // Tắt tên các đơn vị hành chính (xã, phường, quận...)
      elementType: "labels.text",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit", // Tắt tên các trạm phương tiện công cộng
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    // ✅ THÊM CÁC DÒNG SAU ĐỂ ẨN RANH GIỚI, SÔNG, HỒ
    {
      featureType: "administrative.province", // Ẩn ranh giới tỉnh
      elementType: "geometry.stroke",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.locality", // Ẩn ranh giới huyện/thành phố
      elementType: "geometry.stroke",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.neighborhood", // Ẩn ranh giới xã/phường
      elementType: "geometry.stroke",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road", // Ẩn tất cả các loại đường
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road.highway", // Ẩn quốc lộ/cao tốc
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road.arterial", // Ẩn đường chính
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road.local", // Ẩn đường địa phương
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ]
  if (!isLoaded) return <div>Loading...</div>
  const defaultOptions = {
    gestureHandling: "greedy", // Cho phép tương tác mượt
    clickableIcons: true,
    disableDoubleClickZoom: false,
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    zoomControl: true,
    styles: mapStyles,
    ...options, // Merge với options từ props
  }

  return (
    <>
      <div ref={mapContainerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
       
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom || 10}
          options={defaultOptions}
          onLoad={(map) => {
            setMapRef(map)
            setCurrentZoom(map.getZoom())
          }}
          onZoomChanged={() => {
            if (mapRef) {
              setCurrentZoom(mapRef.getZoom())
            }
          }}>
          {geoCaMau.features.map((feature, index) => {
            const maXa = feature.properties.ma_xa
            const fillColor = getColorByMaXa(maXa)
            const isHovered = hoveredXa === maXa
            const isSelected = selectedXa?.maXa === maXa
            const tenXa = feature.properties.ten_xa || ""
            const xaCenter = xaCenters[maXa]
            const showLabel = xaCenter && !isHovered && !isSelected
            return (
              <div key={`xa-${maXa}`}>
                <Polygon
                  paths={feature.geometry.coordinates[0].map((polygon) =>
                    polygon.map((coord) => ({
                      lat: coord[1],
                      lng: coord[0],
                    }))
                  )}
                  options={{
                    strokeColor: isSelected || isHovered ? "#0acdcb" : "#89a5a5ff",
                    fillColor: fillColor,
                    fillOpacity: fillColor === "transparent" ? 0 : 0.75,
                    strokeWeight: isSelected || isHovered ? 3 : 1,
                    strokeOpacity: 0.9,
                    clickable: true,
                    zIndex: isSelected ? 100 : 1,
                  }}
                  onMouseOver={() => onPolygonMouseOver(maXa)}
                  onMouseOut={() => onPolygonMouseOut()}
                  onClick={() => onPolygonClick(maXa)}
                />
                {showLabel && currentZoom >= 10 && (
                  <Marker
                    position={xaCenter}
                    clickable={false}
                    icon={{
                      url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                    }}
                    label={{
                      text: formatTenXaString(tenXa),
                      fontWeight: "500",
                      fontSize: "11px",
                      className: "gmap-xa-label-native",
                      position: "absolute",
                      background: "transparent",
                      padding: "6px 10px",
                      color: "rgba(0, 75, 145, 1)",
                      textAlign: "center",
                      userSelect: "none",
                      textShadow:
                        "0px 0px 3px rgba(102, 8, 8, 1), 0px 0px 5px rgba(102, 8, 8, 1), 0px 0px 7px rgba(102, 8, 8, 1)",
                      WebkitFontSmoothing: "antialiased",
                      MozOsxFontSmoothing: "grayscale",
                      willChange: "transform",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      wordBreak: "break-word",
                    }}
                  />
                )}
              </div>
            )
          })}

          {/* Vẽ polygon tỉnh */}
          {geoTinh?.features?.map((feature, index) => {
            const coordinates =
              feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates]

            return coordinates.map((polygon, polyIndex) => (
              <Polygon
                key={`tinh-${index}-${polyIndex}`}
                paths={polygon[0].map((coord) => ({
                  lat: coord[1],
                  lng: coord[0],
                }))}
                options={{
                  strokeColor: "#89a5a5ff",
                  fillColor: "transparent",
                  strokeWeight: 1,
                  strokeOpacity: 0.8,
                  clickable: false, // Không cho click vào polygon tỉnh
                  zIndex: 0,
                }}
              />
            ))
          })}

          {/* Hiển thị InfoWindow khi hover vào xã */}
          {hoveredXa && (
            <InfoWindow
              position={getXaCenter(hoveredXa)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -10),
                disableAutoPan: true,
              }}>
              <div style={{ padding: "10px 12px", minWidth: "150px" }}>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "bold", color: "#1a6e63" }}>
                  {getXaInfo(hoveredXa)?.ten_xa || ""}
                </h4>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#64748b" }}>
                  Số phản ánh:{" "}
                  <strong style={{ color: "#1a6e63", fontSize: "14px" }}>{dataMap[hoveredXa]?.value || 0}</strong>
                </p>
              </div>
            </InfoWindow>
          )}

          {/* Hiển thị markers các tọa độ phản ánh của xã được chọn */}
          {selectedXa?.location && (
            <>
              {selectedXa.location.map((loc, idx) => {
                const [lat, lng] = loc.coordinates.split(",").map((s) => parseFloat(s.trim()))
                return (
                  <Marker
                    key={`location-${idx}`}
                    position={{ lat, lng }}
                    icon={{
                      url: "/layout/images/marker-complaint.png",
                      scaledSize: new window.google.maps.Size(32, 32),
                    }}
                    title={`Phản ánh`}
                    onMouseOver={() => onLocationMarkerHover(loc)}
                    onMouseOut={onLocationMarkerOut}
                  />
                )
              })}
            </>
          )}

          {/* InfoWindow cho marker được hover */}
          {hoveredMarker && (
            <InfoWindow
              position={{
                lat: parseFloat(hoveredMarker.coordinates.split(",")[0]),
                lng: parseFloat(hoveredMarker.coordinates.split(",")[1]),
              }}
              options={{
                pixelOffset: new window.google.maps.Size(0, -32),
                disableAutoPan: true,
              }}
              onCloseClick={onLocationMarkerOut}>
              <div style={{ padding: "12px 14px", minWidth: "250px", maxWidth: "350px" }}>
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#1a6e63",
                    borderBottom: "2px solid #0acdcb",
                    paddingBottom: "6px",
                  }}>
                  Thông tin phản ánh
                </h4>
                <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                  <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                    <strong style={{ color: "#475569", minWidth: "90px" }}>Nội dung:</strong>
                    <span
                      style={{
                        color: "#64748b",
                        flex: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                      {hoveredMarker.noiDung || "N/A"}
                    </span>
                  </p>
                  <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                    <strong style={{ color: "#475569", minWidth: "90px" }}>Người gửi:</strong>
                    <span style={{ color: "#64748b" }}>{hoveredMarker.nguoiGui || "N/A"}</span>
                  </p>
                  <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                    <strong style={{ color: "#475569", minWidth: "90px" }}>Số ĐT:</strong>
                    <span style={{ color: "#64748b" }}>{hoveredMarker.soDienThoai || "N/A"}</span>
                  </p>
                  <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                    <strong style={{ color: "#475569", minWidth: "90px" }}>Địa chỉ:</strong>
                    <span style={{ color: "#64748b", flex: 1 }}>{hoveredMarker.diaChi || "N/A"}</span>
                  </p>
                  <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                    <strong style={{ color: "#475569", minWidth: "90px" }}>Ngày gửi:</strong>
                    <span style={{ color: "#64748b" }}>
                      {hoveredMarker.ngayGui ? new Date(hoveredMarker.ngayGui).toLocaleString("vi-VN") : "N/A"}
                    </span>
                  </p>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Markers (nếu có) */}
          {!loading && data.length > 0 && (
            <MarkerClusterer options={clusterOptions}>
              {(clusterer) =>
                data
                  ?.filter((item) => item.lat && item.lng)
                  .map((item, index) => {
                    return (
                      <Marker
                        key={index}
                        position={{ lat: item.lat, lng: item.lng }}
                        clusterer={clusterer}
                        onMouseOver={() => onMarkerHover(item)}
                        onMouseOut={() => onMarkerOut()}
                        onClick={() => window.open(`https://maps.google.com?q=${item.lat},${item.lng}`)}
                        icon={{
                          url:
                            item.loaiThietBi === "radio"
                              ? statusList[item.maThietbi?.replaceAll(":", "_")]
                                ? "/layout/images/location_radio_green.png"
                                : "/layout/images/location_radio_red.png"
                              : "/layout/images/location_board_red.png",
                          scaledSize: getIconSize(),
                        }}>
                        {selected === item && (
                          <InfoWindow>
                            <AnyReactComponent
                              id={item.maThietbi}
                              macAddress={item.maThietbi}
                              lat={item.lat}
                              lng={item.lng}
                              divComponent={item.divComponent}
                              statusList={statusList}
                            />
                          </InfoWindow>
                        )}
                      </Marker>
                    )
                  })
              }
            </MarkerClusterer>
          )}
        </GoogleMap>
      </div>
      {/* Modal hiển thị chi tiết xã */}
      <Modal
        isOpen={showModal}
        onOpenChange={(open) => !open && closeModal()}
      >
        <Modal.Backdrop className="bg-black/80 z-[1000]">
          <Modal.Container className="items-center justify-center p-4 z-[1001]" placement="center">
            <Modal.Dialog className="bg-white rounded-2xl w-[90vw] h-[80vh] max-w-[1200px] flex flex-col shadow-2xl overflow-hidden relative">
              <Modal.CloseTrigger className="absolute top-4 right-4 z-[1003] text-white hover:text-red-300 transition-colors bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer" />
              <Modal.Header className="bg-gradient-to-r from-teal-500 to-teal-700 text-white p-4 shadow-md z-[1002]">
                <Modal.Heading className="text-xl font-bold truncate pr-10">
                  {selectedXa?.ten_xa}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="p-0 bg-gray-50 flex-1 relative overflow-auto">
        {selectedXa && (
          <>
            <div className="feedback-stats-mini">
              <div className="stat-mini stat-mini-total">
                {/* <i className="pi pi-inbox"></i> */}
                <span>Tổng số: {selectedXa?.value || 0}</span>
              </div>
              {/* <div className="stat-mini stat-mini-ontime">
                <span>Đúng hạn: {selectedXa?.duongHan || 0}</span>
              </div>
              <div className="stat-mini stat-mini-overdue">
                <span>Trễ hạn: {selectedXa?.treHan || 0}</span>
              </div> */}
            </div>

            <div className="map-modal__map h-full">
              <GoogleMap
                mapContainerStyle={modalMapStyle}
                center={getXaCenter(selectedXa.maXa)}
                zoom={12}
                options={defaultOptions}
                onLoad={(map) => setModalMapRef(map)}>
                {selectedXa.coordinates && selectedXa.coordinates.length > 0 && (
                  <Polygon
                    paths={selectedXa.coordinates.map((coord) => ({
                      lat: coord[1],
                      lng: coord[0],
                    }))}
                    options={{
                      strokeColor: "#89a5a5ff",
                      fillColor: getColorByMaXa(selectedXa.maXa),
                      fillOpacity: 0.4,
                      strokeWeight: 1,
                      strokeOpacity: 1,
                    }}
                  />
                )}

                {selectedXa.location && selectedXa.location.length > 0 && (
                  <>
                    {selectedXa.location.map((loc, idx) => {
                      const [lat, lng] = loc.coordinates.split(",").map((s) => parseFloat(s.trim()))
                      return (
                        <Marker
                          key={`modal-marker-${idx}`}
                          position={{ lat, lng }}
                          icon={{
                            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                            scaledSize: new window.google.maps.Size(32, 32),
                          }}
                          title={`Phản ánh`}
                          onClick={() => window.open(`https://maps.google.com?q=${lat},${lng}`, "_blank")}
                          onMouseOver={() => onLocationMarkerHover(loc)}
                          onMouseOut={onLocationMarkerOut}
                        />
                      )
                    })}
                  </>
                )}

                {/* InfoWindow cho marker trong modal */}
                {hoveredMarker && (
                  <InfoWindow
                    position={{
                      lat: parseFloat(hoveredMarker.coordinates.split(",")[0]),
                      lng: parseFloat(hoveredMarker.coordinates.split(",")[1]),
                    }}
                    options={{
                      pixelOffset: new window.google.maps.Size(0, -32),
                      disableAutoPan: true,
                    }}
                    onCloseClick={onLocationMarkerOut}>
                    <div style={{ padding: "12px 14px", minWidth: "250px", maxWidth: "350px", border: "none" }}>
                      <h4
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#1a6e63",
                          borderBottom: "2px solid #0acdcb",
                          paddingBottom: "6px",
                        }}>
                        Thông tin phản ánh
                      </h4>
                      <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                        <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                          <strong style={{ color: "#475569", minWidth: "90px" }}>Nội dung:</strong>
                          <strong
                            style={{
                              color: "#2f3b4b",
                              flex: 1,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            {hoveredMarker.noiDung || ""}
                          </strong>
                        </p>
                        <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                          <strong style={{ color: "#475569", minWidth: "90px" }}>Người gửi:</strong>
                          <strong style={{ color: "#2f3b4b" }}>{hoveredMarker.nguoiGui || ""}</strong>
                        </p>
                        <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                          <strong style={{ color: "#475569", minWidth: "90px" }}>Số ĐT:</strong>
                          <strong style={{ color: "#2f3b4b" }}>{hoveredMarker.soDienThoai || ""}</strong>
                        </p>
                        <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                          <strong style={{ color: "#475569", minWidth: "90px" }}>Địa chỉ:</strong>
                          <strong style={{ color: "#2f3b4b", flex: 1 }}>{hoveredMarker.diaChi || ""}</strong>
                        </p>
                        <p style={{ margin: "6px 0", display: "flex", gap: "6px" }}>
                          <strong style={{ color: "#475569", minWidth: "90px" }}>Ngày gửi:</strong>
                          <strong style={{ color: "#2f3b4b" }}>
                            {hoveredMarker.ngayGui ? new Date(hoveredMarker.ngayGui).toLocaleString("vi-VN") : ""}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          </>
        )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <style jsx>{`
        .map-modal__header {
          position: relative;
        }
        .feedback-stats-mini {
          position: absolute;
          top: 2rem;
          right: 5rem;
          z-index: 10;
          display: flex;
          gap: 0.5rem;
        }

        .stat-mini {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.6rem;
          background: white;
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
          font-size: 0.875rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .stat-mini:hover {
          transform: translateY(-2px);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
        }

        .stat-mini i {
          font-size: 1rem;
        }

        .stat-mini span {
          line-height: 1;
        }

        /* Màu cho từng loại */
        .stat-mini-total {
          color: #3b82f6;
        }

        .stat-mini-ontime {
          color: #10b981;
        }

        .stat-mini-overdue {
          color: #ec7717ff;
        }

        /* Ẩn nút đóng (X) trong InfoWindow */
        :global(.gm-style-iw-c button.gm-ui-hover-effect) {
          display: none !important;
        }

        :global(.gm-style-iw button[aria-label="Close"]) {
          display: none !important;
        }

        /* Điều chỉnh padding cho InfoWindow khi không có nút đóng */
        :global(.gm-style-iw-c) {
          padding: 0 !important;
        }

        :global(.gm-style-iw-d) {
          overflow: auto !important;
          max-width: none !important;
        }
        .map-fullscreen-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          background: white;
          border: none;
          border-radius: 6px;
          padding: 10px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #666;
        }

        .map-fullscreen-btn:hover {
          background: #f5f5f5;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
          color: #0acdcb;
        }

        .map-fullscreen-btn:active {
          transform: scale(0.95);
        }

        .map-fullscreen-btn:focus {
          outline: 2px solid #0acdcb;
          outline-offset: 2px;
        }

        /* Style khi fullscreen */
        :global(.map-fullscreen-btn svg) {
          width: 20px;
          height: 20px;
        }

        .map-modal__header {
          background: linear-gradient(135deg, #0acdcb 0%, #089d9b 100%) !important;
          color: white !important;
          padding: 1.5rem !important;
          border-radius: 16px 16px 0 0 !important;
        }

        .map-modal__header .p-dialog-title {
          color: white !important;
          font-size: 1.25rem !important;
          font-weight: 700 !important;
        }

        .map-modal__header .p-dialog-header-icon {
          color: white !important;
        }

        .map-modal__header .p-dialog-header-icon:hover {
          background: rgba(255, 255, 255, 0.2) !important;
        }

        /* Custom style cho Dialog content */
        .map-modal__content {
          padding: 1.5rem !important;
        }

        .info-value-highlight {
          color: #0acdcb;
          font-size: 1.5rem;
        }

        /* Map section */
        .map-modal__map h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #1e293b;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .map-modal__map h4::before {
          content: "";
          width: 4px;
          height: 20px;
          background: #0acdcb;
          border-radius: 2px;
        }
      `}</style>
    </>
  )
}

export default Map
