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
      date: selected?.date || "", // Ngày trong tháng (number)
      shift: selected?.shift || "", // Ca (number)
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

        const rawMaterials = selected?.materials || [];
        const materialsList =
          rawMaterials.length > 0 && rawMaterials[0]?.materials
            ? rawMaterials.flatMap((group: any) => group.materials || []) // MaterialCostUsed
            : rawMaterials; // OtherMaterialCost (flat array)

        return materialsList
          .map((item: any) => {
            const materialId = item.material?._id || item.material;
            return materialLookup.get(materialId);
          })
          .filter(Boolean);
      })(),

      materials: (() => {
        // Xử lý cả 2 cấu trúc: MaterialCostUsed (nested) và OtherMaterialCost (flat)
        const rawMaterials = selected?.materials || [];
        const materialsList =
          rawMaterials.length > 0 && rawMaterials[0]?.materials
            ? rawMaterials.flatMap((group: any) => group.materials || []) // MaterialCostUsed
            : rawMaterials; // OtherMaterialCost (flat array)

        return materialsList.map((item: any) => ({
          material: item.material?._id
            ? String(item.material._id)
            : item.material,
          quantity: Number(item.quantity ?? 0),
        }));
      })(),
    };
  }, [selected, minimizedData, materialassignmentsData]);
}
