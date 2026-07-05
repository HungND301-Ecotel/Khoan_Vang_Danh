import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ReportSidebar from "./components/ReportSidebar";

const NAVBAR_HEIGHT = 100; // khớp AppBar height trong MainLayout
const SIDEBAR_WIDTH = 280;

export default function ReportLayout() {
  const wrapperRef = useRef<HTMLDivElement>(null); // vị trí gốc của sidebar trong layout
  const [fixedStyle, setFixedStyle] = useState<{
    isFixed: boolean;
    left: number;
    width: number;
  }>({ isFixed: false, left: 0, width: SIDEBAR_WIDTH });

  useEffect(() => {
    const handleScroll = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();

      if (rect.top <= NAVBAR_HEIGHT) {
        setFixedStyle({
          isFixed: true,
          left: rect.left,
          width: rect.width,
        });
      } else {
        setFixedStyle((prev) =>
          prev.isFixed ? { ...prev, isFixed: false } : prev,
        );
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        gap: 3,
        boxSizing: "border-box",
        alignItems: "flex-start",
      }}
    >
      {/* Sidebar wrapper - giữ chỗ trống đúng bằng kích thước sidebar để layout không bị nhảy khi chuyển sang fixed */}
      <Box
        ref={wrapperRef}
        sx={{
          flexShrink: 0,
          width: SIDEBAR_WIDTH,
          alignSelf: "stretch",
        }}
      >
        <Box
          sx={
            fixedStyle.isFixed
              ? {
                  position: "fixed",
                  top: NAVBAR_HEIGHT,
                  left: fixedStyle.left,
                  width: fixedStyle.width,
                  zIndex: 10,
                }
              : {
                  position: "static",
                }
          }
        >
          <ReportSidebar />
        </Box>
      </Box>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flex: "1 1 0%",
          width: 0,
          minWidth: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
