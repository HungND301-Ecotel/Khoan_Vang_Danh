const router = require('express').Router();
const materialsOutsideContractController = require('../controller/MaterialsOutsideContract');

router.post('/', materialsOutsideContractController.create);
router.put('/:id', materialsOutsideContractController.update);
router.delete('/:id', materialsOutsideContractController.delete);

router.get('/filter/search', materialsOutsideContractController.getFilter);
router.get('/:id', materialsOutsideContractController.get); 
router.get('/', materialsOutsideContractController.getAll);

module.exports = router;