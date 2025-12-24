import api from "../config/api.config";
import { AdjustmentNormKOutputType, AdjustmentNormInputType } from "../types";

const AdjustmentNormService = {
  getAll: async (
    params?: Record<string, any>
  ): Promise<AdjustmentNormKOutputType[]> => {
    const res = await api.get("/adjustmentnorms", { params });
    return res.data.data;
  },
  create: async (data: Partial<AdjustmentNormInputType>): Promise<any> => {
    const res = await api.post("/adjustmentnorms", data);
    return res.data;
  },
  update: async (data: Partial<AdjustmentNormInputType>): Promise<any> => {
    const res = await api.put(`/adjustmentnorms/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/adjustmentnorms`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    // onProgress?: (percent: number) => void,
    type: string
  ) => {
    const res = await api.post(`/adjustmentnorms/importFile?type=${type}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      // onUploadProgress: (e) => {
      //   if (!onProgress) return;
      //   const total = e.total ?? 1;
      //   const percent = Math.round((e.loaded * 100) / total);
      //   onProgress(percent);
      // },
    });
    return res.data;
  },
  exportFile: async (type: string) => {
    const res = await api.post(
      `/adjustmentnorms/exportFile?type=${type}`,
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
    link.setAttribute("download", `*.xlsx`);

    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default AdjustmentNormService;
