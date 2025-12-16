import { useQuery } from "@tanstack/react-query";
import api from "../config/api.config";
import { UnitType } from "../types";

const UserService = {
    update: async (data: any, id?: string): Promise<any> => {
        const res = await api.put(`/users/update/${id}`, { data });
        return res.data.data
    },
    changePass: async (data: any, id?: string): Promise<any> => {
        const res = await api.post(`/auths/${id}/changepass`, { data });
        return res.data.data
    },
};

export default UserService;