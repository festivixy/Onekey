import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import Layout from './components/Layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore } from './store/authStore';
import { auth } from './lib/firebase';
import Home from './pages/Home';
import About from './pages/About';
import Timeline from './pages/Timeline';
import MeetOurTeam from './pages/MeetOurTeam';
import AdminDashboard from './pages/AdminDashboard';
import VanstringHome from './pages/VanstringHome';
import Fundraisers from './pages/Fundraisers';
import VancouverAquarium from './pages/VancouverAquarium';
import VTC from './pages/VTC';
import NotFound from './pages/NotFound';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/"          element={<Home />} />
          <Route path="/about"     element={<About />} />
          <Route path="/timeline"  element={<Timeline />} />
          <Route path="/team"      element={<MeetOurTeam />} />
          <Route path="/fundraisers" element={<Fundraisers />} />
          <Route path="/fundraisers/vancouver-aquarium" element={<VancouverAquarium />} />
          <Route path="/vtc"        element={<VTC />} />
          <Route path="/vanstring"  element={<VanstringHome />} />
          <Route path="/admin"     element={<AdminDashboard />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const getCurrentUser = useAuthStore(state => state.getCurrentUser);
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        getCurrentUser();
      } else {
        logout();
      }
    });
    return () => unsubscribe();
  }, [getCurrentUser, logout]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/*" element={
          <Layout>
            <AnimatedRoutes />
          </Layout>
        } />
      </Routes>
    </>
  );
}

export default App;
