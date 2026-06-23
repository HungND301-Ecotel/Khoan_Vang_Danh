import { useMemo } from "react";
import dayjs from "dayjs";
import { Materials } from "../../../types";

export function useInitialValues(
  selected: any | null,
  materialassignmentsData: any[],
  cuttingPhaseGroupKey: string
) {
  return useMemo(() => ({
    isOtherTask: selected?.isOtherTask || false,
    department: selected?.department?._id
      ? String(selected.department._id)
      : "",
    productionScope: selected?.productionScope?._id
      ? String(selected.productionScope._id)
      : "",
    groupIndexes: null,
    month: selected?.month ? dayjs(selected?.month).format("YYYY-MM") : "",
    phases: (selected?.phases || selected?.productionScope?.phases || []).map(
      (p: any) => ({
        phase: p.phase?._id ? String(p.phase._id) : "",
        production: Number(p.production ?? 0),
        unit:
          p.phase?.unit ??
          (p.phase?.code
            ?.toLowerCase()
            ?.includes(cuttingPhaseGroupKey?.toLowerCase())
            ? "tấn"
            : "mét"),
        assignmentNormCode: p?.assignmentNormCode,
        adjustmentNormCode: p?.adjustmentNormCode,
      }),
    ),
    selectedMaterials: (() => {
      const materialLookup = new Map(
        (materialassignmentsData || []).map((m: Materials) => [m._id, m]),
      );
      const uniqueMaterialIds = new Set();
      const result: any[] = [];
      (selected?.materials || []).forEach((group: any) => {
        (group.materials || []).forEach((i: any) => {
          const materialId = i.material?._id;
          if (
            materialId &&
            materialLookup.has(materialId) &&
            !uniqueMaterialIds.has(materialId)
          ) {
            uniqueMaterialIds.add(materialId);
            result.push(materialLookup.get(materialId));
          }
        });
      });
      return result;
    })(),
    materials: (() => {
      const aggregatedMaterials = new Map();
      (selected?.materials || []).forEach((group: any) => {
        (group.materials || []).forEach((mat: any) => {
          const matId = mat.material?._id ? String(mat.material._id) : "";
          if (matId) {
            if (aggregatedMaterials.has(matId)) {
              aggregatedMaterials.set(
                matId,
                aggregatedMaterials.get(matId) + (Number(mat.quantity) || 0)
              );
            } else {
              aggregatedMaterials.set(matId, Number(mat.quantity) || 0);
            }
          }
        });
      });
      return Array.from(aggregatedMaterials.entries()).map(
        ([material, quantity]) => ({
          material,
          quantity,
        })
      );
    })(),
  }), [selected, materialassignmentsData, cuttingPhaseGroupKey]);
}
