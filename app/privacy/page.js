export const metadata = {
  title: '개인정보처리방침 | HD현대 식단 앱',
};

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col max-w-2xl mx-auto p-6 leading-relaxed">
      <h1 className="text-2xl font-black text-indigo-950 mb-1">개인정보처리방침</h1>
      <p className="text-sm text-slate-500 mb-8">최종 수정일: 2026년 7월 14일</p>

      <section className="space-y-6 text-[14px] text-slate-700">
        <p>
          본 개인정보처리방침은 &quot;HD현대 식단 앱&quot;(이하 &quot;본 서비스&quot;)이 수집하는 정보와 그 이용 목적, 제3자 제공 현황을 안내합니다.
          본 서비스는 별도의 회원가입이나 로그인 없이 이용할 수 있으며, 아래 기능을 이용하는 경우에 한해 최소한의 정보를 수집합니다.
        </p>

        <div>
          <h2 className="font-black text-indigo-900 mb-2">1. 수집하는 정보</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <b>포인트 매칭소 이용 시</b>: 이름, 소속 회사, 부서, 직급 등 이용자가 직접 입력한 정보. 로그인 계정이 아닌 기기에 저장되는 임의의 익명 식별자와 연결되어 저장됩니다.
            </li>
            <li>
              <b>건의사항/문의 등록 시</b>: 입력한 문의 내용과 기기에 저장된 익명 식별자.
            </li>
            <li>
              <b>미니게임(강화의 신) 이용 시</b>: 게임 진행 데이터(보유 재화, 점수, 아이템 등)와 기기에 저장된 익명 게스트 식별자. 실명이나 연락처는 수집하지 않습니다.
            </li>
            <li>
              <b>광고 서비스 이용 시</b>: Google AdMob을 통해 광고 식별자(Advertising ID) 등 기기 관련 정보가 자동으로 수집될 수 있습니다. 이는 Google의 개인정보처리방침에 따라 처리됩니다.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-black text-indigo-900 mb-2">2. 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>식단 정보, 버스 시간표 등 서비스 콘텐츠 제공</li>
            <li>포인트 매칭소의 매칭 및 부정 이용(허위 신고 등) 방지</li>
            <li>건의사항 접수 및 서비스 개선</li>
            <li>미니게임 진행 상태 저장 및 랭킹 서비스 제공</li>
            <li>맞춤형 광고 게재 및 광고 성과 측정</li>
          </ul>
        </div>

        <div>
          <h2 className="font-black text-indigo-900 mb-2">3. 제3자 제공 및 위탁</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><b>Supabase</b>: 이용자가 입력한 정보 및 게임 데이터의 저장을 위한 데이터베이스 호스팅 서비스</li>
            <li><b>Google AdMob</b>: 광고 게재 및 광고 성과 측정을 위한 광고 서비스. 광고 식별자 등이 Google에 전달될 수 있습니다.</li>
          </ul>
          <p className="mt-2">그 외의 목적으로 제3자에게 정보를 제공하지 않습니다.</p>
        </div>

        <div>
          <h2 className="font-black text-indigo-900 mb-2">4. 보유 및 삭제</h2>
          <p>
            수집된 정보는 서비스 제공 목적 달성 시까지 보관하며, 이용자가 삭제를 요청할 경우 지체 없이 삭제합니다.
            삭제를 원하시는 경우 아래 문의처로 연락해 주세요.
          </p>
        </div>

        <div>
          <h2 className="font-black text-indigo-900 mb-2">5. 아동의 개인정보</h2>
          <p>본 서비스는 만 14세 이상을 대상으로 하며, 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.</p>
        </div>

        <div>
          <h2 className="font-black text-indigo-900 mb-2">6. 포인트 매칭소 이용에 관한 책임의 한계</h2>
          <p>
            포인트 매칭소는 HD현대 직영 임직원을 대상으로 하는 서비스이며, 이용자 간 포인트 매칭을 위한 도구를 제공할 뿐, 매칭 상대의 선정, 포인트 발송 및 수신 여부에 관한 판단과 결정은 전적으로 이용자 본인의 책임 하에 이루어집니다.
            운영자는 이용자 간 발생하는 분쟁, 허위 신고, 미수신 등으로 인한 손해에 대해 어떠한 책임도 지지 않으며, 다만 서비스의 안정적 운영과 부정 이용 방지를 위해 합리적인 범위 내에서 노력합니다.
          </p>
        </div>

        <div>
          <h2 className="font-black text-indigo-900 mb-2">7. 문의처</h2>
          <p>
            개인정보 관련 문의나 삭제 요청은 아래 이메일로 연락해 주세요.<br />
            이메일: <span className="font-bold">emesis2026@gmail.com</span>
          </p>
        </div>

        <div>
          <h2 className="font-black text-indigo-900 mb-2">8. 방침 변경</h2>
          <p>본 방침은 관련 법령이나 서비스 변경에 따라 수정될 수 있으며, 변경 시 본 페이지를 통해 공지합니다.</p>
        </div>
      </section>
    </div>
  );
}
