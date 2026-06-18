const MaterialCostUsed = require("../model/MaterialCostUsed");
const MaterialBudget = require("../model/MaterialBudget");
const ProductionScope = require("../model/ProductionScope");
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

  // 1. Hợp nhất TẤT CẢ Budget Phases từ TẤT CẢ Budget Docs
  materialBudgetDocs.forEach((budgetDoc) => {
    // Lọc phase nếu tham số phase được truyền
    const phasesToProcess = phase
      ? budgetDoc.phases.filter((p) => String(p.phase._id) === phase)
      : budgetDoc.phases;
    phasesToProcess.forEach((budgetPhase) => {
      budgetPhase.budgetCostDetails.forEach((detail) => {
        const code = detail.assignmentCode?.code;
        const price = detail.price || 0;
        const compoundKey = `${code}_${price}`;

        // Nếu đã tồn tại key, cộng dồn Quantity và Cost (vì có thể trùng ở document khác)
        if (mergedGroupsMap.has(compoundKey)) {
          const existing = mergedGroupsMap.get(compoundKey);
          existing.plan_Quantity += detail.quantity || 0;
          existing.plan_Cost += detail.cost || 0;
          existing.norm += detail.norm || 0;
        } else {
          // Khởi tạo nhóm mới
          mergedGroupsMap.set(compoundKey, {
            assignmentCode: detail.assignmentCode,
            baseNorm: detail.baseNorm,
            adjustmentNorm: detail.adjustmentNorm,
            norm: detail.norm,
            price: price,
            plan_Quantity: detail.quantity || 0, // Giá trị khởi tạo
            plan_Cost: detail.cost || 0, // Giá trị khởi tạo
            used_Quantity: 0,
            used_Cost: 0,
            materialUseds: [],
          });
        }
      });
    });
  });

  // 2. Hợp nhất TẤT CẢ Used Materials từ TẤT CẢ Used Docs
  materialCostUsedDocs.forEach((usedDoc) => {
    // Nếu có lọc theo phase, chỉ lấy các usedDoc có chứa phase đó
    if (phase) {
      const hasPhase = usedDoc.phases?.some(
        (p) => String(p.phase?._id || p.phase) === String(phase),
      );
      if (!hasPhase) return;
    }

    // Lặp qua tất cả vật tư trong document Used này
    usedDoc.materials.forEach((mat) => {
      // Ưu tiên assignmentCode trực tiếp trên material item, fallback về assignmentCode từ material reference
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
        // Trường hợp vật tư Used không có trong Budget Hợp nhất
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

      // Cập nhật tổng thực hiện (cho cả nhóm cũ và nhóm mới được tạo)
      group.used_Quantity += quantity;
      group.used_Cost += cost;

      // Thêm chi tiết vật tư vào nhóm (Có thể có chi tiết từ các Used Docs khác nhau)
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

  // 3. Tính toán Variance và Sắp xếp
  const finalGroups = Array.from(mergedGroupsMap.values()).map((group) => {
    // Nếu là vật tư không có định mức, gán kế hoạch bằng thực hiện
    if (!group.assignmentCode) {
      group.plan_Quantity = group.used_Quantity;
      group.plan_Cost = group.used_Cost;
    }

    const varianceQuantity = group.plan_Quantity - group.used_Quantity;
    const varianceCost = group.plan_Cost - group.used_Cost;
    return {
      ...group,
      varianceQuantity: varianceQuantity,
      varianceCost: varianceCost,
    };
  });

  // ... (Phần sắp xếp giữ nguyên) ...
  finalGroups.sort((a, b) => {
    const codeA = a.assignmentCode?.code || "NO_ASSIGNMENTCODE";
    const codeB = b.assignmentCode?.code || "NO_ASSIGNMENTCODE";
    // 1. Đẩy nhóm không có Mã giao khoán xuống cuối
    if (codeA === "NO_ASSIGNMENTCODE" && codeB !== "NO_ASSIGNMENTCODE") {
      return 1;
    }
    if (codeA !== "NO_ASSIGNMENTCODE" && codeB === "NO_ASSIGNMENTCODE") {
      return -1;
    }
    // 2. Sắp xếp Alphabetical
    if (codeA < codeB) {
      return -1;
    }
    if (codeA > codeB) {
      return 1;
    }
    return 0;
  });

  return finalGroups;
}

async function getMonth(res, productionScope, phase, matchQuery) {
  const materialCostUseds = await MaterialCostUsed.find(matchQuery)
    .populate({
      path: "productionScope",
      select: "code name",
    })
    .populate({
      path: "department",
      select: "code name",
    })
    .populate({
      path: "phases.phase",
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
    .lean();

  if (materialCostUseds.length === 0) {
    return res.status(404).json({
      status: "error",
      message: "Không tìm thấy dữ liệu chi phí thực hiện.",
    });
  }

  const materialBudgets = await MaterialBudget.find(matchQuery)
    .populate({
      path: "productionScope",
      select: "code name",
    })
    .populate({
      path: "department",
      select: "code name",
    })
    .populate({
      path: "phases.phase",
      select: "code name phaseGroup",
      populate: [{ path: "phaseGroup", populate: "code name" }],
    })
    .populate({
      path: "phases.budgetCostDetails.assignmentCode", // Đường dẫn lồng
      select: "code name uom deviceCode",
      populate: [{ path: "uom" }, { path: "deviceCode" }],
    })
    .populate({
      path: "phases.assignmentNormCode",
      select: "norms code",
      populate: [{ path: "norms.assignmentCode", populate: "uom" }],
    })
    .populate({
      path: "phases.adjustmentNormCode",
      select: "norms code rockRatio",
      populate: [
        { path: "norms.assignmentCode", populate: "uom" },
        { path: "rockRatio", select: "name" },
      ],
    })
    .lean();

  if (materialBudgets.length === 0) {
    return res.status(404).json({
      status: "error",
      message: "Không tìm thấy dữ liệu chi phí kế hoạch.",
    });
  }

  const allScopes = new Map();
  const allPhases = new Map();

  // Khởi tạo các tổng sản lượng
  let totalCoal = 0;
  let totalExcavation = 0;
  let totalCutting = 0;
  let rockRatio = null;

  materialBudgets.forEach((budgetDoc) => {
    // 1. Thu thập Production Scope
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

    // Lọc phase theo tham số query (Chỉ dùng để lấy Tỉ lệ đá kẹp nếu cần)
    const phasesToCheck = phase
      ? budgetDoc.phases.filter((p) => {
          const phaseList = Array.isArray(phase) ? phase : phase.split(",");
          return phaseList.includes(String(p.phase._id));
        })
      : budgetDoc.phases;

    phasesToCheck.forEach((budgetPhase) => {
      const phaseDoc = budgetPhase.phase;
      const phaseId = String(phaseDoc._id);
      const production = budgetPhase.production || 0;

      // Thu thập Phase (để tránh trùng lặp)
      if (!allPhases.has(phaseId)) {
        allPhases.set(phaseId, {
          _id: phaseId,
          code: phaseDoc.code,
          name: phaseDoc.name,
        });
      }

      // Tính tổng các loại sản lượng riêng biệt (Luôn cộng dồn TẤT CẢ phase đã lọc)
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

      if (phase && productionScope) {
        const phaseList = Array.isArray(phase) ? phase : phase.split(",");
        if (phaseList.includes(phaseId)) {
          // Lấy giá trị từ adjustmentNormCode đã được populate
          const rockRatioDoc = budgetPhase.adjustmentNormCode?.rockRatio;

          if (rockRatioDoc && rockRatioDoc.name !== undefined) {
            rockRatio = rockRatioDoc.name;
          } else {
            rockRatio = null;
          }
        }
      }
    });
  });

  const info = {
    productionScopes: Array.from(allScopes.values()),
    phases: Array.from(allPhases.values()),
    totalCoal,
    totalCutting,
    totalExcavation,
    rockRatio,
  };

  const data = processBudgetAndUsedData(
    materialBudgets,
    materialCostUseds,
    phase,
  );
  return { data, info };
}
exports.getMonth = async (req, res) => {
  try {
    const { productionScope, fromMonth, toMonth, phase, department } =
      req.query;

    if (!productionScope) {
      return res.status(400).json({
        status: "error",
        message: "Tham số diện sản xuất là bắt buộc.",
      });
    }

    // Luôn lọc theo tháng và diện sản xuất
    const matchQuery = {
      department: department,
      productionScope: productionScope,
    };

    if (fromMonth && toMonth) {
      matchQuery.month = { $gte: fromMonth, $lte: toMonth };
    } else if (fromMonth) {
      matchQuery.month = { $gte: fromMonth };
    } else if (toMonth) {
      matchQuery.month = { $lte: toMonth };
    }

    // Chỉ lọc theo công đoạn khi có chọn
    if (phase) {
      const phaseList = Array.isArray(phase) ? phase : phase.split(",");
      matchQuery["phases.phase"] = { $in: phaseList };
    }

    const { data, info } = await getMonth(
      res,
      productionScope,
      phase || null,
      matchQuery,
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

  materialBudgets.forEach((budgetDoc) => {
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

    const phasesToCheck = phaseId
      ? budgetDoc.phases.filter((p) => String(p.phase._id) === phaseId)
      : budgetDoc.phases;

    phasesToCheck.forEach((budgetPhase) => {
      const phaseDoc = budgetPhase.phase;
      const phaseIdStr = String(phaseDoc._id);
      const production = budgetPhase.production || 0;

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
        const rockRatioDoc = budgetPhase.adjustmentNormCode?.rockRatio;
        rockRatio =
          rockRatioDoc?.name !== undefined ? rockRatioDoc.name : null;
      }
    });
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
  // 1. Query 1 lần duy nhất (giữ nguyên populate như cũ)
  const [materialCostUseds, materialBudgets] = await Promise.all([
    MaterialCostUsed.find(matchQuery)
      .populate({ path: "productionScope", select: "code name" })
      .populate({ path: "department", select: "code name" })
      .populate({
        path: "phases.phase",
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
        path: "phases.phase",
        select: "code name phaseGroup",
        populate: [{ path: "phaseGroup", populate: "code name" }],
      })
      .populate({
        path: "phases.budgetCostDetails.assignmentCode",
        select: "code name uom deviceCode",
        populate: [{ path: "uom" }, { path: "deviceCode" }],
      })
      .populate({
        path: "phases.assignmentNormCode",
        select: "norms code",
        populate: [{ path: "norms.assignmentCode", populate: "uom" }],
      })
      .populate({
        path: "phases.adjustmentNormCode",
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
  // DEBUG
  console.log("=== DEBUG ===");
  console.log("fromMonth:", fromMonth, "toMonth:", toMonth);
  console.log("materialBudgets count:", materialBudgets.length);
  console.log("materialCostUseds count:", materialCostUseds.length);

  // Xem field month trong docs có đúng format không
  console.log("Budget months:", [
    ...new Set(materialBudgets.map((d) => d.month)),
  ]);
  console.log("Used months:", [
    ...new Set(materialCostUseds.map((d) => d.month)),
  ]);

  // 2. Tạo danh sách tháng
  const months = generateMonthRange(fromMonth, toMonth);
  const phaseList = phase
    ? Array.isArray(phase)
      ? phase
      : phase.split(",")
    : null;

  // 3. Group theo tháng
  const result = months.map((month) => {
    const budgetsByMonth = filterDocsByMonth(materialBudgets, month);
    const usedsByMonth = filterDocsByMonth(materialCostUseds, month);

    if (!phaseList) {
      // Không chọn công đoạn: gộp tất cả phase trong tháng
      return {
        month,
        info: buildInfo(budgetsByMonth, null, productionScope),
        data: processBudgetAndUsedData(budgetsByMonth, usedsByMonth, null),
      };
    } else {
      // Có chọn công đoạn: tách từng phase trong tháng
      const phases = phaseList.map((phaseId) => {
        const info = buildInfo(budgetsByMonth, phaseId, productionScope);
        const data = processBudgetAndUsedData(
          budgetsByMonth,
          usedsByMonth,
          phaseId,
        );

        let phaseName = info.phases[0]?.name || "";
        let phaseCode = info.phases[0]?.code || "";

        // Nếu budget không có phase này, tìm phase name/code từ usedsByMonth
        if (!phaseCode && usedsByMonth && usedsByMonth.length > 0) {
          for (const usedDoc of usedsByMonth) {
            const matchedPhase = usedDoc.phases?.find(
              (p) => String(p.phase?._id || p.phase) === String(phaseId),
            );
            if (matchedPhase && matchedPhase.phase) {
              phaseName = matchedPhase.phase.name || "";
              phaseCode = matchedPhase.phase.code || "";
              break;
            }
          }
        }

        return {
          phaseId,
          phaseName,
          phaseCode,
          info,
          data,
        };
      }).filter((p) => {
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

  // 4. Bỏ những tháng không có data (cả budget lẫn used đều rỗng)
  return result.filter((entry) => {
    if (entry.data) {
      return entry.data.length > 0;
    }
    return entry.phases && entry.phases.length > 0;
  });
}

// Export handler — giữ nguyên validate, chỉ thay call hàm
exports.getMonth = async (req, res) => {
  try {
    const { productionScope, fromMonth, toMonth, phase, department } = req.query;

    if (!productionScope) {
      return res.status(400).json({
        status: "error",
        message: "Tham số diện sản xuất là bắt buộc.",
      });
    }

    if (!fromMonth || !toMonth) {
      return res.status(400).json({
        status: "error",
        message: "Tham số fromMonth và toMonth là bắt buộc.",
      });
    }

    const matchQuery = {
      department,
      productionScope,
      month: { $gte: fromMonth, $lte: toMonth },
    };

    if (phase) {
      const phaseList = Array.isArray(phase) ? phase : phase.split(",");
      matchQuery["phases.phase"] = { $in: phaseList };
    }

    const data = await getMonthGrouped(
      productionScope,
      phase || null,
      matchQuery,
      fromMonth,
      toMonth,
    );

    res.status(200).json({ status: "success", data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ status: "error", message: err.message });
    }
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// exports.getExcel = async (req, res) => {
//   try {
//     const {
//       productionScope,
//       fromMonth,
//       toMonth,
//       phase,
//       quarter,
//       year,
//       department,
//     } = req.body.data;

//     const matchQuery = { department: department };

//     if (fromMonth && toMonth) {
//       matchQuery.month = { $gte: fromMonth, $lte: toMonth };
//     } else if (fromMonth) {
//       matchQuery.month = { $gte: fromMonth };
//     } else if (toMonth) {
//       matchQuery.month = { $lte: toMonth };
//     }

//     if (productionScope) {
//       matchQuery.productionScope = productionScope;
//     }

//     const isShow = productionScope && phase && phase.length > 0;
//     const isQuarter = quarter && year;

//     let result = {};
//     if (quarter && year) {
//       result = await getQuarterData(res, quarter, year);
//     } else {
//       result = await getMonth(res, productionScope, phase, matchQuery);
//     }
//     const { data, info } = result;

//     const workbook = new ExcelJS.Workbook();

//     const worksheet = workbook.addWorksheet("QTCP");

//     worksheet.mergeCells(`A1:U1`);
//     const tt1 = worksheet.getCell("A1");
//     tt1.value = "CÔNG TY CP THAN VÀNG DANH - VINACOMIN";

//     setMergeCellHeader(worksheet, "A2:A6", "STT");
//     setMergeCellHeader(worksheet, "B2:B6", "Mã vật tư");
//     setMergeCellHeader(worksheet, "C2:C6", "Trùng mã vật tư");
//     setMergeCellHeader(worksheet, "D2:D6", "Mã thiết bị");
//     setMergeCellHeader(worksheet, "E2:E6", "Mã giao khoán");
//     setMergeCellHeader(worksheet, "F2:F6", "Tên vật tư, tài sản");
//     setMergeCellHeader(worksheet, "G2:G6", "ĐVT");
//     setMergeCellHeader(worksheet, "H2:H6", "Đơn giá khoán");
//     setMergeCellHeader(
//       worksheet,
//       `I2:U2`,
//       isQuarter
//         ? `Quyết toán giao khoán quý ${quarter} năm ${year}`
//         : `Quyết toán giao khoán từ tháng ${new Date(fromMonth || toMonth).getMonth() + 1} đến tháng ${new Date(toMonth || fromMonth).getMonth() + 1}`,
//     );

//     if (isQuarter) {
//       setMergeCellHeader(worksheet, "I3:U4", "Bảng tổng hợp");
//     } else {
//       setMergeCellHeader(
//         worksheet,
//         "I3:U3",
//         (info.phases || []).map((i) => i.code).join(", "),
//       );
//       setMergeCellHeader(
//         worksheet,
//         "I4:U4",
//         (info.productionScopes || []).map((i) => i.code).join(", "),
//       );
//     }

//     setMergeCellHeader(worksheet, "I5:I6", "ĐM gốc");
//     setMergeCellHeader(worksheet, "J5:J6", "HS điều chỉnh ĐM");
//     setMergeCellHeader(worksheet, "K5:K6", "Định mức");
//     setMergeCellHeader(worksheet, "L5:N5", "Số lượng kế hoạch");

//     setCellHeader(worksheet, "L6", "Tổng", true, "center");
//     setCellHeader(worksheet, "M6", "Trong khoán", true, "center");
//     setCellHeader(worksheet, "N6", "Ngoài khoán", true, "center");

//     setMergeCellHeader(worksheet, "O5:O6", "Giá trị kế hoạch");

//     setMergeCellHeader(worksheet, "P5:R5", "Số lượng thực hiện");

//     setCellHeader(worksheet, "P6", "Tổng", true, "center");
//     setCellHeader(worksheet, "Q6", "Trong khoán", true, "center");
//     setCellHeader(worksheet, "R6", "Ngoài khoán", true, "center");

//     setMergeCellHeader(worksheet, "S5:S6", "Giá trị thực hiện");

//     setMergeCellHeader(worksheet, "T5:U5", "So sánh lãi (+); lỗ (-)");

//     setCellHeader(worksheet, "T6", "Số lượng", true, "center");
//     setCellHeader(worksheet, "U6", "Giá trị", true, "center");

//     setCellHeader(worksheet, "A7", "1", true, "center");
//     setCellHeader(worksheet, "F7", "Than nguyên khai", true, "left");
//     setCellHeader(
//       worksheet,
//       "L7",
//       info.totalCoal ? Number(info.totalCoal.toFixed(1)).toLocaleString() : "",
//       true,
//       "center",
//     );
//     setCellHeader(worksheet, "A8", "2", true, "center");
//     setCellHeader(worksheet, "F8", "Mét lò đào", true, "left");
//     setCellHeader(
//       worksheet,
//       "L8",
//       info.Excavation
//         ? Number(info.Excavation.toFixed(1)).toLocaleString()
//         : "",
//       true,
//       "center",
//     );
//     setCellHeader(worksheet, "A9", "3", true, "center");
//     setCellHeader(worksheet, "F9", "Mét lò xén", true, "left");
//     setCellHeader(
//       worksheet,
//       "L9",
//       info.totalCutting
//         ? Number(info.totalCutting.toFixed(1)).toLocaleString()
//         : "",
//       true,
//       "center",
//     );
//     setCellHeader(worksheet, "A10", "4", true, "center");
//     setCellHeader(
//       worksheet,
//       "F10",
//       "Tỉ lệ đá lẫn trong gương (Ckep)",
//       true,
//       "left",
//     );
//     setCellHeader(worksheet, "L10", info.rockRatio, true, "left");
//     setCellHeader(worksheet, "A11", "5", true, "center");
//     setCellHeader(worksheet, "F11", "Vật tư có định mức", true, "left");

//     let currentRow = 12; // Dữ liệu chi tiết bắt đầu từ dòng 12
//     let stt = 6; // Bắt đầu STT từ 5 (vì 1-4 là tổng hợp)

//     data.forEach((group, index) => {
//       // Cột A: STT
//       setCellHeader(worksheet, `A${currentRow}`, stt++, true, "center");

//       // Cột D: Mã thiết bị
//       setCellHeader(
//         worksheet,
//         `D${currentRow}`,
//         group.assignmentCode?.deviceCode?.code || "",
//         true,
//         "center",
//       );

//       // Cột E: Mã giao khoán
//       setCellHeader(
//         worksheet,
//         `E${currentRow}`,
//         group.assignmentCode?.code || "",
//         true,
//         "center",
//       );

//       // Cột F: Tên Vật tư / Tên Nhóm (Lấy tên Mã giao khoán)
//       setCellHeader(
//         worksheet,
//         `F${currentRow}`,
//         group.assignmentCode?.name || "Vật tư không có định mức",
//         true,
//         "left",
//       );

//       // Cột G: ĐVT (Lấy ĐVT của Mã giao khoán)
//       setCellHeader(
//         worksheet,
//         `G${currentRow}`,
//         group.assignmentCode?.uom?.name || "",
//         false,
//         "center",
//       );

//       // Cột H: Đơn giá khoán
//       setCellHeader(
//         worksheet,
//         `H${currentRow}`,
//         group.price ? Number(group.price.toFixed(0)).toLocaleString() : "",
//         false,
//         "center",
//       );

//       if (group.assignmentCode) {
//         // Dữ liệu Định mức và Kế hoạch (Tất cả đều trên dòng tổng hợp này)
//         setCellHeader(
//           worksheet,
//           `I${currentRow}`,
//           group.baseName
//             ? Number(group.baseName.toFixed(3)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `J${currentRow}`,
//           group.adjustmentNorm
//             ? Number(group.adjustmentNorm.toFixed(3)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `K${currentRow}`,
//           group.norm ? Number(group.norm.toFixed(3)).toLocaleString() : "",
//           false,
//           "center",
//         );

//         // Kế hoạch
//         setCellHeader(
//           worksheet,
//           `L${currentRow}`,
//           group.plan_Quantity
//             ? Number(group.plan_Quantity.toFixed(1)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );

//         setCellHeader(
//           worksheet,
//           `O${currentRow}`,
//           group.plan_Cost
//             ? Number(group.plan_Cost.toFixed(0)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );

//         // Thực hiện (Tổng)
//         setCellHeader(
//           worksheet,
//           `P${currentRow}`,
//           group.used_Quantity
//             ? Number(group.used_Quantity.toFixed(1)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );

//         // S: Giá trị Thực hiện (Tổng)
//         setCellHeader(
//           worksheet,
//           `S${currentRow}`,
//           group.used_Cost
//             ? Number(group.used_Cost.toFixed(0)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );

//         // So sánh Lãi/Lỗ
//         setCellHeader(
//           worksheet,
//           `T${currentRow}`,
//           group.varianceQuantity
//             ? Number(group.varianceQuantity.toFixed(1)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `U${currentRow}`,
//           group.varianceCost
//             ? Number(group.varianceCost.toFixed(0)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//       }

//       // --- B. Các dòng Chi tiết Vật tư thực hiện (materialUseds) ---
//       currentRow++;

//       group.materialUseds.forEach((matUsed) => {
//         // Cột B: Mã vật tư
//         setCellHeader(
//           worksheet,
//           `B${currentRow}`,
//           matUsed.material?.code,
//           false,
//           "left",
//         );
//         setCellHeader(
//           worksheet,
//           `C${currentRow}`,
//           (group?.materialUseds || []).filter(
//             (mat) => mat.material?._id === matUsed?.material?._id,
//           )?.length || 1,
//           false,
//           "center",
//         );

//         // Cột F: Tên vật tư (tên chi tiết)
//         setCellHeader(
//           worksheet,
//           `F${currentRow}`,
//           matUsed.material?.name,
//           false,
//           "left",
//         );

//         // Cột G: ĐVT (ĐVT của vật tư chi tiết)
//         setCellHeader(
//           worksheet,
//           `G${currentRow}`,
//           matUsed.material?.uom?.name,
//           false,
//           "center",
//         );

//         // Cột H: Đơn giá (Chỉ điền nếu không có Mã giao khoán)
//         if (!group.assignmentCode) {
//           setCellHeader(
//             worksheet,
//             `H${currentRow}`,
//             matUsed.price
//               ? Number(matUsed.price.toFixed(0)).toLocaleString()
//               : "",
//             false,
//             "center",
//           );
//         }

//         // Q: Trong khoán (Giả định: Vật tư con là trong khoán)
//         setCellHeader(
//           worksheet,
//           `P${currentRow}`,
//           matUsed.quantity
//             ? Number(matUsed.quantity.toFixed(1)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );

//         // S: Giá trị thực hiện
//         // Trong code FE: if assignmentCode then cost is empty, else cost is used_Cost
//         if (!group.assignmentCode) {
//           setCellHeader(
//             worksheet,
//             `S${currentRow}`,
//             matUsed.cost
//               ? Number(matUsed.cost.toFixed(0)).toLocaleString()
//               : "",
//             false,
//             "center",
//           );
//         }

//         currentRow++;
//       });
//     });

//     worksheet.columns = [
//       { width: 6 }, // A: STT
//       { width: 20 }, // B: Mã vật tư
//       { width: 10, hidden: isQuarter }, // C: Trùng mã vật tư
//       { width: 10 }, // D: Mã thiết bị
//       { width: 10 }, // E: Mã giao khoán
//       { width: 30 }, // F: Tên vật tư, tài sản
//       { width: 10 }, // G: ĐVT
//       { width: 15 }, // H: Đơn giá khoán
//       { width: 10, hidden: !isShow }, // I: ĐM gốc
//       { width: 10, hidden: !isShow }, // J: HS điều chỉnh ĐM
//       { width: 10, hidden: !isShow }, // K: Định mức
//       { width: 15 }, // L: SL Kế hoạch (Tổng)
//       { width: 10 }, // M: SL Kế hoạch (Trong khoán)
//       { width: 10 }, // N: SL Kế hoạch (Ngoài khoán)
//       { width: 15 }, // O: Giá trị kế hoạch
//       { width: 15 }, // P: SL Thực hiện (Tổng)
//       { width: 10 }, // Q: SL Thực hiện (Trong khoán)
//       { width: 10 }, // R: SL Thực hiện (Ngoài khoán)
//       { width: 15 }, // S: Giá trị thực hiện
//       { width: 15 }, // T: So sánh SL
//       { width: 15 }, // U: So sánh Giá trị
//     ];
//     addTableBorders(worksheet, 2, currentRow, 1, 21);

//     worksheet.eachRow((row, rowNumber) => {
//       row.eachCell((cell) => {
//         if (!cell.font) cell.font = {};
//         cell.font = {
//           ...cell.font, // giữ lại các thuộc tính khác (bold, italic,…)
//           name: "Times New Roman", // đổi font chữ
//           size: 12, // kích thước chữ
//         };
//       });
//     });

//     const buffer = await workbook.xlsx.writeBuffer();

//     // Thiết lập header để tải file về
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     );
//     res.setHeader("Content-Disposition", "attachment; filename*=UTF-8''*.xlsx"); // Gửi buffer về client
//     res.send(buffer);
//     req.logger.info(`✅ Export excel thành công`);
//   } catch (err) {
//     console.log(err.stack);
//     res.status(500).json({ status: "error", message: err.message });
//   }
// };

// exports.getExcelM3 = async (req, res) => {
//   try {
//     const { productionScope, fromMonth, toMonth, phase, department } =
//       req.body.data;

//     const matchQuery = {
//       department: department,
//     };
//     if (phase) {
//       const phaseList = Array.isArray(phase) ? phase : phase.split(",");
//       matchQuery["phases.phase"] = { $in: phaseList };
//     }
//     if (fromMonth && toMonth) {
//       matchQuery.month = { $gte: fromMonth, $lte: toMonth };
//     } else if (fromMonth) {
//       matchQuery.month = { $gte: fromMonth };
//     } else if (toMonth) {
//       matchQuery.month = { $lte: toMonth };
//     }

//     if (productionScope) {
//       matchQuery.productionScope = productionScope;
//     }

//     const result = await getMonth(res, productionScope, phase, matchQuery);
//     const { data, info } = result;

//     const workbook = new ExcelJS.Workbook();

//     const worksheet = workbook.addWorksheet(
//       "BC_thuc_hien_dinh_muc_vat_tu_theo_PX",
//     );

//     worksheet.mergeCells(`A1:M1`);
//     const tt1 = worksheet.getCell("A1");
//     tt1.value = "CÔNG TY CP THAN VÀNG DANH - VINACOMIN";

//     worksheet.mergeCells(`A2:M2`);
//     const tt2 = worksheet.getCell("A2");
//     tt2.value = "BÁO CÁO THỰC HIỆN ĐM VẬT TƯ THEO PHÂN XƯỞNG";

//     setMergeCellHeader(worksheet, "A3:A5", "Mã giao khoán");
//     setMergeCellHeader(worksheet, "B3:B5", "Tên vật tư, tài sản");
//     setMergeCellHeader(worksheet, "C3:C5", "ĐVT");
//     setMergeCellHeader(worksheet, "D3:D5", "Đơn giá(VNĐ)");
//     setMergeCellHeader(
//       worksheet,
//       "E3:M3",
//       `${
//         (info?.productionScopes || []).map((i) => i?.code).join(", ") +
//         " " +
//         (info?.phases || []).map((i) => i?.code).join(", ")
//       }`,
//     );
//     setCellHeader(worksheet, "E4", "Khối lượng", true, "center");

//     setMergeCellHeader(worksheet, "F4:H4", "Kế hoạch");
//     setMergeCellHeader(worksheet, "I4:J4", "Thực hiện");
//     setMergeCellHeader(worksheet, "K4:L4", "So sánh");
//     setMergeCellHeader(worksheet, "M4:M5", "Ghi chú");

//     setCellHeader(
//       worksheet,
//       "E5",
//       `${info.totalCoal || info.totalCutting || info.totalExcavation}`,
//       true,
//       "center",
//     );
//     setCellHeader(worksheet, "F5", "ĐM", true, "center");
//     setCellHeader(worksheet, "G5", "Số lượng", true, "center");
//     setCellHeader(worksheet, "H5", "Giá trị", true, "center");
//     setCellHeader(worksheet, "I5", "Số lượng", true, "center");
//     setCellHeader(worksheet, "J5", "Giá trị", true, "center");
//     setCellHeader(worksheet, "K5", "Số lượng", true, "center");
//     setCellHeader(worksheet, "L5", "Giá trị", true, "center");

//     let currentRow = 6;
//     data.forEach((group, index) => {
//       // KIỂM TRA ĐIỀU KIỆN: Nếu có assignmentCode hoặc group.assignmentCode là null (nhóm hợp lệ)
//       if (group.assignmentCode || group.assignmentCode === null) {
//         // --- IN DÒNG NHÓM (Dòng tổng) ---
//         setCellHeader(
//           worksheet,
//           `A${currentRow}`,
//           group.assignmentCode?.code || "",
//           true,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `B${currentRow}`,
//           group.assignmentCode?.name || "Vật tư không không có định mức",
//           true,
//           "left",
//         );
//         setCellHeader(
//           worksheet,
//           `C${currentRow}`,
//           group.assignmentCode?.uom?.name || "",
//           false,
//           "center",
//         );

//         // Đơn giá, ĐM, Kế hoạch, Thực hiện của Nhóm
//         setCellHeader(
//           worksheet,
//           `D${currentRow}`,
//           group.price ? Number(group.price.toFixed(0)).toLocaleString() : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `F${currentRow}`,
//           group.norm ? Number(group.norm.toFixed(3)).toLocaleString() : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `G${currentRow}`,
//           group.plan_Quantity
//             ? Number(group.plan_Quantity.toFixed(1)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `H${currentRow}`,
//           group.plan_Cost
//             ? Number(group.plan_Cost.toFixed(0)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `I${currentRow}`,
//           group.used_Quantity
//             ? Number(group.used_Quantity.toFixed(1)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `J${currentRow}`,
//           group.used_Cost
//             ? Number(group.used_Cost.toFixed(0)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `K${currentRow}`,
//           group.varianceQuantity
//             ? Number(group.varianceQuantity.toFixed(1)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );
//         setCellHeader(
//           worksheet,
//           `L${currentRow}`,
//           group.varianceCost
//             ? Number(group.varianceCost.toFixed(0)).toLocaleString()
//             : "",
//           false,
//           "center",
//         );

//         currentRow++; // Xong dòng nhóm, tăng dòng lên
//       } else {
//         setCellHeader(
//           worksheet,
//           `B${currentRow}`,
//           "Vật tư không có định mức",
//           true,
//           "left",
//         );
//         currentRow++;
//         // --- NGƯỢC LẠI: LẤY CHI TIẾT TỪNG VẬT TƯ (Không hiện dòng nhóm) ---
//         if (group.materialUseds && group.materialUseds.length > 0) {
//           group.materialUseds.forEach((matUsed) => {
//             // Cột A: Để trống hoặc ghi chú "Ngoài định mức"
//             setCellHeader(worksheet, `A${currentRow}`, "", false, "center");

//             // Cột B: Tên vật tư chi tiết
//             setCellHeader(
//               worksheet,
//               `B${currentRow}`,
//               matUsed.material?.name || "",
//               false,
//               "left",
//             );

//             // Cột C: ĐVT của vật tư
//             setCellHeader(
//               worksheet,
//               `C${currentRow}`,
//               matUsed.material?.uom?.name || "",
//               false,
//               "center",
//             );

//             // Cột D: Đơn giá của từng vật tư
//             setCellHeader(
//               worksheet,
//               `D${currentRow}`,
//               matUsed.price
//                 ? Number(matUsed.price.toFixed(0)).toLocaleString()
//                 : "",
//               false,
//               "center",
//             );

//             // Các cột khác (ĐM, Kế hoạch thường bằng 0 hoặc trống đối với vật tư ngoài khoán)
//             setCellHeader(worksheet, `F${currentRow}`, "", false, "center");
//             setCellHeader(worksheet, `G${currentRow}`, "", false, "center");
//             setCellHeader(worksheet, `H${currentRow}`, "", false, "center");

//             // Cột I & J: Số lượng và Giá trị thực hiện của vật tư đó
//             setCellHeader(
//               worksheet,
//               `I${currentRow}`,
//               matUsed.quantity
//                 ? Number(matUsed.quantity.toFixed(1)).toLocaleString()
//                 : "0",
//               false,
//               "center",
//             );
//             setCellHeader(
//               worksheet,
//               `J${currentRow}`,
//               matUsed.cost
//                 ? Number(matUsed.cost.toFixed(0)).toLocaleString()
//                 : "0",
//               false,
//               "center",
//             );

//             currentRow++; // Mỗi vật tư 1 dòng
//           });
//         }
//       }
//     });

//     worksheet.columns = [
//       { width: 10 },
//       { width: 30 },
//       { width: 10 },
//       { width: 15 },
//       { width: 15 },
//       { width: 10 },
//       { width: 10 },
//       { width: 15 },
//       { width: 15 },
//       { width: 10 },
//       { width: 10 },
//       { width: 15 },
//       { width: 15 },
//     ];
//     addTableBorders(worksheet, 3, currentRow, 1, 13);

//     worksheet.eachRow((row, rowNumber) => {
//       row.eachCell((cell) => {
//         if (!cell.font) cell.font = {};
//         cell.font = {
//           ...cell.font, // giữ lại các thuộc tính khác (bold, italic,…)
//           name: "Times New Roman", // đổi font chữ
//           size: 12, // kích thước chữ
//         };
//       });
//     });

//     const buffer = await workbook.xlsx.writeBuffer();

//     // Thiết lập header để tải file về
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     );
//     res.setHeader("Content-Disposition", "attachment; filename*=UTF-8''*.xlsx"); // Gửi buffer về client
//     res.send(buffer);
//     req.logger.info(`✅ Export excel thành công`);
//   } catch (err) {
//     console.log(err.stack);
//     res.status(500).json({ status: "error", message: err.message });
//   }
// };

// function getMonthsInQuarter(year, quarter) {
//   const startMonth = (quarter - 1) * 3 + 1;
//   const endMonth = startMonth + 2;
//   const months = [];

//   for (let m = startMonth; m <= endMonth; m++) {
//     months.push(`${year}-${String(m).padStart(2, "0")}`);
//   }
//   return months;
// }

// async function getQuarterData(res, quarter, year) {
//   const months = getMonthsInQuarter(year, quarter);

//   // Khởi tạo các tổng cho quý
//   let mergedGroupsMap = new Map();
//   let totalCoal = 0;
//   let totalCutting = 0;
//   let totalExcavation = 0;

//   for (const month of months) {
//     const matchQuery = { month: month };

//     // --- 1. Truy vấn Dữ liệu tháng (Budget và Used) ---
//     // Sử dụng logic truy vấn y hệt như getMonth nhưng không cần populate sâu (vì không cần rockRatio/phase details)

//     const materialCostUseds = await MaterialCostUsed.find(matchQuery)
//       // Cần populate 'materials.material.assignmentCode' để có Mã/Đơn giá hợp nhất
//       .populate({
//         path: "materials.material",
//         populate: [
//           { path: "uom", select: "name" },
//           {
//             path: "assignmentCode",
//             select: "code name uom deviceCode",
//             populate: "deviceCode",
//           },
//         ],
//       })
//       .populate({
//         path: "materials.assignmentCode",
//         select: "code name uom deviceCode",
//         populate: [{ path: "uom" }, { path: "deviceCode" }],
//       })
//       .lean();

//     const materialBudgets = await MaterialBudget.find(matchQuery)
//       // Cần populate 'phases.budgetCostDetails.assignmentCode' và 'phases.phase'
//       .populate({
//         path: "phases.phase",
//         select: "code name phaseGroup",
//         populate: [{ path: "phaseGroup", populate: "code name" }],
//       })
//       .populate({
//         path: "phases.budgetCostDetails.assignmentCode",
//         select: "code name uom deviceCode",
//         populate: "deviceCode",
//       })
//       // Không cần populate adjustmentNormCode/rockRatio vì không tính tỉ lệ đá kẹp
//       .lean();

//     if (materialBudgets.length === 0 && materialCostUseds.length === 0) {
//       // Nếu không có dữ liệu cho tháng này, bỏ qua
//       continue;
//     }

//     // --- 2. Tổng hợp Sản lượng ---
//     materialBudgets.forEach((budgetDoc) => {
//       budgetDoc.phases.forEach((budgetPhase) => {
//         const phaseDoc = budgetPhase.phase;
//         const production = budgetPhase.production || 0;

//         switch (phaseDoc.phaseGroup?.name.toLowerCase()) {
//           case PhaseType.COAL.toLowerCase():
//             totalCoal += production;
//             break;
//           case PhaseType.EXCAVATION.toLowerCase():
//             totalExcavation += production;
//             break;
//           case PhaseType.CUTTING.toLowerCase():
//             totalCutting += production;
//             break;
//         }
//       });
//     });

//     // --- 3. Tổng hợp Dữ liệu Vật tư (Budget và Used) ---
//     // Sử dụng logic hợp nhất tương tự processBudgetAndUsedData, nhưng hợp nhất vào mergedGroupsMap chung

//     // Hợp nhất Budget (Kế hoạch)
//     materialBudgets.forEach((budgetDoc) => {
//       budgetDoc.phases.forEach((budgetPhase) => {
//         budgetPhase.budgetCostDetails.forEach((detail) => {
//           const code = detail.assignmentCode?.code;
//           const price = detail.price || 0;
//           const compoundKey = `${code}_${price}`;

//           if (mergedGroupsMap.has(compoundKey)) {
//             const existing = mergedGroupsMap.get(compoundKey);
//             existing.plan_Quantity += detail.quantity || 0;
//             existing.plan_Cost += detail.cost || 0;
//           } else {
//             mergedGroupsMap.set(compoundKey, {
//               assignmentCode: detail.assignmentCode,
//               // Norms không cần tổng hợp cho quý
//               baseNorm: "",
//               adjustmentNorm: "",
//               norm: "",
//               price: price,
//               plan_Quantity: detail.quantity || 0,
//               plan_Cost: detail.cost || 0,
//               used_Quantity: 0,
//               used_Cost: 0,
//               materialUseds: [], // Chi tiết vật tư sẽ không được tổng hợp ở đây
//             });
//           }
//         });
//       });
//     });

//     // Hợp nhất Used (Thực hiện)
//     materialCostUseds.forEach((usedDoc) => {
//       usedDoc.materials.forEach((mat) => {
//         // Ưu tiên assignmentCode trực tiếp trên material item (đã cập nhật qua kéo thả),
//         // fallback về assignmentCode từ material reference — giống logic processBudgetAndUsedData
//         const assignmentCodeDoc =
//           mat.assignmentCode || mat.material?.assignmentCode;
//         const code = assignmentCodeDoc?.code || "";
//         const matPrice = mat.price || 0;
//         const quantity = mat.quantity || 0;
//         const cost = mat.cost || 0;

//         const compoundKey = assignmentCodeDoc
//           ? `${code}_${matPrice}`
//           : "NO_ASSIGNMENTCODE";

//         let group = mergedGroupsMap.get(compoundKey);

//         if (!group) {
//           group = {
//             assignmentCode: assignmentCodeDoc,
//             baseNorm: "",
//             adjustmentNorm: "",
//             norm: "",
//             price: assignmentCodeDoc ? matPrice : "",
//             plan_Quantity: 0,
//             plan_Cost: 0,
//             used_Quantity: 0,
//             used_Cost: 0,
//             materialUseds: [],
//           };
//           mergedGroupsMap.set(compoundKey, group);
//         }

//         group.used_Quantity += quantity;
//         group.used_Cost += cost;

//         // Lưu vật tư chi tiết vào nhóm (cần thiết cho phần Excel sau này)
//         group.materialUseds.push({
//           materialCostId: usedDoc._id,
//           materialItemId: mat._id,
//           material: mat.material,
//           quantity: quantity,
//           price: matPrice,
//           cost: cost,
//         });
//       });
//     });
//   } // Kết thúc vòng lặp tháng

//   // --- 4. Hoàn thiện Dữ liệu và Tính toán Variance ---
//   const finalGroups = Array.from(mergedGroupsMap.values()).map((group) => {
//     const varianceQuantity = group.plan_Quantity - group.used_Quantity;
//     const varianceCost = group.plan_Cost - group.used_Cost;

//     // Cần tổng hợp lại mảng materialUseds nếu có vật tư trùng lặp từ các tháng khác nhau
//     // Đối với quý, ta sẽ giữ nguyên chi tiết materialUseds để đơn giản hóa.

//     return {
//       ...group,
//       varianceQuantity: varianceQuantity,
//       varianceCost: varianceCost,
//     };
//   });

//   // Sắp xếp (sử dụng logic sắp xếp từ processBudgetAndUsedData)
//   finalGroups.sort((a, b) => {
//     const codeA = a.assignmentCode?.code || "NO_ASSIGNMENTCODE";
//     const codeB = b.assignmentCode?.code || "NO_ASSIGNMENTCODE";
//     if (codeA === "NO_ASSIGNMENTCODE" && codeB !== "NO_ASSIGNMENTCODE")
//       return 1;
//     if (codeA !== "NO_ASSIGNMENTCODE" && codeB === "NO_ASSIGNMENTCODE")
//       return -1;
//     if (codeA < codeB) return -1;
//     if (codeA > codeB) return 1;
//     return 0;
//   });

//   const info = {
//     totalCoal,
//     totalCutting,
//     totalExcavation,
//     // Bỏ rockRatio, phases, productionScopes
//   };

//   return { data: finalGroups, info };
// }

// // ----------------------------------------------------------------------
// // CONTROLLER MỚI: exports.getQuarter
// // ----------------------------------------------------------------------
// exports.getQuarter = async (req, res) => {
//   try {
//     const { quarter, year } = req.query;

//     if (!quarter || !year) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "Tham số quý và năm là bắt buộc." });
//     }

//     const { data, info } = await getQuarterData(res, quarter, year);

//     res.status(200).json({
//       status: "success",
//       data: { data, info },
//     });
//   } catch (err) {
//     console.log(err.stack);
//     res.status(500).json({ status: "error", message: err.message });
//   }
// };

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
            path: "phases.budgetCostDetails.assignmentCode",
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
