const BaseRepository = require("./base.repository");
const { paginateQuery } = require("../utils/pagination");

class MaterialAssignmentRepository extends BaseRepository {
  constructor(model) {
    super(model);
  }

  async paginateGroup(query, reqQuery, assignmentCodeModel) {
    const modelQuery = assignmentCodeModel.find(query)
      .populate("deviceCode")
      .populate("uom")
      .sort({ code: 1 });
    return paginateQuery(assignmentCodeModel, modelQuery, query, reqQuery);
  }

  async findByAssignmentCode(assignmentId) {
    return this.model.find({ assignmentCode: assignmentId })
      .populate("assignmentCode")
      .populate("uom")
      .sort({ code: 1 });
  }

  async paginateMaterials(query, reqQuery) {
    let pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "assignmentcodes",
          localField: "assignmentCode",
          foreignField: "_id",
          as: "assignmentCode",
        },
      },
      {
        $unwind: { path: "$assignmentCode", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "units",
          localField: "uom",
          foreignField: "_id",
          as: "uom",
        },
      },
      { $unwind: { path: "$uom", preserveNullAndEmptyArrays: true } },
      {
        $sort: { "assignmentCode.code": 1 },
      },
    ];
    let queryModel = this.model.aggregate(pipeline);
    return paginateQuery(this.model, queryModel, query, reqQuery);
  }

  async getCounts() {
    return this.model.aggregate([
      {
        $facet: {
          withAssignment: [{ $match: { assignmentCode: { $ne: null } } }, { $count: "count" }],
          withoutAssignment: [{ $match: { assignmentCode: null } }, { $count: "count" }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);
  }

  async findAllForExport(query) {
    return this.model.find(query)
      .populate("uom")
      .populate("assignmentCode");
  }

  async bulkWrite(operations) {
    return this.model.bulkWrite(operations);
  }

  async findAllCompositeKeys() {
    return this.model.find({}, { code: 1, assignmentCode: 1, name: 1 }).lean();
  }
}

module.exports = MaterialAssignmentRepository;
