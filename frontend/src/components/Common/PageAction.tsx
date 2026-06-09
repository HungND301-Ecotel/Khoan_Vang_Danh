import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import custom_theme from "../../theme";
import {
  Add,
  ArrowDropDown,
  Delete,
  FileDownload,
  FileUpload,
  FilterList,
  Mail,
  Print,
  Search,
} from "@mui/icons-material";
import FieldSearch from "../TextField/FieldSearch";
import { useRef } from "react";
import FieldMonthYear from "../../ui/FieldMonth_Year";

export default function PageAction({
  selectedIds,
  handleDelete,
  deleteMutation,
  searchValue,
  setSearchValue,
  exportExcel,
  importFile,
  handleOpen,
  handleSendEmail,
  handlePrint,
  handleClearSearch,
  isLoading,
  totalItems,
  selectedMonth,
  setSelectedMonth,
}: {
  selectedIds: React.Key[];
  handleDelete?: () => void;
  deleteMutation?: any;
  searchValue: string;
  setSearchValue: (value: string) => void;
  exportExcel?: any;
  importFile?: any;
  handleOpen?: (data?: any) => void;
  handleSendEmail?: () => void;
  handlePrint?: () => void;
  isLoading?: boolean;
  totalItems?: number;
  handleClearSearch?: () => void;
  selectedMonth?: string;
  setSelectedMonth?: React.Dispatch<React.SetStateAction<string>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    // Gọi trực tiếp click() trên phần tử input bị ẩn
    fileInputRef.current?.click();
  };
  return (
    <Box>
      <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
        {(handleOpen || handleDelete) && (
          <Box display={"flex"} gap={2}>
            {handleOpen && (
              <Button
                variant="contained"
                sx={{
                  backgroundColor: (theme) =>
                    custom_theme.palette.table_add_button.main,
                  "&:hover": {
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_add_button.dark,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
                endIcon={<Add />}
                onClick={() => handleOpen()}
              >
                Tạo mới
              </Button>
            )}
            {handleDelete && (
              <Button
                variant="contained"
                disabled={selectedIds.length === 0}
                sx={{
                  backgroundColor: (theme) =>
                    custom_theme.palette.table_delete_button.main,
                  "&:hover": {
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_delete_button.dark,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
                endIcon={<Delete />}
                onClick={() => handleDelete()}
              >
                {deleteMutation.isPending
                  ? "Đang xóa..."
                  : `Xóa (${selectedIds.length})`}
              </Button>
            )}
          </Box>
        )}
        <Box display={"flex"} flex={1} gap={2}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<FilterList />}
            sx={{
              fontFamily: "Roboto, sans-serif",
              border: "none",
              boxShadow: custom_theme.customShadows.tableFunctional,
              backgroundColor: (theme) =>
                custom_theme.palette.table_functional_button.main,
              "&:hover": {
                backgroundColor: (theme) =>
                  custom_theme.palette.table_functional_button.dark,
                boxShadow: custom_theme.customShadows.tableFunctionalHover,
              },
              fontSize: 14,
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
            }}
          >
            Lọc
          </Button>
          <FieldSearch
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
          {(selectedMonth || setSelectedMonth) && (
            <FieldMonthYear
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          )}
        </Box>
        <Box display={"flex"} gap={2}>
          <input
            ref={fileInputRef}
            id="upload-excel"
            type="file"
            accept=".xlsx, .xls"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const formData = new FormData();
                formData.append("file", file);
                importFile.mutate(formData);
              }
              e.target.value = "";
            }}
          />

          {importFile && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FileUpload />}
              onClick={handleUploadClick}
              disabled={importFile.isPending}
              sx={{
                border: "none",
                boxShadow: custom_theme.customShadows.tableFunctional,
                backgroundColor: (theme) =>
                  custom_theme.palette.table_functional_button.main,
                "&:hover": {
                  backgroundColor: (theme) =>
                    custom_theme.palette.table_functional_button.dark,
                  boxShadow: custom_theme.customShadows.tableFunctionalHover,
                },
                fontFamily: "Roboto, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "8px",
                px: 3,
              }}
            >
              {importFile.isPending ? "Đang tải lên ..." : "Tải lên"}
            </Button>
          )}
          {exportExcel && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FileDownload />}
              disabled={exportExcel.isPending}
              onClick={() => exportExcel.mutate()}
              sx={{
                border: "none",
                boxShadow: custom_theme.customShadows.tableFunctional,
                backgroundColor: (theme) =>
                  custom_theme.palette.table_functional_button.main,
                "&:hover": {
                  backgroundColor: (theme) =>
                    custom_theme.palette.table_functional_button.dark,
                  boxShadow: custom_theme.customShadows.tableFunctionalHover,
                },
                fontFamily: "Roboto, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "8px",
                px: 3,
              }}
            >
              {exportExcel.isPending ? "Đang xuất file..." : "Xuất file"}
            </Button>
          )}
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Print />}
            onClick={handlePrint ? handlePrint : () => {}}
            sx={{
              border: "none",
              boxShadow: custom_theme.customShadows.tableFunctional,
              backgroundColor: (theme) =>
                custom_theme.palette.table_functional_button.main,
              "&:hover": {
                backgroundColor: (theme) =>
                  custom_theme.palette.table_functional_button.dark,
                boxShadow: custom_theme.customShadows.tableFunctionalHover,
              },
              fontFamily: "Roboto, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
            }}
          >
            In
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Mail />}
            endIcon={<ArrowDropDown />}
            onClick={handleSendEmail ? handleSendEmail : () => {}}
            sx={{
              border: "none",
              boxShadow: custom_theme.customShadows.tableFunctional,
              backgroundColor: (theme) =>
                custom_theme.palette.table_functional_button.main,
              "&:hover": {
                backgroundColor: (theme) =>
                  custom_theme.palette.table_functional_button.dark,
                boxShadow: custom_theme.customShadows.tableFunctionalHover,
              },
              fontFamily: "Roboto, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
            }}
          >
            Gửi
          </Button>
        </Box>
      </Box>
      {/* Enhanced Search Results Info with Loading State */}
      {(searchValue || selectedMonth) && (
        <Box
          sx={{
            mb: 2,
            p: 1,
            backgroundColor: "#f0f7ff",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="primary">
            {isLoading && (searchValue || selectedMonth) !== "" ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Đang tìm kiếm "{searchValue || selectedMonth}"...
              </Box>
            ) : (
              <>
                Tìm thấy {totalItems} kết quả cho "
                {searchValue || selectedMonth}"
                {(totalItems || 0) > 0 && (
                  <Button
                    size="small"
                    onClick={() => {
                      handleClearSearch?.();
                      setSelectedMonth?.("");
                    }}
                    sx={{ ml: 2 }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
