import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { MaterialAssignmentInputType } from "../../../types";

export function useModalQueries(
  department: string,
  productionScope: string,
  month: string,
  open: boolean,
) {
  const queryClient = useQueryClient();

  const { data: availableScopes = [] } = useQuery({
    queryKey: ["availableScopes", department],
    queryFn: async () => {
      const res = await api.get(
        `/initialplannedcosts/getScopesByDepartment/${department}`,
      );
      return res.data.data;
    },
    enabled: !!department,
  });

  const { data: productionscopes = { data: [] } } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: async () =>
      api.get("/productionscopes").then((res) => res.data.data),
  });

  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: async () => api.get("/phases").then((res) => res.data.data),
  });

  const { data: departments = { data: [] } } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => api.get("/departments").then((res) => res.data.data),
  });

  const {
    data: assignmentcodes = { totalDocs: 0, results: 0, data: [] },
    isLoading: isLoadingAssignmentCodes,
    isFetching: isFetchingAssignmentCodes,
  } = useQuery({
    queryKey: ["assignmentcodes", "all"],
    queryFn: async () => {
      try {
        const response = await api.get(`/assignmentcodes`);
        return response.data.data;
      } catch (error) {
        return [];
      }
    },
  });

  const {
    data: materialassignments = { data: [] },
    refetch: refetchMaterialAssignments,
  } = useQuery({
    queryKey: ["materialassignments"],
    queryFn: async () =>
      api.get("/materialassignments").then((res) => res.data.data),
  });

  // Danh sách tháng có kế hoạch cho đúng department + productionScope
  const initialplannedcostMonths = useQuery({
    queryKey: [
      "initialplannedcost-months-by-scope",
      department,
      productionScope,
    ],
    queryFn: async () => {
      const res = await api.get("/initialplannedcosts/months", {
        params: { department, productionScope },
      });
      return res.data.data; // [{ _id, month, totalMonthCost }]
    },
    enabled: !!department && !!productionScope && open,
  });

  // Danh sách phase (công đoạn) thuộc department + productionScope + month đã chọn
  const scopePhases = useQuery({
    queryKey: [
      "initialplannedcost-phases-for-scope",
      department,
      productionScope,
      month,
    ],
    queryFn: async () => {
      const res = await api.get("/initialplannedcosts/phases", {
        params: { department, month, productionScope },
      });
      return res.data.data; // mảng phase-document phẳng: [{_id, phase, unit, production, assignmentNormCode, adjustmentNormCode, ...}]
    },
    enabled: !!department && !!productionScope && !!month && open,
  });

  const createMutation = useMutation({
    mutationFn: (newMaterialAssignment: Partial<MaterialAssignmentInputType>) =>
      api
        .post("/materialassignments", newMaterialAssignment)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialassignments"] });
    },
    onError: (error: any) => {
      console.log(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  return {
    availableScopes,
    productionscopes,
    phases,
    departments,
    assignmentcodes,
    isLoadingAssignmentCodes,
    isFetchingAssignmentCodes,
    materialassignments,
    refetchMaterialAssignments,
    initialplannedcostMonths,
    scopePhases,
    createMutation,
  };
}
