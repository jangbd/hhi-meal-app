'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const FLEX_LIMIT = 2; 

const DUMMY_POOL = [
  { id: '11111111-1111-1111-1111-111111111111', name: '박지운', company: 'HD현대일렉트릭', department: '회전기생산부' },
  { id: '11111111-1111-1111-1111-111111111112', name: '박성호', company: 'HD현대일렉트릭', department: '변압기생산부' },
  { id: 'bb9bcb54-0bd0-447f-af33-ce4ea4ebb2be', name: '박진호', company: 'HD현대중공업', department: '의장시스템사업부' },
  { id: '44444444-4444-4444-4444-444444444444', name: '최테스트', company: 'HD현대중공업', department: '특수선사업부' },
];

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

export default function MatchingHubRealDB() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);

  const [regForm, setRegForm] = useState({ 
    name: '', company: 'HD현대중공업', department: '', position: '', hasDuplicate: false, positionDetail: '' 
  });

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
    }
    setIsSyncing(false);
    setIsChecking(false);
  };

  useEffect(() => {
    const savedUserId = localStorage.getItem('hhi_user_id');
    if (savedUserId) fetchMyProfile(savedUserId);
    else setIsChecking(false);
  }, []);

  const receivableAllowance = myProfile ? ((myProfile.sent_count || 0) + FLEX_LIMIT - (myProfile.received_count || 0)) : 0;
  
  // 💡 [수정] 누적 경고 기준을 3회에서 2회 이상으로 변경 (2진 아웃 제도 적용)
  const isBanned = myProfile && myProfile.warning_count >= 2;

  const runWithAd = async (actionCallback) => {
    setIsAdPlaying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsAdPlaying(false);
    await actionCallback();
  };

  const handleSaveProfile = async () => {
    if (!regForm.name || !regForm.company || !regForm.department || !regForm.position) return alert('필수 입력!');
    setIsSyncing(true);
    const newUserId = crypto.randomUUID();
    
    const newProfile = {
      id: newUserId,
      name: regForm.name.trim(),
      company: regForm.company.trim(),
      department: regForm.department.replace(/\s+/g, ''), 
      position: regForm.position.trim(),
      has_duplicate: regForm.hasDuplicate,
      position_detail: regForm.hasDuplicate ? regForm.positionDetail.trim() : '',
      sent_count: 0, received_count: 0, match_status: 'idle',
      warning_count: 0, success_send_streak: 0,
      sent_history: [], active_sends: [], active_receives: []
    };

    const { error } = await supabase.from('profiles').insert([newProfile]);
    if (!error) {
      localStorage.setItem('hhi_user_id', newUserId);
      await fetchMyProfile(newUserId);
    }
    setIsSyncing(false);
  };

  const _findMatch = async () => {
    setIsSyncing(true);
    const { data: pool } = await supabase.from('profiles').select('*').neq('id', myProfile.id);
    
    if (pool) {
      const available = pool.filter(u => {
        const isSameDept = u.department === myProfile.department;
        const isAlreadySent = myProfile.sent_history.includes(u.id);
        const canTargetReceive = ((u.sent_count || 0) + FLEX_LIMIT - (u.received_count || 0)) > 0; 
        const isTargetBanned = (u.warning_count || 0) >= 2; // 상대방 타겟 검증도 2회 정지 기준 반영
        return !isSameDept && !isAlreadySent && canTargetReceive && !isTargetBanned;
      });

      if(available.length > 0) {
        const randomTarget = available[Math.floor(Math.random() * available.length)];
        await supabase.from('profiles').update({ match_status: 'matched', target_info: randomTarget }).eq('id', myProfile.id);
        await fetchMyProfile(myProfile.id); 
      } else {
        alert('현재 매칭 가능한 동료가 없습니다!');
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

    await supabase.from('profiles').update({ 
      match_status: 'idle', target_info: null,
      sent_count: myProfile.sent_count + 1,
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
    const newActiveReceives = myProfile.active_receives.filter(r => r.txId !== item.txId);
    await supabase.from('profiles').update({ active_receives: newActiveReceives, received_count: myProfile.received_count + 1 }).eq('id', myProfile.id);

    const { data: senderData } = await supabase.from('profiles').select('active_sends, warning_count, success_send_streak').eq('id', item.sender_id).single();
    if (senderData) {
      const newActiveSends = senderData.active_sends.filter(s => s.txId !== item.txId);
      let newWarningCount = senderData.warning_count || 0;
      let newStreak = (senderData.success_send_streak || 0) + 1;

      if (newStreak >= 10 && newWarningCount > 0) {
        newWarningCount -= 1;
        newStreak = 0; 
      } else if (newStreak >= 10 && newWarningCount === 0) {
        newStreak = 0; 
      }

      await supabase.from('profiles').update({ 
        active_sends: newActiveSends, warning_count: newWarningCount, success_send_streak: newStreak
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

  const forceLoginAs = async (userNum) => {
    const targetId = DUMMY_POOL[userNum - 1].id;
    localStorage.setItem('hhi_user_id', targetId);
    await fetchMyProfile(targetId);
  };

  const resetAllDB = async () => {
    if(!confirm('초기화하시겠습니까?')) return;
    setIsSyncing(true);
    for (const u of DUMMY_POOL) {
      await supabase.from('profiles').update({
        match_status: 'idle', target_info: null, sent_history: [], active_sends: [], active_receives: [], 
        sent_count: 0, received_count: 0, warning_count: 0, success_send_streak: 0
      }).eq('id', u.id);
    }
    localStorage.removeItem('hhi_user_id');
    setMyProfile(null);
    setIsSyncing(false);
  };

  const cheatAddWarning = async () => {
    setIsSyncing(true);
    await supabase.from('profiles').update({ warning_count: myProfile.warning_count + 1 }).eq('id', myProfile.id);
    await fetchMyProfile(myProfile.id);
  };
  const cheatAddStreak = async () => {
    setIsSyncing(true);
    let newStreak = myProfile.success_send_streak + 1;
    let newWarning = myProfile.warning_count;
    if(newStreak >= 10 && newWarning > 0) { newWarning -= 1; newStreak = 0; alert('🎉 10회 정상 발송 달성! 경고 1회가 차감되었습니다.'); }
    else if(newStreak >= 10 && newWarning === 0) { newStreak = 0; }
    await supabase.from('profiles').update({ warning_count: newWarning, success_send_streak: newStreak }).eq('id', myProfile.id);
    await fetchMyProfile(myProfile.id);
  };

  if (isChecking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">시스템 확인 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative flex flex-col font-sans text-slate-900 shadow-xl overflow-x-hidden border-2 border-indigo-900">
      
      {/* 전면 광고 오버레이 */}
      {isAdPlaying && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm text-white animate-in fade-in duration-200">
          <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-[20px] font-black mb-2 tracking-tight">스폰서 광고 전송 중... 💰</h2>
          <p className="text-[13px] text-indigo-300 font-bold">잠시 후 요청하신 기능이 정상 실행됩니다.</p>
          <div className="absolute bottom-10 text-[10px] text-slate-500 font-bold tracking-widest border border-slate-700 px-3 py-1 rounded-full">
            ADVERTISEMENT
          </div>
        </div>
      )}

      {/* 조종판 */}
      <div className="bg-red-600 text-white p-2 text-[11px] font-black flex justify-between items-center z-50">
        <span>🛠️ 4인 무한 교차 테스트</span>
        <div className="flex gap-1 items-center">
          <button onClick={() => forceLoginAs(1)} className="bg-black/30 px-1.5 py-1 rounded hover:bg-black/50">지운(1)</button>
          <button onClick={() => forceLoginAs(2)} className="bg-black/30 px-1.5 py-1 rounded hover:bg-black/50">성호(2)</button>
          <button onClick={() => forceLoginAs(3)} className="bg-black/30 px-1.5 py-1 rounded hover:bg-black/50">진호(3)</button>
          <button onClick={() => forceLoginAs(4)} className="bg-black/30 px-1.5 py-1 rounded hover:bg-black/50">최(4)</button>
          <button onClick={resetAllDB} className="bg-white text-red-600 px-1.5 py-1 rounded">초기화</button>
        </div>
      </div>

      <header className="sticky top-0 z-30 bg-[#1a1a3c] text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href='/'} className="p-2 -ml-2 text-xl hover:text-indigo-300">←</button>
        <h1 className="text-[15px] font-black tracking-tight">칭찬 포인트 매칭소</h1>
        <div className="flex items-center">
          {myProfile && (
            <button onClick={handleRefreshStatus} className="mr-2 text-[12px] bg-indigo-500/30 px-2 py-1 rounded-full font-bold hover:bg-indigo-500/50">
              {isSyncing ? '동기화중' : '🔄 새로고침'}
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
              <h2 className="text-xl font-black text-[#1a1a3c]">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold p-2">✕</button>
            </div>
            <nav className="space-y-3">
              <Link href="/" className="block py-3.5 px-4 text-slate-600 font-bold">🍱 식단</Link>
              <Link href="/bus" className="block py-3.5 px-4 text-slate-600 font-bold">🚌 버스 시간표</Link>
              <Link href="/points" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">💎 칭찬 포인트 매칭소</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 font-bold">⚙️ 설정</Link>
            </nav>
          </div>
        </div>
      )}

      <main className="p-4 flex-1 flex flex-col pb-20">
        {!myProfile ? (
          <div className="space-y-5 my-auto text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
              <p className="text-[16px] text-amber-900 font-black mb-1">🔒 이용 전 정보 등록 필요</p>
            </div>
            <button onClick={() => forceLoginAs(1)} className="w-full py-4 bg-[#1a1a3c] text-white font-black rounded-xl text-[16px] shadow-lg">
              테스트 유저 선택 후 시작하기 👆
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            
            <div className="bg-white rounded-3xl p-4 mb-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center px-1">
                <p className="text-[13px] font-bold text-slate-600">👤 <span className="text-[#1a1a3c] font-black">{myProfile.name}</span> 님 ({myProfile.department})</p>
                <div className="flex gap-2">
                  <button onClick={cheatAddWarning} className="text-[11px] text-orange-500 font-bold underline">경고+1</button>
                  <button onClick={cheatAddStreak} className="text-[11px] text-green-600 font-bold underline">신용+1</button>
                  <button onClick={() => { localStorage.clear(); setMyProfile(null); }} className="text-[11px] text-slate-400 font-bold underline">로그아웃</button>
                </div>
              </div>
              <div className="h-px bg-slate-100"></div>
              
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

              {/* 💡 [수정] UI 패널 가이드 수치도 / 2 로 변경 */}
              <div className={`px-3 py-2 rounded-xl text-[11px] font-bold flex justify-between items-center ${myProfile.warning_count > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                <span>🚨 누적 경고: {myProfile.warning_count} / 2</span>
                {myProfile.warning_count > 0 ? (
                  <span className="text-blue-600">🌟 경고 차감까지: {10 - myProfile.success_send_streak}회 남음</span>
                ) : (
                  <span>현재 포인트 수신 가능: {Math.max(0, receivableAllowance)}회 남음</span>
                )}
              </div>
            </div>

            {/* 🚨🚨 [수정] 2회 이상 정지 시 나타나는 차단 화면 UI 문구 수정 */}
            {isBanned ? (
              <div className="bg-red-600 text-white p-6 rounded-3xl text-center shadow-xl my-auto animate-in slide-in-from-bottom-5">
                <span className="text-6xl block mb-4">🚫</span>
                <h2 className="text-[20px] font-black mb-2">계정 이용이 정지되었습니다.</h2>
                <p className="text-[13px] font-bold leading-relaxed opacity-90 break-keep">
                  누적 경고 2회 이상(허위 발송 등)으로 인해<br/>이용이 영구 제한되었습니다.<br/><br/>관련 문의는 관리자에게 접수해 주세요.
                </p>
              </div>
            ) : (
              <>
                {myProfile.match_status === 'idle' && (
                  <div className="mb-6 space-y-4">
                    <button 
                      onClick={() => runWithAd(_findMatch)} 
                      disabled={isSyncing || isAdPlaying}
                      className="w-full py-6 rounded-2xl font-black text-[18px] shadow-xl transition-all bg-[#1a1a3c] text-white hover:bg-indigo-900 active:scale-95 flex flex-col items-center gap-1"
                    >
                      <span>새로운 매칭 상대 찾기 🔍</span>
                      <span className="text-[11px] font-normal text-indigo-300 bg-black/20 px-2 py-0.5 rounded-full">클릭 시 스폰서 광고 로딩</span>
                    </button>
                    {receivableAllowance <= 0 && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center">
                        <p className="text-[12px] text-red-700 font-bold break-keep">⚠️ <strong>포인트 수신 보류 중:</strong> 포인트를 동료에게 먼저 발송해야 나도 받을 수 있는 자격이 회복됩니다!</p>
                      </div>
                    )}
                  </div>
                )}

                {myProfile.match_status === 'matched' && myProfile.target_info && (
                  <div className="mb-6 space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-6 shadow-md">
                      <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-[12px] font-black rounded-full mb-3">매칭 성공! 🎉</div>
                      <div className="bg-white p-5 rounded-2xl mt-4 border border-indigo-100 shadow-sm">
                        <p className="text-[15px] text-slate-500 font-black">{myProfile.target_info.department}</p>
                        <p className="text-[24px] font-black text-[#1a1a3c] mt-1">{myProfile.target_info.name} <span className="text-[16px] text-indigo-600">{myProfile.target_info.position}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => runWithAd(_handleSendPoint)} disabled={isSyncing || isAdPlaying} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[16px] shadow-lg flex flex-col items-center">
                        <span>✅ 발송 완료</span>
                        <span className="text-[10px] font-normal opacity-80 mt-0.5">(광고 시청 후 발송)</span>
                      </button>
                      <button onClick={async () => { await supabase.from('profiles').update({ match_status: 'idle', target_info: null }).eq('id', myProfile.id); fetchMyProfile(myProfile.id); }} className="w-1/3 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-[15px]">취소</button>
                    </div>
                  </div>
                )}

                {myProfile.active_sends.length > 0 && (
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
                                <button onClick={() => runWithAd(() => _handleResendPoint(item))} disabled={isSyncing || isAdPlaying} className="w-full py-2.5 bg-red-600 text-white rounded-lg font-black text-[13px] shadow-sm hover:bg-red-700">
                                  📤 네, 다시 보냈습니다 (광고)
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

                {myProfile.active_receives.length > 0 && (
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
                              <span className="text-[9px] font-normal opacity-80 mt-0.5">(광고 시청)</span>
                            </button>
                            
                            {item.status === 'waiting' && (
                              <button onClick={() => runWithAd(() => _handleRequestAgain(item))} disabled={isSyncing || isAdPlaying} className="w-1/3 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-[13px] flex flex-col items-center justify-center">
                                <span>🔄 다시 요청</span>
                              </button>
                            )}

                            {item.status === 're_requested' && (
                              <button disabled className="w-1/3 py-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl font-bold text-[13px] cursor-not-allowed">
                                ⏳ 대기중
                              </button>
                            )}

                            {item.status === 'resent' && (
                              <button onClick={() => runWithAd(() => _handleCancelTransaction(item))} disabled={isSyncing || isAdPlaying} className="w-1/3 py-3 bg-red-100 border border-red-300 text-red-700 rounded-xl font-bold text-[13px]">
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
              </>
            )}

          </div>
        )}
      </main>
    </div>
  );
}