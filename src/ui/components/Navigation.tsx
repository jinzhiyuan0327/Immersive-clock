import { Check, ChevronRight, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { classNames } from "../utils/classNames";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { Popover } from "./Popover";
import styles from "./primitives.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={classNames(styles.breadcrumb, className)} aria-label="面包屑">
      {items.map((item, index) => {
        const isLast = index === items.length - 1 || item.current;

        return (
          <span className={styles.breadcrumbItem} key={`${item.label}-${index}`}>
            {item.href && !isLast ? <a href={item.href}>{item.label}</a> : <span aria-current={isLast ? "page" : undefined}>{item.label}</span>}
            {!isLast && <ChevronRight size={13} aria-hidden="true" />}
          </span>
        );
      })}
    </nav>
  );
}

export interface SideNavItem {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
  disabled?: boolean;
}

export interface SideNavProps {
  items: SideNavItem[];
  value: string;
  label: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SideNav({ items, value, label, onChange, className }: SideNavProps) {
  return (
    <nav className={classNames(styles.sideNav, className)} aria-label={label}>
      {items.map((item) => (
        <button
          className={classNames(styles.sideNavItem, value === item.value && styles.sideNavItemActive)}
          disabled={item.disabled}
          key={item.value}
          type="button"
          aria-current={value === item.value ? "page" : undefined}
          onClick={() => onChange(item.value)}
        >
          {item.icon && <span className={styles.sideNavIcon}>{item.icon}</span>}
          <span>{item.label}</span>
          {item.badge && <Badge variant="neutral">{item.badge}</Badge>}
        </button>
      ))}
    </nav>
  );
}

export interface TopBarProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, leading, actions, className }: TopBarProps) {
  return (
    <header className={classNames(styles.topBar, className)}>
      {leading && <div className={styles.topBarLeading}>{leading}</div>}
      <div className={styles.topBarTitle}>
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {actions && <div className={styles.topBarActions}>{actions}</div>}
    </header>
  );
}

export type MenuNode =
  | { type: "item"; value: string; label: string; icon?: ReactNode; shortcut?: ReactNode; disabled?: boolean; selected?: boolean }
  | { type: "divider" }
  | { type: "group"; label: string; items: MenuNode[] };

export interface ContextMenuProps {
  items: MenuNode[];
  children: ReactNode;
  onSelect?: (value: string) => void;
}

export function ContextMenu({ items, children, onSelect }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return undefined;

    const close = () => setIsOpen(false);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div
      className={styles.contextMenuRoot}
      onContextMenu={(event) => {
        event.preventDefault();
        setPosition({ x: event.clientX, y: event.clientY });
        setIsOpen(true);
      }}
    >
      {children}
      {isOpen && (
        <div
          className={styles.contextMenuPanel}
          role="menu"
          style={{
            left: Math.min(position.x, window.innerWidth - 260),
            top: Math.min(position.y, window.innerHeight - 320),
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MenuNodes items={items} onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}

export interface RichMenuProps {
  label: string;
  items: MenuNode[];
  onSelect?: (value: string) => void;
}

export function RichMenu({ label, items, onSelect }: RichMenuProps) {
  return (
    <Popover
      ariaLabel={label}
      trigger={
        <>
          <span>{label}</span>
          <MoreHorizontal size={15} aria-hidden="true" />
        </>
      }
      width={280}
    >
      <div className={styles.richMenu} role="menu">
        <MenuNodes items={items} onSelect={onSelect} />
      </div>
    </Popover>
  );
}

function MenuNodes({ items, onSelect }: { items: MenuNode[]; onSelect?: (value: string) => void }) {
  return (
    <>
      {items.map((item, index) => {
        if (item.type === "divider") {
          return <div className={styles.menuDivider} role="separator" key={`divider-${index}`} />;
        }

        if (item.type === "group") {
          return (
            <div className={styles.menuGroup} key={item.label}>
              <span className={styles.menuGroupLabel}>{item.label}</span>
              <MenuNodes items={item.items} onSelect={onSelect} />
            </div>
          );
        }

        return (
          <button
            className={styles.richMenuItem}
            disabled={item.disabled}
            key={item.value}
            role="menuitem"
            type="button"
            onClick={() => onSelect?.(item.value)}
          >
            {item.icon && <span className={styles.menuItemIcon}>{item.icon}</span>}
            <span className={styles.richMenuLabel}>{item.label}</span>
            {item.shortcut && <span className={styles.menuShortcut}>{item.shortcut}</span>}
            {item.selected && <Check size={14} aria-hidden="true" />}
          </button>
        );
      })}
    </>
  );
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav className={classNames(styles.pagination, className)} aria-label="分页">
      <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        上一页
      </Button>
      <div className={styles.paginationPages}>
        {pages.map((item) => (
          <button
            className={classNames(styles.paginationPage, item === page && styles.paginationPageActive)}
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <Button size="sm" variant="ghost" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        下一页
      </Button>
    </nav>
  );
}
