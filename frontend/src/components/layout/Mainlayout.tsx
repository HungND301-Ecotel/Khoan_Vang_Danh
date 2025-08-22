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
  Dashboard as DashboardIcon,
  ListAlt,
  Calculate,
  Equalizer,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications,
  VpnKeyOutlined,
  BarChart,
  Person2,
  ArrowDropDown,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";
import api from "../../config/api.config";
import { PhaseOutputType } from "../../types";

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useAtom(userAtom);

  // top menus
  const [menuDanhMucEl, setMenuDanhMucEl] = useState<HTMLElement | null>(null);
  const [menuDonGiaEl, setMenuDonGiaEl] = useState<HTMLElement | null>(null);
  const [menuThongKeEl, setMenuThongKeEl] = useState<HTMLElement | null>(null);
  const [menuSettingsEl, setMenuSettingsEl] = useState<HTMLElement | null>(
    null
  );

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
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <CssBaseline />

      {/* TOP APP BAR */}
      <AppBar
        position="fixed"
        color="default"
        elevation={5}
        sx={{
          bgcolor: "background.paper",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Toolbar
          sx={{ gap: 4, height: 100, display: "flex", alignItems: "center" }}
        >
          {/* Logo + Company */}
          <img src="/logo.png" style={{ width: 150, height: 100 }} />

          {/* NAV BUTTONS */}
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
              startIcon={<DashboardIcon sx={{ color: "blue" }} />}
              sx={{ color: "black" }}
              onClick={() => navigate("/")}
            >
              TỔNG QUAN
            </Button>
            <Button
              startIcon={<ListAlt sx={{ color: "blue" }} />}
              sx={{ color: "black" }}
              onClick={(e) => setMenuDanhMucEl(e.currentTarget)}
            >
              DANH MỤC
            </Button>
            <Button
              startIcon={<Calculate sx={{ color: "blue" }} />}
              sx={{ color: "black" }}
              onClick={(e) => setMenuDonGiaEl(e.currentTarget)}
            >
              ĐƠN GIÁ VÀ ĐỊNH MỨC
            </Button>
            <Button
              startIcon={<Equalizer sx={{ color: "blue" }} />}
              sx={{ color: "black" }}
              onClick={(e) => setMenuThongKeEl(e.currentTarget)}
            >
              THỐNG KÊ VẬN HÀNH
            </Button>
          </Box>

          {/* RIGHT ACTIONS */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton>
              <SettingsIcon sx={{ fontSize: 30 }} />
            </IconButton>
            <IconButton>
              <Badge badgeContent={4} color="error">
                <Notifications sx={{ fontSize: 30 }} />
              </Badge>
            </IconButton>
            <Box
              display="flex"
              alignItems={"center"}
              gap={2}
              sx={{ "&:hover": { cursor: "pointer" } }}
              borderLeft={"1px solid grey"}
              onClick={(e) => setMenuSettingsEl(e.currentTarget)}
            >
              <ArrowDropDown sx={{ fontSize: 30 }} />
              <Box
                display="flex"
                flexDirection={"column"}
                alignItems={"flex-end"}
              >
                <Typography>Nguyễn Hà</Typography>
                <Typography>admin@gmail.com</Typography>
              </Box>
              <Avatar />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* MAIN CONTENT */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* offset for fixed AppBar */}
        <Toolbar sx={{ height: 100 }} />
        {children || <Outlet />}
      </Box>

      {/* MENU: DANH MỤC */}
      <Menu
        anchorEl={menuDanhMucEl}
        open={Boolean(menuDanhMucEl)}
        onClose={() => setMenuDanhMucEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {/* nhóm 1 */}
        <MenuItem
          onClick={() => {
            navigate("/unit");
            setMenuDanhMucEl(null);
          }}
        >
          Đơn vị tính
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/devicecode");
            setMenuDanhMucEl(null);
          }}
        >
          Mã thiết bị
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/assignmentcode");
            setMenuDanhMucEl(null);
          }}
        >
          Mã giao khoán
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/materialassignment");
            setMenuDanhMucEl(null);
          }}
        >
          Vật tư, tài sản
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/rockratio");
            setMenuDanhMucEl(null);
          }}
        >
          Tỷ lệ đá lẫn trong gương (Ckẹp)
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/mirrorratio");
            setMenuDanhMucEl(null);
          }}
        >
          Tỷ lệ gương than mềm (Cm)
        </MenuItem>

        <Divider />

        {/* Hệ số điều chỉnh */}
        <Box
          sx={{ px: 2, pt: 1, pb: 0.5, color: "text.secondary", fontSize: 12 }}
        >
          Hệ số điều chỉnh định mức
        </Box>
        <MenuItem
          onClick={() => {
            navigate("/adjustmentnormk_kt");
            setMenuDanhMucEl(null);
          }}
        >
          (CK.KT)
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/adjustmentnormk_dl");
            setMenuDanhMucEl(null);
          }}
        >
          (CK.ĐL)
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/adjustmentnorm_cm");
            setMenuDanhMucEl(null);
          }}
        >
          (Cm)
        </MenuItem>

        <Divider />

        {/* Công đoạn sản xuất */}
        <Box
          sx={{ px: 2, pt: 1, pb: 0.5, color: "text.secondary", fontSize: 12 }}
        >
          Công đoạn sản xuất
        </Box>
        <MenuItem
          onClick={() => {
            navigate("/phasegroup");
            setMenuDanhMucEl(null);
          }}
        >
          Nhóm công đoạn sản xuất
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/phase");
            setMenuDanhMucEl(null);
          }}
        >
          Công đoạn sản xuất
        </MenuItem>

        <Divider />

        {/* Các thông số */}
        <Box
          sx={{ px: 2, pt: 1, pb: 0.5, color: "text.secondary", fontSize: 12 }}
        >
          Thông số
        </Box>
        <MenuItem
          onClick={() => {
            navigate("/excavationtech");
            setMenuDanhMucEl(null);
          }}
        >
          Công nghệ xúc
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/crosssections");
            setMenuDanhMucEl(null);
          }}
        >
          Tiết diện lò xén
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/hardness");
            setMenuDanhMucEl(null);
          }}
        >
          Độ cứng than/đá (f)
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/curbslopes");
            setMenuDanhMucEl(null);
          }}
        >
          Độ dốc vỉa
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/thickness");
            setMenuDanhMucEl(null);
          }}
        >
          Chiều dày vỉa (Mv)
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/length");
            setMenuDanhMucEl(null);
          }}
        >
          Chiều dài
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/miningtechs");
            setMenuDanhMucEl(null);
          }}
        >
          Công nghệ khai thác
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/steps");
            setMenuDanhMucEl(null);
          }}
        >
          Chống
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            navigate("/productionscope");
            setMenuDanhMucEl(null);
          }}
        >
          Diện sản xuất
        </MenuItem>
      </Menu>

      {/* MENU: ĐƠN GIÁ & ĐỊNH MỨC */}
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
          Đơn giá vật tư giao khoán
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/excavationnorms");
            setMenuDonGiaEl(null);
          }}
        >
          Định mức đào lò
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/cuttingnorms");
            setMenuDonGiaEl(null);
          }}
        >
          Định mức xén lò
        </MenuItem>

        <Divider />
        <MenuItem
          onClick={() => {
            navigate("/coalcuttingnorms");
            setMenuDonGiaEl(null);
          }}
        >
          Định mức khấu than
        </MenuItem>
      </Menu>

      {/* MENU: THỐNG KÊ VẬN HÀNH */}
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
          Chi phí vật tư kế hoạch (Zkh)
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/materialcostused");
            setMenuThongKeEl(null);
          }}
        >
          Chi phí vật tư thực hiện (Zkh)
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/settlementreports");
            setMenuThongKeEl(null);
          }}
        >
          Quyết toán giao khoán
        </MenuItem>
      </Menu>

      {/* MENU: SETTINGS */}
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
            // mở modal đổi mật khẩu nếu bạn có
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
