'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import AdBanner from '../AdBanner'; 
import { dict } from '../i18n'; 

export default function MatchingHub() {
  const [lang, setLang] = useState('ko'); 
  const t = dict[lang] || dict.ko;      

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deptList, setDeptList] = useState([]);

  // 신규 가입 폼
  const [regForm, setRegForm] = useState({ 
    name: '', company: 'HD현대중공업', customCompany: '', department: '', position: '', 
    hasDuplicate: false, positionDetail: '' 
  });

  // 정보 수정 폼
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', company: 'HD현대중공업', customCompany: '', department: '', position: '', 
    hasDuplicate: false, positionDetail: ''
  });

  const fetchMyProfile = async (userId) => {
    setIsSyncing(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      if (data.warning_count >= 2) {
        alert(lang === 'ko' ? "계정이 정지되었습니다. 관리자에게 문의하세요." : "Account has been suspended.");
        localStorage.removeItem('hhi_user_id');
        window.location.reload();
        return;
      }
      setMyProfile(data);
      
      // 수정 폼에 기존 정보 세팅
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
    setIsSyncing(false); setIsChecking(false);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('my_language') || 'ko';
    setLang(savedLang);

    const savedUserId = localStorage.getItem('hhi_user_id');
    if (savedUserId) {
      fetchMyProfile(savedUserId);
    } else {
      setIsChecking(false);
    }

    async function fetchDepartments() {
      const { data } = await supabase.from('profiles').select('department');
      if (data) {
        setDeptList([...new Set(data.map(d => d.department))].filter(Boolean));
      }
    }
    fetchDepartments();
  }, []);

  const handleSaveProfile = async () => {
    const finalCompany = regForm.company === '기타' ? regForm.customCompany.trim() : regForm.company;
    if (!regForm.name || !finalCompany || !regForm.department || !regForm.position) {
      return alert(lang === 'ko' ? '모든 정보를 정확하게 입력해 주세요.' : 'Please fill out all fields.');
    }
    if (regForm.hasDuplicate && !regForm.positionDetail) {
      return alert(lang === 'ko' ? '상세 정보를 입력해 주세요.' : 'Please enter details.');
    }
    
    setIsSyncing(true);
    const newUserId = crypto.randomUUID();
    const newProfile = {
      id: newUserId, 
      name: regForm.name.trim(), 
      company: finalCompany, 
      department: regForm.department.replace(/\s+/g, ''), 
      position: regForm.position.trim(), 
      has_duplicate: regForm.hasDuplicate, 
      position_detail: regForm.hasDuplicate ? regForm.positionDetail.trim() : '',
      warning_count: 0, sent_count: 0, received_count: 0
    };

    const { error } = await supabase.from('profiles').insert([newProfile]);
    if (!error) {
      localStorage.setItem('hhi_user_id', newUserId);
      window.location.reload();
    } else {
      alert('Error saving profile');
    }
    setIsSyncing(false);
  };

  const handleUpdateProfile = async () => {
    const finalCompany = editForm.company === '기타' ? editForm.customCompany.trim() : editForm.company;
    if (!editForm.name || !finalCompany || !editForm.department || !editForm.position) {
      return alert(lang === 'ko' ? '모든 정보를 입력해 주세요.' : 'Please fill all fields.');
    }
    if (editForm.hasDuplicate && !editForm.positionDetail) {
      return alert(lang === 'ko' ? '상세 정보를 적어주세요.' : 'Please enter details.');
    }

    setIsSyncing(true);
    const updatedData = {
      name: editForm.name.trim(),
      company: finalCompany,
      department: editForm.department.replace(/\s+/g, ''),
      position: editForm.position.trim(),
      has_duplicate: editForm.hasDuplicate,
      position_detail: editForm.hasDuplicate ? editForm.positionDetail.trim() : ''
    };

    const { error } = await supabase
      .from('profiles')
      .update(updatedData)
      .eq('id', myProfile.id);

    if (!error) {
      alert(lang === 'ko' ? '수정이 완료되었습니다!' : 'Update Success!');
      setIsEditing(false);
      await fetchMyProfile(myProfile.id);
    } else {
      alert('Update failed.');
    }
    setIsSyncing(false);
  };

  const handleLogout = () => {
    if (confirm(lang === 'ko' ? "다른 사용자로 변경하시겠습니까?" : "Change user?")) {
      localStorage.removeItem('hhi_user_id');
      window.location.reload();
    }
  };

  if (isChecking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative flex flex-col font-sans text-slate-900 shadow-xl overflow-x-hidden">
      
      <header className="sticky top-0 z-30 bg-[#1a1a3c] text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href='/'} className="p-2 -ml-2 text-xl hover:text-indigo-300">←</button>
        <h1 className="text-[15px] font-black tracking-tight truncate max-w-[200px]">{t.title}</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl ml-auto">☰</button>
      </header>

      {/* 햄버거 메뉴 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-[#1a1a3c]">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold p-2">✕</button>
              </div>
              <nav className="space-y-3">
                <Link href="/" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_meal}</Link>
                <Link href="/bus" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_bus}</Link>
                <Link href="/points" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">{t.menu_points}</Link>
                <Link href="/settings" className="block py-3.5 px-4 text-slate-600 font-bold">{t.menu_settings}</Link>
              </nav>
            </div>
            <button onClick={handleLogout} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-red-500 font-black text-xs rounded-xl transition-all">
              👤 {lang === 'ko' ? '사용자 변경 (로그아웃)' : 'Change User'}
            </button>
          </div>
        </div>
      )}

      <main className="p-4 flex-1 flex flex-col pb-20">
        {!myProfile ? (
          /* ==================== [신규 가입 폼 (디자인 원상복구!)] ==================== */
          <div className="space-y-5 my-auto py-4">
            {/* 상단 인트로 배너 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center shadow-sm">
              <span className="text-4xl block mb-2">✨</span>
              <h2 className="text-[18px] font-black text-[#1a1a3c] mt-2">{t.intro_title}</h2>
              <p className="text-[13px] text-slate-500 font-bold mt-2 break-keep leading-relaxed">{t.intro_desc}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              
              {/* 회사 선택 */}
              <div className="space-y-1">
                <label className="text-[12px] text-slate-400 font-black ml-1">{t.form_company}</label>
                <select value={regForm.company} onChange={(e) => setRegForm({...regForm, company: e.target.value})} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none text-[15px]">
                  <option value="HD현대중공업">{t.co_hhi}</option>
                  <option value="HD현대일렉트릭">{t.co_hhe}</option>
                  <option value="HD현대미포">{t.co_hhm}</option>
                  <option value="HD현대삼호">{t.co_hhs}</option>
                  <option value="기타">{t.co_other}</option>
                </select>
                {regForm.company === '기타' && (
                  <input placeholder="회사명 직접 입력" value={regForm.customCompany} onChange={(e)=>setRegForm({...regForm, customCompany: e.target.value})} className="w-full p-3.5 mt-2 bg-slate-50 rounded-xl border border-indigo-200 font-bold text-[15px]" />
                )}
              </div>

              {/* 이름, 부서, 직급 입력 */}
              <input placeholder={t.form_name} value={regForm.name} onChange={(e)=>setRegForm({...regForm, name: e.target.value})} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[15px]" />
              <div className="relative">
                <input list="dept-list" placeholder={t.form_dept} value={regForm.department} onChange={(e)=>setRegForm({...regForm, department: e.target.value})} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[15px]" />
                <datalist id="dept-list">
                  {deptList.map((dept, idx) => <option key={idx} value={dept} />)}
                </datalist>
              </div>
              <input placeholder={t.form_position} value={regForm.position} onChange={(e)=>setRegForm({...regForm, position: e.target.value})} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[15px]" />
              
              {/* ✅ 동명이인 체크박스 (원하시는 문구 100% 적용!) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] font-bold text-slate-600">
                  <input type="checkbox" checked={regForm.hasDuplicate} onChange={(e) => setRegForm({...regForm, hasDuplicate: e.target.checked})} className="w-4 h-4 accent-[#1a1a3c]" />
                  <span>{lang === 'ko' ? '동명이인이 있을 경우 체크해 주세요' : 'Check if there is a person with the same name'}</span>
                </label>
                {regForm.hasDuplicate && (
                  <input placeholder={lang === 'ko' ? "소속 반이나 상세 직책을 입력하세요" : "Enter detailed position/team"} value={regForm.positionDetail} onChange={(e)=>setRegForm({...regForm, positionDetail: e.target.value})} className="w-full p-2.5 bg-white rounded-lg border border-indigo-200 font-bold text-[13px]" />
                )}
              </div>

              <button onClick={handleSaveProfile} disabled={isSyncing} className="w-full mt-2 py-4 bg-[#1a1a3c] text-white font-black rounded-xl text-[16px] shadow-lg">
                {isSyncing ? 'Loading...' : t.form_submit}
              </button>
            </div>
          </div>
        ) : (
          /* ==================== [가입 후 개인정보 확인 및 수정 화면] ==================== */
          <div className="space-y-5 my-auto py-4">
            {!isEditing ? (
              // 1. 프로필 보기 모드
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6 text-center">
                <div>
                  <span className="text-5xl block mb-2">💎</span>
                  <h2 className="text-[24px] font-black text-[#1a1a3c]">{myProfile.name}</h2>
                  <p className="text-xs text-indigo-500 font-bold mt-1">{myProfile.company}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border text-left space-y-2.5 text-sm font-bold text-slate-600">
                  <p>🏢 {lang === 'ko' ? '소속 부서' : 'Department'}: <span className="text-slate-900">{myProfile.department}</span></p>
                  <p>💼 {lang === 'ko' ? '현재 직급' : 'Position'}: <span className="text-slate-900">{myProfile.position}</span></p>
                  {myProfile.has_duplicate && (
                    <p className="text-red-600">⚠️ {lang === 'ko' ? '동명이인 구분' : 'ID Detail'}: <span>{myProfile.position_detail}</span></p>
                  )}
                </div>
                <button onClick={() => setIsEditing(true)} className="w-full py-3.5 bg-indigo-950 text-white font-black rounded-xl text-sm transition-transform active:scale-95 shadow-md">
                  ✏️ {lang === 'ko' ? '개인정보 수정하기' : 'Edit My Profile'}
                </button>
              </div>
            ) : (
              // 2. 프로필 수정 모드
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-md font-black text-[#1a1a3c] border-b pb-2">✏️ {lang === 'ko' ? '정보 수정' : 'Edit Information'}</h3>
                
                <div className="space-y-1">
                  <label className="text-[12px] text-slate-400 font-black">{t.form_company}</label>
                  <select value={editForm.company} onChange={(e) => setEditForm({...editForm, company: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[14px]">
                    <option value="HD현대중공업">{t.co_hhi}</option>
                    <option value="HD현대일렉트릭">{t.co_hhe}</option>
                    <option value="HD현대미포">{t.co_hhm}</option>
                    <option value="HD현대삼호">{t.co_hhs}</option>
                    <option value="기타">{t.co_other}</option>
                  </select>
                  {editForm.company === '기타' && (
                    <input placeholder="회사명 직접 입력" value={editForm.customCompany} onChange={(e)=>setEditForm({...editForm, customCompany: e.target.value})} className="w-full p-3 mt-2 bg-slate-50 rounded-xl border border-indigo-200 font-bold text-[14px]" />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] text-slate-400 font-black">{lang === 'ko' ? '이름' : 'Name'}</label>
                  <input value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[14px]" />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] text-slate-400 font-black">{t.form_dept}</label>
                  <input list="edit-dept-list" value={editForm.department} onChange={(e)=>setEditForm({...editForm, department: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[14px]" />
                  <datalist id="edit-dept-list">
                    {deptList.map((dept, idx) => <option key={idx} value={dept} />)}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] text-slate-400 font-black">{t.form_position}</label>
                  <input value={editForm.position} onChange={(e)=>setEditForm({...editForm, position: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[14px]" />
                </div>

                {/* ✅ 수정 모드 동명이인 체크박스 (원하시는 문구 적용) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] font-bold text-slate-600">
                    <input type="checkbox" checked={editForm.hasDuplicate} onChange={(e) => setEditForm({...editForm, hasDuplicate: e.target.checked})} className="w-4 h-4 accent-[#1a1a3c]" />
                    <span>{lang === 'ko' ? '동명이인이 있을 경우 체크해 주세요' : 'Check if there is a person with the same name'}</span>
                  </label>
                  {editForm.hasDuplicate && (
                    <input placeholder={lang === 'ko' ? "소속 반이나 상세 직책을 입력하세요" : "Enter detailed position/team"} value={editForm.positionDetail} onChange={(e)=>setEditForm({...editForm, positionDetail: e.target.value})} className="w-full p-2.5 bg-white rounded-lg border border-indigo-200 font-bold text-[13px]" />
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-200 text-slate-700 font-black rounded-xl text-sm">
                    {lang === 'ko' ? '취소' : 'Cancel'}
                  </button>
                  <button onClick={handleUpdateProfile} disabled={isSyncing} className="flex-1 py-3 bg-[#1a1a3c] text-white font-black rounded-xl text-sm shadow-md">
                    {isSyncing ? 'Saving...' : (lang === 'ko' ? '저장하기' : 'Save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 하단 고정 배너 */}
      <div className="fixed bottom-0 w-full max-w-md flex items-center justify-center bg-gray-50 border-t z-40">
        <AdBanner dataAdSlot="3671427905" /> 
      </div>
    </div>
  );
}