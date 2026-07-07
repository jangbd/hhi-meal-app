"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

// 💡 전세계 유일한 고유 ID(UUID)를 생성하는 헬퍼 함수
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function GameLobby() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); 
  
  const [showIntro, setShowIntro] = useState(false);
  const [tempNickname, setTempNickname] = useState('');

  const [nickname, setNickname] = useState('');
  const [points, setPoints] = useState(0); 
  const [weaponBoxes, setWeaponBoxes] = useState(0);        
  const [scrollBoxes, setScrollBoxes] = useState(0); 
  const [normalScrolls, setNormalScrolls] = useState(0); 
  const [blessedScrolls, setBlessedScrolls] = useState(0); 
  const [protectScrolls, setProtectScrolls] = useState(0); 

  const [mainWeapon, setMainWeapon] = useState(null);
  const [subWeapon, setSubWeapon] = useState(null);

  const [enhancingSlot, setEnhancingSlot] = useState(null);
  const [activeGacha, setActiveGacha] = useState(null); 
  const [popupMsg, setPopupMsg] = useState(null);
  const [warningTarget, setWarningTarget] = useState(null); 
  const [selectedScrollType, setSelectedScrollType] = useState('normal'); 
  const [useProtectMain, setUseProtectMain] = useState(false);
  const [useProtectSub, setUseProtectSub] = useState(false);
  const [buyQtyScroll, setBuyQtyScroll] = useState(1);
  const [buyQtyWeapon, setBuyQtyWeapon] = useState(1);

  const gradeCardStyles = {
    normal: 'border-gray-600 bg-gray-900/40 shadow-[inset_0_0_10px_rgba(156,163,175,0.1)]',
    magic: 'border-green-600 bg-green-950/10 shadow-[inset_0_0_10px_rgba(34,197,94,0.15)]',
    rare: 'border-blue-600 bg-blue-950/20 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]',
    epic: 'border-purple-600 bg-purple-950/20 shadow-[inset_0_0_15px_rgba(168,85,247,0.25)]',
    legendary: 'border-yellow-500 bg-yellow-950/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.3)]'
  };

  const gradeTextColors = {
    normal: 'text-gray-400', magic: 'text-green-400', rare: 'text-blue-400 font-extrabold', epic: 'text-purple-400 font-extrabold', legendary: 'text-yellow-400 font-extrabold'
  };

  const getGradeLabel = (grade) => ({ normal: '일반', magic: '마법', rare: '희귀', epic: '에픽', legendary: '전설' }[grade] || '일반');

  const getSuccessRate = (level) => {
    if (level >= 12) return 1; if (level >= 11) return 3; if (level >= 10) return 5;
    if (level >= 9) return 10; if (level >= 8) return 15; if (level >= 7) return 25;
    if (level >= 6) return 40; if (level >= 5) return 60; if (level >= 4) return 80;
    return 100;
  };

  const getAuraEffect = (level) => {
    if (level >= 10) return 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)) scale-110';
    if (level >= 7) return 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.8)) scale-105';
    return '';
  };

  const loadGameData = async (userId) => {
    try {
      let { data: profile, error: profileErr } = await supabase.from('game_profiles').select('*').eq('id', userId).maybeSingle();
      if (profileErr) throw profileErr;
      
      if (!profile) {
        setShowIntro(true);
        setLoading(false);
        return; 
      }

      setNickname(profile.nickname || '이름없음');
      setPoints(profile.points || 0);
      setWeaponBoxes(profile.weapon_boxes || 0);
      setScrollBoxes(profile.scroll_boxes || 0);
      setNormalScrolls(profile.normal_scrolls || 0);
      setBlessedScrolls(profile.blessed_scrolls || 0);
      setProtectScrolls(profile.protect_scrolls || 0);

      const { data: weapons, error: weaponErr } = await supabase.from('weapons').select('*').eq('user_id', userId);
      if (weaponErr) throw weaponErr;

      let fetchedMain = weapons?.find(w => w.slot_type === 'main');
      let fetchedSub = weapons?.find(w => w.slot_type === 'sub');

      // 💡 집중 수정 구역: 새 무기를 생성할 때 무기의 고유 'id'를 직접 발행해서 보냄!
      if (!fetchedMain) {
        const newMain = { 
          id: generateUUID(), // 번호표 직접 수동 발행
          user_id: userId, 
          slot_type: 'main', 
          weapon_grade: 'rare', 
          enhancement_level: 9, 
          name: '정령의 마검', 
          attack: 310, 
          protect_count: 3 
        };
        const { data: mData, error: errM } = await supabase.from('weapons').insert([newMain]).select().maybeSingle();
        if (errM) alert(`🚨 메인 무기 저장 실패: ${errM.message}`);
        fetchedMain = mData || newMain; 
      }
      
      if (!fetchedSub) {
        const newSub = { 
          id: generateUUID(), // 번호표 직접 수동 발행
          user_id: userId, 
          slot_type: 'sub', 
          weapon_grade: 'normal', 
          enhancement_level: 0, 
          name: '초보자의 목검', 
          attack: 10, 
          protect_count: 3 
        };
        const { data: sData, error: errS } = await supabase.from('weapons').insert([newSub]).select().maybeSingle();
        if (errS) alert(`🚨 서브 무기 저장 실패: ${errS.message}`);
        fetchedSub = sData || newSub; 
      }

      setMainWeapon(fetchedMain);
      setSubWeapon(fetchedSub);
      setShowIntro(false);
      setLoading(false);
    } catch (error) {
      setLoadError(error.message); 
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          throw new Error("환경변수(.env.local)가 없습니다. 서버를 재시작해주세요.");
        }
        const { data: { session } } = await supabase.auth.getSession();
        let userId = session?.user?.id;
        
        if (!userId) {
          userId = localStorage.getItem('game_guest_uuid');
          if (!userId) {
            userId = generateUUID();
            localStorage.setItem('game_guest_uuid', userId);
          }
        }
        setUser(userId);
        await loadGameData(userId);
      } catch (error) {
        setLoadError(error.message);
      }
    };
    initApp();
  }, []);

  const handleStartNewGame = async () => {
    if (!tempNickname.trim()) return alert("닉네임을 입력해주세요!");
    setLoading(true);
    
    const newProfile = { 
      id: user, nickname: tempNickname.trim(), points: 1000000, 
      weapon_boxes: 2, scroll_boxes: 3, normal_scrolls: 10, blessed_scrolls: 5, protect_scrolls: 3 
    };
    
    const { error } = await supabase.from('game_profiles').upsert([newProfile]);
    if (error) {
      alert(`🚨 프로필 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }
    await loadGameData(user);
  };

  const handleNicknameUpdate = async (e) => {
    let newName = e.target.value.trim();
    if (!newName) newName = '이름없음';
    setNickname(newName);
    if (user) {
      const { error } = await supabase.from('game_profiles').update({ nickname: newName }).eq('id', user);
      if (error) alert(`🚨 닉네임 저장 실패: ${error.message}`);
    }
  };

  const handleBuyBox = async (type, baseCost, qty) => {
    const totalCost = baseCost * qty;
    if (points < totalCost) return alert('포인트가 부족합니다!');
    if (!window.confirm(`💰 ${totalCost} P로 구매하시겠습니까?`)) return;
    
    const newPoints = points - totalCost;
    setPoints(newPoints);
    let updates = { points: newPoints };
    if (type === 'weapon') {
      setWeaponBoxes(prev => prev + qty); updates.weapon_boxes = weaponBoxes + qty; setBuyQtyWeapon(1);
    } else {
      setScrollBoxes(prev => prev + qty); updates.scroll_boxes = scrollBoxes + qty; setBuyQtyScroll(1);
    }
    
    const { error } = await supabase.from('game_profiles').update(updates).eq('id', user);
    if (error) alert(`🚨 상점 재화 저장 실패: ${error.message}`);
  };

  const handleOpenWeaponBox = async () => {
    if (weaponBoxes <= 0) return alert('무기 상자가 없습니다!');
    if (!subWeapon?.id) return alert('⚠️ 에러: 무기 ID가 누락되었습니다.');
    if (subWeapon?.enhancement_level > 0 && !window.confirm("서브 무기가 초기화됩니다. 진행합니까?")) return;
    
    setActiveGacha('weapon');
    const newWeaponBoxes = weaponBoxes - 1;
    setWeaponBoxes(newWeaponBoxes);
    
    const { error: pErr } = await supabase.from('game_profiles').update({ weapon_boxes: newWeaponBoxes }).eq('id', user);
    if (pErr) alert(`🚨 상자 수량 차감 실패: ${pErr.message}`);

    setTimeout(async () => {
      const rand = Math.random() * 100;
      let newGrade = 'normal';
      if (rand <= 0.1) newGrade = 'legendary';
      else if (rand <= 1.1) newGrade = 'epic';
      else if (rand <= 6.1) newGrade = 'rare';
      else if (rand <= 21.1) newGrade = 'magic';

      const baseAtk = { normal: 10, magic: 25, rare: 60, epic: 150, legendary: 400 }[newGrade];
      const newName = { normal: '초보자의 목검', magic: '강철 롱소드', rare: '정령의 기사검', epic: '파멸의 마검', legendary: '집행자의 황금검' }[newGrade];
      
      const newWeaponData = { weapon_grade: newGrade, enhancement_level: 0, name: newName, attack: baseAtk, protect_count: 3 };
      
      const { data: updatedSub, error: wErr } = await supabase.from('weapons').update(newWeaponData).eq('id', subWeapon.id).select().maybeSingle();
      if (wErr) alert(`🚨 가챠 무기 DB 저장 실패: ${wErr.message}`);
      
      setSubWeapon(updatedSub || newWeaponData);
      setPopupMsg(`🎉 [${getGradeLabel(newGrade)}] ${newName}을(를) 획득했습니다!`);
      setActiveGacha(null);
    }, 800);
  };

  const handleOpenScrollBox = async () => {
    if (scrollBoxes <= 0) return alert('주문서 상자가 없습니다!');
    setActiveGacha('scroll');
    const newScrollBoxes = scrollBoxes - 1;
    setScrollBoxes(newScrollBoxes);

    setTimeout(async () => {
      const rand = Math.random() * 100;
      let type, msg;
      const updates = { scroll_boxes: newScrollBoxes };
      if (rand <= 20) { type = 'protect_scrolls'; msg = '🛡️ 파괴방지 주문서 획득!'; setProtectScrolls(p => p + 1); updates.protect_scrolls = protectScrolls + 1; }
      else if (rand <= 50) { type = 'blessed_scrolls'; msg = '✨ 축복받은 무기 강화 주문서 획득!'; setBlessedScrolls(p => p + 1); updates.blessed_scrolls = blessedScrolls + 1; }
      else { type = 'normal_scrolls'; msg = '📜 무기 강화 주문서 획득!'; setNormalScrolls(p => p + 1); updates.normal_scrolls = normalScrolls + 1; }
      
      const { error } = await supabase.from('game_profiles').update(updates).eq('id', user);
      if (error) alert(`🚨 주문서 획득 DB 저장 실패: ${error.message}`);
      
      setPopupMsg(msg);
      setActiveGacha(null);
    }, 500);
  };

  const handleSwap = async () => {
    const mainId = mainWeapon?.id; const subId = subWeapon?.id;
    if (!mainId || !subId) return alert('⚠️ 에러: 무기 ID가 누락되었습니다.');
    
    const t = mainWeapon; setMainWeapon({ ...subWeapon, id: mainId }); setSubWeapon({ ...t, id: subId }); 
    setUseProtectMain(false); setUseProtectSub(false);

    const { error: errM } = await supabase.from('weapons').update({ weapon_grade: subWeapon.weapon_grade, enhancement_level: subWeapon.enhancement_level, name: subWeapon.name, attack: subWeapon.attack, protect_count: subWeapon.protect_count }).eq('id', mainId);
    const { error: errS } = await supabase.from('weapons').update({ weapon_grade: mainWeapon.weapon_grade, enhancement_level: mainWeapon.enhancement_level, name: mainWeapon.name, attack: mainWeapon.attack, protect_count: mainWeapon.protect_count }).eq('id', subId);
    
    if (errM || errS) alert(`🚨 무기 위치 스왑 DB 저장 실패: ${errM?.message || errS?.message}`);
  };

  const executeEnhance = async (slot) => {
    setWarningTarget(null); setEnhancingSlot(slot);
    const targetWeapon = slot === 'main' ? mainWeapon : subWeapon;
    const isProtecting = slot === 'main' ? useProtectMain : useProtectSub;
    if (!targetWeapon?.id) return alert('⚠️ 에러: 무기 고유 ID가 없습니다.');

    let pUpdates = {};
    if (selectedScrollType === 'normal') { setNormalScrolls(p => p - 1); pUpdates.normal_scrolls = normalScrolls - 1; } 
    else { setBlessedScrolls(p => p - 1); pUpdates.blessed_scrolls = blessedScrolls - 1; }
    if (isProtecting) { setProtectScrolls(p => p - 1); pUpdates.protect_scrolls = protectScrolls - 1; }
    
    const { error: pErr } = await supabase.from('game_profiles').update(pUpdates).eq('id', user);
    if (pErr) alert(`🚨 강화 주문서 소모 실패: ${pErr.message}`);

    setTimeout(async () => {
      const rate = getSuccessRate(targetWeapon.enhancement_level);
      const isSuccess = (Math.random() * 100) < rate;
      let newWeaponData = { ...targetWeapon };
      let resultMsg = '';

      if (isSuccess) {
        const plus = selectedScrollType === 'blessed' ? Math.floor(Math.random() * 3) + 1 : 1;
        newWeaponData.enhancement_level += plus; newWeaponData.attack += (plus * 50);
        resultMsg = `🎉 강화 성공! (+${plus})\n공격력이 대폭 상승했습니다!`;
      } else {
        if (isProtecting) {
          newWeaponData.protect_count -= 1;
          resultMsg = `💥 강화 실패!\n하지만 파괴방지 주문서가 무기를 보호했습니다. (남은 방어 횟수: ${newWeaponData.protect_count})`;
        } else {
          newWeaponData = { ...targetWeapon, weapon_grade: 'normal', enhancement_level: 0, name: '초보자의 목검', attack: 10, protect_count: 3 };
          resultMsg = `💀 쨍그랑!\n무기가 형체도 없이 파괴되었습니다...`;
        }
      }

      const { data: updatedWeapon, error: wErr } = await supabase.from('weapons').update({
        weapon_grade: newWeaponData.weapon_grade, enhancement_level: newWeaponData.enhancement_level, name: newWeaponData.name, attack: newWeaponData.attack, protect_count: newWeaponData.protect_count
      }).eq('id', targetWeapon.id).select().maybeSingle();

      if (wErr) alert(`🚨 강화 결과 DB 반영 실패: ${wErr.message}`);

      if (slot === 'main') { setMainWeapon(updatedWeapon || newWeaponData); setUseProtectMain(false); } 
      else { setSubWeapon(updatedWeapon || newWeaponData); setUseProtectSub(false); }
      setEnhancingSlot(null); setPopupMsg(resultMsg);
    }, 1200);
  };

  const clickEnhance = (slot) => {
    const hasScroll = selectedScrollType === 'normal' ? normalScrolls > 0 : blessedScrolls > 0;
    if (!hasScroll) return alert('선택한 주문서가 부족합니다!');
    const targetWeapon = slot === 'main' ? mainWeapon : subWeapon;
    const isProtecting = slot === 'main' ? useProtectMain : useProtectSub;
    if (isProtecting) {
      if (protectScrolls <= 0) return alert('파괴방지 주문서가 없습니다!');
      if (targetWeapon?.protect_count <= 0) return alert('이 무기는 더 이상 파괴방지 주문서를 견딜 수 없습니다!');
    }
    if (slot === 'main') setWarningTarget('main'); else executeEnhance('sub');
  };

  if (loading) return (
    <div className="h-screen bg-gray-950 flex flex-col justify-center items-center text-white font-bold p-6 text-center">
      {loadError ? (
        <div className="text-red-400">
          <span className="text-3xl mb-4 block">🚨</span>
          <p className="mb-2">로딩 중 에러가 발생했습니다:</p>
          <p className="text-xs text-red-300 bg-red-900/30 p-3 rounded">{loadError}</p>
        </div>
      ) : (
        "대장간 문을 여는 중... ⚔️"
      )}
    </div>
  );

  if (showIntro) {
    return (
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex flex-col items-center justify-center bg-gray-950 text-white font-sans overflow-hidden overscroll-none touch-none border-x border-gray-900 shadow-2xl z-50 px-6" style={{ height: 'calc(100dvh - 50px)' }}>
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="text-7xl mb-6 drop-shadow-[0_0_25px_rgba(234,179,8,0.6)]">🗡️</div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2">무기 강화소</h1>
          <p className="text-sm text-gray-400 font-bold tracking-widest">당신의 전설이 시작됩니다</p>
        </div>
        
        <div className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl text-center">
          <h2 className="text-sm font-bold text-gray-200 mb-5">대장간에 입장하실 이름을 정해주세요.</h2>
          <input 
            type="text" 
            value={tempNickname}
            onChange={(e) => setTempNickname(e.target.value)}
            maxLength={10}
            className="w-full bg-gray-950 border-2 border-gray-700 rounded-xl p-4 text-center text-white font-black text-lg mb-6 focus:outline-none focus:border-yellow-500 transition-colors placeholder-gray-600"
            placeholder="예: 울산검객"
          />
          <button 
            onClick={handleStartNewGame}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all active:scale-95 text-sm"
          >
            대장간 입장하기 (100만 P 지급)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex flex-col bg-gray-950 text-white font-sans overflow-hidden overscroll-none touch-none border-x border-gray-900 shadow-2xl z-40" style={{ height: 'calc(100dvh - 50px)' }}>
      
      <header className="flex justify-between items-center h-12 px-4 bg-gray-900 border-b border-gray-800 shrink-0">
        <h1 className="font-bold text-base text-gray-100">무기 강화소</h1>
        <button className="text-gray-300 hover:text-white p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </header>

      <div className="bg-gray-800 px-3 py-1.5 flex justify-between items-center shrink-0 shadow-md">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 mb-0.5">
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)}
              onBlur={handleNicknameUpdate}
              maxLength={10}
              className="bg-transparent text-[11px] font-bold text-gray-300 leading-tight w-20 outline-none border-b border-gray-600 focus:border-blue-400 focus:text-white transition-colors"
            />
            <span className="text-[9px] opacity-60">✏️</span>
          </div>
          <span className="text-yellow-400 font-black text-xs leading-tight">💰 {points.toLocaleString()} P</span>
        </div>
        <div className="flex gap-2 text-[10px] font-bold">
          <span className="text-gray-300">📜일반: {normalScrolls}</span>
          <span className="text-cyan-300">✨축복: {blessedScrolls}</span>
          <span className="text-blue-400">🛡️파괴방지: {protectScrolls}</span>
        </div>
      </div>

      <div className="flex gap-1 px-2 py-1.5 shrink-0 bg-gray-950">
        <button onClick={() => setSelectedScrollType('normal')} className={`flex-1 py-1.5 rounded-lg border flex justify-center items-center transition-all ${selectedScrollType === 'normal' ? 'bg-blue-600 border-blue-400 text-white shadow-md' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
          <span className="text-[11px] font-black">📜 일반 (+1)</span>
        </button>
        <button onClick={() => setSelectedScrollType('blessed')} className={`flex-1 py-1.5 rounded-lg border flex justify-center items-center transition-all ${selectedScrollType === 'blessed' ? 'bg-cyan-600 border-cyan-300 text-white shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
          <span className="text-[11px] font-black">✨ 축복 (+1~+3)</span>
        </button>
      </div>

      <main className="flex-1 min-h-0 flex flex-col px-2 gap-1 justify-center overflow-hidden">
        
        <div className={`flex-1 flex flex-col justify-between border-2 rounded-xl p-2 shadow-lg min-h-0 transition-all ${gradeCardStyles[mainWeapon?.weapon_grade || 'normal']}`}>
          <div className="flex justify-between items-start shrink-0">
            <div className="text-left flex flex-col justify-center">
              <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${gradeTextColors[mainWeapon?.weapon_grade || 'normal']}`}>[{getGradeLabel(mainWeapon?.weapon_grade || 'normal')}]</span>
              <h3 className={`text-xs font-black leading-tight ${gradeTextColors[mainWeapon?.weapon_grade || 'normal']}`}>+{mainWeapon?.enhancement_level || 0} {mainWeapon?.name || '무기 없음'}</h3>
              <div className="mt-1 inline-block bg-gray-950 border border-gray-700 px-1.5 py-0.5 rounded w-max">
                <p className="text-[9px] font-bold text-gray-300">⚔️ 공격력: {mainWeapon?.attack?.toLocaleString() || 0}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <label className="flex items-center gap-1 text-[9px] font-bold text-gray-200 bg-gray-950 px-1.5 py-1 rounded border border-gray-700 cursor-pointer">
                <input type="checkbox" checked={useProtectMain && protectScrolls > 0 && (mainWeapon?.protect_count || 0) > 0} onChange={(e) => setUseProtectMain(e.target.checked)} disabled={protectScrolls <= 0 || (mainWeapon?.protect_count || 0) <= 0} className="w-3 h-3 accent-blue-500" />
                <span>파괴방지 적용</span>
              </label>
              <p className="text-[8px] text-gray-400 mt-0.5 text-right leading-tight">사용 가능 횟수 <span className="text-[9px] text-blue-400">{mainWeapon?.protect_count || 0} / 3회</span></p>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex justify-center items-center py-1">
            <div className={`text-5xl md:text-6xl ${getAuraEffect(mainWeapon?.enhancement_level || 0)} ${enhancingSlot === 'main' ? 'animate-pulse scale-125' : 'transition-transform'}`}>🗡️</div>
          </div>
          <button onClick={() => clickEnhance('main')} disabled={enhancingSlot !== null} className="shrink-0 w-full font-black py-2 rounded-lg text-white text-xs border-2 bg-red-600 hover:bg-red-500 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all">
            {enhancingSlot === 'main' ? '강화 진행 중...' : `[본장비] 강화 시도 (${getSuccessRate(mainWeapon?.enhancement_level || 0)}%)`}
          </button>
        </div>

        <div className="flex justify-center -my-2.5 z-20 shrink-0">
          <button onClick={handleSwap} className="bg-gray-800 border-2 border-gray-500 text-[9px] font-bold px-3 py-1 rounded-full shadow-2xl flex items-center gap-1 active:scale-95 transition-transform text-white">
            <span>⬆️</span> 무기 교체 <span>⬇️</span>
          </button>
        </div>

        <div className={`flex-1 flex flex-col justify-between border-2 rounded-xl p-2 shadow-lg min-h-0 transition-all ${gradeCardStyles[subWeapon?.weapon_grade || 'normal']}`}>
          <div className="flex justify-between items-start shrink-0">
            <div className="text-left flex flex-col justify-center">
              <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${gradeTextColors[subWeapon?.weapon_grade || 'normal']}`}>[{getGradeLabel(subWeapon?.weapon_grade || 'normal')}]</span>
              <h3 className={`text-xs font-black leading-tight ${gradeTextColors[subWeapon?.weapon_grade || 'normal']}`}>+{subWeapon?.enhancement_level || 0} {subWeapon?.name || '무기 없음'}</h3>
              <div className="mt-0.5 inline-block bg-gray-950 border border-gray-700 px-1 py-0.5 rounded w-max">
                <p className="text-[9px] font-bold text-gray-300">⚔️ 공격력: {subWeapon?.attack?.toLocaleString() || 0}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <label className="flex items-center gap-1 text-[9px] font-bold text-gray-200 bg-gray-950 px-1 py-0.5 rounded border border-gray-700 cursor-pointer">
                <input type="checkbox" checked={useProtectSub && protectScrolls > 0 && (subWeapon?.protect_count || 0) > 0} onChange={(e) => setUseProtectSub(e.target.checked)} disabled={protectScrolls <= 0 || (subWeapon?.protect_count || 0) <= 0} className="w-3 h-3 accent-blue-500" />
                <span>파괴방지 적용</span>
              </label>
              <p className="text-[8px] text-gray-400 mt-0.5 text-right leading-tight">사용 가능 횟수 <span className="text-[9px] text-blue-400">{subWeapon?.protect_count || 0} / 3회</span></p>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex justify-center items-center py-1">
            <div className={`text-5xl md:text-6xl ${getAuraEffect(subWeapon?.enhancement_level || 0)} ${enhancingSlot === 'sub' ? 'animate-pulse scale-125' : 'transition-transform'}`}>🗡️</div>
          </div>
          <button onClick={() => clickEnhance('sub')} disabled={enhancingSlot !== null} className="shrink-0 w-full font-black py-2 rounded-lg text-white text-xs border-2 bg-blue-600 hover:bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all">
            {enhancingSlot === 'sub' ? '강화 진행 중...' : `[서브장비] 강화 시도 (${getSuccessRate(subWeapon?.enhancement_level || 0)}%)`}
          </button>
        </div>
      </main>

      <div className="px-2 pt-1 pb-1 shrink-0">
        <div className="bg-gray-800 rounded-lg p-1.5 border border-gray-700 flex flex-col">
          <h2 className="text-[10px] font-bold text-yellow-400 mb-1 pl-1">🛒 포인트 상점</h2>
          <div className="flex gap-1.5">
              {[ { type: 'scroll', name: '의문의 주문서', cost: 300, qty: buyQtyScroll, setQty: setBuyQtyScroll }, { type: 'weapon', name: '고급 무기', cost: 1000, qty: buyQtyWeapon, setQty: setBuyQtyWeapon } ].map(item => (
                  <div key={item.type} className="flex-1 bg-gray-900 p-1.5 rounded-md text-center border border-gray-700 flex flex-col justify-between">
                      <p className="text-[9px] font-bold text-gray-300">{item.name} 상자</p>
                      <div className="flex justify-center items-center gap-1 my-1 bg-gray-800 py-0.5 rounded">
                        <button onClick={() => item.setQty(prev => Math.max(1, prev-1))} className="text-gray-300 px-2 font-black text-xs">-</button>
                        <span className="text-[9px] font-bold w-3">{item.qty}</span>
                        <button onClick={() => item.setQty(prev => prev+1)} className="text-gray-300 px-2 font-black text-xs">+</button>
                      </div>
                      <button onClick={() => handleBuyBox(item.type, item.cost, item.qty)} className="w-full bg-yellow-600 font-bold text-[9px] py-1 rounded text-white active:bg-yellow-500">
                        구매 ({item.cost * item.qty}P)
                      </button>
                  </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 px-2 pt-2 pb-8 bg-gray-900 border-t border-gray-800 shrink-0">
        <button onClick={handleOpenScrollBox} disabled={activeGacha !== null} className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-[12px] font-black shadow-md">
          📦 주문서 상자 열기 ({scrollBoxes})
        </button>
        <button onClick={handleOpenWeaponBox} disabled={activeGacha !== null} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 rounded-lg text-[12px] font-black shadow-md">
          ⚔️ 무기 상자 열기 ({weaponBoxes})
        </button>
      </div>

      {popupMsg && <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6"><div className="bg-gray-800 p-5 rounded-xl border-2 border-yellow-500 text-center w-full max-w-sm"><h2 className="text-white font-bold leading-relaxed whitespace-pre-line text-xs mb-4">{popupMsg}</h2><button onClick={() => setPopupMsg(null)} className="w-full bg-yellow-600 py-2 rounded-lg font-black text-white text-sm">확인</button></div></div>}
      {warningTarget === 'main' && <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6"><div className="bg-gray-900 border-2 border-red-600 p-5 rounded-xl text-center w-full max-w-sm"><h2 className="text-base font-black text-red-500 mb-2">⚠️ 위험 알림</h2><p className="text-gray-300 text-[11px] mb-4">메인 무기 파괴 시 복구가 불가능합니다. 지르시겠습니까?</p><div className="flex gap-2"><button onClick={() => setWarningTarget(null)} className="flex-1 bg-gray-700 py-2 rounded-lg text-xs font-bold text-gray-300">후퇴</button><button onClick={() => executeEnhance('main')} className="flex-1 bg-red-600 py-2 rounded-lg text-xs font-black text-white">상남자 직진</button></div></div></div>}
      
    </div>
  );
}