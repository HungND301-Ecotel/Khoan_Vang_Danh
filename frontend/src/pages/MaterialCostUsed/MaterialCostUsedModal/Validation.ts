import * as Yup from "yup";

export const validationSchema = Yup.object().shape({
  department: Yup.string().required("Vui lòng chọn phân xưởng"),
  isOtherTask: Yup.boolean(),
  productionScope: Yup.string().when("isOtherTask", {
    is: false,
    then: (schema) => schema.required("Vui lòng chọn diện sản xuất"),
    otherwise: (schema) => schema.nullable(),
  }),
  month: Yup.string().required("Vui lòng chọn thời gian"),

  date: Yup.number()
    .typeError("Ngày phải là số")
    .required("Vui lòng nhập ngày")
    .min(1, "Ngày từ 1 đến 31")
    .max(31, "Ngày từ 1 đến 31"),

  shift: Yup.number()
    .typeError("Ca phải là số")
    .required("Vui lòng nhập ca")
    .min(1, "Ca từ 1 đến 3")
    .max(3, "Ca từ 1 đến 3"),

  phase: Yup.string().when("isOtherTask", {
    is: false,
    then: (schema) => schema.required("Vui lòng chọn công đoạn"),
    otherwise: (schema) => schema.nullable(),
  }),
  production: Yup.number().when("isOtherTask", {
    is: false,
    then: (schema) =>
      schema
        .typeError("Sản lượng phải là số")
        .min(0, "Sản lượng phải lớn hơn hoặc bằng 0")
        .required("Vui lòng nhập sản lượng"),
    otherwise: (schema) => schema.nullable(),
  }),
  unit: Yup.string().when("isOtherTask", {
    is: false,
    then: (schema) => schema.required("Vui lòng nhập đơn vị tính"),
    otherwise: (schema) => schema.nullable(),
  }),

  materials: Yup.array().of(
    Yup.object().shape({
      quantity: Yup.number()
        .min(0, "Số lượng phải lớn hơn 0")
        .typeError("Số lượng phải là số")
        .required("Vui lòng nhập số lượng"),
    }),
  ),
});
