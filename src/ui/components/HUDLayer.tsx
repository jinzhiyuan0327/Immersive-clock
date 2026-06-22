import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface HUDLayerProps extends HTMLAttributes<HTMLDivElement> {
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
  center?: ReactNode;
}

export function HUDLayer({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  center,
  className,
  ...props
}: HUDLayerProps) {
  return (
    <div className={classNames(styles.hudLayer, className)} {...props}>
      {topLeft && <div className={classNames(styles.hudRegion, styles.hudTopLeft)}>{topLeft}</div>}
      {topRight && <div className={classNames(styles.hudRegion, styles.hudTopRight)}>{topRight}</div>}
      {center && <div className={classNames(styles.hudRegion, styles.hudCenter)}>{center}</div>}
      {bottomLeft && (
        <div className={classNames(styles.hudRegion, styles.hudBottomLeft)}>{bottomLeft}</div>
      )}
      {bottomRight && (
        <div className={classNames(styles.hudRegion, styles.hudBottomRight)}>{bottomRight}</div>
      )}
    </div>
  );
}
