// Heuristic scoring over the extracted feature set.
// Deliberately NOT a trained classifier — see README for rationale.
// Each rule casts a vote with weight + reason; the UI aggregates them.

export function scoreFeatures(f) {
    const votes = [];
    const push = (weight, reason, value) => votes.push({ weight, reason, value });

    // --- Spectral shape ---
    // Real photos roughly follow a 1/f slope (≈ -1.5 to -2.5 on log-log).
    // Slopes much shallower than that are suspicious (AI tends toward flatter spectra).
    if (f.f04_spectral_slope > -0.8) push(+2, `頻譜衰減偏平緩 (slope=${f.f04_spectral_slope.toFixed(2)})`, f.f04_spectral_slope);
    else if (f.f04_spectral_slope < -2.8) push(-1, `頻譜衰減過陡,像強壓縮照片 (slope=${f.f04_spectral_slope.toFixed(2)})`, f.f04_spectral_slope);

    if (f.f05_spectral_flatness > 0.35) push(+2, `頻譜平坦度高,能量分佈均勻 (flatness=${f.f05_spectral_flatness.toFixed(3)})`, f.f05_spectral_flatness);

    // --- Radial symmetry: AI images are often more isotropic ---
    if (f.f18_radial_symmetry > 0.88) push(+1, `徑向對稱性高 (${f.f18_radial_symmetry.toFixed(2)})`, f.f18_radial_symmetry);

    // --- Angular anisotropy: real photos have texture directions ---
    if (f.f21_orientation_strength < 1.3) push(+1, `方向性弱,無明顯紋理方向 (str=${f.f21_orientation_strength.toFixed(2)})`, f.f21_orientation_strength);

    // --- Phase consistency: SynthID's classic signature ---
    const pMax = Math.max(f.f22_phase_consistency_r, f.f23_phase_consistency_g, f.f24_phase_consistency_b);
    if (pMax > 0.12) push(+3, `通道相位一致性偏高,可能存在不可見水印 (max=${pMax.toFixed(3)})`, pMax);
    if (Math.abs(f.f26_cross_color_phase_corr) > 0.15) push(+2, `跨通道相位相關性異常 (${f.f26_cross_color_phase_corr.toFixed(3)})`, f.f26_cross_color_phase_corr);

    // --- LSB bias: watermark or steganography ---
    const lsbMax = Math.max(f.f27_lsb0_bias_r, f.f28_lsb0_bias_g, f.f29_lsb0_bias_b);
    if (lsbMax > 0.04) push(+2, `LSB 偏離 0.5 (${lsbMax.toFixed(3)})`, lsbMax);

    // --- Pixel statistics ---
    // AI-generated images sometimes have flatter distributions (lower kurt, lower skew abs)
    const avgKurt = (Math.abs(f.f36_pixel_kurt_r) + Math.abs(f.f36b_pixel_kurt_g) + Math.abs(f.f36c_pixel_kurt_b)) / 3;
    if (avgKurt < 0.3) push(+1, `像素分佈接近正態,接近 AI 典型 (avg|kurt|=${avgKurt.toFixed(2)})`, avgKurt);

    // Channel correlation — real photos often show 0.85-0.97, AI can be different
    const minCorr = Math.min(f.f37_rg_correlation, f.f38_rb_correlation, f.f39_gb_correlation);
    if (minCorr < 0.6) push(+1, `通道間相關性低 (min=${minCorr.toFixed(2)})`, minCorr);

    // --- Spatial correlation ---
    const avgHV = (f.f40_horz_corr + f.f41_vert_corr) / 2;
    if (avgHV > 0.995) push(+2, `過度平滑,相鄰像素相關性極高 (${avgHV.toFixed(4)})`, avgHV);
    if (avgHV < 0.85) push(-1, `高頻噪聲重,像未處理照片 (${avgHV.toFixed(4)})`, avgHV);

    // --- Wavelet HH1: AI often has lower HF detail energy ---
    if (f.f50_wavelet_hh_ratio < 0.005) push(+1, `小波 HH 能量偏低 (HH/LL=${f.f50_wavelet_hh_ratio.toExponential(2)})`, f.f50_wavelet_hh_ratio);

    // --- DCT block variance: AI blocks are more uniform ---
    if (f.f57_dct_block_variance < 100) push(+1, `DCT 塊間亮度方差低 (${f.f57_dct_block_variance.toFixed(0)})`, f.f57_dct_block_variance);

    const total = votes.reduce((s, v) => s + v.weight, 0);
    const positive = votes.filter(v => v.weight > 0).reduce((s, v) => s + v.weight, 0);
    const negative = -votes.filter(v => v.weight < 0).reduce((s, v) => s + v.weight, 0);

    let verdict, confidence;
    if (total >= 6) { verdict = '高度疑似 AI 生成'; confidence = 'strong'; }
    else if (total >= 3) { verdict = '存在 AI 特徵'; confidence = 'medium'; }
    else if (total >= 1) { verdict = '輕微可疑'; confidence = 'weak'; }
    else if (total <= -1) { verdict = '更接近真實照片'; confidence = 'info'; }
    else { verdict = '特徵模糊,無法判定'; confidence = null; }

    return { votes, total, positive, negative, verdict, confidence };
}
