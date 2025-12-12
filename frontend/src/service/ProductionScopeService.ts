import api from "../config/api.config";
import { ProductionScopeInputType, ProductionScopeOutputType } from "../types";

const ProductionScopeService = {
  getAll: async (
    params?: Record<string, any>
  ): Promise<ProductionScopeOutputType[]> => {
    const res = await api.get("/productionscopes", { params });
    return res.data.data;
  },
  create: async (data: Partial<ProductionScopeInputType>): Promise<any> => {
    const res = await api.post("/productionscopes", data);
    return res.data;
  },
  update: async (data: Partial<ProductionScopeInputType>): Promise<any> => {
    const res = await api.put(`/productionscopes/${data?._id}`, data);
    return res.data;
  },
  delete: async (ids: string[]): Promise<any> => {
    const res = await api.delete(`/productionscopes`, { data: { ids } });
    return res.data.message;
  },
  importFile: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    const res = await api.post("/productionscopes/importFile", formData, {
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
      "/productionscopes/exportFile",
      {},
      { responseType: "blob" }
    );
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "productionscopes.xlsx");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default ProductionScopeService;
