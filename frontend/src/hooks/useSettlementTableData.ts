// hooks/useSettlementTableData.ts

import { useMemo } from "react";
import {
  MonthlyDataNoPhase,
  MonthlyDataWithPhase,
  DataItem,
  InfoItem,
} from "../types";

export interface BlockKey {
  month: string;
  phaseId?: string;
  phaseCode?: string;
  scopeCode?: string;
  phaseName?: string;
  info: InfoItem;
  isOther?: boolean;
  isSummary?: boolean;
}

export interface RowGroup {
  compoundKey: string; // assignmentCode.code_price
  assignmentCode: any;
  plan_Price: number;
  exec_Price: number;
  maxRows: number; // max materialUseds across all blocks
  blocks: Map<
    string,
    {
      groupData: DataItem | null; // null nếu block này không có group này
      materialUseds: (any | null)[]; // null = trống (align theo chỉ số)
    }
  >;
  alignedMaterialsMeta: any[]; // Lưu trữ meta data của vật tư cho các cột cố định
}

export function useSettlementTableData(
  apiResponse: MonthlyDataNoPhase[] | MonthlyDataWithPhase[] | undefined,
  localData: Map<string, DataItem[]>,
  hasPhase: boolean,
  showSummary: boolean,
) {
  return useMemo(() => {
    if (!apiResponse?.length || localData.size === 0)
      return { blockKeys: [], rowGroups: [] };

    // 1. Tạo danh sách blockKeys (thứ tự cột từ trái sang phải)
    const blockKeys: BlockKey[] = [];

    if (!hasPhase) {
      (apiResponse as MonthlyDataNoPhase[]).forEach((monthEntry) => {
        blockKeys.push({ month: monthEntry.month, info: monthEntry.info });
      });
    } else {
      (apiResponse as MonthlyDataWithPhase[]).forEach((monthEntry) => {
        monthEntry.phases.forEach((phaseEntry) => {
          blockKeys.push({
            month: monthEntry.month,
            phaseId: phaseEntry.phaseId,
            phaseCode: (phaseEntry as any).phaseCode,
            scopeCode: (phaseEntry as any).scopeCode,
            phaseName: (phaseEntry as any).phaseName,
            info: phaseEntry.info,
            isOther: (phaseEntry as any).isOther,
          });
        });
        // Append Monthly Summary Block
        if (showSummary) {
          blockKeys.push({
            month: monthEntry.month,
            phaseId: `SUMMARY_${monthEntry.month}`,
            phaseCode: "BẢNG TỔNG HỢP",
            scopeCode: "",
            phaseName: "BẢNG TỔNG HỢP",
            info: {
              totalCoal: monthEntry.phases.reduce(
                (sum, p) => sum + (p.info?.totalCoal || 0),
                0,
              ),
              totalExcavation: monthEntry.phases.reduce(
                (sum, p) => sum + (p.info?.totalExcavation || 0),
                0,
              ),
              totalCutting: monthEntry.phases.reduce(
                (sum, p) => sum + (p.info?.totalCutting || 0),
                0,
              ),
              rockRatio: null,
              phases: [],
              productionScopes: [],
            },
            isSummary: true,
          });
        }
      });
    }

    // 2. Map blockKey -> data array (Dùng luôn localData đã truyền vào)
    const blockDataMap = localData;
    const getBlockId = (month: string, phaseId?: string) =>
      phaseId ? `${month}_${phaseId}` : month;

    // 3. Gom tất cả compoundKey từ TẤT CẢ blocks (giữ thứ tự xuất hiện đầu tiên)
    const allCompoundKeys: string[] = [];
    const compoundKeyMeta = new Map<
      string,
      { assignmentCode: any; plan_Price: number; exec_Price: number }
    >();

    blockDataMap.forEach((dataItems) => {
      dataItems.forEach((item) => {
        const key = item.assignmentCode
          ? `${item.assignmentCode.code}`
          : `NO_ASSIGNMENTCODE`;
        if (!compoundKeyMeta.has(key)) {
          allCompoundKeys.push(key);
          compoundKeyMeta.set(key, {
            assignmentCode: item.assignmentCode,
            plan_Price: item.plan_Price,
            exec_Price: item.exec_Price,
          });
        }
      });
    });

    // 4. Build rowGroups
    const rowGroups: RowGroup[] = allCompoundKeys.map((compoundKey) => {
      const meta = compoundKeyMeta.get(compoundKey)!;
      const blocks = new Map<
        string,
        { groupData: DataItem | null; materialUseds: (any | null)[] }
      >();

      // Gom tất cả materialUseds từ TẤT CẢ blocks của compoundKey này
      const allMaterialKeys: string[] = [];
      const materialMeta = new Map<string, any>(); // key -> materialUsed object

      blockKeys.forEach((bk) => {
        const blockId = getBlockId(bk.month, bk.phaseId);
        const dataItems = blockDataMap.get(blockId) ?? [];
        const groupItem = dataItems.find((item) => {
          const k = item.assignmentCode
            ? `${item.assignmentCode.code}`
            : `NO_ASSIGNMENTCODE`;
          return k === compoundKey;
        });

        if (groupItem && groupItem.materialUseds) {
          const materialCounts = new Map<string, number>();
          groupItem.materialUseds.forEach((mu: any) => {
            const baseKey = `${mu.material?._id}_${mu.price}`;
            const count = (materialCounts.get(baseKey) ?? 0) + 1;
            materialCounts.set(baseKey, count);
            const matKey = `${baseKey}_${count}`;

            if (!allMaterialKeys.includes(matKey)) {
              allMaterialKeys.push(matKey);
              materialMeta.set(matKey, mu);
            }
          });
        }
      });

      const maxRows = Math.max(allMaterialKeys.length, 1);

      // Build từng block
      blockKeys.forEach((bk) => {
        const blockId = getBlockId(bk.month, bk.phaseId);
        const dataItems = blockDataMap.get(blockId) ?? [];
        const groupItem =
          dataItems.find((item) => {
            const k = item.assignmentCode
              ? `${item.assignmentCode.code}`
              : `NO_ASSIGNMENTCODE`;
            return k === compoundKey;
          }) ?? null;

        const materialUseds: (any | null)[] = [];

        if (groupItem && groupItem.materialUseds) {
          const materialCounts = new Map<string, number>();
          const matMap = new Map<string, any>();
          groupItem.materialUseds.forEach((mu: any) => {
            const baseKey = `${mu.material?._id}_${mu.price}`;
            const count = (materialCounts.get(baseKey) ?? 0) + 1;
            materialCounts.set(baseKey, count);
            const matKey = `${baseKey}_${count}`;
            matMap.set(matKey, mu);
          });

          allMaterialKeys.forEach((matKey) => {
            materialUseds.push(matMap.get(matKey) ?? null);
          });
        } else {
          allMaterialKeys.forEach(() => materialUseds.push(null));
        }

        blocks.set(blockId, { groupData: groupItem, materialUseds });
      });

      const alignedMaterialsMeta = allMaterialKeys.map(
        (k) => materialMeta.get(k)!,
      );

      return {
        compoundKey,
        assignmentCode: meta.assignmentCode,
        plan_Price: meta.plan_Price,
        exec_Price: meta.exec_Price,
        maxRows,
        alignedMaterialsMeta,
        blocks,
      };
    });

    // Sort row groups: No assignment code at the bottom, otherwise sort by code alphanumerically
    rowGroups.sort((a, b) => {
      if (!a.assignmentCode && b.assignmentCode) return 1;
      if (a.assignmentCode && !b.assignmentCode) return -1;

      if (a.assignmentCode && b.assignmentCode) {
        const codeA = a.assignmentCode.code || "";
        const codeB = b.assignmentCode.code || "";
        return codeA.localeCompare(codeB, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      return 0;
    });

    return { blockKeys, rowGroups };
  }, [apiResponse, localData, hasPhase, showSummary]);
}
