'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import AdBanner from './AdBanner'; 

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

  const categoryOrder = ['한식', '간편식', '월드키친', '분식', '기숙사식', '스낵픽', '힐링푸드'];

  // 💡 직화 증발 오류 수정 구역
  const sortCategories = (mealsArray) => {
    return [...mealsArray].map(meal => {
      let m = { ...meal }; // 안전하게 복사해서 조작
      
      if (m.menu_category === '일반식') m.menu_category = '한식';
      
      // 기존에 카테고리가 직화였던 메뉴들을 분식으로 편입시키되, 텍스트에 [직화] 명찰을 달아 생존시킵니다.
      if (m.menu_category && (m.menu_category.trim() === '직화' || m.menu_category.trim() === '[직화]')) {
        m.menu_category = '분식';
        if (!m.menu_text.includes('직화')) {
          m.menu_text = '[직화] · ' + m.menu_text;
        }
      }
      return m;
    }).sort((a, b) => {
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
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">🍱 식단</Link>
              <Link href="/bus" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">🚌 버스 시간표</Link>
              <Link href="/points" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">💎 칭찬 포인트 매칭소</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">⚙️ 설정</Link>
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto p-4 space-y-6 pb-24 flex-1 w-full">
        {Object.entries(groupedMeals).map(([date, types]) => (
          <div key={date} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center mb-4">
              {date === todayStr && <span className="bg-indigo-900 text-white text-[12px] font-black px-4 py-1.5 rounded-full mb-2 shadow-md">오늘</span>}
              <h2 className="text-[26px] font-black text-indigo-950 tracking-tight">{date.replace(/-/g, '.')}</h2>
              {date === targetDateStr && <div className="mt-2 text-[14px] font-bold text-indigo-700 bg-indigo-50 px-5 py-2 rounded-full">지금은 {currentMealLabel} 시간</div>}
            </div>

            {['조식', '중식', '석식', '야식'].map(type => types[type] && (
              <div key={type} className="mt-8 pt-8 border-t-[4px] border-slate-100 first:mt-3 first:pt-0 first:border-t-0">
                <div className="flex justify-center items-center gap-2 mb-6 bg-slate-50 py-3.5 rounded-2xl shadow-sm border border-slate-100">
                  <span className="text-2xl">{type === '조식' ? '🌅' : type === '중식' ? '☀️' : type === '석식' ? '🌙' : '🌃'}</span>
                  <h3 className="font-black text-indigo-950 text-[22px]">{type}</h3>
                </div>
                
                {sortCategories(types[type]).map(m => {
                  let itemsArray = m.menu_text.split('·').map(item => item.trim()).filter(Boolean);
                  const rawString = m.menu_text.replace(/\s+/g, '');

                  // 1. 조식 강제 교정 (해장국 분리)
                  if (type === '조식' && m.menu_category === '한식') {
                    if (rawString.includes('콩비지찌개') && !rawString.includes('올갱이해장국')) {
                      itemsArray = ['콩비지찌개', '모둠장조림', '청경채나물/김구이(완)', '[해장국]', '올갱이해장국'];
                    }
                  }
                  
                  // 2. 석식 강제 교정 (해장국 분리)
                  if (type === '석식' && m.menu_category === '한식') {
                    if (rawString.includes('채개장') && !rawString.includes('돈육김치미나리덮밥')) {
                      itemsArray = ['채개장', '해물까스&칠리소스', '가지나물', '[해장국]', '돈육김치미나리덮밥'];
                    }
                  }

                  // 💡 3. [직화] 타이틀 초록색 태그 변환 및 줄바꿈(분리) 로직
                  let newItemsArray = [];
                  itemsArray.forEach(item => {
                    let text = item;
                    
                    // 고깃집볶음밥 직화 누락 100% 방어
                    if (type === '중식' && text.replace(/\s+/g, '').includes('고깃집볶음밥') && !text.includes('직화')) {
                      text = '[직화] ' + text;
                    }
                    
                    // 정규식: 문장 맨 앞부분에 [직화], 직화], 직화 가 있는 경우에만 작동
                    const jikhwaMatch = text.match(/^\[?직화\]?\s*/);
                    
                    if (jikhwaMatch) {
                      newItemsArray.push('[직화]'); // 초록색 [직화] 타이틀을 먼저 독립적으로 뽑아냅니다.
                      
                      // 타이틀을 뽑아낸 나머지 순수 메뉴 이름만 남겨서 바로 다음 줄(다음 칸)로 떨어뜨립니다.
                      let cleanText = text.replace(/^\[?직화\]?\s*/, '').trim();
                      if (cleanText) newItemsArray.push(cleanText);
                    } else {
                      newItemsArray.push(text);
                    }
                  });
                  itemsArray = newItemsArray;

                  // 4. 칼로리 영구 제거
                  itemsArray = itemsArray.filter(item => !item.toLowerCase().includes('kcal'));

                  return (
                    <div key={m.id} className="text-center mb-10 last:mb-2">
                      <p className="text-green-700 font-black text-[18px] mb-3 tracking-tighter">{m.menu_category}</p>
                      <div className="text-slate-800 space-y-2.5 text-[19px] font-bold leading-snug">
                        {itemsArray.map((item, idx) => (
                          <p key={idx} className={item.startsWith('[') && item.endsWith(']') ? "text-green-700 text-[18px] mt-4 mb-1 font-black block" : "block"}>
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t z-40 h-[60px] flex items-center justify-center shadow-lg">
        <AdBanner dataAdSlot="하단_배너_애드센스_슬롯번호" />
      </div>
    </div>
  );
}