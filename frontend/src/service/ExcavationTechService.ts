import api from "../config/api.config";
import { ExcavationTechType } from "../types";

const ExcavationTechService = {
  getAll: async (
    params?: Record<string, any>
  ): Promise<ExcavationTechType[]> => {
    const res = await api.get("/excavationtechs", { params });
    return res.data.data;
  },
  create: async (data: Partial<ExcavationTechType>): Promise<any> => {
    const res = await api.post("/excavationtechs", data);
    return res.data;
  },
  update: async (data: Partial<ExcavationTechType>): Promise<any> => {
    const res = await api.put(`/excavationtechs/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/excavationtechs`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/excavationtechs/importFile", formData, {
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
      "/excavationtechs/exportFile",
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
    link.setAttribute("download", `excavation_techs.xlsx`);

    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default ExcavationTechService;
