import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Login from './pages/Auth/Login';
import api from './config/api.config';
import { userAtom } from './atoms/userAtoms';
import { useAtom } from 'jotai'
import MainLayout from './components/layout/Mainlayout';
import Dashboard from './pages/Dashboard/Dashboard';
import AssignmentCode from './pages/AssignmentCode/AssignmentCode';

import Unit from './pages/Unit/Unit';
import MaterialAssignment from './pages/MaterialAssignment/MaterialAssignment';
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


interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const [user] = useAtom(userAtom);
  // if (!token) {
  //   return <Navigate to="/login" />;
  // }
  return <MainLayout>{children}</MainLayout>;
};

const App = () => {
  const token = localStorage.getItem('token');
  const [user, setUser] = useAtom(userAtom)

  // const { data, isLoading } = useQuery({
  //   queryKey: ['user', token],
  //   queryFn: () => api.get(`/auth/me`).then(res => res.data.data.user),
  //   enabled: !!token,
  // })

  // useEffect(() => {
  //   if (data) {
  //     setUser(data)
  //   }
  // }, [data])

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
          path="/coalcuttingnorm_zry"
          element={
            <PrivateRoute>
              <CoalCuttingNormZRY />
            </PrivateRoute>
          }
        />
        <Route
          path="/coalcuttingnorm_zh"
          element={
            <PrivateRoute>
              <CoalCuttingNormZH />
            </PrivateRoute>
          }
        />
        <Route
          path="/coalcuttingnorm_kb"
          element={
            <PrivateRoute>
              <CoalCuttingNormKB/>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App; 