import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Login from './pages/Auth/Login';
import api from './config/api.config';
import { userAtom } from './atoms/userAtoms';
import { useAtom } from 'jotai'
import MainLayout from './layout/Mainlayout';
import Dashboard from './pages/Dashboard/Dashboard';
import AssignmentCode from './pages/AssignmentCode/AssignmentCode';

import Unit from './pages/Unit/Unit';
import MaterialAssignment from './pages/MaterialAssignment/MaterialAssignment';
import MaterialAssignmentOutPlan from './pages/MaterialAssignmentOutPlan/MaterialAssignmentOutPlan';
import PhaseGroup from './pages/PhaseGroup/PhaseGroup';
import Phase from './pages/Phase/Phase';
import ExcavationTech from './pages/ExcavationTech/ExcavationTech';
import Hardness from './pages/Hardness/Hardness';
import CrossSection from './pages/CrossSection/CrossSection';
import CurbSlope from './pages/CurbSlope/CurbSlope';
import Thickness from './pages/Thickness/Thickness';
import Length from './pages/Length/Length';
import MiningTech from './pages/MiningTech/MiningTech';
import Materialunitprice from './pages/MaterialUnitPrice/Materialunitprice';
import Step from './pages/Step/Step';
import ExcavationNorm from './pages/ExcavationNorm/ExcavationNorm';
import CuttingNorm from './pages/CuttingNorm/CuttingNorm';
import CoalCuttingNormZRY from './pages/CoalCuttingNormZRY/CoalCuttingNormZRY';
import CoalCuttingNormZH from './pages/CoalCuttingNormZH/CoalCuttingNormZH';
import CoalCuttingNormKB from './pages/CoalCuttingNormKB/CoalCuttingNormKB';
import RockRatio from './pages/RockRatio/RockRatio';
import MirrorRatio from './pages/MirrorRatio/MirrorRatio';
import AdjustmentNormKKT from './pages/AdjustmentNormKKT/AdjustmentNormKKT';
import AdjustmentNormKDL from './pages/AdjustmentNormKDL/AdjustmentNormKDL';
import AdjustmentNormCM from './pages/AdjustmentNormCM/AdjustmentNormCM';
import ProductScope from './pages/ProductionScope/ProductionScope';
import DeviceCode from './pages/DeviceCode/DeviceCode';
import MaterialBudget from './pages/MaterialBudget/MaterialBudget';
import MaterialCostUsed from './pages/MaterialCostUsed/MaterialCostUsed';
import Setttlementreport from './pages/SettlementReport/SettlementReport';
import Ratedadjustmentfactor from './pages/Ratedadjustmentfactor/Ratedadjustmentfactor';
import Adjustmentfactorfornorms from './pages/Adjustmentfactorfornorms/Adjustmentfactorfornorms';
import Parameter from './pages/Parameter/Parameter';
import CoalCuttingNorm from './pages/CoalCuttingNorm/CoalCuttingNorm';
// import Quarterlycontractsettlement from './pages/Quarterlycontractsettlement/Quarterlycontractsettlement';
import SettlementReportSummary from './pages/SettlementReportSummary/SettlementReportSummary';
import InitialPlannedCosts from './pages/InitialPlannedCosts/InitialPlannedCosts';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token");
  const [user] = useAtom(userAtom);
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <MainLayout>{children}</MainLayout>;
};

const App = () => {
  const token = localStorage.getItem("token");
  const [user, setUser] = useAtom(userAtom);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/settlementReportSummary"
          element={
            <PrivateRoute>
              <SettlementReportSummary />
            </PrivateRoute>
          }
        />
        <Route
          path="/ratedadjustmentfactor"
          element={
            <PrivateRoute>
              <Ratedadjustmentfactor />
            </PrivateRoute>
          }
        />
        <Route
          path="/parameter"
          element={
            <PrivateRoute>
              <Parameter />
            </PrivateRoute>
          }
        />
        <Route
          path="/adjustmentfactorfornorms"
          element={
            <PrivateRoute>
              <Adjustmentfactorfornorms />
            </PrivateRoute>
          }
        />
        <Route
          path="/unit"
          element={
            <PrivateRoute>
              <Unit />
            </PrivateRoute>
          }
        />
        <Route
          path="/phasegroup"
          element={
            <PrivateRoute>
              <PhaseGroup />
            </PrivateRoute>
          }
        />
        <Route
          path="/phase"
          element={
            <PrivateRoute>
              <Phase />
            </PrivateRoute>
          }
        />
        <Route
          path="/assignmentcode"
          element={
            <PrivateRoute>
              <AssignmentCode />
            </PrivateRoute>
          }
        />
        <Route
          path="/materialassignment"
          element={
            <PrivateRoute>
              <MaterialAssignment />
            </PrivateRoute>
          }
        />
        <Route
          path="/materialassignmentoutplan"
          element={
            <PrivateRoute>
              <MaterialAssignmentOutPlan />
            </PrivateRoute>
          }
        />
        <Route
          path="/excavationtech"
          element={
            <PrivateRoute>
              <ExcavationTech />
            </PrivateRoute>
          }
        />
        <Route
          path="/crosssections"
          element={
            <PrivateRoute>
              <CrossSection />
            </PrivateRoute>
          }
        />
        <Route
          path="/hardness"
          element={
            <PrivateRoute>
              <Hardness />
            </PrivateRoute>
          }
        />
        <Route
          path="/curbslopes"
          element={
            <PrivateRoute>
              <CurbSlope />
            </PrivateRoute>
          }
        />
        <Route
          path="/thickness"
          element={
            <PrivateRoute>
              <Thickness />
            </PrivateRoute>
          }
        />
        <Route
          path="/length"
          element={
            <PrivateRoute>
              <Length />
            </PrivateRoute>
          }
        />
        <Route
          path="/miningtechs"
          element={
            <PrivateRoute>
              <MiningTech />
            </PrivateRoute>
          }
        />
        <Route
          path="/materialunitprice"
          element={
            <PrivateRoute>
              <Materialunitprice />
            </PrivateRoute>
          }
        />
        <Route
          path="/steps"
          element={
            <PrivateRoute>
              <Step />
            </PrivateRoute>
          }
        />
        <Route
          path="/excavationnorms"
          element={
            <PrivateRoute>
              <ExcavationNorm />
            </PrivateRoute>
          }
        />
        <Route
          path="/cuttingnorms"
          element={
            <PrivateRoute>
              <CuttingNorm />
            </PrivateRoute>
          }
        />
        <Route
          path="/coalcuttingnorms"
          element={
            <PrivateRoute>
              <CoalCuttingNorm />
            </PrivateRoute>
          }
        />
        <Route
          path="/rockratio"
          element={
            <PrivateRoute>
              <RockRatio />
            </PrivateRoute>
          }
        />
        <Route
          path="/mirrorratio"
          element={
            <PrivateRoute>
              <MirrorRatio />
            </PrivateRoute>
          }
        />
        <Route
          path="/adjustmentnormk_kt"
          element={
            <PrivateRoute>
              <AdjustmentNormKKT />
            </PrivateRoute>
          }
        />
        <Route
          path="/adjustmentnormk_dl"
          element={
            <PrivateRoute>
              <AdjustmentNormKDL />
            </PrivateRoute>
          }
        />
        <Route
          path="/adjustmentnorm_cm"
          element={
            <PrivateRoute>
              <AdjustmentNormCM />
            </PrivateRoute>
          }
        />
        <Route
          path="/productionscope"
          element={
            <PrivateRoute>
              <ProductScope />
            </PrivateRoute>
          }
        />
        <Route
          path="/devicecode"
          element={
            <PrivateRoute>
              <DeviceCode />
            </PrivateRoute>
          }
        />
        <Route
          path="/materialbudget"
          element={
            <PrivateRoute>
              <MaterialBudget />
            </PrivateRoute>
          }
        />
        <Route
          path="/materialcostused"
          element={
            <PrivateRoute>
              <MaterialCostUsed />
            </PrivateRoute>
          }
        />
        <Route
          path="/settlementreports"
          element={
            <PrivateRoute>
              <Setttlementreport />
            </PrivateRoute>
          }
        />
        <Route
          path="/initialplannedcosts"
          element={
            <PrivateRoute>
              <InitialPlannedCosts />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
