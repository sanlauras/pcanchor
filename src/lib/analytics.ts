/**
 * GA4 のカスタムイベントを送る共通の関数（2026-11-09 追加）。
 *
 * Googleタグそのもの（読み込み・測定ID・ページビュー）は src/components/Analytics.tsx のまま変えていない。
 * ここは、そのタグが用意した window.gtag を呼ぶだけ。
 *
 * - gtag が無いとき（開発中は Analytics が読み込まない／広告ブロック／読み込み前）は何もしない。サイトは止まらない
 * - 送ってよいのは、ツールの条件（ゲーム・型番・解像度など）と、計算した数字だけ。個人を特定できる情報は送らない
 * - いつ送るか（処理の成功時・重複させない）は、呼ぶ側で決める
 */

type GtagFn = (command: 'event', name: string, params: Record<string, unknown>) => void;

/** 送るイベントの名前と、送ってよいパラメータ。ここに無い名前・項目は送らない */
export type AnalyticsEvents = {
  fps_prediction_complete: {
    game: string;
    gpu_model: string;
    cpu_model: string;
    resolution: string;
    preset: string;
    estimated_avg_fps: number;
    /** 1% Low は幅（下限〜上限）で出しているので、下限を送る。その画質に 1% Low が無ければ送らない */
    estimated_1_percent_low_fps?: number;
  };
  build_diagnosis_complete: {
    game: string;
    target_fps: number;
    selected_tier: string;
    /** その段で候補が無いときは送らない */
    recommended_gpu?: string;
    recommended_cpu?: string;
  };
  gpu_cpu_compare: {
    comparison_type: 'gpu' | 'cpu';
  };
  official_link_click: {
    destination: string;
    link_type: string;
    game?: string;
  };
  result_url_copy: {
    tool_name: string;
    game: string;
  };
};

export function trackEvent<K extends keyof AnalyticsEvents>(
  name: K,
  params: AnalyticsEvents[K],
  options: { beacon?: boolean } = {},
): void {
  try {
    if (typeof window === 'undefined') return;
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
    if (typeof gtag !== 'function') return;
    // 値が無い項目は送らない（undefined を GA4 に渡さない）
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    // 外部へ移るリンクでは、ページを離れても届くよう beacon で送る
    gtag('event', name, options.beacon ? { ...clean, transport_type: 'beacon' } : clean);
  } catch {
    // 計測の失敗で、ページの動きを止めない
  }
}
