'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdBanner from '../AdBanner';
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
    alert(isKo ? '설정이 저장되었습니다!' : 'Settings saved successfully!');
    window.location.href = '/';
  };

  const sendFeedback = async () => {
    if(!feedback) return alert(isKo ? "내용을 입력해주세요." : "Please enter your feedback.");
    await supabase.from('feedback').insert([{ message: feedback, user_id: localStorage.getItem('hhi_user_id') || 'guest' }]);
    alert(isKo ? "소중한 의견 감사합니다!" : "Thank you for your feedback!");
    setFeedback('');
  };

  // 💡 식당 이름 다국어 번역 함수
  const getResName = (res) => {
    if(res === '현장(현대그린푸드)') return t.res_1 || res;
    if(res === '숙소(현대그린푸드)') return t.res_2 || res;
    if(res === '현장(CJ프레시웨이)') return t.res_3 || res;
    if(res === '현장(사이트솔루션HOC)') return t.res_4 || res;
    return res;
  };

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
        {/* 01. 주 공급 식당 */}
        <div className="space-y-3">
          <h3 className="text-indigo-600 font-black text-sm">{t.set_res || '01. 주 공급 식당'}</h3>
          <div className="grid grid-cols-1 gap-2">
            {['현장(현대그린푸드)', '숙소(현대그린푸드)', '현장(CJ프레시웨이)', '현장(사이트솔루션HOC)'].map(res => (
              <button key={res} onClick={() => setSelectedRestaurant(res)} className={`p-4 rounded-xl border font-bold text-left flex justify-between items-center ${selectedRestaurant === res ? 'bg-indigo-50 border-indigo-500 text-indigo-950' : 'bg-white text-slate-600'}`}>
                <span>🍱 {getResName(res)}</span>
                {selectedRestaurant === res && <span className="text-indigo-600">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 💡 02, 03번 삭제 후 04번 언어 설정을 02번으로 당겨왔습니다! */}
        <div className="space-y-3">
          <h3 className="text-indigo-600 font-black text-sm">{(t.set_lang || '04. 표시 언어 (Language)').replace('04.', '02.')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(dict).map(key => (
              <button key={key} onClick={() => setSelectedLang(key)} className={`p-3 rounded-xl text-sm font-black ${selectedLang === key ? 'bg-indigo-950 text-white' : 'bg-white border text-slate-600'}`}>
                {dict[key].lang_name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-4 bg-indigo-950 text-white rounded-2xl font-black shadow-lg transition-transform active:scale-95">
          {t.set_save || '설정 저장하고 식단 보기'}
        </button>

        {/* 건의사항 */}
        <div className="space-y-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-indigo-600 font-black text-sm">{isKo ? "💡 건의사항 및 문제신고" : "💡 Feedback & Bug Report"}</h3>
            <textarea 
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500" 
              placeholder={isKo ? "불편한 점이나 요청사항을 적어주세요." : "Please let us know if you have any issues or suggestions."}
              value={feedback} 
              onChange={(e) => setFeedback(e.target.value)} 
            />
            <button onClick={sendFeedback} className="w-full py-3 bg-indigo-950 text-white rounded-xl font-bold transition-transform active:scale-95">
              {isKo ? "의견 보내기" : "Submit Feedback"}
            </button>
        </div>
      </main>

      <div className="w-full flex items-center justify-center bg-gray-50 border-t sticky bottom-0 z-40">
        <AdBanner dataAdSlot="3671427905" /> 
      </div>
    </div>
  );
}