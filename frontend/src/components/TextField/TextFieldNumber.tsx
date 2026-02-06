import { TextField } from "@mui/material";
import { getIn } from "formik";
import React from "react";
import { NumericFormat } from "react-number-format";

interface Props {
  formik?: any;
  field?: string;
}
export default function TextFieldNumber({ formik, field }: Props) {
  const currentValue = formik && field ? getIn(formik.values, field) : "";
  const touched = formik && field ? getIn(formik.touched, field) : false;
  const error = formik && field ? getIn(formik.errors, field) : "";
  return (
    <NumericFormat
      customInput={TextField}
      fullWidth
      value={currentValue}
      thousandSeparator="."
      decimalSeparator=","
      fixedDecimalScale={false}
      onValueChange={(values: any) => {
        formik.setFieldValue(
          field,
          values.floatValue === undefined ? 0 : values.floatValue,
        );
      }}
      // Giữ nguyên style của bạn
      error={Boolean(touched && error)}
      helperText={touched && error}
      variant="outlined"
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
}
