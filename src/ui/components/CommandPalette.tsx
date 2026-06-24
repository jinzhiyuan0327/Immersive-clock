import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./primitives.module.css";

export interface CommandItem {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  keywords?: string[];
}

export interface CommandPaletteProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  items: CommandItem[];
  onClose: () => void;
  onSelect?: (value: string) => void;
}

export function CommandPalette({
  isOpen,
  title,
  placeholder = "搜索命令",
  items,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return items;

    return items.filter((item) =>
      [item.label, item.description, ...(item.keywords ?? [])]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [items, query]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.commandBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.commandPanel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.commandHeader}>
          <strong>{title}</strong>
          <button className={styles.commandClose} type="button" aria-label="关闭" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <label className={styles.commandSearch}>
          <Search size={16} aria-hidden="true" />
          <input
            autoFocus
            value={query}
            placeholder={placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={styles.commandList} role="listbox">
          {filteredItems.length === 0 && <div className={styles.commandEmpty}>没有匹配的命令</div>}
          {filteredItems.map((item) => (
            <button
              className={styles.commandItem}
              key={item.value}
              role="option"
              type="button"
              aria-selected="false"
              onClick={() => {
                onSelect?.(item.value);
                onClose();
              }}
            >
              {item.icon && <span className={styles.commandItemIcon}>{item.icon}</span>}
              <span>
                <strong>{item.label}</strong>
                {item.description && <small>{item.description}</small>}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  );
}
