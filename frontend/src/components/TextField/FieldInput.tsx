import { TextField } from "@mui/material";
import { getIn } from "formik";
import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";

interface Props {
  title?: string;
  type?: string;
  formik?: any;
  field?: string;
  disabled?: boolean;
  InputProps?: any;
  InputLabelProps?: any;
  onChange?: (newValue: any) => void;
}
export default function FieldInput({
  title,
  type = "text",
  formik,
  field,
  disabled = false,
  InputProps,
  InputLabelProps,
  onChange,
}: Props) {
  const currentValue = formik && field ? getIn(formik.values, field) : "";
  const touched = formik && field ? getIn(formik.touched, field) : false;
  const error = formik && field ? getIn(formik.errors, field) : "";

  const [localValue, setLocalValue] = useState(currentValue);
  const debouncedValue = useDebounce(localValue, 300);
  useEffect(() => {
    if (field && debouncedValue !== getIn(formik.values, field)) {
      formik.setFieldValue(field, debouncedValue);
    }
  }, [debouncedValue]);
  useEffect(() => {
    setLocalValue(currentValue);
  }, [currentValue]);
  return (
    <TextField
      disabled={disabled}
      fullWidth
      type={type}
      size="small"
      title={title}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        if (field) {
          formik.setFieldError(field, undefined);
          formik.setFieldTouched(field, true, false);
        }
        if (onChange) {
          onChange(e.target.value);
        }
      }}
      error={Boolean(touched && error)}
      helperText={touched && error}
      InputProps={InputProps}
      InputLabelProps={InputLabelProps}
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
