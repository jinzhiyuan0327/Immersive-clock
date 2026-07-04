import React, { useState, useCallback } from "react";

import { useTimer } from "../../hooks/useTimer";
import { DISPLAY_TIME_ZONE, formatClockInZone } from "../../utils/timeSource";
import { getAdjustedDate } from "../../utils/timeSync";

import styles from "./Clock.module.css";

function formatDateInZone(date: Date): string {
	return new Intl.DateTimeFormat("zh-CN", {
		timeZone: DISPLAY_TIME_ZONE,
		year: "numeric",
		month: "long",
		day: "numeric",
		weekday: "long",
	}).format(date);
}

/**
 * 时钟组件
 * 显示当前校时后的中国标准时间，每秒更新一次
 */
export function Clock() {
	const [currentTime, setCurrentTime] = useState<Date>(getAdjustedDate());

	const updateTime = useCallback(() => {
		setCurrentTime(getAdjustedDate());
	}, []);

	useTimer(updateTime, true, 1000);

	const timeString = formatClockInZone(currentTime.getTime(), DISPLAY_TIME_ZONE);
	const dateString = formatDateInZone(currentTime);

	return (
		<div className={styles.clock}>
			<div className={styles.time} aria-live="polite" aria-label={`当前时间：${timeString}`}>
				{timeString}
			</div>
			<div className={styles.date} aria-label={`当前日期：${dateString}`}>
				{dateString}
			</div>
		</div>
	);
}