import { useMemo } from "react";
import dayjs from "dayjs";
import { InitialPlannedCostFormType } from "./types";

export function useInitialValues(
  selected: any,
  minimizedData: any,
  cuttingPhaseGroupKey: string,
): InitialPlannedCostFormType {
  const emptyPhase = () => ({
    phase: "",
    production: 0,
    unit: "mét",
    assignmentNormCode: undefined,
    adjustmentNormCode: undefined,
    assignmentCodes: [],
  });

  const initialValues = useMemo(() => {
    // 1. Khôi phục từ trạng thái thu nhỏ - giữ nguyên nhiều group, nhiều phase
    if (minimizedData) {
      return {
        ...minimizedData,
        groups: minimizedData.groups.map((group: any) => ({
          ...group,
          phases:
            (group.phases || []).length > 0 ? group.phases : [emptyPhase()],
        })),
      };
    }

    // 2. Sửa 1 phase-document cụ thể - vẫn bọc vào vỏ groups[].phases[]
    //    nhưng chỉ có đúng 1 group + đúng 1 phase (selected là 1 document phẳng)
    if (selected?._id) {
      const p = selected;

      const mappedPhase = {
        phase: p.phase?._id ? String(p.phase._id) : "",
        production: Number(p.production ?? 0),
        unit:
          p.unit ||
          (p.phase?.code
            ?.toLowerCase()
            ?.includes(cuttingPhaseGroupKey?.toLowerCase())
            ? "tấn"
            : "mét"),
        assignmentNormCode:
          p.assignmentNormCode?._id || p.assignmentNormCode || undefined,
        adjustmentNormCode:
          p.adjustmentNormCode?._id || p.adjustmentNormCode || undefined,
        assignmentCodes: (p.initialPlannedCostDetails || []).map((d: any) => ({
          assignmentCode: d.assignmentCode?._id || d.assignmentCode,
          code: d.assignmentCode?.code || "",
          name: d.assignmentCode?.name || "",
          baseNorm: d.baseNorm ?? 0,
          adjustmentNorm: d.adjustmentNorm ?? 1,
          norm: d.norm ?? 0,
          checked: true,
        })),
      };

      return {
        _id: p._id,
        department: p?.department?._id
          ? String(p.department._id)
          : p?.department || "",
        month: p?.month
          ? dayjs(p.month, "YYYY-MM").isValid()
            ? p.month
            : dayjs(p.month).format("YYYY-MM")
          : dayjs().format("YYYY-MM"),
        groups: [
          {
            productionScope: p?.productionScope?._id
              ? String(p.productionScope._id)
              : p?.productionScope || "",
            phases: [mappedPhase], // 👈 chỉ 1 phase duy nhất, đúng 1 document đang sửa
          },
        ],
      };
    }

    // 3. Tạo mới - group rỗng, UI vẫn cho phép thêm nhiều diện/nhiều phase
    return {
      _id: "",
      department: selected?.department?._id
        ? String(selected.department._id)
        : "",
      month: dayjs().format("YYYY-MM"),
      groups: [
        {
          productionScope: "",
          phases: [emptyPhase()],
        },
      ],
    };
  }, [selected, minimizedData, cuttingPhaseGroupKey]);

  return initialValues;
}
