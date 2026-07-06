'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dict } from '../i18n';
import { supabase } from '../../lib/supabaseClient';

export default function Settings() {
  const [selectedRestaurant, setSelectedRestaurant] = useState('현장(현대그린푸드)');
  const [selectedLang, setSelectedLang] = useState('ko');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setSelectedRestaurant(localStorage.getItem('my_restaurant') || '현장(현대그린푸드)');
    setSelectedLang(localStorage.getItem('my_language') || 'ko');
  }, []);

  const t = dict[selectedLang] || dict.ko;
  const isKo = selectedLang === 'ko';

  const handleSave = () => {
    localStorage.setItem('my_restaurant', selectedRestaurant);
    localStorage.setItem('my_language', selectedLang);
    alert(t.save_success || (isKo ? '설정이 저장되었습니다!' : 'Settings saved successfully!'));
    window.location.href = '/';
  };

  const sendFeedback = async () => {
    if(!feedback) return alert(t.feedback_empty || (isKo ? "내용을 입력해주세요." : "Please enter your feedback."));
    const { error } = await supabase.from('feedback').insert([{ 
      message: feedback, 
      user_id: localStorage.getItem('hhi_user_id') || 'guest' 
    }]);
    if (error) {
      alert((isKo ? "🚨 저장 실패: " : "🚨 Error: ") + error.message);
      return;
    }
    alert(t.feedback_success || (isKo ? "소중한 의견 감사합니다!" : "Thank you for your feedback!"));
    setFeedback('');
  };

  const getFlagUrl = (key) => {
    const flags = {
      ko: 'https://flagcdn.com/w40/kr.png', en: 'https://flagcdn.com/w40/us.png', zh: 'https://flagcdn.com/w40/cn.png',
      vi: 'https://flagcdn.com/w40/vn.png', uz: 'https://flagcdn.com/w40/uz.png', id: 'https://flagcdn.com/w40/id.png',
      th: 'https://flagcdn.com/w40/th.png', tl: 'https://flagcdn.com/w40/ph.png', ru: 'https://flagcdn.com/w40/ru.png', mn: 'https://flagcdn.com/w40/mn.png'
    };
    return flags[key] || 'https://flagcdn.com/w40/un.png'; 
  };

  // 💡 절대 안 깨지는 100% 매칭 데이터 배열 생성
  const restaurants = [
    { id: '현장(현대그린푸드)', label: t.res_1 },
    { id: '숙소(현대그린푸드)', label: t.res_2 },
    { id: '현장(CJ프레시웨이)', label: t.res_3 },
    { id: '현장(사이트솔루션HOC)', label: t.res_4 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-indigo-950 text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href = '/'} className="text-xl p-2">←</button>
        <h1 className="text-[16px] font-black">{t.set_title || '선호 설정'}</h1>
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
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 space-y-8 pb-24">
        
        {/* 💡 사전에서 01. 02. 가 빠진 완벽한 타이틀 적용 */}
        <div className="space-y-3">
          <h3 className="text-indigo-600 font-black text-sm">{t.set_res}</h3>
          <div className="grid grid-cols-1 gap-2">
            {restaurants.map(res => (
              <button key={res.id} onClick={() => setSelectedRestaurant(res.id)} className={`p-4 rounded-xl border font-bold text-left flex justify-between items-center ${selectedRestaurant === res.id ? 'bg-indigo-50 border-indigo-500 text-indigo-950' : 'bg-white text-slate-600'}`}>
                <span>🍱 {res.label}</span>
                {selectedRestaurant === res.id && <span className="text-indigo-600">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-4 bg-indigo-950 text-white rounded-2xl font-black shadow-lg transition-transform active:scale-95">
          {t.set_save}
        </button>

        <div className="space-y-3">
          <h3 className="text-indigo-600 font-black text-sm">{t.set_lang}</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(dict).map(key => (
              <button key={key} onClick={() => setSelectedLang(key)} className={`p-3 pl-4 rounded-xl text-sm font-black flex items-center justify-start gap-3 ${selectedLang === key ? 'bg-indigo-950 text-white' : 'bg-white border text-slate-600'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getFlagUrl(key)} alt={key} className="w-5 h-auto rounded-sm shadow-sm" />
                <span>{dict[key].lang_name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-indigo-600 font-black text-sm">{t.feedback_title}</h3>
            <textarea 
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500" 
              placeholder={t.feedback_placeholder}
              value={feedback} 
              onChange={(e) => setFeedback(e.target.value)} 
            />
            <button onClick={sendFeedback} className="w-full py-3 bg-indigo-950 text-white rounded-xl font-bold transition-transform active:scale-95">
              {t.feedback_submit}
            </button>
        </div>
      </main>
    </div>
  );
}