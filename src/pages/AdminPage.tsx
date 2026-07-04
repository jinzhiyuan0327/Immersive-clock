import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExamItem } from '../types';
import { getAppSettings, updateExamSettings } from '../utils/appSettings';
import { buildPresetExams } from '../data/presetExams';
import { saveExamsToServer, fetchExamsFromServer } from '../services/examService';
import { nowMs, parseZonedTime, formatDateTimeInZone } from '../utils/timeSource';

function genId() { return `exam_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }
function toIso(local: string) { return local.length === 16 ? `${local}:00` : local; }
function toLocal(iso: string) { return iso.slice(0, 16); }
function formatDisplay(iso: string) {
  if (!iso) return '—';
  return formatDateTimeInZone(parseZonedTime(iso));
}
function getDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(ms) || ms <= 0) return '—';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function getStatus(item: ExamItem): { label: string; color: string } {
  const now = nowMs(), s = parseZonedTime(item.startTime), e = parseZonedTime(item.endTime);
  if (!item.enabled) return { label: '已停用', color: '#6c757d' };
  if (now > e) return { label: '已结束', color: '#6c757d' };
  if (now >= s) return { label: '进行中', color: '#27ae60' };
  const diff = s - now, diffMin = Math.round(diff / 60000);
  if (diffMin <= 60) return { label: `${diffMin}分钟后`, color: '#e74c3c' };
  const diffH = Math.round(diff / 3600000);
  if (diffH < 24) return { label: `${diffH}小时后`, color: '#f39c12' };
  return { label: `${Math.round(diff / 86400000)}天后`, color: '#3498db' };
}

const EMPTY_FORM = { name: '', startTime: '', endTime: '', enabled: true };

export default function AdminPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ExamItem[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'local_only'>('idle');
  const examTitleRef = useRef('');
  const itemsRef = useRef<ExamItem[]>([]);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState('');

  // 同步 itemsRef，供保存/标题推送时读取最新列表
  useEffect(() => { itemsRef.current = items; }, [items]);

  // 初始化：优先从服务端拉取，服务端为空则用本地/预设回填服务端
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = getAppSettings();
      let exams = (settings.exam?.items ?? []).slice().sort((a, b) => a.order - b.order);
      let title = settings.exam?.title ?? '';
      const localUpdatedAt = settings.exam?.updatedAt ?? 0;

      const remote = await fetchExamsFromServer();
      if (!cancelled && remote) {
        if (remote.updatedAt === 0 && (remote.items?.length ?? 0) === 0) {
          // 服务端空库：用本地（或预设）数据初始化服务端
          if (exams.length === 0) exams = buildPresetExams();
          const ts = await saveExamsToServer(exams, title);
          updateExamSettings({ items: exams, title, updatedAt: ts ?? Date.now() });
        } else if (remote.updatedAt > localUpdatedAt) {
          // 服务端较新：覆盖本地
          exams = (remote.items ?? []).slice().sort((a, b) => a.order - b.order);
          title = remote.title ?? '';
          updateExamSettings({ items: exams, title, updatedAt: remote.updatedAt });
        }
      } else if (exams.length === 0) {
        // 无网络且本地为空：用预设
        exams = buildPresetExams();
        updateExamSettings({ items: exams });
      }

      if (cancelled) return;
      setItems(exams);
      setExamTitle(title);
      examTitleRef.current = title;
      itemsRef.current = exams;
    })();
    return () => { cancelled = true; };
  }, []);

  const saveItems = useCallback(async (next: ExamItem[]) => {
    const reordered = next.map((it, i) => ({ ...it, order: i }));
    const ts = Date.now();
    setItems(reordered);
    itemsRef.current = reordered;
    updateExamSettings({ items: reordered, updatedAt: ts });
    setSaveStatus('saving');
    const serverTs = await saveExamsToServer(reordered, examTitleRef.current);
    if (serverTs != null) {
      updateExamSettings({ updatedAt: serverTs });
      setSaveStatus('saved');
    } else {
      setSaveStatus('local_only');
    }
    setTimeout(() => setSaveStatus('idle'), 2500);
  }, []);

  /** 保存总考试名称（实时写入本地设置） */
  const handleTitleChange = useCallback((value: string) => {
    setExamTitle(value);
    examTitleRef.current = value;
    const ts = Date.now();
    updateExamSettings({ title: value, updatedAt: ts });
    setSaveStatus('saving');
    // 标题频繁输入，防抖 800ms 后再推送服务端
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      const serverTs = await saveExamsToServer(itemsRef.current, value);
      if (serverTs != null) {
        updateExamSettings({ updatedAt: serverTs });
        setSaveStatus('saved');
      } else {
        setSaveStatus('local_only');
      }
      setTimeout(() => setSaveStatus('idle'), 2500);
    }, 800);
  }, []);

  function validate() {
    if (!form.name.trim()) return '请填写科目名称';
    if (!form.startTime) return '请填写开始时间';
    if (!form.endTime) return '请填写结束时间';
    if (new Date(toIso(form.endTime)) <= new Date(toIso(form.startTime))) return '结束时间必须晚于开始时间';
    return '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(); if (err) { setError(err); return; } setError('');
    if (editId) {
      saveItems(items.map(it => it.id === editId
        ? { ...it, name: form.name.trim(), startTime: toIso(form.startTime), endTime: toIso(form.endTime), enabled: form.enabled }
        : it));
      setEditId(null);
    } else {
      saveItems([...items, { id: genId(), name: form.name.trim(), startTime: toIso(form.startTime), endTime: toIso(form.endTime), enabled: form.enabled, order: items.length }]);
    }
    setForm({ ...EMPTY_FORM });
  }

  function startEdit(item: ExamItem) {
    setEditId(item.id); setError('');
    setForm({ name: item.name, startTime: toLocal(item.startTime), endTime: toLocal(item.endTime), enabled: item.enabled });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function cancelEdit() { setEditId(null); setForm({ ...EMPTY_FORM }); setError(''); }
  function moveItem(id: string, dir: -1 | 1) {
    const idx = items.findIndex(it => it.id === id), next = [...items], target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]]; saveItems(next);
  }
  function handleImport() {
    try {
      const parsed = JSON.parse(importText);
      const arr: ExamItem[] = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(arr)) throw new Error('需要数组');
      saveItems(arr.map((it, i) => ({ id: it.id ?? genId(), name: String(it.name ?? ''), startTime: String(it.startTime ?? ''), endTime: String(it.endTime ?? ''), enabled: it.enabled !== false, order: i })));
      setShowImport(false); setImportText(''); setImportError('');
    } catch (e) { setImportError(`解析失败：${String(e)}`); }
  }
  function handleExport() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }));
    a.download = `exams_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header__left">
          <button className="admin-back-btn" onClick={() => navigate('/exam')}>← 返回</button>
          <h1 className="admin-header__title">考试管理</h1>
        </div>
        <div className="admin-header__right">
          {saveStatus === 'saving' && <span className="admin-saved-badge" style={ { color: '#f39c12' } }>⟳ 保存中…</span>}
          {saveStatus === 'saved' && <span className="admin-saved-badge" style={ { color: '#27ae60' } }>✓ 已同步云端</span>}
          {saveStatus === 'local_only' && <span className="admin-saved-badge" style={ { color: '#e74c3c' } }>⚠ 仅本地（网络异常）</span>}
          <span className="admin-stat">{items.filter(i => i.enabled).length}/{items.length} 场启用</span>
          <button className="admin-btn admin-btn--ghost" onClick={() => setShowImport(v => !v)}>导入 JSON</button>
          <button className="admin-btn admin-btn--ghost" onClick={handleExport}>导出 JSON</button>
          {items.length > 0 && <button className="admin-btn admin-btn--danger" onClick={() => { if (window.confirm('确定清空所有分考试？')) saveItems([]); }}>清空全部</button>}
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-sidebar">
          <div className="admin-title-card">
            <label className="admin-label">总考试名称
              <input className="admin-input" type="text" placeholder="如：2026年高考" maxLength={30}
                value={examTitle} onChange={e => handleTitleChange(e.target.value)} />
            </label>
            <p className="admin-title-card__hint">显示在考试大屏与欢迎页顶部，下方各科目为其分考试</p>
          </div>
          <div className="admin-form-card">
            <h2 className="admin-form-card__title">{editId ? '✏️ 编辑分考试' : '➕ 添加分考试'}</h2>
            {error && <div className="admin-error">{error}</div>}
            <form onSubmit={handleSubmit} className="admin-form">
              <label className="admin-label">科目名称
                <input className="admin-input" type="text" placeholder="如：语文" maxLength={50}
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <span className="admin-input-hint">{form.name.length}/50</span>
              </label>
              <label className="admin-label">开始时间
                <input className="admin-input" type="datetime-local" value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })} />
              </label>
              <label className="admin-label">结束时间
                <input className="admin-input" type="datetime-local" value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })} />
              </label>
              {form.startTime && form.endTime && (
                <div className="admin-duration-hint">考试时长：{getDuration(toIso(form.startTime), toIso(form.endTime))}</div>
              )}
              <label className="admin-toggle-label">
                <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
                <span>启用（在大屏展示）</span>
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn--primary">{editId ? '保存修改' : '添加分考试'}</button>
                {editId && <button type="button" className="admin-btn" onClick={cancelEdit}>取消</button>}
              </div>
            </form>
          </div>
          <div className="admin-tips">
            <h3 className="admin-tips__title">使用说明</h3>
            <ul>
              <li>修改会<strong>实时保存</strong>到浏览器本地</li>
              <li>停用的分考试不在大屏和欢迎页显示</li>
              <li>↑↓ 按钮调整显示顺序</li>
              <li>可导出 JSON 备份，跨设备导入</li>
            </ul>
          </div>
        </aside>
        <main className="admin-main">
          <div className="admin-list-header">
            <h2 className="admin-list-title">分考试列表</h2>
            <span className="admin-list-count">{items.length} 条记录</span>
          </div>
          {items.length === 0 ? (
            <div className="admin-empty"><div className="admin-empty__icon">📋</div><p>暂无分考试，请在左侧添加</p></div>
          ) : (
            <div className="admin-list">
              {items.map((item, idx) => {
                const status = getStatus(item), isEditing = editId === item.id;
                return (
                  <div key={item.id} className={`admin-item${!item.enabled?' admin-item--disabled':''}${isEditing?' admin-item--editing':''}` }>
                    <div className="admin-item__order">
                      <span className="admin-item__order-num">{idx + 1}</span>
                      <div className="admin-item__order-btns">
                        <button className="admin-order-btn" disabled={idx === 0} onClick={() => moveItem(item.id, -1)}>↑</button>
                        <button className="admin-order-btn" disabled={idx === items.length - 1} onClick={() => moveItem(item.id, 1)}>↓</button>
                      </div>
                    </div>
                    <div className="admin-item__info">
                      <div className="admin-item__name-row">
                        <span className="admin-item__name">{item.name}</span>
                        <span className="admin-item__status" style={{ background: `${status.color}22`, color: status.color }}>{status.label}</span>
                      </div>
                      <div className="admin-item__times">
                        <span>🕐 {formatDisplay(item.startTime)}</span>
                        <span className="admin-item__times-sep">→</span>
                        <span>{formatDisplay(item.endTime)}</span>
                        <span className="admin-item__duration">共 {getDuration(item.startTime, item.endTime)}</span>
                      </div>
                    </div>
                    <div className="admin-item__actions">
                      <button className={`admin-item-btn admin-item-btn--toggle${item.enabled?'':' admin-item-btn--off'}`}
                        onClick={() => saveItems(items.map(it => it.id === item.id ? { ...it, enabled: !it.enabled } : it))}>
                        {item.enabled ? '停用' : '启用'}
                      </button>
                      <button className={`admin-item-btn admin-item-btn--edit${isEditing?' active':''}`}
                        onClick={() => isEditing ? cancelEdit() : startEdit(item)}>
                        {isEditing ? '取消编辑' : '编辑'}
                      </button>
                      <button className="admin-item-btn admin-item-btn--delete" onClick={() => setDeleteConfirm(item.id)}>删除</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">确认删除</h3>
            <p className="admin-modal__body">确定要删除「<strong>{items.find(i => i.id === deleteConfirm)?.name}</strong>」吗？此操作无法撤销。</p>
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--danger" onClick={() => { saveItems(items.filter(it => it.id !== deleteConfirm)); if (editId === deleteConfirm) cancelEdit(); setDeleteConfirm(null); }}>确认删除</button>
              <button className="admin-btn" onClick={() => setDeleteConfirm(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
      {showImport && (
        <div className="admin-modal-overlay" onClick={() => setShowImport(false)}>
          <div className="admin-modal admin-modal--wide" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">导入 JSON</h3>
            <p className="admin-modal__body">粘贴考试数据 JSON，将<strong>覆盖</strong>当前所有数据。</p>
            {importError && <div className="admin-error">{importError}</div>}
            <textarea className="admin-textarea" rows={10} value={importText} onChange={e => setImportText(e.target.value)}
              placeholder={'[\n  { "name": "语文", "startTime": "2026-06-07T09:00:00", "endTime": "2026-06-07T11:30:00", "enabled": true }\n]'} />
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--primary" onClick={handleImport}>导入并覆盖</button>
              <button className="admin-btn" onClick={() => { setShowImport(false); setImportError(''); }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}