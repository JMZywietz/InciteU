import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { C, F, GLOBAL_CSS } from './theme.js';
import { PATHS } from './lib/routes.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import BioPage from './pages/BioPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import WhereToStartPage from './pages/WhereToStartPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ThinkPage from './pages/ThinkPage.jsx';
import IdentityBoxPage from './tools/IdentityBox.jsx';
import ThreeMomentsPage from './tools/ThreeMoments.jsx';
import ReadinessPage from './tools/Readiness.jsx';
import VisionPage from './tools/Vision.jsx';
import LCPPage from './tools/LCP.jsx';
import LeadershipCapacitiesAnalysisPage from './tools/LeadershipCapacitiesAnalysis.jsx';
import PreMortemPage from './tools/PreMortem.jsx';
import CreativeCollisionPage from './tools/CreativeCollision.jsx';
import ChallengeMapperPage from './tools/ChallengeMapper.jsx';
import FiveLivesPage from './tools/FiveLives.jsx';
import SmallestViableExperimentPage from './tools/SmallestViableExperiment.jsx';
import PurposeSmallMovesPage from './tools/PurposeSmallMoves.jsx';
import EmotionsAsInformationPage from './tools/EmotionsAsInformation.jsx';
import FacilitateYourWayPage from './tools/FacilitateYourWay.jsx';
import ManyMirrorsPage from './tools/ManyMirrors.jsx';
import FiveLayersDeepPage from './think/FiveLayersDeep.jsx';
import CynefinPage from './think/CynefinScrollytelling.jsx';

// The Culture Change Model is a 250KB+ self-contained sub-app — lazy-loaded
// so it doesn't bloat the initial bundle for visitors who never open it.
const CultureChangeModelPage = lazy(() => import('./apps/CultureChangeModel.jsx'));

// =================================================================
// ROOT APP
// =================================================================
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
          <Route path={PATHS.quiz} element={<QuizPage />} />
          <Route path={PATHS.identityBox} element={<IdentityBoxPage />} />
          <Route path={PATHS.threeMoments} element={<ThreeMomentsPage />} />
          <Route path={PATHS.lcp} element={<LCPPage />} />
          <Route path={PATHS.leadershipCapacities} element={<LeadershipCapacitiesAnalysisPage />} />
          {/* Backward-compat redirect: old route -> new */}
          <Route path="/tools/self/leadership-stance" element={<Navigate to={PATHS.leadershipCapacities} replace />} />
          <Route path={PATHS.fiveLives} element={<FiveLivesPage />} />
          <Route path={PATHS.smallestViableExperiment} element={<SmallestViableExperimentPage />} />
          <Route path={PATHS.purposeSmallMoves} element={<PurposeSmallMovesPage />} />
          <Route path={PATHS.emotionsAsInformation} element={<EmotionsAsInformationPage />} />
          <Route path={PATHS.readiness} element={<ReadinessPage />} />
          <Route path={PATHS.vision} element={<VisionPage />} />
          <Route path={PATHS.preMortem} element={<PreMortemPage />} />
          <Route path={PATHS.creativeCollision} element={<CreativeCollisionPage />} />
          <Route path={PATHS.challengeMapper} element={<ChallengeMapperPage />} />
          <Route path={PATHS.facilitateYourWay} element={<FacilitateYourWayPage />} />
          <Route path={PATHS.manyMirrors} element={<ManyMirrorsPage />} />
          <Route path={PATHS.think} element={<ThinkPage />} />
          <Route path={PATHS.fiveLayersDeep} element={<FiveLayersDeepPage />} />
          <Route path={PATHS.cynefin} element={<CynefinPage />} />
          <Route
            path={PATHS.cultureChangeModel}
            element={
              <Suspense
                fallback={
                  <div style={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.creamMuted,
                    fontFamily: F.sans,
                    fontSize: 14,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    Loading…
                  </div>
                }
              >
                <CultureChangeModelPage />
              </Suspense>
            }
          />
          {/* Fallback: any unknown path -> home */}
          <Route path="*" element={<Navigate to={PATHS.home} replace />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
}
