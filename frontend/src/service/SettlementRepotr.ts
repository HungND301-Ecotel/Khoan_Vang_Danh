import api from "../config/api.config";

const SettlementService = {
  exportFile: async (data: any) => {
    const res = await api.post(
      "/contractsettlements/getExcel",
      { data: data },
      {
        responseType: "blob",
      },
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
  exportFileM3: async (data: any) => {
    const res = await api.post(
      "/contractsettlements/getExcelM3",
      { data: data },
      {
        responseType: "blob",
      },
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

  getContractSettlements: async (
    fromMonth: string,
    toMonth: string,
    phase: string,
    productionScope: string,
    department: string,
  ) => {
    const res = await api.get(
      `/contractsettlements/getMonth?fromMonth=${fromMonth}&toMonth=${toMonth}&phase=${phase}&productionScope=${productionScope}&department=${department}`,
    );
    return res.data.data;
  },
};

export default SettlementService;
