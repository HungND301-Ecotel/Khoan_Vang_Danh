import { Autocomplete, TextField, Box } from "@mui/material";
import { getIn } from "formik";

interface Props {
  title: string;
  data: any[];
  labelkey: string;
  formik?: any;
  field?: string;
  disabled?: boolean;
  labelOption?: string;
  onChange?: (newValue: any) => void;
  onSearch?: (value: string) => void;
  componentsProps?: any;
  autocompleteSx?: any;
}

export default function FieldAutoCompleted({
  title,
  data = [],
  labelkey,
  formik,
  field,
  disabled,
  onChange,
  onSearch,
  labelOption,
  componentsProps,
  autocompleteSx,
}: Props) {
  const currentValue = formik && field ? getIn(formik.values, field) : null;

  const selectedOption =
    data.find((i) => i._id?.toString() === currentValue?.toString()) || null;

  const touched = field ? getIn(formik.touched, field) : false;
  const error = field ? getIn(formik.errors, field) : null;

  return (
    <Autocomplete
      sx={autocompleteSx}
      componentsProps={componentsProps}
      disabled={disabled}
      fullWidth
      options={data}
      getOptionLabel={(option: any) => {
        if (!option) return ""; // Tránh lỗi khi option là null/undefined
        if (typeof option === "string") return option; // Tránh lỗi nếu truyền string vào thay vì object

        return `${option[labelkey] || ""} ${(labelOption && `- ${option[labelOption]}`) || ""}`.trim();
      }}
      isOptionEqualToValue={(option, value) => option?._id === value?._id}
      value={selectedOption}
      onChange={(e, newValue) => {
        if (formik && field) {
          formik.setFieldValue(field, newValue?._id, true);
          formik.setFieldError(field, undefined);
        }
        if (onChange) {
          onChange(newValue);
        }
      }}
      onInputChange={(_, value) => onSearch?.(value)}
      renderOption={(props, option, state) => {
        const label = `${option[labelkey] || ""}${
          labelOption ? ` - ${option[labelOption]}` : ""
        }`;

        return (
          <li
            {...props}
            key={`${option._id} - ${state.index}`}
            title={label} // tooltip native
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
              display: "block",
            }}
          >
            {label}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={title}
          error={Boolean(touched && error)}
          helperText={touched ? error : ""}
          onBlur={() => {
            if (formik && field) {
              formik.setFieldTouched(field, true, true);
            }
          }}
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
  );
}
