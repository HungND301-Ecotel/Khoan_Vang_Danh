const BaseController = require('../../../shared/base/BaseController');
const InitialPlannedCostService = require('./initial-planned-cost.service');

class InitialPlannedCostController extends BaseController {
  constructor() {
    super(new InitialPlannedCostService());
  }

  /**
   * POST / - Tạo mới (với transaction + sync)
   */
  create = async (req, res, next) => {
    try {
      const result = await this.service.create(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Tạo và đồng bộ thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /batch - Tạo batch (với transaction + sync)
   */
  createBatch = async (req, res, next) => {
    try {
      const { items } = req.body;
      const result = await this.service.createBatch(items);
      res.status(201).json({
        status: 'success',
        message: 'Lưu và đồng bộ thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /batch - Cập nhật batch (với transaction + sync)
   */
  updateBatch = async (req, res, next) => {
    try {
      const { items } = req.body;
      const result = await this.service.updateBatch(items);
      res.status(200).json({
        status: 'success',
        message: 'Sửa và đồng bộ thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /:id - Cập nhật (với transaction + sync)
   */
  update = async (req, res, next) => {
    try {
      const result = await this.service.update(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Sửa và đồng bộ thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /:id - Xóa (cascade MaterialCostUsed + MaterialBudget)
   */
  delete = async (req, res, next) => {
    try {
      await this.service.delete(req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Xóa và đồng bộ thành công',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /batch - Xóa batch (với transaction + cascade)
   */
  deleteBatch = async (req, res, next) => {
    try {
      const { ids } = req.body;
      await this.service.deleteBatch(ids);
      res.status(200).json({
        status: 'success',
        message: 'Xóa và đồng bộ thành công',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /department - Xóa theo phân xưởng (với transaction + cascade)
   */
  deleteByDepartment = async (req, res, next) => {
    try {
      const { departmentIds } = req.body;
      const result = await this.service.deleteByDepartment(departmentIds);
      res.status(200).json({
        status: 'success',
        message: `Đã xóa ${result.deletedCount} bản ghi và đồng bộ thành công`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET / - Cấp 0: Danh sách departments aggregation
   */
  get = async (req, res, next) => {
    try {
      const result = await this.service.getDepartments(req.query);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /months - Cấp 1: Các tháng theo department
   */
  getMonths = async (req, res, next) => {
    try {
      const result = await this.service.getMonths(req.query);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /scopes - Cấp 2: Các productionScope theo tháng
   */
  getScopesByMonth = async (req, res, next) => {
    try {
      const result = await this.service.getScopesByMonth(req.query);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /phases - Cấp 3: Các phase theo scope
   */
  getPhasesByScope = async (req, res, next) => {
    try {
      const result = await this.service.getPhasesByScope(req.query);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /getOne/:productionScope - Lấy chi tiết theo productionScope
   */
  getOne = async (req, res, next) => {
    try {
      const result = await this.service.getOne(
        req.params.productionScope,
        req.query.department,
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /getScopesByDepartment/:departmentId - Lấy scopes theo department
   */
  getScopesByDepartment = async (req, res, next) => {
    try {
      const result = await this.service.getScopesByDepartment(req.params.departmentId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = InitialPlannedCostController;
