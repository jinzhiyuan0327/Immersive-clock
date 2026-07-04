import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAppState, useAppDispatch } from "../../contexts/AppContext";
import { AppMode } from "../../types";
import { ClockIcon, CountdownIcon, WatchIcon, StudyIcon } from "../Icons";
import { LightButton } from "../LightControls/LightControls";

import styles from "./ModeSelector.module.css";

/**
 * 考试入口图标（内联 SVG，避免依赖 Icons 里可能不存在的导出）
 * 使用 currentColor，会自动跟随按钮的激活/悬停颜色
 */
function ExamIcon({
  className,
  size = 20,
  ...props
}: { className?: string; size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 13.5l2 2 4-4" />
    </svg>
  );
}

/**
 * 模式选择器组件
 * 提供时钟、倒计时、秒表、自习四种模式切换，并在末尾提供“考试”入口（跳转独立页面）
 */
export function ModeSelector() {
  const { mode } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  /**
   * 处理模式切换
   * @param newMode 新模式
   */
  const handleModeChange = useCallback(
    (newMode: AppMode) => {
      if (newMode !== mode) {
        dispatch({ type: "SET_MODE", payload: newMode });
      }
    },
    [mode, dispatch]
  );

  /**
   * 处理“考试”入口点击：不切换 mode，直接跳转到独立考试页面
   */
  const handleExamClick = useCallback(() => {
    navigate("/exam");
  }, [navigate]);

  const modes = [
    { key: "clock" as AppMode, label: "时钟", icon: ClockIcon, description: "显示当前时间" },
    { key: "countdown" as AppMode, label: "倒计时", icon: CountdownIcon, description: "设置倒计时" },
    { key: "stopwatch" as AppMode, label: "秒表", icon: WatchIcon, description: "秒表功能" },
    { key: "study" as AppMode, label: "自习", icon: StudyIcon, description: "自习模式" },
  ];

  return (
    <div
      className={styles.modeSelector}
      role="tablist"
      aria-label="选择时钟模式"
      id="tour-mode-selector"
    >
      {modes.map(({ key, label, icon: Icon, description }) => (
        <LightButton
          key={key}
          id={key === "study" ? "mode-tab-study" : undefined}
          className={`${styles.modeButton} ${mode === key ? styles.active : ""}`}
          onClick={() => handleModeChange(key)}
          role="tab"
          aria-selected={mode === key}
          aria-controls={`${key}-panel`}
          aria-label={`${label} - ${description}`}
          title={description}
          active={mode === key}
        >
          <Icon className={styles.icon} size={20} aria-hidden={true} />
          <span className={styles.label}>{label}</span>
        </LightButton>
      ))}

      {/* 考试入口：位于“自习”右侧，点击跳转独立考试页面（/exam），不参与 mode 切换 */}
      <LightButton
        id="mode-tab-exam"
        className={styles.modeButton}
        onClick={handleExamClick}
        role="tab"
        aria-selected={false}
        aria-label="考试 - 进入考试大屏"
        title="进入考试大屏"
        active={false}
      >
        <ExamIcon className={styles.icon} size={20} aria-hidden={true} />
        <span className={styles.label}>考试</span>
      </LightButton>
    </div>
  );
}