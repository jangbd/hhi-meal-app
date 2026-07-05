'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import AdBanner from './AdBanner'; // 💡 하단 배너 광고 컴포넌트

export default function Home() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('현장(현대그린푸드)');

  useEffect(() => {
    const savedRes = localStorage.getItem('my_restaurant') || '현장(현대그린푸드)';
    setSelectedRestaurant(savedRes);

    async function fetchMeals() {
      const { data } = await supabase.from('meals').select('*').order('meal_date', { ascending: true });
      if (data) setMeals(data);
      setLoading(false);
    }
    fetchMeals();
  }, []);

  const pad = (n) => n < 10 ? '0' + n : n;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  
  const tmrw = new Date(now);
  tmrw.setDate(tmrw.getDate() + 1);
  const tomorrowStr = `${tmrw.getFullYear()}-${pad(tmrw.getMonth() + 1)}-${pad(tmrw.getDate())}`;

  const getSortedMeals = () => {
    const hour = now.getHours();
    let targetDateStr = todayStr;
    let allowedTypesToday = [];
    let currentMealLabel = '';

    if (hour < 8) { allowedTypesToday = ['조식', '중식', '석식', '야식']; currentMealLabel = '조식'; }
    else if (hour < 13) { allowedTypesToday = ['중식', '석식', '야식']; currentMealLabel = '중식'; }
    else if (hour < 20) { allowedTypesToday = ['석식', '야식']; currentMealLabel = '석식'; }
    else { targetDateStr = tomorrowStr; allowedTypesToday = ['조식', '중식', '석식', '야식']; currentMealLabel = '조식'; }

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

    return { sorted, targetDateStr, currentMealLabel };
  };

  const { sorted: sortedMeals, targetDateStr, currentMealLabel } = getSortedMeals();
  
  const groupedMeals = sortedMeals.reduce((acc, meal) => {
    if (!acc[meal.meal_date]) acc[meal.meal_date] = {};
    if (!acc[meal.meal_date][meal.meal_type]) acc[meal.meal_date][meal.meal_type] = [];
    acc[meal.meal_date][meal.meal_type].push(meal);
    return acc;
  }, {});

  // 💡 데이터베이스에 맞게 새로운 카테고리 순서로 업데이트
  const categoryOrder = ['한식', '분식', '간편식', '월드키친', '직화', '일반식', '기숙사식', '스낵픽', '힐링푸드'];

  const sortCategories = (mealsArray) => {
    return [...mealsArray].sort((a, b) => {
      const posA = categoryOrder.indexOf(a.menu_category) === -1 ? 99 : categoryOrder.indexOf(a.menu_category);
      const posB = categoryOrder.indexOf(b.menu_category) === -1 ? 99 : categoryOrder.indexOf(b.menu_category);
      return posA - posB;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="sticky top-0 z-30 bg-indigo-950 text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => (window.location.href = '/settings')} className="text-xs font-bold bg-indigo-900 px-3 py-1.5 rounded-full hover:bg-indigo-800 transition-colors border border-indigo-800">
          📍 {selectedRestaurant} <span className="text-[10px] text-indigo-300 ml-0.5">▼</span>
        </button>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl ml-auto">☰</button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-indigo-950">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold">✕</button>
            </div>
            <nav className="space-y-3">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">
                🍱 식단
              </Link>
              <Link href="/bus" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">
                🚌 버스 시간표
              </Link>
              <Link href="/points" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">
                💎 칭찬 포인트 매칭소
              </Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">
                ⚙️ 설정
              </Link>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-6 pb-24">
        {Object.entries(groupedMeals).map(([date, types]) => (
          <div key={date} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
            
            <div className="flex flex-col items-center mb-4">
              {date === todayStr && (
                <span className="bg-indigo-900 text-white text-[12px] font-black px-4 py-1.5 rounded-full mb-2 shadow-md">오늘</span>
              )}
              <h2 className="text-[26px] font-black text-indigo-950 tracking-tight">{date.replace(/-/g, '.')}</h2>
              
              {date === targetDateStr && (
                <div className="mt-2 text-[14px] font-bold text-indigo-700 bg-indigo-50 px-5 py-2 rounded-full">
                  지금은 {currentMealLabel} 시간
                </div>
              )}
            </div>

            {['조식', '중식', '석식', '야식'].map(type => types[type] && (
              <div key={type} className="mt-8 pt-8 border-t-[4px] border-slate-100 first:mt-3 first:pt-0 first:border-t-0">
                
                <div className="flex justify-center items-center gap-2 mb-6 bg-slate-50 py-3.5 rounded-2xl shadow-sm border border-slate-100">
                  <span className="text-2xl">{type === '조식' ? '🌅' : type === '중식' ? '☀️' : type === '석식' ? '🌙' : '🌃'}</span>
                  <h3 className="font-black text-indigo-950 text-[22px]">{type}</h3>
                </div>
                
                {sortCategories(types[type]).map(m => (
                  <div key={m.id} className="text-center mb-10 last:mb-2">
                    {/* 💡 한식, 분식, 간편식 글자 크기를 대폭 키웠습니다 (text-[18px] -> text-[22px]) */}
                    <p className="text-green-700 font-black text-[22px] mb-3 tracking-tighter">{m.menu_category}</p>
                    <div className="text-slate-800 space-y-2.5 text-[19px] font-bold leading-snug">
                      {m.menu_text.split('·').map((item, idx) => (
                        <p key={idx} className="block">{item.trim()}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </main>

      {/* 하단 고정 배너 광고 영역 */}
      <div className="w-full flex items-center justify-center bg-gray-50 border-t sticky bottom-0 z-40">
        <AdBanner dataAdSlot="본인의_애드센스_슬롯번호" /> 
      </div>
    </div>
  );
}