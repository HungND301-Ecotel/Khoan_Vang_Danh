const MaterialCostUsed = require("../model/MaterialCostUsed");
const MaterialBudget = require("../model/MaterialBudget");
const ProductionScope = require("../model/ProductionScope");
const OtherMaterialCost = require("../model/OtherMaterialCost");
const Department = require("../model/Department");
const { PhaseType } = require("../config/constant");
const ExcelJS = require("exceljs");

function generateMonthRange(fromMonth, toMonth) {
  // fromMonth = "2026-03", toMonth = "2026-06"
  const months = [];
  const [fromY, fromM] = fromMonth.split("-").map(Number);
  const [toY, toM] = toMonth.split("-").map(Number);

  let m = fromM,
    y = fromY;
  while (y < toY || (y === toY && m <= toM)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}
function processBudgetAndUsedData(
  materialBudgetDocs,
  materialCostUsedDocs,
  phase,
) {
  const mergedGroupsMap = new Map();

  // 1. Hợp nhất budgetCostDetails - lọc theo phase nếu có, đọc thẳng từ doc (không còn lồng trong phases[])
  const filteredBudgetDocs = phase
    ? materialBudgetDocs.filter(
        (d) => String(d.phase?._id || d.phase) === String(phase),
      )
    : materialBudgetDocs;

  filteredBudgetDocs.forEach((budgetDoc) => {
    (budgetDoc.budgetCostDetails || []).forEach((detail) => {
      const code = detail.assignmentCode?.code;
      const price = detail.price || 0;
      const compoundKey = `${code}_${price}`;

      if (mergedGroupsMap.has(compoundKey)) {
        const existing = mergedGroupsMap.get(compoundKey);
        existing.plan_Quantity += detail.quantity || 0;
        existing.plan_Cost += detail.cost || 0;
        existing.norm += detail.norm || 0;
      } else {
        mergedGroupsMap.set(compoundKey, {
          assignmentCode: detail.assignmentCode,
          baseNorm: detail.baseNorm,
          adjustmentNorm: detail.adjustmentNorm,
          norm: detail.norm,
          price: price,
          plan_Quantity: detail.quantity || 0,
          plan_Cost: detail.cost || 0,
          used_Quantity: 0,
          used_Cost: 0,
          materialUseds: [],
        });
      }
    });
  });

  // 2. Hợp nhất materials thực hiện - lọc theo phase nếu có
  // (materials vốn đã ở top-level của MaterialCostUsed, không đổi, chỉ đổi điều kiện lọc phase)
  const filteredUsedDocs = phase
    ? materialCostUsedDocs.filter(
        (d) => String(d.phase?._id || d.phase) === String(phase),
      )
    : materialCostUsedDocs;

  filteredUsedDocs.forEach((usedDoc) => {
    usedDoc.materials.forEach((mat) => {
      const assignmentCodeDoc =
        mat.assignmentCode || mat.material?.assignmentCode;
      const code = assignmentCodeDoc?.code || "";
      const matPrice = mat.price || 0;
      const quantity = mat.quantity || 0;
      const cost = mat.cost || 0;

      const compoundKey = assignmentCodeDoc
        ? `${code}_${matPrice}`
        : "NO_ASSIGNMENTCODE";

      let group = mergedGroupsMap.get(compoundKey);

      if (!group) {
        group = {
          assignmentCode: assignmentCodeDoc,
          baseNorm: "",
          adjustmentNorm: "",
          norm: "",
          price: assignmentCodeDoc ? matPrice : "",
          plan_Quantity: 0,
          plan_Cost: 0,
          used_Quantity: 0,
          used_Cost: 0,
          materialUseds: [],
        };
        mergedGroupsMap.set(compoundKey, group);
      }

      group.used_Quantity += quantity;
      group.used_Cost += cost;

      group.materialUseds.push({
        materialCostId: usedDoc._id,
        materialItemId: mat._id,
        material: mat.material,
        quantity: quantity,
        price: matPrice,
        cost: cost,
      });
    });
  });

  // 3. Tính Variance và sắp xếp — GIỮ NGUYÊN không đổi
  const finalGroups = Array.from(mergedGroupsMap.values()).map((group) => {
    if (!group.assignmentCode) {
      group.plan_Quantity = group.used_Quantity;
      group.plan_Cost = group.used_Cost;
    }
    const varianceQuantity = group.plan_Quantity - group.used_Quantity;
    const varianceCost = group.plan_Cost - group.used_Cost;
    return { ...group, varianceQuantity, varianceCost };
  });

  finalGroups.sort((a, b) => {
    const codeA = a.assignmentCode?.code || "NO_ASSIGNMENTCODE";
    const codeB = b.assignmentCode?.code || "NO_ASSIGNMENTCODE";
    if (codeA === "NO_ASSIGNMENTCODE" && codeB !== "NO_ASSIGNMENTCODE")
      return 1;
    if (codeA !== "NO_ASSIGNMENTCODE" && codeB === "NO_ASSIGNMENTCODE")
      return -1;
    if (codeA < codeB) return -1;
    if (codeA > codeB) return 1;
    return 0;
  });

  return finalGroups;
}

// Hàm helper tách budget/used theo tháng cụ thể
function filterDocsByMonth(docs, month) {
  return docs.filter((doc) => doc.month === month);
}

// Hàm helper build info từ budgetDocs + phaseId (null = gộp tất cả)
function buildInfo(materialBudgets, phaseId, productionScope) {
  const allScopes = new Map();
  const allPhases = new Map();

  let totalCoal = 0;
  let totalExcavation = 0;
  let totalCutting = 0;
  let rockRatio = null;

  const docsToCheck = phaseId
    ? materialBudgets.filter(
        (d) => String(d.phase?._id || d.phase) === String(phaseId),
      )
    : materialBudgets;

  docsToCheck.forEach((budgetDoc) => {
    if (budgetDoc.productionScope) {
      const scopeId = String(budgetDoc.productionScope._id);
      if (!allScopes.has(scopeId)) {
        allScopes.set(scopeId, {
          _id: scopeId,
          code: budgetDoc.productionScope.code,
          name: budgetDoc.productionScope.name,
        });
      }
    }

    const phaseDoc = budgetDoc.phase;
    if (!phaseDoc) return;

    const phaseIdStr = String(phaseDoc._id);
    const production = budgetDoc.production || 0;

    if (!allPhases.has(phaseIdStr)) {
      allPhases.set(phaseIdStr, {
        _id: phaseIdStr,
        code: phaseDoc.code,
        name: phaseDoc.name,
      });
    }

    switch (phaseDoc.phaseGroup?.name.toLowerCase()) {
      case PhaseType.COAL.toLowerCase():
        totalCoal += production;
        break;
      case PhaseType.EXCAVATION.toLowerCase():
        totalExcavation += production;
        break;
      case PhaseType.CUTTING.toLowerCase():
        totalCutting += production;
        break;
    }

    if (phaseId && productionScope) {
      const rockRatioDoc = budgetDoc.adjustmentNormCode?.rockRatio;
      rockRatio = rockRatioDoc?.name !== undefined ? rockRatioDoc.name : null;
    }
  });

  return {
    productionScopes: Array.from(allScopes.values()),
    phases: Array.from(allPhases.values()),
    totalCoal,
    totalCutting,
    totalExcavation,
    rockRatio,
  };
}

// Hàm chính mới — group theo tháng (và phase nếu có)
async function getMonthGrouped(
  productionScope,
  phase,
  matchQuery,
  fromMonth,
  toMonth,
) {
  const [materialCostUseds, materialBudgets] = await Promise.all([
    MaterialCostUsed.find(matchQuery)
      .populate({ path: "productionScope", select: "code name" })
      .populate({ path: "department", select: "code name" })
      .populate({
        path: "phase", // 👈 đổi từ "phases.phase"
        select: "code name phaseGroup",
        populate: [{ path: "phaseGroup", populate: "code name" }],
      })
      .populate({
        path: "materials.material",
        populate: [
          { path: "uom", select: "name" },
          {
            path: "assignmentCode",
            select: "code name uom deviceCode",
            populate: [{ path: "uom" }, { path: "deviceCode" }],
          },
        ],
      })
      .populate({
        path: "materials.assignmentCode",
        select: "code name uom deviceCode",
        populate: [{ path: "uom" }, { path: "deviceCode" }],
      })
      .lean(),

    MaterialBudget.find(matchQuery)
      .populate({ path: "productionScope", select: "code name" })
      .populate({ path: "department", select: "code name" })
      .populate({
        path: "phase", // 👈 đổi từ "phases.phase"
        select: "code name phaseGroup",
        populate: [{ path: "phaseGroup", populate: "code name" }],
      })
      .populate({
        path: "budgetCostDetails.assignmentCode", // 👈 đổi từ "phases.budgetCostDetails.assignmentCode"
        select: "code name uom deviceCode",
        populate: [{ path: "uom" }, { path: "deviceCode" }],
      })
      .populate({
        path: "assignmentNormCode", // 👈 đổi từ "phases.assignmentNormCode"
        select: "norms code",
        populate: [{ path: "norms.assignmentCode", populate: "uom" }],
      })
      .populate({
        path: "adjustmentNormCode", // 👈 đổi từ "phases.adjustmentNormCode"
        select: "norms code rockRatio",
        populate: [
          { path: "norms.assignmentCode", populate: "uom" },
          { path: "rockRatio", select: "name" },
        ],
      })
      .lean(),
  ]);

  if (materialCostUseds.length === 0) {
    throw { status: 404, message: "Không tìm thấy dữ liệu chi phí thực hiện." };
  }
  if (materialBudgets.length === 0) {
    throw { status: 404, message: "Không tìm thấy dữ liệu chi phí kế hoạch." };
  }

  const months = generateMonthRange(fromMonth, toMonth);
  const phaseList = phase
    ? Array.isArray(phase)
      ? phase
      : phase.split(",")
    : null;

  const result = months.map((month) => {
    const budgetsByMonth = filterDocsByMonth(materialBudgets, month);
    const usedsByMonth = filterDocsByMonth(materialCostUseds, month);

    if (!phaseList) {
      return {
        month,
        info: buildInfo(budgetsByMonth, null, productionScope),
        data: processBudgetAndUsedData(budgetsByMonth, usedsByMonth, null),
      };
    } else {
      const phases = phaseList
        .map((phaseId) => {
          const info = buildInfo(budgetsByMonth, phaseId, productionScope);
          const data = processBudgetAndUsedData(
            budgetsByMonth,
            usedsByMonth,
            phaseId,
          );

          let phaseName = info.phases[0]?.name || "";
          let phaseCode = info.phases[0]?.code || "";

          // Nếu budget không có phase này, tìm phase name/code từ usedsByMonth
          // (đổi từ tìm trong usedDoc.phases[] sang so sánh trực tiếp usedDoc.phase)
          if (!phaseCode && usedsByMonth && usedsByMonth.length > 0) {
            const matchedUsedDoc = usedsByMonth.find(
              (d) => String(d.phase?._id || d.phase) === String(phaseId),
            );
            if (matchedUsedDoc && matchedUsedDoc.phase) {
              phaseName = matchedUsedDoc.phase.name || "";
              phaseCode = matchedUsedDoc.phase.code || "";
            }
          }

          return { phaseId, phaseName, phaseCode, info, data };
        })
        .filter((p) => {
          const hasData = p.data && p.data.length > 0;
          const hasProductionInfo =
            p.info &&
            (p.info.totalCoal > 0 ||
              p.info.totalExcavation > 0 ||
              p.info.totalCutting > 0);
          return hasData || hasProductionInfo;
        });

      return { month, phases };
    }
  });

  return result.filter((entry) => {
    if (entry.data) return entry.data.length > 0;
    return entry.phases && entry.phases.length > 0;
  });
}

// ========================
// ALL SCOPES MODE (khi không chọn Diện sản xuất)
// ========================

async function getMonthGroupedAllScopes(department, fromMonth, toMonth) {
  const matchQuery = {
    department,
    month: { $gte: fromMonth, $lte: toMonth },
  };

  const populateMaterial = {
    path: "materials.material",
    populate: [
      { path: "uom", select: "name" },
      {
        path: "assignmentCode",
        select: "code name uom deviceCode",
        populate: [{ path: "uom" }, { path: "deviceCode" }],
      },
    ],
  };

  const [materialCostUseds, materialBudgets, otherMaterialCosts] =
    await Promise.all([
      MaterialCostUsed.find(matchQuery)
        .populate({ path: "productionScope", select: "code name" })
        .populate({ path: "department", select: "code name" })
        .populate({
          path: "phase", // 👈 đổi từ "phases.phase"
          select: "code name phaseGroup",
          populate: [{ path: "phaseGroup", populate: "code name" }],
        })
        .populate(populateMaterial)
        .populate({
          path: "materials.assignmentCode",
          select: "code name uom deviceCode",
          populate: [{ path: "uom" }, { path: "deviceCode" }],
        })
        .lean(),

      MaterialBudget.find(matchQuery)
        .populate({ path: "productionScope", select: "code name" })
        .populate({ path: "department", select: "code name" })
        .populate({
          path: "phase", // 👈 đổi từ "phases.phase"
          select: "code name phaseGroup",
          populate: [{ path: "phaseGroup", populate: "code name" }],
        })
        .populate({
          path: "budgetCostDetails.assignmentCode", // 👈 đổi
          select: "code name uom deviceCode",
          populate: [{ path: "uom" }, { path: "deviceCode" }],
        })
        .populate({
          path: "assignmentNormCode", // 👈 đổi
          select: "norms code",
          populate: [{ path: "norms.assignmentCode", populate: "uom" }],
        })
        .populate({
          path: "adjustmentNormCode", // 👈 đổi
          select: "norms code rockRatio",
          populate: [
            { path: "norms.assignmentCode", populate: "uom" },
            { path: "rockRatio", select: "name" },
          ],
        })
        .lean(),

      OtherMaterialCost.find(matchQuery)
        .populate({ path: "department", select: "code name" })
        .populate({
          path: "materials.material",
          populate: [
            { path: "uom", select: "name" },
            {
              path: "assignmentCode",
              select: "code name uom deviceCode",
              populate: [{ path: "uom" }, { path: "deviceCode" }],
            },
          ],
        })
        .lean(),
    ]);

  const months = generateMonthRange(fromMonth, toMonth);

  const result = months.map((month) => {
    const budgetsByMonth = materialBudgets.filter((d) => d.month === month);
    const usedsByMonth = materialCostUseds.filter((d) => d.month === month);
    const othersByMonth = otherMaterialCosts.filter((d) => d.month === month);

    const info = buildInfo(budgetsByMonth, null, null);

    const scopeMap = new Map();
    budgetsByMonth.forEach((budgetDoc) => {
      if (!budgetDoc.productionScope) return;
      const scopeId = String(budgetDoc.productionScope._id);
      if (!scopeMap.has(scopeId)) {
        scopeMap.set(scopeId, {
          scopeId,
          scopeCode: budgetDoc.productionScope.code,
          scopeName: budgetDoc.productionScope.name,
          budgetDocs: [],
          usedDocs: [],
        });
      }
      scopeMap.get(scopeId).budgetDocs.push(budgetDoc);
    });

    usedsByMonth.forEach((usedDoc) => {
      if (!usedDoc.productionScope) return;
      const scopeId = String(usedDoc.productionScope._id);
      if (scopeMap.has(scopeId)) {
        scopeMap.get(scopeId).usedDocs.push(usedDoc);
      }
    });

    const scopeGroups = Array.from(scopeMap.values()).map((scope) => {
      // Mỗi budgetDoc giờ = 1 phase, không cần loop bd.phases nữa
      const phaseMap = new Map();
      scope.budgetDocs.forEach((bd) => {
        if (!bd.phase) return;
        const phaseId = String(bd.phase._id);
        if (!phaseMap.has(phaseId)) {
          phaseMap.set(phaseId, {
            phaseId,
            phaseCode: bd.phase.code,
            phaseName: bd.phase.name,
          });
        }
      });

      const phases = Array.from(phaseMap.values()).map((phaseEntry) => {
        const phaseInfo = buildInfo(
          scope.budgetDocs,
          phaseEntry.phaseId,
          scope.scopeId,
        );
        const phaseData = processBudgetAndUsedData(
          scope.budgetDocs,
          scope.usedDocs,
          phaseEntry.phaseId,
        );
        return {
          phaseId: phaseEntry.phaseId,
          phaseCode: phaseEntry.phaseCode,
          phaseName: phaseEntry.phaseName,
          info: phaseInfo,
          data: phaseData,
        };
      });

      return {
        scopeId: scope.scopeId,
        scopeCode: scope.scopeCode,
        scopeName: scope.scopeName,
        phases,
      };
    });

    // --- otherTasks: GIỮ NGUYÊN không đổi (OtherMaterialCost không có phase) ---
    const otherMaterials = [];
    othersByMonth.forEach((otherDoc) => {
      otherDoc.materials.forEach((mat) => {
        const assignmentCodeDoc = mat.material?.assignmentCode || null;
        const price = mat.price || 0;
        const quantity = mat.quantity || 0;
        const cost = mat.cost || 0;
        otherMaterials.push({
          material: mat.material,
          assignmentCode: assignmentCodeDoc,
          price,
          quantity,
          cost,
          otherDocId: otherDoc._id,
        });
      });
    });

    const otherGroupMap = new Map();
    otherMaterials.forEach((mat) => {
      const code = mat.assignmentCode?.code || "";
      const compoundKey = mat.assignmentCode
        ? `${code}_${mat.price}`
        : `NO_ASSIGNMENTCODE_${mat.price || 0}`;
      if (!otherGroupMap.has(compoundKey)) {
        otherGroupMap.set(compoundKey, {
          assignmentCode: mat.assignmentCode,
          price: mat.assignmentCode ? mat.price : "",
          plan_Quantity: 0,
          plan_Cost: 0,
          used_Quantity: 0,
          used_Cost: 0,
          materialUseds: [],
        });
      }
      const group = otherGroupMap.get(compoundKey);
      group.used_Quantity += mat.quantity;
      group.used_Cost += mat.cost;
      group.plan_Quantity += mat.quantity;
      group.plan_Cost += mat.cost;
      group.materialUseds.push({
        materialCostId: mat.otherDocId,
        materialItemId: mat.material?._id,
        material: mat.material,
        quantity: mat.quantity,
        price: mat.price,
        cost: mat.cost,
      });
    });

    const otherTasksData = Array.from(otherGroupMap.values()).map((group) => ({
      ...group,
      varianceQuantity: 0,
      varianceCost: 0,
    }));

    return {
      month,
      info,
      scopeGroups,
      otherTasks: othersByMonth.length > 0 ? { data: otherTasksData } : null,
    };
  });

  return result.filter(
    (entry) => entry.scopeGroups.length > 0 || entry.otherTasks !== null,
  );
}

// Export handler — giữ nguyên validate, chỉ thay call hàm
exports.getMonth = async (req, res) => {
  try {
    const { productionScope, fromMonth, toMonth, phase, department } =
      req.query;

    if (!fromMonth || !toMonth) {
      return res.status(400).json({
        status: "error",
        message: "Tham số fromMonth và toMonth là bắt buộc.",
      });
    }

    if (!department) {
      return res.status(400).json({
        status: "error",
        message: "Tham số phân xưởng là bắt buộc.",
      });
    }

    if (!productionScope) {
      const data = await getMonthGroupedAllScopes(
        department,
        fromMonth,
        toMonth,
      );
      return res
        .status(200)
        .json({ status: "success", data, mode: "allScopes" });
    }

    const matchQuery = {
      department,
      productionScope,
      month: { $gte: fromMonth, $lte: toMonth },
    };

    if (phase) {
      const phaseList = Array.isArray(phase) ? phase : phase.split(",");
      matchQuery["phase"] = { $in: phaseList }; // 👈 đổi từ "phases.phase"
    }

    const data = await getMonthGrouped(
      productionScope,
      phase || null,
      matchQuery,
      fromMonth,
      toMonth,
    );

    res.status(200).json({ status: "success", data, mode: "byScope" });
  } catch (err) {
    if (err.status) {
      return res
        .status(err.status)
        .json({ status: "error", message: err.message });
    }
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

function transformToTableData(apiResponse) {
  if (!apiResponse || apiResponse.length === 0) {
    return { blockKeys: [], rowGroups: [] };
  }

  const transformedResponse = apiResponse.map((monthEntry) => {
    const phases = [];
    (monthEntry.scopeGroups || []).forEach((scopeGroup) => {
      (scopeGroup.phases || []).forEach((phaseEntry) => {
        phases.push({
          phaseId: `${scopeGroup.scopeId}_${phaseEntry.phaseId}`,
          phaseCode: phaseEntry.phaseCode,
          scopeCode: scopeGroup.scopeCode,
          phaseName: phaseEntry.phaseName,
          info: phaseEntry.info,
          data: phaseEntry.data,
          isOther: false,
        });
      });
    });

    if (monthEntry.otherTasks) {
      let totalCoal = 0;
      let totalExcavation = 0;
      let totalCutting = 0;

      // if (Array.isArray(monthEntry.otherTasks.phases)) {
      //   monthEntry.otherTasks.phases.forEach((p) => {
      //     const unit = (p.unit || "").toLowerCase().trim();
      //     const phaseName = (p.phase?.name || "").toLowerCase();
      //     const phaseGroupName = (
      //       p.phase?.phaseGroup?.name || ""
      //     ).toLowerCase();
      //     const prod = p.production || 0;

      //     if (unit === "tấn" || unit === "t" || unit === "tan") {
      //       totalCoal += prod;
      //     } else if (unit === "mét" || unit === "m" || unit === "met") {
      //       if (phaseName.includes("xén") || phaseGroupName.includes("xén")) {
      //         totalCutting += prod;
      //       } else {
      //         totalExcavation += prod;
      //       }
      //     }
      //   });
      // }

      phases.push({
        phaseId: `OTHER_${monthEntry.month}`,
        phaseCode: "Công việc khác",
        scopeCode: "",
        phaseName: "Công việc khác",
        info: {
          totalCoal,
          totalExcavation,
          totalCutting,
          rockRatio: null,
        },
        data: monthEntry.otherTasks.data,
        isOther: true,
      });
    }

    return {
      month: monthEntry.month,
      phases,
    };
  });

  const blockKeys = [];
  const localData = new Map();

  transformedResponse.forEach((monthEntry) => {
    monthEntry.phases.forEach((phaseEntry) => {
      blockKeys.push({
        month: monthEntry.month,
        phaseId: phaseEntry.phaseId,
        phaseCode: phaseEntry.phaseCode,
        scopeCode: phaseEntry.scopeCode,
        phaseName: phaseEntry.phaseName,
        info: phaseEntry.info,
        isOther: phaseEntry.isOther,
      });
      const key = `${monthEntry.month}_${phaseEntry.phaseId}`;
      localData.set(key, phaseEntry.data || []);
    });

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
  });

  const allCompoundKeys = [];
  const compoundKeyMeta = new Map();

  localData.forEach((dataItems) => {
    dataItems.forEach((item) => {
      const key = item.assignmentCode
        ? `${item.assignmentCode.code}_${item.price}`
        : `NO_ASSIGNMENTCODE_${item.price}`;
      if (!compoundKeyMeta.has(key)) {
        allCompoundKeys.push(key);
        compoundKeyMeta.set(key, {
          assignmentCode: item.assignmentCode,
          price: item.price,
        });
      }
    });
  });

  const getBlockId = (month, phaseId) =>
    phaseId ? `${month}_${phaseId}` : month;

  const rowGroups = allCompoundKeys.map((compoundKey) => {
    const meta = compoundKeyMeta.get(compoundKey);
    const blocks = new Map();

    const allMaterialKeys = [];
    const materialMeta = new Map();

    blockKeys.forEach((bk) => {
      const blockId = getBlockId(bk.month, bk.phaseId);
      const dataItems = localData.get(blockId) ?? [];
      const groupItem = dataItems.find((item) => {
        const k = item.assignmentCode
          ? `${item.assignmentCode.code}_${item.price}`
          : `NO_ASSIGNMENTCODE_${item.price}`;
        return k === compoundKey;
      });

      if (groupItem && groupItem.materialUseds) {
        const materialCounts = new Map();
        groupItem.materialUseds.forEach((mu) => {
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

    blockKeys.forEach((bk) => {
      const blockId = getBlockId(bk.month, bk.phaseId);
      const dataItems = localData.get(blockId) ?? [];
      const groupItem =
        dataItems.find((item) => {
          const k = item.assignmentCode
            ? `${item.assignmentCode.code}_${item.price}`
            : `NO_ASSIGNMENTCODE_${item.price}`;
          return k === compoundKey;
        }) ?? null;

      const materialUseds = [];

      if (groupItem && groupItem.materialUseds) {
        const materialCounts = new Map();
        const matMap = new Map();
        groupItem.materialUseds.forEach((mu) => {
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

    const alignedMaterialsMeta = allMaterialKeys.map((k) =>
      materialMeta.get(k),
    );

    return {
      compoundKey,
      assignmentCode: meta.assignmentCode,
      price: meta.price,
      maxRows,
      alignedMaterialsMeta,
      blocks,
    };
  });

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
}

exports.getExcel = async (req, res) => {
  try {
    const { fromMonth, toMonth, department } = req.body.data;

    if (!fromMonth || !toMonth || !department) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu tham số fromMonth, toMonth hoặc department.",
      });
    }

    const deptDoc = await Department.findById(department).lean();
    const departmentName = deptDoc ? deptDoc.name : "";

    const apiResponse = await getMonthGroupedAllScopes(
      department,
      fromMonth,
      toMonth,
    );
    const { blockKeys, rowGroups } = transformToTableData(apiResponse);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Quyết toán giao khoán");

    worksheet.views = [{ showGridLines: true }];

    // Set title and subtitle (Simple 2 lines at top-left)
    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "CÔNG TY CP THAN VÀNG DANH - VINACOMIN";
    titleCell.font = { name: "Arial", size: 10, bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };

    worksheet.mergeCells("A2:H2");
    const deptTitleCell = worksheet.getCell("A2");
    deptTitleCell.value = `Đơn vị: ${departmentName}`;
    deptTitleCell.font = { name: "Arial", size: 10, bold: true };
    deptTitleCell.alignment = { vertical: "middle", horizontal: "left" };

    let currentCol = 9;
    const blockCols = blockKeys.map((bk) => {
      const colCount = bk.isSummary ? 6 : bk.isOther ? 10 : 13;
      const start = currentCol;
      const end = currentCol + colCount - 1;
      currentCol = end + 1;
      return {
        ...bk,
        start,
        end,
        colCount,
      };
    });

    const totalCols = currentCol - 1;

    const setCell = (row, col, val, styles = {}) => {
      const cell = worksheet.getCell(row, col);
      cell.value = val;
      cell.font = { name: "Arial", size: 9, ...styles.font };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
        ...styles.alignment,
      };

      cell.border = {
        top: { style: "thin", color: { argb: "FFa8a8a4" } },
        left: { style: "thin", color: { argb: "FFa8a8a4" } },
        bottom: { style: "thin", color: { argb: "FFa8a8a4" } },
        right: { style: "thin", color: { argb: "FFa8a8a4" } },
      };
      return cell;
    };

    const mergeAndStyle = (
      startRow,
      startCol,
      endRow,
      endCol,
      val,
      styles = {},
    ) => {
      worksheet.mergeCells(startRow, startCol, endRow, endCol);
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          setCell(r, c, "", styles);
        }
      }
      return setCell(startRow, startCol, val, styles);
    };

    // Trả về giá trị nếu là số khác 0 (kể cả số âm), ngược lại trả về rỗng
    const numOrEmpty = (val) => {
      if (val === null || val === undefined || val === "") return "";
      const n = Number(val);
      if (Number.isNaN(n) || n === 0) return "";
      return n;
    };

    const startHeaderRow = 4;

    // Metadata Headers (A to H) - No color fills
    mergeAndStyle(startHeaderRow, 1, startHeaderRow + 5, 1, "STT", {
      font: { bold: true },
    });
    mergeAndStyle(
      startHeaderRow,
      2,
      startHeaderRow + 5,
      2,
      "Mã vật tư, tài sản",
      { font: { bold: true } },
    );
    mergeAndStyle(startHeaderRow, 3, startHeaderRow + 5, 3, "Trùng mã vật tư", {
      font: { bold: true },
    });
    mergeAndStyle(startHeaderRow, 4, startHeaderRow + 5, 4, "Mã thiết bị", {
      font: { bold: true },
    });
    mergeAndStyle(startHeaderRow, 5, startHeaderRow + 5, 5, "Mã giao khoán", {
      font: { bold: true },
    });
    mergeAndStyle(
      startHeaderRow,
      6,
      startHeaderRow + 5,
      6,
      "Tên vật tư, tài sản",
      { font: { bold: true }, alignment: { horizontal: "left" } },
    );
    mergeAndStyle(startHeaderRow, 7, startHeaderRow + 5, 7, "ĐVT", {
      font: { bold: true },
    });
    mergeAndStyle(startHeaderRow, 8, startHeaderRow + 5, 8, "Đơn giá khoán", {
      font: { bold: true },
    });

    // Dynamic Headers - No color fills
    blockCols.forEach((bkCol) => {
      const textStyles = { font: { bold: true } };

      // Row 4: Month
      const monthStr = `Quyết toán giao khoán tháng ${bkCol.month.split("-")[1]}/${bkCol.month.split("-")[0]}`;
      mergeAndStyle(
        startHeaderRow,
        bkCol.start,
        startHeaderRow,
        bkCol.end,
        monthStr,
        textStyles,
      );

      // Row 5: Phase
      const phaseCode =
        bkCol.phaseCode ||
        (bkCol.info?.phases || []).map((p) => p.code).join(", ");
      mergeAndStyle(
        startHeaderRow + 1,
        bkCol.start,
        startHeaderRow + 1,
        bkCol.end,
        phaseCode || "Công việc khác",
        textStyles,
      );

      // Row 6: Production Scope
      const scopeCode = bkCol.isSummary
        ? ""
        : bkCol.isOther
          ? "Công việc"
          : (bkCol.info?.productionScopes || []).map((s) => s.code).join(", ");
      mergeAndStyle(
        startHeaderRow + 2,
        bkCol.start,
        startHeaderRow + 2,
        bkCol.end,
        scopeCode,
        textStyles,
      );

      if (bkCol.isSummary) {
        // Row 7: Plan / Actual / Variance
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start,
          startHeaderRow + 3,
          bkCol.start + 1,
          "Kế hoạch",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start + 2,
          startHeaderRow + 3,
          bkCol.start + 3,
          "Thực hiện",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start + 4,
          startHeaderRow + 3,
          bkCol.start + 5,
          "So sánh lãi(+); lỗ(-)",
          textStyles,
        );

        // Row 8 & 9 Merged: Column names
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start,
          startHeaderRow + 5,
          bkCol.start,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 1,
          startHeaderRow + 5,
          bkCol.start + 1,
          "Giá trị",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 2,
          startHeaderRow + 5,
          bkCol.start + 2,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 3,
          startHeaderRow + 5,
          bkCol.start + 3,
          "Giá trị",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 4,
          startHeaderRow + 5,
          bkCol.start + 4,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 5,
          startHeaderRow + 5,
          bkCol.start + 5,
          "Giá trị",
          textStyles,
        );
      } else if (bkCol.isOther) {
        // Block "Công việc khác": không có 3 cột định mức, tổng 10 cột
        // Row 7: Plan / Actual / Variance (10 columns: 4 + 4 + 2)
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start,
          startHeaderRow + 3,
          bkCol.start + 3,
          "Kế hoạch",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start + 4,
          startHeaderRow + 3,
          bkCol.start + 7,
          "Thực hiện",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start + 8,
          startHeaderRow + 3,
          bkCol.start + 9,
          "So sánh lãi(+); lỗ(-)",
          textStyles,
        );

        // Row 8: Số lượng (Tổng/Trong khoán/Ngoài khoán) + Giá trị
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start,
          startHeaderRow + 4,
          bkCol.start + 2,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 3,
          startHeaderRow + 5,
          bkCol.start + 3,
          "Giá trị",
          textStyles,
        );

        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 4,
          startHeaderRow + 4,
          bkCol.start + 6,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 7,
          startHeaderRow + 5,
          bkCol.start + 7,
          "Giá trị",
          textStyles,
        );

        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 8,
          startHeaderRow + 5,
          bkCol.start + 8,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 9,
          startHeaderRow + 5,
          bkCol.start + 9,
          "Giá trị",
          textStyles,
        );

        // Row 9: Sub-column headers (Tổng, Trong khoán, Ngoài khoán)
        setCell(startHeaderRow + 5, bkCol.start, "Tổng", textStyles);
        setCell(startHeaderRow + 5, bkCol.start + 1, "Trong khoán", textStyles);
        setCell(startHeaderRow + 5, bkCol.start + 2, "Ngoài khoán", textStyles);

        setCell(startHeaderRow + 5, bkCol.start + 4, "Tổng", textStyles);
        setCell(startHeaderRow + 5, bkCol.start + 5, "Trong khoán", textStyles);
        setCell(startHeaderRow + 5, bkCol.start + 6, "Ngoài khoán", textStyles);
      } else {
        // Row 7: Plan / Actual / Variance (13 columns)
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start,
          startHeaderRow + 3,
          bkCol.start + 6,
          "Kế hoạch",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start + 7,
          startHeaderRow + 3,
          bkCol.start + 10,
          "Thực hiện",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 3,
          bkCol.start + 11,
          startHeaderRow + 3,
          bkCol.start + 12,
          "So sánh lãi(+); lỗ(-)",
          textStyles,
        );

        // Row 8: Column names (Số lượng / Giá trị)
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start,
          startHeaderRow + 5,
          bkCol.start,
          "Định mức gốc",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 1,
          startHeaderRow + 5,
          bkCol.start + 1,
          "Hệ số điều chỉnh định mức",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 2,
          startHeaderRow + 5,
          bkCol.start + 2,
          "Định mức",
          textStyles,
        );

        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 3,
          startHeaderRow + 4,
          bkCol.start + 5,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 6,
          startHeaderRow + 5,
          bkCol.start + 6,
          "Giá trị",
          textStyles,
        );

        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 7,
          startHeaderRow + 4,
          bkCol.start + 9,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 10,
          startHeaderRow + 5,
          bkCol.start + 10,
          "Giá trị",
          textStyles,
        );

        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 11,
          startHeaderRow + 5,
          bkCol.start + 11,
          "Số lượng",
          textStyles,
        );
        mergeAndStyle(
          startHeaderRow + 4,
          bkCol.start + 12,
          startHeaderRow + 5,
          bkCol.start + 12,
          "Giá trị",
          textStyles,
        );

        // Row 9: Sub-column headers (Tổng, Trong khoán, Ngoài khoán)
        setCell(startHeaderRow + 5, bkCol.start + 3, "Tổng", textStyles);
        setCell(startHeaderRow + 5, bkCol.start + 4, "Trong khoán", textStyles);
        setCell(startHeaderRow + 5, bkCol.start + 5, "Ngoài khoán", textStyles);

        setCell(startHeaderRow + 5, bkCol.start + 7, "Tổng", textStyles);
        setCell(startHeaderRow + 5, bkCol.start + 8, "Trong khoán", textStyles);
        setCell(startHeaderRow + 5, bkCol.start + 9, "Ngoài khoán", textStyles);
      }
    });

    let currentRow = 10;
    let sttCounter = 6;

    // --- 1. Top 5 Rows (Indicators) ---
    const topRowLabels = [
      "Than nguyên khai",
      "Mét lò đào",
      "Mét lò xén",
      "Tỉ lệ đá lẫn trong gương (Ckep)",
      "Vật tư có định mức",
    ];

    topRowLabels.forEach((label, rowIndex) => {
      const rowSTT = rowIndex + 1;
      setCell(currentRow, 1, rowSTT, { font: { bold: true } });
      mergeAndStyle(currentRow, 2, currentRow, 8, label, {
        font: { bold: true },
        alignment: { horizontal: "left" },
      });

      blockCols.forEach((bkCol) => {
        if (bkCol.isSummary) {
          let val = "";
          if (rowSTT === 1) {
            // Than nguyên khai
            val = blockCols
              .filter((b) => b.month === bkCol.month && !b.isSummary)
              .reduce((sum, b) => sum + (b.info?.totalCoal || 0), 0);
          } else if (rowSTT === 2) {
            // Mét lò đào
            val = blockCols
              .filter((b) => b.month === bkCol.month && !b.isSummary)
              .reduce((sum, b) => sum + (b.info?.totalExcavation || 0), 0);
          } else if (rowSTT === 3) {
            // Mét lò xén
            val = blockCols
              .filter((b) => b.month === bkCol.month && !b.isSummary)
              .reduce((sum, b) => sum + (b.info?.totalCutting || 0), 0);
          }

          for (let offset = 0; offset < 6; offset++) {
            setCell(currentRow, bkCol.start + offset, "");
          }
          setCell(
            currentRow,
            bkCol.start + 2,
            val !== "" && val !== 0 ? val : "",
          );
        } else {
          let val = "";
          if (rowSTT === 1) {
            val = bkCol.info?.totalCoal || 0;
          } else if (rowSTT === 2) {
            val = bkCol.info?.totalExcavation || 0;
          } else if (rowSTT === 3) {
            val = bkCol.info?.totalCutting || 0;
          } else if (rowSTT === 4) {
            val = bkCol.isOther ? "" : bkCol.info?.rockRatio || "";
          }

          for (let offset = 0; offset < bkCol.colCount; offset++) {
            setCell(currentRow, bkCol.start + offset, "");
          }

          if (bkCol.isOther) {
            // 10 cột: KH(Tổng,Trong,Ngoài,GiáTrị) | TH(Tổng,Trong,Ngoài,GiáTrị) | SS(SL,GiáTrị)
            // "Tổng" của KH ở offset 0, để đồng nhất với cách hiện số liệu tổng SL Kế hoạch
            setCell(
              currentRow,
              bkCol.start + 4,
              val !== "" && val !== 0 ? val : "",
            );
          } else {
            setCell(
              currentRow,
              bkCol.start + 3,
              val !== "" && val !== 0 ? val : "",
            );
          }
        }
      });
      currentRow++;
    });

    // --- 2. Row Groups (Assignments and Materials) ---
    rowGroups.forEach((assignment) => {
      // 1. Assignment Code Row
      setCell(currentRow, 1, sttCounter++, { font: { bold: true } });
      setCell(currentRow, 2, "", { font: { bold: true } });
      setCell(currentRow, 3, "", { font: { bold: true } });
      setCell(
        currentRow,
        4,
        assignment.assignmentCode?.deviceCode?.code || "",
        { font: { bold: true } },
      );
      setCell(currentRow, 5, assignment.assignmentCode?.code || "", {
        font: { bold: true },
      });
      setCell(
        currentRow,
        6,
        assignment.assignmentCode?.name || "Vật tư không có định mức",
        { font: { bold: true }, alignment: { horizontal: "left" } },
      );
      setCell(currentRow, 7, assignment.assignmentCode?.uom?.name || "", {
        font: { bold: true },
      });
      setCell(
        currentRow,
        8,
        assignment.assignmentCode ? "" : assignment.price,
        { font: { bold: true } },
      );

      blockCols.forEach((bkCol) => {
        if (bkCol.isSummary) {
          let planQtySum = 0,
            planCostSum = 0,
            usedQtySum = 0,
            usedCostSum = 0,
            varianceQtySum = 0,
            varianceCostSum = 0;
          blockCols
            .filter((b) => b.month === bkCol.month && !b.isSummary)
            .forEach((b) => {
              const blockId = `${b.month}_${b.phaseId}`;
              const blockData = assignment.blocks.get(blockId)?.groupData;
              if (blockData) {
                planQtySum += Number(blockData.plan_Quantity || 0);
                planCostSum += Number(blockData.plan_Cost || 0);
                usedQtySum += Number(blockData.used_Quantity || 0);
                usedCostSum += Number(blockData.used_Cost || 0);
                varianceQtySum += Number(blockData.varianceQuantity || 0);
                varianceCostSum += Number(blockData.varianceCost || 0);
              }
            });

          setCell(
            currentRow,
            bkCol.start,
            assignment.assignmentCode && planQtySum > 0
              ? numOrEmpty(planQtySum)
              : "",
            { font: { bold: true } },
          );
          setCell(
            currentRow,
            bkCol.start + 1,
            assignment.assignmentCode && planCostSum > 0
              ? numOrEmpty(planCostSum)
              : "",
            { font: { bold: true } },
          );
          setCell(
            currentRow,
            bkCol.start + 2,
            assignment.assignmentCode && usedQtySum > 0
              ? numOrEmpty(usedQtySum)
              : "",
            { font: { bold: true } },
          );
          setCell(
            currentRow,
            bkCol.start + 3,
            assignment.assignmentCode && usedCostSum > 0
              ? numOrEmpty(usedCostSum)
              : "",
            { font: { bold: true } },
          );
          setCell(
            currentRow,
            bkCol.start + 4,
            assignment.assignmentCode && varianceQtySum !== 0
              ? numOrEmpty(varianceQtySum)
              : "",
            { font: { bold: true } },
          );
          setCell(
            currentRow,
            bkCol.start + 5,
            assignment.assignmentCode && varianceCostSum !== 0
              ? numOrEmpty(varianceCostSum)
              : "",
            { font: { bold: true } },
          );
        } else if (bkCol.isOther) {
          const blockId = `${bkCol.month}_${bkCol.phaseId}`;
          const blockData = assignment.blocks.get(blockId)?.groupData;

          // 10 cột, không có 3 cột định mức
          setCell(
            currentRow,
            bkCol.start,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.plan_Quantity)
              : "",
          );
          setCell(currentRow, bkCol.start + 1, "");
          setCell(currentRow, bkCol.start + 2, "");
          setCell(
            currentRow,
            bkCol.start + 3,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.plan_Cost)
              : "",
          );

          setCell(
            currentRow,
            bkCol.start + 4,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.used_Quantity)
              : "",
          );
          setCell(currentRow, bkCol.start + 5, "");
          setCell(currentRow, bkCol.start + 6, "");
          setCell(
            currentRow,
            bkCol.start + 7,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.used_Cost)
              : "",
          );

          setCell(
            currentRow,
            bkCol.start + 8,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.varianceQuantity)
              : "",
          );
          setCell(
            currentRow,
            bkCol.start + 9,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.varianceCost)
              : "",
          );
        } else {
          const blockId = `${bkCol.month}_${bkCol.phaseId}`;
          const blockData = assignment.blocks.get(blockId)?.groupData;

          setCell(
            currentRow,
            bkCol.start,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.baseNorm)
              : "",
          );
          setCell(
            currentRow,
            bkCol.start + 1,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.adjustmentNorm)
              : "",
          );
          setCell(
            currentRow,
            bkCol.start + 2,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.norm)
              : "",
          );

          setCell(
            currentRow,
            bkCol.start + 3,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.plan_Quantity)
              : "",
          );
          setCell(currentRow, bkCol.start + 4, "");
          setCell(currentRow, bkCol.start + 5, "");
          setCell(
            currentRow,
            bkCol.start + 6,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.plan_Cost)
              : "",
          );

          setCell(
            currentRow,
            bkCol.start + 7,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.used_Quantity)
              : "",
          );
          setCell(currentRow, bkCol.start + 8, "");
          setCell(currentRow, bkCol.start + 9, "");
          setCell(
            currentRow,
            bkCol.start + 10,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.used_Cost)
              : "",
          );

          setCell(
            currentRow,
            bkCol.start + 11,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.varianceQuantity)
              : "",
          );
          setCell(
            currentRow,
            bkCol.start + 12,
            assignment.assignmentCode && blockData
              ? numOrEmpty(blockData.varianceCost)
              : "",
          );
        }
      });

      currentRow++;

      // 2. Material Rows
      for (let i = 0; i < assignment.maxRows; i++) {
        const materialMeta = assignment.alignedMaterialsMeta[i];
        if (!materialMeta) continue;

        const isDuplicate =
          assignment.alignedMaterialsMeta.filter(
            (m) => m?.material?._id === materialMeta.material?._id,
          ).length > 1;

        setCell(currentRow, 1, "");
        setCell(currentRow, 2, materialMeta.material?.code || "");
        setCell(
          currentRow,
          3,
          isDuplicate
            ? assignment.alignedMaterialsMeta.filter(
                (m) => m?.material?._id === materialMeta.material?._id,
              ).length
            : 1,
        );
        setCell(currentRow, 4, "");
        setCell(currentRow, 5, "");
        setCell(currentRow, 6, materialMeta.material?.name || "", {
          alignment: { horizontal: "left" },
        });
        setCell(currentRow, 7, materialMeta.material?.uom?.name || "");
        setCell(
          currentRow,
          8,
          assignment.assignmentCode ? "" : materialMeta.price,
        );

        blockCols.forEach((bkCol) => {
          if (bkCol.isSummary) {
            let planQtySum = 0,
              planCostSum = 0,
              usedQtySum = 0,
              usedCostSum = 0,
              varianceQtySum = 0,
              varianceCostSum = 0;
            let hasData = false;

            blockCols
              .filter((b) => b.month === bkCol.month && !b.isSummary)
              .forEach((b) => {
                const blockId = `${b.month}_${b.phaseId}`;
                const mu = assignment.blocks.get(blockId)?.materialUseds?.[i];
                if (mu) {
                  hasData = true;
                  if (b.isOther || !assignment.assignmentCode) {
                    planQtySum += Number(mu.quantity || 0);
                    planCostSum += Number(mu.cost || 0);
                  }
                  usedQtySum += Number(mu.quantity || 0);
                  if (b.isOther || !assignment.assignmentCode) {
                    usedCostSum += Number(mu.cost || 0);
                  }
                }
              });

            varianceQtySum = planQtySum - usedQtySum;
            varianceCostSum = planCostSum - usedCostSum;

            setCell(
              currentRow,
              bkCol.start,
              hasData ? numOrEmpty(planQtySum) : "",
            );
            setCell(
              currentRow,
              bkCol.start + 1,
              hasData ? numOrEmpty(planCostSum) : "",
            );
            setCell(
              currentRow,
              bkCol.start + 2,
              hasData ? numOrEmpty(usedQtySum) : "",
            );
            setCell(
              currentRow,
              bkCol.start + 3,
              hasData ? numOrEmpty(usedCostSum) : "",
            );
            setCell(
              currentRow,
              bkCol.start + 4,
              hasData ? numOrEmpty(varianceQtySum) : "",
            );
            setCell(
              currentRow,
              bkCol.start + 5,
              hasData ? numOrEmpty(varianceCostSum) : "",
            );
          } else if (bkCol.isOther) {
            const blockId = `${bkCol.month}_${bkCol.phaseId}`;
            const mu = assignment.blocks.get(blockId)?.materialUseds?.[i];

            // isOther: số lượng/giá trị nằm ở cột "Tổng" (offset 0 và 4), không phải "Ngoài khoán"
            setCell(currentRow, bkCol.start, mu ? numOrEmpty(mu.quantity) : "");
            setCell(currentRow, bkCol.start + 1, "");
            setCell(currentRow, bkCol.start + 2, "");
            setCell(currentRow, bkCol.start + 3, mu ? numOrEmpty(mu.cost) : "");

            setCell(
              currentRow,
              bkCol.start + 4,
              mu ? numOrEmpty(mu.quantity) : "",
            );
            setCell(currentRow, bkCol.start + 5, "");
            setCell(currentRow, bkCol.start + 6, "");
            setCell(currentRow, bkCol.start + 7, mu ? numOrEmpty(mu.cost) : "");

            setCell(currentRow, bkCol.start + 8, "");
            setCell(currentRow, bkCol.start + 9, "");
          } else {
            const blockId = `${bkCol.month}_${bkCol.phaseId}`;
            const mu = assignment.blocks.get(blockId)?.materialUseds?.[i];

            const showPlan = !assignment.assignmentCode;

            setCell(currentRow, bkCol.start, "");
            setCell(currentRow, bkCol.start + 1, "");
            setCell(currentRow, bkCol.start + 2, "");

            setCell(
              currentRow,
              bkCol.start + 3,
              showPlan && mu ? numOrEmpty(mu.quantity) : "",
            );
            setCell(currentRow, bkCol.start + 4, "");
            setCell(currentRow, bkCol.start + 5, "");
            setCell(
              currentRow,
              bkCol.start + 6,
              showPlan && mu ? numOrEmpty(mu.cost) : "",
            );

            setCell(
              currentRow,
              bkCol.start + 7,
              mu ? numOrEmpty(mu.quantity) : "",
            );
            setCell(currentRow, bkCol.start + 8, "");
            setCell(currentRow, bkCol.start + 9, "");
            setCell(
              currentRow,
              bkCol.start + 10,
              assignment.assignmentCode ? "" : mu ? numOrEmpty(mu.cost) : "",
            );

            setCell(currentRow, bkCol.start + 11, "");
            setCell(currentRow, bkCol.start + 12, "");
          }
        });

        currentRow++;
      }
    });

    // Bottom Summary Row
    mergeAndStyle(currentRow, 1, currentRow, 8, "Tổng chi phí", {
      font: { bold: true },
      alignment: { horizontal: "center" },
    });

    blockCols.forEach((bkCol) => {
      if (bkCol.isSummary) {
        let totalPlanSum = 0;
        let totalUsedSum = 0;

        blockCols
          .filter((b) => b.month === bkCol.month && !b.isSummary)
          .forEach((b) => {
            const blockId = `${b.month}_${b.phaseId}`;
            rowGroups.forEach((rg) => {
              const bd = rg.blocks.get(blockId)?.groupData;
              if (rg.assignmentCode && bd) {
                totalPlanSum += Number(bd.plan_Cost || 0);
                totalUsedSum += Number(bd.used_Cost || 0);
              } else if (!rg.assignmentCode) {
                const mus = rg.blocks.get(blockId)?.materialUseds;
                if (mus) {
                  mus.forEach((mu) => {
                    if (mu) {
                      totalPlanSum += Number(mu.cost || 0);
                      totalUsedSum += Number(mu.cost || 0);
                    }
                  });
                }
              }
            });
          });

        const totalVarianceSum = totalPlanSum - totalUsedSum;

        setCell(currentRow, bkCol.start, "", { font: { bold: true } });
        setCell(currentRow, bkCol.start + 1, numOrEmpty(totalPlanSum), {
          font: { bold: true },
        });
        setCell(currentRow, bkCol.start + 2, "", { font: { bold: true } });
        setCell(currentRow, bkCol.start + 3, numOrEmpty(totalUsedSum), {
          font: { bold: true },
        });
        setCell(currentRow, bkCol.start + 4, "", { font: { bold: true } });
        setCell(currentRow, bkCol.start + 5, numOrEmpty(totalVarianceSum), {
          font: { bold: true },
        });
      } else if (bkCol.isOther) {
        const blockId = `${bkCol.month}_${bkCol.phaseId}`;
        let totalPlan = 0;
        let totalUsed = 0;

        rowGroups.forEach((rg) => {
          const bd = rg.blocks.get(blockId)?.groupData;
          if (rg.assignmentCode && bd) {
            totalPlan += Number(bd.plan_Cost || 0);
            totalUsed += Number(bd.used_Cost || 0);
          } else if (!rg.assignmentCode) {
            const mus = rg.blocks.get(blockId)?.materialUseds;
            if (mus) {
              mus.forEach((mu) => {
                if (mu) {
                  totalPlan += Number(mu.cost || 0);
                  totalUsed += Number(mu.cost || 0);
                }
              });
            }
          }
        });

        const totalVariance = totalPlan - totalUsed;

        setCell(currentRow, bkCol.start, "");
        setCell(currentRow, bkCol.start + 1, "");
        setCell(currentRow, bkCol.start + 2, "");
        setCell(currentRow, bkCol.start + 3, numOrEmpty(totalPlan), {
          font: { bold: true },
        });

        setCell(currentRow, bkCol.start + 4, "");
        setCell(currentRow, bkCol.start + 5, "");
        setCell(currentRow, bkCol.start + 6, "");
        setCell(currentRow, bkCol.start + 7, numOrEmpty(totalUsed), {
          font: { bold: true },
        });

        setCell(currentRow, bkCol.start + 8, "");
        setCell(currentRow, bkCol.start + 9, numOrEmpty(totalVariance), {
          font: { bold: true },
        });
      } else {
        const blockId = `${bkCol.month}_${bkCol.phaseId}`;
        let totalPlan = 0;
        let totalUsed = 0;

        rowGroups.forEach((rg) => {
          const bd = rg.blocks.get(blockId)?.groupData;
          if (rg.assignmentCode && bd) {
            totalPlan += Number(bd.plan_Cost || 0);
            totalUsed += Number(bd.used_Cost || 0);
          } else if (!rg.assignmentCode) {
            const mus = rg.blocks.get(blockId)?.materialUseds;
            if (mus) {
              mus.forEach((mu) => {
                if (mu) {
                  totalPlan += Number(mu.cost || 0);
                  totalUsed += Number(mu.cost || 0);
                }
              });
            }
          }
        });

        const totalVariance = totalPlan - totalUsed;

        setCell(currentRow, bkCol.start, "");
        setCell(currentRow, bkCol.start + 1, "");
        setCell(currentRow, bkCol.start + 2, "");

        setCell(currentRow, bkCol.start + 3, "");
        setCell(currentRow, bkCol.start + 4, "");
        setCell(currentRow, bkCol.start + 5, "");
        setCell(currentRow, bkCol.start + 6, numOrEmpty(totalPlan), {
          font: { bold: true },
        });

        setCell(currentRow, bkCol.start + 7, "");
        setCell(currentRow, bkCol.start + 8, "");
        setCell(currentRow, bkCol.start + 9, "");
        setCell(currentRow, bkCol.start + 10, numOrEmpty(totalUsed), {
          font: { bold: true },
        });

        setCell(currentRow, bkCol.start + 11, "");
        setCell(currentRow, bkCol.start + 12, numOrEmpty(totalVariance), {
          font: { bold: true },
        });
      }
    });

    worksheet.getColumn(1).width = 6;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 35;
    worksheet.getColumn(7).width = 8;
    worksheet.getColumn(8).width = 15;

    for (let c = 9; c <= totalCols; c++) {
      worksheet.getColumn(c).width = 13;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=QuyetToanGiaoKhoan.xlsx`,
    );
    res.send(buffer);
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

function getMonthsInQuarter(year, quarter) {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const months = [];

  for (let m = startMonth; m <= endMonth; m++) {
    months.push(`${year}-${String(m).padStart(2, "0")}`);
  }
  return months;
}

async function getQuarterData(res, quarter, year, department) {
  const months = getMonthsInQuarter(Number(year), Number(quarter));

  const matchQuery = {};
  matchQuery.month = { $in: months };
  if (department) matchQuery.department = department;

  let totalCoal = 0;
  let totalCutting = 0;
  let totalExcavation = 0;

  const [materialCostUseds, materialBudgets] = await Promise.all([
    MaterialCostUsed.find(matchQuery)
      .populate({ path: "productionScope", select: "code name" })
      .populate({ path: "department", select: "code name" })
      .populate({
        path: "phase", // 👈 đổi
        select: "code name phaseGroup",
        populate: [{ path: "phaseGroup", populate: "code name" }],
      })
      .populate({
        path: "materials.material",
        populate: [
          { path: "uom", select: "name" },
          {
            path: "assignmentCode",
            select: "code name uom deviceCode",
            populate: [{ path: "uom" }, { path: "deviceCode" }],
          },
        ],
      })
      .populate({
        path: "materials.assignmentCode",
        select: "code name uom deviceCode",
        populate: [{ path: "uom" }, { path: "deviceCode" }],
      })
      .lean(),

    MaterialBudget.find(matchQuery)
      .populate({ path: "productionScope", select: "code name" })
      .populate({ path: "department", select: "code name" })
      .populate({
        path: "phase", // 👈 đổi
        select: "code name phaseGroup",
        populate: [{ path: "phaseGroup", populate: "code name" }],
      })
      .populate({
        path: "budgetCostDetails.assignmentCode", // 👈 đổi
        select: "code name uom deviceCode",
        populate: [{ path: "uom" }, { path: "deviceCode" }],
      })
      .populate({
        path: "assignmentNormCode", // 👈 đổi
        select: "norms code",
        populate: [{ path: "norms.assignmentCode", populate: "uom" }],
      })
      .populate({
        path: "adjustmentNormCode", // 👈 đổi
        select: "norms code rockRatio",
        populate: [
          { path: "norms.assignmentCode", populate: "uom" },
          { path: "rockRatio", select: "name" },
        ],
      })
      .lean(),
  ]);

  // Tổng hợp sản lượng - bỏ vòng lặp budgetDoc.phases, đọc thẳng từ doc
  materialBudgets.forEach((budgetDoc) => {
    const phaseDoc = budgetDoc.phase;
    if (!phaseDoc) return;
    const production = budgetDoc.production || 0;

    switch (phaseDoc.phaseGroup?.name.toLowerCase()) {
      case PhaseType.COAL.toLowerCase():
        totalCoal += production;
        break;
      case PhaseType.EXCAVATION.toLowerCase():
        totalExcavation += production;
        break;
      case PhaseType.CUTTING.toLowerCase():
        totalCutting += production;
        break;
    }
  });

  const finalGroups = processBudgetAndUsedData(
    materialBudgets,
    materialCostUseds,
    null,
  );

  const info = { totalCoal, totalCutting, totalExcavation };

  return { data: finalGroups, info };
}

// ----------------------------------------------------------------------
// CONTROLLER MỚI: exports.getQuarter
// ----------------------------------------------------------------------
exports.getQuarter = async (req, res) => {
  try {
    const { quarter, year, department } = req.query;

    if (!quarter || !year) {
      return res
        .status(400)
        .json({ status: "error", message: "Tham số quý và năm là bắt buộc." });
    }

    const { data, info } = await getQuarterData(
      res,
      quarter,
      year,
      department || null,
    );

    res.status(200).json({
      status: "success",
      data: { data, info },
    });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getQuarterExcel = async (req, res) => {
  try {
    const { quarter, year, department } = req.body.data || req.query;

    if (!quarter || !year || !department) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu tham số quarter, year hoặc department.",
      });
    }

    const deptDoc = await Department.findById(department).lean();
    const departmentName = deptDoc ? deptDoc.name : "";

    const { data: rows, info } = await getQuarterData(
      res,
      quarter,
      year,
      department,
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Quyết toán giao khoán quý");

    worksheet.views = [{ showGridLines: true }];

    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "CÔNG TY CP THAN VÀNG DANH - VINACOMIN";
    titleCell.font = { name: "Arial", size: 10, bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };

    worksheet.mergeCells("A2:H2");
    const deptTitleCell = worksheet.getCell("A2");
    deptTitleCell.value = `Đơn vị: ${departmentName}`;
    deptTitleCell.font = { name: "Arial", size: 10, bold: true };
    deptTitleCell.alignment = { vertical: "middle", horizontal: "left" };

    const setCell = (row, col, val, styles = {}) => {
      const cell = worksheet.getCell(row, col);
      cell.value = val;
      cell.font = { name: "Arial", size: 9, ...styles.font };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
        ...styles.alignment,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFa8a8a4" } },
        left: { style: "thin", color: { argb: "FFa8a8a4" } },
        bottom: { style: "thin", color: { argb: "FFa8a8a4" } },
        right: { style: "thin", color: { argb: "FFa8a8a4" } },
      };
      return cell;
    };

    const mergeAndStyle = (
      startRow,
      startCol,
      endRow,
      endCol,
      val,
      styles = {},
    ) => {
      worksheet.mergeCells(startRow, startCol, endRow, endCol);
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          setCell(r, c, "", styles);
        }
      }
      return setCell(startRow, startCol, val, styles);
    };

    const numOrEmpty = (val) => {
      if (val === null || val === undefined || val === "") return "";
      const n = Number(val);
      if (Number.isNaN(n) || n === 0) return "";
      return n;
    };

    // ===== Header (7 cột metadata + 10 cột dữ liệu = cột 8..17) =====
    const startHeaderRow = 4;

    mergeAndStyle(startHeaderRow, 1, startHeaderRow + 3, 1, "STT", {
      font: { bold: true },
    });
    mergeAndStyle(
      startHeaderRow,
      2,
      startHeaderRow + 3,
      2,
      "Mã vật tư, tài sản",
      { font: { bold: true } },
    );
    mergeAndStyle(startHeaderRow, 3, startHeaderRow + 3, 3, "Mã thiết bị", {
      font: { bold: true },
    });
    mergeAndStyle(startHeaderRow, 4, startHeaderRow + 3, 4, "Mã giao khoán", {
      font: { bold: true },
    });
    mergeAndStyle(
      startHeaderRow,
      5,
      startHeaderRow + 3,
      5,
      "Tên vật tư, tài sản",
      {
        font: { bold: true },
        alignment: { horizontal: "left" },
      },
    );
    mergeAndStyle(startHeaderRow, 6, startHeaderRow + 3, 6, "ĐVT", {
      font: { bold: true },
    });
    mergeAndStyle(startHeaderRow, 7, startHeaderRow + 3, 7, "Đơn giá khoán", {
      font: { bold: true },
    });

    const dataStart = 8; // cột 8..17 (10 cột)

    mergeAndStyle(
      startHeaderRow,
      dataStart,
      startHeaderRow,
      dataStart + 9,
      `Quyết toán giao khoán quý ${quarter} năm ${year}`,
      { font: { bold: true } },
    );
    mergeAndStyle(
      startHeaderRow + 1,
      dataStart,
      startHeaderRow + 1,
      dataStart + 3,
      "Kế hoạch",
      { font: { bold: true } },
    );
    mergeAndStyle(
      startHeaderRow + 1,
      dataStart + 4,
      startHeaderRow + 1,
      dataStart + 7,
      "Thực hiện",
      { font: { bold: true } },
    );
    mergeAndStyle(
      startHeaderRow + 1,
      dataStart + 8,
      startHeaderRow + 1,
      dataStart + 9,
      "So sánh lãi(+); lỗ(-)",
      { font: { bold: true } },
    );

    mergeAndStyle(
      startHeaderRow + 2,
      dataStart,
      startHeaderRow + 2,
      dataStart + 2,
      "Số lượng",
      { font: { bold: true } },
    );
    mergeAndStyle(
      startHeaderRow + 2,
      dataStart + 3,
      startHeaderRow + 3,
      dataStart + 3,
      "Giá trị",
      { font: { bold: true } },
    );
    mergeAndStyle(
      startHeaderRow + 2,
      dataStart + 4,
      startHeaderRow + 2,
      dataStart + 6,
      "Số lượng",
      { font: { bold: true } },
    );
    mergeAndStyle(
      startHeaderRow + 2,
      dataStart + 7,
      startHeaderRow + 3,
      dataStart + 7,
      "Giá trị",
      { font: { bold: true } },
    );
    mergeAndStyle(
      startHeaderRow + 2,
      dataStart + 8,
      startHeaderRow + 3,
      dataStart + 8,
      "Số lượng",
      { font: { bold: true } },
    );
    mergeAndStyle(
      startHeaderRow + 2,
      dataStart + 9,
      startHeaderRow + 3,
      dataStart + 9,
      "Giá trị",
      { font: { bold: true } },
    );

    setCell(startHeaderRow + 3, dataStart, "Tổng", { font: { bold: true } });
    setCell(startHeaderRow + 3, dataStart + 1, "Trong khoán", {
      font: { bold: true },
    });
    setCell(startHeaderRow + 3, dataStart + 2, "Ngoài khoán", {
      font: { bold: true },
    });
    setCell(startHeaderRow + 3, dataStart + 4, "Tổng", {
      font: { bold: true },
    });
    setCell(startHeaderRow + 3, dataStart + 5, "Trong khoán", {
      font: { bold: true },
    });
    setCell(startHeaderRow + 3, dataStart + 6, "Ngoài khoán", {
      font: { bold: true },
    });

    let currentRow = startHeaderRow + 4;

    // ===== 5 dòng chỉ số đầu (Than nguyên khai, Mét lò đào,...) =====
    const topRowLabels = [
      { label: "Than nguyên khai", val: info.totalCoal },
      { label: "Mét lò đào", val: info.totalExcavation },
      { label: "Mét lò xén", val: info.totalCutting },
      { label: "Tỉ lệ đá lẫn trong gương (Ckep)", val: "" },
      { label: "Vật tư có định mức", val: "" },
    ];

    topRowLabels.forEach((row, idx) => {
      setCell(currentRow, 1, idx + 1, { font: { bold: true } });
      mergeAndStyle(currentRow, 2, currentRow, 7, row.label, {
        font: { bold: true },
        alignment: { horizontal: "left" },
      });
      for (let c = dataStart; c < dataStart + 10; c++)
        setCell(currentRow, c, "");
      if (idx < 3) {
        setCell(currentRow, dataStart + 4, numOrEmpty(row.val));
      }
      currentRow++;
    });

    // ===== Row Groups (Assignment + Materials) =====
    let sttCounter = 6;
    rows.forEach((assignment) => {
      setCell(currentRow, 1, sttCounter++, { font: { bold: true } });
      setCell(currentRow, 2, "", { font: { bold: true } });
      setCell(
        currentRow,
        3,
        assignment.assignmentCode?.deviceCode?.code || "",
        { font: { bold: true } },
      );
      setCell(currentRow, 4, assignment.assignmentCode?.code || "", {
        font: { bold: true },
      });
      setCell(
        currentRow,
        5,
        assignment.assignmentCode?.name || "Vật tư không có định mức",
        { font: { bold: true }, alignment: { horizontal: "left" } },
      );
      setCell(currentRow, 6, assignment.assignmentCode?.uom?.name || "", {
        font: { bold: true },
      });
      setCell(
        currentRow,
        7,
        assignment.assignmentCode ? "" : assignment.price,
        { font: { bold: true } },
      );

      setCell(
        currentRow,
        dataStart,
        assignment.assignmentCode ? numOrEmpty(assignment.plan_Quantity) : "",
      );
      setCell(currentRow, dataStart + 1, "");
      setCell(currentRow, dataStart + 2, "");
      setCell(
        currentRow,
        dataStart + 3,
        assignment.assignmentCode ? numOrEmpty(assignment.plan_Cost) : "",
      );
      setCell(
        currentRow,
        dataStart + 4,
        assignment.assignmentCode ? numOrEmpty(assignment.used_Quantity) : "",
      );
      setCell(currentRow, dataStart + 5, "");
      setCell(currentRow, dataStart + 6, "");
      setCell(
        currentRow,
        dataStart + 7,
        assignment.assignmentCode ? numOrEmpty(assignment.used_Cost) : "",
      );
      setCell(
        currentRow,
        dataStart + 8,
        assignment.assignmentCode
          ? numOrEmpty(assignment.varianceQuantity)
          : "",
      );
      setCell(
        currentRow,
        dataStart + 9,
        assignment.assignmentCode ? numOrEmpty(assignment.varianceCost) : "",
      );

      currentRow++;

      (assignment.materialUseds || []).forEach((mu) => {
        setCell(currentRow, 1, "");
        setCell(currentRow, 2, mu?.material?.code || "");
        setCell(currentRow, 3, "");
        setCell(currentRow, 4, "");
        setCell(currentRow, 5, mu?.material?.name || "", {
          alignment: { horizontal: "left" },
        });
        setCell(currentRow, 6, mu?.material?.uom?.name || "");
        setCell(
          currentRow,
          7,
          assignment.assignmentCode ? "" : numOrEmpty(mu?.price),
        );

        setCell(
          currentRow,
          dataStart,
          assignment.assignmentCode ? "" : numOrEmpty(mu?.quantity),
        );
        setCell(currentRow, dataStart + 1, "");
        setCell(currentRow, dataStart + 2, "");
        setCell(
          currentRow,
          dataStart + 3,
          assignment.assignmentCode ? "" : numOrEmpty(mu?.cost),
        );
        setCell(currentRow, dataStart + 4, numOrEmpty(mu?.quantity));
        setCell(currentRow, dataStart + 5, "");
        setCell(currentRow, dataStart + 6, "");
        setCell(
          currentRow,
          dataStart + 7,
          assignment.assignmentCode ? "" : numOrEmpty(mu?.cost),
        );
        setCell(currentRow, dataStart + 8, "");
        setCell(currentRow, dataStart + 9, "");

        currentRow++;
      });
    });

    // ===== Tổng chi phí =====
    mergeAndStyle(currentRow, 1, currentRow, 7, "Tổng chi phí", {
      font: { bold: true },
      alignment: { horizontal: "center" },
    });

    let totalPlan = 0;
    let totalUsed = 0;
    rows.forEach((assignment) => {
      if (assignment.assignmentCode) {
        totalPlan += Number(assignment.plan_Cost || 0);
        totalUsed += Number(assignment.used_Cost || 0);
      } else {
        (assignment.materialUseds || []).forEach((mu) => {
          totalPlan += Number(mu?.cost || 0);
          totalUsed += Number(mu?.cost || 0);
        });
      }
    });
    const totalVariance = totalPlan - totalUsed;

    setCell(currentRow, dataStart, "");
    setCell(currentRow, dataStart + 1, "");
    setCell(currentRow, dataStart + 2, "");
    setCell(currentRow, dataStart + 3, numOrEmpty(totalPlan), {
      font: { bold: true },
    });
    setCell(currentRow, dataStart + 4, "");
    setCell(currentRow, dataStart + 5, "");
    setCell(currentRow, dataStart + 6, "");
    setCell(currentRow, dataStart + 7, numOrEmpty(totalUsed), {
      font: { bold: true },
    });
    setCell(currentRow, dataStart + 8, "");
    setCell(currentRow, dataStart + 9, numOrEmpty(totalVariance), {
      font: { bold: true },
    });

    worksheet.getColumn(1).width = 6;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 35;
    worksheet.getColumn(6).width = 8;
    worksheet.getColumn(7).width = 15;
    for (let c = dataStart; c < dataStart + 10; c++) {
      worksheet.getColumn(c).width = 13;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=QuyetToanGiaoKhoanQuy${quarter}_${year}.xlsx`,
    );
    res.send(buffer);
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// function setMergeCellHeader(ws, range, value) {
//   ws.mergeCells(range);
//   const cell = ws.getCell(range.split(":")[0]);
//   cell.value = value;
//   cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
//   cell.font = { bold: true };
// }
// function setCellHeader(ws, range, value, bold, center) {
//   const cell = ws.getCell(range);
//   cell.value = value;
//   cell.alignment = { horizontal: center, vertical: "middle", wrapText: true };
//   cell.font = { bold: bold };
// }
// const addTableBorders = (ws, startRow, endRow, startCol, endCol) => {
//   const lightBorder = { style: "thin", color: "black" };

//   for (let r = startRow; r <= endRow; r++) {
//     const row = ws.getRow(r);
//     for (let c = startCol; c <= endCol; c++) {
//       const cell = row.getCell(c);

//       cell.border = {
//         top: lightBorder,
//         bottom: lightBorder,
//         left: lightBorder,
//         right: lightBorder,
//       };
//     }
//   }
// };
exports.getDashboardData = async (req, res) => {
  try {
    const { year } = req.query;
    const months = [];

    if (year) {
      for (let i = 1; i <= 12; i++) {
        months.push(`${year}-${i.toString().padStart(2, "0")}`);
      }
    } else {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        months.push(monthStr);
      }
    }

    const result = await Promise.all(
      months.map(async (m) => {
        const matchQuery = { month: m };

        const materialCostUseds = await MaterialCostUsed.find(matchQuery)
          .populate({
            path: "materials.material",
            populate: [
              {
                path: "assignmentCode",
                select: "code name uom deviceCode",
                populate: [{ path: "uom" }, { path: "deviceCode" }],
              },
            ],
          })
          .lean();

        const materialBudgets = await MaterialBudget.find(matchQuery)
          .populate({
            path: "budgetCostDetails.assignmentCode",
            select: "code name uom deviceCode",
            populate: [{ path: "uom" }, { path: "deviceCode" }],
          })
          .lean();

        if (materialCostUseds.length === 0 && materialBudgets.length === 0) {
          return {
            month: m,
            totalUsed: 0,
            grossLoss: 0,
            grossSavings: 0,
            variance: 0,
          };
        }

        const data = processBudgetAndUsedData(
          materialBudgets,
          materialCostUseds,
          null,
        );

        let totalUsed = 0;
        let totalPlanned = 0;
        let grossLoss = 0;
        let grossSavings = 0;

        data.forEach((group) => {
          totalUsed += group.used_Cost || 0;
          totalPlanned += group.plan_Cost || 0;
          const v = group.varianceCost || 0;
          if (v < 0) {
            grossLoss += v;
          } else {
            grossSavings += v;
          }
        });

        return {
          month: m,
          totalUsed,
          totalPlanned,
          grossLoss,
          grossSavings,
          variance: grossLoss + grossSavings, // Net Variance
        };
      }),
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateMaterialAssignmentCode = async (req, res) => {
  try {
    const { materialCostId, materialItemId, newAssignmentCodeId, newPrice } =
      req.body;

    if (!materialCostId || !materialItemId) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu materialCostId hoặc materialItemId.",
      });
    }

    // Xây dựng $set fields
    const setFields = {
      "materials.$.assignmentCode": newAssignmentCodeId || null,
    };

    // Nếu có giá mới (lấy từ group đích trên FE), tính lại price và cost
    if (newPrice != null) {
      // Lấy quantity hiện tại của item
      const doc = await MaterialCostUsed.findOne(
        { _id: materialCostId, "materials._id": materialItemId },
        { "materials.$": 1 },
      ).lean();

      if (!doc || !doc.materials || doc.materials.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy vật tư cần cập nhật.",
        });
      }

      const quantity = doc.materials[0].quantity || 0;
      setFields["materials.$.price"] = newPrice;
      setFields["materials.$.cost"] = quantity * newPrice;
    }

    // Dùng positional operator để update đúng subdocument theo _id
    const result = await MaterialCostUsed.updateOne(
      { _id: materialCostId, "materials._id": materialItemId },
      { $set: setFields },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy vật tư cần cập nhật.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Cập nhật mã giao khoán, đơn giá và chi phí thành công.",
    });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateMaterialQuantity = async (req, res) => {
  try {
    const { materialCostId, materialItemId, newQuantity } = req.body;

    if (
      !materialCostId ||
      !materialItemId ||
      newQuantity === undefined ||
      newQuantity === null
    ) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu materialCostId, materialItemId hoặc newQuantity.",
      });
    }

    const quantity = Number(newQuantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      return res.status(400).json({
        status: "error",
        message: "Số lượng không hợp lệ.",
      });
    }

    const doc = await MaterialCostUsed.findById(materialCostId);
    if (!doc) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy dữ liệu.",
      });
    }

    const material = doc.materials.id(materialItemId);
    if (!material) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy vật tư cần cập nhật.",
      });
    }

    // Giữ nguyên price hiện tại, chỉ đổi quantity và tính lại cost của item này
    material.quantity = quantity;
    material.cost = quantity * (material.price || 0);

    // Tính lại totalUsedCost của cả document dựa trên tổng cost mới
    doc.totalUsedCost = doc.materials.reduce(
      (sum, m) => sum + (m.cost || 0),
      0,
    );

    await doc.save();

    res.status(200).json({
      status: "success",
      message: "Cập nhật số lượng thực hiện thành công.",
    });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};
