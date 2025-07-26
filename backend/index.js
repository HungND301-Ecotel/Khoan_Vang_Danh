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








const port = process.env.PORT || 8080
app.listen(port, () => {
    console.log(`Server is runing on port ${port}`)
})