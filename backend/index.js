const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connect = require("./config/db");
const AssignmentCodeRouter = require("./routes/AssignmentCode");
const UnitRouter = require("./routes/Unit");
const MaterialAssignmentRouter = require("./routes/MaterialAssignment");
const PhaseGroupRouter = require("./routes/PhaseGroup");
const PhaseRouter = require("./routes/Phase");
const ExcavationTechRouter = require("./routes/ExcavationTech");
const HardnessRouter = require("./routes/Hardness");
const CrossSectionRouter = require("./routes/CrossSection");
const CurbSlopeRouter = require("./routes/CurbSlope");
const ThicknessRouter = require("./routes/Thickness");
const LengthRouter = require("./routes/Length");
const MiningTechRouter = require("./routes/MiningTech");
const StepRouter = require("./routes/Step");
const RockRatioRouter = require("./routes/RockRatio");
const MirrorRatioRouter = require("./routes/MirrorRatio");
const ProductionScopeRouter = require("./routes/ProductionScope");
const DeviceCodeRouter = require("./routes/DeviceCode");
const AssignmentNormRouter = require("./routes/AssignmentNorm");
const AdjustmentNormRouter = require("./routes/AdjustmentNorm");
const MaterialBudgetRouter = require("./routes/MaterialBudget");
const MaterialCostUsedRouter = require("./routes/MaterialCostUsed");
const InitialPlannedCostRouter = require("./routes/InitialPlannedCost");
const ContractSettlementRouter = require("./routes/ContractSettlement");
const UserRouter = require("./routes/User");
const SystemConfigRouter = require("./routes/SystemConfig");
const DepartmentRouter = require("./routes/Department");

const AuthRouter = require("./routes/Auth");

require("./utils/cron");

require("dotenv").config();

const app = express();

connect();
require("./data-seeder/seed");
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use("/api/auths", AuthRouter);
app.use("/api/assignmentcodes", AssignmentCodeRouter);
app.use("/api/units", UnitRouter);
app.use("/api/materialassignments", MaterialAssignmentRouter);
app.use("/api/phasegroups", PhaseGroupRouter);
app.use("/api/phases", PhaseRouter);
app.use("/api/excavationtechs", ExcavationTechRouter);
app.use("/api/hardness", HardnessRouter);
app.use("/api/crosssections", CrossSectionRouter);
app.use("/api/curbslopes", CurbSlopeRouter);
app.use("/api/thickness", ThicknessRouter);
app.use("/api/length", LengthRouter);
app.use("/api/miningtechs", MiningTechRouter);
app.use("/api/steps", StepRouter);
app.use("/api/rockratios", RockRatioRouter);
app.use("/api/mirrorratios", MirrorRatioRouter);
app.use("/api/productionscopes", ProductionScopeRouter);
app.use("/api/devicecodes", DeviceCodeRouter);
app.use("/api/assignmentnorms", AssignmentNormRouter);
app.use("/api/adjustmentnorms", AdjustmentNormRouter);
app.use("/api/materialbudgets", MaterialBudgetRouter);
app.use("/api/materialcostuseds", MaterialCostUsedRouter);
app.use("/api/initialplannedcosts", InitialPlannedCostRouter);
app.use("/api/contractsettlements", ContractSettlementRouter);
app.use("/api/users", UserRouter);
app.use("/api/system-configs", SystemConfigRouter);
app.use("/api/departments", DepartmentRouter);


const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is runing on port ${port}`);
});
