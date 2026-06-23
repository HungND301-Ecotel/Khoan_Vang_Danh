import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";

export function useModalQueries() {
  const { data: productionscopes = { data: [] } } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: async () =>
      api.get("/productionscopes").then((res) => res.data.data),
  });

  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: async () => api.get("/phases").then((res) => res.data.data),
  });

  const { data: assignmentnorms = { data: [] } } = useQuery({
    queryKey: ["assignmentnorms"],
    queryFn: async () =>
      api.get("/assignmentnorms").then((res) => res.data.data),
  });

  const { data: departments = { data: [] } } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => api.get("/departments").then((res) => res.data.data),
  });

  const { data: adjustmentnorms = { data: [] } } = useQuery({
    queryKey: ["adjustmentnorms"],
    queryFn: async () =>
      api.get("/adjustmentnorms").then((res) => res.data.data),
  });

  return {
    productionscopes,
    phases,
    assignmentnorms,
    departments,
    adjustmentnorms,
  };
}
