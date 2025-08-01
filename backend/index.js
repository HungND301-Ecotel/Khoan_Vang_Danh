const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const connect = require('./config/db')
const AssignmentCodeRouter = require('./routes/AssignmentCode')
const UnitRouter = require('./routes/Unit')
const MaterialAssignmentRouter = require('./routes/MaterialAssignment')
const PhaseGroupRouter = require('./routes/PhaseGroup')
const PhaseRouter = require('./routes/Phase')
const ExcavationTechRouter = require('./routes/ExcavationTech')
const HardnessRouter = require('./routes/Hardness')
const CrossSectionRouter = require('./routes/CrossSection')
const CurbSlopeRouter = require('./routes/CurbSlope')
const ThicknessRouter = require('./routes/Thickness')
const LengthRouter = require('./routes/Length')
const MiningTechRouter = require('./routes/MiningTech')
const StepRouter = require('./routes/Step')
const ExcavationNormRouter = require('./routes/ExcavationNorm')
const CuttingNormRouter = require('./routes/CuttingNorm')
const CoalCuttingNormZRYRouter = require('./routes/CoalCuttingNormZRY')
const CoalCuttingNormZHRouter = require('./routes/CoalCuttingNormZH')
const CoalCuttingNormKBRouter = require('./routes/CoalCuttingNormKB')
const RockRatioRouter = require('./routes/RockRatio')
const MirrorRatioRouter = require('./routes/MirrorRatio')
const AdjustmentNormKRouter = require('./routes/AdjustmentNormK')
const AdjustmentNormCMRouter = require('./routes/AdjustmentNormCM')
const ProductionScopeRouter = require('./routes/ProductionScope')
const DeviceCodeRouter = require('./routes/DeviceCode')
const AssignmentNormRouter = require('./routes/AssignmentNorm')
const AdjustmentNormRouter = require('./routes/AdjustmentNorm')
const MaterialBudgetRouter = require('./routes/MaterialBudget')
const MaterialCostUsedRouter = require('./routes/MaterialCostUsed')
























require('dotenv').config()

const app = express()

connect()
app.use(morgan('dev'))
app.use(cors())
app.use(express.json())

app.use('/api/assignmentcodes', AssignmentCodeRouter)
app.use('/api/units', UnitRouter)
app.use('/api/materialassignments', MaterialAssignmentRouter)
app.use('/api/phasegroups', PhaseGroupRouter)
app.use('/api/phases', PhaseRouter)
app.use('/api/excavationtechs', ExcavationTechRouter)
app.use('/api/hardness', HardnessRouter)
app.use('/api/crosssections', CrossSectionRouter)
app.use('/api/curbslopes', CurbSlopeRouter)
app.use('/api/thickness', ThicknessRouter)
app.use('/api/length', LengthRouter)
app.use('/api/miningtechs', MiningTechRouter)
app.use('/api/steps', StepRouter)
app.use('/api/excavationnorms', ExcavationNormRouter)
app.use('/api/cuttingnorms', CuttingNormRouter)
app.use('/api/coalcuttingnormzhs', CoalCuttingNormZHRouter)
app.use('/api/coalcuttingnormzrys', CoalCuttingNormZRYRouter)
app.use('/api/coalcuttingnormkbs', CoalCuttingNormKBRouter)
app.use('/api/rockratios', RockRatioRouter)
app.use('/api/mirrorratios', MirrorRatioRouter)
app.use('/api/adjustmentnormks', AdjustmentNormKRouter)
app.use('/api/adjustmentnormcms', AdjustmentNormCMRouter)
app.use('/api/productionscopes', ProductionScopeRouter)
app.use('/api/devicecodes', DeviceCodeRouter)
app.use('/api/assignmentnorms', AssignmentNormRouter)
app.use('/api/adjustmentnorms', AdjustmentNormRouter)
app.use('/api/materialbudgets', MaterialBudgetRouter)
app.use('/api/materialcostuseds', MaterialCostUsedRouter)















const port = process.env.PORT || 8080
app.listen(port, () => {
    console.log(`Server is runing on port ${port}`)
})