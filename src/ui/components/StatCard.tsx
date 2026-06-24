import type { ReactNode } from "react";

import { Card } from "./Card";
import styles from "./primitives.module.css";

export interface StatCardProps {
  title: string;
  value: string;
  meta?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function StatCard({ title, value, meta, icon, children }: StatCardProps) {
  return (
    <Card className={styles.statCard}>
      <div className={styles.statHeader}>
        <span className={styles.statTitle}>{title}</span>
        {icon}
      </div>
      <strong className={styles.statValue}>{value}</strong>
      {meta && <span className={styles.statMeta}>{meta}</span>}
      {children}
    </Card>
  );
}
