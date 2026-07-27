const MaterialCostUsedService = require('./material-cost-used.service');

class MaterialCostUsedController {
  constructor() {
    this.service = new MaterialCostUsedService();
  }

  /**
   * POST / - Tạo mới (upsert)
   */
  create = async (req, res) => {
    try {
      const saved = await this.service.create(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Tạo thành công',
        data: saved,
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  };

  /**
   * POST /batch - Tạo batch
   */
  createBatch = async (req, res) => {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Thiếu dữ liệu items',
        });
      }

      const savedDocs = await this.service.createBatch(items);
      res.status(201).json({
        status: 'success',
        message: 'Lưu thành công',
        data: savedDocs,
      });
    } catch (err) {
      console.log(err.stack);
      res.status(500).json({
        status: 'error',
        message: `Lưu thất bại, rollback: ${err.message}`,
      });
    }
  };

  /**
   * PUT /:id - Cập nhật
   */
  update = async (req, res) => {
    try {
      const updated = await this.service.update(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Sửa thành công',
        data: updated,
      });
    } catch (err) {
      console.log(err.stack);

      if (err.message === 'Sửa thất bại - Không tìm thấy dữ liệu cũ') {
        return res.status(404).json({
          status: 'error',
          message: err.message,
        });
      }

      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  };

  /**
   * PUT /batch - Cập nhật batch
   */
  updateBatch = async (req, res) => {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Thiếu dữ liệu items',
        });
      }

      const updatedDocs = await this.service.updateBatch(items);
      res.status(200).json({
        status: 'success',
        message: 'Sửa thành công',
        data: updatedDocs,
      });
    } catch (err) {
      console.log(err.stack);
      res.status(500).json({
        status: 'error',
        message: `Sửa thất bại, rollback: ${err.message}`,
      });
    }
  };

  /**
   * DELETE /:id - Xóa
   */
  delete = async (req, res) => {
    try {
      await this.service.delete(req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Xóa thành công',
      });
    } catch (err) {
      console.error(err.stack);
      const status = err.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(status).json({
        status: 'error',
        message: err.message,
      });
    }
  };

  /**
   * DELETE /batch - Xóa batch
   */
  deleteBatch = async (req, res) => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Thiếu danh sách id cần xóa',
        });
      }

      await this.service.deleteBatch(ids);
      res.status(200).json({
        status: 'success',
        message: 'Xóa thành công',
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        status: 'error',
        message: `Xóa thất bại, đã hoàn tác: ${err.message}`,
      });
    }
  };

  /**
   * DELETE /department - Xóa theo phân xưởng
   */
  deleteByDepartment = async (req, res) => {
    try {
      const { departmentIds } = req.body;

      if (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Chọn phân xưởng cần xóa',
        });
      }

      const deletedCount = await this.service.deleteByDepartment(departmentIds);
      res.status(200).json({
        status: 'success',
        message: `Đã xóa ${deletedCount} bản ghi và đồng bộ thành công`,
      });
    } catch (err) {
      console.error('Lỗi trong deleteByDepartment, đã rollback:', err.stack);
      res.status(500).json({
        status: 'error',
        message: `Xóa thất bại, đã hoàn tác: ${err.message}`,
      });
    }
  };

  /**
   * GET / - Cấp 0: Danh sách departments
   */
  get = async (req, res) => {
    try {
      const result = await this.service.getDepartments(req.query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  };

  /**
   * GET /months - Cấp 1: Các tháng trong department
   */
  getMonths = async (req, res) => {
    try {
      const { department } = req.query;
      if (!department) {
        return res.status(400).json({
          status: 'error',
          message: 'Thiếu department',
        });
      }

      const data = await this.service.getMonths(department);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  };

  /**
   * GET /scopes - Cấp 2: Các diện sản xuất trong department + tháng
   */
  getScopes = async (req, res) => {
    try {
      const { department, month } = req.query;
      if (!department || !month) {
        return res.status(400).json({
          status: 'error',
          message: 'Thiếu department hoặc month',
        });
      }

      const data = await this.service.getScopes(department, month);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  };

  /**
   * GET /phases - Cấp 3: Phase documents + materials đã group
   */
  getPhases = async (req, res) => {
    try {
      const { department, month } = req.query;
      if (!department || !month) {
        return res.status(400).json({
          status: 'error',
          message: 'Thiếu department hoặc month',
        });
      }

      const data = await this.service.getPhases(req.query);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (err) {
      console.error(err.stack);

      if (err.message === 'Không tìm thấy dữ liệu' || err.message === 'Thiếu productionScope') {
        const status = err.message.includes('Không tìm thấy') ? 404 : 400;
        return res.status(status).json({
          status: 'error',
          message: err.message,
        });
      }

      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  };
}

module.exports = MaterialCostUsedController;
