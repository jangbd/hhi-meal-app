'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function Settings() {
  const [meals, setMeals] = useState([]);
  const [dbRestaurants, setDbRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 💡 햄버거 메뉴 상태 추가
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mealTypeOptions = ['조식', '중식', '석식', '야식'];
  const categoryOptions = ['일반식', '간편식', '월드키친', '직화', '기숙사식', '스낵픽', '힐링푸드'];

  useEffect(() => {
    async function initSettings() {
      const { data } = await supabase.from('meals').select('restaurant, meal_type, menu_category');
      if (data) {
        setMeals(data);
        const uniqueRestaurants = [...new Set(data.map(m => m.restaurant))].filter(Boolean);
        setDbRestaurants(uniqueRestaurants);

        const defaultRes = uniqueRestaurants.find(r => r.includes('현장(현대그린푸드)')) || uniqueRestaurants[0] || '현장(현대그린푸드)';
        const savedRes = localStorage.getItem('my_restaurant') || defaultRes;
        
        const availTypes = [...new Set(data.filter(m => m.restaurant === savedRes).map(m => m.meal_type))];
        const defaultTypes = availTypes.filter(t => ['조식', '중식', '석식'].includes(t));
        const availCats = [...new Set(data.filter(m => m.restaurant === savedRes).map(m => m.menu_category))];

        const savedTypes = localStorage.getItem('my_types') ? JSON.parse(localStorage.getItem('my_types')) : defaultTypes;
        const savedCats = localStorage.getItem('my_categories') ? JSON.parse(localStorage.getItem('my_categories')) : availCats;

        setSelectedRestaurant(savedRes);
        setSelectedTypes(savedTypes);
        setSelectedCategories(savedCats);
      }
      setLoading(false);
    }
    initSettings();
  }, []);

  const availableTypes = useMemo(() => {
    return [...new Set(meals.filter(m => m.restaurant === selectedRestaurant).map(m => m.meal_type))];
  }, [meals, selectedRestaurant]);

  const availableCats = useMemo(() => {
    return [...new Set(meals.filter(m => m.restaurant === selectedRestaurant && selectedTypes.includes(m.meal_type)).map(m => m.menu_category))];
  }, [meals, selectedRestaurant, selectedTypes]);

  const saveRes = (id) => { 
    setSelectedRestaurant(id); 
    localStorage.setItem('my_restaurant', id); 

    const newAvailTypes = [...new Set(meals.filter(m => m.restaurant === id).map(m => m.meal_type))];
    const validTypes = newAvailTypes.filter(t => ['조식', '중식', '석식'].includes(t));
    setSelectedTypes(validTypes);
    localStorage.setItem('my_types', JSON.stringify(validTypes));

    const newAvailCats = [...new Set(meals.filter(m => m.restaurant === id && validTypes.includes(m.meal_type)).map(m => m.menu_category))];
    setSelectedCategories(newAvailCats);
    localStorage.setItem('my_categories', JSON.stringify(newAvailCats));
  };
  
  const toggleType = (t) => {
    const next = selectedTypes.includes(t) ? selectedTypes.filter(x => x !== t) : [...selectedTypes, t];
    setSelectedTypes(next); 
    localStorage.setItem('my_types', JSON.stringify(next));

    const newAvailCats = [...new Set(meals.filter(m => m.restaurant === selectedRestaurant && next.includes(m.meal_type)).map(m => m.menu_category))];
    setSelectedCategories(newAvailCats);
    localStorage.setItem('my_categories', JSON.stringify(newAvailCats));
  };
  
  const toggleCat = (c) => {
    const next = selectedCategories.includes(c) ? selectedCategories.filter(x => x !== c) : [...selectedCategories, c];
    setSelectedCategories(next); 
    localStorage.setItem('my_categories', JSON.stringify(next));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center max-w-md mx-auto font-sans">
        <p className="text-slate-400 text-sm font-bold animate-pulse">설정 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto font-sans antialiased pb-20">
      
      {/* 💡 상단 앱바 업데이트 (뒤로가기 + 햄버거 버튼) */}
      <header className="sticky top-0 z-30 bg-[#1a1a3c] text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href='/'} className="p-2 -ml-2 text-xl hover:text-indigo-300">←</button>
        <h1 className="text-[15px] font-black tracking-tight">선호 설정</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl">☰</button>
      </header>

      {/* 햄버거 메뉴 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-[#1a1a3c]">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold">✕</button>
            </div>
            <nav className="space-y-3">
              <Link href="/" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">🍱 식단</Link>
              <Link href="/bus" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">🚌 버스 시간표</Link>
              <Link href="/points" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">💎 칭찬 포인트 매칭소</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">⚙️ 설정</Link>
            </nav>
          </div>
        </div>
      )}

      <div className="p-5 space-y-8 mt-2">
        <section>
          <h2 className="text-[12px] font-black text-indigo-600 uppercase tracking-widest mb-3">01. 주 공급 식당</h2>
          <div className="grid gap-3">
            {dbRestaurants.map(resName => (
              <button key={resName} onClick={() => saveRes(resName)} className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all ${selectedRestaurant === resName ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/50 shadow-md' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${selectedRestaurant === resName ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-50 border border-slate-100'}`}>🍱</div>
                <div className="text-left">
                  <p className={`text-[15px] font-black tracking-tight ${selectedRestaurant === resName ? 'text-indigo-900' : 'text-slate-700'}`}>{resName}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5 font-semibold">실제 등록된 식단 공급 코너</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[12px] font-black text-indigo-600 uppercase tracking-widest mb-3">02. 관심 식사 시간</h2>
          <div className="flex flex-wrap gap-2">
            {mealTypeOptions.map(t => (
              <button key={t} disabled={!availableTypes.includes(t)} onClick={() => toggleType(t)} className={`px-6 py-3 rounded-full text-[14px] font-bold transition-all shadow-sm ${!availableTypes.includes(t) ? 'opacity-30 bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : selectedTypes.includes(t) ? 'bg-[#1a1a3c] text-white ring-2 ring-[#1a1a3c]/50' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{t}</button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[12px] font-black text-indigo-600 uppercase tracking-widest mb-3">03. 선호 메뉴 종류</h2>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map(c => (
              <button key={c} disabled={!availableCats.includes(c)} onClick={() => toggleCat(c)} className={`px-5 py-3 rounded-[1rem] text-[13px] font-bold border transition-all shadow-sm ${!availableCats.includes(c) ? 'opacity-30 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' : selectedCategories.includes(c) ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{c}</button>
            ))}
          </div>
        </section>

        <button onClick={() => window.location.href='/'} className="w-full py-4 mt-4 bg-[#1a1a3c] text-white rounded-[1.5rem] font-black text-[16px] shadow-lg shadow-[#1a1a3c]/30 active:scale-95 transition-transform">설정 저장하고 식단 보기</button>
      </div>
    </div>
  );
}