'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const TABS = [
  { id: 'notices', label: '📢 공지사항' },
  { id: 'feedback', label: '💬 건의사항' },
  { id: 'matching', label: '⚖️ 매칭 관리' },
  { id: 'meals', label: '🍱 식단 관리' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('notices');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin-auth', { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 h-14 flex items-center justify-between shadow-md">
        <h1 className="font-black">🔧 관리자 페이지</h1>
        <button onClick={handleLogout} className="text-[12px] bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full font-bold">로그아웃</button>
      </header>

      <nav className="flex bg-white border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-[13px] font-black whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-2xl mx-auto p-4">
        {tab === 'notices' && <NoticesTab />}
        {tab === 'feedback' && <FeedbackTab />}
        {tab === 'matching' && <MatchingTab />}
        {tab === 'meals' && <MealsTab />}
      </main>
    </div>
  );
}

// ────────────────────────────────────────────
// 📢 공지사항 관리
// ────────────────────────────────────────────
function NoticesTab() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (data) setNotices(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 입력해 주세요.');
    const { error } = await supabase.from('notices').insert([{ title: title.trim(), content: content.trim(), is_pinned: isPinned }]);
    if (error) return alert('등록 실패: ' + error.message);
    setTitle(''); setContent(''); setIsPinned(false);
    load();
  };

  const togglePin = async (n) => {
    await supabase.from('notices').update({ is_pinned: !n.is_pinned }).eq('id', n.id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('이 공지사항을 삭제할까요?')) return;
    await supabase.from('notices').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
        <h2 className="font-black text-slate-700 text-sm mb-1">새 공지 작성</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" rows={4} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
        <label className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          메인 화면 상단 고정 배너로 노출
        </label>
        <button onClick={handleCreate} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg text-sm">등록</button>
      </div>

      {loading ? <p className="text-center text-slate-400 text-sm">불러오는 중...</p> : (
        <div className="space-y-2">
          {notices.map(n => (
            <div key={n.id} className={`p-3.5 rounded-xl border ${n.is_pinned ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-start gap-2">
                <p className="font-black text-[14px] text-slate-800">{n.is_pinned && '📌 '}{n.title}</p>
                <span className="text-[11px] text-slate-400 shrink-0">{new Date(n.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <p className="text-[13px] text-slate-600 whitespace-pre-line mt-1">{n.content}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => togglePin(n)} className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{n.is_pinned ? '고정 해제' : '고정하기'}</button>
                <button onClick={() => handleDelete(n.id)} className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">삭제</button>
              </div>
            </div>
          ))}
          {notices.length === 0 && <p className="text-center text-slate-400 text-sm py-6">등록된 공지사항이 없습니다.</p>}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// 💬 건의사항 조회
// ────────────────────────────────────────────
function FeedbackTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    if (error) console.error(error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('이 건의사항을 삭제할까요?')) return;
    await supabase.from('feedback').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-2">
      {loading && <p className="text-center text-slate-400 text-sm">불러오는 중...</p>}
      {!loading && items.length === 0 && <p className="text-center text-slate-400 text-sm py-6">등록된 건의사항이 없습니다.</p>}
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-xl p-3.5 border border-slate-200">
          <p className="text-[13px] text-slate-700 whitespace-pre-line">{item.message}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] text-slate-400 font-mono">{item.user_id}</span>
            <div className="flex items-center gap-2">
              {item.created_at && <span className="text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString('ko-KR')}</span>}
              <button onClick={() => handleDelete(item.id)} className="text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">삭제</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────
// ⚖️ 매칭 분쟁 / 경고 관리
// ────────────────────────────────────────────
function MatchingTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase.from('profiles').select('*').ilike('name', `%${query.trim()}%`);
    setResults(data || []);
    setLoading(false);
  };

  const adjustWarning = async (p, delta) => {
    const newCount = Math.max(0, (p.warning_count || 0) + delta);
    await supabase.from('profiles').update({ warning_count: newCount }).eq('id', p.id);
    setResults(prev => prev.map(r => r.id === p.id ? { ...r, warning_count: newCount } : r));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="이름으로 검색"
          className="flex-1 p-2.5 rounded-lg border border-slate-200 text-sm"
        />
        <button onClick={handleSearch} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg text-sm">검색</button>
      </div>

      {loading && <p className="text-center text-slate-400 text-sm">검색 중...</p>}
      {!loading && searched && results.length === 0 && <p className="text-center text-slate-400 text-sm py-6">일치하는 사용자가 없습니다.</p>}

      <div className="space-y-2">
        {results.map(p => (
          <div key={p.id} className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-black text-[14px] text-slate-800">{p.name} <span className="text-slate-400 font-bold text-[12px]">({p.company} / {p.department} / {p.position})</span></p>
                <p className="text-[12px] text-slate-500 mt-0.5">발신 {p.sent_count || 0}회 · 수신 {p.received_count || 0}회 · 연속성공 {p.success_send_streak || 0}회</p>
              </div>
              <span className={`text-[12px] font-black px-2.5 py-1 rounded-full shrink-0 ${(p.warning_count || 0) >= 2 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>경고 {p.warning_count || 0}회</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => adjustWarning(p, -1)} className="flex-1 py-2 bg-blue-50 text-blue-700 font-bold text-[12px] rounded-lg border border-blue-200">경고 1회 차감</button>
              <button onClick={() => adjustWarning(p, +1)} className="flex-1 py-2 bg-amber-50 text-amber-700 font-bold text-[12px] rounded-lg border border-amber-200">경고 1회 부여</button>
              <button onClick={() => { if (confirm('경고를 0으로 초기화할까요?')) adjustWarning(p, -(p.warning_count || 0)); }} className="flex-1 py-2 bg-slate-50 text-slate-600 font-bold text-[12px] rounded-lg border border-slate-200">경고 초기화</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// 🍱 식단 관리
// ────────────────────────────────────────────
function MealsTab() {
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; })();

  const [date, setDate] = useState(todayStr);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('meals').select('*').eq('meal_date', date).order('meal_type', { ascending: true });
    setMeals(data || []);
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (m) => { setEditingId(m.id); setEditText(m.menu_text || ''); };

  const saveEdit = async (m) => {
    await supabase.from('meals').update({ menu_text: editText }).eq('id', m.id);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('이 식단 항목을 삭제할까요?')) return;
    await supabase.from('meals').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2.5 rounded-lg border border-slate-200 text-sm" />
        <button onClick={load} className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-[12px]">새로고침</button>
      </div>

      {loading && <p className="text-center text-slate-400 text-sm">불러오는 중...</p>}
      {!loading && meals.length === 0 && <p className="text-center text-slate-400 text-sm py-6">해당 날짜에 등록된 식단이 없습니다.</p>}

      <div className="space-y-2">
        {meals.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-3.5 border border-slate-200">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[12px] font-black text-indigo-700">{m.meal_type} · {m.restaurant} · {m.menu_category}</span>
              <div className="flex gap-2">
                {editingId === m.id ? (
                  <>
                    <button onClick={() => saveEdit(m)} className="text-[11px] font-bold px-2 py-1 rounded-full bg-indigo-600 text-white">저장</button>
                    <button onClick={() => setEditingId(null)} className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">취소</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(m)} className="text-[11px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-600">수정</button>
                    <button onClick={() => handleDelete(m.id)} className="text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">삭제</button>
                  </>
                )}
              </div>
            </div>
            {editingId === m.id ? (
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="w-full p-2 rounded-lg border border-indigo-200 text-[13px]" />
            ) : (
              <p className="text-[13px] text-slate-700 whitespace-pre-line">{m.menu_text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
