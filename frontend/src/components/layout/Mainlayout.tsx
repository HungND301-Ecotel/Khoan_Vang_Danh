import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Divider,
    Tooltip,
    Avatar,
    Menu,
    MenuItem,
    AccordionSummary,
    AccordionDetails,
    Accordion,
    Collapse,
    Badge,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    VpnKeyOutlined,
    Expand,
    ExpandLess,
    ExpandMore,
    ListAlt,
    Calculate,
    Notifications,
} from '@mui/icons-material';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import api from '../../config/api.config';
import { PhaseOutputType } from '../../types';

const drawerWidth = 240;
interface MainLayoutProps {
    children?: React.ReactNode;
}

const listItemSx = {
    px: 2.5,
    py: 1,
    my: 0.5,
    borderRadius: 2,
    transition: 'all 0.2s',
    '&:hover': {
        bgcolor: 'primary.main',
        color: 'white',
        '& .MuiListItemIcon-root': {
            color: 'white',
        },
    },
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [user, setUser] = useAtom(userAtom);

    const [mobileOpen, setMobileOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [anchorElCoal, setAnchorElCoal] = useState<HTMLElement | null>(null);
    const [isOpenChangePassword, setIsOpenChangePassword] = useState(false);
    const [openDanhMuc, setOpenDanhMuc] = useState(false);
    const [openParameter, setOpenParameter] = useState(false);
    const [openPhase, setOpenPhase] = useState(false);
    const [openAdjustment, setOpenAdjustment] = useState(false);
    const [openCaculate, setOpenCaculate] = useState(false);
    const [openHSDC, setOpenHSDC] = useState(false);


    const [path, setPath] = useState('')


    const location = useLocation()

    useEffect(() => {
        setPath(location.pathname)
    }, [location.pathname])




    const openMenu = Boolean(anchorEl);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const openMenuCoal = Boolean(anchorElCoal);

    const handleMenuClickCoal = (event: React.MouseEvent<HTMLElement>) => setAnchorElCoal(event.currentTarget);
    const handleMenuCloseCoal = () => setAnchorElCoal(null);



    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };
    const { data: phases = [] } = useQuery({
        queryKey: ['phases'],
        queryFn: () => api.get('/phases').then(res => res.data.data)
    })

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ height: 120, display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'primary.main', borderBottomRightRadius: 20 }}>
                <Avatar src="/image/logo.jpg" sx={{ width: 50 }} />
                <Box sx={{ color: 'white' }}>
                    <Typography variant="h6" noWrap>Admin</Typography>
                    <Typography variant="body2" noWrap>Quản trị viên</Typography>
                </Box>
            </Box>
            <List sx={{ flex: 1, overflowY: 'auto' }}>
                <ListItem button onClick={() => navigate('/')} sx={{
                    ...listItemSx,
                    bgcolor: path === "/" ? 'primary.main' : 'transparent',
                    color: location.pathname === '/' ? 'white' : 'inherit',
                    '& .MuiListItemIcon-root': {
                        color: location.pathname === '/' ? 'white' : 'primary.main',
                    },
                }}>
                    <ListItemIcon sx={{ justifyContent: 'center', minWidth: 0, mr: mobileOpen ? 2 : 'auto', color: 'primary.main' }}>
                        <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={() => setOpenDanhMuc(!openDanhMuc)} sx={listItemSx}>
                    <ListItemIcon sx={{
                        justifyContent: 'center',
                        minWidth: 0, mr: mobileOpen ? 2 : 'auto', color: 'primary.main',
                    }}>
                        <ListAlt sx={{ color: 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Danh mục" />
                    {openDanhMuc ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={openDanhMuc} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItem button onClick={() => navigate('/unit')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/unit" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/unit' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Đơn vị tính" />
                        </ListItem>
                        <ListItem button onClick={() => navigate('/devicecode')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/devicecode" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/devicecode' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Mã thiết bị" />
                        </ListItem>
                        <ListItem button onClick={() => navigate('/assignmentcode')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/assignmentcode" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/assignmentcode' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Mã giao khoán" />
                        </ListItem>
                        <ListItem button onClick={() => navigate('/materialassignment')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/materialassignment" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/materialassignment' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Vật tư, tài sản" />
                        </ListItem>
                        <ListItem button onClick={() => navigate('/rockratio')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/rockratio" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/rockratio' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Tỷ lệ đá lẫn trong gương (Ckẹp)" />
                        </ListItem>
                        <ListItem button onClick={() => navigate('/mirrorratio')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/mirrorratio" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/mirrorratio' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Tỷ lệ gương than mềm (Cm)" />
                        </ListItem>
                        <ListItem button onClick={() => setOpenHSDC(!openHSDC)} sx={{ ...listItemSx, pl: 4 }}>
                            <ListItemText primary="Hệ số điều chỉnh định mức" />
                            {openHSDC ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={openHSDC} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem button onClick={() => navigate('/adjustmentnormk_kt')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/adjustmentnormk_kt" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/adjustmentnormk_kt' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Hệ số điều chỉnh định mức (CK.KT )" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/adjustmentnormk_dl')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/adjustmentnormk_dl" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/adjustmentnormk_dl' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Hệ số điều chỉnh định mức (CK.ĐL )" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/adjustmentnorm_cm')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/adjustmentnorm_cm" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/adjustmentnorm_cm' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Hệ số điều chỉnh định mức (Cm)" />
                                </ListItem>
                            </List>
                        </Collapse>
                        <ListItem button onClick={() => setOpenPhase(!openPhase)} sx={listItemSx}>
                            <ListItemIcon sx={{ justifyContent: 'center', minWidth: 0, mr: mobileOpen ? 2 : 'auto', color: 'primary.main' }}>
                                <Calculate sx={{ color: 'inherit' }} />
                            </ListItemIcon>
                            <ListItemText primary="Công đoạn sản xuất" />
                            {openPhase ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={openPhase} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem button onClick={() => navigate('/phasegroup')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/phasegroup" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/phasegroup' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Nhóm công đoạn sản xuất" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/phase')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/phase" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/phase' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Công đoạn sản xuất" />
                                </ListItem>
                            </List>
                        </Collapse>
                        <ListItem button onClick={() => navigate('/productionscope')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/productionscope" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/productionscope' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Diện sản xuất" />
                        </ListItem>
                        <ListItem button onClick={() => setOpenParameter(!openParameter)} sx={{ ...listItemSx, pl: 4, }}>
                            <ListItemText primary="Thông số" />
                            {openParameter ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={openParameter} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem button onClick={() => navigate('/excavationtech')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/excavationtech" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/excavationtech' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Công nghệ xúc" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/crosssections')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/crosssections" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/crosssections' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Tiết diện lò xén" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/hardness')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/hardness" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/hardness' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Độ cứng than/ đá(f)" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/curbslopes')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/curbslopes" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/curbslopes' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Độ dốc vỉa" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/thickness')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/thickness" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/thickness' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Chiều dày vỉa (Mv)" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/length')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/length" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/length' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Chiều dài" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/miningtechs')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/miningtechs" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/miningtechs' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Công nghệ khai thác" />
                                </ListItem>
                                <ListItem button onClick={() => navigate('/steps')} sx={{
                                    ...listItemSx, pl: 6,
                                    bgcolor: path === "/steps" ? 'primary.main' : 'transparent',
                                    color: location.pathname === '/steps' ? 'white' : 'inherit',
                                }}>
                                    <ListItemText primary="Chống" />
                                </ListItem>
                            </List>
                        </Collapse>
                    </List>
                </Collapse>
                <ListItem button onClick={() => setOpenCaculate(!openCaculate)} sx={listItemSx}>
                    <ListItemIcon sx={{ justifyContent: 'center', minWidth: 0, mr: mobileOpen ? 2 : 'auto', color: 'primary.main' }}>
                        <Calculate sx={{ color: 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Đơn giá và định mức" />
                    {openCaculate ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={openCaculate} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItem button onClick={() => navigate('/materialunitprice')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/materialunitprice" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/materialunitprice' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Đơn giá vật tư giao khoán" />
                        </ListItem>
                        <ListItem button onClick={() => navigate('/excavationnorms')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/excavationnorms" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/excavationnorms' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Định mức đào lò" />
                        </ListItem>
                        <ListItem button onClick={() => navigate('/cuttingnorms')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/cuttingnorms" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/cuttingnorms' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Định mức xén lò" />
                        </ListItem>
                        <ListItem button onClick={handleMenuClickCoal} sx={{
                            ...listItemSx, pl: 4,

                        }}>
                            <ListItemText primary="Định mức khấu than" />
                        </ListItem>
                    </List>
                </Collapse>
                <ListItem button onClick={() => setOpenCaculate(!openCaculate)} sx={listItemSx}>
                    <ListItemIcon sx={{ justifyContent: 'center', minWidth: 0, mr: mobileOpen ? 2 : 'auto', color: 'primary.main' }}>
                        <Calculate sx={{ color: 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Thống kê vận hành" />
                    {openCaculate ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={openCaculate} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItem button onClick={() => navigate('/materialunitprice')} sx={{
                            ...listItemSx, pl: 4,
                            bgcolor: path === "/materialunitprice" ? 'primary.main' : 'transparent',
                            color: location.pathname === '/materialunitprice' ? 'white' : 'inherit',
                        }}>
                            <ListItemText primary="Đơn giá vật tư giao khoán" />
                        </ListItem>
                    </List >
                </Collapse>
            </List >
            <Divider />
            <List>
                <ListItem button onClick={handleMenuClick}>
                    <Tooltip title="Cài đặt" placement="right">
                        <ListItemIcon sx={{ justifyContent: 'center', minWidth: 0, mr: mobileOpen ? 2 : 'auto', color: 'primary.main' }}>
                            <SettingsIcon sx={{ color: 'inherit' }} />
                        </ListItemIcon>
                    </Tooltip>
                    {mobileOpen && <ListItemText primary="Cài đặt" />}
                </ListItem>
            </List>

            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <MenuItem onClick={() => setIsOpenChangePassword(true)}>
                    <ListItemIcon><VpnKeyOutlined color="primary" fontSize="small" /></ListItemIcon>
                    Đổi mật khẩu
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon color="primary" fontSize="small" /></ListItemIcon>
                    Đăng xuất
                </MenuItem>
            </Menu>
            <Menu
                anchorEl={anchorElCoal}
                open={openMenuCoal}
                onClose={handleMenuCloseCoal}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                {phases.filter((i: PhaseOutputType) =>
                    i.phaseGroup?.name?.toLowerCase() === "khấu than".toLowerCase()
                ).map((p: PhaseOutputType) => {
                    const route =
                        p.code === "ZRY"
                            ? "/coalcuttingnorm_zry"
                            : p.code === "KB"
                                ? "/coalcuttingnorm_kb"
                                : "/coalcuttingnorm_zh";

                    return (
                        <MenuItem
                            key={p._id}
                            onClick={() => {
                                navigate(route);
                                setAnchorElCoal(null);
                            }}
                            sx={{
                                ...listItemSx,
                                bgcolor: location.pathname === route ? "primary.main" : "transparent",
                                color: location.pathname === route ? "white" : "inherit",
                            }}
                        >
                            {p.code}
                        </MenuItem>
                    );
                })}
            </Menu>
        </Box >
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    ml: mobileOpen ? `${drawerWidth}px` : 0,
                    width: mobileOpen ? `calc(100% - ${drawerWidth}px)` : '100%',
                    transition: 'width 0.3s, margin 0.3s',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div">
                            Phần mềm khoán chi phí
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <IconButton
                            color="inherit"
                            edge="start"
                            sx={{ mr: 2 }}
                        >
                            <Badge badgeContent={4} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>
                        <IconButton
                            color="inherit"
                            edge="start"
                            sx={{ mr: 2 }}
                        >
                            <LogoutIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: mobileOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="permanent"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        width: mobileOpen ? drawerWidth : 0,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: mobileOpen ? drawerWidth : 0,
                            overflowX: 'hidden',
                            boxSizing: 'border-box',
                            transition: 'width 0.3s',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: `calc(100% - ${mobileOpen ? drawerWidth : 0}px)`,
                    height: '100vh',
                    overflow: 'auto',
                }}
            >
                <Toolbar />
                {children || <Outlet />}
            </Box>
        </Box>
    );
};

export default MainLayout;
