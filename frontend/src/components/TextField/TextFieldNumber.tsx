import { TextField } from "@mui/material";
import { getIn } from "formik";
import { NumericFormat } from "react-number-format";

interface Props {
  formik?: any;
  field?: string;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
}
export default function TextFieldNumber({
  formik,
  field,
  disabled = false,
  onValueChange,
}: Props) {
  const currentValue = formik && field ? getIn(formik.values, field) : "";
  const touched = formik && field ? getIn(formik.touched, field) : false;
  const error = formik && field ? getIn(formik.errors, field) : "";
  return (
    <NumericFormat
      customInput={TextField}
      fullWidth
      disabled={disabled}
      value={currentValue}
      thousandSeparator="."
      decimalSeparator=","
      fixedDecimalScale={false}
      onValueChange={(values: any) => {
        const val = values.floatValue === undefined ? 0 : values.floatValue;
        formik.setFieldValue(field, val);
        if (onValueChange) {
          onValueChange(val);
        }
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
