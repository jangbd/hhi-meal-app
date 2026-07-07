import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { boxes } = await request.json();

    if (boxes <= 0) {
      return NextResponse.json({ result: 'error', message: '무기 상자가 부족합니다.' });
    }

    // 🎲 천장 없는 극악무도한 1000면체 주사위 (0.1% 단위 컨트롤)
    const roll = Math.floor(Math.random() * 1000) + 1;
    
    let grade = 'normal';
    let name = '초보자의 낡은 검';
    let protect = 3; // 기본 파괴 방지권 3회 지급

    // 📊 대형 게임사식 '극악의 맵기' 가챠 확률 테이블
    if (roll === 1000) {
      // 0.1% 확률 (전설) - 1000번 까야 1번 나옴
      grade = 'legendary';
      name = '집행자의 황금검';
    } else if (roll >= 990) {
      // 1.0% 확률 (에픽)
      grade = 'epic';
      name = '파멸의 마검';
    } else if (roll >= 940) {
      // 5.0% 확률 (희귀)
      grade = 'rare';
      name = '정령의 기사검';
    } else if (roll >= 790) {
      // 15.0% 확률 (마법)
      grade = 'magic';
      name = '강철 롱소드';
    } else {
      // 78.9% 확률 (일반) - 압도적인 꽝 확률
      grade = 'normal';
      name = '평범한 철검';
    }

    return NextResponse.json({
      result: 'success',
      weapon: { grade, name, level: 0, protect },
      message: `🎉 [${grade.toUpperCase()}] ${name} 획득!`
    });

  } catch (error) {
    return NextResponse.json({ result: 'error', message: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}