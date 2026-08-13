'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import AdBanner from './AdBanner';
import { dict } from './i18n';
import { MATCHING_ENABLED, GAME_ENABLED } from './featureFlags';
import { Capacitor, registerPlugin } from '@capacitor/core';

// 💡 식사 태깅용 사내 앱(HD현대 식수시스템) 실행 버튼에 사용.
// 안드로이드는 패키지명만으로 네이티브 플러그인을 통해 바로 실행 가능하지만,
// iOS는 그 앱이 URL 스킴을 등록해두지 않아 자동 실행이 아예 불가능해서 버튼 자체를 숨긴다.
const LaunchApp = registerPlugin('LaunchApp');
const HHI_TAGGING_ANDROID_PACKAGE = 'com.hhi.android';

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

    // 💡 첫 화면에서 흰 화면이 잠깐 보이는 걸 줄이기 위해, 네트워크 응답 전에
    // 로컬에 캐시된 최근 식단을 먼저 보여주고 최신 데이터로 교체한다.
    try {
      const cached = JSON.parse(localStorage.getItem('cached_meals') || '[]');
      if (cached.length > 0) setMeals(cached);
    } catch { /* 캐시 파싱 실패는 무시하고 네트워크 응답만 사용 */ }

    async function fetchMeals() {
      const { data } = await supabase.from('meals').select('*').order('meal_date', { ascending: true });
      if (data) {
        setMeals(data);
        // 💡 캐시는 오늘부터 7일치만 유지 (과거 데이터/8일 이후 데이터는 정리)
        const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const startStr = toDateStr(new Date());
        const end = new Date();
        end.setDate(end.getDate() + 6);
        const endStr = toDateStr(end);
        const pruned = data.filter(m => m.meal_date >= startStr && m.meal_date <= endStr);
        try { localStorage.setItem('cached_meals', JSON.stringify(pruned)); } catch { /* 저장 공간 부족 등은 무시 */ }
      }
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

  const handleLaunchTaggingApp = async () => {
    try {
      await LaunchApp.launch({ packageName: HHI_TAGGING_ANDROID_PACKAGE });
    } catch {
      window.open(`https://play.google.com/store/apps/details?id=${HHI_TAGGING_ANDROID_PACKAGE}`, '_blank');
    }
  };
  // 💡 iOS는 대상 앱에 URL 스킴이 없어 자동 실행이 아예 불가능하고, 스토어로만
  // 안내해봐야 혼란만 주므로 버튼 자체를 숨긴다 (안드로이드에서만 노출).
  const showTaggingButton = Capacitor.getPlatform() === 'android';

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
    return res;
  };

  // 💡 두 식당 메뉴를 한 화면에서 볼 때 카테고리 줄마다 붙이는 짧은 식당 이름표
  const getResShortName = (res) => {
    if (res === '현장(현대그린푸드)') return t.res_short_1 || '현대';
    if (res === '현장(CJ프레시웨이)') return t.res_short_3 || 'CJ';
    return res;
  };

  // 💡 '현장'을 선택하면 현대그린푸드+CJ프레시웨이 두 식당 메뉴를 한 화면에서
  // 같이 비교하며 볼 수 있게 한다 (숙소는 기존처럼 단독으로만 표시).
  const SITE_RESTAURANTS = ['현장(현대그린푸드)', '현장(CJ프레시웨이)'];
  const restaurantsToShow = selectedRestaurant === '숙소(현대그린푸드)' ? ['숙소(현대그린푸드)'] : SITE_RESTAURANTS;
  const headerRestaurantLabel = selectedRestaurant === '숙소(현대그린푸드)' ? (t.res_2 || selectedRestaurant) : (t.res_field || '현장');

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
      if (!restaurantsToShow.includes(m.restaurant)) return false;
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
  
  // 날짜 → 식당 → 식사구분 순으로 묶어서, 한 화면에서 식당별로 위아래 구분해 보여준다.
  const groupedMeals = sortedMeals.reduce((acc, meal) => {
    if (!acc[meal.meal_date]) acc[meal.meal_date] = {};
    if (!acc[meal.meal_date][meal.restaurant]) acc[meal.meal_date][meal.restaurant] = {};
    if (!acc[meal.meal_date][meal.restaurant][meal.meal_type]) acc[meal.meal_date][meal.restaurant][meal.meal_type] = [];
    acc[meal.meal_date][meal.restaurant][meal.meal_type].push(meal);
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
      <header className="sticky top-0 z-30 bg-indigo-950 text-white shadow-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 h-14 flex items-center justify-between">
          <button onClick={() => (window.location.href = '/settings')} className="text-xs font-bold bg-indigo-900 px-3 py-1.5 rounded-full hover:bg-indigo-800 border border-indigo-800">
            📍 {headerRestaurantLabel} <span className="text-[10px] text-indigo-300 ml-0.5">▼</span>
          </button>
          {showTaggingButton && (
            <button onClick={handleLaunchTaggingApp} className="text-xs font-bold bg-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-500 ml-auto mr-2">
              🍽️ 식사 태깅
            </button>
          )}
          <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl">☰</button>
        </div>
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
              {MATCHING_ENABLED && (
                <Link href="/points" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">{t.menu_points || '💎 HD핵심가치 포인트 매칭소'}</Link>
              )}
              {GAME_ENABLED && (
                <Link href="/game" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">{t.menu_game || '⚔️ 강화의 신'}</Link>
              )}
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
        {Object.entries(groupedMeals).map(([date, byRestaurant]) => (
          <div key={date} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center mb-3">
              {date === todayStr && (
                <span className="bg-indigo-900 text-white text-[11px] font-black px-3 py-1 rounded-full mb-1.5 shadow-md">{t.today}</span>
              )}
              <h2 className="text-[25px] font-black text-indigo-950 tracking-tight">
                {date.replace(/-/g, '.')} <span className="text-[16px] text-indigo-400">({(t.days || ['일', '월', '화', '수', '목', '금', '토'])[new Date(date + 'T00:00:00').getDay()]})</span>
              </h2>
            </div>

            {(() => {
              const resWithData = restaurantsToShow.filter(res => byRestaurant[res]);
              const multiRestaurant = resWithData.length > 1;
              return ['조식', '중식', '석식', '야식']
                .filter(type => resWithData.some(res => byRestaurant[res][type]))
                .map((type, typeIdx) => (
                  <div key={type} className={typeIdx > 0 ? 'mt-6 pt-5 border-t-2 border-dashed border-slate-200' : 'mt-1'}>
                    <div className="flex justify-center items-center gap-1.5 mb-4 bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                      <span className="text-xl">{type === '조식' ? '🌅' : type === '중식' ? '☀️' : type === '석식' ? '🌙' : '🌃'}</span>
                      <h3 className="font-black text-indigo-950 text-[22px]">{getMealTranslation(type)}</h3>
                    </div>

                    {(() => {
                      // 카테고리(한식/분식...) 우선 정렬 후, 같은 카테고리 안에서는 식당 순서로 정렬
                      // → "현대 한식 / CJ 한식 / 현대 분식 / CJ 분식" 순으로 나란히 비교되게 함
                      const allMeals = resWithData
                        .filter(res => byRestaurant[res][type])
                        .flatMap(res => byRestaurant[res][type].map(m => ({ ...m, __res: res })));
                      const sortedMeals = [...allMeals].sort((a, b) => {
                        const posA = categoryOrder.indexOf(a.menu_category) === -1 ? 99 : categoryOrder.indexOf(a.menu_category);
                        const posB = categoryOrder.indexOf(b.menu_category) === -1 ? 99 : categoryOrder.indexOf(b.menu_category);
                        if (posA !== posB) return posA - posB;
                        return resWithData.indexOf(a.__res) - resWithData.indexOf(b.__res);
                      });
                      return sortedMeals.map(m => (
                        <div key={`${m.__res}-${m.id}`} className="text-center mb-5 last:mb-1">
                          <p className="text-green-700 font-black text-[23px] mb-1.5 tracking-tighter">
                            {multiRestaurant && `${getResShortName(m.__res)} `}{getCategoryTranslation(m.menu_category)}
                          </p>

                          <div className="text-slate-800 space-y-1 text-[19px] font-bold leading-snug">
                            {(getMenuByLang(m) || '').split('·').map((item, idx) => (
                              <p key={idx} className="block">{highlightMenuText(item.trim())}</p>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ));
            })()}
          </div>
        ))}
      </main>

      <div className="w-full flex items-center justify-center bg-gray-50 border-t sticky bottom-0 z-40">
        <AdBanner dataAdSlot="3671427905" /> 
      </div>
    </div>
  );
}