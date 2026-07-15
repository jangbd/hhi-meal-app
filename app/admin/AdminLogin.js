'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
        <h1 className="text-white font-black text-lg text-center">🔒 관리자 로그인</h1>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full p-3 rounded-xl bg-slate-700 text-white placeholder-slate-400 outline-none border border-slate-600 focus:border-indigo-400"
        />
        {error && <p className="text-red-400 text-sm font-bold text-center">{error}</p>}
        <button disabled={loading} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl disabled:opacity-50">
          {loading ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
