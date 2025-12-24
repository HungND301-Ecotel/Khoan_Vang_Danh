import api from "../config/api.config";
import { ThicknessType } from "../types";

const ThicknessService = {
  getAll: async (params?: Record<string, any>): Promise<ThicknessType[]> => {
    const res = await api.get("/thickness", { params });
    return res.data.data;
  },
  create: async (data: Partial<ThicknessType>): Promise<any> => {
    const res = await api.post("/thickness", data);
    return res.data;
  },
  update: async (data: Partial<ThicknessType>): Promise<any> => {
    const res = await api.put(`/thickness/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/thickness`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/thickness/importFile", formData, {
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
      "/thickness/exportFile",
      {},
      { responseType: "blob" }
    );
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "thickness.xlsx");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default ThicknessService;
