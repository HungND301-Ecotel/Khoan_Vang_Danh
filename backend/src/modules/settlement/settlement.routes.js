const router = require('express').Router();
const SettlementController = require('./settlement.controller');
const { verifyToken } = require('../../shared/middleware/auth.middleware');

const ctrl = new SettlementController();
router.use(verifyToken);

router.get('/getMonth', ctrl.getMonth);
router.get('/getQuarter', ctrl.getQuarter);
router.post('/getExcel', ctrl.getExcel);
router.post('/getQuarterExcel', ctrl.getQuarterExcel);
router.get('/getDashboardData', ctrl.getDashboardData);
router.patch('/updateMaterialAssignmentCode', ctrl.updateMaterialAssignmentCode);
router.patch('/updateMaterialQuantity', ctrl.updateMaterialQuantity);

module.exports = router;
