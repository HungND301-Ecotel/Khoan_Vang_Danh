import * as yup from "yup";

export const validationSchema = yup.object().shape({
  department: yup.string().required("Vui lòng chọn phân xưởng"),
  month: yup.string().required("Vui lòng chọn thời gian"),
  groups: yup
    .array()
    .of(
      yup.object().shape({
        productionScope: yup.string().required("Vui lòng chọn diện sản xuất"),
        phases: yup
          .array()
          .of(
            yup.object().shape({
              phase: yup.string().required("Vui lòng chọn công đoạn"),
              production: yup
                .number()
                .min(1, "Sản lượng phải lớn hơn 0")
                .required("Bắt buộc"),
              unit: yup.string().required("Bắt buộc"),
            }),
          )
          .min(1, "Cần ít nhất một công đoạn"),
      }),
    )
    .min(1, "Cần ít nhất một diện sản xuất"),
});
