import api from "../config/api.config";
import { HardnessType } from "../types";

const HardnessService = {
  getAll: async (params?: Record<string, any>): Promise<HardnessType[]> => {
    const res = await api.get("/hardness", { params });
    return res.data.data;
  },
  create: async (data: Partial<HardnessType>): Promise<any> => {
    const res = await api.post("/hardness", data);
    return res.data;
  },
  update: async (data: Partial<HardnessType>): Promise<any> => {
    const res = await api.put(`/hardness/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/hardness`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/hardness/importFile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (!onProgress) return;
        const total = e.total ?? 1;
        const percent = Math.round((e.loaded * 100) / total);
        onProgress(percent);
      },
    });
    return res.data;
  },
  exportFile: async () => {
    const res = await api.post(
      "/hardness/exportFile",
      {},
      { responseType: "blob" }
    );
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "hardness.xlsx");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default HardnessService;
