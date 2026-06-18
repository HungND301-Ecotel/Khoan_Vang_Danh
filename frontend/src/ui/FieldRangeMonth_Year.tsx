import { TextField, Box } from "@mui/material";
import React from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";

export default function FieldRangeMonthYear({
  fromMonth,
  setFromMonth,
  toMonth,
  setToMonth,
  disabled
}: {
  fromMonth: string;
  setFromMonth: React.Dispatch<React.SetStateAction<string>>;
  toMonth: string;
  setToMonth: React.Dispatch<React.SetStateAction<string>>;
  disabled?: boolean;
}) {
  const fromDayjsValue: Dayjs | null = fromMonth ? dayjs(fromMonth) : null;
  const toDayjsValue: Dayjs | null = toMonth ? dayjs(toMonth) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box display="flex" gap={2} width="100%">
        <DatePicker
          disabled={disabled}
          label="Từ tháng"
          inputFormat="MM/YYYY"
          views={["year", "month"]}
          openTo="month"
          value={fromDayjsValue}
          onChange={(val) => setFromMonth(val ? dayjs(val).format("YYYY-MM") : "")}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              size="small"
              sx={{
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF",
                },
              }}
            />
          )}
        />
        <DatePicker
          disabled={disabled}
          label="Đến tháng"
          inputFormat="MM/YYYY"
          views={["year", "month"]}
          openTo="month"
          value={toDayjsValue}
          onChange={(val) => setToMonth(val ? dayjs(val).format("YYYY-MM") : "")}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              size="small"
              sx={{
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF",
                },
              }}
            />
          )}
        />
      </Box>
    </LocalizationProvider>
  );
}
