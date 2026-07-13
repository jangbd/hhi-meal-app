'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dict } from '../i18n';
import { supabase } from '../../lib/supabaseClient';

export default function Notice() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState('ko');

  useEffect(() => {
    setLang(localStorage.getItem('my_language') || 'ko');

    async function fetchNotices() {
      const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (data) setNotices(data);
      setLoading(false);
    }
    fetchNotices();
  }, []);

  const t = dict[lang] || dict.ko;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-indigo-950 text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href = '/'} className="text-xl p-2">←</button>
        <h1 className="text-[16px] font-black">{t.menu_notice || '📢 공지사항'}</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl">☰</button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full p-6">
            <nav className="space-y-3">
              <Link href="/" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_meal}</Link>
              <Link href="/bus" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_bus}</Link>
              <Link href="/points" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_points}</Link>
              <Link href="/game" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_game || '⚔️ 강화의 신'}</Link>
              <Link href="/notice" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">{t.menu_notice || '📢 공지사항'}</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_settings}</Link>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 space-y-3 pb-24">
        {loading && <p className="text-center text-slate-400 text-sm py-10">{t.loading || '불러오는 중...'}</p>}
        {!loading && notices.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10">{t.notice_empty || '등록된 공지사항이 없습니다.'}</p>
        )}
        {notices.map(n => (
          <div key={n.id} className={`p-4 rounded-2xl border shadow-sm ${n.is_pinned ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-black text-[15px] text-indigo-950 break-keep">{n.is_pinned && '📌 '}{n.title}</h3>
              <span className="text-[11px] text-slate-400 font-bold shrink-0 mt-0.5">{formatDate(n.created_at)}</span>
            </div>
            <p className="text-[13px] text-slate-600 whitespace-pre-line leading-relaxed break-keep">{n.content}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
