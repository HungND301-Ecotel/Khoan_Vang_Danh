// components/BaseModal/index.tsx
import {
  Box,
  Breadcrumbs,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  DialogProps,
  SxProps,
  Theme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ReactNode, useState } from "react";
import { Divider } from "antd";
import { CropFree, ZoomInMap, ZoomOutMap } from "@mui/icons-material";

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  breadcrumbs?: string[]; // Ví dụ: ["Danh mục", "Đơn vị tính"]
  children: ReactNode;
  actions?: ReactNode;
  showZoom?: boolean;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
  customWidth?: string | number;
  customHeight?: string | number;
  sx?: SxProps<Theme>;
  titleExtra?: ReactNode;
}

export default function BaseModal({
  open,
  onClose,
  title,
  breadcrumbs,
  children,
  actions,
  showZoom = true,
  maxWidth = "md",
  fullWidth = true,
  customWidth = "800px",
  customHeight = "740px",
  sx,
  titleExtra,
}: BaseModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleClose = () => {
    setIsZoomed(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={isZoomed ? false : maxWidth}
      fullWidth={!isZoomed && fullWidth}
      PaperProps={{
        sx: {
          width: isZoomed ? "100vw" : customWidth,
          height: isZoomed ? "100vh" : customHeight,
          maxWidth: isZoomed ? "100vw" : undefined,
          maxHeight: isZoomed ? "100vh" : undefined,
          p: "40px",
          position: "relative",
          borderRadius: isZoomed ? 0 : "12px",
          transition: "all 0.3s ease-in-out",
          m: isZoomed ? 0 : undefined,
          ...sx,
        },
      }}
    >
      {/* Nút Zoom */}
      {showZoom && (
        <IconButton
          onClick={toggleZoom}
          sx={{
            position: "absolute",
            top: "40px",
            right: "80px",
            zIndex: 1,
            p: 0,
            "& svg": {
              fontSize: "16px",
              color: "#2B4A82",
            },
            "&:hover svg": {
              color: "#007BFF",
            },
          }}
        >
          {isZoomed ? <ZoomInMap /> : <CropFree /> }
        </IconButton>
      )}

      {/* Nút Close */}
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: "40px",
          right: "40px",
          zIndex: 1,
          p: 0,
          "& svg": {
            fontSize: "16px",
            color: "#2B4A82",
          },
          "&:hover svg": {
            color: "#007BFF",
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <DialogTitle sx={{ p: 0, mt: "16px" }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "14px" }}>
            {breadcrumbs.map((crumb, index) => (
              <Typography key={index}>{crumb}</Typography>
            ))}
          </Breadcrumbs>
          <Divider
            style={{
              margin: "10px 0",
              borderBlockWidth: 1,
              opacity: "30%",
              borderColor: "#6592B7",
            }}
          />
          {title && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontSize: "24px", color: "#2B4A82" }}>
                {title}
              </Typography>
              {titleExtra && <Box>{titleExtra}</Box>}
            </Box>
          )}
        </DialogTitle>
      )}

      {/* Content */}
      <DialogContent sx={{ p: 0, mt: breadcrumbs ? 3 : 0 }}>
        {children}
      </DialogContent>

      {/* Actions */}
      {actions && (
        <DialogActions sx={{ mt: 3, px: 0, gap: "10px" }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
