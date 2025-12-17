import { TextField } from "@mui/material";
import React from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { getIn, useField } from "formik";

export default function FieldMonthYear({
  formik,
  selectedMonth,
  setSelectedMonth,
  fieldName
}: {
  formik?: any;
  selectedMonth?: string;
  setSelectedMonth?: React.Dispatch<React.SetStateAction<string>>;
  fieldName?: string
}) {

  const value = formik && fieldName
    ? getIn(formik.values, fieldName)
    : selectedMonth;

  const setValue = (val: string) => {
    if (formik && fieldName) {
      formik.setFieldValue(fieldName, val);
    } else {
      setSelectedMonth?.(val);
    }
  };

  const dayjsValue: Dayjs | null = value ? dayjs(value) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <DatePicker
        label="Chọn tháng"
        inputFormat="MM/YYYY" // v5 vẫn hỗ trợ
        views={["year", "month"]}
        openTo="month"
        value={dayjsValue}
        onChange={(val) =>
          setValue(val ? dayjs(val).format("YYYY-MM") : "")
        }
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            size="small"
            sx={{ backgroundColor: "#fff" }}
          />
        )}
      />
    </LocalizationProvider>
  );
}
