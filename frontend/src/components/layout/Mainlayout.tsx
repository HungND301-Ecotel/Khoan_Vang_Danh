import React, { useEffect, useState } from "react";
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
  Divider,
  Avatar,
  Tooltip,
  ListItemIcon,
} from "@mui/material";
import {
  BadgeRussianRuble,
  Bell,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  FileChartColumn,
  Settings,
} from "lucide-react";
import {
  ListAlt,
  Calculate,
  Equalizer,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications,
  VpnKeyOutlined,
  Person2,
  ArrowDropDown,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";
import api from "../../config/api.config";
import { PhaseOutputType } from "../../types";
import { MainLayoutProps } from "../../types";

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useAtom(userAtom);

  const [menuDanhMucEl, setMenuDanhMucEl] = useState<HTMLElement | null>(null);
  const [menuDonGiaEl, setMenuDonGiaEl] = useState<HTMLElement | null>(null);
  const [menuThongKeEl, setMenuThongKeEl] = useState<HTMLElement | null>(null);
  const [menuSettingsEl, setMenuSettingsEl] = useState<HTMLElement | null>(null);
  const [menuVatTuEl, setMenuVatTuEl] = useState<HTMLElement | null>(null);

  const { data: phases = [] } = useQuery({
    queryKey: ["phases"],
    queryFn: () => api.get("/phases").then((res) => res.data.data),
  });

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
                Nguyễn Hà
              </Typography>
              <Typography
                sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1.1 }}
              >
                admin@gmail.com
              </Typography>
            </Box>

            <CircleUserRound strokeWidth={1} size={24} />
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, mt: 12, p: 3 }}>
        {children || <Outlet />}
      </Box>
      
      <Menu
        anchorEl={menuDanhMucEl}
        open={Boolean(menuDanhMucEl)}
        onClose={() => setMenuDanhMucEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem
          onClick={() => {
            navigate("/unit");
            setMenuDanhMucEl(null);
          }}
        >
          ĐƠN VỊ TÍNH
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/devicecode");
            setMenuDanhMucEl(null);
          }}
        >
         MÃ THIẾT BỊ
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/assignmentcode");
            setMenuDanhMucEl(null);
          }}
        >
          MÃ GIAO KHOÁN
        </MenuItem>
        <MenuItem
          onMouseEnter={(e) => setMenuVatTuEl(e.currentTarget)}
          sx={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center" 
          }}
        >
          VẬT TƯ ,TÀI SẢN
          <ChevronRight className="w-4 h-4" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/rockratio");
            setMenuDanhMucEl(null);
          }}
        >
          TỶ LỆ ĐÁ LẪN TRONG GƯƠNG 
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/mirrorratio");
            setMenuDanhMucEl(null);
          }}
        >
          Tỷ LỆ GƯƠNG THAN MỀM
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            navigate("/adjustmentfactorfornorms");
            setMenuDanhMucEl(null);
          }}
        >
         HỆ SỐ ĐIỀU CHỈNH ĐỊNH MỨC
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigate("/ratedadjustmentfactor");
            setMenuDanhMucEl(null);
          }}
        >
          CÔNG ĐOẠN SẢN XUẤT
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigate("/parameter");
            setMenuDanhMucEl(null);
          }}
        >
          THÔNG SỐ
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigate("/productionscope");
            setMenuDanhMucEl(null);
          }}
        >
          ĐIỆN SẢN XUẤT
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={menuVatTuEl}
        open={Boolean(menuVatTuEl)}
        onClose={() => setMenuVatTuEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onMouseLeave={() => setMenuVatTuEl(null)}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#f5f5f5',
            minWidth: 200,
          }
        }}
      >
        <MenuItem
          onClick={() => {
            navigate("/materialassignment");
            setMenuDanhMucEl(null);
            setMenuVatTuEl(null);
          }}
        >
          VẬT TƯ, TÀI SẢN TRONG KHOÁN
        </MenuItem>
        <MenuItem
          onClick={() => {
              navigate("/materialsoutsidecontract");
            setMenuDanhMucEl(null);
            setMenuVatTuEl(null);
          }}
        >
          VẬT TƯ, TÀI SẢN NGOÀI KHOÁN
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
            navigate("/materialunitprice");
            setMenuDonGiaEl(null);
          }}
        >
           ĐƠN GIÁ VẬT TƯ GIAO KHOÁN
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/excavationnorms");
            setMenuDonGiaEl(null);
          }}
        >
         ĐỊNH MỨC ĐÀO LÒ
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/cuttingnorms");
            setMenuDonGiaEl(null);
          }}
        >
          ĐỊNH MỨC XÉN LÒ
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigate("/coalcuttingnorms");
            setMenuDonGiaEl(null);
          }}
        >
          ĐỊNH MỨC KHẤU THAN
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
            navigate("/materialbudget");
            setMenuThongKeEl(null);
          }}
        >
          CHI PHÍ VẬT TƯ KẾ HOẠCH
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/materialcostused");
            setMenuThongKeEl(null);
          }}
        >
          CHI PHÍ VẬT TƯ THỰC HIỆN
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/settlementReport123");
            setMenuThongKeEl(null);
          }}
        >
          QUYẾT TOÁN GIAO KHOÁN
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
          <Typography>Nguyễn Hà</Typography>
          <Typography>Kế toán</Typography>
        </Box>
        <MenuItem>
          <ListItemIcon>
            <Person2 fontSize="small" />
          </ListItemIcon>
          Thông tin tài khoản
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuSettingsEl(null);
          }}
        >
          <ListItemIcon>
            <VpnKeyOutlined fontSize="small" />
          </ListItemIcon>
          Đổi mật khẩu
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Đăng xuất
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MainLayout;