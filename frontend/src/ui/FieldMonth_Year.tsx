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
  disabled,
  restrictToYear,
  label,
}: {
  formik?: any;
  selectedMonth?: string;
  setSelectedMonth?: React.Dispatch<React.SetStateAction<string>>;
  fieldName?: string;
  disabled?: boolean;
  restrictToYear?: number;
  label?: string;
}) {
  const value =
    formik && fieldName ? getIn(formik.values, fieldName) : selectedMonth;

  const setValue = (val: string) => {
    if (formik && fieldName) {
      formik.setFieldValue(fieldName, val);
    } else {
      setSelectedMonth?.(val);
    }
  };

  const dayjsValue: Dayjs | null = value ? dayjs(value) : null;
  const minDate = restrictToYear ? dayjs(`${restrictToYear}-01-01`) : undefined;
  const maxDate = restrictToYear ? dayjs(`${restrictToYear}-12-31`) : undefined;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <DatePicker
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        label={label}
        inputFormat="MM/YYYY" // v5 vẫn hỗ trợ
        views={["year", "month"]}
        openTo="month"
        value={dayjsValue}
        onChange={(val) => {
          if (!val) {
            setValue("");
            return;
          }
          // Nếu có giới hạn năm, ép giá trị về đúng năm đó (phòng trường hợp user vẫn cố mở view năm)
          const finalVal = restrictToYear
            ? dayjs(val).year(restrictToYear)
            : dayjs(val);
          setValue(finalVal.format("YYYY-MM"));
        }}
        renderInput={(params) => {
          const touched =
            formik && fieldName ? getIn(formik.touched, fieldName) : false;
          const error =
            formik && fieldName ? getIn(formik.errors, fieldName) : null;
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
