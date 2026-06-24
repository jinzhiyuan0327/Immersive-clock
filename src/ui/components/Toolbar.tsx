import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "../utils/classNames";

import styles from "./primitives.module.css";

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: "start" | "center" | "end" | "between";
}

export interface FloatingActionBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  position?: "bottom-left" | "bottom-center" | "bottom-right";
}

const alignClassMap: Record<NonNullable<ToolbarProps["align"]>, string> = {
  start: styles.toolbarStart,
  center: styles.toolbarCenter,
  end: styles.toolbarEnd,
  between: styles.toolbarBetween,
};

const positionClassMap: Record<NonNullable<FloatingActionBarProps["position"]>, string> = {
  "bottom-left": styles.floatingActionBarLeft,
  "bottom-center": styles.floatingActionBarCenter,
  "bottom-right": styles.floatingActionBarRight,
};

export function Toolbar({ children, align = "start", className, ...props }: ToolbarProps) {
  return (
    <div
      className={classNames(styles.toolbar, alignClassMap[align], className)}
      role="toolbar"
      {...props}
    >
      {children}
    </div>
  );
}

export function FloatingActionBar({
  children,
  position = "bottom-left",
  className,
  ...props
}: FloatingActionBarProps) {
  return (
    <div className={classNames(styles.floatingActionBarWrap, positionClassMap[position])}>
      <div className={classNames(styles.floatingActionBar, className)} role="toolbar" {...props}>
        {children}
      </div>
    </div>
  );
}
