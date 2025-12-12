import api from "../config/api.config";
import { PhaseGroupType } from "../types";

const PhaseGroupService = {
  getAll: async (params?: Record<string, any>): Promise<PhaseGroupType[]> => {
    const res = await api.get("/phasegroups", { params });
    return res.data.data;
  },
  create: async (data: Partial<PhaseGroupType>): Promise<any> => {
    const res = await api.post("/phasegroups", data);
    return res.data;
  },
  update: async (data: Partial<PhaseGroupType>): Promise<any> => {
    const res = await api.put(`/phasegroups/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/phasegroups`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/phasegroups/importFile", formData, {
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
      "/phasegroups/exportFile",
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

export default PhaseGroupService;
