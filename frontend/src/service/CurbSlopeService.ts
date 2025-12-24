import api from "../config/api.config";
import { CurbSlopeType } from "../types";

const CurbSlopeService = {
  getAll: async (params?: Record<string, any>): Promise<CurbSlopeType[]> => {
    const res = await api.get("/curbslopes", { params });
    return res.data.data;
  },
  create: async (data: Partial<CurbSlopeType>): Promise<any> => {
    const res = await api.post("/curbslopes", data);
    return res.data;
  },
  update: async (data: Partial<CurbSlopeType>): Promise<any> => {
    const res = await api.put(`/curbslopes/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/curbslopes`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/curbslopes/importFile", formData, {
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
      "/curbslopes/exportFile",
      {},
      { responseType: "blob" }
    );
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "curbslopes.xlsx");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default CurbSlopeService;
