import api from "../config/api.config";
import { LengthType } from "../types";

const LengthService = {
  getAll: async (params?: Record<string, any>): Promise<LengthType[]> => {
    const res = await api.get("/length", { params });
    return res.data.data;
  },
  create: async (data: Partial<LengthType>): Promise<any> => {
    const res = await api.post("/length", data);
    return res.data;
  },
  update: async (data: Partial<LengthType>): Promise<any> => {
    const res = await api.put(`/length/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/length`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/length/importFile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (!onProgress) return;
        const total = e.total ?? 1;
        const percent = Math.round((e.loaded * 100) / total);
        onProgress(percent);
      },
    });
    return res.data.message;
  },
  exportFile: async () => {
    const res = await api.post(
      "/length/exportFile",
      {},
      { responseType: "blob" }
    );
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "length.xlsx");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default LengthService;
