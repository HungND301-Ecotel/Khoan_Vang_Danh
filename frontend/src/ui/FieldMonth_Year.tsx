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
  fieldName,
  disabled
}: {
  formik?: any;
  selectedMonth?: string;
  setSelectedMonth?: React.Dispatch<React.SetStateAction<string>>;
  fieldName?: string;
  disabled?: boolean;
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
        disabled={disabled}
        label="Chọn tháng"
        inputFormat="MM/YYYY" // v5 vẫn hỗ trợ
        views={["year", "month"]}
        openTo="month"
        value={dayjsValue}
        onChange={(val) => setValue(val ? dayjs(val).format("YYYY-MM") : "")}
        renderInput={(params) => {
          const touched = formik && fieldName ? getIn(formik.touched, fieldName) : false;
          const error = formik && fieldName ? getIn(formik.errors, fieldName) : null;
          return (
            <TextField
              {...params}
              fullWidth
              size="small"
              error={Boolean(touched && error)}
              helperText={touched ? error : ""}
              sx={{
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF",
                },
              }}
            />
          );
        }}
      />
    </LocalizationProvider>
  );
}
