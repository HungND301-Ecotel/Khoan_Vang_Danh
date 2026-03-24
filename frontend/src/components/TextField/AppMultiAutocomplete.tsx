import React, { useState } from "react";
import { Autocomplete, Box, TextField } from "@mui/material";

interface AppMultiAutocompleteProps<T> {
  options: T[];
  value: T[];
  onChange: (newValue: T[]) => void;
  getOptionLabel: (option: T) => string;
  isOptionEqualToValue?: (option: T, value: T) => boolean;
  placeholder?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
  width?: string | number;
  backgroundColor?: string;
  allowDuplicate?: boolean;
}

export const AppMultiAutocomplete = <T extends { _id?: string }>({
  options,
  value,
  onChange,
  getOptionLabel,
  isOptionEqualToValue,
  placeholder = "Chọn dữ liệu...",
  label,
  error,
  helperText,
  width = "700px",
  backgroundColor = "#F2F2F2",
  allowDuplicate = false,
}: AppMultiAutocompleteProps<T>) => {
  // 1. Quản lý nội dung search bằng state riêng
  const [searchInput, setSearchInput] = useState("");

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Autocomplete
        multiple
        options={options}
        value={value}
        // 2. Giữ menu mở sau khi chọn
        disableCloseOnSelect
        // 3. Kiểm soát giá trị input
        inputValue={searchInput}
        onInputChange={(_, newInputValue, reason) => {
          // 'input': người dùng gõ/xóa (giữ lại để filter)
          // 'reset': MUI tự reset khi chọn item hoặc khi blur (ta sẽ chặn việc reset này)
          // 'clear': Người dùng ấn nút xóa sạch (X) của Autocomplete
          if (reason === "input" || reason === "clear") {
            setSearchInput(newInputValue);
          }
        }}
        // 4. Ngăn việc xóa filter khi mất focus (sang tab khác/cửa sổ khác)
        onBlur={() => {
          // Không làm gì cả, giữ nguyên searchInput hiện tại
        }}
        // Nếu allowDuplicate = true, trả về false để MUI không lọc bỏ/xóa item đã chọn
        isOptionEqualToValue={
          allowDuplicate
            ? () => false
            : isOptionEqualToValue || ((opt, val) => opt._id === val._id)
        }
        getOptionLabel={getOptionLabel}
        onChange={(_, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            label={label}
            variant="outlined"
            error={error}
            helperText={helperText}
            placeholder={value.length === 0 ? placeholder : ""}
          />
        )}
        sx={{
          minWidth: "100%",
          "& .MuiInputBase-root": {
            minHeight: "32px",
            borderRadius: "6px",
            px: "12px",
            fontSize: "14px",
            backgroundColor: value.length > 0 ? backgroundColor : "#FFFFFF",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            padding: "4px 12px",
          },
          "& .MuiAutocomplete-input": {
            padding: "0 !important",
            flexGrow: 1,
            minWidth: "60px",
          },
          "& .MuiChip-root": {
            height: "20px",
            fontSize: "12px",
            margin: "2px",
            lineHeight: "20px",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#D9D9D9",
          },
        }}
      />
    </Box>
  );
};
