import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";

import { useAppState } from "../../contexts/AppContext";
import { useTimer } from "../../hooks/useTimer";
import { CountdownItem } from "../../types";
import { DEFAULT_SCHEDULE, StudyPeriod } from "../../types/studySchedule";
import { getAutoPopupSetting } from "../../utils/noiseReportSettings";
import { readStudyBackground } from "../../utils/studyBackgroundStorage";
import { ensureInjectedFonts } from "../../utils/studyFontStorage";
import { readStudySchedule } from "../../utils/studyScheduleStorage";
import {
	DISPLAY_TIME_ZONE,
	formatClockInZone,
	getZonedParts,
	parseZonedTime,
} from "../../utils/timeSource";
import { getAdjustedDate } from "../../utils/timeSync";
import { MotivationalQuote } from "../MotivationalQuote";
import NoiseHistoryModal from "../NoiseHistoryModal/NoiseHistoryModal";
import NoiseMonitor from "../NoiseMonitor";
import NoiseReportModal, { NoiseReportPeriod } from "../NoiseReportModal/NoiseReportModal";
import StudyStatus from "../StudyStatus";

import styles from "./Study.module.css";

// 颜色工具：#rrggbb/#rgb 转 rgba(r,g,b,a)
function hexToRgba(hex: string, alpha: number = 1): string {
	if (!hex) return hex;
	const h = hex.trim();
	const clampA = Math.max(0, Math.min(1, alpha));
	const short = /^#([A-Fa-f0-9]{3})$/;
	const long = /^#([A-Fa-f0-9]{6})$/;

	if (short.test(h)) {
		const m = h.match(short)!;
		const r = parseInt(m[1][0] + m[1][0], 16);
		const g = parseInt(m[1][1] + m[1][1], 16);
		const b = parseInt(m[1][2] + m[1][2], 16);
		return `rgba(${r}, ${g}, ${b}, ${clampA})`;
	}

	if (long.test(h)) {
		const m = h.match(long)!;
		const r = parseInt(m[1].slice(0, 2), 16);
		const g = parseInt(m[1].slice(2, 4), 16);
		const b = parseInt(m[1].slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${clampA})`;
	}

	const rgb = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
	const rm = h.match(rgb);
	if (rm) {
		const r = Math.max(0, Math.min(255, parseInt(rm[1], 10)));
		const g = Math.max(0, Math.min(255, parseInt(rm[2], 10)));
		const b = Math.max(0, Math.min(255, parseInt(rm[3], 10)));
		return `rgba(${r}, ${g}, ${b}, ${clampA})`;
	}

	return h;
}

function pad2(n: number): string {
	return String(n).padStart(2, "0");
}

function formatStudyDateInZone(date: Date): string {
	return new Intl.DateTimeFormat("zh-CN", {
		timeZone: DISPLAY_TIME_ZONE,
		year: "numeric",
		month: "long",
		day: "numeric",
		weekday: "long",
	}).format(date);
}

function getChinaDayPrefix(date: Date): string {
	const p = getZonedParts(date.getTime(), DISPLAY_TIME_ZONE);
	return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

function buildChinaDateAtTime(date: Date, timeStr: string): Date {
	const [h, m] = timeStr.split(":").map(Number);
	const dayPrefix = getChinaDayPrefix(date);
	const isoLocal = `${dayPrefix}T${pad2(h)}:${pad2(m)}:00`;
	return new Date(parseZonedTime(isoLocal, DISPLAY_TIME_ZONE));
}

/**
 * 自习组件
 * 显示当前中国标准时间和倒计时轮播
 */
export function Study() {
	const { study } = useAppState();
	const [currentTime, setCurrentTime] = useState<Date>(getAdjustedDate());
	const [reportOpen, setReportOpen] = useState(false);
	const [reportPeriod, setReportPeriod] = useState<NoiseReportPeriod | null>(null);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [reportFromHistory, setReportFromHistory] = useState(false);

	const lastPopupPeriodIdRef = useRef<string | null>(null);
	const dismissedPeriodIdRef = useRef<string | null>(null);

	const [backgroundSettings, setBackgroundSettings] = useState(readStudyBackground());

	const countdownRef = useRef<HTMLDivElement | null>(null);
	const [countdownWidth, setCountdownWidth] = useState<number>(0);
	const [itemHeight, setItemHeight] = useState<number>(0);
	const [activeIndex, setActiveIndex] = useState<number>(0);

	const updateTime = useCallback(() => {
		setCurrentTime(getAdjustedDate());
	}, []);

	useTimer(updateTime, true, 1000);

	useEffect(() => {
		updateTime();
	}, [updateTime]);

	useEffect(() => {
		const handler = () => setBackgroundSettings(readStudyBackground());
		window.addEventListener("study-background-updated", handler as EventListener);
		return () => window.removeEventListener("study-background-updated", handler as EventListener);
	}, []);

	useEffect(() => {
		ensureInjectedFonts().catch(console.error);
		const onFontsUpdated = () => {
			ensureInjectedFonts().catch(console.error);
		};
		window.addEventListener("study-fonts-updated", onFontsUpdated as EventListener);
		return () =>
			window.removeEventListener("study-fonts-updated", onFontsUpdated as EventListener);
	}, []);

	useEffect(() => {
		let schedule: StudyPeriod[] = DEFAULT_SCHEDULE;
		try {
			const data = readStudySchedule();
			if (Array.isArray(data) && data.length > 0) schedule = data;
		} catch {}

		const now = getAdjustedDate();
		const nowParts = getZonedParts(now.getTime(), DISPLAY_TIME_ZONE);
		const nowMin = nowParts.hour * 60 + nowParts.minute;

		const toDate = (timeStr: string) => buildChinaDateAtTime(now, timeStr);

		for (const p of schedule) {
			const start = toDate(p.startTime);
			const end = toDate(p.endTime);

			const startParts = getZonedParts(start.getTime(), DISPLAY_TIME_ZONE);
			const endParts = getZonedParts(end.getTime(), DISPLAY_TIME_ZONE);
			const startMin = startParts.hour * 60 + startParts.minute;
			const endMin = endParts.hour * 60 + endParts.minute;

			if (nowMin >= endMin) {
				if (lastPopupPeriodIdRef.current === p.id) {
					lastPopupPeriodIdRef.current = null;
				}
				if (dismissedPeriodIdRef.current === p.id) {
					dismissedPeriodIdRef.current = null;
				}
			}

			if (nowMin >= startMin && nowMin < endMin && endMin - nowMin <= 1) {
				const autoPopupEnabled = getAutoPopupSetting();
				const alreadyPopped = lastPopupPeriodIdRef.current === p.id;
				const dismissed = dismissedPeriodIdRef.current === p.id;

				if (!alreadyPopped && !dismissed && autoPopupEnabled) {
					setReportPeriod({ id: p.id, name: p.name, start, end });
					setReportOpen(true);
					setReportFromHistory(false);
					lastPopupPeriodIdRef.current = p.id;
				}
				break;
			}
		}
	}, [currentTime, reportOpen]);

	const calcDaysToDate = useCallback((dateStr?: string) => {
		if (!dateStr) return 0;
		const now = getAdjustedDate();
		const targetMs = parseZonedTime(`${dateStr}T00:00:00`, DISPLAY_TIME_ZONE);
		if (!Number.isFinite(targetMs)) return 0;
		const diffTime = targetMs - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	}, []);

	const calcDaysToNextGaokao = useCallback(() => {
		const now = getAdjustedDate();
		const nowParts = getZonedParts(now.getTime(), DISPLAY_TIME_ZONE);
		const year = study.targetYear || nowParts.year;
		const targetMs = parseZonedTime(`${year}-06-07T00:00:00`, DISPLAY_TIME_ZONE);
		const diffTime = targetMs - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	}, [study.targetYear]);

	const timeString = formatClockInZone(currentTime.getTime(), DISPLAY_TIME_ZONE);
	const dateString = formatStudyDateInZone(currentTime);

	const countdownItems: CountdownItem[] = (() => {
		const list = (study.countdownItems || []) as CountdownItem[];

		if (list && list.length > 0) {
			return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		}

		const legacyStudy = study as typeof study & {
			customDate?: string;
			customName?: string;
		};

		const isCustom = (study.countdownType ?? "gaokao") === "custom";
		if (isCustom && legacyStudy.customDate) {
			return [
				{
					id: "legacy-custom",
					kind: "custom",
					name: legacyStudy.customName || "自定义事件",
					targetDate: legacyStudy.customDate,
					order: 0,
					bgColor: undefined,
					textColor: undefined,
				},
			];
		}

		return [
			{
				id: "legacy-gaokao",
				kind: "gaokao",
				name: "高考倒计时",
				order: 0,
				bgColor: undefined,
				textColor: undefined,
			},
		];
	})();

	const display = useMemo(
		() =>
			study.display || {
				showStatusBar: true,
				showNoiseMonitor: true,
				showCountdown: true,
				showQuote: true,
				showTime: true,
				showDate: true,
			},
		[study.display]
	);

	const measureCountdown = useCallback(() => {
		const el = countdownRef.current;
		if (!el) {
			setCountdownWidth(0);
			setItemHeight(0);
			return;
		}

		const trackEl = el.firstElementChild as HTMLDivElement | null;
		const activeItemEl =
			trackEl && trackEl.children.length > 0
				? (trackEl.children[Math.min(activeIndex, trackEl.children.length - 1)] as HTMLElement)
				: null;

		const widthRect = activeItemEl?.getBoundingClientRect() ?? el.getBoundingClientRect();
		const containerRect = el.getBoundingClientRect();
		const nextWidth = Math.round(widthRect.width);
		const nextHeight = Math.round(containerRect.height);

		setCountdownWidth((prev) => (prev === nextWidth ? prev : nextWidth));
		setItemHeight((prev) => (prev === nextHeight ? prev : nextHeight));
	}, [activeIndex]);

	useEffect(() => {
		if (!display.showCountdown) {
			setCountdownWidth(0);
			setItemHeight(0);
			return;
		}

		const measureWithRaf = () => {
			requestAnimationFrame(() => measureCountdown());
		};

		measureWithRaf();

		const el = countdownRef.current;
		const observer = el ? new ResizeObserver(measureWithRaf) : null;
		if (el && observer) {
			observer.observe(el);
		}

		window.addEventListener("resize", measureWithRaf);
		window.addEventListener("orientationchange", measureWithRaf);
		window.addEventListener("study-fonts-updated", measureWithRaf as EventListener);

		return () => {
			observer?.disconnect();
			window.removeEventListener("resize", measureWithRaf);
			window.removeEventListener("orientationchange", measureWithRaf);
			window.removeEventListener("study-fonts-updated", measureWithRaf as EventListener);
		};
	}, [display.showCountdown, measureCountdown, countdownItems.length, activeIndex]);

	useEffect(() => {
		const total = countdownItems.length;
		if (total <= 1) return;

		const intervalSec = Math.max(1, Math.min(60, study.carouselIntervalSec ?? 6));
		const timer = setInterval(() => {
			setActiveIndex((i) => (i + 1) % total);
		}, intervalSec * 1000);

		return () => clearInterval(timer);
	}, [countdownItems.length, study.carouselIntervalSec]);

	const backgroundStyle: React.CSSProperties = (() => {
		const style: React.CSSProperties = {};
		if (backgroundSettings?.type === "image" && backgroundSettings.imageDataUrl) {
			style.backgroundImage = `url(${backgroundSettings.imageDataUrl})`;
			style.backgroundSize = "cover";
			style.backgroundPosition = "center";
			style.backgroundRepeat = "no-repeat";
		} else if (backgroundSettings?.type === "color" && backgroundSettings.color) {
			style.backgroundImage = "none";
			const a =
				typeof backgroundSettings.colorAlpha === "number" ? backgroundSettings.colorAlpha : 1;
			style.backgroundColor = hexToRgba(backgroundSettings.color, a);
		}
		return style;
	})();

	type ContainerStyle = React.CSSProperties & {
		["--font-main"]?: string;
		["--font-ui"]?: string;
	};

	const containerStyle: ContainerStyle = (() => {
		const style: ContainerStyle = { ...(backgroundStyle as React.CSSProperties) };
		if (study.numericFontFamily && study.numericFontFamily.trim().length > 0) {
			style["--font-main"] = study.numericFontFamily;
		}
		if (study.textFontFamily && study.textFontFamily.trim().length > 0) {
			style["--font-ui"] = study.textFontFamily;
		}
		return style;
	})();

	const handleCloseReport = useCallback(() => {
		if (reportPeriod) {
			dismissedPeriodIdRef.current = reportPeriod.id;
		}
		setReportOpen(false);
	}, [reportPeriod]);

	const handleBackToHistory = useCallback(() => {
		if (reportPeriod) {
			dismissedPeriodIdRef.current = reportPeriod.id;
		}
		setReportOpen(false);
		setHistoryOpen(true);
		setReportFromHistory(false);
	}, [reportPeriod]);

	const handleCloseHistory = useCallback(() => {
		setHistoryOpen(false);
	}, []);

	const handleOpenHistory = useCallback(() => {
		setHistoryOpen(true);
	}, []);

	const handleViewHistoryDetail = useCallback((period: NoiseReportPeriod) => {
		setHistoryOpen(false);
		setReportPeriod(period);
		setReportOpen(true);
		setReportFromHistory(true);
	}, []);

	const renderItem = (item: (typeof countdownItems)[number]) => {
		const days = item.kind === "gaokao" ? calcDaysToNextGaokao() : calcDaysToDate(item.targetDate);

		let nameText: string;
		if (item.kind === "gaokao") {
			const rawName = (item.name || "").trim();
			const m = rawName.match(/\b(19|20)\d{2}\b/);
			const year =
				m ? parseInt(m[0], 10) : study.targetYear || getZonedParts(currentTime.getTime(), DISPLAY_TIME_ZONE).year;
			nameText = `${year}高考`;
		} else {
			nameText = item.name && item.name.trim().length > 0 ? item.name.trim() : "自定义事件";
		}

		const textCol = item.textColor
			? hexToRgba(item.textColor, typeof item.textOpacity === "number" ? item.textOpacity : 1)
			: undefined;
		const bgCol = item.bgColor
			? hexToRgba(item.bgColor, typeof item.bgOpacity === "number" ? item.bgOpacity : 0)
			: undefined;
		const digitBaseColor = item.digitColor ?? study.digitColor;
		const digitAlpha =
			typeof item.digitOpacity === "number"
				? item.digitOpacity
				: typeof study.digitOpacity === "number"
				? study.digitOpacity
				: 1;
		const digitCol = digitBaseColor ? hexToRgba(digitBaseColor, digitAlpha) : undefined;

		return (
			<div
				key={item.id}
				className={styles.carouselItem}
				style={{
					color: textCol,
					backgroundColor: bgCol,
					width: countdownWidth > 0 ? `${countdownWidth}px` : undefined,
				}}
			>
				距离{nameText}仅{" "}
				<span className={styles.days} style={{ color: digitCol }}>
					{days}
				</span>{" "}
				天
			</div>
		);
	};

	return (
		<div className={styles.container} style={containerStyle}>
			{(display.showStatusBar || display.showNoiseMonitor) && (
				<div className={styles.topLeft}>
					{display.showStatusBar && <StudyStatus />}
					{display.showNoiseMonitor && (
						<NoiseMonitor
							onBreathingLightClick={handleOpenHistory}
							onStatusClick={handleOpenHistory}
						/>
					)}
				</div>
			)}

			{(display.showCountdown || display.showQuote) && (
				<div className={styles.topRight}>
					{display.showCountdown && (
						<div className={styles.countdownCarousel} ref={countdownRef} aria-live="polite">
							<div
								className={styles.carouselTrack}
								style={{ transform: `translateY(-${activeIndex * (itemHeight || 0)}px)` }}
							>
								{countdownItems.map(renderItem)}
							</div>
						</div>
					)}

					{display.showQuote && (
						<div
							className={styles.quoteSection}
							style={{ width: countdownWidth > 0 ? `${countdownWidth}px` : undefined }}
						>
							<MotivationalQuote />
						</div>
					)}
				</div>
			)}

			<div className={styles.centerTime}>
				<div className={styles.currentTime}>{timeString}</div>
				{display.showDate && <div className={styles.currentDate}>{dateString}</div>}
			</div>

			{reportOpen && reportPeriod && (
				<NoiseReportModal
					isOpen={reportOpen}
					onClose={handleCloseReport}
					onBack={reportFromHistory ? handleBackToHistory : undefined}
					period={reportPeriod}
				/>
			)}

			{historyOpen && (
				<NoiseHistoryModal
					isOpen={historyOpen}
					onClose={handleCloseHistory}
					onViewDetail={handleViewHistoryDetail}
				/>
			)}
		</div>
	);
}