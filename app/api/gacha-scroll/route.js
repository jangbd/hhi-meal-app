import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { scrollBoxes } = await request.json();

    if (scrollBoxes <= 0) {
      return NextResponse.json({ result: 'error', message: '주문서 상자가 부족합니다.' });
    }

    // 🎲 1000면체 극악 주사위 굴리기 (0.1% 정밀도)
    const roll = Math.floor(Math.random() * 1000) + 1;
    
    let rewardType = 'normal';
    let message = '';

    if (roll >= 999) {
      // 💎 0.2% 확률 (roll 값이 999, 1000일 때만 등장) - 기적의 확률
      rewardType = 'protect_hidden';
      message = '💎 기적!! [장인의 파괴 방지권] 1개 획득! (방지 횟수 +1)';
    } else if (roll >= 900) {
      // ✨ 9.8% 확률 - 축복받은 주문서
      rewardType = 'blessed';
      message = '✨ 앗싸! [축복받은 강화 주문서] 1개 획득! (+1~+3 랜덤 강화)';
    } else {
      // 📜 90.0% 확률 - 일반 주문서 (압도적인 꽝 확률)
      rewardType = 'normal';
      message = '📜 [일반 강화 주문서] 1개를 획득했습니다.';
    }

    return NextResponse.json({ result: 'success', rewardType, message });

  } catch (error) {
    return NextResponse.json({ result: 'error', message: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}