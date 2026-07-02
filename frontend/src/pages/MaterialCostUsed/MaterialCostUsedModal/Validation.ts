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
  groupIndexes: Yup.object().when("isOtherTask", {
    is: false,
    then: (schema) => schema.required("Vui lòng chọn thời gian"),
    otherwise: (schema) => schema.nullable(),
  }),
  phases: Yup.array().when("isOtherTask", {
    is: false,
    then: (schema) => schema.of(
      Yup.object().shape({
        phase: Yup.string().required("Vui lòng chọn công đoạn"),
        production: Yup.number()
          .typeError("Sản lượng phải là số")
          .min(0, "Sản lượng phải lớn hơn 0")
          .required("Vui lòng nhập sản lượng"),
        unit: Yup.string().required("Vui lòng nhập đơn vị tính"),
      })
    ),
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
