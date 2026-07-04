import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import styles from "./App.module.css";
import AnnouncementModal from "./components/AnnouncementModal";
import { Confetti } from "./components/Confetti/Confetti";
import { ClockPage } from "./pages/ClockPage/ClockPage";
import { shouldShowAnnouncement } from "./utils/announcementStorage";
import { hasSeenTour } from "./utils/tour";
import ExamPage from './pages/ExamPage';
import WelcomePage from './pages/WelcomePage';
import AdminPage from './pages/AdminPage';
import './styles/exam.css';
import './styles/welcome.css';
import './styles/admin.css';
import { getAppSettings, updateAppSettings } from "./utils/appSettings";
import { useAppDispatch } from "./contexts/AppContext";   // ← 新增
import type { AppMode } from "./types";

/**
 * 主应用组件
 * 设置路由并渲染主要的时钟页面
 * 包含首次访问时的进入动画和公告弹窗
 */
export function App() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();   // ← 新增
  const [showEnterAnimation, setShowEnterAnimation] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showTourConfetti, setShowTourConfetti] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => !getAppSettings().hasVisited);

  /**
   * 设置进入动画和公告弹窗
   * 在欢迎页关闭后触发
   */
  useEffect(() => {
    if (showWelcome) return; // 欢迎页期间不启动动画/公告
    setShowEnterAnimation(true);

    const timer = setTimeout(() => {
      setShowEnterAnimation(false);
    }, 1000);

    const checkAnnouncement = () => {
      if (getAppSettings().exam?.announcementPermanentlyHidden) return;

      if (shouldShowAnnouncement()) {
        if (!hasSeenTour()) {
          const onTourEnd = () => {
            setShowAnnouncement(true);
            window.removeEventListener("tour:end", onTourEnd);
          };
          window.addEventListener("tour:end", onTourEnd);
          return;
        }

        setTimeout(() => {
          setShowAnnouncement(true);
        }, 1200);
      }
    };

    checkAnnouncement();

    const onTourStart = () => {
      setShowAnnouncement(false);
    };
    window.addEventListener("tour:start", onTourStart);

    const onTourCompleted = () => {
      setShowTourConfetti(true);
      setTimeout(() => {
        setShowTourConfetti(false);
      }, 2600);
    };
    window.addEventListener("tour:completed", onTourCompleted);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("tour:start", onTourStart);
      window.removeEventListener("tour:completed", onTourCompleted);
    };
  }, [showWelcome]);

  /**
   * 欢迎页选择模式：
   * - exam → 跳独立考试页
   * - 其它 → 先把主界面的 mode 设置好，再进主界面（修复选自习却显示时钟的问题）
   */
  function handleWelcomeSelect(mode: AppMode) {
    updateAppSettings({ hasVisited: true });
    setShowWelcome(false);
    if (mode === 'exam') {
      navigate('/exam');
    } else {
      dispatch({ type: 'SET_MODE', payload: mode });   // ← 关键修复
      navigate('/');
    }
  }

  if (showWelcome) {
    return <WelcomePage onSelectMode={handleWelcomeSelect} />;
  }
  return (
    <div className={`${styles.app} ${showEnterAnimation ? styles.enterAnimation : ""}`}>
      <Routes>
        <Route path="/" element={<ClockPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="*" element={<ClockPage />} />
      </Routes>

      {showTourConfetti && <Confetti />}

      <AnnouncementModal
        isOpen={showAnnouncement}
        onClose={() => setShowAnnouncement(false)}
        initialTab="announcement"
      />
      
      <Analytics />
    </div>
  );
}