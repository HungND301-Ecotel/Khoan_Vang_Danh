export const SYSTEM_KEYS = {
  DAO_LO: "ĐL",
  KHAU_THAN: "KT",
  XEN_LO: "XL",
} as const;

export type ExtraFieldKey =
  | "excavationTech"
  | "step"
  | "crossSection"
  | "hardness"
  | "length"
  | "curbSlope"
  | "thickness";

// Đăng ký endpoint + nhãn cho từng field phụ có thể xuất hiện tuỳ loại định mức
export const FIELD_REGISTRY: {
  [key in ExtraFieldKey]: { endpoint: string; label: string };
} = {
  excavationTech: { endpoint: "/excavationtechs", label: "Công nghệ xúc" },
  step: { endpoint: "/steps", label: "Chống" },
  crossSection: { endpoint: "/crosssections", label: "Tiết diện lò xén" },
  hardness: { endpoint: "/hardness", label: "Độ cứng" },
  length: { endpoint: "/length", label: "Chiều dài" },
  curbSlope: { endpoint: "/curbslopes", label: "Độ dốc vỉa" },
  thickness: { endpoint: "/thickness", label: "Độ dày vỉa" },
};

export interface NormTypeConfig {
  type: "excavation" | "cutting" | "coal_kb" | "coal_zh" | "coal_zry";
  pageTitle: string;
  exportFileName: string;
  systemConfigKey: string;
  // các field ObjectId phụ (ngoài phaseGroup/phase/code/startMonth/endMonth) mà loại này cần
  extraFields: ExtraFieldKey[];
  // field nào trong extraFields là bắt buộc (validation)
  requiredExtraFields: ExtraFieldKey[];
  hasPhase?: boolean; // mặc định true. false = không có phaseGroup/phase (áp dụng cho khấu than KB/ZH/ZRY)
}

export const excavationConfig: NormTypeConfig = {
  type: "excavation",
  pageTitle: "Định mức đào lò",
  exportFileName: "dinh_muc_dao_lo.xlsx",
  systemConfigKey: SYSTEM_KEYS.DAO_LO,
  extraFields: ["excavationTech", "step"],
  requiredExtraFields: ["excavationTech", "step"],
};

export const cuttingConfig: NormTypeConfig = {
  type: "cutting",
  pageTitle: "Định mức xén lò",
  exportFileName: "dinh_muc_xen_lo.xlsx",
  systemConfigKey: SYSTEM_KEYS.XEN_LO,
  extraFields: ["crossSection", "hardness"],
  requiredExtraFields: ["crossSection", "hardness"],
};

export const coalKBConfig: NormTypeConfig = {
  type: "coal_kb",
  pageTitle: "Định mức khấu than KB",
  exportFileName: "dinh_muc_khau_than_kb.xlsx",
  systemConfigKey: SYSTEM_KEYS.KHAU_THAN,
  extraFields: ["curbSlope", "hardness", "thickness"],
  requiredExtraFields: ["curbSlope", "hardness"],
  hasPhase: false,
};

export const coalZHConfig: NormTypeConfig = {
  type: "coal_zh",
  pageTitle: "Định mức khấu than ZH",
  exportFileName: "dinh_muc_khau_than_zh.xlsx",
  systemConfigKey: SYSTEM_KEYS.KHAU_THAN,
  extraFields: ["hardness", "length", "thickness"],
  requiredExtraFields: ["hardness"],
  hasPhase: false,
};

export const coalZRYConfig: NormTypeConfig = {
  type: "coal_zry",
  pageTitle: "Định mức khấu than ZRY",
  exportFileName: "dinh_muc_khau_than_zry.xlsx",
  systemConfigKey: SYSTEM_KEYS.KHAU_THAN,
  extraFields: ["hardness", "length", "thickness"],
  requiredExtraFields: ["hardness", "length", "thickness"],
  hasPhase: false,
};
