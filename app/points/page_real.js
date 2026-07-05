'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function MatchingHub() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  // 폼 상태 정의
  const [regForm, setRegForm] = useState({ 
    name: '', 
    company: 'HD현대중공업', 
    department: '', 
    position: '',
    hasDuplicate: false,
    positionDetail: '' 
  });
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  const [matchStatus, setMatchStatus] = useState('idle');
  const [targetInfo, setTargetInfo] = useState(null);

  useEffect(() => {
    const savedUserId = localStorage.getItem('hhi_user_id');
    if (savedUserId) {
      supabase.from('profiles').select('*').eq('id', savedUserId).single().then(({ data }) => {
        if (data) setMyProfile(data);
        setIsChecking(false);
      });
    } else {
      setIsChecking(false);
    }
  }, []);

  // 프로필 저장 로직
  const handleSaveProfile = async () => {
    if (!regForm.name || !regForm.company || !regForm.department || !regForm.position) {
      return alert('모든 정보를 정확하게 입력해 주세요! 📝');
    }

    if (regForm.hasDuplicate && !regForm.positionDetail.trim()) {
      return alert('동명이인 체크를 하셨으니, 회사 앱 검색용 [소속 마지막 상세 위치]를 입력해 주세요!');
    }

    setIsRegLoading(true);
    const newUserId = crypto.randomUUID();
    
    const finalProfileData = {
      id: newUserId,
      name: regForm.name.trim(),
      company: regForm.company.trim(),
      department: regForm.department.replace(/\s+/g, ''), 
      position: regForm.position.trim(),
      has_duplicate: regForm.hasDuplicate,
      position_detail: regForm.hasDuplicate ? regForm.positionDetail.trim() : ''
    };

    const { error } = await supabase.from('profiles').insert([finalProfileData]);

    if (!error) {
      localStorage.setItem('hhi_user_id', newUserId);
      setMyProfile(finalProfileData);
      alert('🎉 회원 등록이 완료되었습니다!');
    } else {
      alert('저장 오류 발생: ' + error.message);
    }
    setIsRegLoading(false);
  };

  const findMatch = async () => {
    setIsRegLoading(true);
    const { data: pool } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', myProfile.id)
      .neq('department', myProfile.department);

    if (pool && pool.length > 0) {
      setTimeout(() => {
        const random = pool[Math.floor(Math.random() * pool.length)];
        setTargetInfo(random);
        setMatchStatus('matched');
        setIsRegLoading(false);
      }, 1500);
    } else {
      alert('현재 매칭 가능한 타 부서 동료가 없습니다.');
      setIsRegLoading(false);
    }
  };

  if (isChecking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">시스템 확인 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative flex flex-col font-sans text-slate-900 shadow-xl overflow-x-hidden">
      
      {/* 상단 앱바 */}
      <header className="sticky top-0 z-30 bg-[#1a1a3c] text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href='/'} className="p-2 -ml-2 text-xl hover:text-indigo-300">←</button>
        <h1 className="text-[15px] font-black tracking-tight">칭찬 포인트 매칭소</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl">☰</button>
      </header>

      {/* 💡 햄버거 메뉴 창에 설정 버튼 추가! */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6 animate-in slide-in-from-right-full duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-[#1a1a3c]">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold p-2">✕</button>
            </div>
            <nav className="space-y-3">
              <Link href="/" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">🍱 식단</Link>
              <Link href="/bus" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">🚌 버스 시간표</Link>
              <Link href="/points" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">💎 칭찬 포인트 매칭소</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">⚙️ 설정</Link>
            </nav>
          </div>
        </div>
      )}

      <main className="p-4 flex-1 flex flex-col">
        {!myProfile ? (
          /* =========================================
             1. 프로필 등록 폼
             ========================================= */
          <div className="space-y-5 my-auto animate-in fade-in duration-300">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-center shadow-sm">
              <p className="text-[16px] text-amber-900 font-black mb-1">🔒 이용 전 정보 등록 필요</p>
              <p className="text-[12px] text-amber-700 font-bold leading-snug">
                동명이인 구분 및 같은 부서 매칭 제외 처리를 위해<br/>최초 1회 본인의 정확한 정보를 입력해 주세요.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-500 mb-1 ml-1">이름</label>
                <input
                  placeholder="예: 홍길동"
                  value={regForm.name}
                  onChange={(e)=>setRegForm({...regForm, name: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-[#1a1a3c] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-500 mb-1 ml-1">회사명</label>
                <select
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-[#1a1a3c] transition-colors"
                  onChange={(e)=>{
                    if(e.target.value==='직접입력') { setIsCustomCompany(true); setRegForm({...regForm, company: ''}); }
                    else { setIsCustomCompany(false); setRegForm({...regForm, company: e.target.value}); }
                  }}
                >
                  <option value="HD현대중공업">HD현대중공업</option>
                  <option value="HD현대일렉트릭">HD현대일렉트릭</option>
                  <option value="직접입력">기타 (직접입력)</option>
                </select>
                {isCustomCompany && (
                  <input
                    placeholder="회사명을 직접 입력하세요"
                    onChange={(e)=>setRegForm({...regForm, company: e.target.value})}
                    className="w-full mt-2 p-3.5 bg-slate-50 rounded-xl border border-indigo-200 font-bold outline-none transition-colors"
                  />
                )}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-500 mb-1 ml-1">부서 (띄어쓰기 없이)</label>
                <input
                  placeholder="예: 의장시스템생산부"
                  value={regForm.department}
                  onChange={(e)=>setRegForm({...regForm, department: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-indigo-200 font-bold outline-none focus:border-[#1a1a3c] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-500 mb-1 ml-1">직급</label>
                <input
                  placeholder="예: 기원 / 4급기사"
                  value={regForm.position}
                  onChange={(e)=>setRegForm({...regForm, position: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-indigo-200 font-bold outline-none focus:border-[#1a1a3c] transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 mt-2 bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
                <input
                  type="checkbox"
                  id="duplicateCheck"
                  checked={regForm.hasDuplicate}
                  onChange={(e) => setRegForm({...regForm, hasDuplicate: e.target.checked})}
                  className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                />
                <label htmlFor="duplicateCheck" className="text-[13px] font-black text-red-700 cursor-pointer leading-snug">
                  우리 부서에 저와 이름이 같은<br/>동명이인이 회사에 존재합니다.
                </label>
              </div>

              {regForm.hasDuplicate && (
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 space-y-1.5 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                  <label className="block text-[13px] font-black text-indigo-950">소속 마지막 상세 위치</label>
                  <input
                    type="text"
                    placeholder="예: 선체1팀"
                    value={regForm.positionDetail}
                    onChange={(e)=>setRegForm({...regForm, positionDetail: e.target.value})}
                    className="w-full p-3.5 bg-white rounded-xl border border-indigo-200 font-bold outline-none focus:border-[#1a1a3c] shadow-sm"
                  />
                  <p className="text-[11px] text-indigo-700 font-bold leading-relaxed mt-2 break-keep">
                    ※ 칭찬포인트 공식 앱 <strong>'받는 사람'</strong>에 본인 이름을 검색 후 나오는 소속 정보<br/>
                    (예: HD현대중공업-조선사업부-건조2부-선체1팀) 중 <span className="text-red-600 font-black underline decoration-red-300 underline-offset-2">가장 마지막 부분(선체1팀)</span>을 적어주세요.
                  </p>
                </div>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={isRegLoading}
                className="w-full mt-4 py-4 bg-[#1a1a3c] text-white font-black rounded-xl text-[16px] shadow-lg hover:bg-indigo-900 active:scale-95 transition-all"
              >
                {isRegLoading ? '저장 중...' : '저장하고 매칭 시작하기'}
              </button>
            </div>
          </div>
        ) : (
          /* =========================================
             2. 매칭 홈 화면
             ========================================= */
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="bg-slate-100 rounded-2xl px-4 py-3 mb-4 border border-slate-200 flex justify-between items-center shadow-sm">
              <p className="text-[12px] font-bold text-slate-600">
                👤 내 정보: <span className="text-[#1a1a3c] font-black">{myProfile.name} ({myProfile.department})</span>
              </p>
              <button
                onClick={() => { if(confirm('프로필을 재설정하시겠습니까?')) { localStorage.clear(); setMyProfile(null); setMatchStatus('idle'); } }}
                className="text-[11px] text-red-500 font-bold underline p-1"
              >
                수정
              </button>
            </div>

            {matchStatus === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 my-auto">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <span className="text-3xl">🔍</span>
                </div>
                <button
                  onClick={findMatch}
                  className="w-full py-6 bg-[#1a1a3c] text-white rounded-2xl font-black text-[18px] shadow-xl hover:bg-indigo-900 active:scale-95 transition-all"
                >
                  매칭 상대 찾기
                </button>
                <p className="text-[12px] text-slate-400 font-bold">* 매칭 전 짧은 리워드형 배너광고가 연동됩니다.</p>
              </div>
            )}

            {matchStatus === 'matched' && targetInfo && (
              <div className="my-auto space-y-4 animate-in zoom-in-95 duration-300">
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-6 shadow-md">
                  <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-[12px] font-black rounded-full mb-3 shadow-sm">
                    매칭 성공! 🎉
                  </div>
                  <h3 className="text-[17px] font-black text-[#1a1a3c] mb-1">아래 동료에게 공식 앱으로 쏘세요!</h3>

                  <div className="bg-white p-5 rounded-2xl mt-4 border border-indigo-100 shadow-sm">
                    <p className="text-[12px] text-slate-400 font-bold mb-0.5">{targetInfo.company}</p>
                    <p className="text-[15px] text-slate-500 font-black">{targetInfo.department}</p>
                    <p className="text-[24px] font-black text-[#1a1a3c] mt-1">{targetInfo.name} <span className="text-[16px] text-indigo-600 ml-1">{targetInfo.position}</span></p>
                  </div>
                </div>

                {targetInfo.has_duplicate && (
                  <div className="bg-red-50 border border-red-200 p-5 rounded-2xl shadow-sm animate-pulse">
                    <p className="text-[13.5px] text-red-600 font-black leading-snug">
                      🚨 [주의] 해당 부서에 동명이인이 있습니다!<br/><br/>
                      회사 칭찬포인트 앱에서 '{targetInfo.name}' 검색 후,<br/>
                      소속 마지막 위치가 <span className="text-red-800 text-[15px] underline decoration-red-300 underline-offset-2 bg-red-100 px-1 rounded">[{targetInfo.position_detail || targetInfo.position}]</span> 인 사람을 정확히 골라 발송하세요!
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => setMatchStatus('sent')}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[16px] shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    ✅ 회사 앱에서 발송 완료했습니다
                  </button>
                  <button
                    onClick={() => setMatchStatus('idle')}
                    className="w-full py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-bold text-[15px] hover:bg-slate-50 transition-all"
                  >
                    다른 상대 찾기
                  </button>
                </div>
              </div>
            )}

            {matchStatus === 'sent' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 my-auto text-center">
                <span className="text-6xl mb-2 animate-bounce">⏳</span>
                <h3 className="text-[20px] font-black text-[#1a1a3c]">수신 확인 대기 중</h3>
                <p className="text-[14px] text-slate-500 font-bold px-4">상대방이 앱을 확인하면 매칭이 최종 완료됩니다.</p>
                
                <button
                  onClick={() => setMatchStatus('idle')}
                  className="w-full mt-8 py-4 bg-slate-800 text-white rounded-2xl font-black text-[15px] shadow-lg hover:bg-slate-700 active:scale-95 transition-all"
                >
                  🔄 처음 매칭 화면으로 돌아가기 (테스트용)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="h-[50px] w-full flex items-center justify-center bg-gray-200 border-t sticky bottom-0 text-[11px] font-bold text-gray-400 z-40">
        AD 배너 위치 (Google AdSense 320x50)
      </div>
    </div>
  );
}