/**
 * Base Controller - Cung cấp các endpoint CRUD cơ bản
 * Các module con kế thừa và override khi cần custom logic
 */
class BaseController {
  constructor(service) {
    this.service = service;
  }

  /**
   * Tạo mới
   * POST /
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
   * Cập nhật theo ID
   * PUT /:id
   */
  update = async (req, res, next) => {
    try {
      const result = await this.service.update(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Cập nhật thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa theo ID
   * DELETE /:id
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
   * Xóa nhiều
   * DELETE /
   */
  deleteMany = async (req, res, next) => {
    try {
      const { ids } = req.body;
      const result = await this.service.deleteMany(ids);
      res.status(200).json({
        status: 'success',
        message: `Đã xóa ${result.deletedCount} bản ghi`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy danh sách có phân trang
   * GET /
   */
  get = async (req, res, next) => {
    try {
      const result = await this.service.getPaginated(req.query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy chi tiết theo ID
   * GET /:id
   */
  getById = async (req, res, next) => {
    try {
      const result = await this.service.getById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = BaseController;
