import api from "../config/api.config";
import { Materials } from "../types"; // Giả sử Materials là type cho entity MaterialAssignment

const MaterialAssignmentService = {
  getAll: async (
    params?: Record<string, any>
  ): Promise<{ totalDocs: number; data: Materials[] }> => {
    const res = await api.get("/materialAssignments", { params });
    return res.data.data;
  },
  create: async (data: Partial<Materials>): Promise<any> => {
    const res = await api.post("/materialAssignments", data);
    return res.data;
  },
  update: async (data: Partial<Materials>): Promise<any> => {
    const res = await api.put(`/materialAssignments/${data?._id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<any> => {
    const res = await api.delete(`/materialAssignments/${id}`);
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/materialAssignments/importFile", formData, {
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
  exportFile: async (type: string) => {
    const res = await api.post(
      `/materialAssignments/exportFile?type=${type}`,
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
    link.setAttribute("download", `vat_tu_tai_san_trong_khoan.xlsx`);

    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default MaterialAssignmentService;
