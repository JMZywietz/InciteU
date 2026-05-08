import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { C, F, GLOBAL_CSS } from './theme.js';
import { PATHS } from './lib/routes.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import BioPage from './pages/BioPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import WhereToStartPage from './pages/WhereToStartPage.jsx';
import ThinkPage from './pages/ThinkPage.jsx';
import ThreeMomentsPage from './tools/ThreeMoments.jsx';
import ReadinessPage from './tools/Readiness.jsx';
import VisionPage from './tools/Vision.jsx';
import LCPPage from './tools/LCP.jsx';
import LeadershipStancePage from './tools/LeadershipStanceAssessment.jsx';
import PreMortemPage from './tools/PreMortem.jsx';
import ChallengeMapperPage from './tools/ChallengeMapper.jsx';
import FiveLayersDeepPage from './think/FiveLayersDeep.jsx';
import CynefinPage from './think/CynefinScrollytelling.jsx';

// ===========================================================================
// ROOT APP
// ===========================================================================
export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        background: C.bgDeep,
        color: C.cream,
        minHeight: '100vh',
        fontFamily: F.sans,
        fontWeight: 300,
        fontSize: 16,
        lineHeight: 1.6,
      }}>
        <Header />
        <Routes>
          <Route path={PATHS.home} element={<HomePage />} />
          <Route path={PATHS.bio} element={<BioPage />} />
          <Route path={PATHS.contact} element={<ContactPage />} />
          <Route path={PATHS.whereToStart} element={<WhereToStartPage />} />
          <Route path={PATHS.threeMoments} element={<ThreeMomentsPage />} />
          <Route path={PATHS.lcp} element={<LCPPage />} />
          <Route path={PATHS.leadershipStance} element={<LeadershipStancePage />} />
          <Route path={PATHS.readiness} element={<ReadinessPage />} />
          <Route path={PATHS.vision} element={<VisionPage />} />
          <Route path={PATHS.preMortem} element={<PreMortemPage />} />
          <Route path={PATHS.challengeMapper} element={<ChallengeMapperPage />} />
          <Route path={PATHS.think} element={<ThinkPage />} />
          <Route path={PATHS.fiveLayersDeep} element={<FiveLayersDeepPage />} />
          <Route path={PATHS.cynefin} element={<CynefinPage />} />
          {/* Fallback: any unknown path -> home */}
          <Route path="*" element={<Navigate to={PATHS.home} replace />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
}
