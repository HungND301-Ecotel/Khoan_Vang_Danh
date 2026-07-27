const SettlementService = require('./settlement.service');

class SettlementController {
  constructor() {
    this.service = new SettlementService();
  }

  /**
   * GET /getMonth - Du lieu quyet toan theo thang
   */
  getMonth = async (req, res) => {
    try {
      const result = await this.service.getMonth(req.query);
      res.status(200).json({
        status: 'success',
        data: result.data,
        mode: result.mode,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          status: 'error',
          message: err.message,
        });
      }
      console.log(err.stack);
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  /**
   * GET /getQuarter - Du lieu quyet toan theo quy
   */
  getQuarter = async (req, res) => {
    try {
      const { data, info } = await this.service.getQuarter(req.query);
      res.status(200).json({
        status: 'success',
        data: { data, info },
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          status: 'error',
          message: err.message,
        });
      }
      console.log(err.stack);
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  /**
   * POST /getExcel - Xuat Excel quyet toan theo thang
   */
  getExcel = async (req, res) => {
    try {
      const buffer = await this.service.getExcel(req.body.data);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=QuyetToanGiaoKhoan.xlsx',
      );
      res.send(buffer);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          status: 'error',
          message: err.message,
        });
      }
      console.log(err.stack);
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  /**
   * POST /getQuarterExcel - Xuat Excel quyet toan theo quy
   */
  getQuarterExcel = async (req, res) => {
    try {
      const bodyData = req.body.data || req.query;
      const buffer = await this.service.getQuarterExcel(bodyData);

      const quarter = bodyData.quarter;
      const year = bodyData.year;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=QuyetToanGiaoKhoanQuy${quarter}_${year}.xlsx`,
      );
      res.send(buffer);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          status: 'error',
          message: err.message,
        });
      }
      console.log(err.stack);
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  /**
   * GET /getDashboardData - Du lieu dashboard
   */
  getDashboardData = async (req, res) => {
    try {
      const result = await this.service.getDashboardData(req.query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  /**
   * PATCH /updateMaterialAssignmentCode - Cap nhat ma giao khoan cua vat tu
   */
  updateMaterialAssignmentCode = async (req, res) => {
    try {
      const message = await this.service.updateMaterialAssignmentCode(req.body);
      res.status(200).json({
        status: 'success',
        message,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          status: 'error',
          message: err.message,
        });
      }
      console.log(err.stack);
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  /**
   * PATCH /updateMaterialQuantity - Cap nhat so luong vat tu
   */
  updateMaterialQuantity = async (req, res) => {
    try {
      const message = await this.service.updateMaterialQuantity(req.body);
      res.status(200).json({
        status: 'success',
        message,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          status: 'error',
          message: err.message,
        });
      }
      console.log(err.stack);
      res.status(500).json({ status: 'error', message: err.message });
    }
  };
}

module.exports = SettlementController;
