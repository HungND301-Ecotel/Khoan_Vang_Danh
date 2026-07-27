import { TextField } from "@mui/material";
import React from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { getIn } from "formik";

export default function FieldDate({
  formik,
  fieldName,
  disabled,
  label = "Chọn ngày",
}: {
  formik?: any;
  fieldName: string;
  disabled?: boolean;
  label?: string;
}) {
  const value = formik ? getIn(formik.values, fieldName) : null;

  const setValue = (val: string) => {
    if (formik) {
      formik.setFieldValue(fieldName, val);
    }
  };

  // Chuyển dd/MM/yyyy → dayjs object
  const parseDate = (dateStr: string): Dayjs | null => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    const parsed = dayjs(`${year}-${month}-${day}`, "YYYY-MM-DD", true);
    return parsed.isValid() ? parsed : null;
  };

  const dayjsValue: Dayjs | null = parseDate(value);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <DatePicker
        disabled={disabled}
        label={label}
        inputFormat="DD/MM/YYYY"
        value={dayjsValue}
        onChange={(val) => {
          if (val && val.isValid()) {
            setValue(val.format("DD/MM/YYYY"));
          } else {
            setValue("");
          }
        }}
        renderInput={(params) => {
          const touched = formik ? getIn(formik.touched, fieldName) : false;
          const error = formik ? getIn(formik.errors, fieldName) : null;
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
