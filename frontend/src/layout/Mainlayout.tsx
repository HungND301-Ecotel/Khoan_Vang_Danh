import React, { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  CssBaseline,
  IconButton,
  Typography,
  Button,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import {
  BadgeRussianRuble,
  Boxes,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  FileChartColumn,
  LineChart,
} from "lucide-react";
import {
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  VpnKeyOutlined,
  Person2,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtoms";
import api from "../config/api.config";
import { PhaseOutputType } from "../types";
import { MainLayoutProps } from "../types";
import Profile from "../components/Profile/Profile";
import ChangePass from "../components/ChangePass/ChangePass";
import { systemConfigsAtom } from "../atoms/systemConfigAtoms";
import SystemConfigModal from "../components/SystemConfig/SystemConfigModal";
import {
  tabsAtom,
  activeTabIdAtom,
  ROUTE_TITLES,
  minimizedModalsAtom,
} from "../atoms/tabAtoms";
import FloatingMinimizeButton from "../components/Common/FloatingMinimizeButton";
import CloseIcon from "@mui/icons-material/Close";
import { showErrorAlert } from "../components/Alert";

const TabBar = () => {
  const [tabs, setTabs] = useAtom(tabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);
  const [, setMinimizedModals] = useAtom(minimizedModalsAtom);
  const navigate = useNavigate();

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    setMinimizedModals((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        navigate(newTabs[newTabs.length - 1].path);
      } else {
        navigate("/"); // Default fallback
      }
    }
  };

  if (tabs.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        overflowX: "auto",
        mb: 3,
        px: 2,
        py: 1.5,
        position: "sticky",
        top: "100px",
        zIndex: 99,
        bgcolor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        border: "1px solid rgba(255,255,255,0.5)",
        "&::-webkit-scrollbar": { height: "6px" },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: "#D1D5DB",
          borderRadius: "10px",
        },
        "&::-webkit-scrollbar-thumb:hover": { background: "#9CA3AF" },
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <Box
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2.5,
              py: 1,
              bgcolor: isActive ? "#EBF5FF" : "#FFFFFF",
              color: isActive ? "#0062CC" : "#4B5563",
              border: "1px solid",
              borderColor: isActive ? "#90CAF9" : "#E5E7EB",
              borderRadius: "24px",
              cursor: "pointer",
              flexShrink: 0,
              minWidth: "fit-content",
              maxWidth: "240px",
              fontWeight: isActive ? 600 : 500,
              transition: "all 0.2s ease-in-out",
              boxShadow: isActive
                ? "0 2px 8px rgba(0, 123, 255, 0.15)"
                : "0 1px 3px rgba(0,0,0,0.04)",
              "&:hover": {
                bgcolor: isActive ? "#EBF5FF" : "#F9FAFB",
                borderColor: isActive ? "#90CAF9" : "#D1D5DB",
                transform: "translateY(-1px)",
                boxShadow: isActive
                  ? "0 4px 12px rgba(0, 123, 255, 0.2)"
                  : "0 2px 6px rgba(0,0,0,0.06)",
              },
            }}
          >
            <Typography
              noWrap
              variant="body2"
              sx={{
                flexGrow: 1,
                mr: 1,
                fontSize: "13.5px",
                userSelect: "none",
              }}
            >
              {tab.title}
            </Typography>
            <Box
              onClick={(e) => handleCloseTab(e, tab.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                p: 0.4,
                color: isActive ? "#0062CC" : "#9CA3AF",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: isActive
                    ? "rgba(0, 98, 204, 0.12)"
                    : "rgba(0,0,0,0.08)",
                  color: isActive ? "#004B99" : "#4B5563",
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useAtom(userAtom);

  const [openProfile, setOpenProfile] = useState(false);
  const [openChangePass, setOpenChangePass] = useState(false);
  const [openSystemConfig, setOpenSystemConfig] = useState(false);
  const [systemConfigs, setSystemConfigs] = useAtom(systemConfigsAtom);

  const [menuDanhMucEl, setMenuDanhMucEl] = useState<HTMLElement | null>(null);
  const [menuDonGiaEl, setMenuDonGiaEl] = useState<HTMLElement | null>(null);
  const [menuThongKeEl, setMenuThongKeEl] = useState<HTMLElement | null>(null);
  const [menuSettingsEl, setMenuSettingsEl] = useState<HTMLElement | null>(
    null,
  );
  const [materialSubMenuEl, setMaterialSubMenuEl] =
    useState<null | HTMLElement>(null);


  const [tabs, setTabs] = useAtom(tabsAtom);
  const [, setActiveTabId] = useAtom(activeTabIdAtom);

  const maxTabsConfig = systemConfigs.find(
    (c) => c.key === "MAX_TABS_PER_USER",
  )?.value;
  const maxTabs = maxTabsConfig ? parseInt(maxTabsConfig, 10) : 7;

  const handleNavigate = (path: string) => {
    if (path === "/login" || path === "/") {
      navigate(path);
      return;
    }

    // Normalize path: /materialassignment → /materialassignment?type=in
    let normalizedPath = path;
    if (normalizedPath === "/materialassignment") {
      normalizedPath = "/materialassignment?type=in";
    }

    const existingTab = tabs.find((t) => t.id === normalizedPath);
    if (!existingTab && tabs.length >= maxTabs) {
      showErrorAlert(
        `Số lượng tab mở đã đạt giới hạn (tối đa ${maxTabs} tab). Vui lòng đóng bớt tab!`,
      );
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    // Normalize path: /materialassignment → /materialassignment?type=in
    let normalizedPath = location.pathname + location.search;
    if (normalizedPath === "/materialassignment") {
      normalizedPath = "/materialassignment?type=in";
    }

    setActiveTabId(normalizedPath);

    setTabs((prev) => {
      if (!prev.find((t) => t.id === normalizedPath)) {
        return [
          ...prev,
          {
            id: normalizedPath,
            path: normalizedPath,
            title: ROUTE_TITLES[normalizedPath] || "Tab mới",
          },
        ];
      }
      return prev;
    });
  }, [location.pathname, location.search, setActiveTabId, setTabs]);

  useEffect(() => {
    const fetchSystemConfigs = async () => {
      try {
        const res = await api.get("/system-configs");
        setSystemConfigs(res.data.data);
      } catch (error) {
        console.error("Lỗi khi fetch cấu hình hệ thống:", error);
      }
    };
    fetchSystemConfigs();
  }, [setSystemConfigs]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        maxHeight: "100",
        bgcolor: "background.default",
      }}
    >
      <CssBaseline />

      <AppBar
        position="fixed"
        color="default"
        elevation={5}
        sx={{
          bgcolor: "background.paper",
          height: 100,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Toolbar
          sx={{ gap: 4, height: 100, display: "flex", alignItems: "center" }}
        >
          <img src="/logo.png" style={{ width: 120.5 }} />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              gap: 1.25,
              ml: 3,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              startIcon={
                <FileChartColumn strokeWidth="1" style={{ color: "#9114CC" }} />
              }
              sx={{ color: "black" }}
              onClick={() => navigate("/")}
            >
              DASH BOARD
            </Button>
            <Button
              startIcon={
                <ClipboardList strokeWidth="1" style={{ color: "#4CAF50" }} />
              }
              sx={{ color: "black" }}
              onClick={(e) => setMenuDanhMucEl(e.currentTarget)}
            >
              DANH MỤC
            </Button>
            <Button
              startIcon={
                <BadgeRussianRuble
                  strokeWidth="1"
                  style={{ color: "#CC146C" }}
                />
              }
              sx={{ color: "black" }}
              onClick={(e) => setMenuDonGiaEl(e.currentTarget)}
            >
              ĐƠN GIÁ VÀ ĐỊNH MỨC
            </Button>
            <Button
              startIcon={<Boxes strokeWidth="1" style={{ color: "#F3D016" }} />}
              sx={{ color: "black" }}
              onClick={(e) => setMenuThongKeEl(e.currentTarget)}
            >
              THỐNG KÊ VẬN HÀNH
            </Button>
            <Button
              startIcon={
                <LineChart strokeWidth="1" style={{ color: "#f35816ff" }} />
              }
              sx={{ color: "black" }}
              onClick={() => handleNavigate("/report/technologykpireport")}
            >
              BÁO CÁO
            </Button>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            sx={{ "&:hover": { cursor: "pointer" } }}
            borderLeft={"1px solid #DFE2EA"}
            onClick={(e) => setMenuSettingsEl(e.currentTarget)}
          >
            <ChevronDown size={16} style={{ marginLeft: 16 }} />

            <Box
              display="flex"
              flexDirection="column"
              alignItems="flex-end"
              justifyContent="center"
              sx={{ minHeight: 24, lineHeight: 1.1 }} // cao bằng icon
            >
              <Typography sx={{ fontSize: 12, lineHeight: 1.1 }}>
                {user?.fullName}
              </Typography>
              <Typography
                sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1.1 }}
              >
                {user?.email}
              </Typography>
            </Box>

            <CircleUserRound strokeWidth={1} size={24} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* NƠI HIỂN THỊ NỘI DUNG PAGE */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 12,
          p: 3,
          minHeight: "100vh",
          minWidth: 0,
          backgroundColor: "#f1f2f5",
        }}
      >
        <TabBar />
        {children || <Outlet />}
        <FloatingMinimizeButton />
      </Box>

      <Menu
        anchorEl={menuDanhMucEl}
        open={Boolean(menuDanhMucEl)}
        onClose={() => {
          setMenuDanhMucEl(null);
          setMaterialSubMenuEl(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem
          onClick={() => {
            handleNavigate("/department");
            setMenuDanhMucEl(null);
          }}
        >
          Phân xưởng
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/unit");
            setMenuDanhMucEl(null);
          }}
        >
          Đơn vị tính
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/devicecode");
            setMenuDanhMucEl(null);
          }}
        >
          Mã thiết bị
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/assignmentcode");
            setMenuDanhMucEl(null);
          }}
        >
          Mã giao khoán
        </MenuItem>

        {/* Material MenuItem - Click to open submenu */}
        <MenuItem
          onClick={(event) => {
            event.stopPropagation();
            if (materialSubMenuEl) {
              setMaterialSubMenuEl(null);
            } else {
              setMaterialSubMenuEl(event.currentTarget);
            }
          }}
          sx={{
            position: "relative",
            "&:after": {
              content: '"▶"',
              position: "absolute",
              right: 8,
              fontSize: "12px",
              color: "rgba(0, 0, 0, 0.54)",
              transform: materialSubMenuEl ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            },
            backgroundColor: materialSubMenuEl
              ? "rgba(25, 118, 210, 0.08)"
              : "transparent",
            "&:hover": {
              backgroundColor: materialSubMenuEl
                ? "rgba(25, 118, 210, 0.12)"
                : "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          Vật tư, tài sản
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleNavigate("/rockratio");
            setMenuDanhMucEl(null);
          }}
        >
          Tỷ lệ đá lẫn trong gương
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/mirrorratio");
            setMenuDanhMucEl(null);
          }}
        >
          Tỷ lệ gương than mềm
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/adjustmentfactorfornorms");
            setMenuDanhMucEl(null);
          }}
        >
          Hệ số điều chỉnh định mức
        </MenuItem>

        {/* Công đoạn sản xuất */}
        <MenuItem
          onClick={() => {
            handleNavigate("/ratedadjustmentfactor");
            setMenuDanhMucEl(null);
          }}
        >
          Công đoạn sản xuất
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleNavigate("/parameter");
            setMenuDanhMucEl(null);
          }}
        >
          Thông số
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleNavigate("/productionscope");
            setMenuDanhMucEl(null);
          }}
        >
          Diện sản xuất
        </MenuItem>
      </Menu>

      {/* Submenu - Simple and stable */}
      <Menu
        anchorEl={materialSubMenuEl}
        open={Boolean(materialSubMenuEl)}
        onClose={() => setMaterialSubMenuEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          "& .MuiPaper-root": {
            marginLeft: "8px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
            borderRadius: "8px",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleNavigate("/materialassignment?type=in");
            setMenuDanhMucEl(null);
            setMaterialSubMenuEl(null);
          }}
          sx={{
            minWidth: 260,
            padding: "10px 16px",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.08)",
            },
          }}
        >
          Vật tư, tài sản trong khoán
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/materialassignment?type=out");
            setMenuDanhMucEl(null);
            setMaterialSubMenuEl(null);
          }}
          sx={{
            minWidth: 260,
            padding: "10px 16px",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.08)",
            },
          }}
        >
          Vật tư, tài sản khác
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={menuDonGiaEl}
        open={Boolean(menuDonGiaEl)}
        onClose={() => setMenuDonGiaEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MenuItem
          onClick={() => {
            handleNavigate("/materialunitprice");
            setMenuDonGiaEl(null);
          }}
        >
          Đơn giá vật tư giao khoán
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/excavationnorms");
            setMenuDonGiaEl(null);
          }}
        >
          Định mức đào lò
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/cuttingnorms");
            setMenuDonGiaEl(null);
          }}
        >
          Định mức xén lò
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleNavigate("/coalcuttingnorms");
            setMenuDonGiaEl(null);
          }}
        >
          Định mức khấu than
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={menuThongKeEl}
        open={Boolean(menuThongKeEl)}
        onClose={() => setMenuThongKeEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MenuItem
          onClick={() => {
            handleNavigate("/initialplannedcosts");
            setMenuThongKeEl(null);
          }}
        >
          Chi phí kế hoạch ban đầu
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/materialcostused");
            setMenuThongKeEl(null);
          }}
        >
          Chi phí vật tư thực hiện
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/materialbudget");
            setMenuThongKeEl(null);
          }}
        >
          Chi phí vật tư kế hoạch
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleNavigate("/settlementReportSummary");
            setMenuThongKeEl(null);
          }}
        >
          Quyết toán giao khoán
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={menuSettingsEl}
        open={Boolean(menuSettingsEl)}
        onClose={() => setMenuSettingsEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="flex-end"
          padding={2}
        >
          <Typography>{user?.fullName}</Typography>
          <Typography>Kế toán</Typography>
        </Box>
        <MenuItem
          onClick={() => {
            setOpenProfile(true);
            setMenuSettingsEl(null);
          }}
        >
          <ListItemIcon>
            <Person2 fontSize="small" />
          </ListItemIcon>
          Thông tin tài khoản
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenChangePass(true);
            setMenuSettingsEl(null);
          }}
        >
          <ListItemIcon>
            <VpnKeyOutlined fontSize="small" />
          </ListItemIcon>
          Đổi mật khẩu
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenSystemConfig(true);
            setMenuSettingsEl(null);
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Cấu hình hệ thống
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Đăng xuất
        </MenuItem>
      </Menu>
      <Profile open={openProfile} setOpen={setOpenProfile} />
      <ChangePass open={openChangePass} setOpen={setOpenChangePass} />
      <SystemConfigModal
        open={openSystemConfig}
        onClose={() => setOpenSystemConfig(false)}
      />
    </Box>
  );
};

export default MainLayout;
