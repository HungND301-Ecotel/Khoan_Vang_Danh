import { useMemo } from "react";
import dayjs from "dayjs";
import { InitialPlannedCostFormType } from "./types";

export function useInitialValues(
  selected: any,
  minimizedData: any,
  cuttingPhaseGroupKey: string,
): InitialPlannedCostFormType {
  const initialValues = useMemo(() => {
    if (minimizedData) {
      return minimizedData;
    }

    if (selected?._id) {
      return {
        _id: selected._id,
        department: selected?.department?._id
          ? String(selected.department._id)
          : selected?.department || "",
        month: selected?.month
          ? dayjs(selected.month).format("YYYY-MM")
          : dayjs().format("YYYY-MM"),
        groups: [
          {
            productionScope: selected?.productionScope?._id
              ? String(selected.productionScope._id)
              : "",
            phases: (selected?.phases || []).map((p: any) => ({
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
              assignmentCodes: p.assignmentNormCode?.norms
                ? p.assignmentNormCode.norms.map((n: any) => {
                    const detail = p.initialPlannedCostDetails?.find(
                      (d: any) =>
                        (d.assignmentCode?._id || d.assignmentCode) ===
                        (n.assignmentCode?._id || n.assignmentCode),
                    );
                    const isChecked = detail ? true : false;
                    const adjNorm = p.adjustmentNormCode?.norms?.find(
                      (an: any) =>
                        (an.assignmentCode?._id || an.assignmentCode) ===
                        (n.assignmentCode?._id || n.assignmentCode),
                    );
                    return {
                      assignmentCode: n.assignmentCode?._id || n.assignmentCode,
                      code: n.assignmentCode?.code || "",
                      name: n.assignmentCode?.name || "",
                      baseNorm: detail?.baseNorm ?? n.norm ?? 0,
                      adjustmentNorm:
                        detail?.adjustmentNorm ?? adjNorm?.norm ?? 1,
                      norm:
                        detail?.norm ?? (n.norm || 0) * (adjNorm?.norm || 1),
                      checked: isChecked,
                    };
                  })
                : [],
            })),
          },
        ],
      };
    }

    return {
      _id: "",
      department: selected?.department?._id
        ? String(selected.department._id)
        : "",
      month: dayjs().format("YYYY-MM"),
      groups: [
        {
          productionScope: "",
          phases: [],
        },
      ],
    };
  }, [selected, minimizedData, cuttingPhaseGroupKey]);

  return initialValues;
}
