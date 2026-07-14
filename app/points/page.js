'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { dict } from '../i18n';
import { Capacitor } from '@capacitor/core';
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { MATCHING_ENABLED } from '../featureFlags';

const FLEX_LIMIT = 2;
const IS_NATIVE = typeof window !== 'undefined' && Capacitor.isNativePlatform();
const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-1252871302557543/1091675641';
const ADMOB_TESTING_DEVICES = ['447edb99-09f5-4d08-9438-0eeec804ca41'];

// ⏳ 24시간 실시간 카운트다운 컴포넌트
const CountdownTimer = ({ sentAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = 86400000 - (Date.now() - sentAt); 
      if (diff <= 0) {
        setTimeLeft('만료됨');
        clearInterval(interval);
      } else {
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        setTimeLeft(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sentAt]);
  return <span className="font-mono font-black tracking-wider text-[15px]">{timeLeft}</span>;
};

export default function MatchingHub() {
  const [lang, setLang] = useState('ko');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [deptList, setDeptList] = useState([]); 

  const [regForm, setRegForm] = useState({ 
    name: '', company: 'HD현대중공업', customCompany: '', department: '', position: '', hasDuplicate: false, positionDetail: '' 
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', company: 'HD현대중공업', customCompany: '', department: '', position: '', hasDuplicate: false, positionDetail: ''
  });

  useEffect(() => {
    setLang(localStorage.getItem('my_language') || 'ko');
    const savedUserId = localStorage.getItem('hhi_user_id');
    if (savedUserId) fetchMyProfile(savedUserId);
    else setIsChecking(false);

    supabase.from('profiles').select('department').then(({ data }) => {
      if (data) setDeptList([...new Set(data.map(d => d.department))].filter(Boolean));
    });
  }, []);

  const t = dict[lang] || dict.ko;

  const fetchMyProfile = async (userId) => {
    setIsSyncing(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setMyProfile({
        ...data,
        sent_history: data.sent_history || [],
        target_info: data.target_info || null,
        active_sends: Array.isArray(data.active_sends) ? data.active_sends : [],
        active_receives: Array.isArray(data.active_receives) ? data.active_receives : [],
        sent_count: data.sent_count || 0,
        received_count: data.received_count || 0,
        warning_count: data.warning_count || 0,
        success_send_streak: data.success_send_streak || 0,
      });

      setEditForm({
        name: data.name,
        company: ['HD현대중공업', 'HD현대일렉트릭', 'HD현대미포', 'HD현대삼호'].includes(data.company) ? data.company : '기타',
        customCompany: ['HD현대중공업', 'HD현대일렉트릭', 'HD현대미포', 'HD현대삼호'].includes(data.company) ? '' : data.company,
        department: data.department,
        position: data.position,
        hasDuplicate: data.has_duplicate || false,
        positionDetail: data.position_detail || ''
      });
    }
    setIsSyncing(false);
    setIsChecking(false);
  };

  const receivableAllowance = myProfile ? ((myProfile.sent_count || 0) + FLEX_LIMIT - (myProfile.received_count || 0)) : 0;
  
  // 💡 경고 2회 이상이면 차단 상태
  const isBanned = myProfile && myProfile.warning_count >= 2; 

  // 💡 네이티브 앱에서는 실제 AdMob 전면 광고를 보여주고, 웹에서는 기존 시뮬레이션(1.5초 대기)을 유지.
  // 광고 로드/표시에 실패해도 매칭 진행 자체가 막히지 않도록 항상 resolve한다.
  const showInterstitialAd = () => new Promise((resolve) => {
    if (!IS_NATIVE) {
      setIsAdPlaying(true);
      setTimeout(() => { setIsAdPlaying(false); resolve(); }, 1500);
      return;
    }

    let dismissedListener, failedListener;
    const cleanup = () => { dismissedListener?.remove(); failedListener?.remove(); };

    // 💡 실제 광고가 전체화면으로 뜨므로 자체 "광고 로딩 중" 안내 화면은 띄우지 않음
    AdMob.initialize({ initializeForTesting: true, testingDevices: ADMOB_TESTING_DEVICES })
      .then(() => AdMob.prepareInterstitial({ adId: ADMOB_INTERSTITIAL_ID }))
      .then(async () => {
        dismissedListener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => { cleanup(); resolve(); });
        failedListener = await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => { cleanup(); resolve(); });
        await AdMob.showInterstitial();
      })
      .catch(() => { resolve(); });
  });

  const runWithAd = async (actionCallback) => {
    await showInterstitialAd();
    await actionCallback();
  };

  const handleSaveProfile = async () => {
    const finalCompany = regForm.company === '기타' ? regForm.customCompany.trim() : regForm.company;
    
    if (!regForm.name || !finalCompany || !regForm.department || !regForm.position) {
      return alert('모든 정보를 정확하게 입력해 주세요!');
    }
    if (regForm.hasDuplicate && !regForm.positionDetail.trim()) {
      return alert('상세 위치 정보를 입력해 주세요!');
    }

    setIsSyncing(true);

    // 💡 앱 데이터 삭제 후 재등록으로 정지(경고 2회 이상)를 우회하는 것을 막기 위해,
    // 이름+회사+부서가 일치하는 정지된 프로필이 있는지 먼저 확인한다.
    const { data: bannedMatch } = await supabase.from('profiles')
      .select('id')
      .eq('name', regForm.name.trim())
      .eq('company', finalCompany)
      .eq('department', regForm.department.replace(/\s+/g, ''))
      .gte('warning_count', 2)
      .maybeSingle();
    if (bannedMatch) {
      setIsSyncing(false);
      return alert('경고 누적으로 이용이 제한된 계정입니다. 문의사항은 설정 페이지의 건의사항으로 남겨주세요.');
    }

    const newUserId = crypto.randomUUID();

    const newProfile = {
      id: newUserId,
      name: regForm.name.trim(),
      company: finalCompany,
      department: regForm.department.replace(/\s+/g, ''), 
      position: regForm.position.trim(),
      has_duplicate: regForm.hasDuplicate,
      position_detail: regForm.hasDuplicate ? regForm.positionDetail.trim() : '',
      sent_count: 0, received_count: 0, match_status: 'idle',
      warning_count: 0, success_send_streak: 0,
      sent_history: [], active_sends: [], active_receives: [ ]
    };

    const { error } = await supabase.from('profiles').insert([newProfile]);
    if (!error) {
      localStorage.setItem('hhi_user_id', newUserId);
      await fetchMyProfile(newUserId);
    } else {
      alert('저장 오류 발생: ' + error.message);
    }
    setIsSyncing(false);
  };

  const handleUpdateProfile = async () => {
    const finalCompany = editForm.company === '기타' ? editForm.customCompany.trim() : editForm.company;
    if (!editForm.name || !finalCompany || !editForm.department || !editForm.position) {
      return alert('모든 정보를 입력해 주세요.');
    }
    if (editForm.hasDuplicate && !editForm.positionDetail) {
      return alert('상세 위치 정보를 입력해 주세요.');
    }

    setIsSyncing(true);
    const { error } = await supabase.from('profiles').update({
      name: editForm.name.trim(),
      company: finalCompany,
      department: editForm.department.replace(/\s+/g, ''),
      position: editForm.position.trim(),
      has_duplicate: editForm.hasDuplicate,
      position_detail: editForm.hasDuplicate ? editForm.positionDetail.trim() : ''
    }).eq('id', myProfile.id);

    if (!error) {
      alert('수정이 완료되었습니다!');
      setIsEditing(false);
      await fetchMyProfile(myProfile.id);
    } else {
      alert('수정 실패: ' + error.message);
    }
    setIsSyncing(false);
  };

  const _findMatch = async () => {
    setIsSyncing(true);
    const { data: pool } = await supabase.from('profiles').select('*').neq('id', myProfile.id);
    
    if (pool) {
      const available = pool.filter(u => {
        const isSameDept = u.company === myProfile.company && u.department === myProfile.department;
        const isAlreadySent = myProfile.sent_history.includes(u.id);
        const canTargetReceive = ((u.sent_count || 0) + FLEX_LIMIT - (u.received_count || 0)) > 0; 
        
        // 💡 상대방이 정지 상태면 제외
        const isTargetBanned = (u.warning_count || 0) >= 2; 
        
        return !isSameDept && !isAlreadySent && canTargetReceive && !isTargetBanned;
      });

      if(available.length > 0) {
        const randomTarget = available[Math.floor(Math.random() * available.length)];
        await supabase.from('profiles').update({ match_status: 'matched', target_info: randomTarget }).eq('id', myProfile.id);
        await fetchMyProfile(myProfile.id); 
      } else {
        alert('현재 매칭 가능한 동료가 없습니다!\n(모두 같은 부서이거나, 한도를 초과하여 포인트를 받을 수 없는 상태입니다.)');
      }
    }
    setIsSyncing(false);
  };

  const _handleSendPoint = async () => {
    setIsSyncing(true);
    const txId = crypto.randomUUID(); 
    
    const newSendItem = {
      txId, target_id: myProfile.target_info.id, target_name: myProfile.target_info.name, target_dept: myProfile.target_info.department,
      sent_at: Date.now(), status: 'waiting'
    };

    const newReceiveItem = {
      txId, sender_id: myProfile.id, sender_name: myProfile.name, sender_dept: myProfile.department,
      sent_at: Date.now(), status: 'waiting'
    };

    // 💡 여기서 sent_count 올리던 부분을 지웠습니다. (수신 확인 시 증가)
    await supabase.from('profiles').update({ 
      match_status: 'idle', target_info: null,
      sent_history: [...myProfile.sent_history, myProfile.target_info.id],
      active_sends: [...myProfile.active_sends, newSendItem]
    }).eq('id', myProfile.id);
    
    const { data: targetData } = await supabase.from('profiles').select('active_receives').eq('id', myProfile.target_info.id).single();
    await supabase.from('profiles').update({ 
      active_receives: [...(targetData?.active_receives || []), newReceiveItem] 
    }).eq('id', myProfile.target_info.id);

    await fetchMyProfile(myProfile.id); 
    setIsSyncing(false);
  };

  const _handleConfirmReceive = async (item) => {
    setIsSyncing(true);
    
    // 내 상태 업데이트 (수신 횟수 1 증가 및 리스트 삭제)
    const newActiveReceives = myProfile.active_receives.filter(r => r.txId !== item.txId);
    await supabase.from('profiles').update({ active_receives: newActiveReceives, received_count: myProfile.received_count + 1 }).eq('id', myProfile.id);

    // 상대방(발송자) 상태 업데이트
    const { data: senderData } = await supabase.from('profiles').select('active_sends, warning_count, success_send_streak, sent_count').eq('id', item.sender_id).single();
    
    if (senderData) {
      const newActiveSends = senderData.active_sends.filter(s => s.txId !== item.txId);
      let newWarningCount = senderData.warning_count || 0;
      let newStreak = (senderData.success_send_streak || 0) + 1;
      
      // 💡 여기서 상대방(보낸 사람)의 발송 횟수 증가!
      let newSentCount = (senderData.sent_count || 0) + 1; 

      // 💡 3회 성공 시 경고 1회 차감
      if (newStreak >= 3 && newWarningCount > 0) {
        newWarningCount -= 1; 
        newStreak = 0; 
      } else if (newStreak >= 3) {
        newStreak = 0; 
      }

      await supabase.from('profiles').update({ 
        active_sends: newActiveSends, 
        warning_count: newWarningCount, 
        success_send_streak: newStreak,
        sent_count: newSentCount
      }).eq('id', item.sender_id);
    }
    
    await fetchMyProfile(myProfile.id);
    setIsSyncing(false);
  };

  const _handleRequestAgain = async (item) => {
    setIsSyncing(true);
    const updatedReceives = myProfile.active_receives.map(r => r.txId === item.txId ? { ...r, status: 're_requested' } : r);
    await supabase.from('profiles').update({ active_receives: updatedReceives }).eq('id', myProfile.id);

    const { data: senderData } = await supabase.from('profiles').select('active_sends').eq('id', item.sender_id).single();
    if (senderData) {
      const updatedSends = senderData.active_sends.map(s => s.txId === item.txId ? { ...s, status: 're_requested' } : s);
      await supabase.from('profiles').update({ active_sends: updatedSends }).eq('id', item.sender_id);
    }
    await fetchMyProfile(myProfile.id);
    setIsSyncing(false);
    alert('상대방에게 [미수신] 알림을 전송했습니다.');
  };

  const _handleResendPoint = async (item) => {
    setIsSyncing(true);
    const newSentAt = Date.now();
    const updatedSends = myProfile.active_sends.map(s => s.txId === item.txId ? { ...s, status: 'resent', sent_at: newSentAt } : s);
    await supabase.from('profiles').update({ active_sends: updatedSends }).eq('id', myProfile.id);

    const { data: targetData } = await supabase.from('profiles').select('active_receives').eq('id', item.target_id).single();
    if (targetData) {
      const updatedReceives = targetData.active_receives.map(r => r.txId === item.txId ? { ...r, status: 'resent', sent_at: newSentAt } : r);
      await supabase.from('profiles').update({ active_receives: updatedReceives }).eq('id', item.target_id);
    }
    await fetchMyProfile(myProfile.id);
    setIsSyncing(false);
    alert('상대방에게 다시 보냈다고 알렸습니다!');
  };

  const _handleCancelTransaction = async (item) => {
    if(!confirm('🚨 허위 신고 처리하시겠습니까?\n이 매칭은 영구 취소되며 상대방에게 누적 경고가 부여됩니다.')) return;
    setIsSyncing(true);
    
    const newActiveReceives = myProfile.active_receives.filter(r => r.txId !== item.txId);
    await supabase.from('profiles').update({ active_receives: newActiveReceives }).eq('id', myProfile.id);

    const { data: senderData } = await supabase.from('profiles').select('active_sends, warning_count, success_send_streak').eq('id', item.sender_id).single();
    if (senderData) {
      const newActiveSends = senderData.active_sends.filter(s => s.txId !== item.txId);
      const newWarningCount = (senderData.warning_count || 0) + 1;
      
      await supabase.from('profiles').update({ 
        active_sends: newActiveSends, warning_count: newWarningCount, success_send_streak: 0 
      }).eq('id', item.sender_id);
    }
    
    await fetchMyProfile(myProfile.id);
    setIsSyncing(false);
    alert('매칭이 취소되었으며, 시스템에 허위 발송 신고가 접수되었습니다.');
  };

  const handleRefreshStatus = () => { if (myProfile) fetchMyProfile(myProfile.id); };

  if (!MATCHING_ENABLED) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 font-sans text-center p-6">
        <p className="text-slate-500 font-bold">현재 이 기능은 준비 중입니다.</p>
        <Link href="/" className="text-indigo-600 font-black underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  if (isChecking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">시스템 확인 중...</div>;

  return (
    // 💡 overflow-x-hidden 속성을 완전히 삭제하여 상단바 고정(sticky)이 풀리지 않도록 처리했습니다!
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative flex flex-col font-sans text-slate-900 shadow-xl">
      
      {/* 📺 전면 광고 오버레이 */}
      {isAdPlaying && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm text-white animate-in fade-in duration-200">
          <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-[20px] font-black mb-2 tracking-tight">스폰서 광고 로딩 중... 💰</h2>
          <p className="text-[13px] text-indigo-300 font-bold">잠시 후 요청하신 기능이 정상 실행됩니다.</p>
          <div className="absolute bottom-10 text-[10px] text-slate-500 font-bold tracking-widest border border-slate-700 px-3 py-1 rounded-full">
            ADVERTISEMENT
          </div>
        </div>
      )}

      {/* 💡 헤더는 무조건 sticky top-0 으로 상단 고정 */}
      <header className="sticky top-0 z-30 bg-[#1a1a3c] text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href='/'} className="p-2 -ml-2 text-xl hover:text-indigo-300">←</button>
        <h1 className="text-[15px] font-black tracking-tight">{t.menu_points || 'HD핵심가치 포인트 매칭소'}</h1>
        <div className="flex items-center">
          {myProfile && !isEditing && (
            <button onClick={handleRefreshStatus} className="mr-2 text-[12px] bg-indigo-500/30 px-2 py-1 rounded-full font-bold hover:bg-indigo-500/50 transition-colors">
              {isSyncing ? '동기화중' : '🔄 새로고침'}
            </button>
          )}
          <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl">☰</button>
        </div>
      </header>

      {/* 햄버거 메뉴 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-[#1a1a3c]">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold p-2">✕</button>
            </div>
            <nav className="space-y-3">
              <Link href="/" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_meal || '🍱 식단'}</Link>
              <Link href="/bus" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_bus || '🚌 버스 시간표'}</Link>
              <Link href="/points" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">{t.menu_points || '💎 HD핵심가치 포인트 매칭소'}</Link>
              <Link href="/game" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_game || '⚔️ 강화의 신'}</Link>
              <Link href="/notice" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_notice || '📢 공지사항'}</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_settings || '⚙️ 설정'}</Link>
            </nav>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 p-4 pb-20">
        {!myProfile ? (
          <div className="space-y-5 my-auto animate-in fade-in duration-300 py-4">
            
            {/* 온보딩 가이드 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="text-center mb-2">
                <span className="text-4xl">✨</span>
                <h2 className="text-[18px] font-black text-[#1a1a3c] mt-2">HD핵심가치 포인트 매칭소란?</h2>
                <p className="text-[12px] text-slate-500 font-bold mt-1">정직원이 전송가능한 HD핵심가치 포인트 매칭 플랫폼</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex gap-3 items-start bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
                  <span className="text-xl mt-0.5">🎁</span>
                  <div>
                    <p className="text-[13.5px] font-black text-indigo-900 mb-0.5">상호 교환 (품앗이)</p>
                    <p className="text-[11.5px] text-slate-600 font-bold leading-relaxed break-keep">다른 동료에게 먼저 포인트를 발송해야 나도 받을 수 있는 자격이 주어집니다. (가입 시 최초 2회 수신 여유분 제공)</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start bg-red-50/50 p-3.5 rounded-2xl border border-red-100">
                  <span className="text-xl mt-0.5">🛡️</span>
                  <div>
                    <p className="text-[13.5px] font-black text-red-900 mb-0.5">안전 거래 (에스크로)</p>
                    <p className="text-[11.5px] text-slate-600 font-bold leading-relaxed break-keep">상대방이 앱에서 '수신 확인'을 해야 완료됩니다. 허위 발송 시 경고가 누적됩니다. (3회 성공 시 경고 차감)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 회원가입 폼 */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-center shadow-sm">
              <p className="text-[14px] text-amber-900 font-black mb-1">🔒 이용 전 정보 등록 (최초 1회)</p>
              <p className="text-[11.5px] text-amber-700 font-bold leading-snug">안전한 매칭을 위해 본인의 정확한 정보를 입력해 주세요.</p>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] text-slate-400 font-black ml-1">회사 소속 선택</label>
                <select 
                  value={regForm.company} 
                  onChange={(e) => setRegForm({...regForm, company: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer text-[15px]"
                >
                  <option value="HD현대중공업">HD현대중공업</option>
                  <option value="HD현대일렉트릭">HD현대일렉트릭</option>
                  <option value="HD현대미포">HD현대미포</option>
                  <option value="HD현대삼호">HD현대삼호</option>
                  <option value="기타">기타 (직접 입력)</option>
                </select>
              </div>

              {regForm.company === '기타' && (
                <input 
                  placeholder="회사명을 직접 입력해 주세요" 
                  value={regForm.customCompany} 
                  onChange={(e) => setRegForm({...regForm, customCompany: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-indigo-200 font-bold outline-none focus:border-indigo-500 animate-in fade-in duration-200 text-[15px]"
                />
              )}

              <input placeholder="이름 (예: 홍길동)" value={regForm.name} onChange={(e)=>setRegForm({...regForm, name: e.target.value})} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-indigo-500 transition-colors" />
              
              <div className="relative">
                <input list="dept-list" placeholder="부서 (예: 의장시스템생산부)" value={regForm.department} onChange={(e)=>setRegForm({...regForm, department: e.target.value})} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-indigo-500 transition-colors" />
                <datalist id="dept-list">
                  {deptList.map((dept, idx) => <option key={idx} value={dept} />)}
                </datalist>
              </div>
              
              <input placeholder="직급 (예: 기원)" value={regForm.position} onChange={(e)=>setRegForm({...regForm, position: e.target.value})} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-indigo-500 transition-colors" />
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] font-bold text-slate-600">
                  <input type="checkbox" checked={regForm.hasDuplicate} onChange={(e) => setRegForm({...regForm, hasDuplicate: e.target.checked})} className="w-4 h-4 accent-[#1a1a3c]" />
                  <span>동명이인이 있을 경우 체크해 주세요</span>
                </label>
                {regForm.hasDuplicate && (
                  <input placeholder="소속되어 있는 과 또는 팀을 입력하세요" value={regForm.positionDetail} onChange={(e)=>setRegForm({...regForm, positionDetail: e.target.value})} className="w-full p-2.5 bg-white rounded-lg border border-indigo-200 font-bold text-[13px]" />
                )}
              </div>

              <button onClick={handleSaveProfile} disabled={isSyncing} className="w-full mt-4 py-4 bg-[#1a1a3c] text-white font-black rounded-xl text-[16px] shadow-lg hover:bg-indigo-900 transition-all">
                {isSyncing ? '서버 저장 중...' : '동의하고 매칭소 시작하기'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            
            {/* 💡 경고 상태일 때 띄우는 배너 */}
            {isBanned && !isEditing && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-4 shadow-sm">
                <h2 className="text-[14px] font-black mb-1">🚨 포인트 수신 기능 제한</h2>
                <p className="text-[12px] font-bold break-keep opacity-90 leading-relaxed">
                  누적 경고 2회 초과로 인해 <b>다른 동료가 나를 매칭 상대로 찾을 수 없도록 제한</b>되었습니다.<br/>
                  (수신 여유분이 충분해도 받을 수 없습니다.)<br/><br/>
                  💡 상대방이 수신확인을 3회 완료하면 경고가 차감되어 복구됩니다.
                </p>
              </div>
            )}

            <div className="bg-white rounded-3xl p-4 mb-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center px-1">
                <p className="text-[13px] font-bold text-slate-600">👤 <span className="text-[#1a1a3c] font-black">{myProfile.name}</span> 님 ({myProfile.company} / {myProfile.department})</p>
                <div className="flex gap-2">
                  {!isEditing && <button onClick={() => setIsEditing(true)} className="text-[11px] text-indigo-600 font-bold underline p-1">정보수정</button>}
                </div>
              </div>
              <div className="h-px bg-slate-100"></div>
              
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-2 text-center text-[12px] font-bold divide-x divide-slate-100 pb-2">
                    <div>
                      <p className="text-slate-400">내가 보낸 횟수</p>
                      <p className="text-[17px] font-black text-blue-600 mt-0.5">{myProfile.sent_count}회</p>
                    </div>
                    <div>
                      <p className="text-slate-400">내가 받은 횟수</p>
                      <p className="text-[17px] font-black text-indigo-600 mt-0.5">{myProfile.received_count}회</p>
                    </div>
                  </div>

                  <div className={`px-3 py-2 rounded-xl text-[11px] font-bold flex justify-between items-center ${myProfile.warning_count > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-500'}`}>
                    <span>🚨 누적 경고: {myProfile.warning_count}회</span>
                    {myProfile.warning_count > 0 ? (
                      <span className="text-blue-600">🌟 차감까지: 수신확인 {3 - myProfile.success_send_streak}회 남음</span>
                    ) : (
                      <span>현재 포인트 수신 가능: {Math.max(0, receivableAllowance)}회 남음</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-black ml-1">회사 소속</label>
                    <select value={editForm.company} onChange={(e) => setEditForm({...editForm, company: e.target.value})} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[13px]">
                      <option value="HD현대중공업">HD현대중공업</option>
                      <option value="HD현대일렉트릭">HD현대일렉트릭</option>
                      <option value="HD현대미포">HD현대미포</option>
                      <option value="HD현대삼호">HD현대삼호</option>
                      <option value="기타">기타 (직접 입력)</option>
                    </select>
                    {editForm.company === '기타' && (
                      <input placeholder="회사명 직접 입력" value={editForm.customCompany} onChange={(e)=>setEditForm({...editForm, customCompany: e.target.value})} className="w-full p-2.5 mt-1 bg-slate-50 rounded-xl border border-indigo-200 font-bold text-[13px]" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} placeholder="이름" className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-[13px]" />
                    <input value={editForm.position} onChange={(e)=>setEditForm({...editForm, position: e.target.value})} placeholder="직급" className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-[13px]" />
                  </div>
                  <input list="edit-dept-list" value={editForm.department} onChange={(e)=>setEditForm({...editForm, department: e.target.value})} placeholder="부서명" className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-[13px]" />
                  
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] font-bold text-slate-600">
                      <input type="checkbox" checked={editForm.hasDuplicate} onChange={(e) => setEditForm({...editForm, hasDuplicate: e.target.checked})} className="w-4 h-4 accent-[#1a1a3c]" />
                      <span>동명이인이 있을 경우 체크해 주세요</span>
                    </label>
                    {editForm.hasDuplicate && (
                      <input placeholder="소속 반이나 상세 직책을 입력하세요" value={editForm.positionDetail} onChange={(e)=>setEditForm({...editForm, positionDetail: e.target.value})} className="w-full p-2 bg-white rounded-lg border border-indigo-200 font-bold text-[12px]" />
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 font-black rounded-xl text-[13px]">취소</button>
                    <button onClick={handleUpdateProfile} disabled={isSyncing} className="flex-1 py-2.5 bg-[#1a1a3c] text-white font-black rounded-xl text-[13px] shadow-md">저장하기</button>
                  </div>
                </div>
              )}
            </div>

            {/* 🔍 매칭 대기 중 */}
            {!isEditing && myProfile.match_status === 'idle' && (
              <div className="mb-6 space-y-4">
                <button
                  onClick={_findMatch}
                  disabled={isSyncing || isAdPlaying}
                  className="w-full py-6 rounded-2xl font-black text-[18px] shadow-xl transition-all bg-[#1a1a3c] text-white hover:bg-indigo-900 active:scale-95 flex flex-col items-center gap-1"
                >
                  <span>새로운 매칭 상대 찾기 🔍</span>
                </button>

                {receivableAllowance <= 0 && !isBanned && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center">
                    <p className="text-[12px] text-red-700 font-bold break-keep">⚠️ <strong>포인트 수신 보류 중:</strong> 포인트를 동료에게 먼저 발송해야 나도 받을 수 있는 자격이 회복됩니다!</p>
                  </div>
                )}
              </div>
            )}

            {/* 🎉 매칭 완료 화면 */}
            {!isEditing && myProfile.match_status === 'matched' && myProfile.target_info && (
              <div className="mb-6 space-y-4 animate-in zoom-in-95 duration-300">
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-6 shadow-md">
                  <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-[12px] font-black rounded-full mb-3">매칭 성공! 🎉</div>
                  <div className="bg-white p-5 rounded-2xl mt-4 border border-indigo-100 shadow-sm">
                    <p className="text-[15px] text-slate-500 font-black">{myProfile.target_info.company}</p>
                    <p className="text-[15px] text-slate-500 font-black">{myProfile.target_info.department}</p>
                    <p className="text-[24px] font-black text-[#1a1a3c] mt-1">
                      {myProfile.target_info.name} <span className="text-[16px] text-indigo-600">{myProfile.target_info.position}</span>
                    </p>
                    {myProfile.target_info.has_duplicate && (
                      <p className="text-[13px] text-red-600 font-bold mt-2">💡 확인 필수: {myProfile.target_info.position_detail}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => runWithAd(_handleSendPoint)} disabled={isSyncing || isAdPlaying} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[16px] shadow-lg flex flex-col items-center hover:bg-blue-700">
                    <span>✅ 발송 완료</span>
                  </button>
                  <button onClick={async () => { await supabase.from('profiles').update({ match_status: 'idle', target_info: null }).eq('id', myProfile.id); fetchMyProfile(myProfile.id); }} className="w-1/3 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-[15px] hover:bg-slate-50">취소</button>
                </div>
              </div>
            )}

            {/* 📤 상대방 수신 대기 중 리스트 */}
            {!isEditing && myProfile.active_sends.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[14px] font-black text-slate-700 mb-3 ml-1">📤 상대방 수신 대기 중 ({myProfile.active_sends.length})</h3>
                <div className="space-y-3">
                  {myProfile.active_sends.map(item => (
                    <div key={item.txId} className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${item.status === 're_requested' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex-1 pr-2">
                        <p className="text-[12px] text-slate-500 font-bold">{item.target_dept}</p>
                        <p className="text-[16px] font-black text-[#1a1a3c]">{item.target_name}</p>
                        
                        {item.status === 're_requested' && (
                          <div className="mt-2 space-y-2">
                            <p className="text-[11.5px] text-red-600 font-bold break-keep">🚨 상대방이 미수신을 신고했습니다! 진짜로 발송해 주세요.</p>
                            <button onClick={() => runWithAd(() => _handleResendPoint(item))} disabled={isSyncing || isAdPlaying} className="w-full py-2.5 bg-red-600 text-white rounded-lg font-black text-[13px] shadow-sm hover:bg-red-700 transition-colors">
                              📤 네, 다시 보냈습니다
                            </button>
                          </div>
                        )}

                        {item.status === 'resent' && (
                          <p className="text-[11px] text-blue-600 font-bold mt-1">🔄 재발송 완료 (상대방 확인 대기중)</p>
                        )}
                      </div>
                      
                      <div className="text-right whitespace-nowrap self-start">
                        <p className="text-[11px] text-slate-400 font-bold mb-1">자동 만료까지</p>
                        <div className={`px-2 py-1 rounded-lg inline-block ${item.status === 're_requested' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                          <CountdownTimer sentAt={item.sent_at} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🎁 도착한 포인트 리스트 */}
            {!isEditing && myProfile.active_receives.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[14px] font-black text-indigo-700 mb-3 ml-1">🎁 도착한 포인트 ({myProfile.active_receives.length})</h3>
                <div className="space-y-3">
                  {myProfile.active_receives.map(item => (
                    <div key={item.txId} className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-[12px] text-indigo-600 font-bold">{item.sender_dept}</p>
                          <p className="text-[18px] font-black text-[#1a1a3c]">{item.sender_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400 font-bold mb-1">수신 유효시간</p>
                          <div className="bg-white border border-indigo-100 px-2 py-1 rounded-lg text-indigo-600">
                            <CountdownTimer sentAt={item.sent_at} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => runWithAd(() => _handleConfirmReceive(item))} 
                          disabled={isSyncing || isAdPlaying || item.status === 're_requested'} 
                          className={`flex-1 py-3 text-white rounded-xl font-black text-[14px] shadow-sm transition-all flex flex-col items-center justify-center ${item.status === 're_requested' ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          <span>✅ 진짜 받았음</span>
                        </button>
                        
                        {item.status === 'waiting' && (
                          <button onClick={() => runWithAd(() => _handleRequestAgain(item))} disabled={isSyncing || isAdPlaying} className="w-1/3 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-[13px] flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
                            <span>🔄 다시 요청</span>
                          </button>
                        )}

                        {item.status === 're_requested' && (
                          <button disabled className="w-1/3 py-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl font-bold text-[13px] cursor-not-allowed">
                            ⏳ 대기중
                          </button>
                        )}

                        {item.status === 'resent' && (
                          <button onClick={() => runWithAd(() => _handleCancelTransaction(item))} disabled={isSyncing || isAdPlaying} className="w-1/3 py-3 bg-red-100 border border-red-300 text-red-700 rounded-xl font-bold text-[13px] hover:bg-red-200 transition-colors">
                            🚨 허위 신고
                          </button>
                        )}
                      </div>

                      {item.status === 're_requested' && (
                        <p className="text-[11.5px] text-red-600 font-bold mt-3 text-center bg-red-50 py-1.5 rounded-lg border border-red-100">
                          발송자에게 알림을 보냈습니다. 재발송을 기다려주세요.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}