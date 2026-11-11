// 게임 데이터 (전부 오리지널 설정)
var DATA = (function () {
  var D = {};
  D.TITLE = '도트리아: 별등 유랑기';
  D.EL = {
    fire: { n: '불', c: '#ff6b3a' }, water: { n: '물', c: '#3aa0ff' }, ice: { n: '얼음', c: '#9be8ff' },
    elec: { n: '번개', c: '#c77bff' }, wind: { n: '바람', c: '#5ff0c0' }, grass: { n: '풀', c: '#8fd93a' },
    rock: { n: '바위', c: '#f0c040' }, phys: { n: '물리', c: '#f4f4f4' }
  };
  D.ELS = ['fire', 'water', 'ice', 'elec', 'wind', 'grass', 'rock'];
  D.WT = {
    sword: { n: '검', na: [.46, .44, .56, .62, .76], ca: 1.25, caSt: 20, range: 2.6, arc: 1.9, spd: 1 },
    claymore: { n: '대검', na: [.74, .7, .9, 1.15], ca: 1.7, caSt: 35, range: 3, arc: 2.3, spd: .7 },
    spear: { n: '창', na: [.48, .47, .6, .54, .82], ca: 1.35, caSt: 25, range: 3.3, arc: 1.2, spd: 1.05 },
    bow: { n: '활', na: [.38, .37, .47, .49, .62], ca: 1.3, caSt: 0, range: 16, arc: 0, spd: 1 },
    book: { n: '마법서', na: [.42, .4, .54], ca: 1.55, caSt: 25, range: 13, arc: 0, spd: .85 }
  };
  D.STAT = { hp: 'HP', atk: '공격력', def: '방어력', hpP: 'HP%', atkP: '공격력%', defP: '방어력%', cr: '치명타 확률', cd: '치명타 피해', em: '원소 숙련', er: '에너지 충전', heal: '치유 보너스', dmg: '피해 보너스', naMult: '일반 공격 피해', caMult: '강공격 피해', skillMult: '스킬 피해', burstMult: '필살기 피해', reactBonus: '반응 피해', shieldStr: '보호막 강화', stamina: '스태미나', skillCd: '스킬 재사용', plungeMult: '낙하 공격 피해',
    d_fire: '불 피해', d_water: '물 피해', d_ice: '얼음 피해', d_elec: '번개 피해', d_wind: '바람 피해', d_grass: '풀 피해', d_rock: '바위 피해', d_phys: '물리 피해' };
  D.FLAT = { hp: 1, atk: 1, def: 1, em: 1, stamina: 1 };

  // look: skin,hair,hs(헤어스타일),eye,c1,c2,c3,ex(장식),sk(치마)
  function ch(id, name, title, r, el, wt, base, asc, look, skill, burst, pas, aw, fam, spec, boss, tb, bio, lines) {
    return { id: id, name: name, title: title, r: r, el: el, wt: wt, base: base, asc: asc, look: look, skill: skill, burst: burst, pas: pas, aw: aw, fam: fam, spec: spec, boss: boss, tb: tb, bio: bio, lines: lines };
  }
  function A(n, d, m) { return { n: n, d: d, m: m }; }
  D.CHARS = [
    ch('lio', '리오', '별등을 든 유랑자', 4, 'wind', 'sword', [960, 21, 55], ['atkP', 24],
      { skin: '#ffd9b8', hair: '#f2e2a0', hs: 'short', eye: '#3ac0a0', c1: '#2e6e6a', c2: '#f4f0e0', c3: '#ffc84a', ex: ['scarf'], sk: 0 },
      { n: '회오리 베기', d: '바람을 두르고 돌진해 경로의 적에게 바람 피해를 준다.', t: 'dash', cd: 6, m: 1.9, r: 2.8 },
      { n: '별바람 폭풍', d: '거대한 회오리를 일으켜 주변 적을 끌어당기고 연속 바람 피해를 준다.', t: 'field', cost: 60, cd: 15, m: 2.6, r: 5, dur: 6, tick: .8, tm: .7, pull: 1 },
      { n: '순풍', d: '활공 스태미나 소모 -20%, 확산 반응 피해 +20%.', m: { reactBonus: 20 } },
      [A('첫 바람', '스킬 사용 횟수 +1', { charges: 1 }), A('가벼운 발', '에너지 충전 +16%', { er: 16 }), A('검풍 수련', '스킬 레벨 +3', { skillLv: 3 }), A('맞바람 찢기', '스킬 적중 시 적 저항 -20%', { resShred: 20 }), A('폭풍의 눈', '필살기 레벨 +3', { burstLv: 3 }), A('별등의 주인', '바람 피해 +30%, 필살기 비용 -15', { d_wind: 30, burstCost: -15 })],
      'jelly', 'sp_m1', 'b_root', 'tb_c', '별등 하나만 들고 아스텔 대륙을 떠도는 유랑자. 기억은 흐릿하지만 검을 쥔 손만은 망설임이 없다.', ['바람이 부는 쪽으로 가 보자.', '별등아, 길을 비춰 줘!', '아직 갈 수 있어.']),
    ch('miru', '미루', '숲지기 견습생', 4, 'grass', 'bow', [880, 19, 50], ['em', 96],
      { skin: '#ffe2c4', hair: '#7fc95a', hs: 'twin', eye: '#e0a030', c1: '#4a8a3a', c2: '#f0e8c8', c3: '#d85a6a', ex: ['leaf'], sk: 1 },
      { n: '씨앗 폭죽', d: '폭발하는 씨앗을 던져 범위 풀 피해를 준다.', t: 'blast', cd: 8, m: 2.2, r: 3.5 },
      { n: '숲의 축제', d: '덩굴 정원을 펼쳐 지속 풀 피해를 주고 아군을 조금씩 치유한다.', t: 'field', cost: 60, cd: 15, m: 2.4, r: 5, dur: 8, tick: 1, tm: .6, heal: 3 },
      { n: '풀내음', d: '채집물이 미니맵에 표시된다. 원소 숙련 +40.', m: { em: 40 } },
      [A('새싹', '스킬 재사용 -20%', { skillCd: -20 }), A('이슬 머금기', 'HP +20%', { hpP: 20 }), A('씨앗 개량', '스킬 레벨 +3', { skillLv: 3 }), A('뿌리 내림', '반응 피해 +30%', { reactBonus: 30 }), A('만개', '필살기 레벨 +3', { burstLv: 3 }), A('숲의 대변인', '풀 피해 +30%, 필살기 치유 2배', { d_grass: 30, heal: 40 })],
      'jelly', 'sp_m2', 'b_root', 'tb_a', '새벽나루 숲지기의 견습생. 길을 자주 잃지만 버섯이 있는 곳은 절대 잊지 않는다.', ['버섯은 못 참지!', '숲이 화났어… 조심해!', '헤헤, 명중!']),
    ch('danbi', '단비', '나루터 창잡이', 4, 'water', 'spear', [940, 20, 54], ['hpP', 24],
      { skin: '#f4cfa8', hair: '#3a6ad8', hs: 'pony', eye: '#60d0ff', c1: '#2a4a9a', c2: '#e8f4ff', c3: '#ffd060', ex: [], sk: 0 },
      { n: '물보라 찌르기', d: '물기둥과 함께 돌진해 물 피해를 준다.', t: 'dash', cd: 7, m: 2.0, r: 2.6 },
      { n: '소나기 창무', d: '주변에 비를 내려 지속 물 피해를 준다. 캐릭터를 따라다닌다.', t: 'field', cost: 60, cd: 15, m: 2.0, r: 4, dur: 9, tick: 1, tm: .65, follow: 1 },
      { n: '물길 읽기', d: '수영 스태미나 소모 -20%, HP +10%.', m: { hpP: 10 } },
      [A('잔물결', '에너지 충전 +16%', { er: 16 }), A('깊은 호흡', '필살기 지속 피해 +25%', { burstMult: 25 }), A('창술 수련', '스킬 레벨 +3', { skillLv: 3 }), A('급류', '스킬 재사용 -20%', { skillCd: -20 }), A('장마', '필살기 레벨 +3', { burstLv: 3 }), A('나루의 수호자', '물 피해 +30%, 적 저항 -15%', { d_water: 30, resShred: 15 })],
      'horn', 'sp_m1', 'b_frost', 'tb_b', '새벽나루 나루터를 지키는 창잡이. 말수는 적지만 비 오는 날이면 콧노래를 부른다.', ['물길은 내가 연다.', '젖을 각오는 됐어?', '…나쁘지 않네.']),
    ch('haru', '하루', '불꽃놀이 장인', 4, 'fire', 'bow', [860, 22, 48], ['atkP', 24],
      { skin: '#ffd2b0', hair: '#e8502a', hs: 'spiky', eye: '#ffd040', c1: '#b83a2a', c2: '#2a2a3a', c3: '#ffd040', ex: ['band'], sk: 0 },
      { n: '폭죽 화살', d: '불화살 다섯 발을 흩뿌린다.', t: 'volley', cd: 8, m: .62, n2: 5 },
      { n: '대축제의 밤', d: '하늘에서 불꽃을 쏟아부어 넓은 범위에 불 피해를 준다.', t: 'nuke', cost: 60, cd: 15, m: 5.2, r: 6 },
      { n: '불씨', d: '치명타 확률 +8%.', m: { cr: 8 } },
      [A('심지', '폭죽 화살 +2발', { volley: 2 }), A('화약 냄새', '공격력 +16%', { atkP: 16 }), A('장인의 손', '스킬 레벨 +3', { skillLv: 3 }), A('연쇄 폭발', '불 반응 피해 +30%', { reactBonus: 30 }), A('피날레', '필살기 레벨 +3', { burstLv: 3 }), A('밤하늘의 주인', '불 피해 +30%, 치명타 피해 +30%', { d_fire: 30, cd: 30 })],
      'horn', 'sp_c1', 'b_magma', 'tb_a', '잿불 협곡 출신의 폭죽 장인. 그의 폭죽은 축제도, 도깨비 야영지도 똑같이 밝힌다.', ['펑! 하고 가 보자고!', '불 조심? 그게 뭔데?', '오늘 밤도 대성공!']),
    ch('sodam', '소담', '눈길의 대검사', 4, 'ice', 'claymore', [1020, 20, 58], ['defP', 30],
      { skin: '#fff0e4', hair: '#cfe8ff', hs: 'bob', eye: '#5a8aff', c1: '#4a6aa8', c2: '#ffffff', c3: '#ff8ab0', ex: ['ribbon'], sk: 1 },
      { n: '서리 가르기', d: '대검을 내리찍어 주변에 얼음 피해를 주고 보호막을 얻는다.', t: 'shield', cd: 10, m: 1.8, r: 3.5, sh: 16 },
      { n: '눈보라 회전', d: '얼음 칼날을 휘둘러 지속 얼음 피해를 주는 눈보라를 남긴다.', t: 'field', cost: 60, cd: 15, m: 3.0, r: 4.5, dur: 7, tick: .9, tm: .6 },
      { n: '따뜻한 차', d: '방어력 +15%.', m: { defP: 15 } },
      [A('첫눈', '보호막 강화 +25%', { shieldStr: 25 }), A('단단한 얼음', '에너지 충전 +16%', { er: 16 }), A('검술 수련', '스킬 레벨 +3', { skillLv: 3 }), A('혹한', '치명타 확률 +12%', { cr: 12 }), A('눈보라', '필살기 레벨 +3', { burstLv: 3 }), A('설원의 방패', '얼음 피해 +30%, 스킬 재사용 -25%', { d_ice: 30, skillCd: -25 })],
      'fang', 'sp_s1', 'b_frost', 'tb_b', '서리봉 산장지기의 딸. 자기 키만 한 대검을 휘두르면서도 차는 한 방울도 흘리지 않는다.', ['추우면 말해요, 차 끓여 줄게요.', '얼어붙어라!', '후우… 끝났네요.']),
    ch('raika', '라이카', '번개 관측사', 4, 'elec', 'book', [840, 21, 48], ['er', 26],
      { skin: '#f8d8c0', hair: '#8a5ae0', hs: 'long', eye: '#ffe060', c1: '#5a3a9a', c2: '#f0e8ff', c3: '#ffe060', ex: ['hat'], sk: 1 },
      { n: '낙뢰 표식', d: '대상 위치에 번개를 떨어뜨린다.', t: 'blast', cd: 6, m: 2.0, r: 3 },
      { n: '뇌운 관측', d: '번개구름을 불러 주변 적에게 주기적으로 벼락을 내린다. 캐릭터를 따라다닌다.', t: 'field', cost: 50, cd: 15, m: 1.6, r: 5, dur: 10, tick: 1, tm: .7, follow: 1 },
      { n: '정전기', d: '에너지 충전 +12%.', m: { er: 12 } },
      [A('피뢰침', '스킬 사용 횟수 +1', { charges: 1 }), A('전류 증폭', '번개 피해 +15%', { d_elec: 15 }), A('관측 기록', '스킬 레벨 +3', { skillLv: 3 }), A('방전', '스킬 적중 시 적 저항 -15%', { resShred: 15 }), A('폭풍 전야', '필살기 레벨 +3', { burstLv: 3 }), A('뇌운의 주인', '필살기 벼락 피해 +50%', { burstMult: 50 })],
      'jelly', 'sp_c2', 'b_magma', 'tb_c', '번개를 기록하려 대륙을 도는 학자. 관측 수첩은 절반이 그을려 있다.', ['데이터… 아니, 번개 나와라!', '찌릿할 거야!', '기록 완료.']),
    ch('toram', '토람', '성벽 석공', 4, 'rock', 'spear', [1080, 19, 62], ['defP', 30],
      { skin: '#d8a880', hair: '#6a4a2a', hs: 'short', eye: '#f0c040', c1: '#8a6a3a', c2: '#d8c8a0', c3: '#f0c040', ex: ['band'], sk: 0 },
      { n: '바위 기둥', d: '바위 피해를 주고 방어력 기반의 단단한 보호막을 만든다.', t: 'shield', cd: 12, m: 1.6, r: 3.2, sh: 22 },
      { n: '대지 붕괴', d: '땅을 내리쳐 큰 범위에 바위 피해를 준다.', t: 'nuke', cost: 60, cd: 15, m: 4.6, r: 5.5 },
      { n: '석공의 눈', d: '채광 시 광석 추가 획득. 보호막 강화 +15%.', m: { shieldStr: 15 } },
      [A('주춧돌', '방어력 +20%', { defP: 20 }), A('단단한 손', '스킬 재사용 -20%', { skillCd: -20 }), A('석공술', '스킬 레벨 +3', { skillLv: 3 }), A('성벽', '보호막 강화 +30%', { shieldStr: 30 }), A('지진', '필살기 레벨 +3', { burstLv: 3 }), A('대지의 벗', '바위 피해 +30%, 파티 피해 +10%', { d_rock: 30, dmg: 10 })],
      'horn', 'sp_c2', 'b_magma', 'tb_b', '새벽나루 성벽을 쌓은 석공. 말보다 망치질이 빠르다.', ['튼튼하게 가자.', '무너져라!', '돌은 거짓말을 안 해.']),
    ch('pio', '피오', '떠돌이 악사', 4, 'wind', 'book', [900, 18, 50], ['heal', 20],
      { skin: '#ffe0c8', hair: '#58d0b0', hs: 'bob', eye: '#ff80a0', c1: '#3a9a8a', c2: '#fff8e0', c3: '#ff80a0', ex: ['hat'], sk: 0 },
      { n: '산들바람 선율', d: '바람 피해를 주고 파티 전체를 치유한다.', t: 'heal', cd: 12, m: 1.2, r: 4, heal: 14 },
      { n: '폭풍 교향곡', d: '바람 폭발 후 선율이 남아 아군을 계속 치유한다.', t: 'field', cost: 60, cd: 15, m: 2.4, r: 5, dur: 8, tick: 1, tm: .35, heal: 5, follow: 1 },
      { n: '휘파람', d: '달리기 스태미나 소모 -15%. 치유 보너스 +10%.', m: { heal: 10 } },
      [A('전주곡', '스킬 재사용 -20%', { skillCd: -20 }), A('화음', 'HP +20%', { hpP: 20 }), A('연습곡', '스킬 레벨 +3', { skillLv: 3 }), A('앙코르', '에너지 충전 +20%', { er: 20 }), A('교향곡', '필살기 레벨 +3', { burstLv: 3 }), A('바람의 지휘자', '치유 보너스 +30%, 파티 피해 +12%', { heal: 30, dmg: 12 })],
      'fang', 'sp_s1', 'b_root', 'tb_c', '피리 하나로 먹고사는 악사. 연주가 끝나면 상처도, 지갑도 가벼워져 있다.', ['한 곡 듣고 가!', '템포 올린다~', '박수는 사양 안 해.']),
    ch('serapin', '세라핀', '홍련의 서약기사', 5, 'fire', 'sword', [1180, 27, 60], ['cr', 19.2],
      { skin: '#ffe0cc', hair: '#d83a4a', hs: 'long', eye: '#ffb030', c1: '#8a1a2a', c2: '#f8e8d0', c3: '#ffc040', ex: ['cape', 'crown'], sk: 1 },
      { n: '홍련 일섬', d: '불꽃을 두르고 돌진한 뒤 일반 공격에 불 원소를 부여한다(8초).', t: 'dash', cd: 8, m: 2.5, r: 3, infuse: 8 },
      { n: '서약의 불새', d: '불새를 불러 넓은 범위를 불태운다. 이후 10초간 공격력이 오른다.', t: 'nuke', cost: 70, cd: 18, m: 6.4, r: 6.5, buff: { atkP: 25, dur: 10 } },
      { n: '꺼지지 않는 불', d: '불 피해 +12%.', m: { d_fire: 12 } },
      [A('첫 번째 서약', '스킬 사용 횟수 +1', { charges: 1 }), A('타오르는 깃', '불 반응 피해 +35%', { reactBonus: 35 }), A('홍련검술', '스킬 레벨 +3', { skillLv: 3 }), A('불새의 날개', '공격력 +20%', { atkP: 20 }), A('서약의 완성', '필살기 레벨 +3', { burstLv: 3 }), A('홍련 그 자체', '치명타 피해 +60%, 일반 공격 피해 +30%', { cd: 60, naMult: 30 })],
      'horn', 'sp_c1', 'b_magma', 'tb_a', '잿불 협곡의 옛 기사단 마지막 계승자. 서약의 불은 그녀가 포기하지 않는 한 꺼지지 않는다.', ['서약은 지켜진다.', '홍련이여, 깨어나라!', '재가 되어 흩어져라.']),
    ch('lunaria', '루나리아', '서리달의 사서', 5, 'ice', 'book', [1050, 26, 56], ['cd', 38.4],
      { skin: '#fff4ec', hair: '#b8c8ff', hs: 'long', eye: '#8060ff', c1: '#3a3a8a', c2: '#e8f0ff', c3: '#c0a0ff', ex: ['halo', 'cape'], sk: 1 },
      { n: '달서리 낙인', d: '얼음 유성을 떨어뜨려 범위 얼음 피해를 준다.', t: 'blast', cd: 7, m: 2.7, r: 4 },
      { n: '서리달 낭독', d: '달빛 서리 영역을 펼쳐 지속 얼음 피해를 주고, 영역 안의 적 저항을 깎는다.', t: 'field', cost: 70, cd: 18, m: 3.6, r: 6, dur: 9, tick: .7, tm: .75, shred: 20 },
      { n: '달빛 독서', d: '치명타 확률 +10%.', m: { cr: 10 } },
      [A('초승', '스킬 사용 횟수 +1', { charges: 1 }), A('상현', '얼음 피해 +20%', { d_ice: 20 }), A('보름 주석', '스킬 레벨 +3', { skillLv: 3 }), A('하현', '에너지 충전 +25%', { er: 25 }), A('그믐 낭독', '필살기 레벨 +3', { burstLv: 3 }), A('달 없는 밤', '필살기 피해 +60%, 치명타 확률 +15%', { burstMult: 60, cr: 15 })],
      'fang', 'sp_s2', 'b_frost', 'tb_b', '서리봉 꼭대기 도서관의 사서. 달이 뜨면 책장을 넘기는 소리가 눈보라가 된다.', ['조용히… 낭독 시간이야.', '달이 지켜보고 있어.', '다음 장으로.']),
    ch('yuna', '유나', '맑은 샘의 무녀', 5, 'water', 'book', [1300, 22, 58], ['hpP', 28.8],
      { skin: '#ffe8d8', hair: '#40c8e8', hs: 'twin', eye: '#3080ff', c1: '#2a80b0', c2: '#ffffff', c3: '#ffd880', ex: ['ribbon'], sk: 1 },
      { n: '샘물 축복', d: '물방울 정령을 불러 파티를 치유하고 주변에 물 피해를 준다.', t: 'heal', cd: 10, m: 1.6, r: 4.5, heal: 18 },
      { n: '맑은 샘의 춤', d: '샘을 펼쳐 지속 물 피해와 강한 치유를 준다. 캐릭터를 따라다닌다.', t: 'field', cost: 70, cd: 18, m: 2.8, r: 5.5, dur: 10, tick: 1, tm: .6, heal: 6, follow: 1 },
      { n: '정화', d: '치유 보너스 +15%.', m: { heal: 15 } },
      [A('첫 샘물', '스킬 재사용 -20%', { skillCd: -20 }), A('깊은 샘', 'HP +25%', { hpP: 25 }), A('무녀의 춤', '스킬 레벨 +3', { skillLv: 3 }), A('정결', '파티 피해 +15%', { dmg: 15 }), A('만월의 샘', '필살기 레벨 +3', { burstLv: 3 }), A('마르지 않는 샘', '물 피해 +40%, 치유 보너스 +30%', { d_water: 40, heal: 30 })],
      'jelly', 'sp_m2', 'b_frost', 'tb_c', '초원 끝 맑은 샘을 지키는 무녀. 그녀가 춤추면 마른 강바닥에도 물이 돈다.', ['샘이 당신을 기억할 거예요.', '맑아져라.', '다치지 마세요.']),
    ch('kairen', '카이렌', '뇌창의 방랑무사', 5, 'elec', 'spear', [1120, 28, 56], ['cr', 19.2],
      { skin: '#f0c8a0', hair: '#3a2a5a', hs: 'pony', eye: '#c080ff', c1: '#3a2a6a', c2: '#c8c0e0', c3: '#c080ff', ex: ['scarf'], sk: 0 },
      { n: '뇌전 돌파', d: '번개처럼 꿰뚫고 지나가며 번개 피해를 준다.', t: 'dash', cd: 5, m: 2.3, r: 2.8, infuse: 6 },
      { n: '천뢰 일창', d: '하늘의 벼락을 창에 실어 내리꽂는다.', t: 'nuke', cost: 60, cd: 15, m: 7.0, r: 5.5 },
      { n: '무사의 호흡', d: '공격력 +10%.', m: { atkP: 10 } },
      [A('일합', '스킬 재사용 -20%', { skillCd: -20 }), A('이합', '에너지 충전 +20%', { er: 20 }), A('삼합', '스킬 레벨 +3', { skillLv: 3 }), A('사합', '번개 피해 +25%', { d_elec: 25 }), A('오합', '필살기 레벨 +3', { burstLv: 3 }), A('무극', '필살기 피해 +50%, 스킬 사용 횟수 +1', { burstMult: 50, charges: 1 })],
      'fang', 'sp_c2', 'b_magma', 'tb_a', '이름 없는 섬에서 온 무사. 벼락이 치는 날에만 창을 닦는다.', ['한 합이면 족하다.', '뇌명!', '…시시하군.']),
    ch('elda', '엘다', '하늘길 사냥꾼', 5, 'wind', 'bow', [1040, 27, 54], ['cd', 38.4],
      { skin: '#ffe4cc', hair: '#f8f0d8', hs: 'pony', eye: '#40d0a0', c1: '#2a7a5a', c2: '#f0f0e0', c3: '#80ffd0', ex: ['ears', 'cape'], sk: 0 },
      { n: '선풍 화살', d: '회오리 화살 여섯 발을 쏜다.', t: 'volley', cd: 7, m: .7, n2: 6 },
      { n: '하늘길의 포효', d: '폭풍의 눈을 쏘아 적을 끌어당기는 거대한 회오리를 만든다.', t: 'field', cost: 70, cd: 18, m: 4.0, r: 6, dur: 7, tick: .6, tm: .7, pull: 1 },
      { n: '매의 눈', d: '치명타 피해 +20%.', m: { cd: 20 } },
      [A('첫 사냥', '화살 +2발', { volley: 2 }), A('순풍 사격', '공격력 +18%', { atkP: 18 }), A('사냥술', '스킬 레벨 +3', { skillLv: 3 }), A('역풍 찢기', '스킬 적중 시 적 저항 -25%', { resShred: 25 }), A('폭풍의 눈', '필살기 레벨 +3', { burstLv: 3 }), A('하늘의 주인', '바람 피해 +40%, 확산 피해 +50%', { d_wind: 40, reactBonus: 50 })],
      'fang', 'sp_m1', 'b_root', 'tb_c', '절벽 위에서만 사는 사냥꾼. 그녀가 뛰어내리는 건 떨어지는 게 아니라 나는 것이다.', ['바람은 내 편이야.', '놓치지 않아.', '하늘은 넓고, 넌 느려.']),
    ch('morgan', '모르간', '황금 산맥의 대장군', 5, 'rock', 'claymore', [1260, 25, 68], ['defP', 36],
      { skin: '#d0a078', hair: '#e8c060', hs: 'spiky', eye: '#ff8030', c1: '#6a5a3a', c2: '#e8d8b0', c3: '#ffd040', ex: ['horns', 'cape'], sk: 0 },
      { n: '황금 지각', d: '대지를 갈라 바위 피해를 주고 매우 단단한 보호막을 두른다.', t: 'shield', cd: 12, m: 2.4, r: 4, sh: 28 },
      { n: '산맥 낙하', d: '거대한 바위를 떨어뜨린 뒤 10초간 파티 방어력과 공격력을 올린다.', t: 'nuke', cost: 70, cd: 18, m: 6.0, r: 6, buff: { atkP: 20, defP: 30, dur: 10 } },
      { n: '장군의 위엄', d: '보호막 강화 +20%.', m: { shieldStr: 20 } },
      [A('선봉', '방어력 +25%', { defP: 25 }), A('중군', '스킬 재사용 -20%', { skillCd: -20 }), A('전술', '스킬 레벨 +3', { skillLv: 3 }), A('철벽', '보호막 강화 +40%', { shieldStr: 40 }), A('총공격', '필살기 레벨 +3', { burstLv: 3 }), A('황금 산맥', '바위 피해 +40%, 파티 피해 +15%', { d_rock: 40, dmg: 15 })],
      'horn', 'sp_c1', 'b_magma', 'tb_b', '황금 산맥 요새를 서른 해 지킨 대장군. 은퇴했다고 주장하지만 대검은 아직 따뜻하다.', ['전열을 갖춰라!', '산이 움직인다!', '은퇴는… 내일 하지.'])
  ];
  D.CH = {}; D.CHARS.forEach(function (c) { D.CH[c.id] = c; });

  // 무기: id,name,type,r,atk,sub[k,v],eff{n,d,k:[키들],v:[5단계]}
  function w(id, n, t, r, atk, sk, sv, en, ed, ek, ev) { return { id: id, name: n, type: t, r: r, atk: atk, sub: [sk, sv], eff: { n: en, d: ed, k: ek, v: ev } }; }
  var R5 = function (a) { return [a, a * 1.25, a * 1.5, a * 1.75, a * 2]; };
  D.WEAPONS = [
    w('w_s3a', '견습 기사의 검', 'sword', 3, 23, 'atkP', 6, '기본기', '일반 공격 피해 +{0}%', ['naMult'], R5(12)),
    w('w_s3b', '나루터 단검', 'sword', 3, 22, 'er', 8, '물새', '에너지 충전 +{0}%', ['er'], R5(8)),
    w('w_c3a', '벌목꾼의 대검', 'claymore', 3, 24, 'hpP', 6, '장작 패기', '강공격 피해 +{0}%', ['caMult'], R5(16)),
    w('w_c3b', '무쇠 판검', 'claymore', 3, 23, 'defP', 8, '무게', '방어력 +{0}%', ['defP'], R5(10)),
    w('w_p3a', '순찰병의 창', 'spear', 3, 23, 'cr', 3, '찌르기', '치명타 확률 +{0}%', ['cr'], R5(4)),
    w('w_p3b', '대나무 장대', 'spear', 3, 22, 'hpP', 6, '낭창', '낙하 공격 피해 +{0}%', ['plungeMult'], R5(24)),
    w('w_b3a', '사냥꾼의 활', 'bow', 3, 23, 'atkP', 6, '몰이', '강공격 피해 +{0}%', ['caMult'], R5(16)),
    w('w_b3b', '버드나무 활', 'bow', 3, 22, 'em', 20, '휘어짐', '원소 숙련 +{0}', ['em'], R5(20)),
    w('w_k3a', '낡은 주문서', 'book', 3, 23, 'er', 8, '암송', '스킬 피해 +{0}%', ['skillMult'], R5(10)),
    w('w_k3b', '약초 도감', 'book', 3, 22, 'hpP', 6, '약초 지식', '치유 보너스 +{0}%', ['heal'], R5(8)),
    w('w_s4a', '초승달 세검', 'sword', 4, 42, 'cr', 6, '달 가르기', '스킬 피해 +{0}%, 치명타 확률 +{1}%', ['skillMult', 'cr'], R5(16), R5(4)),
    w('w_s4b', '바람길 군도', 'sword', 4, 41, 'er', 13, '순풍', '공격력 +{0}%, 스태미나 +{1}', ['atkP', 'stamina'], R5(12), R5(10)),
    w('w_c4a', '산양뿔 대검', 'claymore', 4, 43, 'atkP', 9, '들이받기', '일반·강공격 피해 +{0}%', ['naMult', 'caMult'], R5(14)),
    w('w_c4b', '빙하 톱날', 'claymore', 4, 41, 'defP', 15, '빙벽', '보호막 강화 +{0}%, 방어력 +{1}%', ['shieldStr', 'defP'], R5(20), R5(8)),
    w('w_p4a', '뇌조 깃창', 'spear', 4, 42, 'atkP', 9, '급강하', '낙하 공격 피해 +{0}%, 공격력 +{1}%', ['plungeMult', 'atkP'], R5(28), R5(8)),
    w('w_p4b', '어부왕의 작살', 'spear', 4, 41, 'hpP', 9, '대어', 'HP +{0}%, 스킬 피해 +{1}%', ['hpP', 'skillMult'], R5(12), R5(12)),
    w('w_b4a', '폭죽 장인의 활', 'bow', 4, 42, 'cr', 6, '점화', '스킬 피해 +{0}%, 반응 피해 +{1}%', ['skillMult', 'reactBonus'], R5(16), R5(10)),
    w('w_b4b', '숲지기 단궁', 'bow', 4, 41, 'em', 36, '숲의 숨결', '원소 숙련 +{0}, 반응 피해 +{1}%', ['em', 'reactBonus'], R5(40), R5(12)),
    w('w_k4a', '관측사의 수첩', 'book', 4, 42, 'er', 13, '기록', '필살기 피해 +{0}%', ['burstMult'], R5(24)),
    w('w_k4b', '샘물 악보', 'book', 4, 41, 'hpP', 9, '맑은 음', '치유 보너스 +{0}%, HP +{1}%', ['heal', 'hpP'], R5(12), R5(8)),
    w('w_s4c', '대장간 강철검', 'sword', 4, 41, 'atkP', 9, '담금질', '피해 보너스 +{0}%', ['dmg'], R5(10)),
    w('w_c4c', '대장간 참마도', 'claymore', 4, 42, 'cd', 12, '무거운 일격', '강공격 피해 +{0}%', ['caMult'], R5(30)),
    w('w_p4c', '대장간 흑철창', 'spear', 4, 41, 'cr', 6, '관통', '적 저항 무시(피해 보너스) +{0}%', ['dmg'], R5(10)),
    w('w_b4c', '대장간 강궁', 'bow', 4, 42, 'atkP', 9, '팽팽한 시위', '일반 공격 피해 +{0}%', ['naMult'], R5(24)),
    w('w_k4c', '대장간 금박 서책', 'book', 4, 41, 'em', 36, '금박', '스킬·필살기 피해 +{0}%', ['skillMult', 'burstMult'], R5(12)),
    w('w_s5a', '새벽을 여는 검', 'sword', 5, 46, 'cr', 9.6, '여명', '공격력 +{0}%, 일반 공격 피해 +{1}%', ['atkP', 'naMult'], R5(20), R5(16)),
    w('w_c5a', '산맥 쪼개기', 'claymore', 5, 48, 'defP', 15, '지축', '보호막 강화 +{0}%, 피해 보너스 +{1}%', ['shieldStr', 'dmg'], R5(20), R5(12)),
    w('w_p5a', '천뢰를 꿰는 창', 'spear', 5, 48, 'cd', 14.4, '뇌관', '에너지 충전 +{0}%, 필살기 피해 +{1}%', ['er', 'burstMult'], R5(16), R5(24)),
    w('w_b5a', '하늘길의 대궁', 'bow', 5, 46, 'cd', 14.4, '활공 사격', '치명타 피해 +{0}%, 스킬 피해 +{1}%', ['cd', 'skillMult'], R5(20), R5(16)),
    w('w_k5a', '마르지 않는 샘의 서', 'book', 5, 44, 'hpP', 10.8, '원천', 'HP +{0}%, 치유 보너스 +{1}%', ['hpP', 'heal'], R5(16), R5(12)),
    w('w_s5x', '홍련의 서약검', 'sword', 5, 49, 'cd', 19.2, '붉은 서약', '불 피해 +{0}%, 공격력 +{1}%, 반응 피해 +{2}%', ['d_fire', 'atkP', 'reactBonus'], R5(16), R5(16), R5(12)),
    w('w_k5x', '서리달 교본', 'book', 5, 47, 'cr', 7.2, '달빛 주석', '얼음 피해 +{0}%, 필살기 피해 +{1}%, 치명타 피해 +{2}%', ['d_ice', 'burstMult', 'cd'], R5(16), R5(20), R5(16))
  ];
  // eff.v 정리: 인자가 여러 개면 배열의 배열
  D.WEAPONS.forEach(function (x) { /* placeholder */ });
  (function fix() {
    // w() 는 ev 이후 인자를 무시하므로 수동으로 다중 값을 설정
    var multi = { w_s4a: [R5(16), R5(4)], w_s4b: [R5(12), R5(10)], w_c4a: [R5(14), R5(14)], w_c4b: [R5(20), R5(8)], w_p4a: [R5(28), R5(8)], w_p4b: [R5(12), R5(12)], w_b4a: [R5(16), R5(10)], w_b4b: [R5(40), R5(12)], w_k4b: [R5(12), R5(8)], w_k4c: [R5(12), R5(12)], w_s5a: [R5(20), R5(16)], w_c5a: [R5(20), R5(12)], w_p5a: [R5(16), R5(24)], w_b5a: [R5(20), R5(16)], w_k5a: [R5(16), R5(12)], w_s5x: [R5(16), R5(16), R5(12)], w_k5x: [R5(16), R5(20), R5(16)] };
    D.WEAPONS.forEach(function (x) { x.eff.v = multi[x.id] || x.eff.k.map(function () { return x.eff.v; }); });
  })();
  D.WP = {}; D.WEAPONS.forEach(function (x) { D.WP[x.id] = x; });
  D.CRAFT_W = ['w_s4c', 'w_c4c', 'w_p4c', 'w_b4c', 'w_k4c'];

  // 뽑기
  var std5c = ['yuna', 'kairen', 'elda', 'morgan'], std5w = ['w_s5a', 'w_c5a', 'w_p5a', 'w_b5a', 'w_k5a'];
  var all4c = ['miru', 'danbi', 'haru', 'sodam', 'raika', 'toram', 'pio'];
  var all4w = ['w_s4a', 'w_s4b', 'w_c4a', 'w_c4b', 'w_p4a', 'w_p4b', 'w_b4a', 'w_b4b', 'w_k4a', 'w_k4b'];
  var all3w = D.WEAPONS.filter(function (x) { return x.r == 3; }).map(function (x) { return x.id; });
  D.POOL = { std5c: std5c, std5w: std5w, all4c: all4c, all4w: all4w, all3w: all3w };
  D.GACHA_RULE = {
    char: { base5: .006, soft: 73, inc: .06, hard: 90, base4: .051, p4: [.561, 1], feat5: .5, feat4: .5, cons5: 1.6, cons4: 13.0 },
    std: { base5: .006, soft: 73, inc: .06, hard: 90, base4: .051, p4: [.561, 1], feat5: 0, feat4: 0, cons5: 1.6, cons4: 13.0 },
    weapon: { base5: .007, soft: 62, inc: .07, hard: 80, base4: .06, p4: [.66, .96, 1], feat5: .75, feat4: .75, cons5: 1.88, cons4: 14.9, fateMax: 2 }
  };
  D.LIMITED = [
    { id: 'lb1', name: '홍련의 서약', sub: '기간 한정 · 세라핀', f5: ['serapin'], f4: ['haru', 'toram', 'pio'], col: '#ff5a4a' },
    { id: 'lb2', name: '서리달 낭독회', sub: '기간 한정 · 루나리아', f5: ['lunaria'], f4: ['sodam', 'raika', 'danbi'], col: '#8aa0ff' }
  ];
  D.WBANNER = { id: 'wb', name: '별을 벼린 날', sub: '무기 한정', f5: ['w_s5x', 'w_k5x'], f4: ['w_s4a', 'w_c4a', 'w_p4a', 'w_b4a', 'w_k4a'], col: '#ffc040' };
  D.SBANNER = { id: 'sb', name: '길잡이의 별등', sub: '상시', col: '#60d0b0' };
  D.BANNER_DAYS = 14;

  // 장신구
  D.SLOTS = [{ id: 'neck', n: '목걸이', main: ['hp'] }, { id: 'ring', n: '반지', main: ['atk'] }, { id: 'brace', n: '팔찌', main: ['hpP', 'atkP', 'defP', 'em', 'er'] },
  { id: 'ear', n: '귀걸이', main: ['atkP', 'hpP', 'defP', 'em', 'd_fire', 'd_water', 'd_ice', 'd_elec', 'd_wind', 'd_grass', 'd_rock'] }, { id: 'crown', n: '관', main: ['cr', 'cd', 'atkP', 'hpP', 'defP', 'heal'] }];
  D.MAINMAX = { hp: 4780, atk: 311, hpP: 46.6, atkP: 46.6, defP: 58.3, em: 187, er: 51.8, cr: 31.1, cd: 62.2, heal: 35.9, d_: 46.6 };
  D.SUBS = { hp: [209, 299], atk: [14, 19], def: [16, 23], hpP: [4.1, 5.8], atkP: [4.1, 5.8], defP: [5.1, 7.3], cr: [2.7, 3.9], cd: [5.4, 7.8], em: [16, 23], er: [4.5, 6.5] };
  D.SETS = {
    glad: { n: '검투사의 긍지', col: '#d04040', b2: { atkP: 18 }, b4: { naMult: 35 }, d2: '공격력 +18%', d4: '일반 공격 피해 +35%' },
    star: { n: '별의 잔향', col: '#f0d060', b2: { er: 20 }, b4: { burstMult: 35 }, d2: '에너지 충전 +20%', d4: '필살기 피해 +35%' },
    ember: { n: '불꽃 순례자', col: '#ff7030', b2: { d_fire: 15 }, b4: { reactBonus: 40 }, d2: '불 피해 +15%', d4: '반응 피해 +40%' },
    frost: { n: '서리 방랑자', col: '#80d0ff', b2: { d_ice: 15 }, b4: { cr: 20 }, d2: '얼음 피해 +15%', d4: '치명타 확률 +20%' },
    volt: { n: '뇌명의 맹세', col: '#b070ff', b2: { d_elec: 15 }, b4: { skillCd: -15, skillMult: 20 }, d2: '번개 피해 +15%', d4: '스킬 재사용 -15%, 스킬 피해 +20%' },
    tide: { n: '물결의 노래', col: '#40a0ff', b2: { heal: 15 }, b4: { hpP: 20, d_water: 15 }, d2: '치유 보너스 +15%', d4: 'HP +20%, 물 피해 +15%' }
  };

  // 아이템: [이름, 아이콘종류, 색, 분류, 등급, 설명]
  var I = D.ITEMS = {};
  function it(id, n, ic, col, cat, r, d, x) { I[id] = { id: id, n: n, ic: ic, col: col, cat: cat, r: r, d: d || '' }; if (x) for (var k in x) I[id][k] = x[k]; }
  it('coin', '루멘', 'coin', '#ffd040', 'cur', 3, '아스텔 대륙의 공용 화폐.');
  it('gem', '별조각', 'star', '#7ad8ff', 'cur', 5, '별등의 연료가 되는 반짝이는 조각. 160개로 별등 하나를 밝힌다.');
  it('tk_l', '인연의 별등', 'lamp', '#ff9ad0', 'cur', 5, '기간 한정 기원에 쓰는 별등.');
  it('tk_s', '길잡이 별등', 'lamp', '#7ad8ff', 'cur', 5, '상시 기원에 쓰는 별등.');
  it('glitter', '별가루', 'dust', '#ffd870', 'cur', 5, '4·5성 중복으로 얻는 귀한 가루. 교환 상점에서 쓴다.');
  it('dust', '별먼지', 'dust', '#c0a0ff', 'cur', 4, '3성 기원으로 얻는 먼지. 교환 상점에서 쓴다.');
  it('xp1', '견습 수첩', 'book', '#80c080', 'mat', 2, '캐릭터 경험치 2,000', { xp: 2000 });
  it('xp2', '모험 수첩', 'book', '#6090e0', 'mat', 3, '캐릭터 경험치 10,000', { xp: 10000 });
  it('xp3', '영웅 수첩', 'book', '#c070e0', 'mat', 4, '캐릭터 경험치 40,000', { xp: 40000 });
  it('ore1', '조각 광석', 'ore', '#a0a0b0', 'mat', 1, '무기 경험치 400', { wxp: 400 });
  it('ore2', '정제 광석', 'ore', '#60b0e0', 'mat', 2, '무기 경험치 2,000', { wxp: 2000 });
  it('ore3', '마법 광석', 'ore', '#c080ff', 'mat', 3, '무기 경험치 10,000', { wxp: 10000 });
  it('iron', '철광석', 'ore', '#8a7a6a', 'mat', 1, '대장간에서 정제할 수 있는 광석.');
  it('crystal', '수정 원석', 'gem', '#b0e0ff', 'mat', 2, '무기 제작과 정제에 쓰이는 원석.');
  it('polish', '연마 가루', 'dust', '#e0e0e0', 'mat', 3, '장신구 강화에 쓴다.');
  [['jelly', '젤리 방울', '젤리 응축액', '젤리 정수', 'drop', '#70d0a0'], ['horn', '부러진 뿔', '단단한 뿔', '황금 뿔', 'horn', '#d0b080'], ['fang', '무딘 송곳니', '날카로운 송곳니', '서릿빛 송곳니', 'fang', '#e0e0f0']].forEach(function (f) {
    for (var i = 1; i <= 3; i++) it(f[0] + i, f[i], f[4], f[5], 'mat', i, '적에게서 얻는 재료. 돌파와 특성 강화에 쓴다.');
  });
  it('b_root', '고목의 심', 'gem', '#70c040', 'mat', 4, '엘더루트의 핵. 캐릭터 돌파 재료.');
  it('b_magma', '용암 핵', 'gem', '#ff6030', 'mat', 4, '마그라스의 핵. 캐릭터 돌파 재료.');
  it('b_frost', '서리 결정', 'gem', '#90e0ff', 'mat', 4, '글라시아의 결정. 캐릭터 돌파 재료.');
  it('w_storm', '폭풍의 비늘', 'fang', '#b080ff', 'mat', 5, '템페스타의 비늘. 높은 특성 레벨에 필요하다.');
  it('starshard', '별의 파편', 'star', '#ffffff', 'val', 5, '녹스 아스트라가 삼켰던 별의 조각.');
  it('sp_m1', '바람꽃', 'flower', '#f0f0ff', 'mat', 1, '솔바람 초원의 특산물.');
  it('sp_m2', '이슬버섯', 'mush', '#80c0ff', 'mat', 1, '솔바람 초원의 특산물.');
  it('sp_c1', '불꽃백합', 'flower', '#ff6040', 'mat', 1, '잿불 협곡의 특산물.');
  it('sp_c2', '화산석영', 'gem', '#ffb040', 'mat', 1, '잿불 협곡의 특산물.');
  it('sp_s1', '서리풀', 'herb', '#a0e0e0', 'mat', 1, '서리봉 설원의 특산물.');
  it('sp_s2', '얼음수정꽃', 'flower', '#c0f0ff', 'mat', 1, '서리봉 설원의 특산물.');
  [['tb_a', '「용기」', '#e06050'], ['tb_b', '「인내」', '#5090e0'], ['tb_c', '「자유」', '#50c090']].forEach(function (f) {
    ['의 낱장', '의 교본', '의 비전'].forEach(function (s, i) { it(f[0] + (i + 1), f[1] + s, 'scroll', f[2], 'mat', i + 2, '특성 강화 재료.'); });
  });
  [['wm_a', '여명 쇳조각', '#e0a050'], ['wm_b', '황혼 쇳조각', '#a060c0'], ['wm_c', '한밤 쇳조각', '#5070c0']].forEach(function (f) {
    ['', ' 덩이', ' 주괴'].forEach(function (s, i) { it(f[0] + (i + 1), f[1] + s, 'ingot', f[2], 'mat', i + 2, '무기 돌파 재료.'); });
  });
  it('berry', '산딸기', 'fruit', '#e04060', 'food0', 1, '새콤한 열매.'); it('mush', '들버섯', 'mush', '#d0a070', 'food0', 1, '흔한 버섯.');
  it('wheat', '밀', 'herb', '#e0c060', 'food0', 1, '빵의 재료.'); it('meat', '생고기', 'meat', '#e07070', 'food0', 1, '사냥으로 얻는다.');
  it('fish', '은빛 생선', 'fish', '#a0c0e0', 'food0', 1, '낚시로 얻는다.'); it('gfish', '황금 잉어', 'fish', '#ffd040', 'food0', 3, '귀한 물고기.');
  it('egg', '새알', 'egg', '#fff0d0', 'food0', 1, ''); it('carrot', '당근', 'carrot', '#ff9030', 'food0', 1, ''); it('apple', '사과', 'fruit', '#f04030', 'food0', 1, '');
  it('herb', '약초', 'herb', '#60c060', 'food0', 1, ''); it('salt', '소금', 'dust', '#ffffff', 'food0', 1, '상점에서 판다.'); it('flour', '밀가루', 'dust', '#f0e8d0', 'food0', 1, '밀로 만들거나 상점에서 산다.');
  it('feather', '새 깃털', 'feather', '#f0f0f0', 'mat', 1, '');
  // 음식: heal(%+고정), revive, buff
  function fd(id, n, col, r, d, x) { it(id, n, 'dish', col, 'food', r, d, x); }
  fd('f_apple', '구운 사과', '#f08040', 1, 'HP 15% 회복', { heal: [15, 200] });
  fd('f_skewer', '버섯 고기 꼬치', '#c08050', 2, 'HP 26% + 600 회복', { heal: [26, 600] });
  fd('f_soup', '당근 수프', '#ffa040', 2, 'HP 30% + 800 회복', { heal: [30, 800] });
  fd('f_fish', '나루터 생선구이', '#b0d0e0', 2, 'HP 28% + 1200 회복', { heal: [28, 1200] });
  fd('f_omelet', '들판 오믈렛', '#ffe070', 2, '쓰러진 캐릭터 부활 + HP 20%', { revive: 20 });
  fd('f_steak', '달콤 산딸기 스테이크', '#d05050', 3, '파티 공격력 +20% (300초)', { buff: { atkP: 20 }, dur: 300 });
  fd('f_pie', '바람꽃 파이', '#f0e0b0', 3, '파티 치명타 확률 +12% (300초)', { buff: { cr: 12 }, dur: 300 });
  fd('f_stew', '서리풀 스튜', '#a0e0d0', 3, '파티 방어력 +30%, 스태미나 소모 -20% (300초)', { buff: { defP: 30, stSave: 20 }, dur: 300 });
  fd('f_feast', '새벽나루 만찬', '#ffd080', 4, 'HP 40% + 2500 회복, 파티 피해 +15% (300초)', { heal: [40, 2500], buff: { dmg: 15 }, dur: 300 });
  D.RECIPES = [
    { id: 'f_apple', need: { apple: 2 } }, { id: 'f_skewer', need: { mush: 1, meat: 1 } }, { id: 'f_soup', need: { carrot: 2, salt: 1 } }, { id: 'f_fish', need: { fish: 1, salt: 1 } },
    { id: 'f_omelet', need: { egg: 2, mush: 1 } }, { id: 'f_steak', need: { meat: 2, berry: 2 } }, { id: 'f_pie', need: { flour: 2, sp_m1: 1, apple: 1 } }, { id: 'f_stew', need: { sp_s1: 1, meat: 1, carrot: 1 } },
    { id: 'f_feast', need: { gfish: 1, meat: 2, flour: 2, berry: 2 } }];
  D.FORGE = [
    { out: 'ore2', n: 2, need: { iron: 3 }, coin: 100 }, { out: 'ore3', n: 1, need: { crystal: 3, iron: 2 }, coin: 300 }, { out: 'polish', n: 2, need: { crystal: 1, iron: 1 }, coin: 200 }
  ].concat(D.CRAFT_W.map(function (id) { return { out: id, n: 1, weapon: 1, need: { crystal: 25, iron: 40, wm_a1: 3 }, coin: 5000 }; }));
  D.ALCHEMY = [];
  ['jelly', 'horn', 'fang', 'tb_a', 'tb_b', 'tb_c', 'wm_a', 'wm_b', 'wm_c'].forEach(function (f) { D.ALCHEMY.push({ out: f + '2', n: 1, need: (function () { var o = {}; o[f + '1'] = 3; return o; })(), coin: 50 }); D.ALCHEMY.push({ out: f + '3', n: 1, need: (function () { var o = {}; o[f + '2'] = 3; return o; })(), coin: 150 }); });
  D.ALCHEMY.push({ out: 'flour', n: 2, need: { wheat: 2 }, coin: 0 }); D.ALCHEMY.push({ out: 'xp2', n: 1, need: { xp1: 5 }, coin: 0 }); D.ALCHEMY.push({ out: 'xp3', n: 1, need: { xp2: 4 }, coin: 0 });
  D.SHOP = {
    general: { n: '잡화점 「한 줌」', items: [['salt', 30, 20], ['flour', 40, 20], ['wheat', 20, 20], ['carrot', 40, 10], ['apple', 40, 10], ['egg', 50, 10], ['xp1', 400, 10], ['ore1', 200, 20], ['polish', 600, 10]], cur: 'coin' },
    glitter: { n: '별가루 교환소', items: [['tk_l', 5, 99], ['tk_s', 5, 99], ['xp3', 1, 30], ['ore3', 1, 30], ['w_storm', 4, 3]], cur: 'glitter' },
    dust: { n: '별먼지 교환소', items: [['tk_l', 75, 5], ['tk_s', 75, 5], ['xp2', 4, 40], ['polish', 6, 30], ['coin', 0.001, 0]], cur: 'dust' }
  };
  D.SHOP.dust.items.pop();

  // 적: rig, 기본 HP/ATK, 원소, ai
  function en(id, n, rig, hp, atk, ai, x) { var e = { id: id, n: n, rig: rig, hp: hp, atk: atk, ai: ai, spd: 3, size: 1, fam: 'horn', xp: 20 }; if (x) for (var k in x) e[k] = x[k]; return e; }
  D.ENEMIES = [
    en('sl_fire', '불 젤리', 'slime', 160, 14, 'hop', { el: 'fire', aura: 'fire', fam: 'jelly', tint: '#ff7040' }),
    en('sl_water', '물 젤리', 'slime', 160, 13, 'hop', { el: 'water', aura: 'water', fam: 'jelly', tint: '#40a0ff' }),
    en('sl_ice', '얼음 젤리', 'slime', 170, 13, 'hop', { el: 'ice', aura: 'ice', fam: 'jelly', tint: '#a0e8ff' }),
    en('sl_elec', '번개 젤리', 'slime', 150, 15, 'hop', { el: 'elec', aura: 'elec', fam: 'jelly', tint: '#b070ff' }),
    en('sl_grass', '풀 젤리', 'slime', 180, 12, 'hop', { el: 'grass', aura: 'grass', fam: 'jelly', tint: '#80d040' }),
    en('gob', '도깨비 졸개', 'gob', 220, 18, 'melee', { spd: 3.6 }),
    en('gob_arch', '도깨비 궁수', 'gobarch', 180, 16, 'ranged', { spd: 3 }),
    en('gob_shield', '도깨비 방패병', 'gobshield', 420, 22, 'melee', { spd: 2.6, shield: { el: 'grass', g: 60, weak: 'fire' }, elite: 1, xp: 60 }),
    en('gob_mage', '도깨비 주술사', 'gobmage', 380, 24, 'caster', { spd: 2.2, el: 'fire', shield: { el: 'fire', g: 50, weak: 'water' }, elite: 1, xp: 70 }),
    en('wolf', '서리이빨 늑대', 'wolf', 240, 22, 'charge', { spd: 5.5, el: 'ice', fam: 'fang' }),
    en('wisp', '등불 벌레', 'wisp', 130, 15, 'flyer', { spd: 3, el: 'elec', fam: 'jelly', fly: 1.6, tint: '#d0a0ff' }),
    en('golem', '돌거인', 'golem', 1400, 40, 'heavy', { spd: 2, size: 1.8, elite: 1, fam: 'horn', xp: 150, phyRes: 50 }),
    en('knight', '잿불 기사', 'knight', 900, 36, 'melee', { spd: 3.2, el: 'fire', size: 1.25, shield: { el: 'fire', g: 80, weak: 'water' }, elite: 1, xp: 120 }),
    en('frost_sp', '서리 정령', 'spirit', 520, 28, 'caster', { spd: 2.4, el: 'ice', fly: .6, shield: { el: 'ice', g: 60, weak: 'fire' }, elite: 1, fam: 'fang', xp: 90, tint: '#a0e0ff' }),
    en('boar', '통통멧돼지', 'boar', 60, 0, 'animal', { spd: 4.5, animal: 1, drop: 'meat', xp: 0 }),
    en('bird', '들새', 'bird', 20, 0, 'animal', { spd: 5, animal: 1, drop: 'egg', fly: .2, xp: 0 }),
    // 보스
    en('b_root', '고목의 수호자 엘더루트', 'boss_root', 5200, 34, 'boss', { size: 3.4, boss: 1, lvl: 12, weak: ['fire'], el: 'grass', mat: 'b_root', xp: 400, phases: [1, .5] }),
    en('b_magma', '용암 군주 마그라스', 'boss_magma', 6800, 40, 'boss', { size: 3.6, boss: 1, lvl: 22, weak: ['water', 'ice'], el: 'fire', mat: 'b_magma', xp: 500, phases: [1, .5] }),
    en('b_frost', '서리 여왕 글라시아', 'boss_frost', 6200, 38, 'boss', { size: 3.4, boss: 1, lvl: 30, weak: ['fire', 'elec'], el: 'ice', mat: 'b_frost', xp: 500, phases: [1, .5], fly: .5 }),
    en('b_storm', '폭풍의 비룡 템페스타', 'boss_storm', 9000, 46, 'boss', { size: 4.2, boss: 1, lvl: 36, weak: ['ice', 'rock'], el: 'elec', mat: 'w_storm', xp: 800, phases: [1, .6, .3], weekly: 1, fly: .8 }),
    en('b_nox', '별을 삼킨 자 녹스 아스트라', 'boss_nox', 10000, 50, 'boss', { size: 5.2, boss: 1, lvl: 40, weak: ['fire', 'ice', 'elec'], el: 'phys', mat: 'starshard', xp: 2000, phases: [1, .66, .33], final: 1 })
  ];
  D.EN = {}; D.ENEMIES.forEach(function (e) { D.EN[e.id] = e; });
  D.REGION = {
    meadow: { n: '솔바람 초원', lvl: 1, el: 'wind', orb: '바람구슬', fog: [150, 200, 230], spec: ['sp_m1', 'sp_m2'] },
    canyon: { n: '잿불 협곡', lvl: 14, el: 'fire', orb: '불씨구슬', fog: [230, 160, 120], spec: ['sp_c1', 'sp_c2'] },
    snow: { n: '서리봉 설원', lvl: 24, el: 'ice', orb: '서리구슬', fog: [200, 215, 235], spec: ['sp_s1', 'sp_s2'] },
    town: { n: '새벽나루', lvl: 1, el: 'wind', fog: [160, 205, 230] }
  };
  D.REACT = { vapor: '기화', melt: '해빙', overload: '폭뢰', shock: '누전', freeze: '결빙', frag: '저온방전', burn: '발화', swirl: '소용돌이', cryst: '결정화', bloom: '발아', spark: '활성', shatter: '쇄빙' };
  // 레벨 관련
  D.ASC_CAP = [20, 40, 50, 60, 70, 80, 90];
  D.charXp = function (l) { return Math.floor(80 + l * l * 6 + l * 40); };
  D.wpnXp = function (l, r) { return Math.floor((80 + l * l * 9 + l * 40) * (r == 5 ? 1.5 : r == 4 ? 1.2 : 1)); };
  D.arXp = function (l) { return 300 + l * 180; };
  D.WL_AR = [5, 10, 15, 20, 25, 30];
  D.DEW_MAX = 160; D.DEW_MS = 8 * 60000;
  return D;
})();
if (typeof module !== 'undefined') module.exports = DATA;
