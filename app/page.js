'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import AdBanner from './AdBanner';
import { dict } from './i18n'; 

export default function Home() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('현장(현대그린푸드)');
  const [lang, setLang] = useState('ko');
  const [pinnedNotices, setPinnedNotices] = useState([]);

  useEffect(() => {
    const savedRes = localStorage.getItem('my_restaurant') || '현장(현대그린푸드)';
    setSelectedRestaurant(savedRes);

    const savedLang = localStorage.getItem('my_language') || 'ko';
    setLang(savedLang);

    async function fetchMeals() {
      const { data } = await supabase.from('meals').select('*').order('meal_date', { ascending: true });
      if (data) setMeals(data);
      setLoading(false);
    }
    fetchMeals();

    async function fetchPinnedNotices() {
      const { data } = await supabase.from('notices').select('*').eq('is_pinned', true).order('created_at', { ascending: false });
      if (data) setPinnedNotices(data);
    }
    fetchPinnedNotices();
  }, []);

  const t = dict[lang] || dict.ko;

  const pad = (n) => n < 10 ? '0' + n : n;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  
  const tmrw = new Date(now);
  tmrw.setDate(tmrw.getDate() + 1);
  const tomorrowStr = `${tmrw.getFullYear()}-${pad(tmrw.getMonth() + 1)}-${pad(tmrw.getDate())}`;

  const getResName = (res) => {
    if(res === '현장(현대그린푸드)') return t.res_1 || res;
    if(res === '숙소(현대그린푸드)') return t.res_2 || res;
    if(res === '현장(CJ프레시웨이)') return t.res_3 || res;
    if(res === '현장(사이트솔루션HOC)') return t.res_4 || res;
    return res;
  };

  const getMealTranslation = (mealType) => {
    if (mealType === '조식') return t.b;
    if (mealType === '중식') return t.l;
    if (mealType === '석식') return t.d;
    if (mealType === '야식') return t.n;
    return mealType;
  };

  const getCategoryTranslation = (cat) => {
    if (cat === '한식') return t.cat_korean;
    if (cat === '간편식') return t.cat_snack;
    if (cat === '분식') return t.cat_bunsik;
    if (cat === '월드키친') return t.cat_world;
    if (cat === '직화') return t.cat_jikhwa;
    return cat;
  };

  const getMenuByLang = (meal) => {
    const fieldName = `menu_${lang}`;
    return meal[fieldName] || meal.menu_text;
  };

  const getSortedMeals = () => {
    const hour = now.getHours();
    let targetDateStr = todayStr;
    let allowedTypesToday = [];

    if (hour < 8) { allowedTypesToday = ['조식', '중식', '석식', '야식']; }
    else if (hour < 13) { allowedTypesToday = ['중식', '석식', '야식']; }
    else if (hour < 20) { allowedTypesToday = ['석식', '야식']; }
    else { targetDateStr = tomorrowStr; allowedTypesToday = ['조식', '중식', '석식', '야식']; }

    const filtered = meals.filter(m => {
      if (m.restaurant !== selectedRestaurant) return false;
      if (m.meal_date < targetDateStr) return false;
      if (m.meal_date === targetDateStr && !allowedTypesToday.includes(m.meal_type)) return false;
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      if (a.meal_date !== b.meal_date) return a.meal_date.localeCompare(b.meal_date);
      const order = { '조식': 1, '중식': 2, '석식': 3, '야식': 4 };
      return order[a.meal_type] - order[b.meal_type];
    });

    return { sorted, targetDateStr };
  };

  const { sorted: sortedMeals, targetDateStr } = getSortedMeals();
  
  const groupedMeals = sortedMeals.reduce((acc, meal) => {
    if (!acc[meal.meal_date]) acc[meal.meal_date] = {};
    if (!acc[meal.meal_date][meal.meal_type]) acc[meal.meal_date][meal.meal_type] = [];
    acc[meal.meal_date][meal.meal_type].push(meal);
    return acc;
  }, {});

  const categoryOrder = ['한식', '간편식', '분식', '월드키친', '직화', '일반식', '기숙사식', '스낵픽', '힐링푸드'];

  const sortCategories = (mealsArray) => {
    return [...mealsArray].sort((a, b) => {
      const posA = categoryOrder.indexOf(a.menu_category) === -1 ? 99 : categoryOrder.indexOf(a.menu_category);
      const posB = categoryOrder.indexOf(b.menu_category) === -1 ? 99 : categoryOrder.indexOf(b.menu_category);
      return posA - posB;
    });
  };

  const highlightMenuText = (text) => {
    const regex = /(\[[^\]]+\])/g;
    const parts = text.split(regex);
    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span key={idx} className="text-orange-600 text-[20px] font-black inline-block mx-0.5">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="sticky top-0 z-30 bg-indigo-950 text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => (window.location.href = '/settings')} className="text-xs font-bold bg-indigo-900 px-3 py-1.5 rounded-full hover:bg-indigo-800 border border-indigo-800">
          📍 {getResName(selectedRestaurant)} <span className="text-[10px] text-indigo-300 ml-0.5">▼</span>
        </button>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl ml-auto">☰</button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-indigo-950">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold">✕</button>
            </div>
            <nav className="space-y-3">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">{t.menu_meal}</Link>
              <Link href="/bus" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">{t.menu_bus}</Link>
              <Link href="/points" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">{t.menu_points || '💎 HD핵심가치 포인트 매칭소'}</Link>
              <Link href="/game" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">{t.menu_game || '⚔️ 강화의 신'}</Link>
              <Link href="/notice" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">{t.menu_notice || '📢 공지사항'}</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">{t.menu_settings}</Link>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-4 pb-24">
        {pinnedNotices.length > 0 && (
          <Link href="/notice" className="block bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg shrink-0">📌</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-amber-900 truncate">{pinnedNotices[0].title}</p>
                {pinnedNotices.length > 1 && (
                  <p className="text-[11px] text-amber-700 font-bold mt-0.5">+{pinnedNotices.length - 1}{t.notice_more || '건의 공지사항 더보기'}</p>
                )}
              </div>
              <span className="text-amber-400 text-sm shrink-0">›</span>
            </div>
          </Link>
        )}
        {Object.entries(groupedMeals).map(([date, types]) => (
          <div key={date} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center mb-3">
              {date === todayStr && (
                <span className="bg-indigo-900 text-white text-[11px] font-black px-3 py-1 rounded-full mb-1.5 shadow-md">{t.today}</span>
              )}
              <h2 className="text-[25px] font-black text-indigo-950 tracking-tight">
                {date.replace(/-/g, '.')} <span className="text-[16px] text-indigo-400">({(t.days || ['일', '월', '화', '수', '목', '금', '토'])[new Date(date + 'T00:00:00').getDay()]})</span>
              </h2>
            </div>

            {['조식', '중식', '석식', '야식'].map(type => types[type] && (
              <div key={type} className="mt-5 first:mt-1">
                <div className="flex justify-center items-center gap-1.5 mb-4 bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                  <span className="text-xl">{type === '조식' ? '🌅' : type === '중식' ? '☀️' : type === '석식' ? '🌙' : '🌃'}</span>
                  <h3 className="font-black text-indigo-950 text-[22px]">{getMealTranslation(type)}</h3>
                </div>
                
                {sortCategories(types[type]).map(m => (
                  <div key={m.id} className="text-center mb-5 last:mb-1">
                    <p className="text-green-700 font-black text-[23px] mb-1.5 tracking-tighter">{getCategoryTranslation(m.menu_category)}</p>

                    <div className="text-slate-800 space-y-1 text-[19px] font-bold leading-snug">
                      {(getMenuByLang(m) || '').split('·').map((item, idx) => (
                        <p key={idx} className="block">{highlightMenuText(item.trim())}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </main>

      <div className="w-full flex items-center justify-center bg-gray-50 border-t sticky bottom-0 z-40">
        <AdBanner dataAdSlot="3671427905" /> 
      </div>
    </div>
  );
}