import { useMemo } from "react";
import dayjs from "dayjs";
import { Materials } from "../../../types";

export function useInitialValues(
  selected: any | null,
  minimizedData: any | null,
  materialassignmentsData: any[],
) {
  return useMemo(() => {
    if (minimizedData) {
      return minimizedData;
    }

    // selected giờ là 1 MaterialCostUsed document phẳng (khi sửa):
    // { _id, department, productionScope, month, phase, production, unit, materials: [...] }
    return {
      _id: selected?._id || "",
      isOtherTask: selected?.isOtherTask || false,
      department: selected?.department?._id
        ? String(selected.department._id)
        : selected?.department || "",
      productionScope: selected?.productionScope?._id
        ? String(selected.productionScope._id)
        : selected?.productionScope || "",
      month: selected?.month
        ? dayjs(selected.month, "YYYY-MM").isValid()
          ? selected.month
          : dayjs(selected.month).format("YYYY-MM")
        : "",
      // Chỉ còn 1 phase duy nhất, không còn mảng phases
      phase: selected?.phase?._id ? String(selected.phase._id) : "",
      production: Number(selected?.production ?? 0),
      unit: selected?.unit ?? "",
      assignmentNormCode:
        selected?.assignmentNormCode?._id ||
        selected?.assignmentNormCode ||
        undefined,
      adjustmentNormCode:
        selected?.adjustmentNormCode?._id ||
        selected?.adjustmentNormCode ||
        undefined,

      selectedMaterials: (() => {
        const materialLookup = new Map(
          (materialassignmentsData || []).map((m: Materials) => [m._id, m]),
        );

        return (selected?.materials || [])
          .flatMap((group: any) => group.materials || [])
          .map((item: any) => {
            const materialId = item.material?._id || item.material;
            return materialLookup.get(materialId);
          })
          .filter(Boolean);
      })(),

      materials: (selected?.materials || [])
        .flatMap((group: any) => group.materials || [])
        .map((item: any) => ({
          material: item.material?._id
            ? String(item.material._id)
            : item.material,
          quantity: Number(item.quantity ?? 0),
        })),
    };
  }, [selected, minimizedData, materialassignmentsData]);
}
