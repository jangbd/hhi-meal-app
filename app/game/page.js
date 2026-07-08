"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

// 고유 ID 생성기
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function GameLobby() {
  const [activeTab, setActiveTab] = useState('arena'); 

  // --- 유저 및 상태 변수 ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); 
  const [showIntro, setShowIntro] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [nickname, setNickname] = useState('');
  
  // 재화 분리: 결투 포인트(points)와 상점 재화(dang)
  const [points, setPoints] = useState(0); 
  const [dang, setDang] = useState(0); 

  // 아이템 보유량
  const [weaponBoxes, setWeaponBoxes] = useState(0);        
  const [scrollBoxes, setScrollBoxes] = useState(0); 
  const [normalScrolls, setNormalScrolls] = useState(0); 
  const [blessedScrolls, setBlessedScrolls] = useState(0); 
  const [protectScrolls, setProtectScrolls] = useState(0); 

  // 장비 및 인벤토리
  const [mainWeapon, setMainWeapon] = useState(null);
  const [subWeapon, setSubWeapon] = useState(null);
  const [inventory, setInventory] = useState([]); 

  // 게임 진행 상호작용 상태
  const [enhancingSlot, setEnhancingSlot] = useState(null);
  const [activeGacha, setActiveGacha] = useState(null); 
  const [popupMsg, setPopupMsg] = useState(null);
  const [warningTarget, setWarningTarget] = useState(null); 
  const [selectedScrollType, setSelectedScrollType] = useState('normal'); 
  const [useProtectMain, setUseProtectMain] = useState(false);
  const [useProtectSub, setUseProtectSub] = useState(false);
  const [buyQtyScroll, setBuyQtyScroll] = useState(1);
  const [buyQtyWeapon, setBuyQtyWeapon] = useState(1);
  const [selectedInvItem, setSelectedInvItem] = useState(null);

  // 투기장(랭킹) 상태
  const [rankType, setRankType] = useState('attack');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingRank, setLoadingRank] = useState(false);
  const [duelingTarget, setDuelingTarget] = useState(null); 

  // --- UI 디자인 설정 ---
  const gradeCardStyles = {
    normal: 'border-gray-500 bg-gray-900/40 shadow-[inset_0_0_10px_rgba(156,163,175,0.1)]',
    magic: 'border-green-400 bg-green-950/10 shadow-[inset_0_0_10px_rgba(74,222,128,0.2)]',
    rare: 'border-blue-400 bg-blue-950/20 shadow-[inset_0_0_15px_rgba(96,165,250,0.3)]',
    epic: 'border-purple-400 bg-purple-950/20 shadow-[inset_0_0_15px_rgba(192,132,252,0.3)]',
    legendary: 'border-yellow-400 bg-yellow-950/20 shadow-[inset_0_0_20px_rgba(250,204,21,0.4)]'
  };
  const gradeTextColors = { normal: 'text-gray-400', magic: 'text-green-400', rare: 'text-blue-400 font-extrabold', epic: 'text-purple-400 font-extrabold', legendary: 'text-yellow-400 font-extrabold' };
  const getGradeLabel = (grade) => ({ normal: '일반', magic: '마법', rare: '희귀', epic: '에픽', legendary: '전설' }[grade] || '일반');
  const getSuccessRate = (level) => {
    if (level >= 12) return 1; if (level >= 11) return 3; if (level >= 10) return 5;
    if (level >= 9) return 10; if (level >= 8) return 15; if (level >= 7) return 25;
    if (level >= 6) return 40; if (level >= 5) return 60; if (level >= 4) return 80; return 100;
  };
  const getAuraEffect = (level) => {
    if (level >= 10) return 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)) scale-110';
    if (level >= 7) return 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.8)) scale-105'; return '';
  };

  // 💡 [데이터 동기화 핵심 함수]
  const loadGameData = useCallback(async (userId) => {
    try {
      let { data: profile, error: profileErr } = await supabase.from('game_profiles').select('*').eq('id', userId).maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile) { setShowIntro(true); setLoading(false); return; }

      setNickname(profile.nickname || '이름없음'); 
      setPoints(profile.points || 0); 
      setDang(profile.dang || 0); 
      setWeaponBoxes(profile.weapon_boxes || 0); 
      setScrollBoxes(profile.scroll_boxes || 0);
      setNormalScrolls(profile.normal_scrolls || 0); 
      setBlessedScrolls(profile.blessed_scrolls || 0); 
      setProtectScrolls(profile.protect_scrolls || 0);

      const { data: weapons, error: weaponErr } = await supabase.from('weapons').select('*').eq('user_id', userId);
      if (weaponErr) throw weaponErr;

      let fetchedMain = weapons?.find(w => w.slot_type === 'main');
      let fetchedSub = weapons?.find(w => w.slot_type === 'sub');
      let fetchedInventory = weapons?.filter(w => w.slot_type === 'inventory') || []; 

      setMainWeapon(fetchedMain || null); 
      setSubWeapon(fetchedSub || null); 
      setInventory(fetchedInventory);
      setShowIntro(false); 
      setLoading(false);
    } catch (error) { setLoadError(error.message); }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("환경변수 오류");
        const { data: { session } } = await supabase.auth.getSession();
        let userId = session?.user?.id || localStorage.getItem('game_guest_uuid');
        if (!userId) { userId = generateUUID(); localStorage.setItem('game_guest_uuid', userId); }
        setUser(userId); await loadGameData(userId);
      } catch (error) { setLoadError(error.message); }
    };
    initApp();
  }, [loadGameData]);

  // 투기장 랭킹 로직
  useEffect(() => {
    if (activeTab === 'arena') {
      const fetchRank = async () => {
        setLoadingRank(true);
        try {
          const { data: profiles } = await supabase.from('game_profiles')
            .select('id, nickname, points')
            .limit(50);
            
          if (profiles && profiles.length > 0) {
            const { data: allMainWeapons } = await supabase.from('weapons')
              .select('*')
              .eq('slot_type', 'main');

            const rankData = profiles.map(p => {
              const main = (allMainWeapons || []).find(w => w.user_id === p.id);
              return { 
                ...p, 
                mainWeapon: main || { name: '맨주먹', attack: 0, enhancement_level: 0, weapon_grade: 'normal' } 
              };
            });

            rankData.sort((a, b) => {
              if (rankType === 'attack') return b.mainWeapon.attack - a.mainWeapon.attack;
              if (rankType === 'enhance') return b.mainWeapon.enhancement_level - a.mainWeapon.enhancement_level;
              return b.points - a.points; 
            });
            
            setLeaderboard(rankData.slice(0, 10)); 
          } else { setLeaderboard([]); }
        } catch (e) { console.error(e); }
        setLoadingRank(false);
      };
      fetchRank();
    }
  }, [activeTab, rankType, mainWeapon]); 

  // 결투 진행
  const handleDuel = async (target) => {
    const myAtk = (mainWeapon?.attack || 0) + (subWeapon?.attack || 0);
    if (myAtk === 0) return alert('장착된 무기가 없습니다! 무기를 먼저 장착하고 도전하세요.');

    setDuelingTarget(target);

    setTimeout(async () => {
      const myPower = Math.floor(myAtk * (0.8 + Math.random() * 0.4));
      const targetBaseAtk = target.mainWeapon?.attack || 0;
      const targetPower = Math.floor(targetBaseAtk * (0.8 + Math.random() * 0.4));

      let resultMsg = '';
      if (myPower >= targetPower) {
        const reward = 50; 
        const newPoints = points + reward;
        setPoints(newPoints); 
        await supabase.from('game_profiles').update({ points: newPoints }).eq('id', user); 
        resultMsg = `⚔️ [결투 승리!] ⚔️\n\n내 전투력: ${myPower.toLocaleString()}\n상대 전투력: ${targetPower.toLocaleString()}\n\n명예로운 승리로 결투 포인트 ${reward} P를 획득했습니다!`;
      } else {
        const penalty = 20; 
        const newPoints = Math.max(0, points - penalty);
        setPoints(newPoints); 
        await supabase.from('game_profiles').update({ points: newPoints }).eq('id', user); 
        resultMsg = `💀 [결투 패배] 💀\n\n내 전투력: ${myPower.toLocaleString()}\n상대 전투력: ${targetPower.toLocaleString()}\n\n패배의 대가로 결투 포인트 ${penalty} P를 잃었습니다... 강해져서 돌아오십시오.`;
      }
      
      setDuelingTarget(null);
      setPopupMsg(resultMsg);
      await loadGameData(user); // 결과 반영 후 즉각 최신화
    }, 2000); 
  };

  const handleStartNewGame = async () => { 
    if (!tempNickname.trim()) return alert("닉네임을 입력해주세요!");
    setLoading(true);

    const newProfile = { id: user, nickname: tempNickname.trim(), points: 1000, dang: 1000000, weapon_boxes: 2, scroll_boxes: 3, normal_scrolls: 10, blessed_scrolls: 5, protect_scrolls: 3 };
    await supabase.from('game_profiles').upsert([newProfile]);
    
    const initialMain = { id: generateUUID(), user_id: user, slot_type: 'main', weapon_grade: 'rare', enhancement_level: 9, name: '정령의 마검', attack: 310, protect_count: 3 };
    const initialSub = { id: generateUUID(), user_id: user, slot_type: 'sub', weapon_grade: 'normal', enhancement_level: 0, name: '초보자의 목검', attack: 10, protect_count: 3 };
    await supabase.from('weapons').insert([initialMain, initialSub]);
    
    await loadGameData(user);
  };
  
  const handleNicknameUpdate = async (e) => { 
    let newName = e.target.value.trim(); if (!newName) newName = '이름없음';
    setNickname(newName); 
    if (user) {
      await supabase.from('game_profiles').update({ nickname: newName }).eq('id', user);
    }
  };

  const handleBuyBox = async (type, baseCost, qty) => {
    const totalCost = baseCost * qty;
    if (dang < totalCost) return alert('댕이 부족합니다!');
    if (!window.confirm(`💰 ${totalCost} 댕으로 구매하시겠습니까?`)) return;
    
    const newDang = dang - totalCost; 
    setDang(newDang); 

    let updates = { dang: newDang };
    if (type === 'weapon') { 
      setWeaponBoxes(prev => prev + qty); 
      updates.weapon_boxes = weaponBoxes + qty; 
      setBuyQtyWeapon(1); 
    } else { 
      setScrollBoxes(prev => prev + qty); 
      updates.scroll_boxes = scrollBoxes + qty; 
      setBuyQtyScroll(1); 
    }
    
    await supabase.from('game_profiles').update(updates).eq('id', user);
    await loadGameData(user); 
  };

  // 💡 [핵심 해결] 무기가 절대 증발하지 않는 100% 안전한 상자 열기 로직
  const handleOpenWeaponBox = async () => {
    if (weaponBoxes <= 0) return alert('무기 상자가 없습니다!');
    if (inventory.length >= 10) return alert('🎒 가방이 가득 찼습니다! 무기를 장착하거나 판매하세요.');
    
    setActiveGacha('weapon');
    
    const nextWeaponBoxes = weaponBoxes - 1;
    setWeaponBoxes(nextWeaponBoxes); 
    
    const rand = Math.random() * 100; let newGrade = 'normal';
    if (rand <= 0.1) newGrade = 'legendary'; else if (rand <= 1.1) newGrade = 'epic'; else if (rand <= 6.1) newGrade = 'rare'; else if (rand <= 21.1) newGrade = 'magic';
    const baseAtk = { normal: 10, magic: 25, rare: 60, epic: 150, legendary: 400 }[newGrade];
    const newName = { normal: '초보자의 목검', magic: '강철 롱소드', rare: '정령의 기사검', epic: '파멸의 마검', legendary: '집행자의 황금검' }[newGrade];
    const newWeaponData = { id: generateUUID(), user_id: user, slot_type: 'inventory', weapon_grade: newGrade, enhancement_level: 0, name: newName, attack: baseAtk, protect_count: 3 };

    try {
      // 💡 1. DB에 완전히 기록이 끝날 때까지 기다립니다.
      await Promise.all([
        supabase.from('game_profiles').update({ weapon_boxes: nextWeaponBoxes }).eq('id', user),
        supabase.from('weapons').insert([newWeaponData])
      ]);
      
      // 💡 2. DB 저장이 완료된 후, 딜레이를 주고 화면에 반영합니다.
      setTimeout(async () => {
        setInventory(prev => [...prev, newWeaponData]); // 화면 갱신
        setPopupMsg(`🎉 [${getGradeLabel(newGrade)}] ${newName} 획득!\n(가방에 보관되었습니다)`); 
        setActiveGacha(null);
        await loadGameData(user); // 완벽 동기화
      }, 800);

    } catch (error) {
      console.error("무기 저장 실패:", error);
      alert("무기를 가방에 넣는 중 오류가 발생했습니다. 다시 시도해주세요.");
      setActiveGacha(null);
      await loadGameData(user); // 실패 시 원상복구
    }
  };

  const handleOpenScrollBox = async () => {
    if (scrollBoxes <= 0) return alert('주문서 상자가 없습니다!');
    setActiveGacha('scroll');
    
    const nextScrollBoxes = scrollBoxes - 1;
    setScrollBoxes(nextScrollBoxes); 
    
    const rand = Math.random() * 100; let msg; 
    let updates = { scroll_boxes: nextScrollBoxes };

    if (rand <= 20) { msg = '🛡️ 파괴방지 주문서 획득!'; updates.protect_scrolls = protectScrolls + 1; }
    else if (rand <= 50) { msg = '✨ 축복받은 무기 강화 주문서 획득!'; updates.blessed_scrolls = blessedScrolls + 1; }
    else { msg = '📜 무기 강화 주문서 획득!'; updates.normal_scrolls = normalScrolls + 1; }
    
    try {
      // DB 기록 대기
      await supabase.from('game_profiles').update(updates).eq('id', user);
      
      setTimeout(async () => {
        setPopupMsg(msg); 
        setActiveGacha(null);
        await loadGameData(user); // 완벽 동기화
      }, 500);
    } catch (error) {
      console.error(error);
      setActiveGacha(null);
      await loadGameData(user);
    }
  };

  const handleEquip = async (targetSlot) => { 
    const currentEquipped = targetSlot === 'main' ? mainWeapon : subWeapon;
    const updatedNewItem = { ...selectedInvItem, slot_type: targetSlot };
    
    if (targetSlot === 'main') setMainWeapon(updatedNewItem); else setSubWeapon(updatedNewItem);
    setInventory(prev => { 
      const newInv = prev.filter(w => w.id !== selectedInvItem.id); 
      if (currentEquipped) newInv.push({ ...currentEquipped, slot_type: 'inventory' }); 
      return newInv; 
    });
    setSelectedInvItem(null); 
    setPopupMsg(`✅ 장착 완료!`);

    await supabase.from('weapons').update({ slot_type: targetSlot }).eq('id', selectedInvItem.id);
    if (currentEquipped) { await supabase.from('weapons').update({ slot_type: 'inventory' }).eq('id', currentEquipped.id); }
    
    await loadGameData(user); // 동기화
  };

  const handleSell = async () => {
    const basePrice = { normal: 100, magic: 300, rare: 1000, epic: 5000, legendary: 20000 }[selectedInvItem.weapon_grade];
    const sellPrice = basePrice + (selectedInvItem.enhancement_level * 500);
    if(!window.confirm(`${selectedInvItem.name}을(를) 판매하시겠습니까?\n판매 시 복구 불가하며 ${sellPrice.toLocaleString()} 댕을 획득합니다.`)) return;
    
    const newDang = dang + sellPrice;
    setDang(newDang); 
    setInventory(prev => prev.filter(w => w.id !== selectedInvItem.id)); 
    setSelectedInvItem(null); 
    setPopupMsg(`💰 판매 완료!\n${sellPrice.toLocaleString()} 댕을 획득했습니다.`);

    await supabase.from('weapons').delete().eq('id', selectedInvItem.id);
    await supabase.from('game_profiles').update({ dang: newDang }).eq('id', user);
    
    await loadGameData(user); // 동기화
  };

  const handleSwap = async () => { 
    if (!mainWeapon || !subWeapon) return;
    
    const tMain = mainWeapon ? { ...mainWeapon, slot_type: 'sub' } : null;
    const tSub = subWeapon ? { ...subWeapon, slot_type: 'main' } : null;
    setMainWeapon(tSub); setSubWeapon(tMain); setUseProtectMain(false); setUseProtectSub(false);

    await supabase.from('weapons').update({ slot_type: 'temp_slot' }).eq('id', mainWeapon.id);
    await supabase.from('weapons').update({ slot_type: 'main' }).eq('id', subWeapon.id);
    await supabase.from('weapons').update({ slot_type: 'sub' }).eq('id', mainWeapon.id);
    
    await loadGameData(user); // 동기화
  };

  const executeEnhance = async (slot) => { 
    setWarningTarget(null); setEnhancingSlot(slot);
    const targetWeapon = slot === 'main' ? mainWeapon : subWeapon;
    const isProtecting = slot === 'main' ? useProtectMain : useProtectSub;
    let pUpdates = {};
    
    if (selectedScrollType === 'normal') { pUpdates.normal_scrolls = normalScrolls - 1; } 
    else { pUpdates.blessed_scrolls = blessedScrolls - 1; }
    if (isProtecting) { pUpdates.protect_scrolls = protectScrolls - 1; }
    
    await supabase.from('game_profiles').update(pUpdates).eq('id', user);
    
    setTimeout(async () => {
      const rate = getSuccessRate(targetWeapon.enhancement_level); 
      const isSuccess = (Math.random() * 100) < rate;
      let resultMsg = '';
      
      if (isSuccess) {
        const plus = selectedScrollType === 'blessed' ? Math.floor(Math.random() * 3) + 1 : 1;
        let newLvl = targetWeapon.enhancement_level + plus; 
        let totalAddedAtk = 0; let min = 10, max = 20; 
        for(let i=0; i<plus; i++) {
            if(targetWeapon.weapon_grade === 'magic') { min=20; max=35; } else if(targetWeapon.weapon_grade === 'rare') { min=35; max=55; } else if(targetWeapon.weapon_grade === 'epic') { min=60; max=90; } else if(targetWeapon.weapon_grade === 'legendary') { min=100; max=150; }
            totalAddedAtk += Math.floor(Math.random() * (max - min + 1)) + min;
        }
        let newAtk = targetWeapon.attack + totalAddedAtk;
        resultMsg = `🎉 강화 성공! (+${plus})\n공격력이 [${totalAddedAtk}] 상승했습니다!\n(증가폭: ${min} ~ ${max} 중 랜덤)`;
        
        const updatedWeapon = { ...targetWeapon, enhancement_level: newLvl, attack: newAtk };
        if (slot === 'main') setMainWeapon(updatedWeapon); else setSubWeapon(updatedWeapon);
        
        await supabase.from('weapons').update({ enhancement_level: newLvl, attack: newAtk }).eq('id', targetWeapon.id);
      } else {
        if (isProtecting) {
          resultMsg = `💥 강화 실패!\n하지만 파괴방지 주문서가 무기를 보호했습니다.`;
          const updatedWeapon = { ...targetWeapon, protect_count: targetWeapon.protect_count - 1 };
          if (slot === 'main') setMainWeapon(updatedWeapon); else setSubWeapon(updatedWeapon);
          
          await supabase.from('weapons').update({ protect_count: targetWeapon.protect_count - 1 }).eq('id', targetWeapon.id);
        } else {
          resultMsg = `💀 쨍그랑!\n무기가 형체도 없이 파괴되었습니다...`;
          if (slot === 'main') setMainWeapon(null); else setSubWeapon(null);
          await supabase.from('weapons').delete().eq('id', targetWeapon.id);
        }
      }
      setEnhancingSlot(null); 
      setPopupMsg(resultMsg);
      await loadGameData(user); // 동기화
    }, 1200);
  };

  const clickEnhance = (slot) => {
    const targetWeapon = slot === 'main' ? mainWeapon : subWeapon;
    if (!targetWeapon) return alert('슬롯에 장착된 무기가 없습니다! 가방에서 무기를 장착하세요.');
    const hasScroll = selectedScrollType === 'normal' ? normalScrolls > 0 : blessedScrolls > 0;
    if (!hasScroll) return alert('선택한 주문서가 부족합니다!');
    const isProtecting = slot === 'main' ? useProtectMain : useProtectSub;
    if (isProtecting && (protectScrolls <= 0 || targetWeapon?.protect_count <= 0)) return alert('파괴방지 주문서가 부족하거나 방어 횟수가 없습니다!');
    if (slot === 'main') setWarningTarget('main'); else executeEnhance('sub');
  };

  // --- 화면 UI 파트 ---
  if (loading) return <div className="h-screen bg-gray-950 flex flex-col justify-center items-center text-white p-6 font-bold">서버 연결 중...</div>;

  if (showIntro) return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex flex-col items-center justify-center bg-gray-950 text-white font-sans overflow-hidden border-x border-gray-900 shadow-2xl z-50 px-6" style={{ height: 'calc(100dvh - 50px)' }}>
      <div className="text-center mb-8"><div className="text-7xl mb-4">🗡️</div><h1 className="text-4xl font-black text-yellow-500 mb-2 tracking-wider">무기키우기</h1></div>
      <div className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center shadow-xl">
        <h2 className="text-gray-300 text-xs font-bold mb-3">닉네임을 입력하세요</h2>
        <input type="text" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} maxLength={10} className="w-full bg-gray-950 border-2 border-gray-700 rounded-xl p-4 text-center text-white font-black text-lg mb-6 focus:border-yellow-500 outline-none transition-colors" placeholder="예: 무기장인" />
        <button onClick={handleStartNewGame} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 rounded-xl text-sm shadow-md transition-colors">대장간 입장하기 (100만 댕 지급)</button>
      </div>
    </div>
  );

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex flex-col bg-gray-950 text-white font-sans overflow-hidden border-x border-gray-900 shadow-2xl z-40" style={{ top: 0, bottom: '65px', height: 'auto' }}>
      
      <header className="flex justify-between items-center h-12 px-4 bg-gray-900 border-b border-gray-800 shrink-0">
        <h1 className="font-black text-lg text-yellow-500 tracking-wider">무기키우기</h1>
      </header>
      
      <div className="bg-gray-800 px-3 py-1.5 flex justify-between items-center shrink-0 shadow-md">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 mb-0.5">
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} onBlur={handleNicknameUpdate} maxLength={10} className="bg-transparent text-[11px] font-bold text-gray-300 w-20 outline-none border-b border-gray-600 focus:text-white" />
            <span className="text-[9px] opacity-60">✏️</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-black text-xs">💰 {dang.toLocaleString()} 댕</span>
            <span className="text-red-400 font-black text-[10px]">🏆 {points.toLocaleString()} P</span>
          </div>
        </div>
        <div className="flex gap-2 text-[10px] font-bold">
          <span className="text-gray-300">📜: {normalScrolls}</span>
          <span className="text-cyan-300">✨: {blessedScrolls}</span>
          <span className="text-blue-400">🛡️: {protectScrolls}</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-2">
        
        {/* ⚔️ 강화 탭 */}
        {activeTab === 'enhance' && (
          <div className="flex flex-col h-full gap-1 justify-between min-h-[450px]">
            <div className="flex gap-1 shrink-0 bg-gray-950 p-1">
              <button onClick={() => setSelectedScrollType('normal')} className={`flex-1 py-1.5 rounded-lg border font-black text-[11px] transition-all ${selectedScrollType === 'normal' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>📜 일반 (+1)</button>
              <button onClick={() => setSelectedScrollType('blessed')} className={`flex-1 py-1.5 rounded-lg border font-black text-[11px] transition-all ${selectedScrollType === 'blessed' ? 'bg-cyan-600 border-cyan-300 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>✨ 축복 (+1~3)</button>
            </div>
            
            <div className={`flex-1 flex flex-col justify-between border-2 rounded-xl p-2 shadow-lg transition-all ${mainWeapon ? gradeCardStyles[mainWeapon.weapon_grade] : 'border-gray-700 bg-gray-900'}`}>
              <div className="flex justify-between items-start shrink-0"><div className="flex flex-col"><span className={`text-[9px] font-bold tracking-wider mb-0.5 ${mainWeapon ? gradeTextColors[mainWeapon.weapon_grade] : 'text-gray-500'}`}>[{mainWeapon ? getGradeLabel(mainWeapon.weapon_grade) : '비어있음'}]</span><h3 className={`text-xs font-black ${mainWeapon ? gradeTextColors[mainWeapon.weapon_grade] : 'text-gray-500'}`}>{mainWeapon ? `+${mainWeapon.enhancement_level} ${mainWeapon.name}` : '무기를 장착하세요'}</h3><div className="mt-1 bg-gray-950 px-1.5 py-0.5 rounded w-max border border-gray-700"><p className="text-[9px] font-bold text-gray-300">⚔️ 공격력: {mainWeapon?.attack?.toLocaleString() || 0}</p></div></div><div className="text-right flex flex-col items-end"><label className="flex items-center gap-1 text-[9px] font-bold text-gray-200 bg-gray-950 px-1.5 py-1 rounded border border-gray-700 cursor-pointer"><input type="checkbox" checked={useProtectMain} onChange={(e) => setUseProtectMain(e.target.checked)} className="w-3 h-3 accent-blue-500" /><span>파괴방지 적용</span></label><p className="text-[8px] text-gray-400 mt-0.5">방어 가능 횟수 <span className="text-blue-400">{mainWeapon?.protect_count || 0} / 3</span></p></div></div>
              <div className="flex-1 flex justify-center items-center py-1"><div className={`text-5xl md:text-6xl ${mainWeapon ? getAuraEffect(mainWeapon.enhancement_level) : ''} ${enhancingSlot === 'main' ? 'animate-pulse scale-125' : ''}`}>{mainWeapon ? '🗡️' : '❌'}</div></div>
              <button onClick={() => clickEnhance('main')} disabled={enhancingSlot !== null || !mainWeapon} className={`shrink-0 w-full font-black py-2 rounded-lg text-white text-xs border-2 shadow-md ${mainWeapon ? 'bg-red-600 border-red-400' : 'bg-gray-700 border-gray-600'}`}>
                {!mainWeapon ? '장착된 무기 없음' : enhancingSlot === 'main' ? '강화 진행 중...' : `[본장비] 강화 시도 (${getSuccessRate(mainWeapon.enhancement_level)}%)`}
              </button>
            </div>

            <div className="flex justify-center -my-2.5 z-20 shrink-0"><button onClick={handleSwap} className="bg-gray-800 border-2 border-gray-500 text-[9px] font-bold px-3 py-1 rounded-full shadow-2xl active:scale-95 text-white">⬆️ 무기 교체 ⬇️</button></div>

            <div className={`flex-1 flex flex-col justify-between border-2 rounded-xl p-2 shadow-lg transition-all ${subWeapon ? gradeCardStyles[subWeapon.weapon_grade] : 'border-gray-700 bg-gray-900'}`}>
              <div className="flex justify-between items-start shrink-0"><div className="flex flex-col"><span className={`text-[9px] font-bold tracking-wider mb-0.5 ${subWeapon ? gradeTextColors[subWeapon.weapon_grade] : 'text-gray-500'}`}>[{subWeapon ? getGradeLabel(subWeapon.weapon_grade) : '비어있음'}]</span><h3 className={`text-xs font-black ${subWeapon ? gradeTextColors[subWeapon.weapon_grade] : 'text-gray-500'}`}>{subWeapon ? `+${subWeapon.enhancement_level} ${subWeapon.name}` : '무기를 장착하세요'}</h3><div className="mt-0.5 bg-gray-950 px-1 py-0.5 rounded w-max border border-gray-700"><p className="text-[9px] font-bold text-gray-300">⚔️ 공격력: {subWeapon?.attack?.toLocaleString() || 0}</p></div></div><div className="text-right flex flex-col items-end"><label className="flex items-center gap-1 text-[9px] font-bold text-gray-200 bg-gray-950 px-1 py-0.5 rounded border border-gray-700 cursor-pointer"><input type="checkbox" checked={useProtectSub} onChange={(e) => setUseProtectSub(e.target.checked)} className="w-3 h-3 accent-blue-500" /><span>파괴방지 적용</span></label><p className="text-[8px] text-gray-400 mt-0.5">방어 가능 횟수 <span className="text-blue-400">{subWeapon?.protect_count || 0} / 3</span></p></div></div>
              <div className="flex-1 flex justify-center items-center py-1"><div className={`text-5xl md:text-6xl ${subWeapon ? getAuraEffect(subWeapon.enhancement_level) : ''} ${enhancingSlot === 'sub' ? 'animate-pulse scale-125' : ''}`}>{subWeapon ? '🗡️' : '❌'}</div></div>
              <button onClick={() => clickEnhance('sub')} disabled={enhancingSlot !== null || !subWeapon} className={`shrink-0 w-full font-black py-2 rounded-lg text-white text-xs border-2 shadow-md ${subWeapon ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600'}`}>
                {!subWeapon ? '장착된 무기 없음' : enhancingSlot === 'sub' ? '강화 진행 중...' : `[서브장비] 강화 시도 (${getSuccessRate(subWeapon.enhancement_level)}%)`}
              </button>
            </div>
          </div>
        )}

        {/* 📦 창고/상점 탭 */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-4 pb-4">
            <div>
              <div className="flex justify-between items-center mb-2 pl-1 pr-1">
                  <h2 className="text-xs font-bold text-yellow-400">🎒 무기 보관함 ({inventory.length}/10)</h2>
                  <span className="text-[9px] text-gray-400">무기를 터치해 관리하세요</span>
              </div>
              <div className="grid grid-cols-5 gap-2 px-1">
                {Array(10).fill(0).map((_, i) => {
                  const item = inventory[i];
                  if (item) {
                      return (
                          <div onClick={() => setSelectedInvItem(item)} key={item.id} className={`aspect-square cursor-pointer active:scale-95 transition-transform bg-gray-900 rounded-md border-2 flex flex-col items-center justify-center p-1 shadow-md ${gradeCardStyles[item.weapon_grade]}`}>
                             <span className={`text-[9px] font-black ${gradeTextColors[item.weapon_grade]}`}>[{getGradeLabel(item.weapon_grade)}]</span>
                             <span className="text-[10px] font-bold truncate w-full text-center text-white">{item.name}</span>
                             <span className="text-[9px] text-yellow-500 font-black">+{item.enhancement_level}</span>
                          </div>
                      );
                  }
                  return <div key={`empty-${i}`} className="aspect-square bg-gray-900 rounded-md border border-gray-700 flex items-center justify-center text-gray-600 text-[10px] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">빈칸</div>;
                })}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-2 border border-gray-700 mx-1 flex flex-col">
              <h2 className="text-[10px] font-bold text-yellow-400 mb-2">🛒 포인트 상점</h2>
              <div className="flex gap-2">
                  {[ { type: 'scroll', name: '의문의 주문서', cost: 300, qty: buyQtyScroll, setQty: setBuyQtyScroll }, { type: 'weapon', name: '고급 무기', cost: 1000, qty: buyQtyWeapon, setQty: setBuyQtyWeapon } ].map(item => (
                      <div key={item.type} className="flex-1 bg-gray-900 p-2 rounded-md text-center border border-gray-700 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-gray-300 mb-1">{item.name} 상자</p>
                          <div className="flex justify-center items-center gap-1 mb-2 bg-gray-800 py-1 rounded">
                            <button onClick={() => item.setQty(prev => Math.max(1, prev-1))} className="text-gray-300 px-2 font-black text-xs">-</button>
                            <span className="text-[10px] font-bold w-4">{item.qty}</span>
                            <button onClick={() => item.setQty(prev => prev+1)} className="text-gray-300 px-2 font-black text-xs">+</button>
                          </div>
                          <button onClick={() => handleBuyBox(item.type, item.cost, item.qty)} className="w-full bg-yellow-600 font-bold text-[10px] py-1.5 rounded text-white active:bg-yellow-500">구매 ({item.cost * item.qty}댕)</button>
                      </div>
                  ))}
              </div>
            </div>
            
            <div className="flex gap-2 px-1">
              <button onClick={handleOpenScrollBox} disabled={activeGacha !== null} className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white py-3 rounded-lg text-xs font-black shadow-md">📦 주문서 상자 열기 ({scrollBoxes})</button>
              <button onClick={handleOpenWeaponBox} disabled={activeGacha !== null} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white py-3 rounded-lg text-xs font-black shadow-md">⚔️ 무기 상자 열기 ({weaponBoxes})</button>
            </div>
          </div>
        )}

        {/* 🏆 투기장 랭킹 탭 */}
        {activeTab === 'arena' && (
          <div className="flex flex-col h-full gap-2">
            
            <div className="flex gap-1 bg-gray-900 p-1.5 rounded-xl border border-gray-800 shrink-0 shadow-md">
              <button onClick={() => setRankType('attack')} className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-colors ${rankType === 'attack' ? 'bg-red-600 text-white shadow-inner' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>⚔️ 공격력 랭킹</button>
              <button onClick={() => setRankType('enhance')} className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-colors ${rankType === 'enhance' ? 'bg-blue-600 text-white shadow-inner' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>🛠️ 강화 랭킹</button>
              <button onClick={() => setRankType('points')} className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-colors ${rankType === 'points' ? 'bg-yellow-600 text-white shadow-inner' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>🏆 결투 포인트</button>
            </div>
            
            <div className="flex-1 bg-gray-800 rounded-xl overflow-y-auto border border-gray-700 p-2 shadow-inner">
              {loadingRank ? (
                <div className="flex justify-center items-center h-full text-gray-500 text-sm font-bold animate-pulse">랭킹 데이터를 불러오는 중...</div>
              ) : leaderboard.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500 text-sm font-bold">랭킹 데이터가 없습니다.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {leaderboard.map((ranker, index) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded-lg border ${index === 0 ? 'bg-yellow-900/30 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : index < 3 ? 'bg-gray-700/50 border-gray-500' : 'bg-gray-900 border-gray-800'}`}>
                      
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`font-black w-5 text-center shrink-0 ${index === 0 ? 'text-yellow-400 text-lg' : index === 1 ? 'text-gray-300 text-base' : index === 2 ? 'text-orange-400 text-base' : 'text-gray-500 text-xs'}`}>{index + 1}</span>
                        <div className="flex flex-col truncate pr-2">
                          <span className={`text-[11px] font-bold truncate ${ranker.id === user ? 'text-green-400' : 'text-gray-200'}`}>
                            {ranker.nickname}
                          </span>
                          <span className={`text-[10px] truncate ${gradeTextColors[ranker.mainWeapon.weapon_grade]}`}>+{ranker.mainWeapon.enhancement_level} {ranker.mainWeapon.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="bg-gray-950 px-1.5 py-1 rounded border border-gray-700 text-right flex flex-col justify-center min-w-[55px]">
                          {rankType === 'attack' && <span className="text-[10px] font-black text-red-400 w-full block">⚔️ {ranker.mainWeapon.attack.toLocaleString()}</span>}
                          {rankType === 'enhance' && <span className="text-[10px] font-black text-blue-400 w-full block">🛠️ +{ranker.mainWeapon.enhancement_level}</span>}
                          {rankType === 'points' && <span className="text-[10px] font-black text-yellow-400 w-full block">🏆 {(ranker.points || 0).toLocaleString()}</span>}
                        </div>
                        
                        {ranker.id !== user ? (
                          <button onClick={() => handleDuel(ranker)} className="bg-red-700 hover:bg-red-600 px-2 py-1.5 rounded text-[10px] font-black text-white shadow-md active:scale-95 transition-transform shrink-0">
                            결투 ⚔️
                          </button>
                        ) : (
                          <div className="px-3 py-1.5 text-[10px] font-black text-green-400 text-center shrink-0">나 🛡️</div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* --- 하단 네비게이션 --- */}
      <nav className="h-16 bg-gray-900 border-t border-gray-800 flex shrink-0 z-50 relative">
        <button onClick={() => setActiveTab('enhance')} className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black transition-colors ${activeTab === 'enhance' ? 'text-yellow-500' : 'text-gray-500'}`}><span className="text-xl mb-0.5">⚔️</span>강화</button>
        <button onClick={() => setActiveTab('inventory')} className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black transition-colors ${activeTab === 'inventory' ? 'text-yellow-500' : 'text-gray-500'}`}><span className="text-xl mb-0.5">📦</span>창고/상점</button>
        <button onClick={() => setActiveTab('arena')} className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black transition-colors ${activeTab === 'arena' ? 'text-yellow-500' : 'text-gray-500'}`}><span className="text-xl mb-0.5">🏆</span>투기장</button>
      </nav>

      {/* 💡 결투 애니메이션 모달창 */}
      {duelingTarget && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[120] p-6 text-center">
          <div className="flex items-center gap-6 mb-8">
            <div className="flex flex-col items-center">
              <span className="text-5xl">🛡️</span>
              <span className="text-blue-400 font-black mt-3 text-lg">나</span>
            </div>
            <span className="text-6xl animate-bounce">⚔️</span>
            <div className="flex flex-col items-center">
              <span className="text-5xl">😈</span>
              <span className="text-red-400 font-black mt-3 text-lg">{duelingTarget.nickname}</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-red-500 mb-2 animate-pulse tracking-widest">결투 진행 중...</h2>
          <p className="text-gray-400 text-sm mt-4">상대의 방어구를 파괴하고 있습니다...</p>
        </div>
      )}

      {/* --- 모달 팝업들 --- */}
      {selectedInvItem && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] p-6">
          <div className={`bg-gray-900 border-2 rounded-xl p-5 w-full max-w-sm text-center shadow-2xl ${gradeCardStyles[selectedInvItem.weapon_grade]}`}>
             <span className={`text-[11px] font-black tracking-wider ${gradeTextColors[selectedInvItem.weapon_grade]}`}>[{getGradeLabel(selectedInvItem.weapon_grade)}]</span>
             <h2 className="text-xl font-black text-white mt-1 mb-2">+{selectedInvItem.enhancement_level} {selectedInvItem.name}</h2>
             <div className="bg-gray-950 inline-block px-3 py-1 rounded border border-gray-700 mb-6">
               <p className="text-xs font-bold text-gray-200">⚔️ 공격력: {selectedInvItem.attack.toLocaleString()}</p>
             </div>
             
             <div className="flex flex-col gap-2">
               <button onClick={() => handleEquip('main')} className="bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-lg shadow-md transition-colors text-sm">⚔️ 본장비로 장착하기</button>
               <button onClick={() => handleEquip('sub')} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-lg shadow-md transition-colors text-sm">🗡️ 서브장비로 장착하기</button>
               <button onClick={handleSell} className="bg-yellow-600 hover:bg-yellow-500 text-white font-black py-3 rounded-lg shadow-md transition-colors mt-2 text-sm">💰 판매하기 (댕 획득)</button>
               <button onClick={() => setSelectedInvItem(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg mt-1 border border-gray-600 text-sm">닫기</button>
             </div>
          </div>
        </div>
      )}

      {popupMsg && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
          <div className="bg-gray-800 p-5 rounded-xl border-2 border-yellow-500 text-center w-full max-w-sm">
            <h2 className="text-white font-bold leading-relaxed whitespace-pre-line text-xs mb-4">{popupMsg}</h2>
            <button onClick={() => setPopupMsg(null)} className="w-full bg-yellow-600 py-2 rounded-lg font-black text-white text-sm">확인</button>
          </div>
        </div>
      )}

      {warningTarget === 'main' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
          <div className="bg-gray-900 border-2 border-red-600 p-5 rounded-xl text-center w-full max-w-sm">
            <h2 className="text-base font-black text-red-500 mb-2">⚠️ 위험 알림</h2>
            <p className="text-gray-300 text-[11px] mb-4">메인 무기 파괴 시 복구가 불가능합니다. 지르시겠습니까?</p>
            <div className="flex gap-2">
              <button onClick={() => setWarningTarget(null)} className="flex-1 bg-gray-700 py-2 rounded-lg text-xs font-bold text-gray-300">후퇴</button>
              <button onClick={() => executeEnhance('main')} className="flex-1 bg-red-600 py-2 rounded-lg text-xs font-black text-white">상남자 직진</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}