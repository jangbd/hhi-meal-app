"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createClient } from '@supabase/supabase-js';
import { gameDict } from './gameI18n';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

// 💡 SSR과 클라이언트 첫 렌더가 항상 'ko'로 일치하도록 하고(하이드레이션 불일치 방지),
// 마운트 후에만 실제 localStorage 언어값으로 전환하는 안전한 패턴
const langSubscribe = () => () => {};
const getLangSnapshot = () => (typeof window !== 'undefined' ? localStorage.getItem('my_language') || 'ko' : 'ko');
const getLangServerSnapshot = () => 'ko';

// 💡 욕설 및 금지어 필터
const FORBIDDEN_WORDS = ['씨발', '개새끼', '존나', '창년', '병신', '개자식', '미친', '운영자', '관리자'];

// 고유 ID 생성기
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 오늘 날짜 구하기 (일일 초기화 기준)
const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 이번 달 구하기 (월간 초기화 기준)
const getCurrentMonthString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// 어제 날짜 구하기 (출석 연속 여부 판단용)
const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 💡 출석 이벤트: 7일 주기 보상. 연속 출석이면 다음 날로, 하루라도 빠지면 1일차로 리셋.
const ATTENDANCE_REWARDS = [
  { dang: 2000, normal_scrolls: 3, blessed_scrolls: 0, scroll_boxes: 0, weapon_boxes: 0, protect_scrolls: 0 },
  { dang: 3000, normal_scrolls: 5, blessed_scrolls: 0, scroll_boxes: 0, weapon_boxes: 0, protect_scrolls: 0 },
  { dang: 4000, normal_scrolls: 0, blessed_scrolls: 2, scroll_boxes: 0, weapon_boxes: 0, protect_scrolls: 0 },
  { dang: 5000, normal_scrolls: 0, blessed_scrolls: 0, scroll_boxes: 2, weapon_boxes: 0, protect_scrolls: 0 },
  { dang: 6000, normal_scrolls: 0, blessed_scrolls: 0, scroll_boxes: 0, weapon_boxes: 2, protect_scrolls: 0 },
  { dang: 8000, normal_scrolls: 0, blessed_scrolls: 0, scroll_boxes: 0, weapon_boxes: 0, protect_scrolls: 2 },
  { dang: 20000, normal_scrolls: 0, blessed_scrolls: 3, scroll_boxes: 0, weapon_boxes: 3, protect_scrolls: 0 },
];

// 💡 출석 보상 항목을 현재 언어(gt)에 맞게 조합
const formatAttendanceReward = (reward, gt, isLastDay) => {
  const parts = [`💰 ${reward.dang.toLocaleString()} ${gt.dangUnit}`];
  if (reward.normal_scrolls) parts.push(`📜 ${gt.itemNormalScroll} ${reward.normal_scrolls}`);
  if (reward.blessed_scrolls) parts.push(`✨ ${gt.itemBlessedScroll} ${reward.blessed_scrolls}`);
  if (reward.scroll_boxes) parts.push(`📦 ${gt.itemScrollBox} ${reward.scroll_boxes}`);
  if (reward.weapon_boxes) parts.push(`🗡️ ${gt.itemWeaponBox} ${reward.weapon_boxes}`);
  if (reward.protect_scrolls) parts.push(`🛡️ ${gt.itemProtectScroll} ${reward.protect_scrolls}`);
  return parts.join(' + ') + (isLastDay ? ` (${gt.day7Complete || ''})` : '');
};

// DB 침묵 에러 탐지기
const checkDB = (res) => {
  if (res.error) throw new Error(res.error.message);
  return res;
};

// 무기 등급별 밸런스 설정 테이블
const WEAPON_CONFIG = {
  normal: { baseAtk: 20, gainMin: 5, gainMax: 15, protect: 3, basePrice: 100, limitMult: 1 },
  magic: { baseAtk: 120, gainMin: 40, gainMax: 100, protect: 3, basePrice: 300, limitMult: 5 },
  rare: { baseAtk: 800, gainMin: 300, gainMax: 800, protect: 3, basePrice: 1000, limitMult: 40 }, 
  epic: { baseAtk: 5000, gainMin: 2000, gainMax: 5000, protect: 2, basePrice: 5000, limitMult: 300 }, 
  legendary: { baseAtk: 25000, gainMin: 10000, gainMax: 30000, protect: 1, basePrice: 20000, limitMult: 2500 }
};

// 💡 등급별 원본 이미지(weapon_*.png)의 실제 검 폭이 서로 달라(마법 23% ~ 희귀 40%, 세로는 모두 동일) 같은 박스에 그리면
// 마법 등급이 유독 얇고 작아 보임. 세로는 건드리지 않고 가로 폭만 등급별로 보정.
const WEAPON_IMG_SCALE_X = { normal: 1.17, magic: 1.72, rare: 1.0, epic: 1.15, legendary: 1.2 };

// 등급 및 레벨별 강화 성공 확률
const getSuccessRate = (grade, level) => {
  if (grade === 'normal' || grade === 'magic') {
    return level < 10 ? 90 : level < 15 ? 50 : 20;
  }
  if (grade === 'rare') return level < 10 ? 70 : level < 15 ? 20 : 5;
  if (grade === 'epic') return level < 10 ? 40 : level < 15 ? 10 : 2;
  if (grade === 'legendary') return level < 10 ? 15 : level < 15 ? 3 : 1;
  return 50;
};

// 재테크용 판매 금액 계산 공식 (기하급수적 상승)
const calculateSellPrice = (grade, level) => {
  const base = WEAPON_CONFIG[grade].basePrice;
  return Math.floor(base * Math.pow((level * 0.4 + 1), 2.5)) + (level * 500);
};

export default function GameLobby() {
  const lang = useSyncExternalStore(langSubscribe, getLangSnapshot, getLangServerSnapshot);
  const gt = gameDict[lang] || gameDict.ko;

  const [activeTab, setActiveTab] = useState('enhance');

  // --- 유저 및 상태 변수 ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); 
  const [showIntro, setShowIntro] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [nickname, setNickname] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showingAd, setShowingAd] = useState(false); 
  
  // 재화 및 점수
  const [points, setPoints] = useState(0); 
  const [dang, setDang] = useState(0); 
  const [enhanceCount, setEnhanceCount] = useState(0);
  const [duelCount, setDuelCount] = useState(10);
  const [attendanceStreak, setAttendanceStreak] = useState(0);

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

  // 게임 진행 상태
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

  const [isMultiSellModalOpen, setIsMultiSellModalOpen] = useState(false);
  const [sellGrades, setSellGrades] = useState({
    normal: true, magic: true, rare: false, epic: false, legendary: false
  });

  const [syncTrigger, setSyncTrigger] = useState(0);
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
  const getGradeLabel = (grade) => gt.gradeLabels[grade] || gt.gradeLabels.normal;
  const getWeaponDisplayName = (w) => w ? (w.weapon_grade === 'none' ? gt.bareFists : (gt.weaponNames[w.weapon_grade] || w.name)) : '';
  
  const getAuraClass = (level) => {
    if (level >= 15) return 'scale-125 animate-pulse transition-all duration-300 z-10'; 
    if (level >= 10) return 'scale-110 transition-all duration-300 z-10'; 
    if (level >= 5) return 'scale-105 transition-all duration-300'; 
    return 'transition-all duration-300'; 
  };
  
  const getAuraStyle = (level) => {
    if (level >= 15) return { filter: 'drop-shadow(0px 0px 25px rgba(250, 204, 21, 1))' };
    if (level >= 10) return { filter: 'drop-shadow(0px 0px 15px rgba(239, 68, 68, 1))' };
    if (level >= 5) return { filter: 'drop-shadow(0px 0px 15px rgba(59, 130, 246, 0.8))' };
    return {};
  };

  const loadGameData = useCallback(async (userId) => {
    try {
      let { data: profile, error: profileErr } = await supabase.from('game_profiles').select('*').eq('id', userId).maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile) { setShowIntro(true); setLoading(false); return; }

      const currentMonth = getCurrentMonthString();
      let lastMonth = profile.last_reward_month;

      if (lastMonth !== currentMonth) {
        const { data: allProfiles } = await supabase.from('game_profiles').select('id, points');
        let rankReward = 2000; let myRank = gt.unranked;
        if (allProfiles) {
          allProfiles.sort((a, b) => (b.points || 0) - (a.points || 0));
          const rankIndex = allProfiles.findIndex(p => p.id === userId);
          if (rankIndex !== -1) {
            myRank = rankIndex + 1;
            if (myRank === 1) rankReward = 50000; else if (myRank === 2) rankReward = 30000; else if (myRank === 3) rankReward = 20000; else if (myRank <= 10) rankReward = 10000; else if (myRank <= 50) rankReward = 5000;
          }
        }
        const monthlyBasicReward = 10000; const totalReward = monthlyBasicReward + rankReward;
        const newDang = (profile.dang || 0) + totalReward;

        await supabase.from('game_profiles').update({ dang: newDang, last_reward_month: currentMonth }).eq('id', userId).then(checkDB);
        profile.dang = newDang; 
        setTimeout(() => { alert(gt.monthlyReward(monthlyBasicReward, rankReward, myRank, totalReward)); }, 500);
      }

      // 💡 출석 이벤트: 오늘 첫 접속이면 보상 지급 (연속 출석일수에 따라 7일 주기 순환)
      const todayForAttendance = getTodayString();
      if (profile.last_attendance_date !== todayForAttendance) {
        const yesterday = getYesterdayString();
        const prevStreak = profile.attendance_streak || 0;
        const newStreak = profile.last_attendance_date === yesterday ? (prevStreak % 7) + 1 : 1;
        const reward = ATTENDANCE_REWARDS[newStreak - 1];

        const attendanceUpdates = {
          last_attendance_date: todayForAttendance,
          attendance_streak: newStreak,
          dang: (profile.dang || 0) + reward.dang,
          normal_scrolls: (profile.normal_scrolls || 0) + reward.normal_scrolls,
          blessed_scrolls: (profile.blessed_scrolls || 0) + reward.blessed_scrolls,
          scroll_boxes: (profile.scroll_boxes || 0) + reward.scroll_boxes,
          weapon_boxes: (profile.weapon_boxes || 0) + reward.weapon_boxes,
          protect_scrolls: (profile.protect_scrolls || 0) + reward.protect_scrolls,
        };
        await supabase.from('game_profiles').update(attendanceUpdates).eq('id', userId).then(checkDB);
        Object.assign(profile, attendanceUpdates);

        setTimeout(() => { alert(gt.attendanceComplete(newStreak, formatAttendanceReward(reward, gt, newStreak === 7))); }, lastMonth !== currentMonth ? 1200 : 500);
      }

      const today = getTodayString();
      let currentDuelCount = profile.duel_count ?? 10;
      if (profile.last_duel_date !== today) {
        currentDuelCount = 10;
        await supabase.from('game_profiles').update({ duel_count: 10, last_duel_date: today }).eq('id', userId).then(checkDB);
      }

      setNickname(profile.nickname || gt.noNickname); setPoints(profile.points || 0); setDang(profile.dang || 0); setEnhanceCount(profile.enhance_count || 0); setDuelCount(currentDuelCount); setAttendanceStreak(profile.attendance_streak || 0);
      setWeaponBoxes(profile.weapon_boxes || 0); setScrollBoxes(profile.scroll_boxes || 0); setNormalScrolls(profile.normal_scrolls || 0); setBlessedScrolls(profile.blessed_scrolls || 0); setProtectScrolls(profile.protect_scrolls || 0);

      const { data: weapons, error: weaponErr } = await supabase.from('weapons').select('*').eq('user_id', userId);
      if (weaponErr) throw weaponErr;

      setMainWeapon(weapons?.find(w => w.slot_type === 'main') || null); setSubWeapon(weapons?.find(w => w.slot_type === 'sub') || null); setInventory(weapons?.filter(w => w.slot_type === 'inventory') || []);
      
      setShowIntro(false); setLoading(false); setSyncTrigger(prev => prev + 1);
    } catch (error) { setLoadError(error.message); }
  }, [gt]);

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

  useEffect(() => {
    if (activeTab === 'arena') {
      const fetchRank = async () => {
        setLoadingRank(true);
        try {
          const { data: profiles, error: pErr } = await supabase.from('game_profiles').select('*').limit(50);
          if (pErr) return setLoadingRank(false);
          if (profiles && profiles.length > 0) {
            const { data: allMainWeapons } = await supabase.from('weapons').select('*').eq('slot_type', 'main');
            const rankData = profiles.map(p => {
              if (p.id === user) return { ...p, points: points, enhance_count: enhanceCount, mainWeapon: mainWeapon || { name: '맨주먹', attack: 0, enhancement_level: 0, weapon_grade: 'none' } };
              const main = (allMainWeapons || []).find(w => w.user_id === p.id);
              return { ...p, mainWeapon: main || { name: '맨주먹', attack: 0, enhancement_level: 0, weapon_grade: 'none' } };
            });
            rankData.sort((a, b) => {
              let diff = 0;
              if (rankType === 'attack') diff = b.mainWeapon.attack - a.mainWeapon.attack;
              else if (rankType === 'enhance') diff = (b.enhance_count || 0) - (a.enhance_count || 0);
              else diff = (b.points || 0) - (a.points || 0);
              if (diff === 0) return (a.updated_ts || Infinity) - (b.updated_ts || Infinity);
              return diff;
            });
            setLeaderboard(rankData.slice(0, 10)); 
          } else { setLeaderboard([]); }
        } catch (e) { console.error(e); }
        setLoadingRank(false);
      };
      fetchRank();
    }
  }, [activeTab, rankType, syncTrigger, mainWeapon, points, user, enhanceCount]); 

  const handleDuel = async (target) => {
    if (isProcessing) return;
    if (duelCount <= 0) return alert(gt.duelExhausted);
    const myAtk = (mainWeapon?.attack || 0) + (subWeapon?.attack || 0);
    if (myAtk === 0) return alert(gt.noWeaponForDuel);

    setIsProcessing(true); setDuelingTarget(target);

    setTimeout(async () => {
      try {
        const myPower = Math.floor(myAtk * (0.8 + Math.random() * 0.4));
        const targetPower = Math.floor((target.mainWeapon?.attack || 0) * (0.8 + Math.random() * 0.4));
        const nextDuelCount = duelCount - 1; 

        let resultMsg = '';
        if (myPower >= targetPower) {
          const newPoints = points + 50;
          await supabase.from('game_profiles').update({ points: newPoints, duel_count: nextDuelCount, updated_ts: Date.now() }).eq('id', user).then(checkDB);
          resultMsg = gt.duelWin(myPower, targetPower, nextDuelCount);
        } else {
          const newPoints = Math.max(0, points - 20);
          await supabase.from('game_profiles').update({ points: newPoints, duel_count: nextDuelCount, updated_ts: Date.now() }).eq('id', user).then(checkDB);
          resultMsg = gt.duelLose(myPower, targetPower, nextDuelCount);
        }
        setPopupMsg(resultMsg); await loadGameData(user);
      } catch (err) { alert(gt.duelRecordFail(err.message)); } finally { setDuelingTarget(null); setIsProcessing(false); }
    }, 2000); 
  };

  const handleStartNewGame = async () => { 
    if (isProcessing) return;
    const n = tempNickname.trim();
    if (!n) return alert(gt.nicknameEmpty);
    if (FORBIDDEN_WORDS.some(w => n.includes(w))) return alert(gt.nicknameForbidden);

    setIsProcessing(true);
    try {
      const { data: exist } = await supabase.from('game_profiles').select('id').eq('nickname', n).maybeSingle();
      if (exist) { alert(gt.nicknameTaken); return; }

      await supabase.from('game_profiles').upsert([{ 
        id: user, nickname: n, points: 1000, dang: 10000,
        weapon_boxes: 1, scroll_boxes: 3, normal_scrolls: 10, blessed_scrolls: 2, protect_scrolls: 1, 
        enhance_count: 0, duel_count: 10, last_duel_date: getTodayString(), last_reward_month: getCurrentMonthString(), updated_ts: Date.now()
      }]).then(checkDB);
      
      const magicWeapon = { id: generateUUID(), user_id: user, slot_type: 'main', weapon_grade: 'magic', enhancement_level: 0, name: gt.weaponNames.magic, attack: WEAPON_CONFIG['magic'].baseAtk, protect_count: WEAPON_CONFIG['magic'].protect };
      const normalWeapon1 = { id: generateUUID(), user_id: user, slot_type: 'sub', weapon_grade: 'normal', enhancement_level: 0, name: gt.weaponNames.normal, attack: WEAPON_CONFIG['normal'].baseAtk, protect_count: WEAPON_CONFIG['normal'].protect };
      const normalWeapon2 = { id: generateUUID(), user_id: user, slot_type: 'inventory', weapon_grade: 'normal', enhancement_level: 0, name: gt.weaponNames.normal, attack: WEAPON_CONFIG['normal'].baseAtk, protect_count: WEAPON_CONFIG['normal'].protect };
      
      await supabase.from('weapons').insert([magicWeapon, normalWeapon1, normalWeapon2]).then(checkDB);
      await loadGameData(user);
    } catch (err) { alert(gt.accountCreateError(err.message)); } finally { setIsProcessing(false); }
  };
  
  const handleBuyBox = async (type, baseCost, qty) => {
    if (isProcessing) return;
    const totalCost = baseCost * qty;
    if (dang < totalCost) return alert(gt.notEnoughDang);
    if (!window.confirm(gt.buyConfirm(totalCost))) return;

    setIsProcessing(true);
    try {
      let updates = { dang: dang - totalCost };
      if (type === 'weapon') updates.weapon_boxes = weaponBoxes + qty; else updates.scroll_boxes = scrollBoxes + qty;
      await supabase.from('game_profiles').update(updates).eq('id', user).then(checkDB);
      if (type === 'weapon') setBuyQtyWeapon(1); else setBuyQtyScroll(1);
      await loadGameData(user);
    } catch (err) { alert(gt.shopBuyError(err.message)); } finally { setIsProcessing(false); }
  };

  const handleWatchAdForDang = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowingAd(true);

    setTimeout(async () => {
      setShowingAd(false);
      try {
        const reward = 2000;
        await supabase.from('game_profiles').update({ dang: dang + reward }).eq('id', user).then(checkDB);
        setPopupMsg(gt.adRewardMsg(reward));
        await loadGameData(user);
      } catch (err) {
        alert(gt.adRewardError(err.message));
      } finally {
        setIsProcessing(false);
      }
    }, 3000);
  };

  const handleOpenWeaponBox = async () => {
    if (isProcessing) return;
    if (weaponBoxes <= 0) return alert(gt.noWeaponBoxes);
    if (inventory.length >= 20) return alert(gt.bagFull);
    
    setIsProcessing(true); setActiveGacha('weapon');
    try {
      const rand = Math.random() * 100; let newGrade = 'normal';
      if (rand <= 0.1) newGrade = 'legendary'; else if (rand <= 1.1) newGrade = 'epic'; else if (rand <= 6.1) newGrade = 'rare'; else if (rand <= 21.1) newGrade = 'magic';
      const config = WEAPON_CONFIG[newGrade];
      const newName = gt.weaponNames[newGrade];
      const newWeaponData = { id: generateUUID(), user_id: user, slot_type: 'inventory', weapon_grade: newGrade, enhancement_level: 0, name: newName, attack: config.baseAtk, protect_count: config.protect };

      await supabase.from('game_profiles').update({ weapon_boxes: weaponBoxes - 1 }).eq('id', user).then(checkDB);
      await supabase.from('weapons').insert([newWeaponData]).then(checkDB); 
      
      setTimeout(async () => {
        setPopupMsg(gt.weaponGachaResult(getGradeLabel(newGrade), newName));
        setActiveGacha(null); await loadGameData(user); setIsProcessing(false);
      }, 800);
    } catch(err) { alert(gt.weaponGachaError(err.message)); setActiveGacha(null); setIsProcessing(false); }
  };

  const handleOpenAllWeaponBoxes = async () => {
    if (isProcessing) return;
    if (weaponBoxes <= 0) return alert(gt.noWeaponBoxes);
    const availableSlots = 20 - inventory.length;
    if (availableSlots <= 0) return alert(gt.bagFullShort);

    setIsProcessing(true); setShowingAd(true);

    setTimeout(async () => {
      setShowingAd(false); setActiveGacha('weapon');
      try {
        const openCount = Math.min(weaponBoxes, availableSlots, 10);
        const newWeapons = [];
        const resultCounts = { normal: 0, magic: 0, rare: 0, epic: 0, legendary: 0 };

        for (let i = 0; i < openCount; i++) {
          const rand = Math.random() * 100; let newGrade = 'normal';
          if (rand <= 0.1) newGrade = 'legendary'; else if (rand <= 1.1) newGrade = 'epic'; else if (rand <= 6.1) newGrade = 'rare'; else if (rand <= 21.1) newGrade = 'magic';
          resultCounts[newGrade]++;
          const config = WEAPON_CONFIG[newGrade];
          const newName = gt.weaponNames[newGrade];
          newWeapons.push({ id: generateUUID(), user_id: user, slot_type: 'inventory', weapon_grade: newGrade, enhancement_level: 0, name: newName, attack: config.baseAtk, protect_count: config.protect });
        }
        await supabase.from('game_profiles').update({ weapon_boxes: weaponBoxes - openCount }).eq('id', user).then(checkDB);
        await supabase.from('weapons').insert(newWeapons).then(checkDB);

        setTimeout(async () => {
          setPopupMsg(gt.allBoxesOpenResult(openCount, resultCounts, gt.gradeLabels));
          setActiveGacha(null); await loadGameData(user); setIsProcessing(false);
        }, 1000);
      } catch (err) { alert(gt.allWeaponOpenError(err.message)); setActiveGacha(null); setIsProcessing(false); }
    }, 3000);
  };

  const handleOpenScrollBox = async () => {
    if (isProcessing) return;
    if (scrollBoxes <= 0) return alert(gt.noScrollBoxes);
    setIsProcessing(true); setActiveGacha('scroll');
    try {
      const rand = Math.random() * 100; let msg; let updates = { scroll_boxes: scrollBoxes - 1 };
      if (rand <= 10) { msg = gt.scrollProtectGet; updates.protect_scrolls = protectScrolls + 1; }
      else if (rand <= 30) { msg = gt.scrollBlessedGet; updates.blessed_scrolls = blessedScrolls + 1; }
      else { msg = gt.scrollNormalGet; updates.normal_scrolls = normalScrolls + 1; }
      await supabase.from('game_profiles').update(updates).eq('id', user).then(checkDB);
      setTimeout(async () => { setPopupMsg(msg); setActiveGacha(null); await loadGameData(user); setIsProcessing(false); }, 500);
    } catch(err) { alert(gt.genericError(err.message)); setActiveGacha(null); setIsProcessing(false); }
  };

  const handleOpenAllScrollBoxes = async () => {
    if (isProcessing) return;
    if (scrollBoxes <= 0) return alert(gt.noScrollBoxes);
    setIsProcessing(true); setShowingAd(true);

    setTimeout(async () => {
      setShowingAd(false); setActiveGacha('scroll');
      try {
        const openCount = Math.min(scrollBoxes, 10);
        let addedNormal = 0, addedBlessed = 0, addedProtect = 0;
        for (let i = 0; i < openCount; i++) {
          const rand = Math.random() * 100;
          if (rand <= 10) addedProtect++; else if (rand <= 30) addedBlessed++; else addedNormal++;
        }
        await supabase.from('game_profiles').update({ scroll_boxes: scrollBoxes - openCount, protect_scrolls: protectScrolls + addedProtect, blessed_scrolls: blessedScrolls + addedBlessed, normal_scrolls: normalScrolls + addedNormal }).eq('id', user).then(checkDB);
        setTimeout(async () => {
          setPopupMsg(gt.allScrollOpenResult(openCount, addedProtect, addedBlessed, addedNormal));
          setActiveGacha(null); await loadGameData(user); setIsProcessing(false);
        }, 800);
      } catch (err) { alert(gt.genericError(err.message)); setActiveGacha(null); setIsProcessing(false); }
    }, 3000);
  };

  const handleEquip = async (targetSlot) => { 
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const currentEquipped = targetSlot === 'main' ? mainWeapon : subWeapon;
      if (currentEquipped) await supabase.from('weapons').update({ slot_type: 'inventory' }).eq('id', currentEquipped.id).then(checkDB); 
      await supabase.from('weapons').update({ slot_type: targetSlot }).eq('id', selectedInvItem.id).then(checkDB);
      await supabase.from('game_profiles').update({ updated_ts: Date.now() }).eq('id', user).then(checkDB);
      setSelectedInvItem(null); setPopupMsg(gt.equipComplete); await loadGameData(user);
    } catch(err) { alert(gt.genericError(err.message)); } finally { setIsProcessing(false); }
  };

  const handleSell = async () => {
    if (isProcessing) return;
    const sellPrice = calculateSellPrice(selectedInvItem.weapon_grade, selectedInvItem.enhancement_level);
    if(!window.confirm(gt.sellConfirm(getWeaponDisplayName(selectedInvItem), sellPrice))) return;

    setIsProcessing(true);
    try {
      await supabase.from('weapons').delete().eq('id', selectedInvItem.id).then(checkDB);
      await supabase.from('game_profiles').update({ dang: dang + sellPrice }).eq('id', user).then(checkDB);
      setSelectedInvItem(null); setPopupMsg(gt.sellComplete(sellPrice)); await loadGameData(user);
    } catch(err) { alert(gt.genericError(err.message)); } finally { setIsProcessing(false); }
  };

  const executeMultiSell = async () => {
    if (isProcessing) return;
    const targetGrades = Object.keys(sellGrades).filter(g => sellGrades[g]);
    const itemsToSell = inventory.filter(w => targetGrades.includes(w.weapon_grade));
    if (itemsToSell.length === 0) return alert(gt.noSellableItems);

    setIsProcessing(true); setIsMultiSellModalOpen(false); setShowingAd(true);

    setTimeout(async () => {
      setShowingAd(false);
      try {
        let totalGain = 0; const idsToDelete = itemsToSell.map(w => w.id);
        itemsToSell.forEach(item => { totalGain += calculateSellPrice(item.weapon_grade, item.enhancement_level); });
        await supabase.from('weapons').delete().in('id', idsToDelete).then(checkDB);
        await supabase.from('game_profiles').update({ dang: dang + totalGain }).eq('id', user).then(checkDB);
        setPopupMsg(gt.multiSellComplete(itemsToSell.length, totalGain));
        await loadGameData(user);
      } catch (err) { alert(gt.genericError(err.message)); } finally { setIsProcessing(false); }
    }, 3000);
  };

  const handleSwap = async () => {
    if (isProcessing) return;
    if (!mainWeapon && !subWeapon) return;
    setIsProcessing(true);
    try {
      if (mainWeapon) await supabase.from('weapons').update({ slot_type: 'inventory' }).eq('id', mainWeapon.id).then(checkDB);
      if (subWeapon) await supabase.from('weapons').update({ slot_type: 'inventory' }).eq('id', subWeapon.id).then(checkDB);
      if (subWeapon) await supabase.from('weapons').update({ slot_type: 'main' }).eq('id', subWeapon.id).then(checkDB);
      if (mainWeapon) await supabase.from('weapons').update({ slot_type: 'sub' }).eq('id', mainWeapon.id).then(checkDB);
      await supabase.from('game_profiles').update({ updated_ts: Date.now() }).eq('id', user).then(checkDB);
      setPopupMsg(gt.swapComplete); await loadGameData(user);
    } catch(err) { alert(gt.genericError(err.message)); } finally { setIsProcessing(false); }
  };

  const executeEnhance = async (slot) => { 
    if (isProcessing) return;
    setIsProcessing(true); setWarningTarget(null); setEnhancingSlot(slot);
    
    const targetWeapon = slot === 'main' ? mainWeapon : subWeapon;
    const isProtecting = slot === 'main' ? useProtectMain : useProtectSub;
    const maxProtect = WEAPON_CONFIG[targetWeapon.weapon_grade].protect;
    const currentProtect = Math.min(targetWeapon.protect_count, maxProtect);
    const nextProtectCount = isProtecting ? Math.max(0, currentProtect - 1) : currentProtect;

    let pUpdates = {};
    if (selectedScrollType === 'normal') pUpdates.normal_scrolls = normalScrolls - 1; else pUpdates.blessed_scrolls = blessedScrolls - 1;
    if (isProtecting) pUpdates.protect_scrolls = protectScrolls - 1;
    
    try { await supabase.from('game_profiles').update(pUpdates).eq('id', user).then(checkDB); }
    catch(err) { alert(gt.enhanceScrollUseFail(err.message)); setEnhancingSlot(null); setIsProcessing(false); return; }
    
    setTimeout(async () => {
      try {
        const rate = getSuccessRate(targetWeapon.weapon_grade, targetWeapon.enhancement_level); 
        const isSuccess = (Math.random() * 100) < rate;
        let resultMsg = '';
        
        if (isSuccess) {
          const plus = selectedScrollType === 'blessed' ? Math.floor(Math.random() * 3) + 1 : 1;
          const newLvl = targetWeapon.enhancement_level + plus; 
          const config = WEAPON_CONFIG[targetWeapon.weapon_grade];
          
          let totalBaseGain = 0;
          for(let i=0; i<plus; i++) {
              totalBaseGain += Math.floor(Math.random() * (config.gainMax - config.gainMin + 1)) + config.gainMin;
          }
          
          let randomBonus = 0; 
          let bonusMsg = '';
          
          if (newLvl >= 10) {
            const limitMult = config.limitMult || 1;
            let breakCount = 0;

            for(let i=0; i<plus; i++) {
              let stepLevel = targetWeapon.enhancement_level + i + 1;
              if (stepLevel >= 10) {
                 randomBonus += (Math.floor(Math.random() * 41) + 10) * limitMult;
                 breakCount++;
              }
            }
            
            if (randomBonus > 0) {
                let extraMsg = breakCount > 1 ? gt.comboBreak(breakCount) : '';
                bonusMsg = gt.enhanceBonusMsg(randomBonus, extraMsg);
            }
          }

          const addedAtk = totalBaseGain + randomBonus;
          const newAtk = targetWeapon.attack + addedAtk;

          resultMsg = gt.enhanceSuccess(plus, addedAtk, bonusMsg);

          await supabase.from('weapons').update({ enhancement_level: newLvl, attack: newAtk, protect_count: nextProtectCount }).eq('id', targetWeapon.id).then(checkDB);
          await supabase.from('game_profiles').update({ enhance_count: enhanceCount + 1, updated_ts: Date.now() }).eq('id', user).then(checkDB);
        } else {
          if (isProtecting) {
            resultMsg = gt.enhanceFailProtect(nextProtectCount);
            await supabase.from('weapons').update({ protect_count: nextProtectCount }).eq('id', targetWeapon.id).then(checkDB);
          } else {
            resultMsg = gt.enhanceFailDestroy;
            await supabase.from('weapons').delete().eq('id', targetWeapon.id).then(checkDB);
          }
        }
        setPopupMsg(resultMsg); await loadGameData(user);
      } catch (err) { alert(gt.genericError(err.message)); } finally { setEnhancingSlot(null); setIsProcessing(false); }
    }, 1200);
  };

  const clickEnhance = (slot) => {
    if (isProcessing) return;
    const targetWeapon = slot === 'main' ? mainWeapon : subWeapon;
    if (!targetWeapon) return alert(gt.noEquippedWeapon);
    const hasScroll = selectedScrollType === 'normal' ? normalScrolls > 0 : blessedScrolls > 0;
    if (!hasScroll) return alert(gt.notEnoughScrolls);
    const isProtecting = slot === 'main' ? useProtectMain : useProtectSub;
    const maxProtect = WEAPON_CONFIG[targetWeapon.weapon_grade].protect;
    const currentProtect = Math.min(targetWeapon.protect_count, maxProtect);

    if (isProtecting && (protectScrolls <= 0 || currentProtect <= 0)) return alert(gt.protectFail);
    if (slot === 'main') setWarningTarget('main'); else executeEnhance('sub');
  };

  const mainMaxProtect = mainWeapon ? WEAPON_CONFIG[mainWeapon.weapon_grade].protect : 3;
  const mainCurrentProtect = mainWeapon ? Math.min(mainWeapon.protect_count, mainMaxProtect) : 0;
  const subMaxProtect = subWeapon ? WEAPON_CONFIG[subWeapon.weapon_grade].protect : 3;
  const subCurrentProtect = subWeapon ? Math.min(subWeapon.protect_count, subMaxProtect) : 0;

  const renderWeaponImage = (weaponGrade, enhancementLevel, sizeClass) => {
    const auraClass = getAuraClass(enhancementLevel);
    const auraStyle = getAuraStyle(enhancementLevel);
    const scaleX = WEAPON_IMG_SCALE_X[weaponGrade] || 1;
    const imagePath = `/images/weapon_${weaponGrade}.png`;
    return (
      <div className={`relative flex items-center justify-center ${sizeClass} ${auraClass}`} style={auraStyle}>
        <img src={imagePath} alt={`${weaponGrade} weapon`} className="w-full h-full object-contain" style={{ transform: `scaleX(${scaleX})` }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
        <span className="hidden text-5xl" style={{ display: 'none' }}>🗡️</span>
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-gray-950 flex flex-col justify-center items-center text-white p-6 font-bold">{gt.serverConnecting}</div>;

  if (showIntro) return (
    <div className="fixed inset-0 w-full flex flex-col items-center justify-center bg-gray-950 text-white font-sans overflow-hidden z-50 px-6">
      <div className="text-center mb-8"><div className="text-7xl mb-4">🗡️</div><h1 className="text-4xl font-black text-yellow-500 mb-2 tracking-wider">{gt.appTitle}</h1></div>
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center shadow-xl">
        <h2 className="text-gray-300 text-xs font-bold mb-3">{gt.nicknamePrompt}</h2>
        <input type="text" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} maxLength={10} className="w-full bg-gray-950 border-2 border-gray-700 rounded-xl p-4 text-center text-white font-black text-lg mb-6 focus:border-yellow-500 outline-none transition-colors" placeholder={gt.nicknamePlaceholder} />
        <button onClick={handleStartNewGame} disabled={isProcessing} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 rounded-xl text-sm shadow-md transition-colors disabled:opacity-50">{gt.startButton}</button>
      </div>
    </div>
  );

  return (
    /* 💡 [최종 수정] fixed inset-0을 기반으로 100% 꽉 채우고 스크롤 영역을 내부에 가두는 'Absolute Anchoring' 방식 적용 */
    <div className="fixed top-0 left-0 right-0 bottom-[65px] bg-black flex justify-center z-40">
      <div className="w-full max-w-md h-full flex flex-col bg-gray-950 text-white font-sans relative overflow-hidden">
        
        {showingAd && (
          <div className="absolute inset-0 bg-black z-[9999] flex flex-col items-center justify-center pointer-events-auto">
            <span className="text-6xl mb-4 animate-bounce">📺</span>
            <h2 className="text-2xl font-black text-white mb-2">{gt.adPlaying}</h2>
            <p className="text-gray-400 text-sm mb-8">{gt.adWaitReward}</p>
            <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden flex"><div className="h-full bg-yellow-500 w-full animate-pulse"></div></div>
          </div>
        )}

        {isProcessing && !showingAd && (
          <div className="absolute inset-0 z-[999] flex items-end justify-center pb-20 pointer-events-auto">
             <span className="bg-black/70 border border-gray-600 text-white text-[10px] font-bold px-4 py-2 rounded-full animate-pulse shadow-2xl">{gt.syncing}</span>
          </div>
        )}

        {/* 상단 고정 헤더 영역 */}
        <header className="shrink-0 flex justify-between items-center h-12 px-4 bg-gray-900 border-b border-gray-800">
          <h1 className="font-black text-lg text-yellow-500 tracking-wider">{gt.appTitle}</h1>
          {attendanceStreak > 0 && (
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-700 px-2 py-1 rounded-full">{gt.attendanceBadge(attendanceStreak)}</span>
          )}
        </header>

        <div className="shrink-0 bg-gray-800 px-3 py-1.5 flex justify-between items-center shadow-md">
          <div className="flex flex-col justify-center">
            <span className="text-[12px] font-black text-white truncate max-w-[100px]">{nickname}</span>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-black text-xs">💰 {dang.toLocaleString()} {gt.dangUnit}</span>
              <span className="text-red-400 font-black text-[10px]">🏆 {points.toLocaleString()} P</span>
            </div>
          </div>
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="text-gray-300">📜: {normalScrolls}</span>
            <span className="text-cyan-300">✨: {blessedScrolls}</span>
            <span className="text-blue-400">🛡️: {protectScrolls}</span>
          </div>
        </div>

        {/* 💡 [최종 수정] 메인 영역: 스크롤은 여기서만 일어남. pb-[80px]로 하단 메뉴에 가려지지 않게 여백 추가 */}
        <main className={(activeTab === 'enhance' || activeTab === 'inventory') ? "flex-1 flex flex-col min-h-0 relative z-10 p-2 pb-[65px] overflow-y-auto" : "flex-1 overflow-y-auto min-h-0 relative z-10 p-2 pb-[80px]"}>
          {activeTab === 'enhance' && (
            <div className="flex flex-col gap-2 h-full">
              <div className="flex gap-1 shrink-0 bg-gray-950 p-1">
                <button disabled={isProcessing} onClick={() => setSelectedScrollType('normal')} className={`flex-1 py-1.5 rounded-lg border font-black text-[11px] transition-all disabled:opacity-50 ${selectedScrollType === 'normal' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>{gt.scrollNormalBtn}</button>
                <button disabled={isProcessing} onClick={() => setSelectedScrollType('blessed')} className={`flex-1 py-1.5 rounded-lg border font-black text-[11px] transition-all disabled:opacity-50 ${selectedScrollType === 'blessed' ? 'bg-cyan-600 border-cyan-300 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>{gt.scrollBlessedBtn}</button>
              </div>

              {/* 본장비: 화면 절반을 채움 (무기가 없어도 카드 자체는 항상 절반 유지) */}
              <div className={`flex-1 min-h-[150px] flex flex-col justify-between border-2 rounded-xl p-2 shadow-lg transition-all ${mainWeapon ? gradeCardStyles[mainWeapon.weapon_grade] : 'border-gray-700 bg-gray-900'}`}>
                <div className="flex justify-between items-start shrink-0">
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold tracking-wider mb-0.5 ${mainWeapon ? gradeTextColors[mainWeapon.weapon_grade] : 'text-gray-500'}`}>[{mainWeapon ? getGradeLabel(mainWeapon.weapon_grade) : gt.emptySlot}]</span>
                    <h3 className={`text-xs font-black ${mainWeapon ? gradeTextColors[mainWeapon.weapon_grade] : 'text-gray-500'}`}>{mainWeapon ? `+${mainWeapon.enhancement_level} ${getWeaponDisplayName(mainWeapon)}` : gt.equipPrompt}</h3>
                    <div className="mt-1 bg-gray-950 px-1.5 py-0.5 rounded w-max border border-gray-700"><p className="text-[9px] font-bold text-gray-300">{gt.attackLabel}: {mainWeapon?.attack?.toLocaleString() || 0}</p></div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <label className="flex items-center gap-1 text-[9px] font-bold text-gray-200 bg-gray-950 px-1.5 py-1 rounded border border-gray-700 cursor-pointer">
                      <input type="checkbox" checked={useProtectMain} disabled={isProcessing} onChange={(e) => setUseProtectMain(e.target.checked)} className="w-3 h-3 accent-blue-500" />
                      <span>{gt.protectApply}</span>
                    </label>
                    <p className="text-[8px] text-gray-400 mt-0.5">{gt.protectCount(mainCurrentProtect, mainMaxProtect)}</p>
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex justify-center items-center">
                  {mainWeapon ? renderWeaponImage(mainWeapon.weapon_grade, mainWeapon.enhancement_level, 'w-32 h-32 drop-shadow-2xl') : <div className="text-5xl">❌</div>}
                </div>

                <button onClick={() => clickEnhance('main')} disabled={enhancingSlot !== null || !mainWeapon} className={`shrink-0 w-full font-black py-2.5 rounded-lg text-white text-xs border-2 shadow-md disabled:opacity-50 ${mainWeapon ? 'bg-red-600 border-red-400' : 'bg-gray-700 border-gray-600'}`}>
                  {!mainWeapon ? gt.noWeaponEquipped : enhancingSlot === 'main' ? gt.enhancingInProgress : gt.mainEnhanceBtn(getSuccessRate(mainWeapon.weapon_grade, mainWeapon.enhancement_level))}
                </button>
              </div>

              <div className="flex justify-center -my-3 z-20 shrink-0"><button disabled={isProcessing} onClick={handleSwap} className="bg-gray-800 border-2 border-gray-500 text-[9px] font-bold px-3 py-1 rounded-full shadow-2xl active:scale-95 text-white disabled:opacity-50">{gt.swapWeapons}</button></div>

              {/* 보조장비: 본장비와 동일하게 화면 절반을 채움 */}
              <div className={`flex-1 min-h-[150px] flex flex-col justify-between border-2 rounded-xl p-2 shadow-lg transition-all ${subWeapon ? gradeCardStyles[subWeapon.weapon_grade] : 'border-gray-700 bg-gray-900'}`}>
                <div className="flex justify-between items-start shrink-0">
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold tracking-wider mb-0.5 ${subWeapon ? gradeTextColors[subWeapon.weapon_grade] : 'text-gray-500'}`}>[{subWeapon ? getGradeLabel(subWeapon.weapon_grade) : gt.emptySlot}]</span>
                    <h3 className={`text-xs font-black ${subWeapon ? gradeTextColors[subWeapon.weapon_grade] : 'text-gray-500'}`}>{subWeapon ? `+${subWeapon.enhancement_level} ${getWeaponDisplayName(subWeapon)}` : gt.equipPrompt}</h3>
                    <div className="mt-0.5 bg-gray-950 px-1 py-0.5 rounded w-max border border-gray-700"><p className="text-[9px] font-bold text-gray-300">{gt.attackLabel}: {subWeapon?.attack?.toLocaleString() || 0}</p></div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <label className="flex items-center gap-1 text-[9px] font-bold text-gray-200 bg-gray-950 px-1 py-0.5 rounded border border-gray-700 cursor-pointer">
                      <input type="checkbox" checked={useProtectSub} disabled={isProcessing} onChange={(e) => setUseProtectSub(e.target.checked)} className="w-3 h-3 accent-blue-500" />
                      <span>{gt.protectApply}</span>
                    </label>
                    <p className="text-[8px] text-gray-400 mt-0.5">{gt.protectCount(subCurrentProtect, subMaxProtect)}</p>
                  </div>
                </div>

                {/* 💡 [수정] 서브장비 이미지도 본장비와 동일하게 남는 공간을 꽉 채움 */}
                <div className="flex-1 min-h-0 flex justify-center items-center">
                   {subWeapon ? renderWeaponImage(subWeapon.weapon_grade, subWeapon.enhancement_level, 'w-32 h-32 drop-shadow-xl') : <div className="text-5xl">❌</div>}
                </div>

                <button onClick={() => clickEnhance('sub')} disabled={enhancingSlot !== null || !subWeapon} className={`shrink-0 w-full font-black py-2.5 rounded-lg text-white text-xs border-2 shadow-md disabled:opacity-50 ${subWeapon ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600'}`}>
                  {!subWeapon ? gt.noWeaponEquipped : enhancingSlot === 'sub' ? gt.enhancingInProgress : gt.subEnhanceBtn(getSuccessRate(subWeapon.weapon_grade, subWeapon.enhancement_level))}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="min-h-full flex flex-col gap-2">
              <div className="shrink-0">
                <div className="flex justify-between items-center mb-1 px-2">
                    <h2 className="text-[11px] font-bold text-yellow-400">{gt.inventoryTitle(inventory.length)}</h2>
                    <button onClick={() => setIsMultiSellModalOpen(true)} disabled={isProcessing} className="bg-red-900/50 hover:bg-red-800 text-red-300 text-[10px] font-bold px-3 py-1 rounded-lg border border-red-700 disabled:opacity-50">{gt.multiSellBtn}</button>
                </div>
                <div className="grid grid-cols-5 gap-1 px-2">
                  {Array(20).fill(0).map((_, i) => {
                    const item = inventory[i];
                    if (item) {
                        return (
                            <div onClick={() => !isProcessing && setSelectedInvItem(item)} key={item.id} className={`h-14 cursor-pointer active:scale-95 transition-transform bg-gray-900 rounded-md border flex flex-col items-center justify-center p-0.5 shadow-md ${gradeCardStyles[item.weapon_grade]}`}>
                               <span className={`text-[7px] font-black ${gradeTextColors[item.weapon_grade]}`}>[{getGradeLabel(item.weapon_grade)}]</span>
                               {renderWeaponImage(item.weapon_grade, item.enhancement_level, 'w-7 h-7')}
                               <span className="text-[8px] text-yellow-500 font-black">+{item.enhancement_level}</span>
                            </div>
                        );
                    }
                    return <div key={`empty-${i}`} className="h-14 bg-gray-900 rounded-md border border-gray-800 flex items-center justify-center text-gray-600 text-[8px] shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">{gt.emptyCell}</div>;
                  })}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-1.5 border border-gray-700 mx-2 flex flex-col shrink-0 mb-2 mt-1">
                <div className="flex justify-between items-center mb-1.5">
                  <h2 className="text-[11px] font-bold text-yellow-400">{gt.shopTitle}</h2>
                  <button disabled={isProcessing} onClick={handleWatchAdForDang} className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-md disabled:opacity-50 animate-pulse transition-all">{gt.watchAdBtn}</button>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-900 p-1.5 rounded-md text-center border border-gray-700 flex flex-col">
                    <p className="text-[10px] font-bold text-gray-300 mb-0.5">{gt.mysteryScroll}</p>
                    <div className="flex justify-center items-center gap-1 mb-1 bg-gray-800 py-0.5 rounded">
                      <button disabled={isProcessing} onClick={() => setBuyQtyScroll(prev => Math.max(1, prev-1))} className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-sm font-black text-white hover:bg-gray-600 disabled:opacity-50">-</button>
                      <span className="text-xs font-black w-6 text-center">{buyQtyScroll}</span>
                      <button disabled={isProcessing} onClick={() => setBuyQtyScroll(prev => prev+1)} className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-sm font-black text-white hover:bg-gray-600 disabled:opacity-50">+</button>
                    </div>
                    <button disabled={isProcessing} onClick={() => handleBuyBox('scroll', 300, buyQtyScroll)} className="w-full bg-yellow-600 font-bold text-[10px] py-1 rounded text-white active:bg-yellow-500 shadow-md disabled:opacity-50 mb-1.5">{gt.buyBtn(300 * buyQtyScroll)}</button>

                    <div className="border-t border-gray-700 pt-1.5 flex flex-col gap-1 mt-auto">
                      <p className="text-[9px] text-gray-400">{gt.ownedCount(scrollBoxes)}</p>
                      <button onClick={handleOpenScrollBox} disabled={isProcessing || activeGacha !== null || scrollBoxes <= 0} className="w-full bg-indigo-800 hover:bg-indigo-700 text-white py-1.5 rounded text-[10px] font-black shadow-sm disabled:opacity-50">{gt.openOneBtn}</button>
                      <button onClick={handleOpenAllScrollBoxes} disabled={isProcessing || activeGacha !== null || scrollBoxes <= 0} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded text-[10px] font-black shadow-sm disabled:opacity-50">{gt.openTenBtn}</button>
                    </div>
                  </div>

                  <div className="flex-1 bg-gray-900 p-1.5 rounded-md text-center border border-gray-700 flex flex-col">
                    <p className="text-[10px] font-bold text-gray-300 mb-0.5">{gt.advancedWeapon}</p>
                    <div className="flex justify-center items-center gap-1 mb-1 bg-gray-800 py-0.5 rounded">
                      <button disabled={isProcessing} onClick={() => setBuyQtyWeapon(prev => Math.max(1, prev-1))} className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-sm font-black text-white hover:bg-gray-600 disabled:opacity-50">-</button>
                      <span className="text-xs font-black w-6 text-center">{buyQtyWeapon}</span>
                      <button disabled={isProcessing} onClick={() => setBuyQtyWeapon(prev => prev+1)} className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-sm font-black text-white hover:bg-gray-600 disabled:opacity-50">+</button>
                    </div>
                    <button disabled={isProcessing} onClick={() => handleBuyBox('weapon', 1000, buyQtyWeapon)} className="w-full bg-yellow-600 font-bold text-[10px] py-1 rounded text-white active:bg-yellow-500 shadow-md disabled:opacity-50 mb-1.5">{gt.buyBtn(1000 * buyQtyWeapon)}</button>

                    <div className="border-t border-gray-700 pt-1.5 flex flex-col gap-1 mt-auto">
                      <p className="text-[9px] text-gray-400">{gt.ownedCount(weaponBoxes)}</p>
                      <button onClick={handleOpenWeaponBox} disabled={isProcessing || activeGacha !== null || weaponBoxes <= 0} className="w-full bg-emerald-800 hover:bg-emerald-700 text-white py-1.5 rounded text-[10px] font-black shadow-sm disabled:opacity-50">{gt.openOneBtn}</button>
                      <button onClick={handleOpenAllWeaponBoxes} disabled={isProcessing || activeGacha !== null || weaponBoxes <= 0} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-[10px] font-black shadow-sm disabled:opacity-50">{gt.openTenBtn}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'arena' && (
            <div className="flex flex-col gap-2 pb-2">
              {/* 💡 결투 횟수 + 랭킹 필터는 화면 상단에 고정, 아래 랭킹 목록만 스크롤됨 */}
              <div className="sticky top-0 z-20 bg-gray-950 pb-2 flex flex-col gap-2">
                <div className="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-800 shrink-0 shadow-md text-[11px] font-bold">
                  <span className="text-gray-400">{gt.dailyDuelCount}</span>
                  <span className={duelCount > 0 ? "text-green-400" : "text-red-500"}>{gt.duelCountDisplay(duelCount)}</span>
                </div>

                <div className="flex gap-1 bg-gray-900 p-1.5 rounded-xl border border-gray-800 shrink-0 shadow-md">
                  <button disabled={isProcessing} onClick={() => setRankType('attack')} className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-colors disabled:opacity-50 ${rankType === 'attack' ? 'bg-red-600 text-white shadow-inner' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{gt.rankAttack}</button>
                  <button disabled={isProcessing} onClick={() => setRankType('enhance')} className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-colors disabled:opacity-50 ${rankType === 'enhance' ? 'bg-blue-600 text-white shadow-inner' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{gt.rankEnhance}</button>
                  <button disabled={isProcessing} onClick={() => setRankType('points')} className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-colors disabled:opacity-50 ${rankType === 'points' ? 'bg-yellow-600 text-white shadow-inner' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{gt.rankPoints}</button>
                </div>
              </div>

              <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 p-2 shadow-inner">
                {loadingRank ? (
                  <div className="flex justify-center items-center h-20 text-gray-500 text-sm font-bold animate-pulse">{gt.loadingRank}</div>
                ) : leaderboard.length === 0 ? (
                  <div className="flex justify-center items-center h-20 text-gray-500 text-sm font-bold">{gt.noRankData}</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {leaderboard.map((ranker, index) => (
                      <div key={index} className={`flex items-center justify-between p-2 rounded-lg border ${index === 0 ? 'bg-yellow-900/30 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : index < 3 ? 'bg-gray-700/50 border-gray-500' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`font-black w-5 text-center shrink-0 ${index === 0 ? 'text-yellow-400 text-lg' : index === 1 ? 'text-gray-300 text-base' : index === 2 ? 'text-orange-400 text-base' : 'text-gray-500 text-xs'}`}>{index + 1}</span>
                          <div className="flex flex-col truncate pr-2">
                            <span className={`text-[11px] font-bold truncate ${ranker.id === user ? 'text-green-400' : 'text-gray-200'}`}>{ranker.nickname}</span>
                            <span className={`text-[10px] truncate ${gradeTextColors[ranker.mainWeapon.weapon_grade]}`}>+{ranker.mainWeapon.enhancement_level} {getWeaponDisplayName(ranker.mainWeapon)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="bg-gray-950 px-1.5 py-1 rounded border border-gray-700 text-right flex flex-col justify-center min-w-[55px]">
                            {rankType === 'attack' && <span className="text-[10px] font-black text-red-400 w-full block">⚔️ {ranker.mainWeapon.attack.toLocaleString()}</span>}
                            {rankType === 'enhance' && <span className="text-[10px] font-black text-blue-400 w-full block">🛠️ {(ranker.enhance_count || 0).toLocaleString()}</span>}
                            {rankType === 'points' && <span className="text-[10px] font-black text-yellow-400 w-full block">🏆 {(ranker.points || 0).toLocaleString()}</span>}
                          </div>
                          {ranker.id !== user ? (
                            <button onClick={() => handleDuel(ranker)} disabled={isProcessing} className="bg-red-700 hover:bg-red-600 px-2 py-1.5 rounded text-[10px] font-black text-white shadow-md active:scale-95 transition-transform shrink-0 disabled:opacity-50">{gt.duelBtn}</button>
                          ) : (
                            <div className="px-3 py-1.5 text-[10px] font-black text-green-400 text-center shrink-0">{gt.meLabel}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="flex flex-col gap-3 text-[11px] pb-4">
              <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/50 p-2.5 rounded-xl shadow-md shrink-0">
                <h3 className="font-black text-emerald-400 text-xs flex items-center gap-1">{gt.guideAttendanceTitle}</h3>
                <p className="text-gray-300 mt-1 leading-relaxed text-[10px]">{gt.guideAttendanceDesc}</p>
              </div>

              <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/50 p-2.5 rounded-xl shadow-md shrink-0">
                <h3 className="font-black text-cyan-400 text-xs flex items-center gap-1">{gt.guideStrategyTitle}</h3>
                <p className="text-gray-300 mt-1 leading-relaxed text-[10px]">{gt.guideStrategyDesc}</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-2 rounded-xl shrink-0">
                <h3 className="font-bold text-gray-200 mb-1.5 text-xs">{gt.guideProbTitle}</h3>
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-gray-950 text-gray-400 text-[9px]">
                      <th className="py-1 border border-gray-800">{gt.gradeColHeader}</th>
                      <th className="border border-gray-800">{gt.lv1_9}</th>
                      <th className="border border-gray-800">{gt.lv10_14}</th>
                      <th className="border border-gray-800">{gt.lv15plus}</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300 text-[10px]">
                    <tr>
                      <td className="py-1 font-bold text-gray-400 border border-gray-800">{gt.gradeLabels.normal}/{gt.gradeLabels.magic}</td>
                      <td className="border border-gray-800 text-green-400">90%</td>
                      <td className="border border-gray-800 text-orange-400">50%</td>
                      <td className="border border-gray-800 text-red-500">20%</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold text-blue-400 border border-gray-800">{gt.gradeLabels.rare}</td>
                      <td className="border border-gray-800 text-green-400">70%</td>
                      <td className="border border-gray-800 text-orange-400">20%</td>
                      <td className="border border-gray-800 text-red-500">5%</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold text-purple-400 border border-gray-800">{gt.gradeLabels.epic}</td>
                      <td className="border border-gray-800 text-green-400">40%</td>
                      <td className="border border-gray-800 text-orange-400">10%</td>
                      <td className="border border-gray-800 text-red-500">2%</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold text-yellow-400 border border-gray-800">{gt.gradeLabels.legendary}</td>
                      <td className="border border-gray-800 text-green-400">15%</td>
                      <td className="border border-gray-800 text-orange-400">3%</td>
                      <td className="border border-gray-800 text-red-600 font-black">1%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-2 shrink-0">
                <div className="bg-gray-900 border border-gray-800 p-2 rounded-xl"><h3 className="font-bold text-emerald-400 mb-1 text-xs">{gt.weaponProbTitle}</h3><ul className="space-y-0.5 text-gray-300 text-[10px]"><li className="flex justify-between"><span>{gt.normalItem}</span><span className="font-mono">78.9%</span></li><li className="flex justify-between"><span>{gt.magicItem}</span><span className="font-mono">15.0%</span></li><li className="flex justify-between"><span>{gt.rareItem}</span><span className="font-mono">5.0%</span></li><li className="flex justify-between"><span>{gt.epicItem}</span><span className="font-mono">1.0%</span></li><li className="flex justify-between text-yellow-400 font-bold"><span>{gt.legendaryItem}</span><span className="font-mono">0.1%</span></li></ul></div>
                <div className="bg-gray-900 border border-gray-800 p-2 rounded-xl"><h3 className="font-bold text-indigo-400 mb-1 text-xs">{gt.scrollProbTitle}</h3><ul className="space-y-0.5 text-gray-300 text-[10px]"><li className="flex justify-between"><span>{gt.normalScrollItem}</span><span className="font-mono">70.0%</span></li><li className="flex justify-between text-cyan-400 font-bold"><span>{gt.blessedScrollItem}</span><span className="font-mono">20.0%</span></li><li className="flex justify-between text-blue-400 font-bold"><span>{gt.protectScrollItem}</span><span className="font-mono">10.0%</span></li></ul></div>
              </div>
            </div>
          )}
        </main>

        {/* 💡 [최종 수정] 하단 네비게이션: absolute를 이용해 화면 맨 아래에 찰싹 붙여 고정! (스크롤 밀림 차단) */}
        <nav className="absolute bottom-0 left-0 right-0 h-[65px] bg-gray-900 border-t border-gray-800 flex z-50">
          <button disabled={isProcessing} onClick={() => setActiveTab('enhance')} className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black transition-colors disabled:opacity-50 ${activeTab === 'enhance' ? 'text-yellow-500' : 'text-gray-500'}`}><span className="text-xl mb-0.5">⚔️</span>{gt.tabEnhance}</button>
          <button disabled={isProcessing} onClick={() => setActiveTab('inventory')} className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black transition-colors disabled:opacity-50 ${activeTab === 'inventory' ? 'text-yellow-500' : 'text-gray-500'}`}><span className="text-xl mb-0.5">📦</span>{gt.tabInventory}</button>
          <button disabled={isProcessing} onClick={() => setActiveTab('arena')} className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black transition-colors disabled:opacity-50 ${activeTab === 'arena' ? 'text-yellow-500' : 'text-gray-500'}`}><span className="text-xl mb-0.5">🏆</span>{gt.tabArena}</button>
          <button disabled={isProcessing} onClick={() => setActiveTab('guide')} className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black transition-colors disabled:opacity-50 ${activeTab === 'guide' ? 'text-yellow-500' : 'text-gray-500'}`}><span className="text-xl mb-0.5">📖</span>{gt.tabGuide}</button>
        </nav>

        {duelingTarget && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-[120] p-6 text-center">
            <div className="flex items-center gap-6 mb-8"><div className="flex items-center flex-col"><span className="text-5xl">🛡️</span><span className="text-blue-400 font-black mt-3 text-lg">{gt.meLabelDuel}</span></div><span className="text-6xl animate-bounce">⚔️</span><div className="flex items-center flex-col"><span className="text-5xl">😈</span><span className="text-red-400 font-black mt-3 text-lg">{duelingTarget.nickname}</span></div></div>
            <h2 className="text-3xl font-black text-red-500 mb-2 animate-pulse tracking-widest">{gt.duelInProgress}</h2><p className="text-gray-400 text-sm mt-4">{gt.destroyingArmor}</p>
          </div>
        )}

        {isMultiSellModalOpen && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[130] p-6">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-xl p-5 w-full max-w-sm shadow-2xl">
              <h2 className="text-lg font-black text-white mb-4 text-center">{gt.multiSellModalTitle}</h2>
              <div className="space-y-2 mb-5">
                {['normal', 'magic', 'rare', 'epic', 'legendary'].map(grade => (
                  <label key={grade} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${sellGrades[grade] ? 'bg-red-900/30 border-red-700' : 'bg-gray-800 border-gray-700'}`}>
                    <input type="checkbox" checked={sellGrades[grade]} onChange={(e) => setSellGrades(prev => ({ ...prev, [grade]: e.target.checked }))} className="w-5 h-5 accent-red-500"/>
                    <span className={`text-sm font-bold ${gradeTextColors[grade]}`}>{getGradeLabel(grade)} {gt.gradeUnit}</span>
                    <span className="text-xs text-gray-400 ml-auto">({gt.ownedCount(inventory.filter(w => w.weapon_grade === grade).length)})</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button disabled={isProcessing} onClick={() => setIsMultiSellModalOpen(false)} className="flex-1 bg-gray-700 py-3 rounded-lg text-sm text-white font-bold">{gt.cancel}</button>
                <button disabled={isProcessing} onClick={executeMultiSell} className="flex-1 bg-red-600 py-3 rounded-lg text-sm text-white font-black">{gt.executeSell}</button>
              </div>
            </div>
          </div>
        )}

        {selectedInvItem && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[110] p-6">
            <div className={`bg-gray-900 border-2 rounded-xl p-5 w-full max-w-sm text-center shadow-2xl ${gradeCardStyles[selectedInvItem.weapon_grade]}`}>
               <span className={`text-[11px] font-black tracking-wider ${gradeTextColors[selectedInvItem.weapon_grade]}`}>[{getGradeLabel(selectedInvItem.weapon_grade)}]</span>
               <h2 className="text-xl font-black text-white mt-1 mb-2">+{selectedInvItem.enhancement_level} {getWeaponDisplayName(selectedInvItem)}</h2>
               <div className="flex justify-center mb-4">
                  {renderWeaponImage(selectedInvItem.weapon_grade, selectedInvItem.enhancement_level, 'w-40 h-40 drop-shadow-2xl')}
               </div>
               <div className="bg-gray-950 inline-block px-3 py-1 rounded border border-gray-700 mb-6">
                 <p className="text-xs font-bold text-gray-200">{gt.attackLabel}: {selectedInvItem.attack.toLocaleString()}</p>
               </div>
               <div className="flex flex-col gap-2">
                 <button disabled={isProcessing} onClick={() => handleEquip('main')} className="bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-lg shadow-md transition-colors text-sm disabled:opacity-50">{gt.equipMain}</button>
                 <button disabled={isProcessing} onClick={() => handleEquip('sub')} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-lg shadow-md transition-colors text-sm disabled:opacity-50">{gt.equipSub}</button>
                 <button disabled={isProcessing} onClick={handleSell} className="bg-yellow-600 hover:bg-yellow-500 text-white font-black py-3 rounded-lg shadow-md transition-colors mt-2 text-sm disabled:opacity-50">{gt.sellItem}</button>
                 <button disabled={isProcessing} onClick={() => setSelectedInvItem(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg mt-1 border border-gray-600 text-sm disabled:opacity-50">{gt.close}</button>
               </div>
            </div>
          </div>
        )}

        {popupMsg && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
            <div className="bg-gray-800 p-5 rounded-xl border-2 border-yellow-500 text-center w-full max-w-sm">
              <h2 className="text-white font-bold leading-relaxed whitespace-pre-line text-xs mb-4">{popupMsg}</h2>
              <button onClick={() => setPopupMsg(null)} className="w-full bg-yellow-600 py-2 rounded-lg font-black text-white text-sm">{gt.confirm}</button>
            </div>
          </div>
        )}

        {warningTarget === 'main' && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
            <div className="bg-gray-900 border-2 border-red-600 p-5 rounded-xl text-center w-full max-w-sm">
              <h2 className="text-base font-black text-red-500 mb-2">{gt.dangerTitle}</h2>
              <p className="text-gray-300 text-[11px] mb-4">{gt.dangerDesc}</p>
              <div className="flex gap-2">
                <button disabled={isProcessing} onClick={() => setWarningTarget(null)} className="flex-1 bg-gray-700 py-2 rounded-lg text-xs font-bold text-gray-300 disabled:opacity-50">{gt.retreat}</button>
                <button disabled={isProcessing} onClick={() => executeEnhance('main')} className="flex-1 bg-red-600 py-2 rounded-lg text-xs font-black text-white disabled:opacity-50">{gt.pushForward}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}