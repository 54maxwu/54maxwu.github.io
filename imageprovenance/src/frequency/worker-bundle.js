(() => {
  // src/frequency/transforms.js
  function fft1d(re, im, direction = 1) {
    const N = re.length;
    for (let i = 1, j = 0; i < N; i++) {
      let bit = N >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i];
        re[i] = re[j];
        re[j] = t;
        t = im[i];
        im[i] = im[j];
        im[j] = t;
      }
    }
    for (let len = 2; len <= N; len <<= 1) {
      const ang = direction * 2 * Math.PI / len;
      const wlenRe = Math.cos(ang), wlenIm = Math.sin(ang);
      for (let i = 0; i < N; i += len) {
        let wRe = 1, wIm = 0;
        const half = len >> 1;
        for (let k = 0; k < half; k++) {
          const aRe = re[i + k], aIm = im[i + k];
          const bRe = re[i + k + half] * wRe - im[i + k + half] * wIm;
          const bIm = re[i + k + half] * wIm + im[i + k + half] * wRe;
          re[i + k] = aRe + bRe;
          im[i + k] = aIm + bIm;
          re[i + k + half] = aRe - bRe;
          im[i + k + half] = aIm - bIm;
          const nwRe = wRe * wlenRe - wIm * wlenIm;
          const nwIm = wRe * wlenIm + wIm * wlenRe;
          wRe = nwRe;
          wIm = nwIm;
        }
      }
    }
    if (direction === -1) {
      for (let i = 0; i < N; i++) {
        re[i] /= N;
        im[i] /= N;
      }
    }
  }
  function fft2d(gray, w, h) {
    const re = new Float32Array(gray), im = new Float32Array(gray.length);
    const rowRe = new Float32Array(w), rowIm = new Float32Array(w);
    const colRe = new Float32Array(h), colIm = new Float32Array(h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        rowRe[x] = re[y * w + x];
        rowIm[x] = im[y * w + x];
      }
      fft1d(rowRe, rowIm, 1);
      for (let x = 0; x < w; x++) {
        re[y * w + x] = rowRe[x];
        im[y * w + x] = rowIm[x];
      }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        colRe[y] = re[y * w + x];
        colIm[y] = im[y * w + x];
      }
      fft1d(colRe, colIm, 1);
      for (let y = 0; y < h; y++) {
        re[y * w + x] = colRe[y];
        im[y * w + x] = colIm[y];
      }
    }
    return { re, im };
  }
  function magnitudeShifted(re, im, w, h) {
    const mag = new Float32Array(w * h);
    const hw = w >> 1, hh = h >> 1;
    for (let y = 0; y < h; y++) {
      const sy = (y + hh) % h;
      for (let x = 0; x < w; x++) {
        const sx = (x + hw) % w;
        const i = y * w + x, si = sy * w + sx;
        mag[si] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
      }
    }
    return mag;
  }
  function downsampleMag(mag, w, h, dstW, dstH) {
    const out = new Float32Array(dstW * dstH);
    const kx = w / dstW, ky = h / dstH;
    for (let y = 0; y < dstH; y++) {
      const y0 = Math.floor(y * ky), y1 = Math.floor((y + 1) * ky);
      for (let x = 0; x < dstW; x++) {
        const x0 = Math.floor(x * kx), x1 = Math.floor((x + 1) * kx);
        let m = 0;
        for (let yy = y0; yy < y1; yy++)
          for (let xx = x0; xx < x1; xx++) {
            const v = mag[yy * w + xx];
            if (v > m) m = v;
          }
        out[y * dstW + x] = m;
      }
    }
    return out;
  }
  function radialSpectrum(mag, w, h, bins = 64) {
    const power = new Float64Array(bins), count = new Uint32Array(bins);
    const cx = w / 2, cy = h / 2;
    const maxR = Math.min(cx, cy);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r >= maxR) continue;
        const b = Math.min(bins - 1, Math.floor(r / maxR * bins));
        const v = mag[y * w + x];
        power[b] += v * v;
        count[b]++;
      }
    }
    const out = new Float32Array(bins);
    for (let b = 0; b < bins; b++) out[b] = count[b] > 0 ? power[b] / count[b] : 0;
    return out;
  }
  var _dct8Cos = (() => {
    const c = new Float32Array(8 * 8);
    for (let u = 0; u < 8; u++)
      for (let x = 0; x < 8; x++)
        c[u * 8 + x] = Math.cos((2 * x + 1) * u * Math.PI / 16);
    return c;
  })();
  function dct8(block, out) {
    out = out || new Float32Array(64);
    for (let v = 0; v < 8; v++) {
      for (let u = 0; u < 8; u++) {
        let s = 0;
        for (let y = 0; y < 8; y++)
          for (let x = 0; x < 8; x++)
            s += block[y * 8 + x] * _dct8Cos[u * 8 + x] * _dct8Cos[v * 8 + y];
        const cu = u === 0 ? Math.SQRT1_2 : 1;
        const cv = v === 0 ? Math.SQRT1_2 : 1;
        out[v * 8 + u] = 0.25 * cu * cv * s;
      }
    }
    return out;
  }
  function haarStep(src, w, h) {
    const hw = w >> 1, hh = h >> 1;
    const LL = new Float32Array(hw * hh), LH = new Float32Array(hw * hh);
    const HL = new Float32Array(hw * hh), HH = new Float32Array(hw * hh);
    for (let y = 0; y < hh; y++) {
      for (let x = 0; x < hw; x++) {
        const a = src[2 * y * w + 2 * x], b = src[2 * y * w + 2 * x + 1];
        const c = src[(2 * y + 1) * w + 2 * x], d = src[(2 * y + 1) * w + 2 * x + 1];
        LL[y * hw + x] = (a + b + c + d) * 0.5;
        LH[y * hw + x] = (a + b - c - d) * 0.5;
        HL[y * hw + x] = (a - b + c - d) * 0.5;
        HH[y * hw + x] = (a - b - c + d) * 0.5;
      }
    }
    return { LL, LH, HL, HH, w: hw, h: hh };
  }
  function haar2d2level(gray, w, h) {
    const l1 = haarStep(gray, w, h);
    const l2 = haarStep(l1.LL, l1.w, l1.h);
    return {
      LL2: l2.LL,
      LH2: l2.LH,
      HL2: l2.HL,
      HH2: l2.HH,
      w2: l2.w,
      h2: l2.h,
      LH1: l1.LH,
      HL1: l1.HL,
      HH1: l1.HH,
      w1: l1.w,
      h1: l1.h
    };
  }

  // src/frequency/features.js
  var safeLog = (v) => Math.log(Math.max(v, 1e-12));
  function mean(arr) {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }
  function variance(arr, mu) {
    mu = mu ?? mean(arr);
    let s = 0;
    for (let i = 0; i < arr.length; i++) {
      const d = arr[i] - mu;
      s += d * d;
    }
    return s / arr.length;
  }
  function moments(arr) {
    const mu = mean(arr);
    let m2 = 0, m3 = 0, m4 = 0;
    for (let i = 0; i < arr.length; i++) {
      const d = arr[i] - mu;
      const d2 = d * d;
      m2 += d2;
      m3 += d2 * d;
      m4 += d2 * d2;
    }
    const n = arr.length;
    m2 /= n;
    m3 /= n;
    m4 /= n;
    const sd = Math.sqrt(m2);
    return { mean: mu, std: sd, skew: sd > 1e-9 ? m3 / (sd * sd * sd) : 0, kurt: m2 > 1e-9 ? m4 / (m2 * m2) - 3 : 0 };
  }
  function corrCoef(a, b) {
    if (a.length !== b.length) return 0;
    const mA = mean(a), mB = mean(b);
    let num = 0, dA = 0, dB = 0;
    for (let i = 0; i < a.length; i++) {
      const da = a[i] - mA, db = b[i] - mB;
      num += da * db;
      dA += da * da;
      dB += db * db;
    }
    const den = Math.sqrt(dA * dB);
    return den > 1e-9 ? num / den : 0;
  }
  function extractFeatures(rgba, gray, w, h) {
    const f = {};
    const N = w * h;
    const { re, im } = fft2d(gray, w, h);
    const mag = magnitudeShifted(re, im, w, h);
    const radial = radialSpectrum(mag, w, h, 64);
    const totalAC = radial.reduce((s, v, i) => i === 0 ? s : s + v, 0) || 1e-9;
    const binAt = (pct) => Math.floor(pct * radial.length);
    const bandSum = (a, b) => {
      let s = 0;
      for (let i = a; i < b; i++) s += radial[i];
      return s;
    };
    f.f01_low_freq_ratio = bandSum(0, binAt(0.1)) / totalAC;
    f.f02_mid_freq_ratio = bandSum(binAt(0.1), binAt(0.4)) / totalAC;
    f.f03_high_freq_ratio = bandSum(binAt(0.4), radial.length) / totalAC;
    let sx = 0, sy = 0, sxx = 0, sxy = 0, nPts = 0;
    for (let i = 1; i < radial.length; i++) {
      if (radial[i] <= 0) continue;
      const lx = safeLog(i), ly = safeLog(radial[i]);
      sx += lx;
      sy += ly;
      sxx += lx * lx;
      sxy += lx * ly;
      nPts++;
    }
    f.f04_spectral_slope = nPts > 1 ? (nPts * sxy - sx * sy) / Math.max(nPts * sxx - sx * sx, 1e-9) : 0;
    let gm = 0, am = 0;
    for (let i = 1; i < radial.length; i++) {
      gm += safeLog(radial[i] + 1e-9);
      am += radial[i];
    }
    gm = Math.exp(gm / (radial.length - 1));
    am /= radial.length - 1;
    f.f05_spectral_flatness = am > 1e-9 ? gm / am : 0;
    const radialNorm = radial.map((v) => v / totalAC);
    let ent = 0;
    for (const p of radialNorm) if (p > 1e-9) ent -= p * safeLog(p);
    f.f06_spectral_entropy = ent;
    f.f07_dc_component = mag[h / 2 * w + w / 2];
    f.f08_ac_energy_total = totalAC;
    const bands = [[0, 0.05], [0.05, 0.1], [0.1, 0.2], [0.2, 0.3], [0.3, 0.5], [0.5, 0.7], [0.7, 1]];
    bands.forEach(([a, b], i) => {
      f[`f0${9 + i}_band_${Math.round(a * 100)}_${Math.round(b * 100)}_ratio`] = bandSum(binAt(a), binAt(b)) / totalAC;
    });
    f.f16_radial_energy_variance = variance(radial);
    let peaks = 0;
    for (let i = 2; i < radial.length - 2; i++) {
      if (radial[i] > radial[i - 1] && radial[i] > radial[i + 1] && radial[i] > (radial[i - 2] + radial[i + 2]) * 0.75) peaks++;
    }
    f.f17_radial_peak_count = peaks;
    let symNum = 0, symDen = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w / 2; x++) {
        const a = mag[y * w + x], b = mag[(h - 1 - y) * w + (w - 1 - x)];
        symNum += Math.abs(a - b);
        symDen += a + b;
      }
    }
    f.f18_radial_symmetry = symDen > 1e-9 ? 1 - symNum / symDen : 1;
    const nAng = 16;
    const angPower = new Float64Array(nAng);
    const cx = w / 2, cy = h / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx === 0 && dy === 0) continue;
        const ang = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
        const b = Math.min(nAng - 1, Math.floor(ang * nAng));
        angPower[b] += mag[y * w + x] * mag[y * w + x];
      }
    }
    f.f19_angular_energy_variance = variance(Array.from(angPower));
    let maxAng = 0, maxAngIdx = 0, sumAng = 0;
    for (let i = 0; i < nAng; i++) {
      sumAng += angPower[i];
      if (angPower[i] > maxAng) {
        maxAng = angPower[i];
        maxAngIdx = i;
      }
    }
    f.f20_dominant_orientation = maxAngIdx / nAng * 180;
    f.f21_orientation_strength = sumAng > 1e-9 ? maxAng / (sumAng / nAng) : 0;
    const channel = (ch) => {
      const g = new Float32Array(N);
      for (let i = 0; i < N; i++) g[i] = rgba[i * 4 + ch];
      return fft2d(g, w, h);
    };
    const phaseConsistency = (re2, im2) => {
      let sumCos = 0, sumSin = 0, n = 0;
      for (let i = 1; i < re2.length; i++) {
        const mg = Math.sqrt(re2[i] * re2[i] + im2[i] * im2[i]);
        if (mg < 1) continue;
        sumCos += re2[i] / mg;
        sumSin += im2[i] / mg;
        n++;
      }
      return n > 0 ? Math.sqrt(sumCos * sumCos + sumSin * sumSin) / n : 0;
    };
    const rFFT = channel(0), gFFT = channel(1), bFFT = channel(2);
    f.f22_phase_consistency_r = phaseConsistency(rFFT.re, rFFT.im);
    f.f23_phase_consistency_g = phaseConsistency(gFFT.re, gFFT.im);
    f.f24_phase_consistency_b = phaseConsistency(bFFT.re, bFFT.im);
    const phaseStd = (re2, im2) => {
      const ang = [];
      for (let i = 1; i < re2.length; i += 4) {
        const mg = Math.sqrt(re2[i] * re2[i] + im2[i] * im2[i]);
        if (mg < 1) continue;
        ang.push(Math.atan2(im2[i], re2[i]));
      }
      return ang.length > 1 ? Math.sqrt(variance(ang)) : 0;
    };
    f.f25_phase_noise_std = phaseStd(rFFT.re, rFFT.im);
    const angSample = (re2, im2, n) => {
      const out2 = new Float32Array(n);
      let k = 0;
      for (let i = 1; k < n && i < re2.length; i += 8) out2[k++] = Math.atan2(im2[i], re2[i]);
      return out2.subarray(0, k);
    };
    const nSamp = Math.min(4096, N / 8 | 0);
    f.f26_cross_color_phase_corr = corrCoef(angSample(rFFT.re, rFFT.im, nSamp), angSample(gFFT.re, gFFT.im, nSamp));
    let lsb0 = [0, 0, 0], lsb1 = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      const p = i * 4;
      lsb0[0] += rgba[p] & 1;
      lsb0[1] += rgba[p + 1] & 1;
      lsb0[2] += rgba[p + 2] & 1;
      lsb1[0] += rgba[p] >> 1 & 1;
      lsb1[1] += rgba[p + 1] >> 1 & 1;
      lsb1[2] += rgba[p + 2] >> 1 & 1;
    }
    f.f27_lsb0_bias_r = Math.abs(lsb0[0] / N - 0.5);
    f.f28_lsb0_bias_g = Math.abs(lsb0[1] / N - 0.5);
    f.f29_lsb0_bias_b = Math.abs(lsb0[2] / N - 0.5);
    f.f30_lsb1_bias = Math.abs((lsb1[0] + lsb1[1] + lsb1[2]) / (3 * N) - 0.5);
    let same = 0, total = 0;
    for (let i = 0; i < N - 1; i++) {
      const a = rgba[i * 4] & 1, b = rgba[(i + 1) * 4] & 1;
      if (a === b) same++;
      total++;
    }
    f.f31_lsb_correlation = total > 0 ? same / total : 0;
    const hist = new Uint32Array(256);
    for (let i = 0; i < N; i++) hist[rgba[i * 4]]++;
    const exp = N / 256;
    let chi = 0;
    for (let i = 0; i < 256; i++) {
      const d = hist[i] - exp;
      chi += d * d / exp;
    }
    f.f32_lsb_chi_square = chi;
    const rArr = new Float32Array(N), gArr = new Float32Array(N), bArr = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      rArr[i] = rgba[i * 4];
      gArr[i] = rgba[i * 4 + 1];
      bArr[i] = rgba[i * 4 + 2];
    }
    const mR = moments(rArr), mG = moments(gArr), mB = moments(bArr);
    f.f33_pixel_mean_r = mR.mean;
    f.f33b_pixel_mean_g = mG.mean;
    f.f33c_pixel_mean_b = mB.mean;
    f.f34_pixel_std_r = mR.std;
    f.f34b_pixel_std_g = mG.std;
    f.f34c_pixel_std_b = mB.std;
    f.f35_pixel_skew_r = mR.skew;
    f.f35b_pixel_skew_g = mG.skew;
    f.f35c_pixel_skew_b = mB.skew;
    f.f36_pixel_kurt_r = mR.kurt;
    f.f36b_pixel_kurt_g = mG.kurt;
    f.f36c_pixel_kurt_b = mB.kurt;
    f.f37_rg_correlation = corrCoef(rArr, gArr);
    f.f38_rb_correlation = corrCoef(rArr, bArr);
    f.f39_gb_correlation = corrCoef(gArr, bArr);
    const hShift = new Float32Array(N - 1), hBase = new Float32Array(N - 1);
    const vShift = new Float32Array((h - 1) * w), vBase = new Float32Array((h - 1) * w);
    for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) {
      hBase[y * (w - 1) + x] = gray[y * w + x];
      hShift[y * (w - 1) + x] = gray[y * w + x + 1];
    }
    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
      vBase[y * w + x] = gray[y * w + x];
      vShift[y * w + x] = gray[(y + 1) * w + x];
    }
    f.f40_horz_corr = corrCoef(hBase.subarray(0, (w - 1) * h), hShift.subarray(0, (w - 1) * h));
    f.f41_vert_corr = corrCoef(vBase, vShift);
    const diagBase = new Float32Array((h - 1) * (w - 1)), diagShift = new Float32Array((h - 1) * (w - 1));
    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
      diagBase[y * (w - 1) + x] = gray[y * w + x];
      diagShift[y * (w - 1) + x] = gray[(y + 1) * w + x + 1];
    }
    f.f42_diag_corr = corrCoef(diagBase, diagShift);
    const breakRatio = (bits) => {
      const mask = (1 << bits) - 1;
      let breaks = 0, n = 0;
      for (let i = 0; i < N - 1; i++) {
        const a = rgba[i * 4] & mask, b = rgba[(i + 1) * 4] & mask;
        if (Math.abs(a - b) > mask >> 1) breaks++;
        n++;
      }
      return n ? breaks / n : 0;
    };
    f.f43_corr_break_ratio_2 = breakRatio(2);
    f.f44_corr_break_ratio_4 = breakRatio(4);
    const wv = haar2d2level(gray, w, h);
    const e = (a) => a.reduce((s, v) => s + v * v, 0);
    const eLL2 = e(wv.LL2) || 1e-9;
    f.f45_wavelet_hh1_energy = e(wv.HH1);
    f.f46_wavelet_hh2_energy = e(wv.HH2);
    f.f47_wavelet_ll2_energy = eLL2;
    f.f48_wavelet_lh_ratio = e(wv.LH1) / eLL2;
    f.f49_wavelet_hl_ratio = e(wv.HL1) / eLL2;
    f.f50_wavelet_hh_ratio = f.f45_wavelet_hh1_energy / eLL2;
    f.f51_wavelet_hh1_kurt = moments(wv.HH1).kurt;
    let wEnt = 0;
    const all = Array.from(wv.HH1).concat(Array.from(wv.LH1)).concat(Array.from(wv.HL1));
    const tot = all.reduce((s, v) => s + Math.abs(v), 0) || 1e-9;
    for (const v of all) {
      const p = Math.abs(v) / tot;
      if (p > 1e-9) wEnt -= p * safeLog(p);
    }
    f.f52_wavelet_entropy = wEnt;
    const blockStride = 32;
    let dctAllSum = 0, dctAllSq = 0, dctN = 0, zeroCoeff = 0, totalCoeff = 0;
    const blockVars = [];
    const blk = new Float32Array(64), out = new Float32Array(64);
    for (let y = 0; y + 8 <= h; y += blockStride) {
      for (let x = 0; x + 8 <= w; x += blockStride) {
        for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++)
          blk[yy * 8 + xx] = gray[(y + yy) * w + (x + xx)] - 128;
        dct8(blk, out);
        for (let i = 1; i < 64; i++) {
          dctAllSum += out[i];
          dctAllSq += out[i] * out[i];
          dctN++;
          if (Math.abs(out[i]) < 1) zeroCoeff++;
          totalCoeff++;
        }
        blockVars.push(out[0]);
      }
    }
    const dctMean = dctAllSum / dctN;
    const dctVar = dctAllSq / dctN - dctMean * dctMean;
    f.f53_dct_coef_mean = dctMean;
    f.f54_dct_coef_std = Math.sqrt(Math.max(dctVar, 0));
    f.f55_dct_coef_kurt = 0;
    f.f56_dct_zero_ratio = totalCoeff ? zeroCoeff / totalCoeff : 0;
    f.f57_dct_block_variance = variance(blockVars);
    return { features: f, viz: { mag, radial, rFFT, gFFT, bFFT, wv } };
  }

  // src/frequency/score.js
  function scoreFeatures(f) {
    const votes = [];
    const push = (weight, reason, value) => votes.push({ weight, reason, value });
    if (f.f04_spectral_slope > -0.8) push(2, `\u9891\u8C31\u8870\u51CF\u504F\u5E73\u7F13 (slope=${f.f04_spectral_slope.toFixed(2)})`, f.f04_spectral_slope);
    else if (f.f04_spectral_slope < -2.8) push(-1, `\u9891\u8C31\u8870\u51CF\u8FC7\u9661,\u50CF\u5F3A\u538B\u7F29\u7167\u7247 (slope=${f.f04_spectral_slope.toFixed(2)})`, f.f04_spectral_slope);
    if (f.f05_spectral_flatness > 0.35) push(2, `\u9891\u8C31\u5E73\u5766\u5EA6\u9AD8,\u80FD\u91CF\u5206\u5E03\u5747\u5300 (flatness=${f.f05_spectral_flatness.toFixed(3)})`, f.f05_spectral_flatness);
    if (f.f18_radial_symmetry > 0.88) push(1, `\u5F84\u5411\u5BF9\u79F0\u6027\u9AD8 (${f.f18_radial_symmetry.toFixed(2)})`, f.f18_radial_symmetry);
    if (f.f21_orientation_strength < 1.3) push(1, `\u65B9\u5411\u6027\u5F31,\u65E0\u660E\u663E\u7EB9\u7406\u65B9\u5411 (str=${f.f21_orientation_strength.toFixed(2)})`, f.f21_orientation_strength);
    const pMax = Math.max(f.f22_phase_consistency_r, f.f23_phase_consistency_g, f.f24_phase_consistency_b);
    if (pMax > 0.12) push(3, `\u901A\u9053\u76F8\u4F4D\u4E00\u81F4\u6027\u504F\u9AD8,\u53EF\u80FD\u5B58\u5728\u4E0D\u53EF\u89C1\u6C34\u5370 (max=${pMax.toFixed(3)})`, pMax);
    if (Math.abs(f.f26_cross_color_phase_corr) > 0.15) push(2, `\u8DE8\u901A\u9053\u76F8\u4F4D\u76F8\u5173\u6027\u5F02\u5E38 (${f.f26_cross_color_phase_corr.toFixed(3)})`, f.f26_cross_color_phase_corr);
    const lsbMax = Math.max(f.f27_lsb0_bias_r, f.f28_lsb0_bias_g, f.f29_lsb0_bias_b);
    if (lsbMax > 0.04) push(2, `LSB \u504F\u79BB 0.5 (${lsbMax.toFixed(3)})`, lsbMax);
    const avgKurt = (Math.abs(f.f36_pixel_kurt_r) + Math.abs(f.f36b_pixel_kurt_g) + Math.abs(f.f36c_pixel_kurt_b)) / 3;
    if (avgKurt < 0.3) push(1, `\u50CF\u7D20\u5206\u5E03\u63A5\u8FD1\u6B63\u6001,\u63A5\u8FD1 AI \u5178\u578B (avg|kurt|=${avgKurt.toFixed(2)})`, avgKurt);
    const minCorr = Math.min(f.f37_rg_correlation, f.f38_rb_correlation, f.f39_gb_correlation);
    if (minCorr < 0.6) push(1, `\u901A\u9053\u95F4\u76F8\u5173\u6027\u4F4E (min=${minCorr.toFixed(2)})`, minCorr);
    const avgHV = (f.f40_horz_corr + f.f41_vert_corr) / 2;
    if (avgHV > 0.995) push(2, `\u8FC7\u5EA6\u5E73\u6ED1,\u76F8\u90BB\u50CF\u7D20\u76F8\u5173\u6027\u6781\u9AD8 (${avgHV.toFixed(4)})`, avgHV);
    if (avgHV < 0.85) push(-1, `\u9AD8\u9891\u566A\u58F0\u91CD,\u50CF\u672A\u5904\u7406\u7167\u7247 (${avgHV.toFixed(4)})`, avgHV);
    if (f.f50_wavelet_hh_ratio < 5e-3) push(1, `\u5C0F\u6CE2 HH \u80FD\u91CF\u504F\u4F4E (HH/LL=${f.f50_wavelet_hh_ratio.toExponential(2)})`, f.f50_wavelet_hh_ratio);
    if (f.f57_dct_block_variance < 100) push(1, `DCT \u5757\u95F4\u4EAE\u5EA6\u65B9\u5DEE\u4F4E (${f.f57_dct_block_variance.toFixed(0)})`, f.f57_dct_block_variance);
    const total = votes.reduce((s, v) => s + v.weight, 0);
    const positive = votes.filter((v) => v.weight > 0).reduce((s, v) => s + v.weight, 0);
    const negative = -votes.filter((v) => v.weight < 0).reduce((s, v) => s + v.weight, 0);
    let verdict, confidence;
    if (total >= 6) {
      verdict = "\u9AD8\u5EA6\u7591\u4F3C AI \u751F\u6210";
      confidence = "strong";
    } else if (total >= 3) {
      verdict = "\u5B58\u5728 AI \u7279\u5F81";
      confidence = "medium";
    } else if (total >= 1) {
      verdict = "\u8F7B\u5FAE\u53EF\u7591";
      confidence = "weak";
    } else if (total <= -1) {
      verdict = "\u66F4\u63A5\u8FD1\u771F\u5B9E\u7167\u7247";
      confidence = "info";
    } else {
      verdict = "\u7279\u5F81\u6A21\u7CCA,\u65E0\u6CD5\u5224\u5B9A";
      confidence = null;
    }
    return { votes, total, positive, negative, verdict, confidence };
  }

  // src/frequency/worker.js
  self.onmessage = (e) => {
    const { type } = e.data;
    if (type !== "analyze") return;
    try {
      const { rgba, gray, w, h } = e.data;
      const timing = {};
      const t0 = performance.now();
      self.postMessage({ type: "progress", stage: "features", pct: 5 });
      const { features, viz } = extractFeatures(rgba, gray, w, h);
      timing.features = performance.now() - t0;
      self.postMessage({ type: "progress", stage: "score", pct: 85 });
      const score = scoreFeatures(features);
      timing.score = performance.now() - t0 - timing.features;
      self.postMessage({ type: "progress", stage: "viz", pct: 92 });
      const vizOut = {
        fftMag128: downsampleMag(viz.mag, w, h, 128, 128),
        radial64: viz.radial.slice(0),
        phaseConsistency: {
          r: features.f22_phase_consistency_r,
          g: features.f23_phase_consistency_g,
          b: features.f24_phase_consistency_b
        },
        waveletEnergies: {
          LL2: features.f47_wavelet_ll2_energy,
          HH1: features.f45_wavelet_hh1_energy,
          HH2: features.f46_wavelet_hh2_energy,
          LH1_ratio: features.f48_wavelet_lh_ratio,
          HL1_ratio: features.f49_wavelet_hl_ratio,
          HH1_ratio: features.f50_wavelet_hh_ratio
        }
      };
      self.postMessage({
        type: "result",
        features,
        viz: vizOut,
        score,
        timing
      }, [vizOut.fftMag128.buffer, vizOut.radial64.buffer]);
    } catch (err) {
      self.postMessage({ type: "error", message: err?.message || String(err), stack: err?.stack });
    }
  };
})();
