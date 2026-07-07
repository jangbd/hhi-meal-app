import { NextResponse } from 'next/server';

const getGrowthRange = (grade) => {
  switch(grade) {
    case 'normal': return [2, 5];
    case 'magic': return [5, 12];
    case 'rare': return [15, 30];
    case 'epic': return [40, 90];
    case 'legendary': return [120, 250];
    default: return [2, 5];
  }
};

export async function POST(request) {
  try {
    // 🔥 protectCount(무기별 남은 방어 횟수)를 다시 받아서 검증에 사용합니다.
    const { weaponLevel, protectScrolls, protectCount, scrollType, useProtect, currentAttack, weaponGrade } = await request.json();

    let successRate = 100;
    if (weaponLevel >= 12) successRate = 1;
    else if (weaponLevel >= 11) successRate = 3;
    else if (weaponLevel >= 10) successRate = 5;
    else if (weaponLevel >= 9) successRate = 10;
    else if (weaponLevel >= 8) successRate = 15;
    else if (weaponLevel >= 7) successRate = 25;
    else if (weaponLevel >= 6) successRate = 40;
    else if (weaponLevel >= 5) successRate = 60;
    else if (weaponLevel >= 4) successRate = 80;

    const roll = Math.floor(Math.random() * 100) + 1;
    const isSuccess = roll <= successRate;

    if (isSuccess) {
      let jump = 1;
      if (scrollType === 'blessed') jump = Math.floor(Math.random() * 3) + 1;

      const newLevel = weaponLevel + jump;

      const [minG, maxG] = getGrowthRange(weaponGrade || 'normal');
      let attackIncrease = 0;
      
      for (let i = 0; i < jump; i++) {
        const levelBonus = Math.floor((weaponLevel + i) * 0.5); 
        const rollAtk = Math.floor(Math.random() * (maxG - minG + 1)) + minG + levelBonus;
        attackIncrease += rollAtk;
      }

      const newAttack = (currentAttack || 0) + attackIncrease;

      let resultMessage = '';
      if (scrollType === 'blessed' && jump > 1) {
        resultMessage = `🎆 축복 대성공!! [+${newLevel}] 강이 되었습니다!\n(미친 운빨 +${jump} 점프 / ⚔️ 공격력 +${attackIncrease} 증가!)`;
      } else {
        resultMessage = `✨ 강화 성공! [+${newLevel}] 강이 되었습니다.\n(⚔️ 공격력 +${attackIncrease} 증가)`;
      }

      return NextResponse.json({ result: 'success', newLevel, newAttack, message: resultMessage });
    } else {
      if (weaponLevel >= 5) {
        // 🔥 내 가방에 주문서가 있고(protectScrolls > 0) && 무기도 버틸 수 있어야(protectCount > 0) 방어 성공!
        if (useProtect && protectScrolls > 0 && protectCount > 0) {
          return NextResponse.json({ 
            result: 'protected', 
            newLevel: weaponLevel, 
            newAttack: currentAttack, 
            message: '🛡️ 실패! 주문서가 무기를 지켰습니다.\n(해당 무기의 방어 가능 횟수가 1회 차감됩니다)' 
          });
        } else {
          return NextResponse.json({ result: 'destroyed', newLevel: 0, newAttack: 10, message: '💥 쨍그랑! 무기가 산산조각 났습니다...' });
        }
      }
      return NextResponse.json({ result: 'fail', newLevel: weaponLevel, newAttack: currentAttack, message: '강화에 실패했습니다. (파괴되지는 않습니다)' });
    }
  } catch (error) {
    return NextResponse.json({ result: 'error', message: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}