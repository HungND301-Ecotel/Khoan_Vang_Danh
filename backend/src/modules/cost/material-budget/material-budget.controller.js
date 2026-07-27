const BaseController = require('../../../shared/base/BaseController');
const MaterialBudgetService = require('./material-budget.service');

class MaterialBudgetController extends BaseController {
  constructor() {
    const service = new MaterialBudgetService();
    super(service);
  }

  /**
   * Cấp 0: departments aggregation
   * GET /
   */
  get = async (req, res, next) => {
    try {
      const result = await this.service.getDepartments(req.query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cấp 1: các tháng trong 1 department hoặc productionScope
   * GET /months
   */
  getMonths = async (req, res, next) => {
    try {
      const result = await this.service.getMonths(req.query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cấp 2: các diện (productionScope) trong 1 department + 1 tháng
   * GET /scopes
   */
  getScopes = async (req, res, next) => {
    try {
      const result = await this.service.getScopes(req.query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cấp 3: các phase thuộc 1 department + 1 tháng + 1 diện
   * GET /phases
   */
  getPhases = async (req, res, next) => {
    try {
      const result = await this.service.getPhases(req.query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get one với current price resolution
   * GET /:id
   */
  getOne = async (req, res, next) => {
    try {
      const result = await this.service.getOne(req.params.id);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = MaterialBudgetController;
