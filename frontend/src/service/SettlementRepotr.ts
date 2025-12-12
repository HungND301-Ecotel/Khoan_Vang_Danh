import { useQuery } from "@tanstack/react-query";
import api from "../config/api.config";
import { UnitType } from "../types";

const SettlementService = {
    exportFile: async (
        data: any
    ) => {
        const res = await api.post('/contractsettlements/getExcel', { data: data }, {
            responseType: 'blob',
        });
        const blob = new Blob([res.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `*.xlsx`);

        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};

export default SettlementService;