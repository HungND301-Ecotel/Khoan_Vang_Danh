const BaseController = require('../../../shared/base/BaseController');
const OtherMaterialCostService = require('./other-material-cost.service');

class OtherMaterialCostController extends BaseController {
  constructor() {
    super(new OtherMaterialCostService());
  }

  /**
   * POST / - Tạo mới chi phí vật tư khác
   */
  create = async (req, res, next) => {
    try {
      const result = await this.service.create(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Tạo thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /:id - Cập nhật chi phí vật tư khác
   */
  update = async (req, res, next) => {
    try {
      const result = await this.service.update(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Sửa thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /:id - Xóa chi phí vật tư khác
   */
  delete = async (req, res, next) => {
    try {
      await this.service.delete(req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Xóa thành công',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET / - Lấy danh sách có phân trang
   */
  get = async (req, res, next) => {
    try {
      const result = await this.service.getPaginated(req.query, {
        populate: ['department'],
      });
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = OtherMaterialCostController;
