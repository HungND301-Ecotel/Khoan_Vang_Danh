import { InputAdornment, TextField } from "@mui/material";
import custom_theme from "../../theme";
import { Search } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";

export default function FieldSearch({
  searchValue,
  setSearchValue,
}: {
  searchValue: string;
  setSearchValue: (value: string) => void;
}) {
  // Local state để input mượt, debounce để set vào formik
  const [localValue, setLocalValue] = useState(searchValue);
  const debouncedValue = useDebounce(localValue, 500);

  useEffect(() => {
    setSearchValue(debouncedValue);
  }, [debouncedValue]);

  useEffect(() => {
    setLocalValue(searchValue);
  }, [searchValue]);
  return (
    <TextField
      fullWidth
      size="small"
      placeholder="Tìm kiếm"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      sx={{
        backgroundColor: (theme) => custom_theme.palette.table_filter_box.main,
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Search sx={{ fontSize: 24 }} />
          </InputAdornment>
        ),
      }}
    />
  );
}
