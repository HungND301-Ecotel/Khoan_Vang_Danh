import api from "../config/api.config";
import { CrossSectionInputType, CrossSectionOutputType } from "../types";

const CrossSectionService = {
  getAll: async (
    params?: Record<string, any>
  ): Promise<CrossSectionOutputType[]> => {
    const res = await api.get("/crosssections", { params });
    return res.data.data;
  },
  create: async (data: Partial<CrossSectionInputType>): Promise<any> => {
    const res = await api.post("/crosssections", data);
    return res.data;
  },
  update: async (data: Partial<CrossSectionInputType>): Promise<any> => {
    const res = await api.put(`/crosssections/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/crosssections`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/crosssections/importFile", formData, {
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
      "/crosssections/exportFile",
      {},
      {
        responseType: "blob",
      }
    );
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `crosssections.xlsx`);

    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default CrossSectionService;
