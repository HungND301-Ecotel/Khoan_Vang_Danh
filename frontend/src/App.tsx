import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Auth/Login";
import MainLayout from "./layout/Mainlayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import AssignmentCode from "./pages/AssignmentCode/AssignmentCode";

import Unit from "./pages/Unit/Unit";
import Department from "./pages/Department/Department";
import MaterialAssignment from "./pages/MaterialAssignment/MaterialAssignment";
import PhaseGroup from "./pages/PhaseGroup/PhaseGroup";
import Phase from "./pages/Phase/Phase";
import ExcavationTech from "./pages/ExcavationTech/ExcavationTech";
import Hardness from "./pages/Hardness/Hardness";
import CrossSection from "./pages/CrossSection/CrossSection";
import CurbSlope from "./pages/CurbSlope/CurbSlope";
import Thickness from "./pages/Thickness/Thickness";
import Length from "./pages/Length/Length";
import MiningTech from "./pages/MiningTech/MiningTech";
import Materialunitprice from "./pages/MaterialUnitPrice/Materialunitprice";
import Step from "./pages/Step/Step";
import ExcavationNorm from "./pages/ExcavationNorm/ExcavationNorm";
import CuttingNorm from "./pages/CuttingNorm/CuttingNorm";
import RockRatio from "./pages/RockRatio/RockRatio";
import MirrorRatio from "./pages/MirrorRatio/MirrorRatio";
import AdjustmentNormKKT from "./pages/AdjustmentNormKKT/AdjustmentNormKKT";
import AdjustmentNormKDL from "./pages/AdjustmentNormKDL/AdjustmentNormKDL";
import AdjustmentNormCM from "./pages/AdjustmentNormCM/AdjustmentNormCM";
import ProductScope from "./pages/ProductionScope/ProductionScope";
import DeviceCode from "./pages/DeviceCode/DeviceCode";
import MaterialBudget from "./pages/MaterialBudget/MaterialBudget";
import MaterialCostUsed from "./pages/MaterialCostUsed/MaterialCostUsed";
import Setttlementreport from "./pages/SettlementReport/SettlementReport";
import Ratedadjustmentfactor from "./pages/Ratedadjustmentfactor/Ratedadjustmentfactor";
import Adjustmentfactorfornorms from "./pages/Adjustmentfactorfornorms/Adjustmentfactorfornorms";
import Parameter from "./pages/Parameter/Parameter";
import CoalCuttingNorm from "./pages/CoalCuttingNorm/CoalCuttingNorm";
// import Quarterlycontractsettlement from './pages/Quarterlycontractsettlement/Quarterlycontractsettlement';
import SettlementReportSummary from "./pages/SettlementReportSummary/SettlementReportSummary";
import InitialPlannedCosts from "./pages/InitialPlannedCosts/InitialPlannedCosts";
import TechnologyKPIReport from "./pages/Report/TechnologyKPIReport";
import CostReport from "./pages/Report/CostReport";
import MaterialConsumptionReport from "./pages/Report/MaterialConsumptionReport";
import SettlementReport from "./pages/Report/SettlementReport";
import ContractSettlementReport from "./pages/Report/ContractSettlementReport";
import ProductionPhaseReport from "./pages/Report/ProductionPhaseReport";
import ReportLayout from "./layout/ReportLayout";
import Quarterlycontractsettlement from "./pages/Report/Quarterlycontractsettlement";
import AssignmentNorm from "./pages/AssignmentNorm/AssignmentNorm";

const PrivateRoute: React.FC = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" />;
  }
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Tất cả các route được bảo vệ */}
        <Route element={<PrivateRoute />}>
          {/* Nhóm 1: Các route báo cáo đi qua ReportLayout */}
          <Route path="/report" element={<ReportLayout />}>
            <Route
              path="technologykpireport"
              element={<TechnologyKPIReport />}
            />
            <Route path="costreport" element={<CostReport />} />
            <Route
              path="materialconsumptionreport"
              element={<MaterialConsumptionReport />}
            />
            <Route path="settlementreport" element={<SettlementReport />} />
            <Route
              path="contractsettlementreport"
              element={<ContractSettlementReport />}
            />
            <Route
              path="productionphasereport"
              element={<ProductionPhaseReport />}
            />
            <Route
              path="quarterlycontractsettlementreport"
              element={<Quarterlycontractsettlement />}
            />
          </Route>

          {/* Nhóm 2: Các route trang quản trị thông thường (Nên bọc trong index hoặc path rõ ràng) */}
          <Route path="">
            <Route index element={<Dashboard />} /> {/* Thay cho path="/" */}
            <Route
              path="settlementReportSummary"
              element={<SettlementReportSummary />}
            />
            <Route
              path="ratedadjustmentfactor"
              element={<Ratedadjustmentfactor />}
            />
            <Route path="parameter" element={<Parameter />} />
            <Route
              path="adjustmentfactorfornorms"
              element={<Adjustmentfactorfornorms />}
            />
            <Route path="unit" element={<Unit />} />
            <Route path="department" element={<Department />} />
            <Route path="phasegroup" element={<PhaseGroup />} />
            <Route path="phase" element={<Phase />} />
            <Route path="assignmentcode" element={<AssignmentCode />} />
            <Route path="materialassignment" element={<MaterialAssignment />} />
            <Route path="excavationtech" element={<ExcavationTech />} />
            <Route path="crosssections" element={<CrossSection />} />
            <Route path="hardness" element={<Hardness />} />
            <Route path="curbslopes" element={<CurbSlope />} />
            <Route path="thickness" element={<Thickness />} />
            <Route path="length" element={<Length />} />
            <Route path="miningtechs" element={<MiningTech />} />
            <Route path="materialunitprice" element={<Materialunitprice />} />
            <Route path="steps" element={<Step />} />
            <Route path="assignmentnorm" element={<AssignmentNorm />} />
            {/* <Route path="cuttingnorms" element={<CuttingNorm />} /> */}
            <Route path="coalcuttingnorms" element={<CoalCuttingNorm />} />
            <Route path="rockratio" element={<RockRatio />} />
            <Route path="mirrorratio" element={<MirrorRatio />} />
            <Route path="adjustmentnormk_kt" element={<AdjustmentNormKKT />} />
            <Route path="adjustmentnormk_dl" element={<AdjustmentNormKDL />} />
            <Route path="adjustmentnorm_cm" element={<AdjustmentNormCM />} />
            <Route path="productionscope" element={<ProductScope />} />
            <Route path="devicecode" element={<DeviceCode />} />
            <Route path="materialbudget" element={<MaterialBudget />} />
            <Route path="materialcostused" element={<MaterialCostUsed />} />
            <Route path="settlementreports" element={<Setttlementreport />} />
            <Route
              path="initialplannedcosts"
              element={<InitialPlannedCosts />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
