import React, { useEffect, useState } from 'react';
import type { ExamItem } from '../types';
import { getAppSettings, updateExamSettings } from '../utils/appSettings';

function genId() { return `exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function toLocal(iso: string) { return iso ? iso.slice(0, 16) : ''; }
function toIso(local: string) { return local ? `${local}:00` : ''; }
const EMPTY = { name: '', startTime: '', endTime: '', enabled: true };

export default function ExamSettings() {
  const [items, setItems] = useState<ExamItem[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getAppSettings();
    setItems((s.exam?.items ?? []).slice().sort((a, b) => a.order - b.order));
    setAlertEnabled(s.exam?.alertEnabled !== false);
  }, []);

  function saveItems(next: ExamItem[]) { setItems(next); updateExamSettings({ items: next }); }
  function validate() {
    if (!form.name.trim()) return '请填写考试名称';
    if (!form.startTime) return '请填写开始时间';
    if (!form.endTime) return '请填写结束时间';
    if (new Date(toIso(form.endTime)) <= new Date(toIso(form.startTime))) return '结束时间必须晚于开始时间';
    return '';
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); const err = validate(); if (err) { setError(err); return; } setError('');
    if (editId) {
      saveItems(items.map(it => it.id === editId ? { ...it, name: form.name.trim(), startTime: toIso(form.startTime), endTime: toIso(form.endTime), enabled: form.enabled } : it));
      setEditId(null);
    } else {
      saveItems([...items, { id: genId(), name: form.name.trim(), startTime: toIso(form.startTime), endTime: toIso(form.endTime), enabled: form.enabled, order: items.length }]);
    }
    setForm({ ...EMPTY });
  }
  function startEdit(item: ExamItem) { setEditId(item.id); setForm({ name: item.name, startTime: toLocal(item.startTime), endTime: toLocal(item.endTime), enabled: item.enabled }); setError(''); }
  function fmtDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }

  return (
    <div className="exam-settings">
      <h3 className="exam-settings__title">考试管理</h3>
      <label className="exam-settings__switch">
        <input type="checkbox" checked={alertEnabled} onChange={e => { setAlertEnabled(e.target.checked); updateExamSettings({ alertEnabled: e.target.checked }); }} />
        <span>结束前 15 分钟预警提示</span>
      </label>
      <form className="exam-settings__form" onSubmit={handleSubmit}>
        <h4>{editId ? '编辑考试' : '添加考试'}</h4>
        {error && <p className="exam-settings__error">{error}</p>}
        <label>考试名称<input type="text" value={form.name} maxLength={40} placeholder="如：2026年高考语文" onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label>开始时间<input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></label>
        <label>结束时间<input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></label>
        <label className="exam-settings__switch">
          <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
          <span>启用（在大屏展示）</span>
        </label>
        <div className="exam-settings__actions">
          <button type="submit" className="btn btn--primary">{editId ? '保存修改' : '添加考试'}</button>
          {editId && <button type="button" className="btn" onClick={() => { setEditId(null); setForm({ ...EMPTY }); setError(''); }}>取消</button>}
        </div>
      </form>
      <div className="exam-settings__list">
        {items.length === 0 && <p className="exam-settings__empty">暂无考试，请在上方添加</p>}
        {items.map(item => (
          <div key={item.id} className={`exam-settings__item${item.enabled?'':' exam-settings__item--disabled'}`}>
            <div className="exam-settings__item-info">
              <strong>{item.name}</strong>
              <span>{fmtDate(new Date(item.startTime))} → {fmtDate(new Date(item.endTime))}</span>
              <span className={`exam-tag${item.enabled?' exam-tag--on':''}`}>{item.enabled ? '启用' : '已停用'}</span>
            </div>
            <div className="exam-settings__item-btns">
              <button onClick={() => saveItems(items.map(it => it.id === item.id ? { ...it, enabled: !it.enabled } : it))}>{item.enabled ? '停用' : '启用'}</button>
              <button onClick={() => startEdit(item)}>编辑</button>
              <button className="btn--danger" onClick={() => saveItems(items.filter(it => it.id !== item.id))}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}