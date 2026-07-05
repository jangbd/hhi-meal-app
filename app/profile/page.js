'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function MatchingHub() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  // 프로필 등록 폼
  const [regForm, setRegForm] = useState({ name: '홍길동', company: 'HD현대중공업', department: '', position: '' });
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  // 매칭 상태
  const [matchStatus, setMatchStatus] = useState('idle');
  const [targetInfo, setTargetInfo] = useState(null);
  const [candidateList, setCandidateList] = useState([]); // 동명이인 후보군

  useEffect(() => {
    const savedUserId = localStorage.getItem('hhi_user_id');
    if (savedUserId) {
      supabase.from('profiles').select('*').eq('id', savedUserId).single().then(({ data }) => {
        if (data) setMyProfile(data);
        setIsChecking(false);
      });
    } else { setIsChecking(false); }
  }, []);

  const handleSaveProfile = async () => {
    const newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
    const data = { id: newUserId, ...regForm };
    const { error } = await supabase.from('profiles').insert([data]);
    if (!error) {
      localStorage.setItem('hhi_user_id', newUserId);
      setMyProfile(data);
    }
  };

  const findMatch = async () => {
    // 8번 규칙: 같은 부서 매칭 차단 (나와 같은 department 문자열을 가진 사람 제외)
    const { data: pool } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', myProfile.id)
      .neq('department', myProfile.department);

    if (pool?.length > 0) {
      // 1.5초 광고 딜레이 흉내
      setTimeout(() => {
        const random = pool[Math.floor(Math.random() * pool.length)];
        setTargetInfo(random);
        setMatchStatus('matched');
      }, 1500);
    } else {
      alert('현재 매칭 가능한 타 부서 동료가 없습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative flex flex-col font-sans">
      <header className="sticky top-0 bg-[#1a1a3c] text-white p-4 h-14 flex items-center justify-between">
        <h1 className="font-black">칭찬 포인트 매칭소</h1>
      </header>

      <main className="p-4 flex-1">
        {!myProfile ? (
          /* 프로필 등록 폼 */
          <div className="space-y-4">
            <input className="w-full p-4 border rounded-xl" value={regForm.name} onChange={(e)=>setRegForm({...regForm, name: e.target.value})} />
            <select className="w-full p-4 border rounded-xl" onChange={(e)=>{
              if(e.target.value==='직접입력') setIsCustomCompany(true);
              else { setIsCustomCompany(false); setRegForm({...regForm, company: e.target.value}); }
            }}>
              <option>HD현대중공업</option><option>HD현대일렉트릭</option><option>직접입력</option>
            </select>
            {isCustomCompany && <input placeholder="회사명" className="w-full p-4 border rounded-xl" onChange={(e)=>setRegForm({...regForm, company: e.target.value})} />}
            <input placeholder="부서 (소속 마지막 위치까지 기입)" className="w-full p-4 border rounded-xl" onChange={(e)=>setRegForm({...regForm, department: e.target.value})} />
            <button onClick={handleSaveProfile} className="w-full py-4 bg-[#1a1a3c] text-white rounded-xl font-bold">저장하고 시작하기</button>
          </div>
        ) : (
          /* 매칭 화면 */
          <div className="space-y-6">
            {matchStatus === 'idle' && (
              <button onClick={findMatch} className="w-full py-6 bg-[#1a1a3c] text-white rounded-2xl font-black">매칭 상대 찾기</button>
            )}
            {matchStatus === 'matched' && (
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <p className="text-sm font-bold text-slate-500">{targetInfo.department}</p>
                <p className="text-2xl font-black">{targetInfo.name}</p>
                <button onClick={() => setMatchStatus('sent')} className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-bold">발송 완료</button>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="h-[50px] w-full flex items-center justify-center bg-gray-200 border-t sticky bottom-0 text-[11px] font-bold text-gray-400">
        AD 배너 위치 (Google AdSense)
      </div>
    </div>
  );
}