'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdBanner from '../AdBanner';

export default function Settings() {
  const [selectedRestaurant, setSelectedRestaurant] = useState('현장(현대그린푸드)');
  const [selectedTimes, setSelectedTimes] = useState(['조식', '중식', '석식']);
  const [selectedCategories, setSelectedCategories] = useState(['한식', '간편식', '분식']);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedRes = localStorage.getItem('my_restaurant') || '현장(현대그린푸드)';
    setSelectedRestaurant(savedRes);
    
    const savedTimes = localStorage.getItem('my_times');
    if (savedTimes) setSelectedTimes(JSON.parse(savedTimes));

    const savedCats = localStorage.getItem('my_categories');
    if (savedCats) setSelectedCategories(JSON.parse(savedCats));
  }, []);

  const handleSave = () => {
    localStorage.setItem('my_restaurant', selectedRestaurant);
    localStorage.setItem('my_times', JSON.stringify(selectedTimes));
    localStorage.setItem('my_categories', JSON.stringify(selectedCategories));
    alert('설정이 저장되었습니다!');
    window.location.href = '/';
  };

  const toggleTime = (time) => {
    if (selectedTimes.includes(time)) setSelectedTimes(selectedTimes.filter(t => t !== time));
    else setSelectedTimes([...selectedTimes, time]);
  };

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) setSelectedCategories(selectedCategories.filter(c => c !== cat));
    else setSelectedCategories([...selectedCategories, cat]);
  };

  const restaurants = [
    '현장(현대그린푸드)',
    '숙소(현대그린푸드)',
    '현장(CJ프레시웨이)',
    '현장(사이트솔루션HOC)'
  ];

  // 💡 요청하신 한식, 간편식, 분식 3가지 목록으로 최적화
  const categories = ['한식', '간편식', '분식'];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col max-w-md mx-auto shadow-md">
      <header className="sticky top-0 z-30 bg-indigo-950 text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => (window.location.href = '/')} className="text-xl p-2 -ml-2">←</button>
        <h1 className="text-[16px] font-black tracking-tight">선호 설정</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl">☰</button>
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
              <Link href="/" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">🍱 식단</Link>
              <Link href="/bus" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">🚌 버스 시간표</Link>
              <Link href="/points" className="block py-3.5 px-4 text-slate-600 font-bold rounded-xl">💎 칭찬 포인트 매칭소</Link>
              <Link href="/settings" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">⚙️ 설정</Link>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 space-y-8 pb-24">
        {/* 01. 주 공급 식당 */}
        <div className="space-y-3">
          <h3 className="text-indigo-600 font-black text-sm">01. 주 공급 식당</h3>
          <div className="grid grid-cols-1 gap-2.5">
            {restaurants.map(res => (
              <button
                key={res}
                onClick={() => setSelectedRestaurant(res)}
                className={`p-4 rounded-2xl text-left border font-bold transition-all flex justify-between items-center ${selectedRestaurant === res ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                <span>🍱 {res}</span>
                {selectedRestaurant === res && <span className="text-indigo-600">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 02. 관심 식사 시간 */}
        <div className="space-y-3">
          <h3 className="text-indigo-600 font-black text-sm">02. 관심 식사 시간</h3>
          <div className="flex flex-wrap gap-2">
            {['조식', '중식', '석식', '야식'].map(time => (
              <button
                key={time}
                onClick={() => toggleTime(time)}
                className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${selectedTimes.includes(time) ? 'bg-indigo-950 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* 03. 선호 메뉴 종류 */}
        <div className="space-y-3">
          <h3 className="text-indigo-600 font-black text-sm">03. 선호 메뉴 종류</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${selectedCategories.includes(cat) ? 'bg-green-700 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-4 bg-indigo-950 text-white rounded-2xl text-md font-black shadow-lg hover:bg-indigo-900 transition-all">
          설정 저장하고 식단 보기
        </button>
      </main>

      <div className="w-full flex items-center justify-center bg-gray-50 border-t sticky bottom-0 z-40">
        <AdBanner dataAdSlot="본인의_애드센스_슬롯번호" /> 
      </div>
    </div>
  );
}