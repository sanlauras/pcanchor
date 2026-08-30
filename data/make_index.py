"""
GPU/CPU ゲーミング性能指数の算出
入力: 検証済み公開スペックのみ（他社ベンチ数値は不使用）
基準: RX 9070 XT = 100 / Ryzen 7 9800X3D = 100（実測でスケール合わせ）
"""
import csv, math, json, os

# 入出力はこのスクリプトと同じフォルダを基準にする（どこから実行しても動く）
DIR = os.path.dirname(os.path.abspath(__file__))
def path(name): return os.path.join(DIR, name)

def load(p):
    rd = list(csv.reader(open(p, encoding='utf-8-sig')))
    hdr, rows = None, []
    for r in rd:
        if not r or not r[0] or r[0].startswith('#'): continue
        if hdr is None: hdr = r; continue
        rows.append(dict(zip(hdr, r)))
    return rows

def f(v, d=0.0):
    try: return float(v)
    except: return d

# ============================================================
# GPU: アーキごとの「1シェーダーあたりの実ゲーム効率」
# Ampere以降のFP32倍カウント / RDNA3以降のdual-issueを補正する係数。
# 公称シェーダー数は世代をまたいで比較できないため、この補正が必須。
# ============================================================
GPU_EFF = {
    # NVIDIAのAmpere以降はCUDAコアがFP32倍カウント表記のため係数を下げる。
    # AMDはRDNA全世代で「CU x 64」の一貫表記なので倍カウント補正は不要。
    'Pascal':    1.00,   # 基準
    'Turing':    1.15,   # FP/INT同時実行
    'Ampere':    0.66,   # FP32倍カウント表記
    'Ada':       0.78,   # 倍カウント表記だが大容量L2とクロックで改善
    'Blackwell': 0.82,
    'RDNA':      0.95,
    'RDNA2':     1.05,   # Infinity Cache導入
    'RDNA3':     1.08,
    'RDNA4':     1.50,   # CUあたりの性能が大幅向上（64CUで前世代96CU相当）
}

def gpu_index(r):
    eff   = GPU_EFF[r['arch']]
    sh    = f(r['shader_units'])
    clk   = f(r['boost_clock_mhz']) / 1000.0
    bw    = f(r['bandwidth_gbs'])
    ic    = f(r['infinity_cache_mb'])
    # 演算性能（任意単位）
    compute = sh * eff * clk
    # キャッシュによる実効帯域の底上げ（Infinity Cache / 大容量L2）
    cache_mult = 1.0 + min(ic, 128.0) / 128.0 * 0.60
    mem = bw * cache_mult
    # ゲームは演算寄り。演算側に逓減を効かせる（大型GPUは線形にスケールしない）
    return (compute ** 0.78) * (mem ** 0.22)

# ============================================================
# CPU: メーカー公表IPC（Zen3=1.00基準）
# ============================================================
CPU_IPC = {
    'Zen 3':          1.00,
    'Zen 4':          1.13,   # AMD公表 Zen3比 +13%
    'Zen 5':          1.31,   # AMD公表 Zen4比 +16%
    'Comet Lake':     0.82,   # Skylake系
    'Rocket Lake':    0.95,   # Cypress Cove
    'Alder Lake':     1.10,   # Golden Cove
    'Raptor Lake':    1.12,
    'Raptor Lake-R':  1.12,
    'Arrow Lake':     1.19,   # Lion Cove
}

def cpu_index(r):
    ipc   = CPU_IPC[r['arch']]
    boost = f(r['boost_clock_ghz'])
    l3    = f(r['l3_cache_mb'], 32.0)
    cores = f(r['cores'])
    x3d   = r['has_3d_vcache'] == 'Y'
    penalty = 1.0
    # デュアルCCDのX3Dはゲームが動く側のCCDしか大容量L3を持たない。
    # 実効L3は96MB、実効クロックもキャッシュ側CCDの低い方になる。
    if x3d and cores > 8:
        l3 = 96.0
        boost = boost - 0.5
        if cores == 12:
            penalty = 0.93   # キャッシュ側CCDが6コアしかなく不利
    elif r['vendor'] == 'AMD' and cores > 8:
        # 非X3DのデュアルCCD品はL3が32MBx2に分割される。
        # ゲームは片方のCCDで動くため実効L3は半分。
        l3 = l3 / 2.0
    # 単スレッド性能（ゲームの主要因）
    st = ipc * boost
    # L3キャッシュ補正。X3Dの効きをここで表現する
    cache_f = 1.0 + 0.22 * math.log(max(l3, 8.0) / 32.0)
    # コア数は8で飽和。それ未満はペナルティ
    core_f = 0.80 + 0.20 * min(cores, 8.0) / 8.0
    return st * cache_f * core_f * penalty

# ============================================================
gpus = load(path('gpu_specs_draft.csv'))
cpus = load(path('cpu_specs_draft.csv'))

for r in gpus: r['_raw'] = gpu_index(r)
for r in cpus: r['_raw'] = cpu_index(r)

GPU_ANCHOR = next(r for r in gpus if r['gpu_name'] == 'Radeon RX 9070 XT')
CPU_ANCHOR = next(r for r in cpus if r['cpu_name'] == 'Ryzen 7 9800X3D')

# 実測アンカー（Valorant / 2026-08-29 実測）
FPS_GPU_ANCHOR = 464.6   # 3840x2160 全て高、完全GPU律速
FPS_CPU_ANCHOR = 970.3   # 1920x1080 全て低、CPU天井

for r in gpus:
    r['index'] = round(r['_raw'] / GPU_ANCHOR['_raw'] * 100, 1)
    r['fps_4k_high'] = round(FPS_GPU_ANCHOR * r['_raw'] / GPU_ANCHOR['_raw'], 1)
for r in cpus:
    r['index'] = round(r['_raw'] / CPU_ANCHOR['_raw'] * 100, 1)
    r['fps_ceiling'] = round(FPS_CPU_ANCHOR * r['_raw'] / CPU_ANCHOR['_raw'], 1)

gpus.sort(key=lambda r: -r['index'])
cpus.sort(key=lambda r: -r['index'])

with open(path('gpu_index.csv'), 'w', newline='', encoding='utf-8-sig') as fp:
    w = csv.writer(fp)
    w.writerow(['rank','gpu_name','vendor','arch','index','fps_valorant_4k_high','vram_gb','bandwidth_gbs','tdp_w'])
    for i, r in enumerate(gpus, 1):
        w.writerow([i, r['gpu_name'], r['vendor'], r['arch'], r['index'],
                    r['fps_4k_high'], r['vram_gb'], r['bandwidth_gbs'], r['tdp_w']])

with open(path('cpu_index.csv'), 'w', newline='', encoding='utf-8-sig') as fp:
    w = csv.writer(fp)
    w.writerow(['rank','cpu_name','vendor','arch','index','fps_valorant_ceiling','cores','l3_cache_mb','has_3d_vcache'])
    for i, r in enumerate(cpus, 1):
        w.writerow([i, r['cpu_name'], r['vendor'], r['arch'], r['index'],
                    r['fps_ceiling'], r['cores'], r['l3_cache_mb'], r['has_3d_vcache']])

print('=== GPU 上位15 ===')
for i, r in enumerate(gpus[:15], 1):
    print(f"{i:2d}. {r['gpu_name']:<28} {r['index']:>6.1f}  {r['fps_4k_high']:>6.1f}fps")
print('\n=== GPU 下位5 ===')
for r in gpus[-5:]:
    print(f"    {r['gpu_name']:<28} {r['index']:>6.1f}  {r['fps_4k_high']:>6.1f}fps")
print('\n=== CPU 上位12 ===')
for i, r in enumerate(cpus[:12], 1):
    print(f"{i:2d}. {r['cpu_name']:<24} {r['index']:>6.1f}  {r['fps_ceiling']:>6.1f}fps")
print('\n=== CPU 下位5 ===')
for r in cpus[-5:]:
    print(f"    {r['cpu_name']:<24} {r['index']:>6.1f}  {r['fps_ceiling']:>6.1f}fps")
