import {
  Bell,
  Cloud,
  Gauge,
  Home,
  Info,
  LayoutGrid,
  MessageSquareText,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useAppDispatch, useAppState } from "../../contexts/AppContext";
import { Button, Modal } from "../../ui";
import { logger } from "../../utils/logger";
import { broadcastSettingsEvent, SETTINGS_EVENTS } from "../../utils/settingsEvents";

import AboutSettingsPanel from "./sections/AboutSettingsPanel";
import BasicSettingsPanel from "./sections/BasicSettingsPanel";
import ContentSettingsPanel from "./sections/ContentSettingsPanel";
import StudySettingsPanel from "./sections/StudySettingsPanel";
import WeatherSettingsPanel from "./sections/WeatherSettingsPanel";
import styles from "./SettingsPanel.module.css";

type SettingsCategory = "basic" | "weather" | "monitor" | "quotes" | "about";
type TopSection = "controls" | "feedback" | "layout" | "preview";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const topSections: Array<{
  value: TopSection;
  label: string;
  icon: React.ReactNode;
  defaultCategory: SettingsCategory;
}> = [
  {
    value: "controls",
    label: "控件",
    icon: <SlidersHorizontal size={18} aria-hidden="true" />,
    defaultCategory: "basic",
  },
  {
    value: "feedback",
    label: "反馈",
    icon: <Bell size={18} aria-hidden="true" />,
    defaultCategory: "weather",
  },
  {
    value: "layout",
    label: "布局",
    icon: <Palette size={18} aria-hidden="true" />,
    defaultCategory: "quotes",
  },
  {
    value: "preview",
    label: "页面预览",
    icon: <LayoutGrid size={18} aria-hidden="true" />,
    defaultCategory: "about",
  },
];

const categoryItems: Array<{
  value: SettingsCategory;
  label: string;
  icon: React.ReactNode;
  section: TopSection;
}> = [
  {
    value: "basic",
    label: "基础设置",
    icon: <Home size={20} aria-hidden="true" />,
    section: "controls",
  },
  {
    value: "weather",
    label: "天气设置",
    icon: <Cloud size={20} aria-hidden="true" />,
    section: "feedback",
  },
  {
    value: "monitor",
    label: "监测设置",
    icon: <Gauge size={20} aria-hidden="true" />,
    section: "feedback",
  },
  {
    value: "quotes",
    label: "语录设置",
    icon: <MessageSquareText size={20} aria-hidden="true" />,
    section: "layout",
  },
  {
    value: "about",
    label: "关于",
    icon: <Info size={20} aria-hidden="true" />,
    section: "preview",
  },
];

function getSectionForCategory(category: SettingsCategory): TopSection {
  return categoryItems.find((item) => item.value === category)?.section ?? "controls";
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { study } = useAppState();
  const dispatch = useAppDispatch();

  const [activeSection, setActiveSection] = useState<TopSection>("controls");
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("basic");
  const [targetYear, setTargetYear] = useState(study.targetYear);

  const basicSaveRef = useRef<() => void>(() => {});
  const weatherSaveRef = useRef<() => void>(() => {});
  const monitorSaveRef = useRef<() => void>(() => {});
  const quotesSaveRef = useRef<() => void>(() => {});
  const aboutSaveRef = useRef<() => void>(() => {});
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    try {
      broadcastSettingsEvent(SETTINGS_EVENTS.SettingsPanelClosed);
    } finally {
      onClose();
    }
  }, [onClose]);

  const handleSaveAll = useCallback(() => {
    dispatch({ type: "SET_TARGET_YEAR", payload: targetYear });

    try {
      basicSaveRef.current?.();
      weatherSaveRef.current?.();
      monitorSaveRef.current?.();
      quotesSaveRef.current?.();
      aboutSaveRef.current?.();
    } catch (error) {
      logger.error("保存分区设置失败:", error);
      alert("保存设置时出现错误，请重试");
      return;
    }

    broadcastSettingsEvent(SETTINGS_EVENTS.SettingsSaved, { targetYear });
    handleClose();
  }, [targetYear, dispatch, handleClose]);

  useEffect(() => {
    if (isOpen) {
      setTargetYear(study.targetYear);
      setActiveSection("controls");
      setActiveCategory("basic");
    }
  }, [isOpen, study.targetYear]);

  useEffect(() => {
    if (!isOpen) return;
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeCategory, isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="设置"
      fullScreen
      hideHeader
      className={styles.settingsModal}
    >
      <div id="settings-panel-container" className={styles.settingsApp}>
        <header className={styles.topNav}>
          <nav className={styles.topNavList} aria-label="设置主分组">
            {topSections.map((section) => {
              const active = section.value === activeSection;
              return (
                <button
                  key={section.value}
                  className={active ? styles.topNavItemActive : styles.topNavItem}
                  type="button"
                  aria-label={section.label}
                  aria-current={active ? "page" : undefined}
                  title={section.label}
                  onClick={() => {
                    setActiveSection(section.value);
                    setActiveCategory(section.defaultCategory);
                  }}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </header>

        <div className={styles.settingsWorkspace}>
          <aside className={styles.sideNav} aria-label="设置分区">
            {categoryItems.map((item) => {
              const active = item.value === activeCategory;
              return (
                <button
                  key={item.value}
                  className={active ? styles.sideNavItemActive : styles.sideNavItem}
                  type="button"
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  onClick={() => {
                    setActiveCategory(item.value);
                    setActiveSection(getSectionForCategory(item.value));
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </aside>

          <main className={styles.contentPane}>
            <div className={styles.contentHeader}>
              <h2>设置</h2>
            </div>

            <div ref={contentRef} className={styles.contentBody}>
              {activeCategory === "basic" && (
                <BasicSettingsPanel
                  targetYear={targetYear}
                  onTargetYearChange={setTargetYear}
                  onRegisterSave={(fn) => {
                    basicSaveRef.current = fn;
                  }}
                />
              )}

              {activeCategory === "weather" && (
                <WeatherSettingsPanel
                  onRegisterSave={(fn) => {
                    weatherSaveRef.current = fn;
                  }}
                />
              )}

              {activeCategory === "monitor" && (
                <StudySettingsPanel
                  onRegisterSave={(fn) => {
                    monitorSaveRef.current = fn;
                  }}
                />
              )}

              {activeCategory === "quotes" && (
                <ContentSettingsPanel
                  onRegisterSave={(fn) => {
                    quotesSaveRef.current = fn;
                  }}
                />
              )}

              {activeCategory === "about" && (
                <AboutSettingsPanel
                  onRegisterSave={(fn) => {
                    aboutSaveRef.current = fn;
                  }}
                />
              )}
            </div>

            <footer className={styles.actionBar}>
              <Button id="settings-close-btn" variant="secondary" onClick={handleClose}>
                取消
              </Button>
              <Button id="settings-save-btn" variant="primary" onClick={handleSaveAll}>
                保存
              </Button>
            </footer>
          </main>
        </div>
      </div>
    </Modal>
  );
}
