/**
 * ゲームごとの yaw 定数（マウス1カウントあたりの回転角・度）。
 *
 * 出どころと確認のしかたは CONTEXT.md「感度換算の係数」に記録している。
 * ここの数値を変える前に必ずそちらを読むこと。
 *
 * 係数は許諾を得た第三者のサイトが公開しているものを使っている。
 * fps の測定値とは違い、ゲーム側の仕様の定数なので、
 * **複数のサイトで一致していること**と**公開されている換算の関係を再現できること**で確かめている
 * （selftest.ts。ずれたらビルドが落ちる）。
 *
 * ゲームを増やすときは、必ず出どころを2つ以上そろえるか、自分で測って確かめること。
 */

/** Source系（CS2 / Apex など）。2つのサイトで一致 */
const YAW_SOURCE = 0.022;
/** Overwatch 2 系。2つのサイトで一致 */
const YAW_OW = 0.0066;
/** VALORANT */
const YAW_VALORANT = 0.07;
/** Fortnite（X感度％） */
const YAW_FORTNITE = 0.005555;

export type SensGame = {
  id: string;
  name: string;
  /** 感度1・1カウントあたりの回転角（度） */
  yaw: number;
  /**
   * 入力欄の見せ方。
   * 'sens' = ゲーム内の感度の数値 / 'percent' = ％表記（Fortnite の X感度）
   */
  scale: 'sens' | 'percent';
  /** そのゲームで感度を入れるときの目安の値。入力欄のプレースホルダに使う */
  placeholder: string;
  /** このゲーム固有の注意書き。無ければ null */
  note: string | null;
};

/** ％スケールのゲームは eDPI に意味が無いので出さない */
export function showsEdpi(game: SensGame): boolean {
  return game.scale === 'sens';
}

export const SENS_GAMES: SensGame[] = [
  {
    id: 'valorant',
    name: 'VALORANT',
    yaw: YAW_VALORANT,
    scale: 'sens',
    placeholder: '0.4',
    note: null,
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    yaw: YAW_SOURCE,
    scale: 'sens',
    placeholder: '1.5',
    note: null,
  },
  {
    id: 'cs2',
    name: 'CS2 / CS:GO',
    yaw: YAW_SOURCE,
    scale: 'sens',
    placeholder: '1.0',
    note: 'Apex・Deadlock・KovaaK\'s と同じスケールなので、同じDPIなら感度の数値もそのまま同じです。',
  },
  {
    id: 'overwatch2',
    name: 'Overwatch 2',
    yaw: YAW_OW,
    scale: 'sens',
    placeholder: '5',
    note: null,
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    yaw: YAW_FORTNITE,
    scale: 'percent',
    placeholder: '8',
    note: '入力するのは X感度（横方向）の％です。建築・編集用の感度は別のスライダーなので、この換算には含みません。',
  },
  {
    id: 'the-finals',
    name: 'THE FINALS',
    yaw: YAW_OW,
    scale: 'sens',
    placeholder: '5',
    note: null,
  },
  {
    id: 'marvel-rivals',
    name: 'Marvel Rivals',
    yaw: YAW_OW,
    scale: 'sens',
    placeholder: '5',
    note: null,
  },
  {
    id: 'cod',
    name: 'Call of Duty',
    yaw: YAW_OW,
    scale: 'sens',
    placeholder: '6',
    note: 'タイトルや設定によって感度のスケールが違う場合があります。実際の振り向き距離をゲーム内で確かめてください。',
  },
  {
    id: 'deadlock',
    name: 'Deadlock',
    yaw: YAW_SOURCE,
    scale: 'sens',
    placeholder: '1.0',
    note: null,
  },
  {
    id: 'kovaaks',
    name: "KovaaK's",
    yaw: YAW_SOURCE,
    scale: 'sens',
    placeholder: '1.0',
    note: 'エイム練習用。Source系と同じスケールです。',
  },
];

/*
 * データが壊れていないかを、読み込んだ時点で確かめる。
 * ゲームを足したときの入力ミスを、原因の分かる言葉で止めるため。
 */
{
  const ids = new Set<string>();
  for (const g of SENS_GAMES) {
    if (ids.has(g.id)) throw new Error(`感度の係数: id「${g.id}」が重複しています`);
    ids.add(g.id);
    if (!(g.yaw > 0)) {
      throw new Error(`${g.name}: yaw が ${g.yaw} です。正の数でなければ換算できません`);
    }
  }
}

export function findSensGame(id: string): SensGame {
  return SENS_GAMES.find((g) => g.id === id) ?? SENS_GAMES[0]!;
}
