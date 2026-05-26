(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
    get: (a2, b2) => (typeof require !== "undefined" ? require : a2)[b2]
  }) : x2)(function(x2) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x2 + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/utils.js
  async function sha256(buffer) {
    if (window.crypto?.subtle?.digest) {
      try {
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        return Array.from(new Uint8Array(hashBuffer)).map((b2) => b2.toString(16).padStart(2, "0")).join("");
      } catch {
      }
    }
    return sha256Pure(new Uint8Array(buffer));
  }
  function sha256Pure(msg) {
    const K2 = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
    const R2 = (n2, x2) => x2 >>> n2 | x2 << 32 - n2;
    const l2 = msg.length, bitLen = l2 * 8, totalLen = (Math.floor((l2 + 8) / 64) + 1) * 64;
    const padded = new Uint8Array(totalLen);
    padded.set(msg);
    padded[l2] = 128;
    const dv = new DataView(padded.buffer);
    dv.setUint32(totalLen - 8, Math.floor(bitLen / 4294967296), false);
    dv.setUint32(totalLen - 4, bitLen >>> 0, false);
    let h0 = 1779033703, h1 = 3144134277, h2 = 1013904242, h3 = 2773480762, h4 = 1359893119, h5 = 2600822924, h6 = 528734635, h7 = 1541459225;
    const w2 = new Uint32Array(64);
    for (let off = 0; off < totalLen; off += 64) {
      for (let i2 = 0; i2 < 16; i2++) w2[i2] = dv.getUint32(off + i2 * 4, false);
      for (let i2 = 16; i2 < 64; i2++) {
        const s0 = R2(7, w2[i2 - 15]) ^ R2(18, w2[i2 - 15]) ^ w2[i2 - 15] >>> 3;
        const s1 = R2(17, w2[i2 - 2]) ^ R2(19, w2[i2 - 2]) ^ w2[i2 - 2] >>> 10;
        w2[i2] = w2[i2 - 16] + s0 + w2[i2 - 7] + s1 >>> 0;
      }
      let a2 = h0, b2 = h1, c2 = h2, d2 = h3, e2 = h4, f2 = h5, g2 = h6, h8 = h7;
      for (let i2 = 0; i2 < 64; i2++) {
        const S1 = R2(6, e2) ^ R2(11, e2) ^ R2(25, e2);
        const ch = e2 & f2 ^ ~e2 & g2;
        const t1 = h8 + S1 + ch + K2[i2] + w2[i2] >>> 0;
        const S0 = R2(2, a2) ^ R2(13, a2) ^ R2(22, a2);
        const maj = a2 & b2 ^ a2 & c2 ^ b2 & c2;
        const t22 = S0 + maj >>> 0;
        h8 = g2;
        g2 = f2;
        f2 = e2;
        e2 = d2 + t1 >>> 0;
        d2 = c2;
        c2 = b2;
        b2 = a2;
        a2 = t1 + t22 >>> 0;
      }
      h0 = h0 + a2 >>> 0;
      h1 = h1 + b2 >>> 0;
      h2 = h2 + c2 >>> 0;
      h3 = h3 + d2 >>> 0;
      h4 = h4 + e2 >>> 0;
      h5 = h5 + f2 >>> 0;
      h6 = h6 + g2 >>> 0;
      h7 = h7 + h8 >>> 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((n2) => n2.toString(16).padStart(8, "0")).join("");
  }
  function bytesToString(uint8) {
    let str = "";
    for (let i2 = 0; i2 < uint8.length; i2 += 65536) {
      str += String.fromCharCode.apply(null, uint8.subarray(i2, i2 + 65536));
    }
    return str;
  }
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  }
  function getImageDims(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(`${img.naturalWidth} x ${img.naturalHeight}px`);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve("\u2014");
      img.src = URL.createObjectURL(file);
    });
  }
  function escHtml(s2) {
    const d2 = document.createElement("div");
    d2.textContent = s2 == null ? "" : String(s2);
    return d2.innerHTML;
  }
  var init_utils = __esm({
    "src/utils.js"() {
    }
  });

  // node_modules/exifr/dist/full.esm.mjs
  function l(e2, t3 = o) {
    if (n) try {
      return "function" == typeof __require ? Promise.resolve(t3(__require(e2))) : import(
        /* webpackIgnore: true */
        e2
      ).then(t3);
    } catch (t4) {
      console.warn(`Couldn't load ${e2}`);
    }
  }
  function c(e2, t3, i2) {
    return t3 in e2 ? Object.defineProperty(e2, t3, { value: i2, enumerable: true, configurable: true, writable: true }) : e2[t3] = i2, e2;
  }
  function p(e2) {
    return void 0 === e2 || (e2 instanceof Map ? 0 === e2.size : 0 === Object.values(e2).filter(d).length);
  }
  function g(e2) {
    let t3 = new Error(e2);
    throw delete t3.stack, t3;
  }
  function m(e2) {
    return "" === (e2 = (function(e3) {
      for (; e3.endsWith("\0"); ) e3 = e3.slice(0, -1);
      return e3;
    })(e2).trim()) ? void 0 : e2;
  }
  function S(e2) {
    let t3 = (function(e3) {
      let t4 = 0;
      return e3.ifd0.enabled && (t4 += 1024), e3.exif.enabled && (t4 += 2048), e3.makerNote && (t4 += 2048), e3.userComment && (t4 += 1024), e3.gps.enabled && (t4 += 512), e3.interop.enabled && (t4 += 100), e3.ifd1.enabled && (t4 += 1024), t4 + 2048;
    })(e2);
    return e2.jfif.enabled && (t3 += 50), e2.xmp.enabled && (t3 += 2e4), e2.iptc.enabled && (t3 += 14e3), e2.icc.enabled && (t3 += 6e3), t3;
  }
  function b(e2) {
    return y ? y.decode(e2) : a ? Buffer.from(e2).toString("utf8") : decodeURIComponent(escape(C(e2)));
  }
  function P(e2, t3) {
    g(`${e2} '${t3}' was not loaded, try using full build of exifr.`);
  }
  function D(e2, n2) {
    return "string" == typeof e2 ? O(e2, n2) : t && !i && e2 instanceof HTMLImageElement ? O(e2.src, n2) : e2 instanceof Uint8Array || e2 instanceof ArrayBuffer || e2 instanceof DataView ? new I(e2) : t && e2 instanceof Blob ? x(e2, n2, "blob", R) : void g("Invalid input argument");
  }
  function O(e2, i2) {
    return (s2 = e2).startsWith("data:") || s2.length > 1e4 ? v(e2, i2, "base64") : n && e2.includes("://") ? x(e2, i2, "url", M) : n ? v(e2, i2, "fs") : t ? x(e2, i2, "url", M) : void g("Invalid input argument");
    var s2;
  }
  async function x(e2, t3, i2, n2) {
    return A.has(i2) ? v(e2, t3, i2) : n2 ? (async function(e3, t4) {
      let i3 = await t4(e3);
      return new I(i3);
    })(e2, n2) : void g(`Parser ${i2} is not loaded`);
  }
  async function v(e2, t3, i2) {
    let n2 = new (A.get(i2))(e2, t3);
    return await n2.read(), n2;
  }
  function U(e2, t3, i2) {
    let n2 = new L();
    for (let [e3, t4] of i2) n2.set(e3, t4);
    if (Array.isArray(t3)) for (let i3 of t3) e2.set(i3, n2);
    else e2.set(t3, n2);
    return n2;
  }
  function F(e2, t3, i2) {
    let n2, s2 = e2.get(t3);
    for (n2 of i2) s2.set(n2[0], n2[1]);
  }
  function Q(e2, t3) {
    let i2, n2, s2, r2, a2 = [];
    for (s2 of t3) {
      for (r2 of (i2 = E.get(s2), n2 = [], i2)) (e2.includes(r2[0]) || e2.includes(r2[1])) && n2.push(r2[0]);
      n2.length && a2.push([s2, n2]);
    }
    return a2;
  }
  function Z(e2, t3) {
    return void 0 !== e2 ? e2 : void 0 !== t3 ? t3 : void 0;
  }
  function ee(e2, t3) {
    for (let i2 of t3) e2.add(i2);
  }
  async function ie(e2, t3) {
    let i2 = new te(t3);
    return await i2.read(e2), i2.parse();
  }
  function ae(e2) {
    return 192 === e2 || 194 === e2 || 196 === e2 || 219 === e2 || 221 === e2 || 218 === e2 || 254 === e2;
  }
  function oe(e2) {
    return e2 >= 224 && e2 <= 239;
  }
  function le(e2, t3, i2) {
    for (let [n2, s2] of T) if (s2.canHandle(e2, t3, i2)) return n2;
  }
  function de(e2, t3, i2, n2) {
    var s2 = e2 + t3 / 60 + i2 / 3600;
    return "S" !== n2 && "W" !== n2 || (s2 *= -1), s2;
  }
  async function Se(e2) {
    let t3 = new te(me);
    await t3.read(e2);
    let i2 = await t3.parse();
    if (i2 && i2.gps) {
      let { latitude: e3, longitude: t4 } = i2.gps;
      return { latitude: e3, longitude: t4 };
    }
  }
  async function ye(e2) {
    let t3 = new te(Ce);
    await t3.read(e2);
    let i2 = await t3.extractThumbnail();
    return i2 && a ? s.from(i2) : i2;
  }
  async function be(e2) {
    let t3 = await this.thumbnail(e2);
    if (void 0 !== t3) {
      let e3 = new Blob([t3]);
      return URL.createObjectURL(e3);
    }
  }
  async function Pe(e2) {
    let t3 = new te(Ie);
    await t3.read(e2);
    let i2 = await t3.parse();
    if (i2 && i2.ifd0) return i2.ifd0[274];
  }
  async function Ae(e2) {
    let t3 = await Pe(e2);
    return Object.assign({ canvas: we, css: Te }, ke[t3]);
  }
  function xe(e2, t3, i2) {
    return e2 <= t3 && t3 <= i2;
  }
  function Ge(e2) {
    return "object" == typeof e2 && void 0 !== e2.length ? e2[0] : e2;
  }
  function Ve(e2) {
    let t3 = Array.from(e2).slice(1);
    return t3[1] > 15 && (t3 = t3.map(((e3) => String.fromCharCode(e3)))), "0" !== t3[2] && 0 !== t3[2] || t3.pop(), t3.join(".");
  }
  function ze(e2) {
    if ("string" == typeof e2) {
      var [t3, i2, n2, s2, r2, a2] = e2.trim().split(/[-: ]/g).map(Number), o2 = new Date(t3, i2 - 1, n2);
      return Number.isNaN(s2) || Number.isNaN(r2) || Number.isNaN(a2) || (o2.setHours(s2), o2.setMinutes(r2), o2.setSeconds(a2)), Number.isNaN(+o2) ? e2 : o2;
    }
  }
  function He(e2) {
    if ("string" == typeof e2) return e2;
    let t3 = [];
    if (0 === e2[1] && 0 === e2[e2.length - 1]) for (let i2 = 0; i2 < e2.length; i2 += 2) t3.push(je(e2[i2 + 1], e2[i2]));
    else for (let i2 = 0; i2 < e2.length; i2 += 2) t3.push(je(e2[i2], e2[i2 + 1]));
    return m(String.fromCodePoint(...t3));
  }
  function je(e2, t3) {
    return e2 << 8 | t3;
  }
  function _e(e2, t3) {
    let i2 = e2.serialize();
    void 0 !== i2 && (t3[e2.name] = i2);
  }
  function qe(e2, t3) {
    let i2, n2 = [];
    if (!e2) return n2;
    for (; null !== (i2 = t3.exec(e2)); ) n2.push(i2);
    return n2;
  }
  function Qe(e2) {
    if ((function(e3) {
      return null == e3 || "null" === e3 || "undefined" === e3 || "" === e3 || "" === e3.trim();
    })(e2)) return;
    let t3 = Number(e2);
    if (!Number.isNaN(t3)) return t3;
    let i2 = e2.toLowerCase();
    return "true" === i2 || "false" !== i2 && e2.trim();
  }
  function mt(e2, t3) {
    return m(e2.getString(t3, 4));
  }
  var e, t, i, n, s, r, a, o, h, u, f, d, C, y, I, k, w, T, A, M, R, L, E, B, N, G, V, z, H, j, W, K, X, _, Y, $, J, q, te, ne, se, re, he, ue, ce, fe, pe, ge, me, Ce, Ie, ke, we, Te, De, Oe, ve, Me, Re, Le, Ue, Fe, Ee, Be, Ne, We, Ke, Xe, Ye, $e, Je, Ze, et, tt, at, ot, lt, ht, ut, ct, ft, dt, pt, gt, St, Ct, yt, full_esm_default;
  var init_full_esm = __esm({
    "node_modules/exifr/dist/full.esm.mjs"() {
      e = "undefined" != typeof self ? self : global;
      t = "undefined" != typeof navigator;
      i = t && "undefined" == typeof HTMLImageElement;
      n = !("undefined" == typeof global || "undefined" == typeof process || !process.versions || !process.versions.node);
      s = e.Buffer;
      r = e.BigInt;
      a = !!s;
      o = (e2) => e2;
      h = e.fetch;
      u = (e2) => h = e2;
      if (!e.fetch) {
        const e2 = l("http", ((e3) => e3)), t3 = l("https", ((e3) => e3)), i2 = (n2, { headers: s2 } = {}) => new Promise((async (r2, a2) => {
          let { port: o2, hostname: l2, pathname: h2, protocol: u2, search: c2 } = new URL(n2);
          const f2 = { method: "GET", hostname: l2, path: encodeURI(h2) + c2, headers: s2 };
          "" !== o2 && (f2.port = Number(o2));
          const d2 = ("https:" === u2 ? await t3 : await e2).request(f2, ((e3) => {
            if (301 === e3.statusCode || 302 === e3.statusCode) {
              let t4 = new URL(e3.headers.location, n2).toString();
              return i2(t4, { headers: s2 }).then(r2).catch(a2);
            }
            r2({ status: e3.statusCode, arrayBuffer: () => new Promise(((t4) => {
              let i3 = [];
              e3.on("data", ((e4) => i3.push(e4))), e3.on("end", (() => t4(Buffer.concat(i3))));
            })) });
          }));
          d2.on("error", a2), d2.end();
        }));
        u(i2);
      }
      f = (e2) => p(e2) ? void 0 : e2;
      d = (e2) => void 0 !== e2;
      C = (e2) => String.fromCharCode.apply(null, e2);
      y = "undefined" != typeof TextDecoder ? new TextDecoder("utf-8") : void 0;
      I = class _I {
        static from(e2, t3) {
          return e2 instanceof this && e2.le === t3 ? e2 : new _I(e2, void 0, void 0, t3);
        }
        constructor(e2, t3 = 0, i2, n2) {
          if ("boolean" == typeof n2 && (this.le = n2), Array.isArray(e2) && (e2 = new Uint8Array(e2)), 0 === e2) this.byteOffset = 0, this.byteLength = 0;
          else if (e2 instanceof ArrayBuffer) {
            void 0 === i2 && (i2 = e2.byteLength - t3);
            let n3 = new DataView(e2, t3, i2);
            this._swapDataView(n3);
          } else if (e2 instanceof Uint8Array || e2 instanceof DataView || e2 instanceof _I) {
            void 0 === i2 && (i2 = e2.byteLength - t3), (t3 += e2.byteOffset) + i2 > e2.byteOffset + e2.byteLength && g("Creating view outside of available memory in ArrayBuffer");
            let n3 = new DataView(e2.buffer, t3, i2);
            this._swapDataView(n3);
          } else if ("number" == typeof e2) {
            let t4 = new DataView(new ArrayBuffer(e2));
            this._swapDataView(t4);
          } else g("Invalid input argument for BufferView: " + e2);
        }
        _swapArrayBuffer(e2) {
          this._swapDataView(new DataView(e2));
        }
        _swapBuffer(e2) {
          this._swapDataView(new DataView(e2.buffer, e2.byteOffset, e2.byteLength));
        }
        _swapDataView(e2) {
          this.dataView = e2, this.buffer = e2.buffer, this.byteOffset = e2.byteOffset, this.byteLength = e2.byteLength;
        }
        _lengthToEnd(e2) {
          return this.byteLength - e2;
        }
        set(e2, t3, i2 = _I) {
          return e2 instanceof DataView || e2 instanceof _I ? e2 = new Uint8Array(e2.buffer, e2.byteOffset, e2.byteLength) : e2 instanceof ArrayBuffer && (e2 = new Uint8Array(e2)), e2 instanceof Uint8Array || g("BufferView.set(): Invalid data argument."), this.toUint8().set(e2, t3), new i2(this, t3, e2.byteLength);
        }
        subarray(e2, t3) {
          return t3 = t3 || this._lengthToEnd(e2), new _I(this, e2, t3);
        }
        toUint8() {
          return new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
        }
        getUint8Array(e2, t3) {
          return new Uint8Array(this.buffer, this.byteOffset + e2, t3);
        }
        getString(e2 = 0, t3 = this.byteLength) {
          return b(this.getUint8Array(e2, t3));
        }
        getLatin1String(e2 = 0, t3 = this.byteLength) {
          let i2 = this.getUint8Array(e2, t3);
          return C(i2);
        }
        getUnicodeString(e2 = 0, t3 = this.byteLength) {
          const i2 = [];
          for (let n2 = 0; n2 < t3 && e2 + n2 < this.byteLength; n2 += 2) i2.push(this.getUint16(e2 + n2));
          return C(i2);
        }
        getInt8(e2) {
          return this.dataView.getInt8(e2);
        }
        getUint8(e2) {
          return this.dataView.getUint8(e2);
        }
        getInt16(e2, t3 = this.le) {
          return this.dataView.getInt16(e2, t3);
        }
        getInt32(e2, t3 = this.le) {
          return this.dataView.getInt32(e2, t3);
        }
        getUint16(e2, t3 = this.le) {
          return this.dataView.getUint16(e2, t3);
        }
        getUint32(e2, t3 = this.le) {
          return this.dataView.getUint32(e2, t3);
        }
        getFloat32(e2, t3 = this.le) {
          return this.dataView.getFloat32(e2, t3);
        }
        getFloat64(e2, t3 = this.le) {
          return this.dataView.getFloat64(e2, t3);
        }
        getFloat(e2, t3 = this.le) {
          return this.dataView.getFloat32(e2, t3);
        }
        getDouble(e2, t3 = this.le) {
          return this.dataView.getFloat64(e2, t3);
        }
        getUintBytes(e2, t3, i2) {
          switch (t3) {
            case 1:
              return this.getUint8(e2, i2);
            case 2:
              return this.getUint16(e2, i2);
            case 4:
              return this.getUint32(e2, i2);
            case 8:
              return this.getUint64 && this.getUint64(e2, i2);
          }
        }
        getUint(e2, t3, i2) {
          switch (t3) {
            case 8:
              return this.getUint8(e2, i2);
            case 16:
              return this.getUint16(e2, i2);
            case 32:
              return this.getUint32(e2, i2);
            case 64:
              return this.getUint64 && this.getUint64(e2, i2);
          }
        }
        toString(e2) {
          return this.dataView.toString(e2, this.constructor.name);
        }
        ensureChunk() {
        }
      };
      k = class extends Map {
        constructor(e2) {
          super(), this.kind = e2;
        }
        get(e2, t3) {
          return this.has(e2) || P(this.kind, e2), t3 && (e2 in t3 || (function(e3, t4) {
            g(`Unknown ${e3} '${t4}'.`);
          })(this.kind, e2), t3[e2].enabled || P(this.kind, e2)), super.get(e2);
        }
        keyList() {
          return Array.from(this.keys());
        }
      };
      w = new k("file parser");
      T = new k("segment parser");
      A = new k("file reader");
      M = (e2) => h(e2).then(((e3) => e3.arrayBuffer()));
      R = (e2) => new Promise(((t3, i2) => {
        let n2 = new FileReader();
        n2.onloadend = () => t3(n2.result || new ArrayBuffer()), n2.onerror = i2, n2.readAsArrayBuffer(e2);
      }));
      L = class extends Map {
        get tagKeys() {
          return this.allKeys || (this.allKeys = Array.from(this.keys())), this.allKeys;
        }
        get tagValues() {
          return this.allValues || (this.allValues = Array.from(this.values())), this.allValues;
        }
      };
      E = /* @__PURE__ */ new Map();
      B = /* @__PURE__ */ new Map();
      N = /* @__PURE__ */ new Map();
      G = ["chunked", "firstChunkSize", "firstChunkSizeNode", "firstChunkSizeBrowser", "chunkSize", "chunkLimit"];
      V = ["jfif", "xmp", "icc", "iptc", "ihdr"];
      z = ["tiff", ...V];
      H = ["ifd0", "ifd1", "exif", "gps", "interop"];
      j = [...z, ...H];
      W = ["makerNote", "userComment"];
      K = ["translateKeys", "translateValues", "reviveValues", "multiSegment"];
      X = [...K, "sanitize", "mergeOutput", "silentErrors"];
      _ = class {
        get translate() {
          return this.translateKeys || this.translateValues || this.reviveValues;
        }
      };
      Y = class extends _ {
        get needed() {
          return this.enabled || this.deps.size > 0;
        }
        constructor(e2, t3, i2, n2) {
          if (super(), c(this, "enabled", false), c(this, "skip", /* @__PURE__ */ new Set()), c(this, "pick", /* @__PURE__ */ new Set()), c(this, "deps", /* @__PURE__ */ new Set()), c(this, "translateKeys", false), c(this, "translateValues", false), c(this, "reviveValues", false), this.key = e2, this.enabled = t3, this.parse = this.enabled, this.applyInheritables(n2), this.canBeFiltered = H.includes(e2), this.canBeFiltered && (this.dict = E.get(e2)), void 0 !== i2) if (Array.isArray(i2)) this.parse = this.enabled = true, this.canBeFiltered && i2.length > 0 && this.translateTagSet(i2, this.pick);
          else if ("object" == typeof i2) {
            if (this.enabled = true, this.parse = false !== i2.parse, this.canBeFiltered) {
              let { pick: e3, skip: t4 } = i2;
              e3 && e3.length > 0 && this.translateTagSet(e3, this.pick), t4 && t4.length > 0 && this.translateTagSet(t4, this.skip);
            }
            this.applyInheritables(i2);
          } else true === i2 || false === i2 ? this.parse = this.enabled = i2 : g(`Invalid options argument: ${i2}`);
        }
        applyInheritables(e2) {
          let t3, i2;
          for (t3 of K) i2 = e2[t3], void 0 !== i2 && (this[t3] = i2);
        }
        translateTagSet(e2, t3) {
          if (this.dict) {
            let i2, n2, { tagKeys: s2, tagValues: r2 } = this.dict;
            for (i2 of e2) "string" == typeof i2 ? (n2 = r2.indexOf(i2), -1 === n2 && (n2 = s2.indexOf(Number(i2))), -1 !== n2 && t3.add(Number(s2[n2]))) : t3.add(i2);
          } else for (let i2 of e2) t3.add(i2);
        }
        finalizeFilters() {
          !this.enabled && this.deps.size > 0 ? (this.enabled = true, ee(this.pick, this.deps)) : this.enabled && this.pick.size > 0 && ee(this.pick, this.deps);
        }
      };
      $ = { jfif: false, tiff: true, xmp: false, icc: false, iptc: false, ifd0: true, ifd1: false, exif: true, gps: true, interop: false, ihdr: void 0, makerNote: false, userComment: false, multiSegment: false, skip: [], pick: [], translateKeys: true, translateValues: true, reviveValues: true, sanitize: true, mergeOutput: true, silentErrors: true, chunked: true, firstChunkSize: void 0, firstChunkSizeNode: 512, firstChunkSizeBrowser: 65536, chunkSize: 65536, chunkLimit: 5 };
      J = /* @__PURE__ */ new Map();
      q = class extends _ {
        static useCached(e2) {
          let t3 = J.get(e2);
          return void 0 !== t3 || (t3 = new this(e2), J.set(e2, t3)), t3;
        }
        constructor(e2) {
          super(), true === e2 ? this.setupFromTrue() : void 0 === e2 ? this.setupFromUndefined() : Array.isArray(e2) ? this.setupFromArray(e2) : "object" == typeof e2 ? this.setupFromObject(e2) : g(`Invalid options argument ${e2}`), void 0 === this.firstChunkSize && (this.firstChunkSize = t ? this.firstChunkSizeBrowser : this.firstChunkSizeNode), this.mergeOutput && (this.ifd1.enabled = false), this.filterNestedSegmentTags(), this.traverseTiffDependencyTree(), this.checkLoadedPlugins();
        }
        setupFromUndefined() {
          let e2;
          for (e2 of G) this[e2] = $[e2];
          for (e2 of X) this[e2] = $[e2];
          for (e2 of W) this[e2] = $[e2];
          for (e2 of j) this[e2] = new Y(e2, $[e2], void 0, this);
        }
        setupFromTrue() {
          let e2;
          for (e2 of G) this[e2] = $[e2];
          for (e2 of X) this[e2] = $[e2];
          for (e2 of W) this[e2] = true;
          for (e2 of j) this[e2] = new Y(e2, true, void 0, this);
        }
        setupFromArray(e2) {
          let t3;
          for (t3 of G) this[t3] = $[t3];
          for (t3 of X) this[t3] = $[t3];
          for (t3 of W) this[t3] = $[t3];
          for (t3 of j) this[t3] = new Y(t3, false, void 0, this);
          this.setupGlobalFilters(e2, void 0, H);
        }
        setupFromObject(e2) {
          let t3;
          for (t3 of (H.ifd0 = H.ifd0 || H.image, H.ifd1 = H.ifd1 || H.thumbnail, Object.assign(this, e2), G)) this[t3] = Z(e2[t3], $[t3]);
          for (t3 of X) this[t3] = Z(e2[t3], $[t3]);
          for (t3 of W) this[t3] = Z(e2[t3], $[t3]);
          for (t3 of z) this[t3] = new Y(t3, $[t3], e2[t3], this);
          for (t3 of H) this[t3] = new Y(t3, $[t3], e2[t3], this.tiff);
          this.setupGlobalFilters(e2.pick, e2.skip, H, j), true === e2.tiff ? this.batchEnableWithBool(H, true) : false === e2.tiff ? this.batchEnableWithUserValue(H, e2) : Array.isArray(e2.tiff) ? this.setupGlobalFilters(e2.tiff, void 0, H) : "object" == typeof e2.tiff && this.setupGlobalFilters(e2.tiff.pick, e2.tiff.skip, H);
        }
        batchEnableWithBool(e2, t3) {
          for (let i2 of e2) this[i2].enabled = t3;
        }
        batchEnableWithUserValue(e2, t3) {
          for (let i2 of e2) {
            let e3 = t3[i2];
            this[i2].enabled = false !== e3 && void 0 !== e3;
          }
        }
        setupGlobalFilters(e2, t3, i2, n2 = i2) {
          if (e2 && e2.length) {
            for (let e3 of n2) this[e3].enabled = false;
            let t4 = Q(e2, i2);
            for (let [e3, i3] of t4) ee(this[e3].pick, i3), this[e3].enabled = true;
          } else if (t3 && t3.length) {
            let e3 = Q(t3, i2);
            for (let [t4, i3] of e3) ee(this[t4].skip, i3);
          }
        }
        filterNestedSegmentTags() {
          let { ifd0: e2, exif: t3, xmp: i2, iptc: n2, icc: s2 } = this;
          this.makerNote ? t3.deps.add(37500) : t3.skip.add(37500), this.userComment ? t3.deps.add(37510) : t3.skip.add(37510), i2.enabled || e2.skip.add(700), n2.enabled || e2.skip.add(33723), s2.enabled || e2.skip.add(34675);
        }
        traverseTiffDependencyTree() {
          let { ifd0: e2, exif: t3, gps: i2, interop: n2 } = this;
          n2.needed && (t3.deps.add(40965), e2.deps.add(40965)), t3.needed && e2.deps.add(34665), i2.needed && e2.deps.add(34853), this.tiff.enabled = H.some(((e3) => true === this[e3].enabled)) || this.makerNote || this.userComment;
          for (let e3 of H) this[e3].finalizeFilters();
        }
        get onlyTiff() {
          return !V.map(((e2) => this[e2].enabled)).some(((e2) => true === e2)) && this.tiff.enabled;
        }
        checkLoadedPlugins() {
          for (let e2 of z) this[e2].enabled && !T.has(e2) && P("segment parser", e2);
        }
      };
      c(q, "default", $);
      te = class {
        constructor(e2) {
          c(this, "parsers", {}), c(this, "output", {}), c(this, "errors", []), c(this, "pushToErrors", ((e3) => this.errors.push(e3))), this.options = q.useCached(e2);
        }
        async read(e2) {
          this.file = await D(e2, this.options);
        }
        setup() {
          if (this.fileParser) return;
          let { file: e2 } = this, t3 = e2.getUint16(0);
          for (let [i2, n2] of w) if (n2.canHandle(e2, t3)) return this.fileParser = new n2(this.options, this.file, this.parsers), e2[i2] = true;
          this.file.close && this.file.close(), g("Unknown file format");
        }
        async parse() {
          let { output: e2, errors: t3 } = this;
          return this.setup(), this.options.silentErrors ? (await this.executeParsers().catch(this.pushToErrors), t3.push(...this.fileParser.errors)) : await this.executeParsers(), this.file.close && this.file.close(), this.options.silentErrors && t3.length > 0 && (e2.errors = t3), f(e2);
        }
        async executeParsers() {
          let { output: e2 } = this;
          await this.fileParser.parse();
          let t3 = Object.values(this.parsers).map((async (t4) => {
            let i2 = await t4.parse();
            t4.assignToOutput(e2, i2);
          }));
          this.options.silentErrors && (t3 = t3.map(((e3) => e3.catch(this.pushToErrors)))), await Promise.all(t3);
        }
        async extractThumbnail() {
          this.setup();
          let { options: e2, file: t3 } = this, i2 = T.get("tiff", e2);
          var n2;
          if (t3.tiff ? n2 = { start: 0, type: "tiff" } : t3.jpeg && (n2 = await this.fileParser.getOrFindSegment("tiff")), void 0 === n2) return;
          let s2 = await this.fileParser.ensureSegmentChunk(n2), r2 = this.parsers.tiff = new i2(s2, e2, t3), a2 = await r2.extractThumbnail();
          return t3.close && t3.close(), a2;
        }
      };
      ne = Object.freeze({ __proto__: null, parse: ie, Exifr: te, fileParsers: w, segmentParsers: T, fileReaders: A, tagKeys: E, tagValues: B, tagRevivers: N, createDictionary: U, extendDictionary: F, fetchUrlAsArrayBuffer: M, readBlobAsArrayBuffer: R, chunkedProps: G, otherSegments: V, segments: z, tiffBlocks: H, segmentsAndBlocks: j, tiffExtractables: W, inheritables: K, allFormatters: X, Options: q });
      se = class {
        constructor(e2, t3, i2) {
          c(this, "errors", []), c(this, "ensureSegmentChunk", (async (e3) => {
            let t4 = e3.start, i3 = e3.size || 65536;
            if (this.file.chunked) if (this.file.available(t4, i3)) e3.chunk = this.file.subarray(t4, i3);
            else try {
              e3.chunk = await this.file.readChunk(t4, i3);
            } catch (t5) {
              g(`Couldn't read segment: ${JSON.stringify(e3)}. ${t5.message}`);
            }
            else this.file.byteLength > t4 + i3 ? e3.chunk = this.file.subarray(t4, i3) : void 0 === e3.size ? e3.chunk = this.file.subarray(t4) : g("Segment unreachable: " + JSON.stringify(e3));
            return e3.chunk;
          })), this.extendOptions && this.extendOptions(e2), this.options = e2, this.file = t3, this.parsers = i2;
        }
        injectSegment(e2, t3) {
          this.options[e2].enabled && this.createParser(e2, t3);
        }
        createParser(e2, t3) {
          let i2 = new (T.get(e2))(t3, this.options, this.file);
          return this.parsers[e2] = i2;
        }
        createParsers(e2) {
          for (let t3 of e2) {
            let { type: e3, chunk: i2 } = t3, n2 = this.options[e3];
            if (n2 && n2.enabled) {
              let t4 = this.parsers[e3];
              t4 && t4.append || t4 || this.createParser(e3, i2);
            }
          }
        }
        async readSegments(e2) {
          let t3 = e2.map(this.ensureSegmentChunk);
          await Promise.all(t3);
        }
      };
      re = class {
        static findPosition(e2, t3) {
          let i2 = e2.getUint16(t3 + 2) + 2, n2 = "function" == typeof this.headerLength ? this.headerLength(e2, t3, i2) : this.headerLength, s2 = t3 + n2, r2 = i2 - n2;
          return { offset: t3, length: i2, headerLength: n2, start: s2, size: r2, end: s2 + r2 };
        }
        static parse(e2, t3 = {}) {
          return new this(e2, new q({ [this.type]: t3 }), e2).parse();
        }
        normalizeInput(e2) {
          return e2 instanceof I ? e2 : new I(e2);
        }
        constructor(e2, t3 = {}, i2) {
          c(this, "errors", []), c(this, "raw", /* @__PURE__ */ new Map()), c(this, "handleError", ((e3) => {
            if (!this.options.silentErrors) throw e3;
            this.errors.push(e3.message);
          })), this.chunk = this.normalizeInput(e2), this.file = i2, this.type = this.constructor.type, this.globalOptions = this.options = t3, this.localOptions = t3[this.type], this.canTranslate = this.localOptions && this.localOptions.translate;
        }
        translate() {
          this.canTranslate && (this.translated = this.translateBlock(this.raw, this.type));
        }
        get output() {
          return this.translated ? this.translated : this.raw ? Object.fromEntries(this.raw) : void 0;
        }
        translateBlock(e2, t3) {
          let i2 = N.get(t3), n2 = B.get(t3), s2 = E.get(t3), r2 = this.options[t3], a2 = r2.reviveValues && !!i2, o2 = r2.translateValues && !!n2, l2 = r2.translateKeys && !!s2, h2 = {};
          for (let [t4, r3] of e2) a2 && i2.has(t4) ? r3 = i2.get(t4)(r3) : o2 && n2.has(t4) && (r3 = this.translateValue(r3, n2.get(t4))), l2 && s2.has(t4) && (t4 = s2.get(t4) || t4), h2[t4] = r3;
          return h2;
        }
        translateValue(e2, t3) {
          return t3[e2] || t3.DEFAULT || e2;
        }
        assignToOutput(e2, t3) {
          this.assignObjectToOutput(e2, this.constructor.type, t3);
        }
        assignObjectToOutput(e2, t3, i2) {
          if (this.globalOptions.mergeOutput) return Object.assign(e2, i2);
          e2[t3] ? Object.assign(e2[t3], i2) : e2[t3] = i2;
        }
      };
      c(re, "headerLength", 4), c(re, "type", void 0), c(re, "multiSegment", false), c(re, "canHandle", (() => false));
      he = class extends se {
        constructor(...e2) {
          super(...e2), c(this, "appSegments", []), c(this, "jpegSegments", []), c(this, "unknownSegments", []);
        }
        static canHandle(e2, t3) {
          return 65496 === t3;
        }
        async parse() {
          await this.findAppSegments(), await this.readSegments(this.appSegments), this.mergeMultiSegments(), this.createParsers(this.mergedAppSegments || this.appSegments);
        }
        setupSegmentFinderArgs(e2) {
          true === e2 ? (this.findAll = true, this.wanted = new Set(T.keyList())) : (e2 = void 0 === e2 ? T.keyList().filter(((e3) => this.options[e3].enabled)) : e2.filter(((e3) => this.options[e3].enabled && T.has(e3))), this.findAll = false, this.remaining = new Set(e2), this.wanted = new Set(e2)), this.unfinishedMultiSegment = false;
        }
        async findAppSegments(e2 = 0, t3) {
          this.setupSegmentFinderArgs(t3);
          let { file: i2, findAll: n2, wanted: s2, remaining: r2 } = this;
          if (!n2 && this.file.chunked && (n2 = Array.from(s2).some(((e3) => {
            let t4 = T.get(e3), i3 = this.options[e3];
            return t4.multiSegment && i3.multiSegment;
          })), n2 && await this.file.readWhole()), e2 = this.findAppSegmentsInRange(e2, i2.byteLength), !this.options.onlyTiff && i2.chunked) {
            let t4 = false;
            for (; r2.size > 0 && !t4 && (i2.canReadNextChunk || this.unfinishedMultiSegment); ) {
              let { nextChunkOffset: n3 } = i2, s3 = this.appSegments.some(((e3) => !this.file.available(e3.offset || e3.start, e3.length || e3.size)));
              if (t4 = e2 > n3 && !s3 ? !await i2.readNextChunk(e2) : !await i2.readNextChunk(n3), void 0 === (e2 = this.findAppSegmentsInRange(e2, i2.byteLength))) return;
            }
          }
        }
        findAppSegmentsInRange(e2, t3) {
          t3 -= 2;
          let i2, n2, s2, r2, a2, o2, { file: l2, findAll: h2, wanted: u2, remaining: c2, options: f2 } = this;
          for (; e2 < t3; e2++) if (255 === l2.getUint8(e2)) {
            if (i2 = l2.getUint8(e2 + 1), oe(i2)) {
              if (n2 = l2.getUint16(e2 + 2), s2 = le(l2, e2, n2), s2 && u2.has(s2) && (r2 = T.get(s2), a2 = r2.findPosition(l2, e2), o2 = f2[s2], a2.type = s2, this.appSegments.push(a2), !h2 && (r2.multiSegment && o2.multiSegment ? (this.unfinishedMultiSegment = a2.chunkNumber < a2.chunkCount, this.unfinishedMultiSegment || c2.delete(s2)) : c2.delete(s2), 0 === c2.size))) break;
              f2.recordUnknownSegments && (a2 = re.findPosition(l2, e2), a2.marker = i2, this.unknownSegments.push(a2)), e2 += n2 + 1;
            } else if (ae(i2)) {
              if (n2 = l2.getUint16(e2 + 2), 218 === i2 && false !== f2.stopAfterSos) return;
              f2.recordJpegSegments && this.jpegSegments.push({ offset: e2, length: n2, marker: i2 }), e2 += n2 + 1;
            }
          }
          return e2;
        }
        mergeMultiSegments() {
          if (!this.appSegments.some(((e3) => e3.multiSegment))) return;
          let e2 = (function(e3, t3) {
            let i2, n2, s2, r2 = /* @__PURE__ */ new Map();
            for (let a2 = 0; a2 < e3.length; a2++) i2 = e3[a2], n2 = i2[t3], r2.has(n2) ? s2 = r2.get(n2) : r2.set(n2, s2 = []), s2.push(i2);
            return Array.from(r2);
          })(this.appSegments, "type");
          this.mergedAppSegments = e2.map((([e3, t3]) => {
            let i2 = T.get(e3, this.options);
            if (i2.handleMultiSegments) {
              return { type: e3, chunk: i2.handleMultiSegments(t3) };
            }
            return t3[0];
          }));
        }
        getSegment(e2) {
          return this.appSegments.find(((t3) => t3.type === e2));
        }
        async getOrFindSegment(e2) {
          let t3 = this.getSegment(e2);
          return void 0 === t3 && (await this.findAppSegments(0, [e2]), t3 = this.getSegment(e2)), t3;
        }
      };
      c(he, "type", "jpeg"), w.set("jpeg", he);
      ue = [void 0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8, 4];
      ce = class extends re {
        parseHeader() {
          var e2 = this.chunk.getUint16();
          18761 === e2 ? this.le = true : 19789 === e2 && (this.le = false), this.chunk.le = this.le, this.headerParsed = true;
        }
        parseTags(e2, t3, i2 = /* @__PURE__ */ new Map()) {
          let { pick: n2, skip: s2 } = this.options[t3];
          n2 = new Set(n2);
          let r2 = n2.size > 0, a2 = 0 === s2.size, o2 = this.chunk.getUint16(e2);
          e2 += 2;
          for (let l2 = 0; l2 < o2; l2++) {
            let o3 = this.chunk.getUint16(e2);
            if (r2) {
              if (n2.has(o3) && (i2.set(o3, this.parseTag(e2, o3, t3)), n2.delete(o3), 0 === n2.size)) break;
            } else !a2 && s2.has(o3) || i2.set(o3, this.parseTag(e2, o3, t3));
            e2 += 12;
          }
          return i2;
        }
        parseTag(e2, t3, i2) {
          let { chunk: n2 } = this, s2 = n2.getUint16(e2 + 2), r2 = n2.getUint32(e2 + 4), a2 = ue[s2];
          if (a2 * r2 <= 4 ? e2 += 8 : e2 = n2.getUint32(e2 + 8), (s2 < 1 || s2 > 13) && g(`Invalid TIFF value type. block: ${i2.toUpperCase()}, tag: ${t3.toString(16)}, type: ${s2}, offset ${e2}`), e2 > n2.byteLength && g(`Invalid TIFF value offset. block: ${i2.toUpperCase()}, tag: ${t3.toString(16)}, type: ${s2}, offset ${e2} is outside of chunk size ${n2.byteLength}`), 1 === s2) return n2.getUint8Array(e2, r2);
          if (2 === s2) return m(n2.getString(e2, r2));
          if (7 === s2) return n2.getUint8Array(e2, r2);
          if (1 === r2) return this.parseTagValue(s2, e2);
          {
            let t4 = new ((function(e3) {
              switch (e3) {
                case 1:
                  return Uint8Array;
                case 3:
                  return Uint16Array;
                case 4:
                  return Uint32Array;
                case 5:
                  return Array;
                case 6:
                  return Int8Array;
                case 8:
                  return Int16Array;
                case 9:
                  return Int32Array;
                case 10:
                  return Array;
                case 11:
                  return Float32Array;
                case 12:
                  return Float64Array;
                default:
                  return Array;
              }
            })(s2))(r2), i3 = a2;
            for (let n3 = 0; n3 < r2; n3++) t4[n3] = this.parseTagValue(s2, e2), e2 += i3;
            return t4;
          }
        }
        parseTagValue(e2, t3) {
          let { chunk: i2 } = this;
          switch (e2) {
            case 1:
              return i2.getUint8(t3);
            case 3:
              return i2.getUint16(t3);
            case 4:
              return i2.getUint32(t3);
            case 5:
              return i2.getUint32(t3) / i2.getUint32(t3 + 4);
            case 6:
              return i2.getInt8(t3);
            case 8:
              return i2.getInt16(t3);
            case 9:
              return i2.getInt32(t3);
            case 10:
              return i2.getInt32(t3) / i2.getInt32(t3 + 4);
            case 11:
              return i2.getFloat(t3);
            case 12:
              return i2.getDouble(t3);
            case 13:
              return i2.getUint32(t3);
            default:
              g(`Invalid tiff type ${e2}`);
          }
        }
      };
      fe = class extends ce {
        static canHandle(e2, t3) {
          return 225 === e2.getUint8(t3 + 1) && 1165519206 === e2.getUint32(t3 + 4) && 0 === e2.getUint16(t3 + 8);
        }
        async parse() {
          this.parseHeader();
          let { options: e2 } = this;
          return e2.ifd0.enabled && await this.parseIfd0Block(), e2.exif.enabled && await this.safeParse("parseExifBlock"), e2.gps.enabled && await this.safeParse("parseGpsBlock"), e2.interop.enabled && await this.safeParse("parseInteropBlock"), e2.ifd1.enabled && await this.safeParse("parseThumbnailBlock"), this.createOutput();
        }
        safeParse(e2) {
          let t3 = this[e2]();
          return void 0 !== t3.catch && (t3 = t3.catch(this.handleError)), t3;
        }
        findIfd0Offset() {
          void 0 === this.ifd0Offset && (this.ifd0Offset = this.chunk.getUint32(4));
        }
        findIfd1Offset() {
          if (void 0 === this.ifd1Offset) {
            this.findIfd0Offset();
            let e2 = this.chunk.getUint16(this.ifd0Offset), t3 = this.ifd0Offset + 2 + 12 * e2;
            this.ifd1Offset = this.chunk.getUint32(t3);
          }
        }
        parseBlock(e2, t3) {
          let i2 = /* @__PURE__ */ new Map();
          return this[t3] = i2, this.parseTags(e2, t3, i2), i2;
        }
        async parseIfd0Block() {
          if (this.ifd0) return;
          let { file: e2 } = this;
          this.findIfd0Offset(), this.ifd0Offset < 8 && g("Malformed EXIF data"), !e2.chunked && this.ifd0Offset > e2.byteLength && g(`IFD0 offset points to outside of file.
this.ifd0Offset: ${this.ifd0Offset}, file.byteLength: ${e2.byteLength}`), e2.tiff && await e2.ensureChunk(this.ifd0Offset, S(this.options));
          let t3 = this.parseBlock(this.ifd0Offset, "ifd0");
          return 0 !== t3.size ? (this.exifOffset = t3.get(34665), this.interopOffset = t3.get(40965), this.gpsOffset = t3.get(34853), this.xmp = t3.get(700), this.iptc = t3.get(33723), this.icc = t3.get(34675), this.options.sanitize && (t3.delete(34665), t3.delete(40965), t3.delete(34853), t3.delete(700), t3.delete(33723), t3.delete(34675)), t3) : void 0;
        }
        async parseExifBlock() {
          if (this.exif) return;
          if (this.ifd0 || await this.parseIfd0Block(), void 0 === this.exifOffset) return;
          this.file.tiff && await this.file.ensureChunk(this.exifOffset, S(this.options));
          let e2 = this.parseBlock(this.exifOffset, "exif");
          return this.interopOffset || (this.interopOffset = e2.get(40965)), this.makerNote = e2.get(37500), this.userComment = e2.get(37510), this.options.sanitize && (e2.delete(40965), e2.delete(37500), e2.delete(37510)), this.unpack(e2, 41728), this.unpack(e2, 41729), e2;
        }
        unpack(e2, t3) {
          let i2 = e2.get(t3);
          i2 && 1 === i2.length && e2.set(t3, i2[0]);
        }
        async parseGpsBlock() {
          if (this.gps) return;
          if (this.ifd0 || await this.parseIfd0Block(), void 0 === this.gpsOffset) return;
          let e2 = this.parseBlock(this.gpsOffset, "gps");
          return e2 && e2.has(2) && e2.has(4) && (e2.set("latitude", de(...e2.get(2), e2.get(1))), e2.set("longitude", de(...e2.get(4), e2.get(3)))), e2;
        }
        async parseInteropBlock() {
          if (!this.interop && (this.ifd0 || await this.parseIfd0Block(), void 0 !== this.interopOffset || this.exif || await this.parseExifBlock(), void 0 !== this.interopOffset)) return this.parseBlock(this.interopOffset, "interop");
        }
        async parseThumbnailBlock(e2 = false) {
          if (!this.ifd1 && !this.ifd1Parsed && (!this.options.mergeOutput || e2)) return this.findIfd1Offset(), this.ifd1Offset > 0 && (this.parseBlock(this.ifd1Offset, "ifd1"), this.ifd1Parsed = true), this.ifd1;
        }
        async extractThumbnail() {
          if (this.headerParsed || this.parseHeader(), this.ifd1Parsed || await this.parseThumbnailBlock(true), void 0 === this.ifd1) return;
          let e2 = this.ifd1.get(513), t3 = this.ifd1.get(514);
          return this.chunk.getUint8Array(e2, t3);
        }
        get image() {
          return this.ifd0;
        }
        get thumbnail() {
          return this.ifd1;
        }
        createOutput() {
          let e2, t3, i2, n2 = {};
          for (t3 of H) if (e2 = this[t3], !p(e2)) if (i2 = this.canTranslate ? this.translateBlock(e2, t3) : Object.fromEntries(e2), this.options.mergeOutput) {
            if ("ifd1" === t3) continue;
            Object.assign(n2, i2);
          } else n2[t3] = i2;
          return this.makerNote && (n2.makerNote = this.makerNote), this.userComment && (n2.userComment = this.userComment), n2;
        }
        assignToOutput(e2, t3) {
          if (this.globalOptions.mergeOutput) Object.assign(e2, t3);
          else for (let [i2, n2] of Object.entries(t3)) this.assignObjectToOutput(e2, i2, n2);
        }
      };
      c(fe, "type", "tiff"), c(fe, "headerLength", 10), T.set("tiff", fe);
      pe = Object.freeze({ __proto__: null, default: ne, Exifr: te, fileParsers: w, segmentParsers: T, fileReaders: A, tagKeys: E, tagValues: B, tagRevivers: N, createDictionary: U, extendDictionary: F, fetchUrlAsArrayBuffer: M, readBlobAsArrayBuffer: R, chunkedProps: G, otherSegments: V, segments: z, tiffBlocks: H, segmentsAndBlocks: j, tiffExtractables: W, inheritables: K, allFormatters: X, Options: q, parse: ie });
      ge = { ifd0: false, ifd1: false, exif: false, gps: false, interop: false, sanitize: false, reviveValues: true, translateKeys: false, translateValues: false, mergeOutput: false };
      me = Object.assign({}, ge, { firstChunkSize: 4e4, gps: [1, 2, 3, 4] });
      Ce = Object.assign({}, ge, { tiff: false, ifd1: true, mergeOutput: false });
      Ie = Object.assign({}, ge, { firstChunkSize: 4e4, ifd0: [274] });
      ke = Object.freeze({ 1: { dimensionSwapped: false, scaleX: 1, scaleY: 1, deg: 0, rad: 0 }, 2: { dimensionSwapped: false, scaleX: -1, scaleY: 1, deg: 0, rad: 0 }, 3: { dimensionSwapped: false, scaleX: 1, scaleY: 1, deg: 180, rad: 180 * Math.PI / 180 }, 4: { dimensionSwapped: false, scaleX: -1, scaleY: 1, deg: 180, rad: 180 * Math.PI / 180 }, 5: { dimensionSwapped: true, scaleX: 1, scaleY: -1, deg: 90, rad: 90 * Math.PI / 180 }, 6: { dimensionSwapped: true, scaleX: 1, scaleY: 1, deg: 90, rad: 90 * Math.PI / 180 }, 7: { dimensionSwapped: true, scaleX: 1, scaleY: -1, deg: 270, rad: 270 * Math.PI / 180 }, 8: { dimensionSwapped: true, scaleX: 1, scaleY: 1, deg: 270, rad: 270 * Math.PI / 180 } });
      we = true;
      Te = true;
      if ("object" == typeof navigator) {
        let e2 = navigator.userAgent;
        if (e2.includes("iPad") || e2.includes("iPhone")) {
          let t3 = e2.match(/OS (\d+)_(\d+)/);
          if (t3) {
            let [, e3, i2] = t3, n2 = Number(e3) + 0.1 * Number(i2);
            we = n2 < 13.4, Te = false;
          }
        } else if (e2.includes("OS X 10")) {
          let [, t3] = e2.match(/OS X 10[_.](\d+)/);
          we = Te = Number(t3) < 15;
        }
        if (e2.includes("Chrome/")) {
          let [, t3] = e2.match(/Chrome\/(\d+)/);
          we = Te = Number(t3) < 81;
        } else if (e2.includes("Firefox/")) {
          let [, t3] = e2.match(/Firefox\/(\d+)/);
          we = Te = Number(t3) < 77;
        }
      }
      De = class extends I {
        constructor(...e2) {
          super(...e2), c(this, "ranges", new Oe()), 0 !== this.byteLength && this.ranges.add(0, this.byteLength);
        }
        _tryExtend(e2, t3, i2) {
          if (0 === e2 && 0 === this.byteLength && i2) {
            let e3 = new DataView(i2.buffer || i2, i2.byteOffset, i2.byteLength);
            this._swapDataView(e3);
          } else {
            let i3 = e2 + t3;
            if (i3 > this.byteLength) {
              let { dataView: e3 } = this._extend(i3);
              this._swapDataView(e3);
            }
          }
        }
        _extend(e2) {
          let t3;
          t3 = a ? s.allocUnsafe(e2) : new Uint8Array(e2);
          let i2 = new DataView(t3.buffer, t3.byteOffset, t3.byteLength);
          return t3.set(new Uint8Array(this.buffer, this.byteOffset, this.byteLength), 0), { uintView: t3, dataView: i2 };
        }
        subarray(e2, t3, i2 = false) {
          return t3 = t3 || this._lengthToEnd(e2), i2 && this._tryExtend(e2, t3), this.ranges.add(e2, t3), super.subarray(e2, t3);
        }
        set(e2, t3, i2 = false) {
          i2 && this._tryExtend(t3, e2.byteLength, e2);
          let n2 = super.set(e2, t3);
          return this.ranges.add(t3, n2.byteLength), n2;
        }
        async ensureChunk(e2, t3) {
          this.chunked && (this.ranges.available(e2, t3) || await this.readChunk(e2, t3));
        }
        available(e2, t3) {
          return this.ranges.available(e2, t3);
        }
      };
      Oe = class {
        constructor() {
          c(this, "list", []);
        }
        get length() {
          return this.list.length;
        }
        add(e2, t3, i2 = 0) {
          let n2 = e2 + t3, s2 = this.list.filter(((t4) => xe(e2, t4.offset, n2) || xe(e2, t4.end, n2)));
          if (s2.length > 0) {
            e2 = Math.min(e2, ...s2.map(((e3) => e3.offset))), n2 = Math.max(n2, ...s2.map(((e3) => e3.end))), t3 = n2 - e2;
            let i3 = s2.shift();
            i3.offset = e2, i3.length = t3, i3.end = n2, this.list = this.list.filter(((e3) => !s2.includes(e3)));
          } else this.list.push({ offset: e2, length: t3, end: n2 });
        }
        available(e2, t3) {
          let i2 = e2 + t3;
          return this.list.some(((t4) => t4.offset <= e2 && i2 <= t4.end));
        }
      };
      ve = class extends De {
        constructor(e2, t3) {
          super(0), c(this, "chunksRead", 0), this.input = e2, this.options = t3;
        }
        async readWhole() {
          this.chunked = false, await this.readChunk(this.nextChunkOffset);
        }
        async readChunked() {
          this.chunked = true, await this.readChunk(0, this.options.firstChunkSize);
        }
        async readNextChunk(e2 = this.nextChunkOffset) {
          if (this.fullyRead) return this.chunksRead++, false;
          let t3 = this.options.chunkSize, i2 = await this.readChunk(e2, t3);
          return !!i2 && i2.byteLength === t3;
        }
        async readChunk(e2, t3) {
          if (this.chunksRead++, 0 !== (t3 = this.safeWrapAddress(e2, t3))) return this._readChunk(e2, t3);
        }
        safeWrapAddress(e2, t3) {
          return void 0 !== this.size && e2 + t3 > this.size ? Math.max(0, this.size - e2) : t3;
        }
        get nextChunkOffset() {
          if (0 !== this.ranges.list.length) return this.ranges.list[0].length;
        }
        get canReadNextChunk() {
          return this.chunksRead < this.options.chunkLimit;
        }
        get fullyRead() {
          return void 0 !== this.size && this.nextChunkOffset === this.size;
        }
        read() {
          return this.options.chunked ? this.readChunked() : this.readWhole();
        }
        close() {
        }
      };
      A.set("blob", class extends ve {
        async readWhole() {
          this.chunked = false;
          let e2 = await R(this.input);
          this._swapArrayBuffer(e2);
        }
        readChunked() {
          return this.chunked = true, this.size = this.input.size, super.readChunked();
        }
        async _readChunk(e2, t3) {
          let i2 = t3 ? e2 + t3 : void 0, n2 = this.input.slice(e2, i2), s2 = await R(n2);
          return this.set(s2, e2, true);
        }
      });
      Me = Object.freeze({ __proto__: null, default: pe, Exifr: te, fileParsers: w, segmentParsers: T, fileReaders: A, tagKeys: E, tagValues: B, tagRevivers: N, createDictionary: U, extendDictionary: F, fetchUrlAsArrayBuffer: M, readBlobAsArrayBuffer: R, chunkedProps: G, otherSegments: V, segments: z, tiffBlocks: H, segmentsAndBlocks: j, tiffExtractables: W, inheritables: K, allFormatters: X, Options: q, parse: ie, gpsOnlyOptions: me, gps: Se, thumbnailOnlyOptions: Ce, thumbnail: ye, thumbnailUrl: be, orientationOnlyOptions: Ie, orientation: Pe, rotations: ke, get rotateCanvas() {
        return we;
      }, get rotateCss() {
        return Te;
      }, rotation: Ae });
      A.set("url", class extends ve {
        async readWhole() {
          this.chunked = false;
          let e2 = await M(this.input);
          e2 instanceof ArrayBuffer ? this._swapArrayBuffer(e2) : e2 instanceof Uint8Array && this._swapBuffer(e2);
        }
        async _readChunk(e2, t3) {
          let i2 = t3 ? e2 + t3 - 1 : void 0, n2 = this.options.httpHeaders || {};
          (e2 || i2) && (n2.range = `bytes=${[e2, i2].join("-")}`);
          let s2 = await h(this.input, { headers: n2 }), r2 = await s2.arrayBuffer(), a2 = r2.byteLength;
          if (416 !== s2.status) return a2 !== t3 && (this.size = e2 + a2), this.set(r2, e2, true);
        }
      });
      I.prototype.getUint64 = function(e2) {
        let t3 = this.getUint32(e2), i2 = this.getUint32(e2 + 4);
        return t3 < 1048575 ? t3 << 32 | i2 : void 0 !== typeof r ? (console.warn("Using BigInt because of type 64uint but JS can only handle 53b numbers."), r(t3) << r(32) | r(i2)) : void g("Trying to read 64b value but JS can only handle 53b numbers.");
      };
      Re = class extends se {
        parseBoxes(e2 = 0) {
          let t3 = [];
          for (; e2 < this.file.byteLength - 4; ) {
            let i2 = this.parseBoxHead(e2);
            if (t3.push(i2), 0 === i2.length) break;
            e2 += i2.length;
          }
          return t3;
        }
        parseSubBoxes(e2) {
          e2.boxes = this.parseBoxes(e2.start);
        }
        findBox(e2, t3) {
          return void 0 === e2.boxes && this.parseSubBoxes(e2), e2.boxes.find(((e3) => e3.kind === t3));
        }
        parseBoxHead(e2) {
          let t3 = this.file.getUint32(e2), i2 = this.file.getString(e2 + 4, 4), n2 = e2 + 8;
          return 1 === t3 && (t3 = this.file.getUint64(e2 + 8), n2 += 8), { offset: e2, length: t3, kind: i2, start: n2 };
        }
        parseBoxFullHead(e2) {
          if (void 0 !== e2.version) return;
          let t3 = this.file.getUint32(e2.start);
          e2.version = t3 >> 24, e2.start += 4;
        }
      };
      Le = class extends Re {
        static canHandle(e2, t3) {
          if (0 !== t3) return false;
          let i2 = e2.getUint16(2);
          if (i2 > 50) return false;
          let n2 = 16, s2 = [];
          for (; n2 < i2; ) s2.push(e2.getString(n2, 4)), n2 += 4;
          return s2.includes(this.type);
        }
        async parse() {
          let e2 = this.file.getUint32(0), t3 = this.parseBoxHead(e2);
          for (; "meta" !== t3.kind; ) e2 += t3.length, await this.file.ensureChunk(e2, 16), t3 = this.parseBoxHead(e2);
          await this.file.ensureChunk(t3.offset, t3.length), this.parseBoxFullHead(t3), this.parseSubBoxes(t3), this.options.icc.enabled && await this.findIcc(t3), this.options.tiff.enabled && await this.findExif(t3);
        }
        async registerSegment(e2, t3, i2) {
          await this.file.ensureChunk(t3, i2);
          let n2 = this.file.subarray(t3, i2);
          this.createParser(e2, n2);
        }
        async findIcc(e2) {
          let t3 = this.findBox(e2, "iprp");
          if (void 0 === t3) return;
          let i2 = this.findBox(t3, "ipco");
          if (void 0 === i2) return;
          let n2 = this.findBox(i2, "colr");
          void 0 !== n2 && await this.registerSegment("icc", n2.offset + 12, n2.length);
        }
        async findExif(e2) {
          let t3 = this.findBox(e2, "iinf");
          if (void 0 === t3) return;
          let i2 = this.findBox(e2, "iloc");
          if (void 0 === i2) return;
          let n2 = this.findExifLocIdInIinf(t3), s2 = this.findExtentInIloc(i2, n2);
          if (void 0 === s2) return;
          let [r2, a2] = s2;
          await this.file.ensureChunk(r2, a2);
          let o2 = 4 + this.file.getUint32(r2);
          r2 += o2, a2 -= o2, await this.registerSegment("tiff", r2, a2);
        }
        findExifLocIdInIinf(e2) {
          this.parseBoxFullHead(e2);
          let t3, i2, n2, s2, r2 = e2.start, a2 = this.file.getUint16(r2);
          for (r2 += 2; a2--; ) {
            if (t3 = this.parseBoxHead(r2), this.parseBoxFullHead(t3), i2 = t3.start, t3.version >= 2 && (n2 = 3 === t3.version ? 4 : 2, s2 = this.file.getString(i2 + n2 + 2, 4), "Exif" === s2)) return this.file.getUintBytes(i2, n2);
            r2 += t3.length;
          }
        }
        get8bits(e2) {
          let t3 = this.file.getUint8(e2);
          return [t3 >> 4, 15 & t3];
        }
        findExtentInIloc(e2, t3) {
          this.parseBoxFullHead(e2);
          let i2 = e2.start, [n2, s2] = this.get8bits(i2++), [r2, a2] = this.get8bits(i2++), o2 = 2 === e2.version ? 4 : 2, l2 = 1 === e2.version || 2 === e2.version ? 2 : 0, h2 = a2 + n2 + s2, u2 = 2 === e2.version ? 4 : 2, c2 = this.file.getUintBytes(i2, u2);
          for (i2 += u2; c2--; ) {
            let e3 = this.file.getUintBytes(i2, o2);
            i2 += o2 + l2 + 2 + r2;
            let u3 = this.file.getUint16(i2);
            if (i2 += 2, e3 === t3) return u3 > 1 && console.warn("ILOC box has more than one extent but we're only processing one\nPlease create an issue at https://github.com/MikeKovarik/exifr with this file"), [this.file.getUintBytes(i2 + a2, n2), this.file.getUintBytes(i2 + a2 + n2, s2)];
            i2 += u3 * h2;
          }
        }
      };
      Ue = class extends Le {
      };
      c(Ue, "type", "heic");
      Fe = class extends Le {
      };
      c(Fe, "type", "avif"), w.set("heic", Ue), w.set("avif", Fe), U(E, ["ifd0", "ifd1"], [[256, "ImageWidth"], [257, "ImageHeight"], [258, "BitsPerSample"], [259, "Compression"], [262, "PhotometricInterpretation"], [270, "ImageDescription"], [271, "Make"], [272, "Model"], [273, "StripOffsets"], [274, "Orientation"], [277, "SamplesPerPixel"], [278, "RowsPerStrip"], [279, "StripByteCounts"], [282, "XResolution"], [283, "YResolution"], [284, "PlanarConfiguration"], [296, "ResolutionUnit"], [301, "TransferFunction"], [305, "Software"], [306, "ModifyDate"], [315, "Artist"], [316, "HostComputer"], [317, "Predictor"], [318, "WhitePoint"], [319, "PrimaryChromaticities"], [513, "ThumbnailOffset"], [514, "ThumbnailLength"], [529, "YCbCrCoefficients"], [530, "YCbCrSubSampling"], [531, "YCbCrPositioning"], [532, "ReferenceBlackWhite"], [700, "ApplicationNotes"], [33432, "Copyright"], [33723, "IPTC"], [34665, "ExifIFD"], [34675, "ICC"], [34853, "GpsIFD"], [330, "SubIFD"], [40965, "InteropIFD"], [40091, "XPTitle"], [40092, "XPComment"], [40093, "XPAuthor"], [40094, "XPKeywords"], [40095, "XPSubject"]]), U(E, "exif", [[33434, "ExposureTime"], [33437, "FNumber"], [34850, "ExposureProgram"], [34852, "SpectralSensitivity"], [34855, "ISO"], [34858, "TimeZoneOffset"], [34859, "SelfTimerMode"], [34864, "SensitivityType"], [34865, "StandardOutputSensitivity"], [34866, "RecommendedExposureIndex"], [34867, "ISOSpeed"], [34868, "ISOSpeedLatitudeyyy"], [34869, "ISOSpeedLatitudezzz"], [36864, "ExifVersion"], [36867, "DateTimeOriginal"], [36868, "CreateDate"], [36873, "GooglePlusUploadCode"], [36880, "OffsetTime"], [36881, "OffsetTimeOriginal"], [36882, "OffsetTimeDigitized"], [37121, "ComponentsConfiguration"], [37122, "CompressedBitsPerPixel"], [37377, "ShutterSpeedValue"], [37378, "ApertureValue"], [37379, "BrightnessValue"], [37380, "ExposureCompensation"], [37381, "MaxApertureValue"], [37382, "SubjectDistance"], [37383, "MeteringMode"], [37384, "LightSource"], [37385, "Flash"], [37386, "FocalLength"], [37393, "ImageNumber"], [37394, "SecurityClassification"], [37395, "ImageHistory"], [37396, "SubjectArea"], [37500, "MakerNote"], [37510, "UserComment"], [37520, "SubSecTime"], [37521, "SubSecTimeOriginal"], [37522, "SubSecTimeDigitized"], [37888, "AmbientTemperature"], [37889, "Humidity"], [37890, "Pressure"], [37891, "WaterDepth"], [37892, "Acceleration"], [37893, "CameraElevationAngle"], [40960, "FlashpixVersion"], [40961, "ColorSpace"], [40962, "ExifImageWidth"], [40963, "ExifImageHeight"], [40964, "RelatedSoundFile"], [41483, "FlashEnergy"], [41486, "FocalPlaneXResolution"], [41487, "FocalPlaneYResolution"], [41488, "FocalPlaneResolutionUnit"], [41492, "SubjectLocation"], [41493, "ExposureIndex"], [41495, "SensingMethod"], [41728, "FileSource"], [41729, "SceneType"], [41730, "CFAPattern"], [41985, "CustomRendered"], [41986, "ExposureMode"], [41987, "WhiteBalance"], [41988, "DigitalZoomRatio"], [41989, "FocalLengthIn35mmFormat"], [41990, "SceneCaptureType"], [41991, "GainControl"], [41992, "Contrast"], [41993, "Saturation"], [41994, "Sharpness"], [41996, "SubjectDistanceRange"], [42016, "ImageUniqueID"], [42032, "OwnerName"], [42033, "SerialNumber"], [42034, "LensInfo"], [42035, "LensMake"], [42036, "LensModel"], [42037, "LensSerialNumber"], [42080, "CompositeImage"], [42081, "CompositeImageCount"], [42082, "CompositeImageExposureTimes"], [42240, "Gamma"], [59932, "Padding"], [59933, "OffsetSchema"], [65e3, "OwnerName"], [65001, "SerialNumber"], [65002, "Lens"], [65100, "RawFile"], [65101, "Converter"], [65102, "WhiteBalance"], [65105, "Exposure"], [65106, "Shadows"], [65107, "Brightness"], [65108, "Contrast"], [65109, "Saturation"], [65110, "Sharpness"], [65111, "Smoothness"], [65112, "MoireFilter"], [40965, "InteropIFD"]]), U(E, "gps", [[0, "GPSVersionID"], [1, "GPSLatitudeRef"], [2, "GPSLatitude"], [3, "GPSLongitudeRef"], [4, "GPSLongitude"], [5, "GPSAltitudeRef"], [6, "GPSAltitude"], [7, "GPSTimeStamp"], [8, "GPSSatellites"], [9, "GPSStatus"], [10, "GPSMeasureMode"], [11, "GPSDOP"], [12, "GPSSpeedRef"], [13, "GPSSpeed"], [14, "GPSTrackRef"], [15, "GPSTrack"], [16, "GPSImgDirectionRef"], [17, "GPSImgDirection"], [18, "GPSMapDatum"], [19, "GPSDestLatitudeRef"], [20, "GPSDestLatitude"], [21, "GPSDestLongitudeRef"], [22, "GPSDestLongitude"], [23, "GPSDestBearingRef"], [24, "GPSDestBearing"], [25, "GPSDestDistanceRef"], [26, "GPSDestDistance"], [27, "GPSProcessingMethod"], [28, "GPSAreaInformation"], [29, "GPSDateStamp"], [30, "GPSDifferential"], [31, "GPSHPositioningError"]]), U(B, ["ifd0", "ifd1"], [[274, { 1: "Horizontal (normal)", 2: "Mirror horizontal", 3: "Rotate 180", 4: "Mirror vertical", 5: "Mirror horizontal and rotate 270 CW", 6: "Rotate 90 CW", 7: "Mirror horizontal and rotate 90 CW", 8: "Rotate 270 CW" }], [296, { 1: "None", 2: "inches", 3: "cm" }]]);
      Ee = U(B, "exif", [[34850, { 0: "Not defined", 1: "Manual", 2: "Normal program", 3: "Aperture priority", 4: "Shutter priority", 5: "Creative program", 6: "Action program", 7: "Portrait mode", 8: "Landscape mode" }], [37121, { 0: "-", 1: "Y", 2: "Cb", 3: "Cr", 4: "R", 5: "G", 6: "B" }], [37383, { 0: "Unknown", 1: "Average", 2: "CenterWeightedAverage", 3: "Spot", 4: "MultiSpot", 5: "Pattern", 6: "Partial", 255: "Other" }], [37384, { 0: "Unknown", 1: "Daylight", 2: "Fluorescent", 3: "Tungsten (incandescent light)", 4: "Flash", 9: "Fine weather", 10: "Cloudy weather", 11: "Shade", 12: "Daylight fluorescent (D 5700 - 7100K)", 13: "Day white fluorescent (N 4600 - 5400K)", 14: "Cool white fluorescent (W 3900 - 4500K)", 15: "White fluorescent (WW 3200 - 3700K)", 17: "Standard light A", 18: "Standard light B", 19: "Standard light C", 20: "D55", 21: "D65", 22: "D75", 23: "D50", 24: "ISO studio tungsten", 255: "Other" }], [37385, { 0: "Flash did not fire", 1: "Flash fired", 5: "Strobe return light not detected", 7: "Strobe return light detected", 9: "Flash fired, compulsory flash mode", 13: "Flash fired, compulsory flash mode, return light not detected", 15: "Flash fired, compulsory flash mode, return light detected", 16: "Flash did not fire, compulsory flash mode", 24: "Flash did not fire, auto mode", 25: "Flash fired, auto mode", 29: "Flash fired, auto mode, return light not detected", 31: "Flash fired, auto mode, return light detected", 32: "No flash function", 65: "Flash fired, red-eye reduction mode", 69: "Flash fired, red-eye reduction mode, return light not detected", 71: "Flash fired, red-eye reduction mode, return light detected", 73: "Flash fired, compulsory flash mode, red-eye reduction mode", 77: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected", 79: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected", 89: "Flash fired, auto mode, red-eye reduction mode", 93: "Flash fired, auto mode, return light not detected, red-eye reduction mode", 95: "Flash fired, auto mode, return light detected, red-eye reduction mode" }], [41495, { 1: "Not defined", 2: "One-chip color area sensor", 3: "Two-chip color area sensor", 4: "Three-chip color area sensor", 5: "Color sequential area sensor", 7: "Trilinear sensor", 8: "Color sequential linear sensor" }], [41728, { 1: "Film Scanner", 2: "Reflection Print Scanner", 3: "Digital Camera" }], [41729, { 1: "Directly photographed" }], [41985, { 0: "Normal", 1: "Custom", 2: "HDR (no original saved)", 3: "HDR (original saved)", 4: "Original (for HDR)", 6: "Panorama", 7: "Portrait HDR", 8: "Portrait" }], [41986, { 0: "Auto", 1: "Manual", 2: "Auto bracket" }], [41987, { 0: "Auto", 1: "Manual" }], [41990, { 0: "Standard", 1: "Landscape", 2: "Portrait", 3: "Night", 4: "Other" }], [41991, { 0: "None", 1: "Low gain up", 2: "High gain up", 3: "Low gain down", 4: "High gain down" }], [41996, { 0: "Unknown", 1: "Macro", 2: "Close", 3: "Distant" }], [42080, { 0: "Unknown", 1: "Not a Composite Image", 2: "General Composite Image", 3: "Composite Image Captured While Shooting" }]]);
      Be = { 1: "No absolute unit of measurement", 2: "Inch", 3: "Centimeter" };
      Ee.set(37392, Be), Ee.set(41488, Be);
      Ne = { 0: "Normal", 1: "Low", 2: "High" };
      Ee.set(41992, Ne), Ee.set(41993, Ne), Ee.set(41994, Ne), U(N, ["ifd0", "ifd1"], [[50827, function(e2) {
        return "string" != typeof e2 ? b(e2) : e2;
      }], [306, ze], [40091, He], [40092, He], [40093, He], [40094, He], [40095, He]]), U(N, "exif", [[40960, Ve], [36864, Ve], [36867, ze], [36868, ze], [40962, Ge], [40963, Ge]]), U(N, "gps", [[0, (e2) => Array.from(e2).join(".")], [7, (e2) => Array.from(e2).join(":")]]);
      We = class extends re {
        static canHandle(e2, t3) {
          return 225 === e2.getUint8(t3 + 1) && 1752462448 === e2.getUint32(t3 + 4) && "http://ns.adobe.com/" === e2.getString(t3 + 4, "http://ns.adobe.com/".length);
        }
        static headerLength(e2, t3) {
          return "http://ns.adobe.com/xmp/extension/" === e2.getString(t3 + 4, "http://ns.adobe.com/xmp/extension/".length) ? 79 : 4 + "http://ns.adobe.com/xap/1.0/".length + 1;
        }
        static findPosition(e2, t3) {
          let i2 = super.findPosition(e2, t3);
          return i2.multiSegment = i2.extended = 79 === i2.headerLength, i2.multiSegment ? (i2.chunkCount = e2.getUint8(t3 + 72), i2.chunkNumber = e2.getUint8(t3 + 76), 0 !== e2.getUint8(t3 + 77) && i2.chunkNumber++) : (i2.chunkCount = 1 / 0, i2.chunkNumber = -1), i2;
        }
        static handleMultiSegments(e2) {
          return e2.map(((e3) => e3.chunk.getString())).join("");
        }
        normalizeInput(e2) {
          return "string" == typeof e2 ? e2 : I.from(e2).getString();
        }
        parse(e2 = this.chunk) {
          if (!this.localOptions.parse) return e2;
          e2 = (function(e3) {
            let t4 = {}, i3 = {};
            for (let e4 of Ze) t4[e4] = [], i3[e4] = 0;
            return e3.replace(et, ((e4, n3, s2) => {
              if ("<" === n3) {
                let n4 = ++i3[s2];
                return t4[s2].push(n4), `${e4}#${n4}`;
              }
              return `${e4}#${t4[s2].pop()}`;
            }));
          })(e2);
          let t3 = Xe.findAll(e2, "rdf", "Description");
          0 === t3.length && t3.push(new Xe("rdf", "Description", void 0, e2));
          let i2, n2 = {};
          for (let e3 of t3) for (let t4 of e3.properties) i2 = Je(t4.ns, n2), _e(t4, i2);
          return (function(e3) {
            let t4;
            for (let i3 in e3) t4 = e3[i3] = f(e3[i3]), void 0 === t4 && delete e3[i3];
            return f(e3);
          })(n2);
        }
        assignToOutput(e2, t3) {
          if (this.localOptions.parse) for (let [i2, n2] of Object.entries(t3)) switch (i2) {
            case "tiff":
              this.assignObjectToOutput(e2, "ifd0", n2);
              break;
            case "exif":
              this.assignObjectToOutput(e2, "exif", n2);
              break;
            case "xmlns":
              break;
            default:
              this.assignObjectToOutput(e2, i2, n2);
          }
          else e2.xmp = t3;
        }
      };
      c(We, "type", "xmp"), c(We, "multiSegment", true), T.set("xmp", We);
      Ke = class _Ke {
        static findAll(e2) {
          return qe(e2, /([a-zA-Z0-9-]+):([a-zA-Z0-9-]+)=("[^"]*"|'[^']*')/gm).map(_Ke.unpackMatch);
        }
        static unpackMatch(e2) {
          let t3 = e2[1], i2 = e2[2], n2 = e2[3].slice(1, -1);
          return n2 = Qe(n2), new _Ke(t3, i2, n2);
        }
        constructor(e2, t3, i2) {
          this.ns = e2, this.name = t3, this.value = i2;
        }
        serialize() {
          return this.value;
        }
      };
      Xe = class _Xe {
        static findAll(e2, t3, i2) {
          if (void 0 !== t3 || void 0 !== i2) {
            t3 = t3 || "[\\w\\d-]+", i2 = i2 || "[\\w\\d-]+";
            var n2 = new RegExp(`<(${t3}):(${i2})(#\\d+)?((\\s+?[\\w\\d-:]+=("[^"]*"|'[^']*'))*\\s*)(\\/>|>([\\s\\S]*?)<\\/\\1:\\2\\3>)`, "gm");
          } else n2 = /<([\w\d-]+):([\w\d-]+)(#\d+)?((\s+?[\w\d-:]+=("[^"]*"|'[^']*'))*\s*)(\/>|>([\s\S]*?)<\/\1:\2\3>)/gm;
          return qe(e2, n2).map(_Xe.unpackMatch);
        }
        static unpackMatch(e2) {
          let t3 = e2[1], i2 = e2[2], n2 = e2[4], s2 = e2[8];
          return new _Xe(t3, i2, n2, s2);
        }
        constructor(e2, t3, i2, n2) {
          this.ns = e2, this.name = t3, this.attrString = i2, this.innerXml = n2, this.attrs = Ke.findAll(i2), this.children = _Xe.findAll(n2), this.value = 0 === this.children.length ? Qe(n2) : void 0, this.properties = [...this.attrs, ...this.children];
        }
        get isPrimitive() {
          return void 0 !== this.value && 0 === this.attrs.length && 0 === this.children.length;
        }
        get isListContainer() {
          return 1 === this.children.length && this.children[0].isList;
        }
        get isList() {
          let { ns: e2, name: t3 } = this;
          return "rdf" === e2 && ("Seq" === t3 || "Bag" === t3 || "Alt" === t3);
        }
        get isListItem() {
          return "rdf" === this.ns && "li" === this.name;
        }
        serialize() {
          if (0 === this.properties.length && void 0 === this.value) return;
          if (this.isPrimitive) return this.value;
          if (this.isListContainer) return this.children[0].serialize();
          if (this.isList) return $e(this.children.map(Ye));
          if (this.isListItem && 1 === this.children.length && 0 === this.attrs.length) return this.children[0].serialize();
          let e2 = {};
          for (let t3 of this.properties) _e(t3, e2);
          return void 0 !== this.value && (e2.value = this.value), f(e2);
        }
      };
      Ye = (e2) => e2.serialize();
      $e = (e2) => 1 === e2.length ? e2[0] : e2;
      Je = (e2, t3) => t3[e2] ? t3[e2] : t3[e2] = {};
      Ze = ["rdf:li", "rdf:Seq", "rdf:Bag", "rdf:Alt", "rdf:Description"];
      et = new RegExp(`(<|\\/)(${Ze.join("|")})`, "g");
      tt = Object.freeze({ __proto__: null, default: Me, Exifr: te, fileParsers: w, segmentParsers: T, fileReaders: A, tagKeys: E, tagValues: B, tagRevivers: N, createDictionary: U, extendDictionary: F, fetchUrlAsArrayBuffer: M, readBlobAsArrayBuffer: R, chunkedProps: G, otherSegments: V, segments: z, tiffBlocks: H, segmentsAndBlocks: j, tiffExtractables: W, inheritables: K, allFormatters: X, Options: q, parse: ie, gpsOnlyOptions: me, gps: Se, thumbnailOnlyOptions: Ce, thumbnail: ye, thumbnailUrl: be, orientationOnlyOptions: Ie, orientation: Pe, rotations: ke, get rotateCanvas() {
        return we;
      }, get rotateCss() {
        return Te;
      }, rotation: Ae });
      at = l("fs", ((e2) => e2.promises));
      A.set("fs", class extends ve {
        async readWhole() {
          this.chunked = false, this.fs = await at;
          let e2 = await this.fs.readFile(this.input);
          this._swapBuffer(e2);
        }
        async readChunked() {
          this.chunked = true, this.fs = await at, await this.open(), await this.readChunk(0, this.options.firstChunkSize);
        }
        async open() {
          void 0 === this.fh && (this.fh = await this.fs.open(this.input, "r"), this.size = (await this.fh.stat(this.input)).size);
        }
        async _readChunk(e2, t3) {
          void 0 === this.fh && await this.open(), e2 + t3 > this.size && (t3 = this.size - e2);
          var i2 = this.subarray(e2, t3, true);
          return await this.fh.read(i2.dataView, 0, t3, e2), i2;
        }
        async close() {
          if (this.fh) {
            let e2 = this.fh;
            this.fh = void 0, await e2.close();
          }
        }
      });
      A.set("base64", class extends ve {
        constructor(...e2) {
          super(...e2), this.input = this.input.replace(/^data:([^;]+);base64,/gim, ""), this.size = this.input.length / 4 * 3, this.input.endsWith("==") ? this.size -= 2 : this.input.endsWith("=") && (this.size -= 1);
        }
        async _readChunk(e2, t3) {
          let i2, n2, r2 = this.input;
          void 0 === e2 ? (e2 = 0, i2 = 0, n2 = 0) : (i2 = 4 * Math.floor(e2 / 3), n2 = e2 - i2 / 4 * 3), void 0 === t3 && (t3 = this.size);
          let o2 = e2 + t3, l2 = i2 + 4 * Math.ceil(o2 / 3);
          r2 = r2.slice(i2, l2);
          let h2 = Math.min(t3, this.size - e2);
          if (a) {
            let t4 = s.from(r2, "base64").slice(n2, n2 + h2);
            return this.set(t4, e2, true);
          }
          {
            let t4 = this.subarray(e2, h2, true), i3 = atob(r2), s2 = t4.toUint8();
            for (let e3 = 0; e3 < h2; e3++) s2[e3] = i3.charCodeAt(n2 + e3);
            return t4;
          }
        }
      });
      ot = class extends se {
        static canHandle(e2, t3) {
          return 18761 === t3 || 19789 === t3;
        }
        extendOptions(e2) {
          let { ifd0: t3, xmp: i2, iptc: n2, icc: s2 } = e2;
          i2.enabled && t3.deps.add(700), n2.enabled && t3.deps.add(33723), s2.enabled && t3.deps.add(34675), t3.finalizeFilters();
        }
        async parse() {
          let { tiff: e2, xmp: t3, iptc: i2, icc: n2 } = this.options;
          if (e2.enabled || t3.enabled || i2.enabled || n2.enabled) {
            let e3 = Math.max(S(this.options), this.options.chunkSize);
            await this.file.ensureChunk(0, e3), this.createParser("tiff", this.file), this.parsers.tiff.parseHeader(), await this.parsers.tiff.parseIfd0Block(), this.adaptTiffPropAsSegment("xmp"), this.adaptTiffPropAsSegment("iptc"), this.adaptTiffPropAsSegment("icc");
          }
        }
        adaptTiffPropAsSegment(e2) {
          if (this.parsers.tiff[e2]) {
            let t3 = this.parsers.tiff[e2];
            this.injectSegment(e2, t3);
          }
        }
      };
      c(ot, "type", "tiff"), w.set("tiff", ot);
      lt = l("zlib");
      ht = ["ihdr", "iccp", "text", "itxt", "exif"];
      ut = class extends se {
        constructor(...e2) {
          super(...e2), c(this, "catchError", ((e3) => this.errors.push(e3))), c(this, "metaChunks", []), c(this, "unknownChunks", []);
        }
        static canHandle(e2, t3) {
          return 35152 === t3 && 2303741511 === e2.getUint32(0) && 218765834 === e2.getUint32(4);
        }
        async parse() {
          let { file: e2 } = this;
          await this.findPngChunksInRange("\x89PNG\r\n\n".length, e2.byteLength), await this.readSegments(this.metaChunks), this.findIhdr(), this.parseTextChunks(), await this.findExif().catch(this.catchError), await this.findXmp().catch(this.catchError), await this.findIcc().catch(this.catchError);
        }
        async findPngChunksInRange(e2, t3) {
          let { file: i2 } = this;
          for (; e2 < t3; ) {
            let t4 = i2.getUint32(e2), n2 = i2.getUint32(e2 + 4), s2 = i2.getString(e2 + 4, 4).toLowerCase(), r2 = t4 + 4 + 4 + 4, a2 = { type: s2, offset: e2, length: r2, start: e2 + 4 + 4, size: t4, marker: n2 };
            ht.includes(s2) ? this.metaChunks.push(a2) : this.unknownChunks.push(a2), e2 += r2;
          }
        }
        parseTextChunks() {
          let e2 = this.metaChunks.filter(((e3) => "text" === e3.type));
          for (let t3 of e2) {
            let [e3, i2] = this.file.getString(t3.start, t3.size).split("\0");
            this.injectKeyValToIhdr(e3, i2);
          }
        }
        injectKeyValToIhdr(e2, t3) {
          let i2 = this.parsers.ihdr;
          i2 && i2.raw.set(e2, t3);
        }
        findIhdr() {
          let e2 = this.metaChunks.find(((e3) => "ihdr" === e3.type));
          e2 && false !== this.options.ihdr.enabled && this.createParser("ihdr", e2.chunk);
        }
        async findExif() {
          let e2 = this.metaChunks.find(((e3) => "exif" === e3.type));
          e2 && this.injectSegment("tiff", e2.chunk);
        }
        async findXmp() {
          let e2 = this.metaChunks.filter(((e3) => "itxt" === e3.type));
          for (let t3 of e2) {
            "XML:com.adobe.xmp" === t3.chunk.getString(0, "XML:com.adobe.xmp".length) && this.injectSegment("xmp", t3.chunk);
          }
        }
        async findIcc() {
          let e2 = this.metaChunks.find(((e3) => "iccp" === e3.type));
          if (!e2) return;
          let { chunk: t3 } = e2, i2 = t3.getUint8Array(0, 81), s2 = 0;
          for (; s2 < 80 && 0 !== i2[s2]; ) s2++;
          let r2 = s2 + 2, a2 = t3.getString(0, s2);
          if (this.injectKeyValToIhdr("ProfileName", a2), n) {
            let e3 = await lt, i3 = t3.getUint8Array(r2);
            i3 = e3.inflateSync(i3), this.injectSegment("icc", i3);
          }
        }
      };
      c(ut, "type", "png"), w.set("png", ut), U(E, "interop", [[1, "InteropIndex"], [2, "InteropVersion"], [4096, "RelatedImageFileFormat"], [4097, "RelatedImageWidth"], [4098, "RelatedImageHeight"]]), F(E, "ifd0", [[11, "ProcessingSoftware"], [254, "SubfileType"], [255, "OldSubfileType"], [263, "Thresholding"], [264, "CellWidth"], [265, "CellLength"], [266, "FillOrder"], [269, "DocumentName"], [280, "MinSampleValue"], [281, "MaxSampleValue"], [285, "PageName"], [286, "XPosition"], [287, "YPosition"], [290, "GrayResponseUnit"], [297, "PageNumber"], [321, "HalftoneHints"], [322, "TileWidth"], [323, "TileLength"], [332, "InkSet"], [337, "TargetPrinter"], [18246, "Rating"], [18249, "RatingPercent"], [33550, "PixelScale"], [34264, "ModelTransform"], [34377, "PhotoshopSettings"], [50706, "DNGVersion"], [50707, "DNGBackwardVersion"], [50708, "UniqueCameraModel"], [50709, "LocalizedCameraModel"], [50736, "DNGLensInfo"], [50739, "ShadowScale"], [50740, "DNGPrivateData"], [33920, "IntergraphMatrix"], [33922, "ModelTiePoint"], [34118, "SEMInfo"], [34735, "GeoTiffDirectory"], [34736, "GeoTiffDoubleParams"], [34737, "GeoTiffAsciiParams"], [50341, "PrintIM"], [50721, "ColorMatrix1"], [50722, "ColorMatrix2"], [50723, "CameraCalibration1"], [50724, "CameraCalibration2"], [50725, "ReductionMatrix1"], [50726, "ReductionMatrix2"], [50727, "AnalogBalance"], [50728, "AsShotNeutral"], [50729, "AsShotWhiteXY"], [50730, "BaselineExposure"], [50731, "BaselineNoise"], [50732, "BaselineSharpness"], [50734, "LinearResponseLimit"], [50735, "CameraSerialNumber"], [50741, "MakerNoteSafety"], [50778, "CalibrationIlluminant1"], [50779, "CalibrationIlluminant2"], [50781, "RawDataUniqueID"], [50827, "OriginalRawFileName"], [50828, "OriginalRawFileData"], [50831, "AsShotICCProfile"], [50832, "AsShotPreProfileMatrix"], [50833, "CurrentICCProfile"], [50834, "CurrentPreProfileMatrix"], [50879, "ColorimetricReference"], [50885, "SRawType"], [50898, "PanasonicTitle"], [50899, "PanasonicTitle2"], [50931, "CameraCalibrationSig"], [50932, "ProfileCalibrationSig"], [50933, "ProfileIFD"], [50934, "AsShotProfileName"], [50936, "ProfileName"], [50937, "ProfileHueSatMapDims"], [50938, "ProfileHueSatMapData1"], [50939, "ProfileHueSatMapData2"], [50940, "ProfileToneCurve"], [50941, "ProfileEmbedPolicy"], [50942, "ProfileCopyright"], [50964, "ForwardMatrix1"], [50965, "ForwardMatrix2"], [50966, "PreviewApplicationName"], [50967, "PreviewApplicationVersion"], [50968, "PreviewSettingsName"], [50969, "PreviewSettingsDigest"], [50970, "PreviewColorSpace"], [50971, "PreviewDateTime"], [50972, "RawImageDigest"], [50973, "OriginalRawFileDigest"], [50981, "ProfileLookTableDims"], [50982, "ProfileLookTableData"], [51043, "TimeCodes"], [51044, "FrameRate"], [51058, "TStop"], [51081, "ReelName"], [51089, "OriginalDefaultFinalSize"], [51090, "OriginalBestQualitySize"], [51091, "OriginalDefaultCropSize"], [51105, "CameraLabel"], [51107, "ProfileHueSatMapEncoding"], [51108, "ProfileLookTableEncoding"], [51109, "BaselineExposureOffset"], [51110, "DefaultBlackRender"], [51111, "NewRawImageDigest"], [51112, "RawToPreviewGain"]]);
      ct = [[273, "StripOffsets"], [279, "StripByteCounts"], [288, "FreeOffsets"], [289, "FreeByteCounts"], [291, "GrayResponseCurve"], [292, "T4Options"], [293, "T6Options"], [300, "ColorResponseUnit"], [320, "ColorMap"], [324, "TileOffsets"], [325, "TileByteCounts"], [326, "BadFaxLines"], [327, "CleanFaxData"], [328, "ConsecutiveBadFaxLines"], [330, "SubIFD"], [333, "InkNames"], [334, "NumberofInks"], [336, "DotRange"], [338, "ExtraSamples"], [339, "SampleFormat"], [340, "SMinSampleValue"], [341, "SMaxSampleValue"], [342, "TransferRange"], [343, "ClipPath"], [344, "XClipPathUnits"], [345, "YClipPathUnits"], [346, "Indexed"], [347, "JPEGTables"], [351, "OPIProxy"], [400, "GlobalParametersIFD"], [401, "ProfileType"], [402, "FaxProfile"], [403, "CodingMethods"], [404, "VersionYear"], [405, "ModeNumber"], [433, "Decode"], [434, "DefaultImageColor"], [435, "T82Options"], [437, "JPEGTables"], [512, "JPEGProc"], [515, "JPEGRestartInterval"], [517, "JPEGLosslessPredictors"], [518, "JPEGPointTransforms"], [519, "JPEGQTables"], [520, "JPEGDCTables"], [521, "JPEGACTables"], [559, "StripRowCounts"], [999, "USPTOMiscellaneous"], [18247, "XP_DIP_XML"], [18248, "StitchInfo"], [28672, "SonyRawFileType"], [28688, "SonyToneCurve"], [28721, "VignettingCorrection"], [28722, "VignettingCorrParams"], [28724, "ChromaticAberrationCorrection"], [28725, "ChromaticAberrationCorrParams"], [28726, "DistortionCorrection"], [28727, "DistortionCorrParams"], [29895, "SonyCropTopLeft"], [29896, "SonyCropSize"], [32781, "ImageID"], [32931, "WangTag1"], [32932, "WangAnnotation"], [32933, "WangTag3"], [32934, "WangTag4"], [32953, "ImageReferencePoints"], [32954, "RegionXformTackPoint"], [32955, "WarpQuadrilateral"], [32956, "AffineTransformMat"], [32995, "Matteing"], [32996, "DataType"], [32997, "ImageDepth"], [32998, "TileDepth"], [33300, "ImageFullWidth"], [33301, "ImageFullHeight"], [33302, "TextureFormat"], [33303, "WrapModes"], [33304, "FovCot"], [33305, "MatrixWorldToScreen"], [33306, "MatrixWorldToCamera"], [33405, "Model2"], [33421, "CFARepeatPatternDim"], [33422, "CFAPattern2"], [33423, "BatteryLevel"], [33424, "KodakIFD"], [33445, "MDFileTag"], [33446, "MDScalePixel"], [33447, "MDColorTable"], [33448, "MDLabName"], [33449, "MDSampleInfo"], [33450, "MDPrepDate"], [33451, "MDPrepTime"], [33452, "MDFileUnits"], [33589, "AdventScale"], [33590, "AdventRevision"], [33628, "UIC1Tag"], [33629, "UIC2Tag"], [33630, "UIC3Tag"], [33631, "UIC4Tag"], [33918, "IntergraphPacketData"], [33919, "IntergraphFlagRegisters"], [33921, "INGRReserved"], [34016, "Site"], [34017, "ColorSequence"], [34018, "IT8Header"], [34019, "RasterPadding"], [34020, "BitsPerRunLength"], [34021, "BitsPerExtendedRunLength"], [34022, "ColorTable"], [34023, "ImageColorIndicator"], [34024, "BackgroundColorIndicator"], [34025, "ImageColorValue"], [34026, "BackgroundColorValue"], [34027, "PixelIntensityRange"], [34028, "TransparencyIndicator"], [34029, "ColorCharacterization"], [34030, "HCUsage"], [34031, "TrapIndicator"], [34032, "CMYKEquivalent"], [34152, "AFCP_IPTC"], [34232, "PixelMagicJBIGOptions"], [34263, "JPLCartoIFD"], [34306, "WB_GRGBLevels"], [34310, "LeafData"], [34687, "TIFF_FXExtensions"], [34688, "MultiProfiles"], [34689, "SharedData"], [34690, "T88Options"], [34732, "ImageLayer"], [34750, "JBIGOptions"], [34856, "Opto-ElectricConvFactor"], [34857, "Interlace"], [34908, "FaxRecvParams"], [34909, "FaxSubAddress"], [34910, "FaxRecvTime"], [34929, "FedexEDR"], [34954, "LeafSubIFD"], [37387, "FlashEnergy"], [37388, "SpatialFrequencyResponse"], [37389, "Noise"], [37390, "FocalPlaneXResolution"], [37391, "FocalPlaneYResolution"], [37392, "FocalPlaneResolutionUnit"], [37397, "ExposureIndex"], [37398, "TIFF-EPStandardID"], [37399, "SensingMethod"], [37434, "CIP3DataFile"], [37435, "CIP3Sheet"], [37436, "CIP3Side"], [37439, "StoNits"], [37679, "MSDocumentText"], [37680, "MSPropertySetStorage"], [37681, "MSDocumentTextPosition"], [37724, "ImageSourceData"], [40965, "InteropIFD"], [40976, "SamsungRawPointersOffset"], [40977, "SamsungRawPointersLength"], [41217, "SamsungRawByteOrder"], [41218, "SamsungRawUnknown"], [41484, "SpatialFrequencyResponse"], [41485, "Noise"], [41489, "ImageNumber"], [41490, "SecurityClassification"], [41491, "ImageHistory"], [41494, "TIFF-EPStandardID"], [41995, "DeviceSettingDescription"], [42112, "GDALMetadata"], [42113, "GDALNoData"], [44992, "ExpandSoftware"], [44993, "ExpandLens"], [44994, "ExpandFilm"], [44995, "ExpandFilterLens"], [44996, "ExpandScanner"], [44997, "ExpandFlashLamp"], [46275, "HasselbladRawImage"], [48129, "PixelFormat"], [48130, "Transformation"], [48131, "Uncompressed"], [48132, "ImageType"], [48256, "ImageWidth"], [48257, "ImageHeight"], [48258, "WidthResolution"], [48259, "HeightResolution"], [48320, "ImageOffset"], [48321, "ImageByteCount"], [48322, "AlphaOffset"], [48323, "AlphaByteCount"], [48324, "ImageDataDiscard"], [48325, "AlphaDataDiscard"], [50215, "OceScanjobDesc"], [50216, "OceApplicationSelector"], [50217, "OceIDNumber"], [50218, "OceImageLogic"], [50255, "Annotations"], [50459, "HasselbladExif"], [50547, "OriginalFileName"], [50560, "USPTOOriginalContentType"], [50656, "CR2CFAPattern"], [50710, "CFAPlaneColor"], [50711, "CFALayout"], [50712, "LinearizationTable"], [50713, "BlackLevelRepeatDim"], [50714, "BlackLevel"], [50715, "BlackLevelDeltaH"], [50716, "BlackLevelDeltaV"], [50717, "WhiteLevel"], [50718, "DefaultScale"], [50719, "DefaultCropOrigin"], [50720, "DefaultCropSize"], [50733, "BayerGreenSplit"], [50737, "ChromaBlurRadius"], [50738, "AntiAliasStrength"], [50752, "RawImageSegmentation"], [50780, "BestQualityScale"], [50784, "AliasLayerMetadata"], [50829, "ActiveArea"], [50830, "MaskedAreas"], [50935, "NoiseReductionApplied"], [50974, "SubTileBlockSize"], [50975, "RowInterleaveFactor"], [51008, "OpcodeList1"], [51009, "OpcodeList2"], [51022, "OpcodeList3"], [51041, "NoiseProfile"], [51114, "CacheVersion"], [51125, "DefaultUserCrop"], [51157, "NikonNEFInfo"], [65024, "KdcIFD"]];
      F(E, "ifd0", ct), F(E, "exif", ct), U(B, "gps", [[23, { M: "Magnetic North", T: "True North" }], [25, { K: "Kilometers", M: "Miles", N: "Nautical Miles" }]]);
      ft = class extends re {
        static canHandle(e2, t3) {
          return 224 === e2.getUint8(t3 + 1) && 1246120262 === e2.getUint32(t3 + 4) && 0 === e2.getUint8(t3 + 8);
        }
        parse() {
          return this.parseTags(), this.translate(), this.output;
        }
        parseTags() {
          this.raw = /* @__PURE__ */ new Map([[0, this.chunk.getUint16(0)], [2, this.chunk.getUint8(2)], [3, this.chunk.getUint16(3)], [5, this.chunk.getUint16(5)], [7, this.chunk.getUint8(7)], [8, this.chunk.getUint8(8)]]);
        }
      };
      c(ft, "type", "jfif"), c(ft, "headerLength", 9), T.set("jfif", ft), U(E, "jfif", [[0, "JFIFVersion"], [2, "ResolutionUnit"], [3, "XResolution"], [5, "YResolution"], [7, "ThumbnailWidth"], [8, "ThumbnailHeight"]]);
      dt = class extends re {
        parse() {
          return this.parseTags(), this.translate(), this.output;
        }
        parseTags() {
          this.raw = new Map([[0, this.chunk.getUint32(0)], [4, this.chunk.getUint32(4)], [8, this.chunk.getUint8(8)], [9, this.chunk.getUint8(9)], [10, this.chunk.getUint8(10)], [11, this.chunk.getUint8(11)], [12, this.chunk.getUint8(12)], ...Array.from(this.raw)]);
        }
      };
      c(dt, "type", "ihdr"), T.set("ihdr", dt), U(E, "ihdr", [[0, "ImageWidth"], [4, "ImageHeight"], [8, "BitDepth"], [9, "ColorType"], [10, "Compression"], [11, "Filter"], [12, "Interlace"]]), U(B, "ihdr", [[9, { 0: "Grayscale", 2: "RGB", 3: "Palette", 4: "Grayscale with Alpha", 6: "RGB with Alpha", DEFAULT: "Unknown" }], [10, { 0: "Deflate/Inflate", DEFAULT: "Unknown" }], [11, { 0: "Adaptive", DEFAULT: "Unknown" }], [12, { 0: "Noninterlaced", 1: "Adam7 Interlace", DEFAULT: "Unknown" }]]);
      pt = class extends re {
        static canHandle(e2, t3) {
          return 226 === e2.getUint8(t3 + 1) && 1229144927 === e2.getUint32(t3 + 4);
        }
        static findPosition(e2, t3) {
          let i2 = super.findPosition(e2, t3);
          return i2.chunkNumber = e2.getUint8(t3 + 16), i2.chunkCount = e2.getUint8(t3 + 17), i2.multiSegment = i2.chunkCount > 1, i2;
        }
        static handleMultiSegments(e2) {
          return (function(e3) {
            let t3 = (function(e4) {
              let t4 = e4[0].constructor, i2 = 0;
              for (let t5 of e4) i2 += t5.length;
              let n2 = new t4(i2), s2 = 0;
              for (let t5 of e4) n2.set(t5, s2), s2 += t5.length;
              return n2;
            })(e3.map(((e4) => e4.chunk.toUint8())));
            return new I(t3);
          })(e2);
        }
        parse() {
          return this.raw = /* @__PURE__ */ new Map(), this.parseHeader(), this.parseTags(), this.translate(), this.output;
        }
        parseHeader() {
          let { raw: e2 } = this;
          this.chunk.byteLength < 84 && g("ICC header is too short");
          for (let [t3, i2] of Object.entries(gt)) {
            t3 = parseInt(t3, 10);
            let n2 = i2(this.chunk, t3);
            "\0\0\0\0" !== n2 && e2.set(t3, n2);
          }
        }
        parseTags() {
          let e2, t3, i2, n2, s2, { raw: r2 } = this, a2 = this.chunk.getUint32(128), o2 = 132, l2 = this.chunk.byteLength;
          for (; a2--; ) {
            if (e2 = this.chunk.getString(o2, 4), t3 = this.chunk.getUint32(o2 + 4), i2 = this.chunk.getUint32(o2 + 8), n2 = this.chunk.getString(t3, 4), t3 + i2 > l2) return void console.warn("reached the end of the first ICC chunk. Enable options.tiff.multiSegment to read all ICC segments.");
            s2 = this.parseTag(n2, t3, i2), void 0 !== s2 && "\0\0\0\0" !== s2 && r2.set(e2, s2), o2 += 12;
          }
        }
        parseTag(e2, t3, i2) {
          switch (e2) {
            case "desc":
              return this.parseDesc(t3);
            case "mluc":
              return this.parseMluc(t3);
            case "text":
              return this.parseText(t3, i2);
            case "sig ":
              return this.parseSig(t3);
          }
          if (!(t3 + i2 > this.chunk.byteLength)) return this.chunk.getUint8Array(t3, i2);
        }
        parseDesc(e2) {
          let t3 = this.chunk.getUint32(e2 + 8) - 1;
          return m(this.chunk.getString(e2 + 12, t3));
        }
        parseText(e2, t3) {
          return m(this.chunk.getString(e2 + 8, t3 - 8));
        }
        parseSig(e2) {
          return m(this.chunk.getString(e2 + 8, 4));
        }
        parseMluc(e2) {
          let { chunk: t3 } = this, i2 = t3.getUint32(e2 + 8), n2 = t3.getUint32(e2 + 12), s2 = e2 + 16, r2 = [];
          for (let a2 = 0; a2 < i2; a2++) {
            let i3 = t3.getString(s2 + 0, 2), a3 = t3.getString(s2 + 2, 2), o2 = t3.getUint32(s2 + 4), l2 = t3.getUint32(s2 + 8) + e2, h2 = m(t3.getUnicodeString(l2, o2));
            r2.push({ lang: i3, country: a3, text: h2 }), s2 += n2;
          }
          return 1 === i2 ? r2[0].text : r2;
        }
        translateValue(e2, t3) {
          return "string" == typeof e2 ? t3[e2] || t3[e2.toLowerCase()] || e2 : t3[e2] || e2;
        }
      };
      c(pt, "type", "icc"), c(pt, "multiSegment", true), c(pt, "headerLength", 18);
      gt = { 4: mt, 8: function(e2, t3) {
        return [e2.getUint8(t3), e2.getUint8(t3 + 1) >> 4, e2.getUint8(t3 + 1) % 16].map(((e3) => e3.toString(10))).join(".");
      }, 12: mt, 16: mt, 20: mt, 24: function(e2, t3) {
        const i2 = e2.getUint16(t3), n2 = e2.getUint16(t3 + 2) - 1, s2 = e2.getUint16(t3 + 4), r2 = e2.getUint16(t3 + 6), a2 = e2.getUint16(t3 + 8), o2 = e2.getUint16(t3 + 10);
        return new Date(Date.UTC(i2, n2, s2, r2, a2, o2));
      }, 36: mt, 40: mt, 48: mt, 52: mt, 64: (e2, t3) => e2.getUint32(t3), 80: mt };
      T.set("icc", pt), U(E, "icc", [[4, "ProfileCMMType"], [8, "ProfileVersion"], [12, "ProfileClass"], [16, "ColorSpaceData"], [20, "ProfileConnectionSpace"], [24, "ProfileDateTime"], [36, "ProfileFileSignature"], [40, "PrimaryPlatform"], [44, "CMMFlags"], [48, "DeviceManufacturer"], [52, "DeviceModel"], [56, "DeviceAttributes"], [64, "RenderingIntent"], [68, "ConnectionSpaceIlluminant"], [80, "ProfileCreator"], [84, "ProfileID"], ["Header", "ProfileHeader"], ["MS00", "WCSProfiles"], ["bTRC", "BlueTRC"], ["bXYZ", "BlueMatrixColumn"], ["bfd", "UCRBG"], ["bkpt", "MediaBlackPoint"], ["calt", "CalibrationDateTime"], ["chad", "ChromaticAdaptation"], ["chrm", "Chromaticity"], ["ciis", "ColorimetricIntentImageState"], ["clot", "ColorantTableOut"], ["clro", "ColorantOrder"], ["clrt", "ColorantTable"], ["cprt", "ProfileCopyright"], ["crdi", "CRDInfo"], ["desc", "ProfileDescription"], ["devs", "DeviceSettings"], ["dmdd", "DeviceModelDesc"], ["dmnd", "DeviceMfgDesc"], ["dscm", "ProfileDescriptionML"], ["fpce", "FocalPlaneColorimetryEstimates"], ["gTRC", "GreenTRC"], ["gXYZ", "GreenMatrixColumn"], ["gamt", "Gamut"], ["kTRC", "GrayTRC"], ["lumi", "Luminance"], ["meas", "Measurement"], ["meta", "Metadata"], ["mmod", "MakeAndModel"], ["ncl2", "NamedColor2"], ["ncol", "NamedColor"], ["ndin", "NativeDisplayInfo"], ["pre0", "Preview0"], ["pre1", "Preview1"], ["pre2", "Preview2"], ["ps2i", "PS2RenderingIntent"], ["ps2s", "PostScript2CSA"], ["psd0", "PostScript2CRD0"], ["psd1", "PostScript2CRD1"], ["psd2", "PostScript2CRD2"], ["psd3", "PostScript2CRD3"], ["pseq", "ProfileSequenceDesc"], ["psid", "ProfileSequenceIdentifier"], ["psvm", "PS2CRDVMSize"], ["rTRC", "RedTRC"], ["rXYZ", "RedMatrixColumn"], ["resp", "OutputResponse"], ["rhoc", "ReflectionHardcopyOrigColorimetry"], ["rig0", "PerceptualRenderingIntentGamut"], ["rig2", "SaturationRenderingIntentGamut"], ["rpoc", "ReflectionPrintOutputColorimetry"], ["sape", "SceneAppearanceEstimates"], ["scoe", "SceneColorimetryEstimates"], ["scrd", "ScreeningDesc"], ["scrn", "Screening"], ["targ", "CharTarget"], ["tech", "Technology"], ["vcgt", "VideoCardGamma"], ["view", "ViewingConditions"], ["vued", "ViewingCondDesc"], ["wtpt", "MediaWhitePoint"]]);
      St = { "4d2p": "Erdt Systems", AAMA: "Aamazing Technologies", ACER: "Acer", ACLT: "Acolyte Color Research", ACTI: "Actix Sytems", ADAR: "Adara Technology", ADBE: "Adobe", ADI: "ADI Systems", AGFA: "Agfa Graphics", ALMD: "Alps Electric", ALPS: "Alps Electric", ALWN: "Alwan Color Expertise", AMTI: "Amiable Technologies", AOC: "AOC International", APAG: "Apago", APPL: "Apple Computer", AST: "AST", "AT&T": "AT&T", BAEL: "BARBIERI electronic", BRCO: "Barco NV", BRKP: "Breakpoint", BROT: "Brother", BULL: "Bull", BUS: "Bus Computer Systems", "C-IT": "C-Itoh", CAMR: "Intel", CANO: "Canon", CARR: "Carroll Touch", CASI: "Casio", CBUS: "Colorbus PL", CEL: "Crossfield", CELx: "Crossfield", CGS: "CGS Publishing Technologies International", CHM: "Rochester Robotics", CIGL: "Colour Imaging Group, London", CITI: "Citizen", CL00: "Candela", CLIQ: "Color IQ", CMCO: "Chromaco", CMiX: "CHROMiX", COLO: "Colorgraphic Communications", COMP: "Compaq", COMp: "Compeq/Focus Technology", CONR: "Conrac Display Products", CORD: "Cordata Technologies", CPQ: "Compaq", CPRO: "ColorPro", CRN: "Cornerstone", CTX: "CTX International", CVIS: "ColorVision", CWC: "Fujitsu Laboratories", DARI: "Darius Technology", DATA: "Dataproducts", DCP: "Dry Creek Photo", DCRC: "Digital Contents Resource Center, Chung-Ang University", DELL: "Dell Computer", DIC: "Dainippon Ink and Chemicals", DICO: "Diconix", DIGI: "Digital", "DL&C": "Digital Light & Color", DPLG: "Doppelganger", DS: "Dainippon Screen", DSOL: "DOOSOL", DUPN: "DuPont", EPSO: "Epson", ESKO: "Esko-Graphics", ETRI: "Electronics and Telecommunications Research Institute", EVER: "Everex Systems", EXAC: "ExactCODE", Eizo: "Eizo", FALC: "Falco Data Products", FF: "Fuji Photo Film", FFEI: "FujiFilm Electronic Imaging", FNRD: "Fnord Software", FORA: "Fora", FORE: "Forefront Technology", FP: "Fujitsu", FPA: "WayTech Development", FUJI: "Fujitsu", FX: "Fuji Xerox", GCC: "GCC Technologies", GGSL: "Global Graphics Software", GMB: "Gretagmacbeth", GMG: "GMG", GOLD: "GoldStar Technology", GOOG: "Google", GPRT: "Giantprint", GTMB: "Gretagmacbeth", GVC: "WayTech Development", GW2K: "Sony", HCI: "HCI", HDM: "Heidelberger Druckmaschinen", HERM: "Hermes", HITA: "Hitachi America", HP: "Hewlett-Packard", HTC: "Hitachi", HiTi: "HiTi Digital", IBM: "IBM", IDNT: "Scitex", IEC: "Hewlett-Packard", IIYA: "Iiyama North America", IKEG: "Ikegami Electronics", IMAG: "Image Systems", IMI: "Ingram Micro", INTC: "Intel", INTL: "N/A (INTL)", INTR: "Intra Electronics", IOCO: "Iocomm International Technology", IPS: "InfoPrint Solutions Company", IRIS: "Scitex", ISL: "Ichikawa Soft Laboratory", ITNL: "N/A (ITNL)", IVM: "IVM", IWAT: "Iwatsu Electric", Idnt: "Scitex", Inca: "Inca Digital Printers", Iris: "Scitex", JPEG: "Joint Photographic Experts Group", JSFT: "Jetsoft Development", JVC: "JVC Information Products", KART: "Scitex", KFC: "KFC Computek Components", KLH: "KLH Computers", KMHD: "Konica Minolta", KNCA: "Konica", KODA: "Kodak", KYOC: "Kyocera", Kart: "Scitex", LCAG: "Leica", LCCD: "Leeds Colour", LDAK: "Left Dakota", LEAD: "Leading Technology", LEXM: "Lexmark International", LINK: "Link Computer", LINO: "Linotronic", LITE: "Lite-On", Leaf: "Leaf", Lino: "Linotronic", MAGC: "Mag Computronic", MAGI: "MAG Innovision", MANN: "Mannesmann", MICN: "Micron Technology", MICR: "Microtek", MICV: "Microvitec", MINO: "Minolta", MITS: "Mitsubishi Electronics America", MITs: "Mitsuba", MNLT: "Minolta", MODG: "Modgraph", MONI: "Monitronix", MONS: "Monaco Systems", MORS: "Morse Technology", MOTI: "Motive Systems", MSFT: "Microsoft", MUTO: "MUTOH INDUSTRIES", Mits: "Mitsubishi Electric", NANA: "NANAO", NEC: "NEC", NEXP: "NexPress Solutions", NISS: "Nissei Sangyo America", NKON: "Nikon", NONE: "none", OCE: "Oce Technologies", OCEC: "OceColor", OKI: "Oki", OKID: "Okidata", OKIP: "Okidata", OLIV: "Olivetti", OLYM: "Olympus", ONYX: "Onyx Graphics", OPTI: "Optiquest", PACK: "Packard Bell", PANA: "Matsushita Electric Industrial", PANT: "Pantone", PBN: "Packard Bell", PFU: "PFU", PHIL: "Philips Consumer Electronics", PNTX: "HOYA", POne: "Phase One A/S", PREM: "Premier Computer Innovations", PRIN: "Princeton Graphic Systems", PRIP: "Princeton Publishing Labs", QLUX: "Hong Kong", QMS: "QMS", QPCD: "QPcard AB", QUAD: "QuadLaser", QUME: "Qume", RADI: "Radius", RDDx: "Integrated Color Solutions", RDG: "Roland DG", REDM: "REDMS Group", RELI: "Relisys", RGMS: "Rolf Gierling Multitools", RICO: "Ricoh", RNLD: "Edmund Ronald", ROYA: "Royal", RPC: "Ricoh Printing Systems", RTL: "Royal Information Electronics", SAMP: "Sampo", SAMS: "Samsung", SANT: "Jaime Santana Pomares", SCIT: "Scitex", SCRN: "Dainippon Screen", SDP: "Scitex", SEC: "Samsung", SEIK: "Seiko Instruments", SEIk: "Seikosha", SGUY: "ScanGuy.com", SHAR: "Sharp Laboratories", SICC: "International Color Consortium", SONY: "Sony", SPCL: "SpectraCal", STAR: "Star", STC: "Sampo Technology", Scit: "Scitex", Sdp: "Scitex", Sony: "Sony", TALO: "Talon Technology", TAND: "Tandy", TATU: "Tatung", TAXA: "TAXAN America", TDS: "Tokyo Denshi Sekei", TECO: "TECO Information Systems", TEGR: "Tegra", TEKT: "Tektronix", TI: "Texas Instruments", TMKR: "TypeMaker", TOSB: "Toshiba", TOSH: "Toshiba", TOTK: "TOTOKU ELECTRIC", TRIU: "Triumph", TSBT: "Toshiba", TTX: "TTX Computer Products", TVM: "TVM Professional Monitor", TW: "TW Casper", ULSX: "Ulead Systems", UNIS: "Unisys", UTZF: "Utz Fehlau & Sohn", VARI: "Varityper", VIEW: "Viewsonic", VISL: "Visual communication", VIVO: "Vivo Mobile Communication", WANG: "Wang", WLBR: "Wilbur Imaging", WTG2: "Ware To Go", WYSE: "WYSE Technology", XERX: "Xerox", XRIT: "X-Rite", ZRAN: "Zoran", Zebr: "Zebra Technologies", appl: "Apple Computer", bICC: "basICColor", berg: "bergdesign", ceyd: "Integrated Color Solutions", clsp: "MacDermid ColorSpan", ds: "Dainippon Screen", dupn: "DuPont", ffei: "FujiFilm Electronic Imaging", flux: "FluxData", iris: "Scitex", kart: "Scitex", lcms: "Little CMS", lino: "Linotronic", none: "none", ob4d: "Erdt Systems", obic: "Medigraph", quby: "Qubyx Sarl", scit: "Scitex", scrn: "Dainippon Screen", sdp: "Scitex", siwi: "SIWI GRAFIKA", yxym: "YxyMaster" };
      Ct = { scnr: "Scanner", mntr: "Monitor", prtr: "Printer", link: "Device Link", abst: "Abstract", spac: "Color Space Conversion Profile", nmcl: "Named Color", cenc: "ColorEncodingSpace profile", mid: "MultiplexIdentification profile", mlnk: "MultiplexLink profile", mvis: "MultiplexVisualization profile", nkpf: "Nikon Input Device Profile (NON-STANDARD!)" };
      U(B, "icc", [[4, St], [12, Ct], [40, Object.assign({}, St, Ct)], [48, St], [80, St], [64, { 0: "Perceptual", 1: "Relative Colorimetric", 2: "Saturation", 3: "Absolute Colorimetric" }], ["tech", { amd: "Active Matrix Display", crt: "Cathode Ray Tube Display", kpcd: "Photo CD", pmd: "Passive Matrix Display", dcam: "Digital Camera", dcpj: "Digital Cinema Projector", dmpc: "Digital Motion Picture Camera", dsub: "Dye Sublimation Printer", epho: "Electrophotographic Printer", esta: "Electrostatic Printer", flex: "Flexography", fprn: "Film Writer", fscn: "Film Scanner", grav: "Gravure", ijet: "Ink Jet Printer", imgs: "Photo Image Setter", mpfr: "Motion Picture Film Recorder", mpfs: "Motion Picture Film Scanner", offs: "Offset Lithography", pjtv: "Projection Television", rpho: "Photographic Paper Printer", rscn: "Reflective Scanner", silk: "Silkscreen", twax: "Thermal Wax Printer", vidc: "Video Camera", vidm: "Video Monitor" }]]);
      yt = class extends re {
        static canHandle(e2, t3, i2) {
          return 237 === e2.getUint8(t3 + 1) && "Photoshop" === e2.getString(t3 + 4, 9) && void 0 !== this.containsIptc8bim(e2, t3, i2);
        }
        static headerLength(e2, t3, i2) {
          let n2, s2 = this.containsIptc8bim(e2, t3, i2);
          if (void 0 !== s2) return n2 = e2.getUint8(t3 + s2 + 7), n2 % 2 != 0 && (n2 += 1), 0 === n2 && (n2 = 4), s2 + 8 + n2;
        }
        static containsIptc8bim(e2, t3, i2) {
          for (let n2 = 0; n2 < i2; n2++) if (this.isIptcSegmentHead(e2, t3 + n2)) return n2;
        }
        static isIptcSegmentHead(e2, t3) {
          return 56 === e2.getUint8(t3) && 943868237 === e2.getUint32(t3) && 1028 === e2.getUint16(t3 + 4);
        }
        parse() {
          let { raw: e2 } = this, t3 = this.chunk.byteLength - 1, i2 = false;
          for (let n2 = 0; n2 < t3; n2++) if (28 === this.chunk.getUint8(n2) && 2 === this.chunk.getUint8(n2 + 1)) {
            i2 = true;
            let t4 = this.chunk.getUint16(n2 + 3), s2 = this.chunk.getUint8(n2 + 2), r2 = this.chunk.getLatin1String(n2 + 5, t4);
            e2.set(s2, this.pluralizeValue(e2.get(s2), r2)), n2 += 4 + t4;
          } else if (i2) break;
          return this.translate(), this.output;
        }
        pluralizeValue(e2, t3) {
          return void 0 !== e2 ? e2 instanceof Array ? (e2.push(t3), e2) : [e2, t3] : t3;
        }
      };
      c(yt, "type", "iptc"), c(yt, "translateValues", false), c(yt, "reviveValues", false), T.set("iptc", yt), U(E, "iptc", [[0, "ApplicationRecordVersion"], [3, "ObjectTypeReference"], [4, "ObjectAttributeReference"], [5, "ObjectName"], [7, "EditStatus"], [8, "EditorialUpdate"], [10, "Urgency"], [12, "SubjectReference"], [15, "Category"], [20, "SupplementalCategories"], [22, "FixtureIdentifier"], [25, "Keywords"], [26, "ContentLocationCode"], [27, "ContentLocationName"], [30, "ReleaseDate"], [35, "ReleaseTime"], [37, "ExpirationDate"], [38, "ExpirationTime"], [40, "SpecialInstructions"], [42, "ActionAdvised"], [45, "ReferenceService"], [47, "ReferenceDate"], [50, "ReferenceNumber"], [55, "DateCreated"], [60, "TimeCreated"], [62, "DigitalCreationDate"], [63, "DigitalCreationTime"], [65, "OriginatingProgram"], [70, "ProgramVersion"], [75, "ObjectCycle"], [80, "Byline"], [85, "BylineTitle"], [90, "City"], [92, "Sublocation"], [95, "State"], [100, "CountryCode"], [101, "Country"], [103, "OriginalTransmissionReference"], [105, "Headline"], [110, "Credit"], [115, "Source"], [116, "CopyrightNotice"], [118, "Contact"], [120, "Caption"], [121, "LocalCaption"], [122, "Writer"], [125, "RasterizedCaption"], [130, "ImageType"], [131, "ImageOrientation"], [135, "LanguageIdentifier"], [150, "AudioType"], [151, "AudioSamplingRate"], [152, "AudioSamplingResolution"], [153, "AudioDuration"], [154, "AudioOutcue"], [184, "JobID"], [185, "MasterDocumentID"], [186, "ShortDocumentID"], [187, "UniqueDocumentID"], [188, "OwnerID"], [200, "ObjectPreviewFileFormat"], [201, "ObjectPreviewFileVersion"], [202, "ObjectPreviewData"], [221, "Prefs"], [225, "ClassifyState"], [228, "SimilarityIndex"], [230, "DocumentNotes"], [231, "DocumentHistory"], [232, "ExifCameraInfo"], [255, "CatalogSets"]]), U(B, "iptc", [[10, { 0: "0 (reserved)", 1: "1 (most urgent)", 2: "2", 3: "3", 4: "4", 5: "5 (normal urgency)", 6: "6", 7: "7", 8: "8 (least urgent)", 9: "9 (user-defined priority)" }], [75, { a: "Morning", b: "Both Morning and Evening", p: "Evening" }], [131, { L: "Landscape", P: "Portrait", S: "Square" }]]);
      full_esm_default = tt;
    }
  });

  // src/metadata.js
  async function parseMetadata(uint8) {
    try {
      const parsed = await full_esm_default.parse(uint8, {
        tiff: true,
        exif: true,
        gps: true,
        ifd0: true,
        ifd1: false,
        xmp: true,
        iptc: true,
        icc: true,
        jfif: false,
        mergeOutput: true,
        reviveValues: true,
        translateKeys: true,
        translateValues: true
      });
      return parsed || {};
    } catch (err) {
      return { _error: err?.message || String(err) };
    }
  }
  function sniffJumbf(uint8) {
    const out = { present: false, digitalSourceType: null, labels: [], indices: [] };
    for (let i2 = 4; i2 < uint8.length - 4; i2++) {
      if (uint8[i2] === JMAGIC[0] && uint8[i2 + 1] === JMAGIC[1] && uint8[i2 + 2] === JMAGIC[2] && uint8[i2 + 3] === JMAGIC[3]) {
        out.present = true;
        out.indices.push(i2);
        if (out.indices.length >= 16) break;
      }
    }
    if (!out.present) return out;
    const s2 = Math.max(0, out.indices[0] - 32);
    const e2 = Math.min(uint8.length, out.indices[out.indices.length - 1] + 65536);
    let txt = "";
    for (let i2 = s2; i2 < e2; i2 += 65536) {
      txt += String.fromCharCode.apply(null, uint8.subarray(i2, Math.min(e2, i2 + 65536)));
    }
    for (const lbl of C2PA_LABELS) if (txt.indexOf(lbl) !== -1) out.labels.push(lbl);
    for (const v2 of AI_SOURCE_TYPES) if (txt.indexOf(v2) !== -1) {
      out.digitalSourceType = v2;
      break;
    }
    if (!out.digitalSourceType) {
      for (const v2 of NON_AI_SOURCE_TYPES) if (txt.indexOf(v2) !== -1) {
        out.digitalSourceType = v2;
        break;
      }
    }
    return out;
  }
  function getGenerationHints(meta) {
    const fields = [];
    const add = (label, val) => {
      if (val == null || val === "") return;
      let s2 = typeof val === "object" ? JSON.stringify(val) : String(val);
      if (s2.length > 200) s2 = s2.slice(0, 200) + "\u2026";
      fields.push({ label, value: s2 });
    };
    const keys = [
      "Software",
      "XMPToolkit",
      "CreatorTool",
      "Creator",
      "Make",
      "Model",
      "Credit",
      "Source",
      "Caption",
      "Description",
      "UserComment",
      "ImageDescription",
      "DigitalSourceType",
      "digitalSourceType",
      "Lens",
      "LensModel",
      "DateTimeOriginal"
    ];
    for (const k2 of keys) add(k2, meta[k2]);
    return fields;
  }
  var JMAGIC, C2PA_LABELS, AI_SOURCE_TYPES, NON_AI_SOURCE_TYPES;
  var init_metadata = __esm({
    "src/metadata.js"() {
      init_full_esm();
      JMAGIC = [106, 117, 109, 98];
      C2PA_LABELS = ["c2pa", "c2pa.claim", "c2pa.assertions", "c2pa.signature", "c2pa.hash"];
      AI_SOURCE_TYPES = [
        "trainedAlgorithmicMedia",
        "compositeWithTrainedAlgorithmicMedia",
        "algorithmicMedia",
        "dataDrivenMedia"
      ];
      NON_AI_SOURCE_TYPES = ["digitalCapture", "digitalCreation", "composite"];
    }
  });

  // src/watermark-detect.js
  function detectWatermarkFFT(uint8) {
    const lsb0 = { r: 0, g: 0, b: 0 };
    const lsb1 = { r: 0, g: 0, b: 0 };
    let sampleCount = 0;
    const maxSample = 2e5;
    const step = Math.max(4, Math.floor(uint8.length / maxSample));
    for (let i2 = 1e3; i2 < uint8.length - 2 && sampleCount < maxSample; i2 += step) {
      const r2 = uint8[i2], g2 = uint8[i2 + 1] || 0, b2 = uint8[i2 + 2] || 0;
      lsb0.r += r2 & 1;
      lsb0.g += g2 & 1;
      lsb0.b += b2 & 1;
      lsb1.r += r2 >> 1 & 1;
      lsb1.g += g2 >> 1 & 1;
      lsb1.b += b2 >> 1 & 1;
      sampleCount++;
    }
    const total = sampleCount * 3;
    const lsb0Ratio = (lsb0.r + lsb0.g + lsb0.b) / total;
    const lsb1Ratio = (lsb1.r + lsb1.g + lsb1.b) / total;
    const lsbBias = Math.abs(lsb0Ratio - 0.5);
    const lsb1Bias = Math.abs(lsb1Ratio - 0.5);
    const byteHist = new Uint32Array(256);
    let byteCount = 0;
    for (let i2 = 500; i2 < uint8.length; i2 += 3) {
      byteHist[uint8[i2]]++;
      byteCount++;
    }
    const expectedFreq = byteCount / 256;
    let chiSquare = 0;
    for (let i2 = 0; i2 < 256; i2++) {
      const diff = byteHist[i2] - expectedFreq;
      chiSquare += diff * diff / expectedFreq;
    }
    const chiNorm = Math.min(chiSquare / (byteCount * 0.01), 100);
    let highFreqEnergy = 0, totalVariance = 0;
    let prevVal = uint8[1e3];
    const corrSample = Math.min(1e5, uint8.length - 1001);
    for (let i2 = 1001; i2 < 1001 + corrSample; i2++) {
      const diff = uint8[i2] - prevVal;
      highFreqEnergy += diff * diff;
      totalVariance += uint8[i2] * uint8[i2];
      prevVal = uint8[i2];
    }
    const highFreqRatio = Math.sqrt(highFreqEnergy) / Math.sqrt(totalVariance + 1);
    let corrBreaks = 0;
    const corrStep = Math.max(4, Math.floor(corrSample / 5e4));
    for (let i2 = 1e3; i2 < uint8.length - 4 && corrBreaks < 5e4; i2 += corrStep) {
      const a2 = uint8[i2] & 3;
      const b2 = uint8[i2 + 4] & 3;
      if (Math.abs(a2 - b2) > 1) corrBreaks++;
    }
    const corrBreakRatio = corrBreaks / (corrSample / corrStep);
    let midFreqPeaks = 0;
    const windowSize = 64;
    for (let offset = 0; offset < windowSize; offset++) {
      let energy = 0;
      for (let i2 = 1e3 + offset; i2 < uint8.length - windowSize; i2 += windowSize) {
        energy += uint8[i2];
      }
      const avgEnergy = energy / ((uint8.length - 1e3) / windowSize);
      if (avgEnergy > 120 && avgEnergy < 136) midFreqPeaks++;
    }
    let score = 0;
    if (lsbBias > 0.03) score += 30;
    else if (lsbBias > 0.02) score += 20;
    else if (lsbBias > 0.01) score += 10;
    if (highFreqRatio > 0.15) score += 20;
    else if (highFreqRatio > 0.1) score += 10;
    if (corrBreakRatio > 0.6) score += 20;
    else if (corrBreakRatio > 0.4) score += 10;
    if (midFreqPeaks > 10) score += 20;
    else if (midFreqPeaks > 5) score += 10;
    if (lsb1Bias > 0.02) score += 10;
    score = Math.min(100, score);
    return {
      suspicious: score >= 40,
      score,
      highFreqRatio,
      midFreqPeaks,
      lsbBias
    };
  }
  var init_watermark_detect = __esm({
    "src/watermark-detect.js"() {
    }
  });

  // src/markers.js
  var MARKERS;
  var init_markers = __esm({
    "src/markers.js"() {
      MARKERS = [
        {
          id: "c2pa",
          title: "C2PA / Content Credentials",
          keywords: [
            "C2PA",
            "JUMBF",
            "caBX",
            "c2pa.manifest",
            "contentcredentials",
            "urn:uuid:",
            "jumbf",
            "activeManifest",
            "claim.v2",
            "c2pa_rs",
            "c2pa.hash"
          ],
          hitDesc: (found) => `\u6587\u4EF6\u4E2D\u51FA\u73FE ${found.map((f2) => f2.keyword).join("\u3001")} \u7B49\u7D50\u69CB/\u5B57\u7B26\u4E32\u3002`,
          missDesc: "\u6C92\u6709\u5728\u5B57\u7BC0\u4E2D\u627E\u5230 C2PA/JUMBF \u7DDA\u7D22\u3002"
        },
        {
          id: "openai",
          title: "OpenAI / DALL\xB7E / GPT",
          keywords: [
            "OpenAI",
            "openai",
            "DALL-E",
            "dall-e",
            "DALLE",
            "dalle",
            "gpt-image",
            "GPT-image",
            "chatgpt",
            "ChatGPT",
            "openai.com"
          ],
          hitDesc: (found) => `\u767C\u73FE ${found.map((f2) => f2.keyword).join("\u3001")} \u76F8\u95DC\u6A19\u8A18\u3002`,
          missDesc: "\u6C92\u6709\u767C\u73FE OpenAI / DALL-E / ChatGPT \u76F8\u95DC\u6A19\u8A18\u3002"
        },
        {
          id: "google",
          title: "Google / SynthID / Gemini",
          keywords: [
            "Google",
            "SynthID",
            "Gemini",
            "Imagen",
            "Nano Banana",
            "nanobanana",
            "DeepMind",
            "google.com",
            "gemini"
          ],
          hitDesc: (found) => `\u767C\u73FE ${found.map((f2) => f2.keyword).join("\u3001")} \u76F8\u95DC\u6A19\u8A18\u3002`,
          missDesc: "\u6C92\u6709\u767C\u73FE Google / SynthID / Gemini \u76F8\u95DC\u6A19\u8A18\u3002"
        },
        {
          id: "midjourney",
          title: "Midjourney",
          keywords: ["Midjourney", "midjourney", "MIDJOURNEY", "mj-api", "midj"],
          hitDesc: () => "\u767C\u73FE Midjourney \u76F8\u95DC\u6A19\u8A18\u3002",
          missDesc: "\u6C92\u6709\u767C\u73FE Midjourney \u76F8\u95DC\u6A19\u8A18\u3002"
        },
        {
          id: "sd",
          title: "Stable Diffusion / ComfyUI / Flux",
          keywords: [
            "StableDiffusion",
            "stable-diffusion",
            "ComfyUI",
            "comfyui",
            "Flux",
            "FLUX",
            "Automatic1111",
            "A1111",
            "InvokeAI",
            "Fooocus",
            "stable_diffusion",
            "diffusion_model"
          ],
          hitDesc: (found) => `\u767C\u73FE ${found.map((f2) => f2.keyword).join("\u3001")} \u76F8\u95DC\u6A19\u8A18\u3002`,
          missDesc: "\u6C92\u6709\u767C\u73FE Stable Diffusion / ComfyUI / Flux \u76F8\u95DC\u6A19\u8A18\u3002"
        },
        {
          id: "adobe",
          title: "Adobe Firefly (AI)",
          // 只匹配 Firefly 特定標記。Adobe / Photoshop 字樣在正常修圖、甚至
          // ICC 色彩配置文件(版權字段 "Adobe Systems Incorporated")中都會出現,
          // 不能當 AI 證據 —— 否則連微信截圖都會被誤判。
          keywords: ["Firefly", "adobe_firefly", "AdobeFirefly", "adobefirefly"],
          hitDesc: (found) => `\u767C\u73FE ${found.map((f2) => f2.keyword).join("\u3001")} (Adobe \u751F\u6210\u5F0F AI)\u3002`,
          missDesc: "\u6C92\u6709\u767C\u73FE Adobe Firefly \u76F8\u95DC\u6A19\u8A18\u3002"
        },
        {
          id: "photoshop",
          title: "Photoshop / \u4FEE\u5716\u8EDF\u4EF6 (\u975E AI)",
          category: "edit",
          // 'edit' 類別不計入 AI 命中
          // Photoshop 自身寫入的元數據。注意不要用純 "Adobe"(ICC 裡就有)。
          keywords: [
            "Adobe Photoshop",
            "photoshop:",
            "Photoshop CC",
            "Photoshop CS",
            "Adobe ImageReady",
            "Lightroom Classic",
            "Adobe Lightroom"
          ],
          hitThreshold: 1,
          hitDesc: (found) => `\u6AA2\u6E2C\u5230 ${found.map((f2) => f2.keyword).join("\u3001")} \u4FEE\u5716\u75D5\u8DE1\u3002`,
          missDesc: "\u6C92\u6709\u767C\u73FE Photoshop / Lightroom \u8655\u7406\u75D5\u8DE1\u3002"
        },
        {
          id: "pngtext",
          title: "PNG \u6587\u672C\u584A / \u751F\u6210\u53C3\u6578",
          keywords: [
            "tEXt",
            "iTXt",
            "zTXt",
            "parameters",
            "prompt",
            "negative_prompt",
            "Steps:",
            "Sampler:",
            "CFG scale",
            "Seed:",
            "workflow"
          ],
          hitThreshold: 2,
          hitDesc: (found) => `\u767C\u73FE ${found.map((f2) => f2.keyword).join("\u3001")} \u7B49\u751F\u6210\u53C3\u6578\u6A19\u8A18\u3002`,
          missDesc: "\u6C92\u6709\u767C\u73FE PNG \u6587\u672C\u584A\u4E2D\u7684\u751F\u6210\u53C3\u6578\u3002"
        }
      ];
    }
  });

  // src/detect.js
  function findWithContext(str, keywords) {
    const results = [];
    const seen = /* @__PURE__ */ new Set();
    for (const kw of keywords) {
      const lk = kw.toLowerCase();
      if (seen.has(lk)) continue;
      const idx = str.indexOf(kw);
      if (idx !== -1) {
        seen.add(lk);
        const start = Math.max(0, idx - 30);
        const end = Math.min(str.length, idx + kw.length + 30);
        const context = str.substring(start, end).replace(/[\x00-\x08\x0e-\x1f]/g, ".");
        results.push({ keyword: kw, context });
      }
    }
    return results;
  }
  function detailOf(found) {
    return found.map((f2) => `[${f2.keyword}] \u2026${f2.context}\u2026`).join("\n");
  }
  function card(title, hit, badgeText, desc, detail, confidence) {
    return {
      title,
      hit,
      badgeText,
      badgeClass: hit ? "badge-hit" : "badge-clean",
      desc,
      detail: detail || null,
      confidence: confidence || null
    };
  }
  async function runAllDetections(uint8) {
    const str = bytesToString(uint8);
    const [meta, jumbf] = await Promise.all([parseMetadata(uint8), Promise.resolve(sniffJumbf(uint8))]);
    const detections = [];
    {
      const m2 = MARKERS.find((x2) => x2.id === "c2pa");
      const found = findWithContext(str, m2.keywords);
      const hit = jumbf.present || found.length > 0;
      const aiType = jumbf.digitalSourceType && [
        "trainedAlgorithmicMedia",
        "compositeWithTrainedAlgorithmicMedia",
        "algorithmicMedia",
        "dataDrivenMedia"
      ].includes(jumbf.digitalSourceType);
      let badgeText, desc, confidence;
      if (aiType) {
        badgeText = `C2PA \u8072\u660E\u70BA AI \u751F\u6210 (${jumbf.digitalSourceType})`;
        desc = "\u5716\u7247\u5D4C\u5165\u4E86 C2PA \u4F86\u6E90\u6191\u8B49,\u4E26\u660E\u78BA\u8072\u660E\u70BA\u7B97\u6CD5\u751F\u6210\u5167\u5BB9\u3002";
        confidence = "strong";
      } else if (jumbf.present) {
        badgeText = `C2PA \u5B58\u5728 (${jumbf.digitalSourceType || "\u4F86\u6E90\u672A\u8072\u660E"})`;
        desc = "\u5716\u7247\u5D4C\u5165\u4E86 C2PA \u4F86\u6E90\u6191\u8B49\u3002" + (jumbf.labels.length ? ` Labels: ${jumbf.labels.join(", ")}` : "");
        confidence = "strong";
      } else if (found.length > 0) {
        badgeText = "\u5B57\u7BC0\u4E2D\u542B C2PA \u5B57\u7B26\u4E32";
        desc = "\u6587\u4EF6\u5B57\u7BC0\u4E2D\u51FA\u73FE C2PA \u76F8\u95DC\u5B57\u7B26\u4E32,\u4F46\u672A\u767C\u73FE\u5B8C\u6574 JUMBF \u7D50\u69CB\u3002";
        confidence = "weak";
      } else {
        badgeText = "\u672A\u767C\u73FE";
        desc = m2.missDesc;
      }
      const details = [];
      if (jumbf.present) details.push(`JUMBF boxes: ${jumbf.indices.length}  |  labels: ${jumbf.labels.join(", ") || "-"}  |  DigitalSourceType: ${jumbf.digitalSourceType || "-"}`);
      if (found.length) details.push(detailOf(found));
      detections.push(card(m2.title, hit, badgeText, desc, details.join("\n\n") || null, confidence));
    }
    {
      const hints = getGenerationHints(meta);
      const aiStrings = /Gemini|Imagen|SynthID|Midjourney|Stable\s*Diffusion|ComfyUI|DALL|OpenAI|Firefly|Adobe Firefly|trainedAlgorithmicMedia/i;
      const hit = hints.some((h2) => aiStrings.test(String(h2.value)));
      const hasAny = hints.length > 0;
      const metaLine = hints.map((h2) => `${h2.label}: ${h2.value}`).join("\n");
      detections.push(card(
        "\u7D50\u69CB\u5316\u5143\u6578\u64DA (EXIF / XMP / IPTC)",
        hit,
        hit ? "\u5143\u6578\u64DA\u547D\u4E2D AI \u751F\u6210\u5DE5\u5177" : hasAny ? "\u5B58\u5728\u5143\u6578\u64DA,\u4F46\u672A\u547D\u4E2D AI" : "\u7121\u53EF\u8B80\u5143\u6578\u64DA",
        hit ? "\u5716\u7247\u5143\u6578\u64DA\u5B57\u6BB5\u76F4\u63A5\u8A18\u9304\u4E86 AI \u751F\u6210\u5DE5\u5177\u6216\u6A19\u8A18\u3002" : hasAny ? "\u63D0\u53D6\u5230\u7684\u5143\u6578\u64DA\u5B57\u6BB5\u672A\u5339\u914D AI \u751F\u6210\u6A19\u8A18\u3002" : "\u5716\u7247\u5E7E\u4E4E\u4E0D\u542B\u5143\u6578\u64DA(\u53EF\u80FD\u88AB\u525D\u96E2)\u3002",
        metaLine || null,
        hit ? "strong" : null
      ));
    }
    for (const m2 of MARKERS) {
      if (m2.id === "c2pa") continue;
      const found = findWithContext(str, m2.keywords);
      const threshold = m2.hitThreshold || 1;
      const hit = found.length >= threshold;
      const isEdit = m2.category === "edit";
      detections.push({
        ...card(
          m2.title,
          hit,
          hit ? isEdit ? "\u767C\u73FE\u4FEE\u5716\u75D5\u8DE1" : "\u767C\u73FE\u6A19\u8A18" : "\u672A\u767C\u73FE",
          hit ? m2.hitDesc(found) : m2.missDesc,
          found.length ? detailOf(found) : null,
          hit ? isEdit ? "info" : "medium" : null
        ),
        category: m2.category || "ai"
      });
    }
    {
      const wm = detectWatermarkFFT(uint8);
      detections.push(card(
        "\u50CF\u7D20\u7D1A\u96B1\u5F62\u6C34\u5370(\u5B57\u7BC0\u7D1A\u555F\u767C)",
        wm.suspicious,
        wm.suspicious ? `\u7591\u4F3C\u6C34\u5370 (\u7570\u5E38\u5EA6 ${wm.score}%)` : "\u672A\u6AA2\u6E2C\u5230\u7570\u5E38",
        wm.suspicious ? '\u5B57\u7BC0\u5206\u4F48\u504F\u96E2\u81EA\u7136\u5716\u50CF\u6A21\u578B,\u53EF\u80FD\u5B58\u5728\u96B1\u5F62\u6C34\u5370\u3002\u5B8C\u6574\u983B\u57DF\u5206\u6790\u5C07\u5728"\u983B\u57DF"tab \u63D0\u4F9B\u3002' : "\u5B57\u7BC0\u5206\u4F48\u7B26\u5408\u81EA\u7136\u5716\u50CF\u7279\u5FB5,\u672A\u767C\u73FE\u660E\u986F\u6C34\u5370\u75D5\u8DE1\u3002",
        `\u7570\u5E38\u5EA6: ${wm.score}%
\u9AD8\u983B\u6BD4: ${wm.highFreqRatio.toFixed(4)}
\u4E2D\u983B\u5CF0\u503C: ${wm.midFreqPeaks}
LSB\u504F\u79FB: ${wm.lsbBias.toFixed(4)}`,
        wm.suspicious ? "weak" : null
      ));
    }
    return { detections, meta, jumbf };
  }
  var init_detect = __esm({
    "src/detect.js"() {
      init_utils();
      init_metadata();
      init_watermark_detect();
      init_markers();
    }
  });

  // src/cameras.js
  var CAMERA_PROFILES, CAMERA_GROUPS, GPS_PRESETS;
  var init_cameras = __esm({
    "src/cameras.js"() {
      CAMERA_PROFILES = {
        // ===== 手機(主打新機型) =====
        iphone17promax: {
          group: "phone",
          displayName: "iPhone 17 Pro Max",
          icon: "\u{1F4F1}",
          Make: "Apple",
          Model: "iPhone 17 Pro Max",
          Software: "19.2",
          LensModel: "iPhone 17 Pro Max back triple camera 6.86mm f/1.78",
          FocalLength: 6.86,
          FocalLengthIn35mm: 24,
          FNumber: 1.78,
          ISO: 80,
          ExposureTime: [1, 120],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        },
        iphone16pro: {
          group: "phone",
          displayName: "iPhone 16 Pro",
          icon: "\u{1F4F1}",
          Make: "Apple",
          Model: "iPhone 16 Pro",
          Software: "18.3.1",
          LensModel: "iPhone 16 Pro back triple camera 6.765mm f/1.78",
          FocalLength: 6.765,
          FocalLengthIn35mm: 24,
          FNumber: 1.78,
          ISO: 100,
          ExposureTime: [1, 100],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        },
        iphone15pro: {
          group: "phone",
          displayName: "iPhone 15 Pro",
          icon: "\u{1F4F1}",
          Make: "Apple",
          Model: "iPhone 15 Pro",
          Software: "17.6.1",
          LensModel: "iPhone 15 Pro back triple camera 6.765mm f/1.78",
          FocalLength: 6.765,
          FocalLengthIn35mm: 24,
          FNumber: 1.78,
          ISO: 125,
          ExposureTime: [1, 100],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        },
        samsungs25u: {
          group: "phone",
          displayName: "Galaxy S25 Ultra",
          icon: "\u{1F4F1}",
          Make: "samsung",
          Model: "SM-S938B",
          Software: "S938BXXU1AYB4",
          LensModel: "Samsung Galaxy S25 Ultra Rear Main Camera",
          FocalLength: 6.4,
          FocalLengthIn35mm: 23,
          FNumber: 1.7,
          ISO: 80,
          ExposureTime: [1, 120],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        },
        xiaomi15pro: {
          group: "phone",
          displayName: "\u5C0F\u7C73 15 Ultra",
          icon: "\u{1F4F1}",
          Make: "Xiaomi",
          Model: "25010PN30C",
          Software: "HyperOS 2",
          LensModel: "Leica Summilux 1:1.63-4.1/12-200 ASPH.",
          FocalLength: 8.7,
          FocalLengthIn35mm: 23,
          FNumber: 1.63,
          ISO: 50,
          ExposureTime: [1, 200],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        },
        pixel9pro: {
          group: "phone",
          displayName: "Pixel 9 Pro",
          icon: "\u{1F4F1}",
          Make: "Google",
          Model: "Pixel 9 Pro",
          Software: "HDR+ 1.0.607123456",
          LensModel: "Pixel 9 Pro back camera 6.9mm f/1.68",
          FocalLength: 6.9,
          FocalLengthIn35mm: 25,
          FNumber: 1.68,
          ISO: 50,
          ExposureTime: [1, 300],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        },
        huaweip70u: {
          group: "phone",
          displayName: "\u83EF\u70BA Pura 70 Ultra",
          icon: "\u{1F4F1}",
          Make: "HUAWEI",
          Model: "HBP-AL00",
          Software: "HBP-AL00 4.3.0.131",
          LensModel: "HUAWEI Pura 70 Ultra Rear Main Camera",
          FocalLength: 7.4,
          FocalLengthIn35mm: 23,
          FNumber: 1.6,
          ISO: 64,
          ExposureTime: [1, 160],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        },
        vivox200p: {
          group: "phone",
          displayName: "vivo X200 Pro",
          icon: "\u{1F4F1}",
          Make: "vivo",
          Model: "V2415A",
          Software: "OriginOS 5",
          LensModel: "ZEISS T* 23mm F1.57",
          FocalLength: 8,
          FocalLengthIn35mm: 23,
          FNumber: 1.57,
          ISO: 50,
          ExposureTime: [1, 180],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        },
        // ===== 無反 / 單反 =====
        canonr5m2: {
          group: "dslr",
          displayName: "Canon EOS R5 Mark II",
          icon: "\u{1F4F7}",
          Make: "Canon",
          Model: "Canon EOS R5m2",
          Software: "Adobe Lightroom Classic",
          LensModel: "RF24-70mm F2.8 L IS USM",
          LensMake: "Canon",
          FocalLength: 35,
          FocalLengthIn35mm: 35,
          FNumber: 2.8,
          ISO: 400,
          ExposureTime: [1, 250],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash",
          ExposureProgram: "Aperture priority",
          MeteringMode: "Multi-segment"
        },
        sonya1ii: {
          group: "dslr",
          displayName: "Sony \u03B11 II",
          icon: "\u{1F4F7}",
          Make: "SONY",
          Model: "ILCE-1M2",
          Software: "Adobe Lightroom Classic",
          LensModel: "FE 24-70mm F2.8 GM II",
          LensMake: "Sony",
          FocalLength: 50,
          FocalLengthIn35mm: 50,
          FNumber: 2.8,
          ISO: 200,
          ExposureTime: [1, 160],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash",
          ExposureProgram: "Manual",
          MeteringMode: "Multi-segment"
        },
        sonya7iv: {
          group: "dslr",
          displayName: "Sony A7 IV",
          icon: "\u{1F4F7}",
          Make: "SONY",
          Model: "ILCE-7M4",
          Software: "Adobe Lightroom Classic",
          LensModel: "FE 24-70mm F2.8 GM II",
          LensMake: "Sony",
          FocalLength: 50,
          FocalLengthIn35mm: 50,
          FNumber: 2.8,
          ISO: 200,
          ExposureTime: [1, 160],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash",
          ExposureProgram: "Manual",
          MeteringMode: "Multi-segment"
        },
        nikonz8: {
          group: "dslr",
          displayName: "Nikon Z8",
          icon: "\u{1F4F7}",
          Make: "NIKON CORPORATION",
          Model: "NIKON Z 8",
          Software: "Ver.2.10",
          LensModel: "NIKKOR Z 24-120mm f/4 S",
          LensMake: "Nikon",
          FocalLength: 70,
          FocalLengthIn35mm: 70,
          FNumber: 4,
          ISO: 640,
          ExposureTime: [1, 200],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash",
          ExposureProgram: "Aperture priority",
          MeteringMode: "Multi-segment"
        },
        fujixt5: {
          group: "dslr",
          displayName: "Fujifilm X-T5",
          icon: "\u{1F4F7}",
          Make: "FUJIFILM",
          Model: "X-T5",
          Software: "Ver1.10",
          LensModel: "XF18-55mmF2.8-4 R LM OIS",
          LensMake: "FUJIFILM",
          FocalLength: 23,
          FocalLengthIn35mm: 35,
          FNumber: 2.8,
          ISO: 320,
          ExposureTime: [1, 125],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash",
          ExposureProgram: "Aperture priority",
          MeteringMode: "Multi-segment"
        },
        // ===== 緊湊 / 膠片感 =====
        leicaq3: {
          group: "compact",
          displayName: "Leica Q3",
          icon: "\u{1F39E}\uFE0F",
          Make: "LEICA CAMERA AG",
          Model: "LEICA Q3",
          Software: "2.0.2",
          LensModel: "SUMMILUX 1:1.7/28 ASPH.",
          LensMake: "Leica",
          FocalLength: 28,
          FocalLengthIn35mm: 28,
          FNumber: 2.8,
          ISO: 200,
          ExposureTime: [1, 250],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash",
          ExposureProgram: "Aperture priority",
          MeteringMode: "Multi-segment"
        },
        ricohgr3x: {
          group: "compact",
          displayName: "Ricoh GR IIIx",
          icon: "\u{1F39E}\uFE0F",
          Make: "RICOH IMAGING COMPANY, LTD.",
          Model: "RICOH GR IIIx",
          Software: "1.70",
          LensModel: "GR LENS 26.1mm F2.8",
          FocalLength: 26.1,
          FocalLengthIn35mm: 40,
          FNumber: 2.8,
          ISO: 400,
          ExposureTime: [1, 160],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash",
          ExposureProgram: "Aperture priority",
          MeteringMode: "Multi-segment"
        },
        fujix100vi: {
          group: "compact",
          displayName: "Fujifilm X100VI",
          icon: "\u{1F39E}\uFE0F",
          Make: "FUJIFILM",
          Model: "X100VI",
          Software: "Ver1.10",
          LensModel: "FUJINON 23mm F2",
          LensMake: "FUJIFILM",
          FocalLength: 23,
          FocalLengthIn35mm: 35,
          FNumber: 2.8,
          ISO: 500,
          ExposureTime: [1, 250],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash",
          ExposureProgram: "Aperture priority",
          MeteringMode: "Multi-segment"
        },
        gopro13: {
          group: "compact",
          displayName: "GoPro Hero 13",
          icon: "\u{1F3A5}",
          Make: "GoPro",
          Model: "HERO13 Black",
          Software: "H24.01.01.10.00",
          LensModel: "GoPro 2.92mm f/2.5",
          FocalLength: 2.92,
          FocalLengthIn35mm: 16,
          FNumber: 2.5,
          ISO: 100,
          ExposureTime: [1, 240],
          WhiteBalance: "Auto",
          ColorSpace: "sRGB",
          Flash: "No Flash"
        }
      };
      CAMERA_GROUPS = [
        { id: "phone", label: "\u624B\u6A5F", icon: "\u{1F4F1}" },
        { id: "dslr", label: "\u7121\u53CD / \u55AE\u53CD", icon: "\u{1F4F7}" },
        { id: "compact", label: "\u7DCA\u6E4A / \u81A0\u7247\u611F", icon: "\u{1F39E}\uFE0F" }
      ];
      GPS_PRESETS = {
        none: { label: "\u4E0D\u5BEB\u5165 GPS (\u63A8\u85A6)", lat: null, lon: null },
        beijing: { label: "\u5317\u4EAC \xB7 \u6545\u5BAE\u5348\u9580", lat: 39.9163, lon: 116.3972 },
        shanghai: { label: "\u4E0A\u6D77 \xB7 \u5916\u7058", lat: 31.2397, lon: 121.4904 },
        gz: { label: "\u5EE3\u5DDE \xB7 \u5C0F\u883B\u8170", lat: 23.1066, lon: 113.3245 },
        shenzhen: { label: "\u6DF1\u5733 \xB7 \u5E73\u5B89\u91D1\u878D\u4E2D\u5FC3", lat: 22.537, lon: 114.0579 },
        chengdu: { label: "\u6210\u90FD \xB7 \u6625\u7199\u8DEF", lat: 30.653, lon: 104.0819 },
        hongkong: { label: "\u9999\u6E2F \xB7 \u7DAD\u591A\u5229\u4E9E\u6E2F", lat: 22.294, lon: 114.1694 },
        tokyo: { label: "\u6771\u4EAC \xB7 \u6F80\u8C37\u7AD9", lat: 35.658, lon: 139.7016 },
        nyc: { label: "\u7D10\u7D04 \xB7 \u6642\u4EE3\u5EE3\u5834", lat: 40.758, lon: -73.9855 }
      };
    }
  });

  // node_modules/piexifjs/piexif.js
  var require_piexif = __commonJS({
    "node_modules/piexifjs/piexif.js"(exports, module) {
      (function() {
        "use strict";
        var that = {};
        that.version = "1.0.4";
        that.remove = function(jpeg) {
          var b64 = false;
          if (jpeg.slice(0, 2) == "\xFF\xD8") {
          } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
            jpeg = atob2(jpeg.split(",")[1]);
            b64 = true;
          } else {
            throw new Error("Given data is not jpeg.");
          }
          var segments = splitIntoSegments(jpeg);
          var newSegments = segments.filter(function(seg) {
            return !(seg.slice(0, 2) == "\xFF\xE1" && seg.slice(4, 10) == "Exif\0\0");
          });
          var new_data = newSegments.join("");
          if (b64) {
            new_data = "data:image/jpeg;base64," + btoa(new_data);
          }
          return new_data;
        };
        that.insert = function(exif, jpeg) {
          var b64 = false;
          if (exif.slice(0, 6) != "Exif\0\0") {
            throw new Error("Given data is not exif.");
          }
          if (jpeg.slice(0, 2) == "\xFF\xD8") {
          } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
            jpeg = atob2(jpeg.split(",")[1]);
            b64 = true;
          } else {
            throw new Error("Given data is not jpeg.");
          }
          var exifStr = "\xFF\xE1" + pack(">H", [exif.length + 2]) + exif;
          var segments = splitIntoSegments(jpeg);
          var new_data = mergeSegments(segments, exifStr);
          if (b64) {
            new_data = "data:image/jpeg;base64," + btoa(new_data);
          }
          return new_data;
        };
        that.load = function(data) {
          var input_data;
          if (typeof data == "string") {
            if (data.slice(0, 2) == "\xFF\xD8") {
              input_data = data;
            } else if (data.slice(0, 23) == "data:image/jpeg;base64," || data.slice(0, 22) == "data:image/jpg;base64,") {
              input_data = atob2(data.split(",")[1]);
            } else if (data.slice(0, 4) == "Exif") {
              input_data = data.slice(6);
            } else {
              throw new Error("'load' gots invalid file data.");
            }
          } else {
            throw new Error("'load' gots invalid type argument.");
          }
          var exifDict = {};
          var exif_dict = {
            "0th": {},
            "Exif": {},
            "GPS": {},
            "Interop": {},
            "1st": {},
            "thumbnail": null
          };
          var exifReader = new ExifReader(input_data);
          if (exifReader.tiftag === null) {
            return exif_dict;
          }
          if (exifReader.tiftag.slice(0, 2) == "II") {
            exifReader.endian_mark = "<";
          } else {
            exifReader.endian_mark = ">";
          }
          var pointer = unpack(
            exifReader.endian_mark + "L",
            exifReader.tiftag.slice(4, 8)
          )[0];
          exif_dict["0th"] = exifReader.get_ifd(pointer, "0th");
          var first_ifd_pointer = exif_dict["0th"]["first_ifd_pointer"];
          delete exif_dict["0th"]["first_ifd_pointer"];
          if (34665 in exif_dict["0th"]) {
            pointer = exif_dict["0th"][34665];
            exif_dict["Exif"] = exifReader.get_ifd(pointer, "Exif");
          }
          if (34853 in exif_dict["0th"]) {
            pointer = exif_dict["0th"][34853];
            exif_dict["GPS"] = exifReader.get_ifd(pointer, "GPS");
          }
          if (40965 in exif_dict["Exif"]) {
            pointer = exif_dict["Exif"][40965];
            exif_dict["Interop"] = exifReader.get_ifd(pointer, "Interop");
          }
          if (first_ifd_pointer != "\0\0\0\0") {
            pointer = unpack(
              exifReader.endian_mark + "L",
              first_ifd_pointer
            )[0];
            exif_dict["1st"] = exifReader.get_ifd(pointer, "1st");
            if (513 in exif_dict["1st"] && 514 in exif_dict["1st"]) {
              var end = exif_dict["1st"][513] + exif_dict["1st"][514];
              var thumb = exifReader.tiftag.slice(exif_dict["1st"][513], end);
              exif_dict["thumbnail"] = thumb;
            }
          }
          return exif_dict;
        };
        that.dump = function(exif_dict_original) {
          var TIFF_HEADER_LENGTH = 8;
          var exif_dict = copy(exif_dict_original);
          var header = "Exif\0\0MM\0*\0\0\0\b";
          var exif_is = false;
          var gps_is = false;
          var interop_is = false;
          var first_is = false;
          var zeroth_ifd, exif_ifd, interop_ifd, gps_ifd, first_ifd;
          if ("0th" in exif_dict) {
            zeroth_ifd = exif_dict["0th"];
          } else {
            zeroth_ifd = {};
          }
          if ("Exif" in exif_dict && Object.keys(exif_dict["Exif"]).length || "Interop" in exif_dict && Object.keys(exif_dict["Interop"]).length) {
            zeroth_ifd[34665] = 1;
            exif_is = true;
            exif_ifd = exif_dict["Exif"];
            if ("Interop" in exif_dict && Object.keys(exif_dict["Interop"]).length) {
              exif_ifd[40965] = 1;
              interop_is = true;
              interop_ifd = exif_dict["Interop"];
            } else if (Object.keys(exif_ifd).indexOf(that.ExifIFD.InteroperabilityTag.toString()) > -1) {
              delete exif_ifd[40965];
            }
          } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.ExifTag.toString()) > -1) {
            delete zeroth_ifd[34665];
          }
          if ("GPS" in exif_dict && Object.keys(exif_dict["GPS"]).length) {
            zeroth_ifd[that.ImageIFD.GPSTag] = 1;
            gps_is = true;
            gps_ifd = exif_dict["GPS"];
          } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.GPSTag.toString()) > -1) {
            delete zeroth_ifd[that.ImageIFD.GPSTag];
          }
          if ("1st" in exif_dict && "thumbnail" in exif_dict && exif_dict["thumbnail"] != null) {
            first_is = true;
            exif_dict["1st"][513] = 1;
            exif_dict["1st"][514] = 1;
            first_ifd = exif_dict["1st"];
          }
          var zeroth_set = _dict_to_bytes(zeroth_ifd, "0th", 0);
          var zeroth_length = zeroth_set[0].length + exif_is * 12 + gps_is * 12 + 4 + zeroth_set[1].length;
          var exif_set, exif_bytes = "", exif_length = 0, gps_set, gps_bytes = "", gps_length = 0, interop_set, interop_bytes = "", interop_length = 0, first_set, first_bytes = "", thumbnail;
          if (exif_is) {
            exif_set = _dict_to_bytes(exif_ifd, "Exif", zeroth_length);
            exif_length = exif_set[0].length + interop_is * 12 + exif_set[1].length;
          }
          if (gps_is) {
            gps_set = _dict_to_bytes(gps_ifd, "GPS", zeroth_length + exif_length);
            gps_bytes = gps_set.join("");
            gps_length = gps_bytes.length;
          }
          if (interop_is) {
            var offset = zeroth_length + exif_length + gps_length;
            interop_set = _dict_to_bytes(interop_ifd, "Interop", offset);
            interop_bytes = interop_set.join("");
            interop_length = interop_bytes.length;
          }
          if (first_is) {
            var offset = zeroth_length + exif_length + gps_length + interop_length;
            first_set = _dict_to_bytes(first_ifd, "1st", offset);
            thumbnail = _get_thumbnail(exif_dict["thumbnail"]);
            if (thumbnail.length > 64e3) {
              throw new Error("Given thumbnail is too large. max 64kB");
            }
          }
          var exif_pointer = "", gps_pointer = "", interop_pointer = "", first_ifd_pointer = "\0\0\0\0";
          if (exif_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key = 34665;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            exif_pointer = key_str + type_str + length_str + pointer_str;
          }
          if (gps_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key = 34853;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            gps_pointer = key_str + type_str + length_str + pointer_str;
          }
          if (interop_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length + gps_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key = 40965;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            interop_pointer = key_str + type_str + length_str + pointer_str;
          }
          if (first_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length + gps_length + interop_length;
            first_ifd_pointer = pack(">L", [pointer_value]);
            var thumbnail_pointer = pointer_value + first_set[0].length + 24 + 4 + first_set[1].length;
            var thumbnail_p_bytes = "\0\0\0\0" + pack(">L", [thumbnail_pointer]);
            var thumbnail_length_bytes = "\0\0\0\0" + pack(">L", [thumbnail.length]);
            first_bytes = first_set[0] + thumbnail_p_bytes + thumbnail_length_bytes + "\0\0\0\0" + first_set[1] + thumbnail;
          }
          var zeroth_bytes = zeroth_set[0] + exif_pointer + gps_pointer + first_ifd_pointer + zeroth_set[1];
          if (exif_is) {
            exif_bytes = exif_set[0] + interop_pointer + exif_set[1];
          }
          return header + zeroth_bytes + exif_bytes + gps_bytes + interop_bytes + first_bytes;
        };
        function copy(obj) {
          return JSON.parse(JSON.stringify(obj));
        }
        function _get_thumbnail(jpeg) {
          var segments = splitIntoSegments(jpeg);
          while ("\xFF\xE0" <= segments[1].slice(0, 2) && segments[1].slice(0, 2) <= "\xFF\xEF") {
            segments = [segments[0]].concat(segments.slice(2));
          }
          return segments.join("");
        }
        function _pack_byte(array) {
          return pack(">" + nStr("B", array.length), array);
        }
        function _pack_short(array) {
          return pack(">" + nStr("H", array.length), array);
        }
        function _pack_long(array) {
          return pack(">" + nStr("L", array.length), array);
        }
        function _value_to_bytes(raw_value, value_type, offset) {
          var four_bytes_over = "";
          var value_str = "";
          var length, new_value, num, den;
          if (value_type == "Byte") {
            length = raw_value.length;
            if (length <= 4) {
              value_str = _pack_byte(raw_value) + nStr("\0", 4 - length);
            } else {
              value_str = pack(">L", [offset]);
              four_bytes_over = _pack_byte(raw_value);
            }
          } else if (value_type == "Short") {
            length = raw_value.length;
            if (length <= 2) {
              value_str = _pack_short(raw_value) + nStr("\0\0", 2 - length);
            } else {
              value_str = pack(">L", [offset]);
              four_bytes_over = _pack_short(raw_value);
            }
          } else if (value_type == "Long") {
            length = raw_value.length;
            if (length <= 1) {
              value_str = _pack_long(raw_value);
            } else {
              value_str = pack(">L", [offset]);
              four_bytes_over = _pack_long(raw_value);
            }
          } else if (value_type == "Ascii") {
            new_value = raw_value + "\0";
            length = new_value.length;
            if (length > 4) {
              value_str = pack(">L", [offset]);
              four_bytes_over = new_value;
            } else {
              value_str = new_value + nStr("\0", 4 - length);
            }
          } else if (value_type == "Rational") {
            if (typeof raw_value[0] == "number") {
              length = 1;
              num = raw_value[0];
              den = raw_value[1];
              new_value = pack(">L", [num]) + pack(">L", [den]);
            } else {
              length = raw_value.length;
              new_value = "";
              for (var n2 = 0; n2 < length; n2++) {
                num = raw_value[n2][0];
                den = raw_value[n2][1];
                new_value += pack(">L", [num]) + pack(">L", [den]);
              }
            }
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
          } else if (value_type == "SRational") {
            if (typeof raw_value[0] == "number") {
              length = 1;
              num = raw_value[0];
              den = raw_value[1];
              new_value = pack(">l", [num]) + pack(">l", [den]);
            } else {
              length = raw_value.length;
              new_value = "";
              for (var n2 = 0; n2 < length; n2++) {
                num = raw_value[n2][0];
                den = raw_value[n2][1];
                new_value += pack(">l", [num]) + pack(">l", [den]);
              }
            }
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
          } else if (value_type == "Undefined") {
            length = raw_value.length;
            if (length > 4) {
              value_str = pack(">L", [offset]);
              four_bytes_over = raw_value;
            } else {
              value_str = raw_value + nStr("\0", 4 - length);
            }
          }
          var length_str = pack(">L", [length]);
          return [length_str, value_str, four_bytes_over];
        }
        function _dict_to_bytes(ifd_dict, ifd, ifd_offset) {
          var TIFF_HEADER_LENGTH = 8;
          var tag_count = Object.keys(ifd_dict).length;
          var entry_header = pack(">H", [tag_count]);
          var entries_length;
          if (["0th", "1st"].indexOf(ifd) > -1) {
            entries_length = 2 + tag_count * 12 + 4;
          } else {
            entries_length = 2 + tag_count * 12;
          }
          var entries = "";
          var values = "";
          var key;
          for (var key in ifd_dict) {
            if (typeof key == "string") {
              key = parseInt(key);
            }
            if (ifd == "0th" && [34665, 34853].indexOf(key) > -1) {
              continue;
            } else if (ifd == "Exif" && key == 40965) {
              continue;
            } else if (ifd == "1st" && [513, 514].indexOf(key) > -1) {
              continue;
            }
            var raw_value = ifd_dict[key];
            var key_str = pack(">H", [key]);
            var value_type = TAGS[ifd][key]["type"];
            var type_str = pack(">H", [TYPES[value_type]]);
            if (typeof raw_value == "number") {
              raw_value = [raw_value];
            }
            var offset = TIFF_HEADER_LENGTH + entries_length + ifd_offset + values.length;
            var b2 = _value_to_bytes(raw_value, value_type, offset);
            var length_str = b2[0];
            var value_str = b2[1];
            var four_bytes_over = b2[2];
            entries += key_str + type_str + length_str + value_str;
            values += four_bytes_over;
          }
          return [entry_header + entries, values];
        }
        function ExifReader(data) {
          var segments, app1;
          if (data.slice(0, 2) == "\xFF\xD8") {
            segments = splitIntoSegments(data);
            app1 = getExifSeg(segments);
            if (app1) {
              this.tiftag = app1.slice(10);
            } else {
              this.tiftag = null;
            }
          } else if (["II", "MM"].indexOf(data.slice(0, 2)) > -1) {
            this.tiftag = data;
          } else if (data.slice(0, 4) == "Exif") {
            this.tiftag = data.slice(6);
          } else {
            throw new Error("Given file is neither JPEG nor TIFF.");
          }
        }
        ExifReader.prototype = {
          get_ifd: function(pointer, ifd_name) {
            var ifd_dict = {};
            var tag_count = unpack(
              this.endian_mark + "H",
              this.tiftag.slice(pointer, pointer + 2)
            )[0];
            var offset = pointer + 2;
            var t3;
            if (["0th", "1st"].indexOf(ifd_name) > -1) {
              t3 = "Image";
            } else {
              t3 = ifd_name;
            }
            for (var x2 = 0; x2 < tag_count; x2++) {
              pointer = offset + 12 * x2;
              var tag = unpack(
                this.endian_mark + "H",
                this.tiftag.slice(pointer, pointer + 2)
              )[0];
              var value_type = unpack(
                this.endian_mark + "H",
                this.tiftag.slice(pointer + 2, pointer + 4)
              )[0];
              var value_num = unpack(
                this.endian_mark + "L",
                this.tiftag.slice(pointer + 4, pointer + 8)
              )[0];
              var value = this.tiftag.slice(pointer + 8, pointer + 12);
              var v_set = [value_type, value_num, value];
              if (tag in TAGS[t3]) {
                ifd_dict[tag] = this.convert_value(v_set);
              }
            }
            if (ifd_name == "0th") {
              pointer = offset + 12 * tag_count;
              ifd_dict["first_ifd_pointer"] = this.tiftag.slice(pointer, pointer + 4);
            }
            return ifd_dict;
          },
          convert_value: function(val) {
            var data = null;
            var t3 = val[0];
            var length = val[1];
            var value = val[2];
            var pointer;
            if (t3 == 1) {
              if (length > 4) {
                pointer = unpack(this.endian_mark + "L", value)[0];
                data = unpack(
                  this.endian_mark + nStr("B", length),
                  this.tiftag.slice(pointer, pointer + length)
                );
              } else {
                data = unpack(this.endian_mark + nStr("B", length), value.slice(0, length));
              }
            } else if (t3 == 2) {
              if (length > 4) {
                pointer = unpack(this.endian_mark + "L", value)[0];
                data = this.tiftag.slice(pointer, pointer + length - 1);
              } else {
                data = value.slice(0, length - 1);
              }
            } else if (t3 == 3) {
              if (length > 2) {
                pointer = unpack(this.endian_mark + "L", value)[0];
                data = unpack(
                  this.endian_mark + nStr("H", length),
                  this.tiftag.slice(pointer, pointer + length * 2)
                );
              } else {
                data = unpack(
                  this.endian_mark + nStr("H", length),
                  value.slice(0, length * 2)
                );
              }
            } else if (t3 == 4) {
              if (length > 1) {
                pointer = unpack(this.endian_mark + "L", value)[0];
                data = unpack(
                  this.endian_mark + nStr("L", length),
                  this.tiftag.slice(pointer, pointer + length * 4)
                );
              } else {
                data = unpack(
                  this.endian_mark + nStr("L", length),
                  value
                );
              }
            } else if (t3 == 5) {
              pointer = unpack(this.endian_mark + "L", value)[0];
              if (length > 1) {
                data = [];
                for (var x2 = 0; x2 < length; x2++) {
                  data.push([
                    unpack(
                      this.endian_mark + "L",
                      this.tiftag.slice(pointer + x2 * 8, pointer + 4 + x2 * 8)
                    )[0],
                    unpack(
                      this.endian_mark + "L",
                      this.tiftag.slice(pointer + 4 + x2 * 8, pointer + 8 + x2 * 8)
                    )[0]
                  ]);
                }
              } else {
                data = [
                  unpack(
                    this.endian_mark + "L",
                    this.tiftag.slice(pointer, pointer + 4)
                  )[0],
                  unpack(
                    this.endian_mark + "L",
                    this.tiftag.slice(pointer + 4, pointer + 8)
                  )[0]
                ];
              }
            } else if (t3 == 7) {
              if (length > 4) {
                pointer = unpack(this.endian_mark + "L", value)[0];
                data = this.tiftag.slice(pointer, pointer + length);
              } else {
                data = value.slice(0, length);
              }
            } else if (t3 == 9) {
              if (length > 1) {
                pointer = unpack(this.endian_mark + "L", value)[0];
                data = unpack(
                  this.endian_mark + nStr("l", length),
                  this.tiftag.slice(pointer, pointer + length * 4)
                );
              } else {
                data = unpack(
                  this.endian_mark + nStr("l", length),
                  value
                );
              }
            } else if (t3 == 10) {
              pointer = unpack(this.endian_mark + "L", value)[0];
              if (length > 1) {
                data = [];
                for (var x2 = 0; x2 < length; x2++) {
                  data.push([
                    unpack(
                      this.endian_mark + "l",
                      this.tiftag.slice(pointer + x2 * 8, pointer + 4 + x2 * 8)
                    )[0],
                    unpack(
                      this.endian_mark + "l",
                      this.tiftag.slice(pointer + 4 + x2 * 8, pointer + 8 + x2 * 8)
                    )[0]
                  ]);
                }
              } else {
                data = [
                  unpack(
                    this.endian_mark + "l",
                    this.tiftag.slice(pointer, pointer + 4)
                  )[0],
                  unpack(
                    this.endian_mark + "l",
                    this.tiftag.slice(pointer + 4, pointer + 8)
                  )[0]
                ];
              }
            } else {
              throw new Error("Exif might be wrong. Got incorrect value type to decode. type:" + t3);
            }
            if (data instanceof Array && data.length == 1) {
              return data[0];
            } else {
              return data;
            }
          }
        };
        if (typeof window !== "undefined" && typeof window.btoa === "function") {
          var btoa = window.btoa;
        }
        if (typeof btoa === "undefined") {
          var btoa = function(input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i2 = 0;
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            while (i2 < input.length) {
              chr1 = input.charCodeAt(i2++);
              chr2 = input.charCodeAt(i2++);
              chr3 = input.charCodeAt(i2++);
              enc1 = chr1 >> 2;
              enc2 = (chr1 & 3) << 4 | chr2 >> 4;
              enc3 = (chr2 & 15) << 2 | chr3 >> 6;
              enc4 = chr3 & 63;
              if (isNaN(chr2)) {
                enc3 = enc4 = 64;
              } else if (isNaN(chr3)) {
                enc4 = 64;
              }
              output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
            }
            return output;
          };
        }
        if (typeof window !== "undefined" && typeof window.atob === "function") {
          var atob2 = window.atob;
        }
        if (typeof atob2 === "undefined") {
          var atob2 = function(input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i2 = 0;
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i2 < input.length) {
              enc1 = keyStr.indexOf(input.charAt(i2++));
              enc2 = keyStr.indexOf(input.charAt(i2++));
              enc3 = keyStr.indexOf(input.charAt(i2++));
              enc4 = keyStr.indexOf(input.charAt(i2++));
              chr1 = enc1 << 2 | enc2 >> 4;
              chr2 = (enc2 & 15) << 4 | enc3 >> 2;
              chr3 = (enc3 & 3) << 6 | enc4;
              output = output + String.fromCharCode(chr1);
              if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
              }
              if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
              }
            }
            return output;
          };
        }
        function getImageSize(imageArray) {
          var segments = slice2Segments(imageArray);
          var seg, width, height, SOF = [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207];
          for (var x2 = 0; x2 < segments.length; x2++) {
            seg = segments[x2];
            if (SOF.indexOf(seg[1]) >= 0) {
              height = seg[5] * 256 + seg[6];
              width = seg[7] * 256 + seg[8];
              break;
            }
          }
          return [width, height];
        }
        function pack(mark, array) {
          if (!(array instanceof Array)) {
            throw new Error("'pack' error. Got invalid type argument.");
          }
          if (mark.length - 1 != array.length) {
            throw new Error("'pack' error. " + (mark.length - 1) + " marks, " + array.length + " elements.");
          }
          var littleEndian;
          if (mark[0] == "<") {
            littleEndian = true;
          } else if (mark[0] == ">") {
            littleEndian = false;
          } else {
            throw new Error("");
          }
          var packed = "";
          var p2 = 1;
          var val = null;
          var c2 = null;
          var valStr = null;
          while (c2 = mark[p2]) {
            if (c2.toLowerCase() == "b") {
              val = array[p2 - 1];
              if (c2 == "b" && val < 0) {
                val += 256;
              }
              if (val > 255 || val < 0) {
                throw new Error("'pack' error.");
              } else {
                valStr = String.fromCharCode(val);
              }
            } else if (c2 == "H") {
              val = array[p2 - 1];
              if (val > 65535 || val < 0) {
                throw new Error("'pack' error.");
              } else {
                valStr = String.fromCharCode(Math.floor(val % 65536 / 256)) + String.fromCharCode(val % 256);
                if (littleEndian) {
                  valStr = valStr.split("").reverse().join("");
                }
              }
            } else if (c2.toLowerCase() == "l") {
              val = array[p2 - 1];
              if (c2 == "l" && val < 0) {
                val += 4294967296;
              }
              if (val > 4294967295 || val < 0) {
                throw new Error("'pack' error.");
              } else {
                valStr = String.fromCharCode(Math.floor(val / 16777216)) + String.fromCharCode(Math.floor(val % 16777216 / 65536)) + String.fromCharCode(Math.floor(val % 65536 / 256)) + String.fromCharCode(val % 256);
                if (littleEndian) {
                  valStr = valStr.split("").reverse().join("");
                }
              }
            } else {
              throw new Error("'pack' error.");
            }
            packed += valStr;
            p2 += 1;
          }
          return packed;
        }
        function unpack(mark, str) {
          if (typeof str != "string") {
            throw new Error("'unpack' error. Got invalid type argument.");
          }
          var l2 = 0;
          for (var markPointer = 1; markPointer < mark.length; markPointer++) {
            if (mark[markPointer].toLowerCase() == "b") {
              l2 += 1;
            } else if (mark[markPointer].toLowerCase() == "h") {
              l2 += 2;
            } else if (mark[markPointer].toLowerCase() == "l") {
              l2 += 4;
            } else {
              throw new Error("'unpack' error. Got invalid mark.");
            }
          }
          if (l2 != str.length) {
            throw new Error("'unpack' error. Mismatch between symbol and string length. " + l2 + ":" + str.length);
          }
          var littleEndian;
          if (mark[0] == "<") {
            littleEndian = true;
          } else if (mark[0] == ">") {
            littleEndian = false;
          } else {
            throw new Error("'unpack' error.");
          }
          var unpacked = [];
          var strPointer = 0;
          var p2 = 1;
          var val = null;
          var c2 = null;
          var length = null;
          var sliced = "";
          while (c2 = mark[p2]) {
            if (c2.toLowerCase() == "b") {
              length = 1;
              sliced = str.slice(strPointer, strPointer + length);
              val = sliced.charCodeAt(0);
              if (c2 == "b" && val >= 128) {
                val -= 256;
              }
            } else if (c2 == "H") {
              length = 2;
              sliced = str.slice(strPointer, strPointer + length);
              if (littleEndian) {
                sliced = sliced.split("").reverse().join("");
              }
              val = sliced.charCodeAt(0) * 256 + sliced.charCodeAt(1);
            } else if (c2.toLowerCase() == "l") {
              length = 4;
              sliced = str.slice(strPointer, strPointer + length);
              if (littleEndian) {
                sliced = sliced.split("").reverse().join("");
              }
              val = sliced.charCodeAt(0) * 16777216 + sliced.charCodeAt(1) * 65536 + sliced.charCodeAt(2) * 256 + sliced.charCodeAt(3);
              if (c2 == "l" && val >= 2147483648) {
                val -= 4294967296;
              }
            } else {
              throw new Error("'unpack' error. " + c2);
            }
            unpacked.push(val);
            strPointer += length;
            p2 += 1;
          }
          return unpacked;
        }
        function nStr(ch, num) {
          var str = "";
          for (var i2 = 0; i2 < num; i2++) {
            str += ch;
          }
          return str;
        }
        function splitIntoSegments(data) {
          if (data.slice(0, 2) != "\xFF\xD8") {
            throw new Error("Given data isn't JPEG.");
          }
          var head = 2;
          var segments = ["\xFF\xD8"];
          while (true) {
            if (data.slice(head, head + 2) == "\xFF\xDA") {
              segments.push(data.slice(head));
              break;
            } else {
              var length = unpack(">H", data.slice(head + 2, head + 4))[0];
              var endPoint = head + length + 2;
              segments.push(data.slice(head, endPoint));
              head = endPoint;
            }
            if (head >= data.length) {
              throw new Error("Wrong JPEG data.");
            }
          }
          return segments;
        }
        function getExifSeg(segments) {
          var seg;
          for (var i2 = 0; i2 < segments.length; i2++) {
            seg = segments[i2];
            if (seg.slice(0, 2) == "\xFF\xE1" && seg.slice(4, 10) == "Exif\0\0") {
              return seg;
            }
          }
          return null;
        }
        function mergeSegments(segments, exif) {
          var hasExifSegment = false;
          var additionalAPP1ExifSegments = [];
          segments.forEach(function(segment, i2) {
            if (segment.slice(0, 2) == "\xFF\xE1" && segment.slice(4, 10) == "Exif\0\0") {
              if (!hasExifSegment) {
                segments[i2] = exif;
                hasExifSegment = true;
              } else {
                additionalAPP1ExifSegments.unshift(i2);
              }
            }
          });
          additionalAPP1ExifSegments.forEach(function(segmentIndex) {
            segments.splice(segmentIndex, 1);
          });
          if (!hasExifSegment && exif) {
            segments = [segments[0], exif].concat(segments.slice(1));
          }
          return segments.join("");
        }
        function toHex(str) {
          var hexStr = "";
          for (var i2 = 0; i2 < str.length; i2++) {
            var h2 = str.charCodeAt(i2);
            var hex = (h2 < 10 ? "0" : "") + h2.toString(16);
            hexStr += hex + " ";
          }
          return hexStr;
        }
        var TYPES = {
          "Byte": 1,
          "Ascii": 2,
          "Short": 3,
          "Long": 4,
          "Rational": 5,
          "Undefined": 7,
          "SLong": 9,
          "SRational": 10
        };
        var TAGS = {
          "Image": {
            11: {
              "name": "ProcessingSoftware",
              "type": "Ascii"
            },
            254: {
              "name": "NewSubfileType",
              "type": "Long"
            },
            255: {
              "name": "SubfileType",
              "type": "Short"
            },
            256: {
              "name": "ImageWidth",
              "type": "Long"
            },
            257: {
              "name": "ImageLength",
              "type": "Long"
            },
            258: {
              "name": "BitsPerSample",
              "type": "Short"
            },
            259: {
              "name": "Compression",
              "type": "Short"
            },
            262: {
              "name": "PhotometricInterpretation",
              "type": "Short"
            },
            263: {
              "name": "Threshholding",
              "type": "Short"
            },
            264: {
              "name": "CellWidth",
              "type": "Short"
            },
            265: {
              "name": "CellLength",
              "type": "Short"
            },
            266: {
              "name": "FillOrder",
              "type": "Short"
            },
            269: {
              "name": "DocumentName",
              "type": "Ascii"
            },
            270: {
              "name": "ImageDescription",
              "type": "Ascii"
            },
            271: {
              "name": "Make",
              "type": "Ascii"
            },
            272: {
              "name": "Model",
              "type": "Ascii"
            },
            273: {
              "name": "StripOffsets",
              "type": "Long"
            },
            274: {
              "name": "Orientation",
              "type": "Short"
            },
            277: {
              "name": "SamplesPerPixel",
              "type": "Short"
            },
            278: {
              "name": "RowsPerStrip",
              "type": "Long"
            },
            279: {
              "name": "StripByteCounts",
              "type": "Long"
            },
            282: {
              "name": "XResolution",
              "type": "Rational"
            },
            283: {
              "name": "YResolution",
              "type": "Rational"
            },
            284: {
              "name": "PlanarConfiguration",
              "type": "Short"
            },
            290: {
              "name": "GrayResponseUnit",
              "type": "Short"
            },
            291: {
              "name": "GrayResponseCurve",
              "type": "Short"
            },
            292: {
              "name": "T4Options",
              "type": "Long"
            },
            293: {
              "name": "T6Options",
              "type": "Long"
            },
            296: {
              "name": "ResolutionUnit",
              "type": "Short"
            },
            301: {
              "name": "TransferFunction",
              "type": "Short"
            },
            305: {
              "name": "Software",
              "type": "Ascii"
            },
            306: {
              "name": "DateTime",
              "type": "Ascii"
            },
            315: {
              "name": "Artist",
              "type": "Ascii"
            },
            316: {
              "name": "HostComputer",
              "type": "Ascii"
            },
            317: {
              "name": "Predictor",
              "type": "Short"
            },
            318: {
              "name": "WhitePoint",
              "type": "Rational"
            },
            319: {
              "name": "PrimaryChromaticities",
              "type": "Rational"
            },
            320: {
              "name": "ColorMap",
              "type": "Short"
            },
            321: {
              "name": "HalftoneHints",
              "type": "Short"
            },
            322: {
              "name": "TileWidth",
              "type": "Short"
            },
            323: {
              "name": "TileLength",
              "type": "Short"
            },
            324: {
              "name": "TileOffsets",
              "type": "Short"
            },
            325: {
              "name": "TileByteCounts",
              "type": "Short"
            },
            330: {
              "name": "SubIFDs",
              "type": "Long"
            },
            332: {
              "name": "InkSet",
              "type": "Short"
            },
            333: {
              "name": "InkNames",
              "type": "Ascii"
            },
            334: {
              "name": "NumberOfInks",
              "type": "Short"
            },
            336: {
              "name": "DotRange",
              "type": "Byte"
            },
            337: {
              "name": "TargetPrinter",
              "type": "Ascii"
            },
            338: {
              "name": "ExtraSamples",
              "type": "Short"
            },
            339: {
              "name": "SampleFormat",
              "type": "Short"
            },
            340: {
              "name": "SMinSampleValue",
              "type": "Short"
            },
            341: {
              "name": "SMaxSampleValue",
              "type": "Short"
            },
            342: {
              "name": "TransferRange",
              "type": "Short"
            },
            343: {
              "name": "ClipPath",
              "type": "Byte"
            },
            344: {
              "name": "XClipPathUnits",
              "type": "Long"
            },
            345: {
              "name": "YClipPathUnits",
              "type": "Long"
            },
            346: {
              "name": "Indexed",
              "type": "Short"
            },
            347: {
              "name": "JPEGTables",
              "type": "Undefined"
            },
            351: {
              "name": "OPIProxy",
              "type": "Short"
            },
            512: {
              "name": "JPEGProc",
              "type": "Long"
            },
            513: {
              "name": "JPEGInterchangeFormat",
              "type": "Long"
            },
            514: {
              "name": "JPEGInterchangeFormatLength",
              "type": "Long"
            },
            515: {
              "name": "JPEGRestartInterval",
              "type": "Short"
            },
            517: {
              "name": "JPEGLosslessPredictors",
              "type": "Short"
            },
            518: {
              "name": "JPEGPointTransforms",
              "type": "Short"
            },
            519: {
              "name": "JPEGQTables",
              "type": "Long"
            },
            520: {
              "name": "JPEGDCTables",
              "type": "Long"
            },
            521: {
              "name": "JPEGACTables",
              "type": "Long"
            },
            529: {
              "name": "YCbCrCoefficients",
              "type": "Rational"
            },
            530: {
              "name": "YCbCrSubSampling",
              "type": "Short"
            },
            531: {
              "name": "YCbCrPositioning",
              "type": "Short"
            },
            532: {
              "name": "ReferenceBlackWhite",
              "type": "Rational"
            },
            700: {
              "name": "XMLPacket",
              "type": "Byte"
            },
            18246: {
              "name": "Rating",
              "type": "Short"
            },
            18249: {
              "name": "RatingPercent",
              "type": "Short"
            },
            32781: {
              "name": "ImageID",
              "type": "Ascii"
            },
            33421: {
              "name": "CFARepeatPatternDim",
              "type": "Short"
            },
            33422: {
              "name": "CFAPattern",
              "type": "Byte"
            },
            33423: {
              "name": "BatteryLevel",
              "type": "Rational"
            },
            33432: {
              "name": "Copyright",
              "type": "Ascii"
            },
            33434: {
              "name": "ExposureTime",
              "type": "Rational"
            },
            34377: {
              "name": "ImageResources",
              "type": "Byte"
            },
            34665: {
              "name": "ExifTag",
              "type": "Long"
            },
            34675: {
              "name": "InterColorProfile",
              "type": "Undefined"
            },
            34853: {
              "name": "GPSTag",
              "type": "Long"
            },
            34857: {
              "name": "Interlace",
              "type": "Short"
            },
            34858: {
              "name": "TimeZoneOffset",
              "type": "Long"
            },
            34859: {
              "name": "SelfTimerMode",
              "type": "Short"
            },
            37387: {
              "name": "FlashEnergy",
              "type": "Rational"
            },
            37388: {
              "name": "SpatialFrequencyResponse",
              "type": "Undefined"
            },
            37389: {
              "name": "Noise",
              "type": "Undefined"
            },
            37390: {
              "name": "FocalPlaneXResolution",
              "type": "Rational"
            },
            37391: {
              "name": "FocalPlaneYResolution",
              "type": "Rational"
            },
            37392: {
              "name": "FocalPlaneResolutionUnit",
              "type": "Short"
            },
            37393: {
              "name": "ImageNumber",
              "type": "Long"
            },
            37394: {
              "name": "SecurityClassification",
              "type": "Ascii"
            },
            37395: {
              "name": "ImageHistory",
              "type": "Ascii"
            },
            37397: {
              "name": "ExposureIndex",
              "type": "Rational"
            },
            37398: {
              "name": "TIFFEPStandardID",
              "type": "Byte"
            },
            37399: {
              "name": "SensingMethod",
              "type": "Short"
            },
            40091: {
              "name": "XPTitle",
              "type": "Byte"
            },
            40092: {
              "name": "XPComment",
              "type": "Byte"
            },
            40093: {
              "name": "XPAuthor",
              "type": "Byte"
            },
            40094: {
              "name": "XPKeywords",
              "type": "Byte"
            },
            40095: {
              "name": "XPSubject",
              "type": "Byte"
            },
            50341: {
              "name": "PrintImageMatching",
              "type": "Undefined"
            },
            50706: {
              "name": "DNGVersion",
              "type": "Byte"
            },
            50707: {
              "name": "DNGBackwardVersion",
              "type": "Byte"
            },
            50708: {
              "name": "UniqueCameraModel",
              "type": "Ascii"
            },
            50709: {
              "name": "LocalizedCameraModel",
              "type": "Byte"
            },
            50710: {
              "name": "CFAPlaneColor",
              "type": "Byte"
            },
            50711: {
              "name": "CFALayout",
              "type": "Short"
            },
            50712: {
              "name": "LinearizationTable",
              "type": "Short"
            },
            50713: {
              "name": "BlackLevelRepeatDim",
              "type": "Short"
            },
            50714: {
              "name": "BlackLevel",
              "type": "Rational"
            },
            50715: {
              "name": "BlackLevelDeltaH",
              "type": "SRational"
            },
            50716: {
              "name": "BlackLevelDeltaV",
              "type": "SRational"
            },
            50717: {
              "name": "WhiteLevel",
              "type": "Short"
            },
            50718: {
              "name": "DefaultScale",
              "type": "Rational"
            },
            50719: {
              "name": "DefaultCropOrigin",
              "type": "Short"
            },
            50720: {
              "name": "DefaultCropSize",
              "type": "Short"
            },
            50721: {
              "name": "ColorMatrix1",
              "type": "SRational"
            },
            50722: {
              "name": "ColorMatrix2",
              "type": "SRational"
            },
            50723: {
              "name": "CameraCalibration1",
              "type": "SRational"
            },
            50724: {
              "name": "CameraCalibration2",
              "type": "SRational"
            },
            50725: {
              "name": "ReductionMatrix1",
              "type": "SRational"
            },
            50726: {
              "name": "ReductionMatrix2",
              "type": "SRational"
            },
            50727: {
              "name": "AnalogBalance",
              "type": "Rational"
            },
            50728: {
              "name": "AsShotNeutral",
              "type": "Short"
            },
            50729: {
              "name": "AsShotWhiteXY",
              "type": "Rational"
            },
            50730: {
              "name": "BaselineExposure",
              "type": "SRational"
            },
            50731: {
              "name": "BaselineNoise",
              "type": "Rational"
            },
            50732: {
              "name": "BaselineSharpness",
              "type": "Rational"
            },
            50733: {
              "name": "BayerGreenSplit",
              "type": "Long"
            },
            50734: {
              "name": "LinearResponseLimit",
              "type": "Rational"
            },
            50735: {
              "name": "CameraSerialNumber",
              "type": "Ascii"
            },
            50736: {
              "name": "LensInfo",
              "type": "Rational"
            },
            50737: {
              "name": "ChromaBlurRadius",
              "type": "Rational"
            },
            50738: {
              "name": "AntiAliasStrength",
              "type": "Rational"
            },
            50739: {
              "name": "ShadowScale",
              "type": "SRational"
            },
            50740: {
              "name": "DNGPrivateData",
              "type": "Byte"
            },
            50741: {
              "name": "MakerNoteSafety",
              "type": "Short"
            },
            50778: {
              "name": "CalibrationIlluminant1",
              "type": "Short"
            },
            50779: {
              "name": "CalibrationIlluminant2",
              "type": "Short"
            },
            50780: {
              "name": "BestQualityScale",
              "type": "Rational"
            },
            50781: {
              "name": "RawDataUniqueID",
              "type": "Byte"
            },
            50827: {
              "name": "OriginalRawFileName",
              "type": "Byte"
            },
            50828: {
              "name": "OriginalRawFileData",
              "type": "Undefined"
            },
            50829: {
              "name": "ActiveArea",
              "type": "Short"
            },
            50830: {
              "name": "MaskedAreas",
              "type": "Short"
            },
            50831: {
              "name": "AsShotICCProfile",
              "type": "Undefined"
            },
            50832: {
              "name": "AsShotPreProfileMatrix",
              "type": "SRational"
            },
            50833: {
              "name": "CurrentICCProfile",
              "type": "Undefined"
            },
            50834: {
              "name": "CurrentPreProfileMatrix",
              "type": "SRational"
            },
            50879: {
              "name": "ColorimetricReference",
              "type": "Short"
            },
            50931: {
              "name": "CameraCalibrationSignature",
              "type": "Byte"
            },
            50932: {
              "name": "ProfileCalibrationSignature",
              "type": "Byte"
            },
            50934: {
              "name": "AsShotProfileName",
              "type": "Byte"
            },
            50935: {
              "name": "NoiseReductionApplied",
              "type": "Rational"
            },
            50936: {
              "name": "ProfileName",
              "type": "Byte"
            },
            50937: {
              "name": "ProfileHueSatMapDims",
              "type": "Long"
            },
            50938: {
              "name": "ProfileHueSatMapData1",
              "type": "Float"
            },
            50939: {
              "name": "ProfileHueSatMapData2",
              "type": "Float"
            },
            50940: {
              "name": "ProfileToneCurve",
              "type": "Float"
            },
            50941: {
              "name": "ProfileEmbedPolicy",
              "type": "Long"
            },
            50942: {
              "name": "ProfileCopyright",
              "type": "Byte"
            },
            50964: {
              "name": "ForwardMatrix1",
              "type": "SRational"
            },
            50965: {
              "name": "ForwardMatrix2",
              "type": "SRational"
            },
            50966: {
              "name": "PreviewApplicationName",
              "type": "Byte"
            },
            50967: {
              "name": "PreviewApplicationVersion",
              "type": "Byte"
            },
            50968: {
              "name": "PreviewSettingsName",
              "type": "Byte"
            },
            50969: {
              "name": "PreviewSettingsDigest",
              "type": "Byte"
            },
            50970: {
              "name": "PreviewColorSpace",
              "type": "Long"
            },
            50971: {
              "name": "PreviewDateTime",
              "type": "Ascii"
            },
            50972: {
              "name": "RawImageDigest",
              "type": "Undefined"
            },
            50973: {
              "name": "OriginalRawFileDigest",
              "type": "Undefined"
            },
            50974: {
              "name": "SubTileBlockSize",
              "type": "Long"
            },
            50975: {
              "name": "RowInterleaveFactor",
              "type": "Long"
            },
            50981: {
              "name": "ProfileLookTableDims",
              "type": "Long"
            },
            50982: {
              "name": "ProfileLookTableData",
              "type": "Float"
            },
            51008: {
              "name": "OpcodeList1",
              "type": "Undefined"
            },
            51009: {
              "name": "OpcodeList2",
              "type": "Undefined"
            },
            51022: {
              "name": "OpcodeList3",
              "type": "Undefined"
            }
          },
          "Exif": {
            33434: {
              "name": "ExposureTime",
              "type": "Rational"
            },
            33437: {
              "name": "FNumber",
              "type": "Rational"
            },
            34850: {
              "name": "ExposureProgram",
              "type": "Short"
            },
            34852: {
              "name": "SpectralSensitivity",
              "type": "Ascii"
            },
            34855: {
              "name": "ISOSpeedRatings",
              "type": "Short"
            },
            34856: {
              "name": "OECF",
              "type": "Undefined"
            },
            34864: {
              "name": "SensitivityType",
              "type": "Short"
            },
            34865: {
              "name": "StandardOutputSensitivity",
              "type": "Long"
            },
            34866: {
              "name": "RecommendedExposureIndex",
              "type": "Long"
            },
            34867: {
              "name": "ISOSpeed",
              "type": "Long"
            },
            34868: {
              "name": "ISOSpeedLatitudeyyy",
              "type": "Long"
            },
            34869: {
              "name": "ISOSpeedLatitudezzz",
              "type": "Long"
            },
            36864: {
              "name": "ExifVersion",
              "type": "Undefined"
            },
            36867: {
              "name": "DateTimeOriginal",
              "type": "Ascii"
            },
            36868: {
              "name": "DateTimeDigitized",
              "type": "Ascii"
            },
            37121: {
              "name": "ComponentsConfiguration",
              "type": "Undefined"
            },
            37122: {
              "name": "CompressedBitsPerPixel",
              "type": "Rational"
            },
            37377: {
              "name": "ShutterSpeedValue",
              "type": "SRational"
            },
            37378: {
              "name": "ApertureValue",
              "type": "Rational"
            },
            37379: {
              "name": "BrightnessValue",
              "type": "SRational"
            },
            37380: {
              "name": "ExposureBiasValue",
              "type": "SRational"
            },
            37381: {
              "name": "MaxApertureValue",
              "type": "Rational"
            },
            37382: {
              "name": "SubjectDistance",
              "type": "Rational"
            },
            37383: {
              "name": "MeteringMode",
              "type": "Short"
            },
            37384: {
              "name": "LightSource",
              "type": "Short"
            },
            37385: {
              "name": "Flash",
              "type": "Short"
            },
            37386: {
              "name": "FocalLength",
              "type": "Rational"
            },
            37396: {
              "name": "SubjectArea",
              "type": "Short"
            },
            37500: {
              "name": "MakerNote",
              "type": "Undefined"
            },
            37510: {
              "name": "UserComment",
              "type": "Ascii"
            },
            37520: {
              "name": "SubSecTime",
              "type": "Ascii"
            },
            37521: {
              "name": "SubSecTimeOriginal",
              "type": "Ascii"
            },
            37522: {
              "name": "SubSecTimeDigitized",
              "type": "Ascii"
            },
            40960: {
              "name": "FlashpixVersion",
              "type": "Undefined"
            },
            40961: {
              "name": "ColorSpace",
              "type": "Short"
            },
            40962: {
              "name": "PixelXDimension",
              "type": "Long"
            },
            40963: {
              "name": "PixelYDimension",
              "type": "Long"
            },
            40964: {
              "name": "RelatedSoundFile",
              "type": "Ascii"
            },
            40965: {
              "name": "InteroperabilityTag",
              "type": "Long"
            },
            41483: {
              "name": "FlashEnergy",
              "type": "Rational"
            },
            41484: {
              "name": "SpatialFrequencyResponse",
              "type": "Undefined"
            },
            41486: {
              "name": "FocalPlaneXResolution",
              "type": "Rational"
            },
            41487: {
              "name": "FocalPlaneYResolution",
              "type": "Rational"
            },
            41488: {
              "name": "FocalPlaneResolutionUnit",
              "type": "Short"
            },
            41492: {
              "name": "SubjectLocation",
              "type": "Short"
            },
            41493: {
              "name": "ExposureIndex",
              "type": "Rational"
            },
            41495: {
              "name": "SensingMethod",
              "type": "Short"
            },
            41728: {
              "name": "FileSource",
              "type": "Undefined"
            },
            41729: {
              "name": "SceneType",
              "type": "Undefined"
            },
            41730: {
              "name": "CFAPattern",
              "type": "Undefined"
            },
            41985: {
              "name": "CustomRendered",
              "type": "Short"
            },
            41986: {
              "name": "ExposureMode",
              "type": "Short"
            },
            41987: {
              "name": "WhiteBalance",
              "type": "Short"
            },
            41988: {
              "name": "DigitalZoomRatio",
              "type": "Rational"
            },
            41989: {
              "name": "FocalLengthIn35mmFilm",
              "type": "Short"
            },
            41990: {
              "name": "SceneCaptureType",
              "type": "Short"
            },
            41991: {
              "name": "GainControl",
              "type": "Short"
            },
            41992: {
              "name": "Contrast",
              "type": "Short"
            },
            41993: {
              "name": "Saturation",
              "type": "Short"
            },
            41994: {
              "name": "Sharpness",
              "type": "Short"
            },
            41995: {
              "name": "DeviceSettingDescription",
              "type": "Undefined"
            },
            41996: {
              "name": "SubjectDistanceRange",
              "type": "Short"
            },
            42016: {
              "name": "ImageUniqueID",
              "type": "Ascii"
            },
            42032: {
              "name": "CameraOwnerName",
              "type": "Ascii"
            },
            42033: {
              "name": "BodySerialNumber",
              "type": "Ascii"
            },
            42034: {
              "name": "LensSpecification",
              "type": "Rational"
            },
            42035: {
              "name": "LensMake",
              "type": "Ascii"
            },
            42036: {
              "name": "LensModel",
              "type": "Ascii"
            },
            42037: {
              "name": "LensSerialNumber",
              "type": "Ascii"
            },
            42240: {
              "name": "Gamma",
              "type": "Rational"
            }
          },
          "GPS": {
            0: {
              "name": "GPSVersionID",
              "type": "Byte"
            },
            1: {
              "name": "GPSLatitudeRef",
              "type": "Ascii"
            },
            2: {
              "name": "GPSLatitude",
              "type": "Rational"
            },
            3: {
              "name": "GPSLongitudeRef",
              "type": "Ascii"
            },
            4: {
              "name": "GPSLongitude",
              "type": "Rational"
            },
            5: {
              "name": "GPSAltitudeRef",
              "type": "Byte"
            },
            6: {
              "name": "GPSAltitude",
              "type": "Rational"
            },
            7: {
              "name": "GPSTimeStamp",
              "type": "Rational"
            },
            8: {
              "name": "GPSSatellites",
              "type": "Ascii"
            },
            9: {
              "name": "GPSStatus",
              "type": "Ascii"
            },
            10: {
              "name": "GPSMeasureMode",
              "type": "Ascii"
            },
            11: {
              "name": "GPSDOP",
              "type": "Rational"
            },
            12: {
              "name": "GPSSpeedRef",
              "type": "Ascii"
            },
            13: {
              "name": "GPSSpeed",
              "type": "Rational"
            },
            14: {
              "name": "GPSTrackRef",
              "type": "Ascii"
            },
            15: {
              "name": "GPSTrack",
              "type": "Rational"
            },
            16: {
              "name": "GPSImgDirectionRef",
              "type": "Ascii"
            },
            17: {
              "name": "GPSImgDirection",
              "type": "Rational"
            },
            18: {
              "name": "GPSMapDatum",
              "type": "Ascii"
            },
            19: {
              "name": "GPSDestLatitudeRef",
              "type": "Ascii"
            },
            20: {
              "name": "GPSDestLatitude",
              "type": "Rational"
            },
            21: {
              "name": "GPSDestLongitudeRef",
              "type": "Ascii"
            },
            22: {
              "name": "GPSDestLongitude",
              "type": "Rational"
            },
            23: {
              "name": "GPSDestBearingRef",
              "type": "Ascii"
            },
            24: {
              "name": "GPSDestBearing",
              "type": "Rational"
            },
            25: {
              "name": "GPSDestDistanceRef",
              "type": "Ascii"
            },
            26: {
              "name": "GPSDestDistance",
              "type": "Rational"
            },
            27: {
              "name": "GPSProcessingMethod",
              "type": "Undefined"
            },
            28: {
              "name": "GPSAreaInformation",
              "type": "Undefined"
            },
            29: {
              "name": "GPSDateStamp",
              "type": "Ascii"
            },
            30: {
              "name": "GPSDifferential",
              "type": "Short"
            },
            31: {
              "name": "GPSHPositioningError",
              "type": "Rational"
            }
          },
          "Interop": {
            1: {
              "name": "InteroperabilityIndex",
              "type": "Ascii"
            }
          }
        };
        TAGS["0th"] = TAGS["Image"];
        TAGS["1st"] = TAGS["Image"];
        that.TAGS = TAGS;
        that.ImageIFD = {
          ProcessingSoftware: 11,
          NewSubfileType: 254,
          SubfileType: 255,
          ImageWidth: 256,
          ImageLength: 257,
          BitsPerSample: 258,
          Compression: 259,
          PhotometricInterpretation: 262,
          Threshholding: 263,
          CellWidth: 264,
          CellLength: 265,
          FillOrder: 266,
          DocumentName: 269,
          ImageDescription: 270,
          Make: 271,
          Model: 272,
          StripOffsets: 273,
          Orientation: 274,
          SamplesPerPixel: 277,
          RowsPerStrip: 278,
          StripByteCounts: 279,
          XResolution: 282,
          YResolution: 283,
          PlanarConfiguration: 284,
          GrayResponseUnit: 290,
          GrayResponseCurve: 291,
          T4Options: 292,
          T6Options: 293,
          ResolutionUnit: 296,
          TransferFunction: 301,
          Software: 305,
          DateTime: 306,
          Artist: 315,
          HostComputer: 316,
          Predictor: 317,
          WhitePoint: 318,
          PrimaryChromaticities: 319,
          ColorMap: 320,
          HalftoneHints: 321,
          TileWidth: 322,
          TileLength: 323,
          TileOffsets: 324,
          TileByteCounts: 325,
          SubIFDs: 330,
          InkSet: 332,
          InkNames: 333,
          NumberOfInks: 334,
          DotRange: 336,
          TargetPrinter: 337,
          ExtraSamples: 338,
          SampleFormat: 339,
          SMinSampleValue: 340,
          SMaxSampleValue: 341,
          TransferRange: 342,
          ClipPath: 343,
          XClipPathUnits: 344,
          YClipPathUnits: 345,
          Indexed: 346,
          JPEGTables: 347,
          OPIProxy: 351,
          JPEGProc: 512,
          JPEGInterchangeFormat: 513,
          JPEGInterchangeFormatLength: 514,
          JPEGRestartInterval: 515,
          JPEGLosslessPredictors: 517,
          JPEGPointTransforms: 518,
          JPEGQTables: 519,
          JPEGDCTables: 520,
          JPEGACTables: 521,
          YCbCrCoefficients: 529,
          YCbCrSubSampling: 530,
          YCbCrPositioning: 531,
          ReferenceBlackWhite: 532,
          XMLPacket: 700,
          Rating: 18246,
          RatingPercent: 18249,
          ImageID: 32781,
          CFARepeatPatternDim: 33421,
          CFAPattern: 33422,
          BatteryLevel: 33423,
          Copyright: 33432,
          ExposureTime: 33434,
          ImageResources: 34377,
          ExifTag: 34665,
          InterColorProfile: 34675,
          GPSTag: 34853,
          Interlace: 34857,
          TimeZoneOffset: 34858,
          SelfTimerMode: 34859,
          FlashEnergy: 37387,
          SpatialFrequencyResponse: 37388,
          Noise: 37389,
          FocalPlaneXResolution: 37390,
          FocalPlaneYResolution: 37391,
          FocalPlaneResolutionUnit: 37392,
          ImageNumber: 37393,
          SecurityClassification: 37394,
          ImageHistory: 37395,
          ExposureIndex: 37397,
          TIFFEPStandardID: 37398,
          SensingMethod: 37399,
          XPTitle: 40091,
          XPComment: 40092,
          XPAuthor: 40093,
          XPKeywords: 40094,
          XPSubject: 40095,
          PrintImageMatching: 50341,
          DNGVersion: 50706,
          DNGBackwardVersion: 50707,
          UniqueCameraModel: 50708,
          LocalizedCameraModel: 50709,
          CFAPlaneColor: 50710,
          CFALayout: 50711,
          LinearizationTable: 50712,
          BlackLevelRepeatDim: 50713,
          BlackLevel: 50714,
          BlackLevelDeltaH: 50715,
          BlackLevelDeltaV: 50716,
          WhiteLevel: 50717,
          DefaultScale: 50718,
          DefaultCropOrigin: 50719,
          DefaultCropSize: 50720,
          ColorMatrix1: 50721,
          ColorMatrix2: 50722,
          CameraCalibration1: 50723,
          CameraCalibration2: 50724,
          ReductionMatrix1: 50725,
          ReductionMatrix2: 50726,
          AnalogBalance: 50727,
          AsShotNeutral: 50728,
          AsShotWhiteXY: 50729,
          BaselineExposure: 50730,
          BaselineNoise: 50731,
          BaselineSharpness: 50732,
          BayerGreenSplit: 50733,
          LinearResponseLimit: 50734,
          CameraSerialNumber: 50735,
          LensInfo: 50736,
          ChromaBlurRadius: 50737,
          AntiAliasStrength: 50738,
          ShadowScale: 50739,
          DNGPrivateData: 50740,
          MakerNoteSafety: 50741,
          CalibrationIlluminant1: 50778,
          CalibrationIlluminant2: 50779,
          BestQualityScale: 50780,
          RawDataUniqueID: 50781,
          OriginalRawFileName: 50827,
          OriginalRawFileData: 50828,
          ActiveArea: 50829,
          MaskedAreas: 50830,
          AsShotICCProfile: 50831,
          AsShotPreProfileMatrix: 50832,
          CurrentICCProfile: 50833,
          CurrentPreProfileMatrix: 50834,
          ColorimetricReference: 50879,
          CameraCalibrationSignature: 50931,
          ProfileCalibrationSignature: 50932,
          AsShotProfileName: 50934,
          NoiseReductionApplied: 50935,
          ProfileName: 50936,
          ProfileHueSatMapDims: 50937,
          ProfileHueSatMapData1: 50938,
          ProfileHueSatMapData2: 50939,
          ProfileToneCurve: 50940,
          ProfileEmbedPolicy: 50941,
          ProfileCopyright: 50942,
          ForwardMatrix1: 50964,
          ForwardMatrix2: 50965,
          PreviewApplicationName: 50966,
          PreviewApplicationVersion: 50967,
          PreviewSettingsName: 50968,
          PreviewSettingsDigest: 50969,
          PreviewColorSpace: 50970,
          PreviewDateTime: 50971,
          RawImageDigest: 50972,
          OriginalRawFileDigest: 50973,
          SubTileBlockSize: 50974,
          RowInterleaveFactor: 50975,
          ProfileLookTableDims: 50981,
          ProfileLookTableData: 50982,
          OpcodeList1: 51008,
          OpcodeList2: 51009,
          OpcodeList3: 51022,
          NoiseProfile: 51041
        };
        that.ExifIFD = {
          ExposureTime: 33434,
          FNumber: 33437,
          ExposureProgram: 34850,
          SpectralSensitivity: 34852,
          ISOSpeedRatings: 34855,
          OECF: 34856,
          SensitivityType: 34864,
          StandardOutputSensitivity: 34865,
          RecommendedExposureIndex: 34866,
          ISOSpeed: 34867,
          ISOSpeedLatitudeyyy: 34868,
          ISOSpeedLatitudezzz: 34869,
          ExifVersion: 36864,
          DateTimeOriginal: 36867,
          DateTimeDigitized: 36868,
          ComponentsConfiguration: 37121,
          CompressedBitsPerPixel: 37122,
          ShutterSpeedValue: 37377,
          ApertureValue: 37378,
          BrightnessValue: 37379,
          ExposureBiasValue: 37380,
          MaxApertureValue: 37381,
          SubjectDistance: 37382,
          MeteringMode: 37383,
          LightSource: 37384,
          Flash: 37385,
          FocalLength: 37386,
          SubjectArea: 37396,
          MakerNote: 37500,
          UserComment: 37510,
          SubSecTime: 37520,
          SubSecTimeOriginal: 37521,
          SubSecTimeDigitized: 37522,
          FlashpixVersion: 40960,
          ColorSpace: 40961,
          PixelXDimension: 40962,
          PixelYDimension: 40963,
          RelatedSoundFile: 40964,
          InteroperabilityTag: 40965,
          FlashEnergy: 41483,
          SpatialFrequencyResponse: 41484,
          FocalPlaneXResolution: 41486,
          FocalPlaneYResolution: 41487,
          FocalPlaneResolutionUnit: 41488,
          SubjectLocation: 41492,
          ExposureIndex: 41493,
          SensingMethod: 41495,
          FileSource: 41728,
          SceneType: 41729,
          CFAPattern: 41730,
          CustomRendered: 41985,
          ExposureMode: 41986,
          WhiteBalance: 41987,
          DigitalZoomRatio: 41988,
          FocalLengthIn35mmFilm: 41989,
          SceneCaptureType: 41990,
          GainControl: 41991,
          Contrast: 41992,
          Saturation: 41993,
          Sharpness: 41994,
          DeviceSettingDescription: 41995,
          SubjectDistanceRange: 41996,
          ImageUniqueID: 42016,
          CameraOwnerName: 42032,
          BodySerialNumber: 42033,
          LensSpecification: 42034,
          LensMake: 42035,
          LensModel: 42036,
          LensSerialNumber: 42037,
          Gamma: 42240
        };
        that.GPSIFD = {
          GPSVersionID: 0,
          GPSLatitudeRef: 1,
          GPSLatitude: 2,
          GPSLongitudeRef: 3,
          GPSLongitude: 4,
          GPSAltitudeRef: 5,
          GPSAltitude: 6,
          GPSTimeStamp: 7,
          GPSSatellites: 8,
          GPSStatus: 9,
          GPSMeasureMode: 10,
          GPSDOP: 11,
          GPSSpeedRef: 12,
          GPSSpeed: 13,
          GPSTrackRef: 14,
          GPSTrack: 15,
          GPSImgDirectionRef: 16,
          GPSImgDirection: 17,
          GPSMapDatum: 18,
          GPSDestLatitudeRef: 19,
          GPSDestLatitude: 20,
          GPSDestLongitudeRef: 21,
          GPSDestLongitude: 22,
          GPSDestBearingRef: 23,
          GPSDestBearing: 24,
          GPSDestDistanceRef: 25,
          GPSDestDistance: 26,
          GPSProcessingMethod: 27,
          GPSAreaInformation: 28,
          GPSDateStamp: 29,
          GPSDifferential: 30,
          GPSHPositioningError: 31
        };
        that.InteropIFD = {
          InteroperabilityIndex: 1
        };
        that.GPSHelper = {
          degToDmsRational: function(degFloat) {
            var degAbs = Math.abs(degFloat);
            var minFloat = degAbs % 1 * 60;
            var secFloat = minFloat % 1 * 60;
            var deg = Math.floor(degAbs);
            var min = Math.floor(minFloat);
            var sec = Math.round(secFloat * 100);
            return [[deg, 1], [min, 1], [sec, 100]];
          },
          dmsRationalToDeg: function(dmsArray, ref) {
            var sign = ref === "S" || ref === "W" ? -1 : 1;
            var deg = dmsArray[0][0] / dmsArray[0][1] + dmsArray[1][0] / dmsArray[1][1] / 60 + dmsArray[2][0] / dmsArray[2][1] / 3600;
            return deg * sign;
          }
        };
        if (typeof exports !== "undefined") {
          if (typeof module !== "undefined" && module.exports) {
            exports = module.exports = that;
          }
          exports.piexif = that;
        } else {
          window.piexif = that;
        }
      })();
    }
  });

  // src/convert.js
  async function loadPiexif() {
    return import_piexifjs.default;
  }
  function stripC2paJpeg(data) {
    if (data.length < 2 || data[0] !== 255 || data[1] !== 216) {
      return { bytes: data, removed: 0, totalBytes: 0 };
    }
    const out = [255, 216];
    let pos = 2, removed = 0, totalRemoved = 0;
    while (pos < data.length - 1) {
      if (data[pos] !== 255) {
        for (let i2 = pos; i2 < data.length; i2++) out.push(data[i2]);
        break;
      }
      const marker = data[pos + 1];
      if (marker === 218) {
        for (let i2 = pos; i2 < data.length; i2++) out.push(data[i2]);
        break;
      }
      if (pos + 4 > data.length) {
        for (let i2 = pos; i2 < data.length; i2++) out.push(data[i2]);
        break;
      }
      const segLen = data[pos + 2] << 8 | data[pos + 3];
      const segTotal = 2 + segLen;
      if (marker === 235) {
        removed++;
        totalRemoved += segTotal;
      } else {
        for (let i2 = pos; i2 < pos + segTotal && i2 < data.length; i2++) out.push(data[i2]);
      }
      pos += segTotal;
    }
    return { bytes: new Uint8Array(out), removed, totalBytes: totalRemoved };
  }
  function stripC2paPng(data) {
    if (data.length < 8) return { bytes: data, removed: 0, totalBytes: 0 };
    for (let i2 = 0; i2 < 8; i2++) if (data[i2] !== PNG_SIG[i2]) return { bytes: data, removed: 0, totalBytes: 0 };
    const out = Array.from(data.slice(0, 8));
    let pos = 8, removed = 0, totalRemoved = 0;
    while (pos + 8 <= data.length) {
      const chunkLen = (data[pos] << 24 | data[pos + 1] << 16 | data[pos + 2] << 8 | data[pos + 3]) >>> 0;
      const chunkType = String.fromCharCode(data[pos + 4], data[pos + 5], data[pos + 6], data[pos + 7]);
      const chunkTotal = 12 + chunkLen;
      if (PNG_C2PA_CHUNKS.includes(chunkType)) {
        removed++;
        totalRemoved += chunkTotal;
      } else {
        for (let i2 = pos; i2 < pos + chunkTotal && i2 < data.length; i2++) out.push(data[i2]);
      }
      pos += chunkTotal;
    }
    return { bytes: new Uint8Array(out), removed, totalBytes: totalRemoved };
  }
  function readExifOrientation(bytes) {
    if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return 1;
    let pos = 2;
    while (pos < bytes.length - 1) {
      if (bytes[pos] !== 255) break;
      const mk = bytes[pos + 1];
      if (mk === 218) break;
      const segLen = bytes[pos + 2] << 8 | bytes[pos + 3];
      if (mk === 225 && segLen > 8) {
        const hdr = String.fromCharCode(...bytes.slice(pos + 4, pos + 14));
        if (hdr.startsWith("Exif")) {
          const tiffOff = pos + 4 + 6;
          if (tiffOff + 8 > bytes.length) break;
          const big = bytes[tiffOff] === 77;
          const w2 = big ? (a2, o2) => a2[o2] << 8 | a2[o2 + 1] : (a2, o2) => a2[o2] | a2[o2 + 1] << 8;
          const ifd0Off = w2(bytes, tiffOff + 4) + tiffOff;
          const numEnt = w2(bytes, ifd0Off);
          for (let i2 = 0; i2 < numEnt; i2++) {
            const ent = ifd0Off + 2 + i2 * 12;
            if (ent + 12 > bytes.length) break;
            if (w2(bytes, ent) === 274) {
              return w2(bytes, ent + 8);
            }
          }
        }
        break;
      }
      pos += 2 + segLen;
    }
    return 1;
  }
  async function decodeToCanvas(bytes, mime) {
    const blob = new Blob([bytes], { type: mime });
    const bitmap = await createImageBitmap(blob);
    const orient = mime === "image/jpeg" ? readExifOrientation(bytes) : 1;
    const swap = orient >= 5 && orient <= 8;
    const canvas = document.createElement("canvas");
    canvas.width = swap ? bitmap.height : bitmap.width;
    canvas.height = swap ? bitmap.width : bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.save();
    switch (orient) {
      case 2:
        ctx.transform(-1, 0, 0, 1, canvas.width, 0);
        break;
      // flip H
      case 3:
        ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height);
        break;
      // rotate 180
      case 4:
        ctx.transform(1, 0, 0, -1, 0, canvas.height);
        break;
      // flip V
      case 5:
        ctx.transform(0, 1, 1, 0, 0, 0);
        break;
      // transpose
      case 6:
        ctx.transform(0, 1, -1, 0, canvas.width, 0);
        break;
      // rotate CW 90
      case 7:
        ctx.transform(0, -1, -1, 0, canvas.width, canvas.height);
        break;
      // transverse
      case 8:
        ctx.transform(0, -1, 1, 0, 0, canvas.height);
        break;
    }
    ctx.drawImage(bitmap, 0, 0);
    ctx.restore();
    bitmap.close?.();
    return canvas;
  }
  function canvasToJpegBlob(canvas, quality = 0.92) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b2) => b2 ? resolve(b2) : reject(new Error("canvas.toBlob failed")), "image/jpeg", quality);
    });
  }
  function pad2(n2) {
    return n2 < 10 ? "0" + n2 : "" + n2;
  }
  function formatExifDate(d2) {
    return `${d2.getFullYear()}:${pad2(d2.getMonth() + 1)}:${pad2(d2.getDate())} ${pad2(d2.getHours())}:${pad2(d2.getMinutes())}:${pad2(d2.getSeconds())}`;
  }
  function buildExifBytes(piexif2, profile, adv) {
    const { ImageIFD, ExifIFD, GPSIFD } = piexif2;
    const now = adv?.dateTime ? new Date(adv.dateTime) : /* @__PURE__ */ new Date();
    const dateStr = formatExifDate(now);
    const orientation = adv?.orientation || 1;
    const zeroth = {
      [ImageIFD.Make]: profile.Make || "Unknown",
      [ImageIFD.Model]: profile.Model || "Unknown",
      [ImageIFD.Software]: profile.Software || "",
      [ImageIFD.DateTime]: dateStr,
      [ImageIFD.Orientation]: orientation
    };
    const exif = {
      [ExifIFD.DateTimeOriginal]: dateStr,
      [ExifIFD.DateTimeDigitized]: dateStr,
      [ExifIFD.LensModel]: profile.LensModel || "",
      [ExifIFD.ColorSpace]: 1,
      [ExifIFD.WhiteBalance]: profile.WhiteBalance === "Auto" ? 0 : 1,
      [ExifIFD.Flash]: 16
    };
    const fNumber = adv?.fNumber ?? profile.FNumber;
    const focalLength = adv?.focalLength ?? profile.FocalLength;
    const iso = adv?.iso ?? profile.ISO;
    const exposureTime = adv?.exposureTime ?? profile.ExposureTime;
    const focal35 = adv?.focal35 ?? profile.FocalLengthIn35mm;
    if (fNumber) exif[ExifIFD.FNumber] = [Math.round(fNumber * 100), 100];
    if (focalLength) exif[ExifIFD.FocalLength] = [Math.round(focalLength * 1e3), 1e3];
    if (focal35) exif[ExifIFD.FocalLengthIn35mmFilm] = Math.round(focal35);
    if (iso) exif[ExifIFD.ISOSpeedRatings] = iso;
    if (exposureTime) exif[ExifIFD.ExposureTime] = exposureTime;
    if (profile.LensMake) exif[ExifIFD.LensMake] = profile.LensMake;
    if (profile.MeteringMode === "Multi-segment") exif[ExifIFD.MeteringMode] = 5;
    if (profile.ExposureProgram === "Manual") exif[ExifIFD.ExposureProgram] = 1;
    else if (profile.ExposureProgram === "Aperture priority") exif[ExifIFD.ExposureProgram] = 3;
    const gps = {};
    if (adv?.gps && adv.gps.lat != null && adv.gps.lon != null) {
      const toDms = (deg) => {
        const d2 = Math.abs(deg);
        const dd = Math.floor(d2);
        const mm = Math.floor((d2 - dd) * 60);
        const ss = Math.round((d2 - dd - mm / 60) * 3600 * 1e4);
        return [[dd, 1], [mm, 1], [ss, 1e4]];
      };
      gps[GPSIFD.GPSVersionID] = [2, 3, 0, 0];
      gps[GPSIFD.GPSLatitudeRef] = adv.gps.lat >= 0 ? "N" : "S";
      gps[GPSIFD.GPSLatitude] = toDms(adv.gps.lat);
      gps[GPSIFD.GPSLongitudeRef] = adv.gps.lon >= 0 ? "E" : "W";
      gps[GPSIFD.GPSLongitude] = toDms(adv.gps.lon);
      gps[GPSIFD.GPSDateStamp] = `${now.getFullYear()}:${pad2(now.getMonth() + 1)}:${pad2(now.getDate())}`;
    }
    return piexif2.dump({ "0th": zeroth, Exif: exif, GPS: gps, Interop: {}, "1st": {}, thumbnail: null });
  }
  function buildXmpGps(lat, lon) {
    const latRef = lat >= 0 ? "N" : "S";
    const lonRef = lon >= 0 ? "E" : "W";
    return [
      '<?xpacket begin="\xEF\xBB\xBF" id="W5M0MpCehiHzreSzNTczkc9d"?>',
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
      '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
      '    <rdf:Description rdf:about=""',
      '          xmlns:exif="http://ns.adobe.com/exif/1.0/">',
      `       <exif:GPSLatitude>${Math.abs(lat)}</exif:GPSLatitude>`,
      `       <exif:GPSLatitudeRef>${latRef}</exif:GPSLatitudeRef>`,
      `       <exif:GPSLongitude>${Math.abs(lon)}</exif:GPSLongitude>`,
      `       <exif:GPSLongitudeRef>${lonRef}</exif:GPSLongitudeRef>`,
      "    </rdf:Description>",
      "  </rdf:RDF>",
      "</x:xmpmeta>",
      '<?xpacket end="w"?>'
    ].join("\r\n");
  }
  function injectXmpIntoJpeg(jpegBytes, xmpStr) {
    const xmpNs = "http://ns.adobe.com/xap/1.0/\0";
    const xmpBytes = new TextEncoder().encode(xmpStr);
    const segLen = 2 + xmpNs.length + xmpBytes.length;
    const app1 = new Uint8Array(2 + segLen);
    app1[0] = 255;
    app1[1] = 225;
    app1[2] = segLen >> 8 & 255;
    app1[3] = segLen & 255;
    let off = 4;
    for (let i2 = 0; i2 < xmpNs.length; i2++) app1[off++] = xmpNs.charCodeAt(i2);
    app1.set(xmpBytes, off);
    let pos = 2;
    while (pos < jpegBytes.length - 1 && jpegBytes[pos] === 255) {
      const mk = jpegBytes[pos + 1];
      if (mk === 218) break;
      const sLen = jpegBytes[pos + 2] << 8 | jpegBytes[pos + 3];
      pos += 2 + sLen;
    }
    const out = new Uint8Array(jpegBytes.length + app1.length);
    out.set(jpegBytes.slice(0, pos), 0);
    out.set(app1, pos);
    out.set(jpegBytes.slice(pos), pos + app1.length);
    return out;
  }
  async function injectExifIntoJpeg(jpegBlob, profile, adv) {
    const piexif2 = await loadPiexif();
    const dataUrl = await new Promise((resolve, reject) => {
      const r2 = new FileReader();
      r2.onload = () => resolve(r2.result);
      r2.onerror = () => reject(r2.error);
      r2.readAsDataURL(jpegBlob);
    });
    const exifStr = buildExifBytes(piexif2, profile, adv);
    const withExif = piexif2.insert(exifStr, dataUrl);
    const comma = withExif.indexOf(",");
    const bin = atob(withExif.slice(comma + 1));
    let out = new Uint8Array(bin.length);
    for (let i2 = 0; i2 < bin.length; i2++) out[i2] = bin.charCodeAt(i2);
    if (adv?.gps && adv.gps.lat != null && adv.gps.lon != null) {
      const xmp = buildXmpGps(adv.gps.lat, adv.gps.lon);
      out = injectXmpIntoJpeg(out, xmp);
    }
    return new Blob([out], { type: "image/jpeg" });
  }
  async function convertImage(inputBytes, inputMime, profile, opts = {}) {
    const quality = opts.quality ?? 0.92;
    const log = [];
    let stripped;
    if (inputMime === "image/jpeg") {
      stripped = stripC2paJpeg(inputBytes);
      if (stripped.removed) log.push(`\u79FB\u9664 ${stripped.removed} \u500B JPEG APP11 \u6BB5 (${stripped.totalBytes}B)`);
    } else if (inputMime === "image/png") {
      stripped = stripC2paPng(inputBytes);
      if (stripped.removed) log.push(`\u79FB\u9664 ${stripped.removed} \u500B PNG C2PA chunk (${stripped.totalBytes}B)`);
    } else {
      stripped = { bytes: inputBytes, removed: 0, totalBytes: 0 };
    }
    if (!stripped.removed) log.push("\u672A\u767C\u73FE C2PA \u7D50\u69CB,\u8DF3\u904E\u525D\u96E2");
    const canvas = await decodeToCanvas(stripped.bytes, inputMime);
    log.push(`\u89E3\u78BC\u6210\u529F: ${canvas.width}\xD7${canvas.height}, \u91CD\u7DE8\u78BC\u70BA JPEG q=${Math.round(quality * 100)}`);
    if (opts.disruptWatermark && typeof opts.disruptWatermark === "function") {
      await opts.disruptWatermark(canvas);
      log.push("\u61C9\u7528\u50CF\u7D20\u7D1A\u6C34\u5370\u64FE\u52D5");
    }
    const plainJpeg = await canvasToJpegBlob(canvas, quality);
    const withExif = await injectExifIntoJpeg(plainJpeg, profile, opts.advanced);
    log.push(`\u6CE8\u5165 EXIF: ${profile.Make} ${profile.Model}`);
    if (opts.advanced?.dateTime) log.push(`  \xB7 \u62CD\u651D\u6642\u9593: ${new Date(opts.advanced.dateTime).toLocaleString("zh-CN")}`);
    if (opts.advanced?.gps?.lat != null) log.push(`  \xB7 GPS: ${opts.advanced.gps.lat.toFixed(4)}, ${opts.advanced.gps.lon.toFixed(4)}`);
    return { blob: withExif, log };
  }
  var import_piexifjs, PNG_SIG, PNG_C2PA_CHUNKS;
  var init_convert = __esm({
    "src/convert.js"() {
      import_piexifjs = __toESM(require_piexif());
      PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];
      PNG_C2PA_CHUNKS = ["caBX", "C2PA", "c2pa"];
    }
  });

  // src/frequency/transforms.js
  function fft1d(re2, im, direction = 1) {
    const N2 = re2.length;
    for (let i2 = 1, j2 = 0; i2 < N2; i2++) {
      let bit = N2 >> 1;
      for (; j2 & bit; bit >>= 1) j2 ^= bit;
      j2 ^= bit;
      if (i2 < j2) {
        let t3 = re2[i2];
        re2[i2] = re2[j2];
        re2[j2] = t3;
        t3 = im[i2];
        im[i2] = im[j2];
        im[j2] = t3;
      }
    }
    for (let len = 2; len <= N2; len <<= 1) {
      const ang = direction * 2 * Math.PI / len;
      const wlenRe = Math.cos(ang), wlenIm = Math.sin(ang);
      for (let i2 = 0; i2 < N2; i2 += len) {
        let wRe = 1, wIm = 0;
        const half = len >> 1;
        for (let k2 = 0; k2 < half; k2++) {
          const aRe = re2[i2 + k2], aIm = im[i2 + k2];
          const bRe = re2[i2 + k2 + half] * wRe - im[i2 + k2 + half] * wIm;
          const bIm = re2[i2 + k2 + half] * wIm + im[i2 + k2 + half] * wRe;
          re2[i2 + k2] = aRe + bRe;
          im[i2 + k2] = aIm + bIm;
          re2[i2 + k2 + half] = aRe - bRe;
          im[i2 + k2 + half] = aIm - bIm;
          const nwRe = wRe * wlenRe - wIm * wlenIm;
          const nwIm = wRe * wlenIm + wIm * wlenRe;
          wRe = nwRe;
          wIm = nwIm;
        }
      }
    }
    if (direction === -1) {
      for (let i2 = 0; i2 < N2; i2++) {
        re2[i2] /= N2;
        im[i2] /= N2;
      }
    }
  }
  function fft2d(gray, w2, h2) {
    const re2 = new Float32Array(gray), im = new Float32Array(gray.length);
    const rowRe = new Float32Array(w2), rowIm = new Float32Array(w2);
    const colRe = new Float32Array(h2), colIm = new Float32Array(h2);
    for (let y2 = 0; y2 < h2; y2++) {
      for (let x2 = 0; x2 < w2; x2++) {
        rowRe[x2] = re2[y2 * w2 + x2];
        rowIm[x2] = im[y2 * w2 + x2];
      }
      fft1d(rowRe, rowIm, 1);
      for (let x2 = 0; x2 < w2; x2++) {
        re2[y2 * w2 + x2] = rowRe[x2];
        im[y2 * w2 + x2] = rowIm[x2];
      }
    }
    for (let x2 = 0; x2 < w2; x2++) {
      for (let y2 = 0; y2 < h2; y2++) {
        colRe[y2] = re2[y2 * w2 + x2];
        colIm[y2] = im[y2 * w2 + x2];
      }
      fft1d(colRe, colIm, 1);
      for (let y2 = 0; y2 < h2; y2++) {
        re2[y2 * w2 + x2] = colRe[y2];
        im[y2 * w2 + x2] = colIm[y2];
      }
    }
    return { re: re2, im };
  }
  var _dct8Cos;
  var init_transforms = __esm({
    "src/frequency/transforms.js"() {
      _dct8Cos = (() => {
        const c2 = new Float32Array(8 * 8);
        for (let u2 = 0; u2 < 8; u2++)
          for (let x2 = 0; x2 < 8; x2++)
            c2[u2 * 8 + x2] = Math.cos((2 * x2 + 1) * u2 * Math.PI / 16);
        return c2;
      })();
    }
  });

  // src/watermark.js
  function gauss() {
    let u2 = Math.random(), v2 = Math.random();
    while (u2 <= 0) u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u2)) * Math.cos(2 * Math.PI * v2);
  }
  function nearestPow2Down(n2) {
    return 1 << Math.floor(Math.log2(Math.max(n2, 2)));
  }
  function geom(canvas, intensity) {
    const w2 = canvas.width, h2 = canvas.height;
    const pct = 3e-3 * intensity;
    const left = Math.floor(w2 * pct);
    const top = Math.floor(h2 * pct);
    const right = w2 - Math.floor(w2 * pct * 0.7);
    const bottom = h2 - Math.floor(h2 * pct * 0.7);
    const out = document.createElement("canvas");
    out.width = w2;
    out.height = h2;
    const ctx = out.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, left, top, right - left, bottom - top, 0, 0, w2, h2);
    canvas.getContext("2d").drawImage(out, 0, 0);
    return { crop: pct };
  }
  function noise(canvas, intensity) {
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d2 = img.data;
    const sigma = intensity * 1.25;
    for (let i2 = 0; i2 < d2.length; i2 += 4) {
      d2[i2] = clamp(d2[i2] + Math.round(gauss() * sigma));
      d2[i2 + 1] = clamp(d2[i2 + 1] + Math.round(gauss() * sigma));
      d2[i2 + 2] = clamp(d2[i2 + 2] + Math.round(gauss() * sigma));
    }
    ctx.putImageData(img, 0, 0);
    return { sigma };
  }
  function clamp(v2) {
    return v2 < 0 ? 0 : v2 > 255 ? 255 : v2;
  }
  function unsharp(canvas, amount = 0.5) {
    const ctx = canvas.getContext("2d");
    const w2 = canvas.width, h2 = canvas.height;
    const img = ctx.getImageData(0, 0, w2, h2);
    const src = img.data;
    const tmp = new Uint8ClampedArray(src.length);
    const blurred = new Uint8ClampedArray(src.length);
    for (let y2 = 0; y2 < h2; y2++) for (let x2 = 0; x2 < w2; x2++) {
      const i2 = (y2 * w2 + x2) * 4;
      for (let c2 = 0; c2 < 3; c2++) {
        const l2 = x2 > 0 ? src[i2 - 4 + c2] : src[i2 + c2];
        const r2 = x2 < w2 - 1 ? src[i2 + 4 + c2] : src[i2 + c2];
        tmp[i2 + c2] = (l2 + src[i2 + c2] + r2) / 3;
      }
      tmp[i2 + 3] = src[i2 + 3];
    }
    for (let y2 = 0; y2 < h2; y2++) for (let x2 = 0; x2 < w2; x2++) {
      const i2 = (y2 * w2 + x2) * 4;
      for (let c2 = 0; c2 < 3; c2++) {
        const u2 = y2 > 0 ? tmp[i2 - w2 * 4 + c2] : tmp[i2 + c2];
        const d2 = y2 < h2 - 1 ? tmp[i2 + w2 * 4 + c2] : tmp[i2 + c2];
        blurred[i2 + c2] = (u2 + tmp[i2 + c2] + d2) / 3;
      }
    }
    for (let i2 = 0; i2 < src.length; i2 += 4) {
      for (let c2 = 0; c2 < 3; c2++) src[i2 + c2] = clamp(src[i2 + c2] + amount * (src[i2 + c2] - blurred[i2 + c2]));
    }
    ctx.putImageData(img, 0, 0);
    return {};
  }
  async function doubleJpeg(canvas, midQ) {
    const blob = await new Promise((r2) => canvas.toBlob(r2, "image/jpeg", midQ));
    if (!blob) return { skipped: true };
    const bitmap = await createImageBitmap(blob);
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return { midQ };
  }
  function chShift(canvas, dx) {
    const ctx = canvas.getContext("2d");
    const w2 = canvas.width, h2 = canvas.height;
    const img = ctx.getImageData(0, 0, w2, h2);
    const src = new Uint8ClampedArray(img.data);
    const out = img.data;
    for (let y2 = 0; y2 < h2; y2++) {
      for (let x2 = 0; x2 < w2; x2++) {
        const i2 = (y2 * w2 + x2) * 4;
        const rx = Math.max(0, Math.min(w2 - 1, x2 + dx));
        const bx = Math.max(0, Math.min(w2 - 1, x2 - dx));
        out[i2] = src[(y2 * w2 + rx) * 4];
        out[i2 + 2] = src[(y2 * w2 + bx) * 4 + 2];
      }
    }
    ctx.putImageData(img, 0, 0);
    return { shiftPx: dx };
  }
  function bandNoise(canvas, amp) {
    const ctx = canvas.getContext("2d");
    const w2 = canvas.width, h2 = canvas.height;
    const sw = Math.max(8, Math.floor(w2 / 32));
    const sh = Math.max(8, Math.floor(h2 / 32));
    const small = document.createElement("canvas");
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext("2d");
    const simg = sctx.createImageData(sw, sh);
    for (let i2 = 0; i2 < simg.data.length; i2 += 4) {
      const n2 = gauss() * amp * 10;
      const v2 = 128 + n2;
      simg.data[i2] = simg.data[i2 + 1] = simg.data[i2 + 2] = clamp(v2);
      simg.data[i2 + 3] = 255;
    }
    sctx.putImageData(simg, 0, 0);
    const big = document.createElement("canvas");
    big.width = w2;
    big.height = h2;
    const bctx = big.getContext("2d");
    bctx.imageSmoothingEnabled = true;
    bctx.imageSmoothingQuality = "high";
    bctx.drawImage(small, 0, 0, w2, h2);
    const bigImg = bctx.getImageData(0, 0, w2, h2);
    const img = ctx.getImageData(0, 0, w2, h2);
    const d2 = img.data;
    const map = bigImg.data;
    for (let i2 = 0; i2 < d2.length; i2 += 4) {
      const delta = map[i2] - 128;
      d2[i2] = clamp(d2[i2] + delta);
      d2[i2 + 1] = clamp(d2[i2 + 1] + delta);
      d2[i2 + 2] = clamp(d2[i2 + 2] + delta);
    }
    ctx.putImageData(img, 0, 0);
    return { bandScale: `${sw}\xD7${sh}`, amp };
  }
  async function fftPhase(canvas, maxDev) {
    const w2 = canvas.width, h2 = canvas.height;
    const N2 = Math.min(1024, nearestPow2Down(Math.min(w2, h2)));
    const work = document.createElement("canvas");
    work.width = N2;
    work.height = N2;
    const wctx = work.getContext("2d");
    wctx.imageSmoothingEnabled = true;
    wctx.imageSmoothingQuality = "high";
    wctx.drawImage(canvas, 0, 0, N2, N2);
    const img = wctx.getImageData(0, 0, N2, N2);
    const d2 = img.data;
    for (let ch = 0; ch < 3; ch++) {
      const plane = new Float32Array(N2 * N2);
      for (let i2 = 0; i2 < N2 * N2; i2++) plane[i2] = d2[i2 * 4 + ch];
      const { re: re2, im } = fft2d(plane, N2, N2);
      const cx = N2 / 2, cy = N2 / 2;
      const maxR = Math.min(cx, cy);
      const rLo = maxR * 0.15, rHi = maxR * 0.7;
      for (let y2 = 0; y2 < N2; y2++) {
        for (let x2 = 0; x2 < N2; x2++) {
          const dxw = x2 > N2 / 2 ? x2 - N2 : x2;
          const dyw = y2 > N2 / 2 ? y2 - N2 : y2;
          const r2 = Math.sqrt(dxw * dxw + dyw * dyw);
          if (r2 < rLo || r2 > rHi) continue;
          const idx = y2 * N2 + x2;
          const rr = re2[idx], ii = im[idx];
          const mag2 = rr * rr + ii * ii;
          if (mag2 < 1) continue;
          const mag = Math.sqrt(mag2);
          const ph = Math.atan2(ii, rr) + (Math.random() * 2 - 1) * maxDev;
          re2[idx] = mag * Math.cos(ph);
          im[idx] = mag * Math.sin(ph);
        }
      }
      const rowRe = new Float32Array(N2), rowIm = new Float32Array(N2);
      for (let y2 = 0; y2 < N2; y2++) {
        for (let x2 = 0; x2 < N2; x2++) {
          rowRe[x2] = re2[y2 * N2 + x2];
          rowIm[x2] = im[y2 * N2 + x2];
        }
        fft1d(rowRe, rowIm, -1);
        for (let x2 = 0; x2 < N2; x2++) {
          re2[y2 * N2 + x2] = rowRe[x2];
          im[y2 * N2 + x2] = rowIm[x2];
        }
      }
      const colRe = new Float32Array(N2), colIm = new Float32Array(N2);
      for (let x2 = 0; x2 < N2; x2++) {
        for (let y2 = 0; y2 < N2; y2++) {
          colRe[y2] = re2[y2 * N2 + x2];
          colIm[y2] = im[y2 * N2 + x2];
        }
        fft1d(colRe, colIm, -1);
        for (let y2 = 0; y2 < N2; y2++) {
          re2[y2 * N2 + x2] = colRe[y2];
          im[y2 * N2 + x2] = colIm[y2];
        }
      }
      for (let i2 = 0; i2 < N2 * N2; i2++) d2[i2 * 4 + ch] = clamp(re2[i2]);
    }
    wctx.putImageData(img, 0, 0);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(work, 0, 0, w2, h2);
    return { N: N2, maxDevDeg: (maxDev * 180 / Math.PI).toFixed(1) };
  }
  function median3(canvas) {
    const ctx = canvas.getContext("2d");
    const w2 = canvas.width, h2 = canvas.height;
    const img = ctx.getImageData(0, 0, w2, h2);
    const src = new Uint8ClampedArray(img.data);
    const d2 = img.data;
    const buf = new Array(9);
    for (let y2 = 1; y2 < h2 - 1; y2++) {
      for (let x2 = 1; x2 < w2 - 1; x2++) {
        const base = (y2 * w2 + x2) * 4;
        for (let c2 = 0; c2 < 3; c2++) {
          let k2 = 0;
          for (let yy = -1; yy <= 1; yy++)
            for (let xx = -1; xx <= 1; xx++)
              buf[k2++] = src[((y2 + yy) * w2 + (x2 + xx)) * 4 + c2];
          buf.sort((a2, b2) => a2 - b2);
          d2[base + c2] = buf[4];
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return {};
  }
  async function disruptWatermark(canvas, options = {}) {
    const intensity = Math.max(1, Math.min(5, options.intensity ?? DEFAULT_INTENSITY));
    const techniques = options.techniques && options.techniques.length ? options.techniques : DEFAULT_TECHNIQUES;
    const log = [];
    const applied = [];
    const totalT0 = performance.now();
    for (const t3 of techniques) {
      const t0 = performance.now();
      try {
        if (t3 === "geom") {
          const r2 = geom(canvas, intensity);
          log.push(`\u5E7E\u4F55\u64FE\u52D5: crop ${(r2.crop * 100).toFixed(2)}% (${ms(t0)})`);
        } else if (t3 === "noise") {
          const r2 = noise(canvas, intensity);
          log.push(`\u9AD8\u65AF\u566A\u8072: \u03C3\u2248${r2.sigma.toFixed(1)} (${ms(t0)})`);
        } else if (t3 === "unsharp") {
          unsharp(canvas, 0.5);
          log.push(`\u92B3\u5316\u88DC\u511F (${ms(t0)})`);
        } else if (t3 === "doubleJpeg") {
          const midQ = Math.max(0.55, 0.75 - 0.03 * intensity);
          const r2 = await doubleJpeg(canvas, midQ);
          log.push(r2.skipped ? `\u96D9\u6B21JPEG: \u8DF3\u904E (toBlob \u5931\u6557)` : `\u96D9\u6B21JPEG: \u4E2D\u9593 q=${Math.round(r2.midQ * 100)} (${ms(t0)})`);
        } else if (t3 === "chShift") {
          const dx = Math.max(1, Math.floor(intensity / 2));
          const r2 = chShift(canvas, dx);
          log.push(`\u901A\u9053\u4F4D\u79FB: \xB1${r2.shiftPx}px (${ms(t0)})`);
        } else if (t3 === "bandNoise") {
          const r2 = bandNoise(canvas, intensity * 0.8);
          log.push(`\u4F4E\u983B\u5E36\u72C0\u566A\u8072: ${r2.bandScale} amp=${r2.amp.toFixed(1)} (${ms(t0)})`);
        } else if (t3 === "fftPhase") {
          const maxDev = Math.PI / 60 * (intensity / 3);
          const r2 = await fftPhase(canvas, maxDev);
          log.push(`FFT \u76F8\u4F4D\u64FE\u52D5: ${r2.N}\xB2 @ \xB1${r2.maxDevDeg}\xB0 (${ms(t0)})`);
        } else if (t3 === "median") {
          if (intensity >= 3) {
            median3(canvas);
            log.push(`\u4E2D\u503C\u6FFE\u6CE2 3\xD73 (${ms(t0)})`);
          } else {
            log.push(`\u4E2D\u503C\u6FFE\u6CE2: \u8DF3\u904E (intensity<3)`);
            continue;
          }
        } else continue;
        applied.push(t3);
      } catch (err) {
        log.push(`${t3} \u5931\u6557: ${err.message}`);
      }
    }
    const totalMs = (performance.now() - totalT0).toFixed(0);
    log.push(`\u5171\u61C9\u7528 ${applied.length} \u9805,\u7E3D\u8017\u6642 ${totalMs}ms`);
    return { intensity, techniques: applied, log };
  }
  function ms(t0) {
    return (performance.now() - t0).toFixed(0) + "ms";
  }
  var DEFAULT_TECHNIQUES, DEFAULT_INTENSITY, PRESETS;
  var init_watermark = __esm({
    "src/watermark.js"() {
      init_transforms();
      DEFAULT_TECHNIQUES = ["geom", "noise", "unsharp", "doubleJpeg"];
      DEFAULT_INTENSITY = 3;
      PRESETS = {
        light: { label: "\u8F15\u91CF", techniques: ["geom", "noise"] },
        rec: { label: "\u63A8\u85A6", techniques: ["geom", "noise", "unsharp", "doubleJpeg"] },
        strong: { label: "\u5F37\u529B", techniques: ["geom", "noise", "unsharp", "doubleJpeg", "chShift", "bandNoise"] },
        ultra: { label: "\u6975\u9650", techniques: ["geom", "noise", "unsharp", "doubleJpeg", "chShift", "bandNoise", "fftPhase", "median"] }
      };
    }
  });

  // src/frequency/worker-source.js
  var WORKER_SOURCE;
  var init_worker_source = __esm({
    "src/frequency/worker-source.js"() {
      WORKER_SOURCE = '(() => {\n  // src/frequency/transforms.js\n  function fft1d(re, im, direction = 1) {\n    const N = re.length;\n    for (let i = 1, j = 0; i < N; i++) {\n      let bit = N >> 1;\n      for (; j & bit; bit >>= 1) j ^= bit;\n      j ^= bit;\n      if (i < j) {\n        let t = re[i];\n        re[i] = re[j];\n        re[j] = t;\n        t = im[i];\n        im[i] = im[j];\n        im[j] = t;\n      }\n    }\n    for (let len = 2; len <= N; len <<= 1) {\n      const ang = direction * 2 * Math.PI / len;\n      const wlenRe = Math.cos(ang), wlenIm = Math.sin(ang);\n      for (let i = 0; i < N; i += len) {\n        let wRe = 1, wIm = 0;\n        const half = len >> 1;\n        for (let k = 0; k < half; k++) {\n          const aRe = re[i + k], aIm = im[i + k];\n          const bRe = re[i + k + half] * wRe - im[i + k + half] * wIm;\n          const bIm = re[i + k + half] * wIm + im[i + k + half] * wRe;\n          re[i + k] = aRe + bRe;\n          im[i + k] = aIm + bIm;\n          re[i + k + half] = aRe - bRe;\n          im[i + k + half] = aIm - bIm;\n          const nwRe = wRe * wlenRe - wIm * wlenIm;\n          const nwIm = wRe * wlenIm + wIm * wlenRe;\n          wRe = nwRe;\n          wIm = nwIm;\n        }\n      }\n    }\n    if (direction === -1) {\n      for (let i = 0; i < N; i++) {\n        re[i] /= N;\n        im[i] /= N;\n      }\n    }\n  }\n  function fft2d(gray, w, h) {\n    const re = new Float32Array(gray), im = new Float32Array(gray.length);\n    const rowRe = new Float32Array(w), rowIm = new Float32Array(w);\n    const colRe = new Float32Array(h), colIm = new Float32Array(h);\n    for (let y = 0; y < h; y++) {\n      for (let x = 0; x < w; x++) {\n        rowRe[x] = re[y * w + x];\n        rowIm[x] = im[y * w + x];\n      }\n      fft1d(rowRe, rowIm, 1);\n      for (let x = 0; x < w; x++) {\n        re[y * w + x] = rowRe[x];\n        im[y * w + x] = rowIm[x];\n      }\n    }\n    for (let x = 0; x < w; x++) {\n      for (let y = 0; y < h; y++) {\n        colRe[y] = re[y * w + x];\n        colIm[y] = im[y * w + x];\n      }\n      fft1d(colRe, colIm, 1);\n      for (let y = 0; y < h; y++) {\n        re[y * w + x] = colRe[y];\n        im[y * w + x] = colIm[y];\n      }\n    }\n    return { re, im };\n  }\n  function magnitudeShifted(re, im, w, h) {\n    const mag = new Float32Array(w * h);\n    const hw = w >> 1, hh = h >> 1;\n    for (let y = 0; y < h; y++) {\n      const sy = (y + hh) % h;\n      for (let x = 0; x < w; x++) {\n        const sx = (x + hw) % w;\n        const i = y * w + x, si = sy * w + sx;\n        mag[si] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);\n      }\n    }\n    return mag;\n  }\n  function downsampleMag(mag, w, h, dstW, dstH) {\n    const out = new Float32Array(dstW * dstH);\n    const kx = w / dstW, ky = h / dstH;\n    for (let y = 0; y < dstH; y++) {\n      const y0 = Math.floor(y * ky), y1 = Math.floor((y + 1) * ky);\n      for (let x = 0; x < dstW; x++) {\n        const x0 = Math.floor(x * kx), x1 = Math.floor((x + 1) * kx);\n        let m = 0;\n        for (let yy = y0; yy < y1; yy++)\n          for (let xx = x0; xx < x1; xx++) {\n            const v = mag[yy * w + xx];\n            if (v > m) m = v;\n          }\n        out[y * dstW + x] = m;\n      }\n    }\n    return out;\n  }\n  function radialSpectrum(mag, w, h, bins = 64) {\n    const power = new Float64Array(bins), count = new Uint32Array(bins);\n    const cx = w / 2, cy = h / 2;\n    const maxR = Math.min(cx, cy);\n    for (let y = 0; y < h; y++) {\n      for (let x = 0; x < w; x++) {\n        const dx = x - cx, dy = y - cy;\n        const r = Math.sqrt(dx * dx + dy * dy);\n        if (r >= maxR) continue;\n        const b = Math.min(bins - 1, Math.floor(r / maxR * bins));\n        const v = mag[y * w + x];\n        power[b] += v * v;\n        count[b]++;\n      }\n    }\n    const out = new Float32Array(bins);\n    for (let b = 0; b < bins; b++) out[b] = count[b] > 0 ? power[b] / count[b] : 0;\n    return out;\n  }\n  var _dct8Cos = (() => {\n    const c = new Float32Array(8 * 8);\n    for (let u = 0; u < 8; u++)\n      for (let x = 0; x < 8; x++)\n        c[u * 8 + x] = Math.cos((2 * x + 1) * u * Math.PI / 16);\n    return c;\n  })();\n  function dct8(block, out) {\n    out = out || new Float32Array(64);\n    for (let v = 0; v < 8; v++) {\n      for (let u = 0; u < 8; u++) {\n        let s = 0;\n        for (let y = 0; y < 8; y++)\n          for (let x = 0; x < 8; x++)\n            s += block[y * 8 + x] * _dct8Cos[u * 8 + x] * _dct8Cos[v * 8 + y];\n        const cu = u === 0 ? Math.SQRT1_2 : 1;\n        const cv = v === 0 ? Math.SQRT1_2 : 1;\n        out[v * 8 + u] = 0.25 * cu * cv * s;\n      }\n    }\n    return out;\n  }\n  function haarStep(src, w, h) {\n    const hw = w >> 1, hh = h >> 1;\n    const LL = new Float32Array(hw * hh), LH = new Float32Array(hw * hh);\n    const HL = new Float32Array(hw * hh), HH = new Float32Array(hw * hh);\n    for (let y = 0; y < hh; y++) {\n      for (let x = 0; x < hw; x++) {\n        const a = src[2 * y * w + 2 * x], b = src[2 * y * w + 2 * x + 1];\n        const c = src[(2 * y + 1) * w + 2 * x], d = src[(2 * y + 1) * w + 2 * x + 1];\n        LL[y * hw + x] = (a + b + c + d) * 0.5;\n        LH[y * hw + x] = (a + b - c - d) * 0.5;\n        HL[y * hw + x] = (a - b + c - d) * 0.5;\n        HH[y * hw + x] = (a - b - c + d) * 0.5;\n      }\n    }\n    return { LL, LH, HL, HH, w: hw, h: hh };\n  }\n  function haar2d2level(gray, w, h) {\n    const l1 = haarStep(gray, w, h);\n    const l2 = haarStep(l1.LL, l1.w, l1.h);\n    return {\n      LL2: l2.LL,\n      LH2: l2.LH,\n      HL2: l2.HL,\n      HH2: l2.HH,\n      w2: l2.w,\n      h2: l2.h,\n      LH1: l1.LH,\n      HL1: l1.HL,\n      HH1: l1.HH,\n      w1: l1.w,\n      h1: l1.h\n    };\n  }\n\n  // src/frequency/features.js\n  var safeLog = (v) => Math.log(Math.max(v, 1e-12));\n  function mean(arr) {\n    let s = 0;\n    for (let i = 0; i < arr.length; i++) s += arr[i];\n    return s / arr.length;\n  }\n  function variance(arr, mu) {\n    mu = mu ?? mean(arr);\n    let s = 0;\n    for (let i = 0; i < arr.length; i++) {\n      const d = arr[i] - mu;\n      s += d * d;\n    }\n    return s / arr.length;\n  }\n  function moments(arr) {\n    const mu = mean(arr);\n    let m2 = 0, m3 = 0, m4 = 0;\n    for (let i = 0; i < arr.length; i++) {\n      const d = arr[i] - mu;\n      const d2 = d * d;\n      m2 += d2;\n      m3 += d2 * d;\n      m4 += d2 * d2;\n    }\n    const n = arr.length;\n    m2 /= n;\n    m3 /= n;\n    m4 /= n;\n    const sd = Math.sqrt(m2);\n    return { mean: mu, std: sd, skew: sd > 1e-9 ? m3 / (sd * sd * sd) : 0, kurt: m2 > 1e-9 ? m4 / (m2 * m2) - 3 : 0 };\n  }\n  function corrCoef(a, b) {\n    if (a.length !== b.length) return 0;\n    const mA = mean(a), mB = mean(b);\n    let num = 0, dA = 0, dB = 0;\n    for (let i = 0; i < a.length; i++) {\n      const da = a[i] - mA, db = b[i] - mB;\n      num += da * db;\n      dA += da * da;\n      dB += db * db;\n    }\n    const den = Math.sqrt(dA * dB);\n    return den > 1e-9 ? num / den : 0;\n  }\n  function extractFeatures(rgba, gray, w, h) {\n    const f = {};\n    const N = w * h;\n    const { re, im } = fft2d(gray, w, h);\n    const mag = magnitudeShifted(re, im, w, h);\n    const radial = radialSpectrum(mag, w, h, 64);\n    const totalAC = radial.reduce((s, v, i) => i === 0 ? s : s + v, 0) || 1e-9;\n    const binAt = (pct) => Math.floor(pct * radial.length);\n    const bandSum = (a, b) => {\n      let s = 0;\n      for (let i = a; i < b; i++) s += radial[i];\n      return s;\n    };\n    f.f01_low_freq_ratio = bandSum(0, binAt(0.1)) / totalAC;\n    f.f02_mid_freq_ratio = bandSum(binAt(0.1), binAt(0.4)) / totalAC;\n    f.f03_high_freq_ratio = bandSum(binAt(0.4), radial.length) / totalAC;\n    let sx = 0, sy = 0, sxx = 0, sxy = 0, nPts = 0;\n    for (let i = 1; i < radial.length; i++) {\n      if (radial[i] <= 0) continue;\n      const lx = safeLog(i), ly = safeLog(radial[i]);\n      sx += lx;\n      sy += ly;\n      sxx += lx * lx;\n      sxy += lx * ly;\n      nPts++;\n    }\n    f.f04_spectral_slope = nPts > 1 ? (nPts * sxy - sx * sy) / Math.max(nPts * sxx - sx * sx, 1e-9) : 0;\n    let gm = 0, am = 0;\n    for (let i = 1; i < radial.length; i++) {\n      gm += safeLog(radial[i] + 1e-9);\n      am += radial[i];\n    }\n    gm = Math.exp(gm / (radial.length - 1));\n    am /= radial.length - 1;\n    f.f05_spectral_flatness = am > 1e-9 ? gm / am : 0;\n    const radialNorm = radial.map((v) => v / totalAC);\n    let ent = 0;\n    for (const p of radialNorm) if (p > 1e-9) ent -= p * safeLog(p);\n    f.f06_spectral_entropy = ent;\n    f.f07_dc_component = mag[h / 2 * w + w / 2];\n    f.f08_ac_energy_total = totalAC;\n    const bands = [[0, 0.05], [0.05, 0.1], [0.1, 0.2], [0.2, 0.3], [0.3, 0.5], [0.5, 0.7], [0.7, 1]];\n    bands.forEach(([a, b], i) => {\n      f[`f0${9 + i}_band_${Math.round(a * 100)}_${Math.round(b * 100)}_ratio`] = bandSum(binAt(a), binAt(b)) / totalAC;\n    });\n    f.f16_radial_energy_variance = variance(radial);\n    let peaks = 0;\n    for (let i = 2; i < radial.length - 2; i++) {\n      if (radial[i] > radial[i - 1] && radial[i] > radial[i + 1] && radial[i] > (radial[i - 2] + radial[i + 2]) * 0.75) peaks++;\n    }\n    f.f17_radial_peak_count = peaks;\n    let symNum = 0, symDen = 0;\n    for (let y = 0; y < h; y++) {\n      for (let x = 0; x < w / 2; x++) {\n        const a = mag[y * w + x], b = mag[(h - 1 - y) * w + (w - 1 - x)];\n        symNum += Math.abs(a - b);\n        symDen += a + b;\n      }\n    }\n    f.f18_radial_symmetry = symDen > 1e-9 ? 1 - symNum / symDen : 1;\n    const nAng = 16;\n    const angPower = new Float64Array(nAng);\n    const cx = w / 2, cy = h / 2;\n    for (let y = 0; y < h; y++) {\n      for (let x = 0; x < w; x++) {\n        const dx = x - cx, dy = y - cy;\n        if (dx === 0 && dy === 0) continue;\n        const ang = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);\n        const b = Math.min(nAng - 1, Math.floor(ang * nAng));\n        angPower[b] += mag[y * w + x] * mag[y * w + x];\n      }\n    }\n    f.f19_angular_energy_variance = variance(Array.from(angPower));\n    let maxAng = 0, maxAngIdx = 0, sumAng = 0;\n    for (let i = 0; i < nAng; i++) {\n      sumAng += angPower[i];\n      if (angPower[i] > maxAng) {\n        maxAng = angPower[i];\n        maxAngIdx = i;\n      }\n    }\n    f.f20_dominant_orientation = maxAngIdx / nAng * 180;\n    f.f21_orientation_strength = sumAng > 1e-9 ? maxAng / (sumAng / nAng) : 0;\n    const channel = (ch) => {\n      const g = new Float32Array(N);\n      for (let i = 0; i < N; i++) g[i] = rgba[i * 4 + ch];\n      return fft2d(g, w, h);\n    };\n    const phaseConsistency = (re2, im2) => {\n      let sumCos = 0, sumSin = 0, n = 0;\n      for (let i = 1; i < re2.length; i++) {\n        const mg = Math.sqrt(re2[i] * re2[i] + im2[i] * im2[i]);\n        if (mg < 1) continue;\n        sumCos += re2[i] / mg;\n        sumSin += im2[i] / mg;\n        n++;\n      }\n      return n > 0 ? Math.sqrt(sumCos * sumCos + sumSin * sumSin) / n : 0;\n    };\n    const rFFT = channel(0), gFFT = channel(1), bFFT = channel(2);\n    f.f22_phase_consistency_r = phaseConsistency(rFFT.re, rFFT.im);\n    f.f23_phase_consistency_g = phaseConsistency(gFFT.re, gFFT.im);\n    f.f24_phase_consistency_b = phaseConsistency(bFFT.re, bFFT.im);\n    const phaseStd = (re2, im2) => {\n      const ang = [];\n      for (let i = 1; i < re2.length; i += 4) {\n        const mg = Math.sqrt(re2[i] * re2[i] + im2[i] * im2[i]);\n        if (mg < 1) continue;\n        ang.push(Math.atan2(im2[i], re2[i]));\n      }\n      return ang.length > 1 ? Math.sqrt(variance(ang)) : 0;\n    };\n    f.f25_phase_noise_std = phaseStd(rFFT.re, rFFT.im);\n    const angSample = (re2, im2, n) => {\n      const out2 = new Float32Array(n);\n      let k = 0;\n      for (let i = 1; k < n && i < re2.length; i += 8) out2[k++] = Math.atan2(im2[i], re2[i]);\n      return out2.subarray(0, k);\n    };\n    const nSamp = Math.min(4096, N / 8 | 0);\n    f.f26_cross_color_phase_corr = corrCoef(angSample(rFFT.re, rFFT.im, nSamp), angSample(gFFT.re, gFFT.im, nSamp));\n    let lsb0 = [0, 0, 0], lsb1 = [0, 0, 0];\n    for (let i = 0; i < N; i++) {\n      const p = i * 4;\n      lsb0[0] += rgba[p] & 1;\n      lsb0[1] += rgba[p + 1] & 1;\n      lsb0[2] += rgba[p + 2] & 1;\n      lsb1[0] += rgba[p] >> 1 & 1;\n      lsb1[1] += rgba[p + 1] >> 1 & 1;\n      lsb1[2] += rgba[p + 2] >> 1 & 1;\n    }\n    f.f27_lsb0_bias_r = Math.abs(lsb0[0] / N - 0.5);\n    f.f28_lsb0_bias_g = Math.abs(lsb0[1] / N - 0.5);\n    f.f29_lsb0_bias_b = Math.abs(lsb0[2] / N - 0.5);\n    f.f30_lsb1_bias = Math.abs((lsb1[0] + lsb1[1] + lsb1[2]) / (3 * N) - 0.5);\n    let same = 0, total = 0;\n    for (let i = 0; i < N - 1; i++) {\n      const a = rgba[i * 4] & 1, b = rgba[(i + 1) * 4] & 1;\n      if (a === b) same++;\n      total++;\n    }\n    f.f31_lsb_correlation = total > 0 ? same / total : 0;\n    const hist = new Uint32Array(256);\n    for (let i = 0; i < N; i++) hist[rgba[i * 4]]++;\n    const exp = N / 256;\n    let chi = 0;\n    for (let i = 0; i < 256; i++) {\n      const d = hist[i] - exp;\n      chi += d * d / exp;\n    }\n    f.f32_lsb_chi_square = chi;\n    const rArr = new Float32Array(N), gArr = new Float32Array(N), bArr = new Float32Array(N);\n    for (let i = 0; i < N; i++) {\n      rArr[i] = rgba[i * 4];\n      gArr[i] = rgba[i * 4 + 1];\n      bArr[i] = rgba[i * 4 + 2];\n    }\n    const mR = moments(rArr), mG = moments(gArr), mB = moments(bArr);\n    f.f33_pixel_mean_r = mR.mean;\n    f.f33b_pixel_mean_g = mG.mean;\n    f.f33c_pixel_mean_b = mB.mean;\n    f.f34_pixel_std_r = mR.std;\n    f.f34b_pixel_std_g = mG.std;\n    f.f34c_pixel_std_b = mB.std;\n    f.f35_pixel_skew_r = mR.skew;\n    f.f35b_pixel_skew_g = mG.skew;\n    f.f35c_pixel_skew_b = mB.skew;\n    f.f36_pixel_kurt_r = mR.kurt;\n    f.f36b_pixel_kurt_g = mG.kurt;\n    f.f36c_pixel_kurt_b = mB.kurt;\n    f.f37_rg_correlation = corrCoef(rArr, gArr);\n    f.f38_rb_correlation = corrCoef(rArr, bArr);\n    f.f39_gb_correlation = corrCoef(gArr, bArr);\n    const hShift = new Float32Array(N - 1), hBase = new Float32Array(N - 1);\n    const vShift = new Float32Array((h - 1) * w), vBase = new Float32Array((h - 1) * w);\n    for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) {\n      hBase[y * (w - 1) + x] = gray[y * w + x];\n      hShift[y * (w - 1) + x] = gray[y * w + x + 1];\n    }\n    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {\n      vBase[y * w + x] = gray[y * w + x];\n      vShift[y * w + x] = gray[(y + 1) * w + x];\n    }\n    f.f40_horz_corr = corrCoef(hBase.subarray(0, (w - 1) * h), hShift.subarray(0, (w - 1) * h));\n    f.f41_vert_corr = corrCoef(vBase, vShift);\n    const diagBase = new Float32Array((h - 1) * (w - 1)), diagShift = new Float32Array((h - 1) * (w - 1));\n    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {\n      diagBase[y * (w - 1) + x] = gray[y * w + x];\n      diagShift[y * (w - 1) + x] = gray[(y + 1) * w + x + 1];\n    }\n    f.f42_diag_corr = corrCoef(diagBase, diagShift);\n    const breakRatio = (bits) => {\n      const mask = (1 << bits) - 1;\n      let breaks = 0, n = 0;\n      for (let i = 0; i < N - 1; i++) {\n        const a = rgba[i * 4] & mask, b = rgba[(i + 1) * 4] & mask;\n        if (Math.abs(a - b) > mask >> 1) breaks++;\n        n++;\n      }\n      return n ? breaks / n : 0;\n    };\n    f.f43_corr_break_ratio_2 = breakRatio(2);\n    f.f44_corr_break_ratio_4 = breakRatio(4);\n    const wv = haar2d2level(gray, w, h);\n    const e = (a) => a.reduce((s, v) => s + v * v, 0);\n    const eLL2 = e(wv.LL2) || 1e-9;\n    f.f45_wavelet_hh1_energy = e(wv.HH1);\n    f.f46_wavelet_hh2_energy = e(wv.HH2);\n    f.f47_wavelet_ll2_energy = eLL2;\n    f.f48_wavelet_lh_ratio = e(wv.LH1) / eLL2;\n    f.f49_wavelet_hl_ratio = e(wv.HL1) / eLL2;\n    f.f50_wavelet_hh_ratio = f.f45_wavelet_hh1_energy / eLL2;\n    f.f51_wavelet_hh1_kurt = moments(wv.HH1).kurt;\n    let wEnt = 0;\n    const all = Array.from(wv.HH1).concat(Array.from(wv.LH1)).concat(Array.from(wv.HL1));\n    const tot = all.reduce((s, v) => s + Math.abs(v), 0) || 1e-9;\n    for (const v of all) {\n      const p = Math.abs(v) / tot;\n      if (p > 1e-9) wEnt -= p * safeLog(p);\n    }\n    f.f52_wavelet_entropy = wEnt;\n    const blockStride = 32;\n    let dctAllSum = 0, dctAllSq = 0, dctN = 0, zeroCoeff = 0, totalCoeff = 0;\n    const blockVars = [];\n    const blk = new Float32Array(64), out = new Float32Array(64);\n    for (let y = 0; y + 8 <= h; y += blockStride) {\n      for (let x = 0; x + 8 <= w; x += blockStride) {\n        for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++)\n          blk[yy * 8 + xx] = gray[(y + yy) * w + (x + xx)] - 128;\n        dct8(blk, out);\n        for (let i = 1; i < 64; i++) {\n          dctAllSum += out[i];\n          dctAllSq += out[i] * out[i];\n          dctN++;\n          if (Math.abs(out[i]) < 1) zeroCoeff++;\n          totalCoeff++;\n        }\n        blockVars.push(out[0]);\n      }\n    }\n    const dctMean = dctAllSum / dctN;\n    const dctVar = dctAllSq / dctN - dctMean * dctMean;\n    f.f53_dct_coef_mean = dctMean;\n    f.f54_dct_coef_std = Math.sqrt(Math.max(dctVar, 0));\n    f.f55_dct_coef_kurt = 0;\n    f.f56_dct_zero_ratio = totalCoeff ? zeroCoeff / totalCoeff : 0;\n    f.f57_dct_block_variance = variance(blockVars);\n    return { features: f, viz: { mag, radial, rFFT, gFFT, bFFT, wv } };\n  }\n\n  // src/frequency/score.js\n  function scoreFeatures(f) {\n    const votes = [];\n    const push = (weight, reason, value) => votes.push({ weight, reason, value });\n    if (f.f04_spectral_slope > -0.8) push(2, `\\u9891\\u8C31\\u8870\\u51CF\\u504F\\u5E73\\u7F13 (slope=${f.f04_spectral_slope.toFixed(2)})`, f.f04_spectral_slope);\n    else if (f.f04_spectral_slope < -2.8) push(-1, `\\u9891\\u8C31\\u8870\\u51CF\\u8FC7\\u9661,\\u50CF\\u5F3A\\u538B\\u7F29\\u7167\\u7247 (slope=${f.f04_spectral_slope.toFixed(2)})`, f.f04_spectral_slope);\n    if (f.f05_spectral_flatness > 0.35) push(2, `\\u9891\\u8C31\\u5E73\\u5766\\u5EA6\\u9AD8,\\u80FD\\u91CF\\u5206\\u5E03\\u5747\\u5300 (flatness=${f.f05_spectral_flatness.toFixed(3)})`, f.f05_spectral_flatness);\n    if (f.f18_radial_symmetry > 0.88) push(1, `\\u5F84\\u5411\\u5BF9\\u79F0\\u6027\\u9AD8 (${f.f18_radial_symmetry.toFixed(2)})`, f.f18_radial_symmetry);\n    if (f.f21_orientation_strength < 1.3) push(1, `\\u65B9\\u5411\\u6027\\u5F31,\\u65E0\\u660E\\u663E\\u7EB9\\u7406\\u65B9\\u5411 (str=${f.f21_orientation_strength.toFixed(2)})`, f.f21_orientation_strength);\n    const pMax = Math.max(f.f22_phase_consistency_r, f.f23_phase_consistency_g, f.f24_phase_consistency_b);\n    if (pMax > 0.12) push(3, `\\u901A\\u9053\\u76F8\\u4F4D\\u4E00\\u81F4\\u6027\\u504F\\u9AD8,\\u53EF\\u80FD\\u5B58\\u5728\\u4E0D\\u53EF\\u89C1\\u6C34\\u5370 (max=${pMax.toFixed(3)})`, pMax);\n    if (Math.abs(f.f26_cross_color_phase_corr) > 0.15) push(2, `\\u8DE8\\u901A\\u9053\\u76F8\\u4F4D\\u76F8\\u5173\\u6027\\u5F02\\u5E38 (${f.f26_cross_color_phase_corr.toFixed(3)})`, f.f26_cross_color_phase_corr);\n    const lsbMax = Math.max(f.f27_lsb0_bias_r, f.f28_lsb0_bias_g, f.f29_lsb0_bias_b);\n    if (lsbMax > 0.04) push(2, `LSB \\u504F\\u79BB 0.5 (${lsbMax.toFixed(3)})`, lsbMax);\n    const avgKurt = (Math.abs(f.f36_pixel_kurt_r) + Math.abs(f.f36b_pixel_kurt_g) + Math.abs(f.f36c_pixel_kurt_b)) / 3;\n    if (avgKurt < 0.3) push(1, `\\u50CF\\u7D20\\u5206\\u5E03\\u63A5\\u8FD1\\u6B63\\u6001,\\u63A5\\u8FD1 AI \\u5178\\u578B (avg|kurt|=${avgKurt.toFixed(2)})`, avgKurt);\n    const minCorr = Math.min(f.f37_rg_correlation, f.f38_rb_correlation, f.f39_gb_correlation);\n    if (minCorr < 0.6) push(1, `\\u901A\\u9053\\u95F4\\u76F8\\u5173\\u6027\\u4F4E (min=${minCorr.toFixed(2)})`, minCorr);\n    const avgHV = (f.f40_horz_corr + f.f41_vert_corr) / 2;\n    if (avgHV > 0.995) push(2, `\\u8FC7\\u5EA6\\u5E73\\u6ED1,\\u76F8\\u90BB\\u50CF\\u7D20\\u76F8\\u5173\\u6027\\u6781\\u9AD8 (${avgHV.toFixed(4)})`, avgHV);\n    if (avgHV < 0.85) push(-1, `\\u9AD8\\u9891\\u566A\\u58F0\\u91CD,\\u50CF\\u672A\\u5904\\u7406\\u7167\\u7247 (${avgHV.toFixed(4)})`, avgHV);\n    if (f.f50_wavelet_hh_ratio < 5e-3) push(1, `\\u5C0F\\u6CE2 HH \\u80FD\\u91CF\\u504F\\u4F4E (HH/LL=${f.f50_wavelet_hh_ratio.toExponential(2)})`, f.f50_wavelet_hh_ratio);\n    if (f.f57_dct_block_variance < 100) push(1, `DCT \\u5757\\u95F4\\u4EAE\\u5EA6\\u65B9\\u5DEE\\u4F4E (${f.f57_dct_block_variance.toFixed(0)})`, f.f57_dct_block_variance);\n    const total = votes.reduce((s, v) => s + v.weight, 0);\n    const positive = votes.filter((v) => v.weight > 0).reduce((s, v) => s + v.weight, 0);\n    const negative = -votes.filter((v) => v.weight < 0).reduce((s, v) => s + v.weight, 0);\n    let verdict, confidence;\n    if (total >= 6) {\n      verdict = "\\u9AD8\\u5EA6\\u7591\\u4F3C AI \\u751F\\u6210";\n      confidence = "strong";\n    } else if (total >= 3) {\n      verdict = "\\u5B58\\u5728 AI \\u7279\\u5F81";\n      confidence = "medium";\n    } else if (total >= 1) {\n      verdict = "\\u8F7B\\u5FAE\\u53EF\\u7591";\n      confidence = "weak";\n    } else if (total <= -1) {\n      verdict = "\\u66F4\\u63A5\\u8FD1\\u771F\\u5B9E\\u7167\\u7247";\n      confidence = "info";\n    } else {\n      verdict = "\\u7279\\u5F81\\u6A21\\u7CCA,\\u65E0\\u6CD5\\u5224\\u5B9A";\n      confidence = null;\n    }\n    return { votes, total, positive, negative, verdict, confidence };\n  }\n\n  // src/frequency/worker.js\n  self.onmessage = (e) => {\n    const { type } = e.data;\n    if (type !== "analyze") return;\n    try {\n      const { rgba, gray, w, h } = e.data;\n      const timing = {};\n      const t0 = performance.now();\n      self.postMessage({ type: "progress", stage: "features", pct: 5 });\n      const { features, viz } = extractFeatures(rgba, gray, w, h);\n      timing.features = performance.now() - t0;\n      self.postMessage({ type: "progress", stage: "score", pct: 85 });\n      const score = scoreFeatures(features);\n      timing.score = performance.now() - t0 - timing.features;\n      self.postMessage({ type: "progress", stage: "viz", pct: 92 });\n      const vizOut = {\n        fftMag128: downsampleMag(viz.mag, w, h, 128, 128),\n        radial64: viz.radial.slice(0),\n        phaseConsistency: {\n          r: features.f22_phase_consistency_r,\n          g: features.f23_phase_consistency_g,\n          b: features.f24_phase_consistency_b\n        },\n        waveletEnergies: {\n          LL2: features.f47_wavelet_ll2_energy,\n          HH1: features.f45_wavelet_hh1_energy,\n          HH2: features.f46_wavelet_hh2_energy,\n          LH1_ratio: features.f48_wavelet_lh_ratio,\n          HL1_ratio: features.f49_wavelet_hl_ratio,\n          HH1_ratio: features.f50_wavelet_hh_ratio\n        }\n      };\n      self.postMessage({\n        type: "result",\n        features,\n        viz: vizOut,\n        score,\n        timing\n      }, [vizOut.fftMag128.buffer, vizOut.radial64.buffer]);\n    } catch (err) {\n      self.postMessage({ type: "error", message: err?.message || String(err), stack: err?.stack });\n    }\n  };\n})();\n';
    }
  });

  // src/frequency/index.js
  function pickSize(w2, h2, isMobile) {
    const maxDim = isMobile ? 768 : 1024;
    const m2 = Math.min(maxDim, Math.max(w2, h2));
    for (const t3 of POW2_TARGETS) if (t3 <= m2) return t3;
    return 256;
  }
  function nearestPow2(n2) {
    return 1 << Math.floor(Math.log2(Math.max(n2, 2)));
  }
  async function analyzeFrequency(bytes, mime, opts = {}) {
    const onProgress = opts.onProgress || (() => {
    });
    const blob = new Blob([bytes], { type: mime });
    const bitmap = await createImageBitmap(blob);
    try {
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const side = nearestPow2(Math.min(
        pickSize(bitmap.width, bitmap.height, isMobile),
        Math.max(bitmap.width, bitmap.height)
      ));
      onProgress({ stage: "resize", pct: 3, info: `${bitmap.width}\xD7${bitmap.height} \u2192 ${side}\xD7${side}` });
      const canvas = document.createElement("canvas");
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, side, side);
      const rgba = ctx.getImageData(0, 0, side, side).data;
      const gray = new Float32Array(side * side);
      for (let i2 = 0, j2 = 0; i2 < rgba.length; i2 += 4, j2++) {
        gray[j2] = 0.299 * rgba[i2] + 0.587 * rgba[i2 + 1] + 0.114 * rgba[i2 + 2];
      }
      return await new Promise((resolve, reject) => {
        const blob2 = new Blob([WORKER_SOURCE], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(blob2);
        const worker = new Worker(workerUrl);
        setTimeout(() => URL.revokeObjectURL(workerUrl), 1e3);
        worker.onmessage = (e2) => {
          const m2 = e2.data;
          if (m2.type === "progress") onProgress(m2);
          else if (m2.type === "error") {
            worker.terminate();
            reject(new Error(m2.message));
          } else if (m2.type === "result") {
            worker.terminate();
            resolve({ ...m2, side });
          }
        };
        worker.onerror = (err) => {
          worker.terminate();
          reject(new Error("Frequency worker failed: " + (err.message || "unknown")));
        };
        const rgbaCopy = new Uint8ClampedArray(rgba);
        worker.postMessage({
          type: "analyze",
          rgba: rgbaCopy,
          gray,
          w: side,
          h: side
        }, [rgbaCopy.buffer, gray.buffer]);
      });
    } finally {
      bitmap.close?.();
    }
  }
  var POW2_TARGETS;
  var init_frequency = __esm({
    "src/frequency/index.js"() {
      init_worker_source();
      POW2_TARGETS = [1024, 768, 512, 384, 256];
    }
  });

  // src/frequency/panel.js
  function renderFrequencyPanel(container, result) {
    const { features, viz, score, timing, side } = result;
    container.innerHTML = `
        <div class="freq-disclaimer">
            <span class="freq-disclaimer-tag">\u975E\u5C08\u696D\u5206\u6790</span>
            <span>\u50C5\u4F9B\u53C3\u8003 \xB7 \u57FA\u65BC 12 \u689D\u555F\u767C\u5F0F\u898F\u5247,\u4E0D\u7B49\u540C\u65BC\u5B78\u8853\u7D1A\u5206\u985E\u5668\u3002\u5C0D\u73FE\u4EE3\u64F4\u6563\u6A21\u578B(SD/DALL-E/Gemini/Flux)\u8AA4\u5224\u7387\u8F03\u9AD8\u3002</span>
        </div>
        <div class="freq-head">
            <div class="freq-verdict ${score.confidence ? "conf-" + score.confidence : ""}">
                <span class="freq-verdict-label">\u555F\u767C\u5F0F\u5224\u5B9A</span>
                <span class="freq-verdict-value">${escHtml2(score.verdict)}</span>
                <span class="freq-score">\u5F97\u5206 ${score.total} \xB7 \u6B63\u5411\u8B49\u64DA ${score.positive} \xB7 \u53CD\u5411 ${score.negative}</span>
            </div>
            <div class="freq-timing">\u5206\u6790\u5206\u8FA8\u7387 ${side}\xD7${side} \xB7 \u7528\u6642 ${Math.round(timing.features + timing.score)}ms</div>
        </div>
        <div class="freq-viz">
            <div class="freq-viz-box">
                <div class="freq-viz-title">FFT \u5E45\u5EA6\u8B5C(\u5C0D\u6578\u57DF)</div>
                <canvas id="fftCanvas" width="256" height="256"></canvas>
                <div class="freq-viz-hint">DC \u5728\u4E2D\u5FC3 \xB7 \u8D8A\u4EAE\u8868\u793A\u8A72\u983B\u7387\u5206\u91CF\u80FD\u91CF\u8D8A\u5F37 \xB7 AI \u5716\u50CF\u50BE\u5411\u65BC\u770B\u8D77\u4F86\u66F4"\u4E7E\u6DE8"(\u5C11\u96A8\u6A5F\u566A\u8072)</div>
            </div>
            <div class="freq-viz-box">
                <div class="freq-viz-title">\u5F91\u5411\u529F\u7387\u8B5C</div>
                <canvas id="radialCanvas" width="320" height="160"></canvas>
                <div class="freq-viz-hint">\u6A6B\u8EF8 = \u983B\u7387,\u7E31\u8EF8 = \u5C0D\u6578\u529F\u7387 \xB7 \u771F\u5BE6\u7167\u7247\u7D04\u5448 1/f \u8870\u6E1B;AI \u5716\u50CF\u5E38\u504F\u5E73\u5766\u6216\u7570\u5E38\u5CF0\u503C</div>
            </div>
        </div>
        <div class="freq-votes">
            <div class="freq-subtitle">\u5224\u5B9A\u4F9D\u64DA(${score.votes.length} \u689D\u898F\u5247\u89F8\u767C)</div>
            ${score.votes.length === 0 ? '<div class="freq-empty">\u6C92\u6709\u898F\u5247\u88AB\u89F8\u767C,\u7279\u5FB5\u843D\u5728\u6B63\u5E38\u7BC4\u570D\u5167\u3002</div>' : score.votes.map((v2) => `
                    <div class="freq-vote ${v2.weight > 0 ? "vote-pos" : "vote-neg"}">
                        <span class="vote-weight">${v2.weight > 0 ? "+" : ""}${v2.weight}</span>
                        <span class="vote-reason">${escHtml2(v2.reason)}</span>
                    </div>
                `).join("")}
        </div>
        <details class="freq-features">
            <summary>\u5168\u90E8\u7279\u5FB5\u503C (${Object.keys(features).length})</summary>
            <table class="freq-table">
                ${Object.entries(features).map(([k2, v2]) => `
                    <tr><td>${escHtml2(k2)}</td><td>${typeof v2 === "number" ? v2.toFixed(4) : v2}</td></tr>
                `).join("")}
            </table>
        </details>
    `;
    drawFftHeatmap(container.querySelector("#fftCanvas"), viz.fftMag128);
    drawRadialCurve(container.querySelector("#radialCanvas"), viz.radial64);
  }
  function escHtml2(s2) {
    const d2 = document.createElement("div");
    d2.textContent = s2 == null ? "" : String(s2);
    return d2.innerHTML;
  }
  function drawFftHeatmap(canvas, mag128) {
    const ctx = canvas.getContext("2d");
    const N2 = 128, dst = canvas.width;
    const logVals = new Float32Array(mag128.length);
    let maxV = 0;
    for (let i2 = 0; i2 < mag128.length; i2++) {
      logVals[i2] = Math.log(1 + mag128[i2]);
      if (logVals[i2] > maxV) maxV = logVals[i2];
    }
    const img = ctx.createImageData(dst, dst);
    const scale = dst / N2;
    for (let y2 = 0; y2 < dst; y2++) {
      for (let x2 = 0; x2 < dst; x2++) {
        const sx = Math.floor(x2 / scale), sy = Math.floor(y2 / scale);
        const v2 = maxV > 0 ? logVals[sy * N2 + sx] / maxV : 0;
        const [r2, g2, b2] = viridis(v2);
        const i2 = (y2 * dst + x2) * 4;
        img.data[i2] = r2;
        img.data[i2 + 1] = g2;
        img.data[i2 + 2] = b2;
        img.data[i2 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  function drawRadialCurve(canvas, radial) {
    const ctx = canvas.getContext("2d");
    const w2 = canvas.width, h2 = canvas.height;
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--surface-alt").trim() || "#fafafa";
    const grid = styles.getPropertyValue("--border").trim() || "#e0e0e0";
    const curve = styles.getPropertyValue("--text").trim() || "#0a0a0b";
    const label = styles.getPropertyValue("--text-muted").trim() || "#666";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w2, h2);
    const N2 = radial.length;
    const pad = 28;
    const logR = Array.from(radial, (v2) => Math.log(Math.max(v2, 1e-6)));
    let lo = Infinity, hi = -Infinity;
    for (let i2 = 1; i2 < N2; i2++) {
      if (logR[i2] < lo) lo = logR[i2];
      if (logR[i2] > hi) hi = logR[i2];
    }
    const span = hi - lo || 1;
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let k2 = 1; k2 < 4; k2++) {
      const y2 = pad + (h2 - 2 * pad) * (k2 / 4);
      ctx.beginPath();
      ctx.moveTo(pad, y2);
      ctx.lineTo(w2 - pad, y2);
      ctx.stroke();
    }
    ctx.strokeStyle = curve;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    for (let i2 = 1; i2 < N2; i2++) {
      const px = pad + (w2 - 2 * pad) * (i2 - 1) / (N2 - 2);
      const py = h2 - pad - (h2 - 2 * pad) * (logR[i2] - lo) / span;
      if (i2 === 1) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = label;
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("\u4F4E\u983B", pad - 4, h2 - 8);
    ctx.fillText("\u9AD8\u983B", w2 - pad - 20, h2 - 8);
    ctx.fillText("log(power)", 2, 12);
  }
  function viridis(t3) {
    t3 = Math.max(0, Math.min(1, t3));
    const stops = [
      [68, 1, 84],
      [59, 82, 139],
      [33, 144, 141],
      [93, 201, 99],
      [253, 231, 37]
    ];
    const s2 = t3 * (stops.length - 1);
    const i2 = Math.floor(s2), f2 = s2 - i2;
    if (i2 >= stops.length - 1) return stops[stops.length - 1];
    const [r0, g0, b0] = stops[i2], [r1, g1, b1] = stops[i2 + 1];
    return [r0 + (r1 - r0) * f2, g0 + (g1 - g0) * f2, b0 + (b1 - b0) * f2];
  }
  var init_panel = __esm({
    "src/frequency/panel.js"() {
    }
  });

  // src/panel-metadata.js
  function fmtExposure(t3) {
    if (t3 == null) return null;
    if (typeof t3 === "number") {
      if (t3 >= 1) return `${t3}s`;
      return `1/${Math.round(1 / t3)}s`;
    }
    if (Array.isArray(t3) && t3.length === 2) {
      const [num, den] = t3;
      if (num / den >= 1) return `${(num / den).toFixed(1)}s`;
      return `${num}/${den}s`;
    }
    return String(t3);
  }
  function fmtCoord(deg, ref) {
    if (deg == null) return null;
    const d2 = Math.abs(deg);
    const dd = Math.floor(d2);
    const mm = Math.floor((d2 - dd) * 60);
    const ss = ((d2 - dd - mm / 60) * 3600).toFixed(2);
    return `${dd}\xB0${mm}'${ss}" ${ref || (deg >= 0 ? "" : "-")}`;
  }
  function row(label, value, mono = false) {
    if (value == null || value === "") return "";
    return `<div class="md-row"><span class="md-label">${escHtml(label)}</span><span class="md-value${mono ? " mono" : ""}">${escHtml(value)}</span></div>`;
  }
  function section(title, rows, opts = {}) {
    const content = rows.filter(Boolean).join("");
    if (!content) return "";
    const note = opts.note ? `<div class="md-note ${opts.noteType || ""}">${escHtml(opts.note)}</div>` : "";
    return `<section class="md-section ${opts.accent || ""}">
        <h4 class="md-section-title">${escHtml(title)}${opts.count ? ` <span class="md-count">${opts.count}</span>` : ""}</h4>
        ${note}
        <div class="md-rows">${content}</div>
    </section>`;
  }
  function renderMetadataPanel(container, ctx) {
    const m2 = ctx.meta || {};
    const jumbf = ctx.jumbf || {};
    const file = ctx.file;
    const hasAny = Object.keys(m2).filter((k2) => !k2.startsWith("_")).length > 0;
    const signals = analyzeVerdict(m2, jumbf);
    const verdictHtml = `
        <section class="md-verdict md-verdict-${signals.level}">
            <div class="md-verdict-icon">${signals.icon}</div>
            <div class="md-verdict-text">
                <div class="md-verdict-title">${escHtml(signals.title)}</div>
                <div class="md-verdict-sub">${escHtml(signals.sub)}</div>
            </div>
        </section>`;
    const cameraRows = [
      row("\u54C1\u724C", m2.Make),
      row("\u578B\u865F", m2.Model),
      row("\u56FA\u4EF6", m2.Software),
      row("\u93E1\u982D", m2.LensModel || m2.Lens),
      row("\u93E1\u982D\u5EE0", m2.LensMake),
      row("\u93E1\u982D\u5E8F\u5217\u865F", m2.LensSerialNumber),
      row("\u6A5F\u8EAB\u5E8F\u5217\u865F", m2.BodySerialNumber || m2.SerialNumber),
      row("\u6240\u6709\u8005", m2.OwnerName || m2.Artist)
    ];
    const captureRows = [
      row("\u5149\u5708", m2.FNumber ? `f/${m2.FNumber}` : null),
      row("\u5FEB\u9580", fmtExposure(m2.ExposureTime)),
      row("ISO", m2.ISO || m2.ISOSpeedRatings),
      row("\u7126\u8DDD", m2.FocalLength ? `${m2.FocalLength}mm` : null),
      row("\u7B49\u6548\u7126\u8DDD", m2.FocalLengthIn35mmFormat ? `${m2.FocalLengthIn35mmFormat}mm (35mm)` : null),
      row("\u66DD\u5149\u88DC\u511F", m2.ExposureCompensation != null ? `${m2.ExposureCompensation > 0 ? "+" : ""}${m2.ExposureCompensation} EV` : null),
      row("\u66DD\u5149\u7A0B\u5E8F", m2.ExposureProgram),
      row("\u6E2C\u5149\u6A21\u5F0F", m2.MeteringMode),
      row("\u767D\u5E73\u8861", m2.WhiteBalance),
      row("\u9583\u5149\u71C8", typeof m2.Flash === "string" ? m2.Flash : m2.Flash != null ? m2.Flash === 0 ? "\u672A\u9583\u5149" : "\u5DF2\u9583\u5149" : null)
    ];
    const formatDate = (d2) => d2 instanceof Date ? d2.toLocaleString("zh-CN") : d2 ? String(d2) : null;
    const timeRows = [
      row("\u62CD\u651D\u6642\u9593", formatDate(m2.DateTimeOriginal)),
      row("\u6578\u5B57\u5316\u6642\u9593", formatDate(m2.DateTimeDigitized || m2.CreateDate)),
      row("\u6700\u5F8C\u4FEE\u6539", formatDate(m2.ModifyDate || m2.DateTime))
    ];
    const lat = Number.isFinite(m2.latitude) ? m2.latitude : (Number.isFinite(m2.GPSLatitude) ? m2.GPSLatitude : null);
    const lon = Number.isFinite(m2.longitude) ? m2.longitude : (Number.isFinite(m2.GPSLongitude) ? m2.GPSLongitude : null);
    const alt = m2.GPSAltitude;
    const hasGps = lat != null && lon != null;
    const gpsRows = hasGps ? [
      row("\u7D93\u7DEF\u5EA6", `${lat.toFixed(6)}, ${lon.toFixed(6)}`),
      row("DMS", `${fmtCoord(lat, m2.GPSLatitudeRef || (lat >= 0 ? "N" : "S"))}  /  ${fmtCoord(lon, m2.GPSLongitudeRef || (lon >= 0 ? "E" : "W"))}`),
      row("\u6D77\u62D4", alt != null ? `${typeof alt === "number" ? alt.toFixed(1) : alt}m` : null),
      row("\u65B9\u5411", m2.GPSImgDirection != null ? `${m2.GPSImgDirection}\xB0 ${m2.GPSImgDirectionRef || ""}` : null),
      row("\u6642\u9593\u6233 (UTC)", formatDate(m2.GPSDateStamp || m2.GPSTimeStamp))
    ] : [];
    const gpsNote = hasGps ? "\u26A0\uFE0F \u9019\u5F35\u5716\u9644\u5E36\u7CBE\u78BA GPS \u5EA7\u6A19,\u5206\u4EAB\u524D\u5EFA\u8B70\u7528\u300C\u8F49\u63DB\u300D\u6A19\u7C64\u9801\u525D\u96E2\u5143\u6578\u64DA\u3002" : null;
    const gpsExtra = hasGps ? `<div class="md-actions">
        <a class="btn-secondary btn-xs" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${lat},${lon}">\u5728 Google Maps \u67E5\u770B</a>
        <a class="btn-secondary btn-xs" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15">\u5728 OpenStreetMap \u67E5\u770B</a>
    </div>` : "";
    const imgRows = [
      row("\u5C3A\u5BF8", ctx.dims),
      row("\u8272\u5F69\u7A7A\u9593", m2.ColorSpace === 1 || m2.ColorSpace === "sRGB" ? "sRGB" : m2.ColorSpace),
      row("ICC \u914D\u7F6E", m2.ProfileDescription || m2.ICC_Profile_Description),
      row("\u65B9\u5411", m2.Orientation),
      row("\u5206\u8FA8\u7387", m2.XResolution ? `${m2.XResolution} \xD7 ${m2.YResolution || m2.XResolution} DPI` : null)
    ];
    const hist = m2.History || m2["xmpMM:History"] || m2.historyItems;
    let histHtml = "";
    if (Array.isArray(hist) && hist.length) {
      const items = hist.slice(0, 20).map((h2) => {
        const action = h2.action || h2.Action || "\u2014";
        const when = h2.when ? formatDate(h2.when) : "";
        const soft = h2.softwareAgent || h2.SoftwareAgent || "";
        return `<li><span class="md-hist-action">${escHtml(action)}</span> <span class="md-hist-meta">${escHtml(soft)} ${escHtml(when)}</span></li>`;
      }).join("");
      histHtml = `<section class="md-section">
            <h4 class="md-section-title">\u7DE8\u8F2F\u6B77\u53F2 <span class="md-count">${hist.length}</span></h4>
            <ol class="md-hist">${items}</ol>
        </section>`;
    }
    let c2paHtml = "";
    if (jumbf.present) {
      const c2paRows = [
        row("DigitalSourceType", jumbf.digitalSourceType || "\u672A\u8072\u660E"),
        row("JUMBF boxes", jumbf.indices.length),
        row("Labels", jumbf.labels.join(", ") || "\u2014")
      ];
      c2paHtml = section("C2PA / Content Credentials", c2paRows, { accent: "accent" });
    }
    const rawLines = [];
    for (const [k2, v2] of Object.entries(m2)) {
      if (k2.startsWith("_")) continue;
      let vs = v2;
      if (v2 instanceof Date) vs = v2.toISOString();
      else if (typeof v2 === "object") vs = JSON.stringify(v2);
      else if (typeof v2 === "number") vs = v2.toString();
      rawLines.push(`${k2}: ${vs}`);
    }
    const rawHtml = rawLines.length ? `<details class="md-raw">
        <summary>\u5168\u90E8\u539F\u59CB\u5B57\u6BB5 (${rawLines.length})</summary>
        <pre>${escHtml(rawLines.join("\n"))}</pre>
    </details>` : "";
    container.innerHTML = `
        ${verdictHtml}
        ${c2paHtml}
        ${section("\u76F8\u6A5F\u8207\u93E1\u982D", cameraRows)}
        ${section("\u62CD\u651D\u53C3\u6578", captureRows)}
        ${section("\u6642\u9593", timeRows)}
        ${hasGps ? section("\u5730\u7406\u4F4D\u7F6E", gpsRows, { note: gpsNote, noteType: "warn", accent: "accent" }) + gpsExtra : ""}
        ${section("\u5716\u50CF\u5C6C\u6027", imgRows)}
        ${histHtml}
        ${!hasAny && !jumbf.present ? '<section class="md-empty">\u9019\u5F35\u5716\u5E7E\u4E4E\u4E0D\u542B\u4EFB\u4F55\u5143\u6578\u64DA \u2014\u2014 \u8981\u9EBC\u88AB\u525D\u96E2\u904E,\u8981\u9EBC\u6E90\u81EA AI \u751F\u6210\u6216\u622A\u5716\u3002</section>' : ""}
        ${rawHtml}
    `;
  }
  function analyzeVerdict(m2, jumbf) {
    const hasCamera = !!(m2.Make && m2.Model);
    const hasLens = !!(m2.LensModel || m2.Lens);
    const hasCaptureParams = m2.FNumber && m2.ExposureTime && (m2.ISO || m2.ISOSpeedRatings);
    const hasGps = m2.latitude != null || m2.GPSLatitude != null;
    const hasMakerNote = !!(m2.MakerNote || m2.makerNote);
    const c2paAi = jumbf?.digitalSourceType && [
      "trainedAlgorithmicMedia",
      "compositeWithTrainedAlgorithmicMedia",
      "algorithmicMedia",
      "dataDrivenMedia"
    ].includes(jumbf.digitalSourceType);
    const c2paReal = jumbf?.digitalSourceType === "digitalCapture";
    const softIsAi = /Midjourney|Stable|Diffusion|ComfyUI|DALL|OpenAI|Firefly|Gemini|Imagen/i.test(m2.Software || "");
    if (c2paAi || softIsAi) {
      return {
        level: "ai",
        icon: "\u{1F916}",
        title: "\u5143\u6578\u64DA\u76F4\u63A5\u8072\u660E AI \u751F\u6210",
        sub: softIsAi ? `Software \u5B57\u6BB5: ${m2.Software}` : `C2PA DigitalSourceType: ${jumbf.digitalSourceType}`
      };
    }
    if (c2paReal) {
      return {
        level: "strong",
        icon: "\u{1F4F8}",
        title: "\u76F8\u6A5F\u539F\u751F C2PA \u6191\u8B49",
        sub: `C2PA DigitalSourceType = digitalCapture \xB7 \u8A2D\u5099\u5EE0\u5546\u7C3D\u540D\u53EF\u9A57\u8B49`
      };
    }
    let realScore = 0;
    if (hasCamera) realScore++;
    if (hasLens) realScore++;
    if (hasCaptureParams) realScore += 2;
    if (hasMakerNote) realScore += 2;
    if (hasGps) realScore++;
    if (realScore >= 4) return {
      level: "strong",
      icon: "\u{1F4F8}",
      title: "\u5F37\u70C8\u6307\u5411\u771F\u5BE6\u76F8\u6A5F\u62CD\u651D",
      sub: "\u5143\u6578\u64DA\u5305\u542B\u76F8\u6A5F/\u93E1\u982D/\u62CD\u651D\u53C3\u6578/\u5EE0\u5546\u79C1\u6709\u5B57\u6BB5,AI \u5716\u7247\u901A\u5E38\u7121\u6CD5\u507D\u9020\u6240\u6709\u9019\u4E9B\u3002"
    };
    if (realScore >= 2) return {
      level: "medium",
      icon: "\u{1F4F7}",
      title: "\u6709\u76F8\u6A5F\u5143\u6578\u64DA\u75D5\u8DE1",
      sub: "\u90E8\u5206\u76F8\u6A5F\u5B57\u6BB5\u5B58\u5728,\u4F46\u4E0D\u8DB3\u4EE5\u78BA\u8A8D\u672A\u88AB\u507D\u9020\u3002"
    };
    if (hasCamera) return {
      level: "weak",
      icon: "\u{1F4CE}",
      title: "\u50C5\u6709\u57FA\u790E\u76F8\u6A5F\u5B57\u6BB5",
      sub: "Make/Model \u5B58\u5728,\u4F46\u7F3A\u5C11\u62CD\u651D\u53C3\u6578\u7B49\u5F37\u8B49\u64DA\u3002\u53EF\u80FD\u7D93\u904E\u4E86\u91CD\u58D3\u7E2E\u6216\u8EDF\u4EF6\u8655\u7406\u3002"
    };
    return {
      level: "none",
      icon: "\u25CB",
      title: "\u7121\u53EF\u7528\u5143\u6578\u64DA",
      sub: "\u5716\u7247\u5E7E\u4E4E\u4E0D\u542B\u5143\u6578\u64DA\u3002\u53EF\u80FD\u4F86\u81EA\u622A\u5716\u3001\u793E\u4EA4\u5A92\u9AD4\u91CD\u7DE8\u78BC,\u6216\u672C\u5C31\u662F AI \u751F\u6210\u3002"
    };
  }
  var init_panel_metadata = __esm({
    "src/panel-metadata.js"() {
      init_utils();
    }
  });

  // src/stats.js
  async function readCounter(key) {
    try {
      const r2 = await fetch(`${API}/${WORKSPACE}/${key}`);
      if (!r2.ok) return null;
      const data = await r2.json();
      return data?.data?.up_count ?? data?.count ?? data?.value ?? null;
    } catch {
      return null;
    }
  }
  async function bumpCounter(key) {
    try {
      const r2 = await fetch(`${API}/${WORKSPACE}/${key}/up`);
      if (!r2.ok) return null;
      const data = await r2.json();
      return data?.data?.up_count ?? data?.count ?? data?.value ?? null;
    } catch {
      return null;
    }
  }
  function renderCount(elId, val) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = val != null ? val.toLocaleString() : "\u2014";
  }
  async function trackAnalysis() {
    const n2 = await bumpCounter("image-provenance-analyses");
    renderCount("statAnalyses", n2);
  }
  async function trackConversion() {
    const n2 = await bumpCounter("image-provenance-conversions");
    renderCount("statConversions", n2);
  }
  async function initStats() {
    const bar = document.getElementById("statsBar");
    if (!bar) return;
    bar.classList.remove("hidden");
    const firstVisit = !sessionStorage.getItem(SESSION_KEY);
    if (firstVisit) {
      const n2 = await bumpCounter("image-provenance-visits");
      renderCount("statVisits", n2);
      sessionStorage.setItem(SESSION_KEY, "1");
    } else {
      readCounter("image-provenance-visits").then((n2) => renderCount("statVisits", n2));
    }
    COUNTERS.slice(1).forEach(({ key, el }) => {
      readCounter(key).then((n2) => renderCount(el, n2));
    });
  }
  var WORKSPACE, API, COUNTERS, SESSION_KEY;
  var init_stats = __esm({
    "src/stats.js"() {
      WORKSPACE = "image-provenance";
      API = "https://api.counterapi.dev/v2";
      COUNTERS = [
        { key: "image-provenance-visits", label: "\u8A2A\u554F", el: "statVisits" },
        { key: "image-provenance-analyses", label: "\u6AA2\u6E2C", el: "statAnalyses" },
        { key: "image-provenance-conversions", label: "\u8F49\u63DB", el: "statConversions" }
      ];
      SESSION_KEY = "ip_visited";
    }
  });

  // src/i18n.js
  function detectLang() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("lang");
    if (fromUrl === "en" || fromUrl === "zh") return fromUrl;
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "zh") return saved;
    return /^zh\b/i.test(navigator.language || "") ? "zh" : "en";
  }
  function getLang() {
    return _lang || (_lang = detectLang());
  }
  async function refineLangByIP() {
  }
  function t2(key, vars) {
    const lang = getLang();
    const entry = STRINGS[key];
    if (!entry) return key;
    let s2 = entry[lang] ?? entry.zh ?? key;
    if (vars) for (const k2 in vars) s2 = s2.replace("${" + k2 + "}", vars[k2]);
    return s2;
  }
  function setLang(lang) {
    if (lang !== "en" && lang !== "zh") return;
    _lang = lang;
    localStorage.setItem("lang", lang);
    const url = new URL(window.location.href);
    if (lang === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    history.replaceState(null, "", url.toString());
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    applyI18n();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }
  function applyI18n() {
    const lang = getLang();
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k2 = el.dataset.i18n;
      const txt = t2(k2);
      if (el.dataset.i18nHtml === "" || k2.endsWith(".html")) el.innerHTML = txt;
      else el.textContent = txt;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      for (const pair of el.dataset.i18nAttr.split(",")) {
        const [attr, k2] = pair.split(":");
        el.setAttribute(attr, t2(k2));
      }
    });
    const title = t2("seo.title");
    if (title && title !== "seo.title") document.title = title;
    const setMeta = (sel, key) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const v2 = t2(key);
      if (v2 && v2 !== key) el.setAttribute("content", v2);
    };
    setMeta('meta[name="description"]', "seo.description");
    setMeta('meta[name="keywords"]', "seo.keywords");
    setMeta('meta[property="og:title"]', "seo.ogTitle");
    setMeta('meta[property="og:description"]', "seo.ogDescription");
    setMeta('meta[name="twitter:title"]', "seo.ogTitle");
    setMeta('meta[name="twitter:description"]', "seo.twDescription");
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", lang === "zh" ? "zh_CN" : "en_US");
  }
  var STRINGS, _lang;
  var init_i18n = __esm({
    "src/i18n.js"() {
      STRINGS = {
        // Hero / empty-state
        "hero.title": { zh: "\u8FFD\u6EAF\u4E00\u5F35\u5716\u7684\u4F86\u8DEF", en: "Trace where an image comes from" },
        "hero.sub": { zh: "\u6AA2\u6E2C C2PA \u6191\u8B49\u3001AI \u751F\u6210\u7C3D\u540D\u3001\u983B\u57DF\u6C34\u5370\u75D5\u8DE1\u3002", en: "Detect C2PA credentials, AI-generated signatures, and frequency-domain watermark traces." },
        "hero.feature.c2pa": { zh: "C2PA / Content Credentials", en: "C2PA / Content Credentials" },
        "hero.feature.vendors": { zh: "OpenAI \xB7 Google SynthID \xB7 Midjourney \xB7 SD", en: "OpenAI \xB7 Google SynthID \xB7 Midjourney \xB7 SD" },
        "hero.feature.freq": { zh: "65 \u9805\u983B\u57DF\u7279\u5FB5 + \u555F\u767C\u5F0F\u6253\u5206", en: "65 frequency features + heuristic scoring" },
        "hero.feature.clean": { zh: "\u5143\u6578\u64DA\u6E05\u6D17 / \u76F8\u6A5F EXIF \u507D\u88DD", en: "Metadata stripping & camera EXIF spoofing" },
        // Topbar
        "topbar.github": { zh: "GitHub", en: "GitHub" },
        "topbar.theme": { zh: "\u5207\u63DB\u4E3B\u984C", en: "Toggle theme" },
        "topbar.lang": { zh: "\u5207\u63DB\u8A9E\u8A00", en: "Switch language" },
        // Upload
        "upload.text.html": { zh: "\u62D6\u62FD\u5716\u7247\u5230\u6B64\u8655<br>\u6216 <strong>\u9EDE\u64CA\u9078\u64C7</strong>", en: "Drag an image here<br>or <strong>click to select</strong>" },
        "upload.hint": { zh: "PNG \xB7 JPEG \xB7 WebP", en: "PNG \xB7 JPEG \xB7 WebP" },
        "upload.changeFile": { zh: "\u63DB\u4E00\u5F35", en: "Change" },
        // File meta
        "fm.type": { zh: "\u985E\u578B", en: "Type" },
        "fm.size": { zh: "\u5927\u5C0F", en: "Size" },
        "fm.dims": { zh: "\u5C3A\u5BF8", en: "Dims" },
        "fm.hash": { zh: "SHA-256", en: "SHA-256" },
        // Result header
        "result.eyebrow": { zh: "\u5206\u6790\u7D50\u679C", en: "Analysis" },
        "result.analyzing": { zh: "\u6B63\u5728\u5206\u6790", en: "Analyzing" },
        "result.aiHit": { zh: "\u767C\u73FE AI \u4F86\u6E90\u6191\u8B49\u7DDA\u7D22", en: "AI provenance signal found" },
        "result.aiClean": { zh: "\u672A\u767C\u73FE AI \u4F86\u6E90\u6191\u8B49", en: "No AI provenance signal" },
        "result.aiHitSub": { zh: "\u5143\u6578\u64DA\u4E2D\u76F4\u63A5\u8072\u660E\u6216\u5F37\u70C8\u6307\u5411 AI \u751F\u6210\u5DE5\u5177\u3002", en: "Metadata explicitly declares or strongly points to an AI generator." },
        "result.weakSub": { zh: "\u672A\u6AA2\u51FA\u5143\u6578\u64DA\u8072\u660E\u7684 AI \u6A19\u8A18;\u50C5\u6709\u5B57\u7BC0\u7D1A\u555F\u767C\u6027\u7570\u5E38,\u4E0D\u8DB3\u4EE5\u5224\u5B9A\u3002", en: "No metadata-level AI markers detected; only weak byte-level anomalies \u2014 insufficient to conclude." },
        "result.editSub": { zh: "\u672A\u6AA2\u51FA AI \u751F\u6210\u6A19\u8A18,\u4F46\u5716\u7247\u7D93\u904E\u4FEE\u5716\u8EDF\u4EF6\u8655\u7406\u3002", en: "No AI markers detected, but the image has been touched by editing software." },
        "result.cleanSub": { zh: "\u5143\u6578\u64DA\u4E2D\u6C92\u6709\u767C\u73FE AI \u751F\u6210\u76F8\u95DC\u6A19\u8A18\u3002", en: "No AI-related markers were found in the metadata." },
        "badge.hit": { zh: "\u547D\u4E2D", en: "HIT" },
        "badge.miss": { zh: "\u672A\u547D\u4E2D", en: "CLEAN" },
        "badge.found": { zh: "\u767C\u73FE", en: "Found" },
        "badge.notfound": { zh: "\u672A\u767C\u73FE", en: "Not found" },
        "badge.foundEdit": { zh: "\u767C\u73FE\u4FEE\u5716\u75D5\u8DE1", en: "Edit traces" },
        "badge.foundMarker": { zh: "\u767C\u73FE\u6A19\u8A18", en: "Marker found" },
        "badge.bytesC2PA": { zh: "\u5B57\u7BC0\u4E2D\u542B C2PA \u5B57\u7B26\u4E32", en: "C2PA string in bytes" },
        "badge.metadataAI": { zh: "\u5143\u6578\u64DA\u547D\u4E2D AI \u751F\u6210\u5DE5\u5177", en: "Metadata names an AI tool" },
        "badge.metadataYes": { zh: "\u5B58\u5728\u5143\u6578\u64DA,\u4F46\u672A\u547D\u4E2D AI", en: "Metadata present, no AI marker" },
        "badge.metadataNone": { zh: "\u7121\u53EF\u8B80\u5143\u6578\u64DA", en: "No readable metadata" },
        "badge.wmSuspect": { zh: "\u7591\u4F3C\u6C34\u5370", en: "Watermark suspect" },
        "badge.wmClean": { zh: "\u672A\u6AA2\u6E2C\u5230\u7570\u5E38", en: "No anomaly" },
        "conf.strong": { zh: "\u5F37\u8B49\u64DA", en: "Strong" },
        "conf.medium": { zh: "\u4E2D\u7B49", en: "Medium" },
        "conf.weak": { zh: "\u5F31", en: "Weak" },
        "conf.info": { zh: "\u63D0\u793A", en: "Note" },
        // Detection card (titles + canned descriptions)
        "det.detail.viewMore": { zh: "\u67E5\u770B\u8A73\u60C5", en: "View details" },
        "det.title.c2pa": { zh: "C2PA / Content Credentials", en: "C2PA / Content Credentials" },
        "det.desc.c2pa.aiType": { zh: "\u5716\u7247\u5D4C\u5165\u4E86 C2PA \u4F86\u6E90\u6191\u8B49,\u4E26\u660E\u78BA\u8072\u660E\u70BA\u7B97\u6CD5\u751F\u6210\u5167\u5BB9\u3002", en: "Image embeds a C2PA credential explicitly declaring algorithmic generation." },
        "det.desc.c2pa.present": { zh: "\u5716\u7247\u5D4C\u5165\u4E86 C2PA \u4F86\u6E90\u6191\u8B49\u3002", en: "Image embeds a C2PA credential." },
        "det.desc.c2pa.bytes": { zh: "\u6587\u4EF6\u5B57\u7BC0\u4E2D\u51FA\u73FE C2PA \u76F8\u95DC\u5B57\u7B26\u4E32,\u4F46\u672A\u767C\u73FE\u5B8C\u6574 JUMBF \u7D50\u69CB\u3002", en: "C2PA-related strings present in bytes, but no full JUMBF structure." },
        "det.desc.c2pa.none": { zh: "\u6C92\u6709\u5728\u5B57\u7BC0\u4E2D\u627E\u5230 C2PA/JUMBF \u7DDA\u7D22\u3002", en: "No C2PA / JUMBF traces in the bytes." },
        "det.title.meta": { zh: "\u7D50\u69CB\u5316\u5143\u6578\u64DA (EXIF / XMP / IPTC)", en: "Structured metadata (EXIF / XMP / IPTC)" },
        "det.desc.meta.aiHit": { zh: "\u5716\u7247\u5143\u6578\u64DA\u5B57\u6BB5\u76F4\u63A5\u8A18\u9304\u4E86 AI \u751F\u6210\u5DE5\u5177\u6216\u6A19\u8A18\u3002", en: "Metadata fields explicitly name an AI generator or marker." },
        "det.desc.meta.hasAny": { zh: "\u63D0\u53D6\u5230\u7684\u5143\u6578\u64DA\u5B57\u6BB5\u672A\u5339\u914D AI \u751F\u6210\u6A19\u8A18\u3002", en: "Extracted metadata fields do not match any known AI marker." },
        "det.desc.meta.empty": { zh: "\u5716\u7247\u5E7E\u4E4E\u4E0D\u542B\u5143\u6578\u64DA(\u53EF\u80FD\u88AB\u525D\u96E2)\u3002", en: "Image carries almost no metadata (likely stripped)." },
        "det.title.openai": { zh: "OpenAI / DALL\xB7E / GPT", en: "OpenAI / DALL\xB7E / GPT" },
        "det.desc.openai.miss": { zh: "\u6C92\u6709\u767C\u73FE OpenAI / DALL-E / ChatGPT \u76F8\u95DC\u6A19\u8A18\u3002", en: "No OpenAI / DALL\xB7E / ChatGPT markers found." },
        "det.title.google": { zh: "Google / SynthID / Gemini", en: "Google / SynthID / Gemini" },
        "det.desc.google.miss": { zh: "\u6C92\u6709\u767C\u73FE Google / SynthID / Gemini \u76F8\u95DC\u6A19\u8A18\u3002", en: "No Google / SynthID / Gemini markers found." },
        "det.title.midjourney": { zh: "Midjourney", en: "Midjourney" },
        "det.desc.midjourney.miss": { zh: "\u6C92\u6709\u767C\u73FE Midjourney \u76F8\u95DC\u6A19\u8A18\u3002", en: "No Midjourney markers found." },
        "det.title.sd": { zh: "Stable Diffusion / ComfyUI / Flux", en: "Stable Diffusion / ComfyUI / Flux" },
        "det.desc.sd.miss": { zh: "\u6C92\u6709\u767C\u73FE Stable Diffusion / ComfyUI / Flux \u76F8\u95DC\u6A19\u8A18\u3002", en: "No Stable Diffusion / ComfyUI / Flux markers found." },
        "det.title.adobe": { zh: "Adobe Firefly (AI)", en: "Adobe Firefly (AI)" },
        "det.desc.adobe.miss": { zh: "\u6C92\u6709\u767C\u73FE Adobe Firefly \u76F8\u95DC\u6A19\u8A18\u3002", en: "No Adobe Firefly markers found." },
        "det.title.photoshop": { zh: "Photoshop / \u4FEE\u5716\u8EDF\u4EF6 (\u975E AI)", en: "Photoshop / Edit software (non-AI)" },
        "det.desc.photoshop.miss": { zh: "\u6C92\u6709\u767C\u73FE Photoshop / Lightroom \u8655\u7406\u75D5\u8DE1\u3002", en: "No Photoshop / Lightroom traces found." },
        "det.title.pngtext": { zh: "PNG \u6587\u672C\u584A / \u751F\u6210\u53C3\u6578", en: "PNG text chunks / generation params" },
        "det.desc.pngtext.miss": { zh: "\u6C92\u6709\u767C\u73FE PNG \u6587\u672C\u584A\u4E2D\u7684\u751F\u6210\u53C3\u6578\u3002", en: "No generation params found in PNG text chunks." },
        "det.title.wm": { zh: "\u50CF\u7D20\u7D1A\u96B1\u5F62\u6C34\u5370(\u5B57\u7BC0\u7D1A\u555F\u767C)", en: "Pixel-level invisible watermark (byte heuristic)" },
        "det.desc.wm.suspect": { zh: '\u5B57\u7BC0\u5206\u4F48\u504F\u96E2\u81EA\u7136\u5716\u50CF\u6A21\u578B,\u53EF\u80FD\u5B58\u5728\u96B1\u5F62\u6C34\u5370\u3002\u5B8C\u6574\u983B\u57DF\u5206\u6790\u5C07\u5728"\u983B\u57DF"tab \u63D0\u4F9B\u3002', en: "Byte distribution deviates from natural-image models \u2014 possible invisible watermark. Full frequency analysis is in the Frequency tab." },
        "det.desc.wm.clean": { zh: "\u5B57\u7BC0\u5206\u4F48\u7B26\u5408\u81EA\u7136\u5716\u50CF\u7279\u5FB5,\u672A\u767C\u73FE\u660E\u986F\u6C34\u5370\u75D5\u8DE1\u3002", en: "Byte distribution matches natural images \u2014 no obvious watermark traces." },
        "det.foundOne": { zh: "\u767C\u73FE ${kw}", en: "Found ${kw}" },
        "det.cardKwHits": { zh: "\u767C\u73FE ${list} \u7B49\u76F8\u95DC\u6A19\u8A18\u3002", en: "Found ${list} and related markers." },
        "det.cardEditHits": { zh: "\u6AA2\u6E2C\u5230 ${list} \u4FEE\u5716\u75D5\u8DE1\u3002", en: "Detected ${list} editing traces." },
        // Tabs
        "tab.detect": { zh: "\u6EAF\u6E90", en: "Detect" },
        "tab.freq": { zh: "\u983B\u57DF", en: "Frequency" },
        "tab.meta": { zh: "\u5143\u6578\u64DA", en: "Metadata" },
        "tab.convert": { zh: "\u8F49\u63DB", en: "Convert" },
        // Frequency tab
        "freq.runBtn": { zh: "\u904B\u884C\u983B\u57DF\u5206\u6790", en: "Run frequency analysis" },
        "freq.panelHint.html": { zh: "\u63D0\u53D6 65 \u500B\u983B\u57DF\u7279\u5FB5:FFT \u5E45\u5EA6\u8B5C\u3001\u5F91\u5411\u529F\u7387\u8B5C\u3001\u76F8\u4F4D\u4E00\u81F4\u6027\u3001LSB \u504F\u7F6E\u3001\u5C0F\u6CE2\u5B50\u5E36\u80FD\u91CF\u2026\u2026<br>\u5728 Web Worker \u4E2D\u57F7\u884C,\u4E0D\u963B\u585E\u9801\u9762\u3002\u8017\u6642\u7D04 1-3 \u79D2\u3002", en: "Extracts 65 frequency features: FFT magnitude, radial power spectrum, phase consistency, LSB bias, wavelet sub-bands\u2026<br>Runs in a Web Worker so the UI stays responsive. ~1-3 s." },
        "freq.disclaimer.tag": { zh: "\u975E\u5C08\u696D\u5206\u6790", en: "Not lab-grade" },
        "freq.disclaimer.text": { zh: "\u50C5\u4F9B\u53C3\u8003 \xB7 \u57FA\u65BC\u555F\u767C\u5F0F\u898F\u5247,\u4E0D\u7B49\u540C\u65BC\u5B78\u8853\u7D1A\u5206\u985E\u5668", en: "Reference only \xB7 heuristic rules, not an academic classifier" },
        "freq.verdict.label": { zh: "\u555F\u767C\u5F0F\u5224\u5B9A", en: "Heuristic verdict" },
        "freq.score": { zh: "\u5F97\u5206 ${total} \xB7 \u6B63\u5411\u8B49\u64DA ${pos} \xB7 \u53CD\u5411 ${neg}", en: "Score ${total} \xB7 pros ${pos} \xB7 cons ${neg}" },
        "freq.timing": { zh: "\u5206\u6790\u5206\u8FA8\u7387 ${side}\xD7${side} \xB7 \u7528\u6642 ${ms}ms", en: "Resolution ${side}\xD7${side} \xB7 took ${ms}ms" },
        "freq.viz.fft": { zh: "FFT \u5E45\u5EA6\u8B5C(\u5C0D\u6578)", en: "FFT magnitude (log)" },
        "freq.viz.radial": { zh: "\u5F91\u5411\u529F\u7387\u8B5C", en: "Radial power spectrum" },
        "freq.axis.low": { zh: "\u4F4E\u983B", en: "Low" },
        "freq.axis.high": { zh: "\u9AD8\u983B", en: "High" },
        "freq.votes.title": { zh: "\u5224\u5B9A\u4F9D\u64DA (${n} \u689D\u89F8\u767C)", en: "Rules fired (${n})" },
        "freq.votes.empty": { zh: "\u6C92\u6709\u898F\u5247\u88AB\u89F8\u767C,\u7279\u5FB5\u843D\u5728\u6B63\u5E38\u7BC4\u570D\u5167\u3002", en: "No rules fired \u2014 all features are within normal range." },
        "freq.features.summary": { zh: "\u5168\u90E8\u7279\u5FB5\u503C (${n})", en: "All feature values (${n})" },
        "freq.verdict.highAI": { zh: "\u9AD8\u5EA6\u7591\u4F3C AI \u751F\u6210", en: "Highly likely AI-generated" },
        "freq.verdict.hasAI": { zh: "\u5B58\u5728 AI \u7279\u5FB5", en: "AI-like characteristics" },
        "freq.verdict.weak": { zh: "\u8F15\u5FAE\u53EF\u7591", en: "Slightly suspicious" },
        "freq.verdict.real": { zh: "\u66F4\u63A5\u8FD1\u771F\u5BE6\u7167\u7247", en: "Closer to a real photo" },
        "freq.verdict.unsure": { zh: "\u7279\u5FB5\u6A21\u7CCA,\u7121\u6CD5\u5224\u5B9A", en: "Inconclusive features" },
        "freq.err": { zh: "\u983B\u57DF\u5206\u6790\u5931\u6557: ${msg}", en: "Frequency analysis failed: ${msg}" },
        // Convert tab
        "conv.sub": { zh: "\u525D\u96E2 C2PA / AI \u6A19\u8A18,\u91CD\u7DE8\u78BC\u4E26\u6CE8\u5165\u76F8\u6A5F EXIF,\u8B93\u5716\u7247\u770B\u8D77\u4F86\u50CF\u771F\u5BE6\u76F8\u6A5F\u62CD\u7684\u3002", en: "Strip C2PA / AI markers, re-encode, and inject camera EXIF so the image looks camera-native." },
        "conv.group.phone": { zh: "\u624B\u6A5F", en: "Phone" },
        "conv.group.dslr": { zh: "\u7121\u53CD / \u55AE\u53CD", en: "Mirrorless / DSLR" },
        "conv.group.compact": { zh: "\u7DCA\u6E4A / \u81A0\u7247\u611F", en: "Compact / Film-look" },
        "conv.wm.toggle": { zh: "\u64FE\u52D5\u50CF\u7D20\u7D1A\u96B1\u5F62\u6C34\u5370", en: "Disrupt pixel-level invisible watermark" },
        "conv.wm.hint": { zh: "\u591A\u7A2E\u6280\u8853\u7D44\u5408\u964D\u4F4E SynthID / Stable Signature / dwtDct \u7B49\u6C34\u5370\u53EF\u6AA2\u6E2C\u6027\u3002\u7528\u65BC\u5B78\u8853\u9B6F\u68D2\u6027\u8A55\u4F30\u3002", en: "Combines multiple techniques to reduce detectability of SynthID, Stable Signature, dwtDct watermarks. For academic robustness evaluation." },
        "conv.preset": { zh: "\u9810\u8A2D", en: "Preset" },
        "conv.preset.light": { zh: "\u8F15\u91CF", en: "Light" },
        "conv.preset.rec": { zh: "\u63A8\u85A6", en: "Recommended" },
        "conv.preset.strong": { zh: "\u5F37\u529B", en: "Strong" },
        "conv.preset.ultra": { zh: "\u6975\u9650", en: "Extreme" },
        "conv.preset.custom": { zh: "\u81EA\u5B9A\u7FA9", en: "Custom" },
        "conv.intensity": { zh: "\u5F37\u5EA6", en: "Intensity" },
        "conv.tech.geom": { zh: "\u5E7E\u4F55\u5FAE\u8B8A\u63DB", en: "Micro geometry" },
        "conv.tech.geom.desc": { zh: "\u88C1\u908A 0.3-1.5% \u5F8C resize,\u7834\u58DE\u5E7E\u4F55\u5C0D\u9F4A\u6C34\u5370", en: "Crop 0.3-1.5% then resize; breaks geometry-aligned watermarks" },
        "conv.tech.noise": { zh: "\u9AD8\u65AF\u566A\u8072", en: "Gaussian noise" },
        "conv.tech.noise.desc": { zh: "\xB12 \u81F3 \xB16 \u7070\u5EA6\u503C,\u63D0\u5347\u566A\u8072\u5730\u677F", en: "Adds \xB12\u2013\xB16 grayscale noise, raising the noise floor" },
        "conv.tech.unsharp": { zh: "\u92B3\u5316\u88DC\u511F", en: "Unsharp mask" },
        "conv.tech.unsharp.desc": { zh: "\u6062\u5FA9\u566A\u8072/\u91CD\u63A1\u6A23\u9020\u6210\u7684\u8996\u89BA\u67D4\u5316", en: "Restores perceived sharpness after noise + resampling" },
        "conv.tech.doubleJpeg": { zh: "\u96D9\u6B21 JPEG", en: "Double JPEG" },
        "conv.tech.doubleJpeg.desc": { zh: "q=60-72 \u4E2D\u9593\u7DE8\u78BC,\u7834\u58DE DCT \u57DF\u6C34\u5370", en: "Mid-q 60-72 re-encode; breaks DCT-domain watermarks" },
        "conv.tech.chShift": { zh: "\u901A\u9053\u4F4D\u79FB", en: "Channel shift" },
        "conv.tech.chShift.desc": { zh: "R/B \u901A\u9053 \xB11 \u50CF\u7D20,\u7834\u58DE\u8DE8\u901A\u9053\u5C0D\u9F4A\u6C34\u5370", en: "R/B channel shift \xB11 px; breaks cross-channel watermarks" },
        "conv.tech.bandNoise": { zh: "\u4F4E\u983B\u5E36\u72C0\u566A\u8072", en: "Low-freq band noise" },
        "conv.tech.bandNoise.desc": { zh: "\u7C97\u7DB2\u683C\u5E73\u6ED1\u566A\u8072,\u64FE\u52D5\u983B\u57DF\u4E2D\u4F4E\u983B", en: "Coarse-grid smooth noise; perturbs mid/low frequency band" },
        "conv.tech.fftPhase": { zh: "FFT \u76F8\u4F4D\u64FE\u52D5", en: "FFT phase perturbation" },
        "conv.tech.fftPhase.desc": { zh: "\u771F 2D-FFT \u4E2D\u983B\u76F8\u4F4D \xB13-5\xB0,\u76F4\u64CA SynthID,~500ms", en: "Real 2D-FFT mid-band phase \xB13-5\xB0; targets SynthID, ~500 ms" },
        "conv.tech.median": { zh: "\u4E2D\u503C\u6FFE\u6CE2 3\xD73", en: "Median filter 3\xD73" },
        "conv.tech.median.desc": { zh: "\u7834\u58DE LSB \u96B1\u5BEB\u8207\u55AE\u50CF\u7D20\u566A\u8072\u6C34\u5370", en: "Breaks LSB stego and single-pixel noise watermarks" },
        "conv.tech.badge.slow": { zh: "\u6162", en: "slow" },
        "conv.tech.badge.soft": { zh: "\u8F15\u67D4\u5316", en: "soft" },
        "conv.adv.summary": { zh: "\u9AD8\u7D1A\u9078\u9805", en: "Advanced options" },
        "conv.adv.note": { zh: "\u9ED8\u8A8D\u5373\u70BA\u63A8\u85A6\u503C,\u4E0D\u6539\u4E5F\u884C", en: "Defaults are recommended; fine to leave as-is" },
        "conv.adv.date": { zh: "\u62CD\u651D\u6642\u9593", en: "Shoot time" },
        "conv.adv.date.now": { zh: "\u73FE\u5728 (\u63A8\u85A6)", en: "Now (recommended)" },
        "conv.adv.date.1h": { zh: "1 \u5C0F\u6642\u524D", en: "1 hour ago" },
        "conv.adv.date.1d": { zh: "1 \u5929\u524D", en: "1 day ago" },
        "conv.adv.date.7d": { zh: "1 \u5468\u524D", en: "1 week ago" },
        "conv.adv.date.30d": { zh: "1 \u500B\u6708\u524D", en: "1 month ago" },
        "conv.adv.date.365d": { zh: "1 \u5E74\u524D", en: "1 year ago" },
        "conv.adv.date.custom": { zh: "\u81EA\u5B9A\u7FA9\u2026", en: "Custom\u2026" },
        "conv.adv.gps": { zh: "\u5730\u7406\u4F4D\u7F6E", en: "GPS" },
        "conv.adv.orient": { zh: "\u65B9\u5411", en: "Orientation" },
        "conv.adv.orient.1": { zh: "1 \xB7 \u6B63\u5E38", en: "1 \xB7 Normal" },
        "conv.adv.orient.6": { zh: "6 \xB7 \u9806\u6642\u91DD 90\xB0", en: "6 \xB7 Rotate 90\xB0 CW" },
        "conv.adv.orient.8": { zh: "8 \xB7 \u9006\u6642\u91DD 90\xB0", en: "8 \xB7 Rotate 90\xB0 CCW" },
        "conv.adv.orient.3": { zh: "3 \xB7 180\xB0", en: "3 \xB7 180\xB0" },
        "conv.adv.quality": { zh: "JPEG \u8CEA\u91CF", en: "JPEG quality" },
        "conv.adv.quality.rand": { zh: "\u96A8\u6A5F 88-95 (\u63A8\u85A6)", en: "Random 88-95 (recommended)" },
        "conv.adv.quality.custom": { zh: "\u81EA\u5B9A\u7FA9\u2026", en: "Custom\u2026" },
        "conv.adv.iso": { zh: "ISO", en: "ISO" },
        "conv.adv.iso.ph": { zh: "\u6309\u76F8\u6A5F\u9ED8\u8A8D", en: "Camera default" },
        "conv.adv.fnum": { zh: "\u5149\u5708 f/", en: "Aperture f/" },
        "conv.adv.shutter": { zh: "\u5FEB\u9580 1/\u2026", en: "Shutter 1/\u2026" },
        "conv.runBtn": { zh: "\u958B\u59CB\u8F49\u63DB", en: "Convert" },
        "conv.reanalyze": { zh: "\u91CD\u65B0\u5206\u6790", en: "Re-analyze" },
        "conv.download": { zh: "\u4E0B\u8F09 (${size})", en: "Download (${size})" },
        "conv.processing": { zh: "\u6B63\u5728\u8655\u7406...", en: "Processing..." },
        "conv.done": { zh: "\u8F49\u63DB\u5B8C\u6210", en: "Conversion complete" },
        "conv.err": { zh: "\u8F49\u63DB\u5931\u6557: ${msg}", en: "Conversion failed: ${msg}" },
        // GPS presets
        "gps.none": { zh: "\u4E0D\u5BEB\u5165 GPS (\u63A8\u85A6)", en: "No GPS (recommended)" },
        "gps.beijing": { zh: "\u5317\u4EAC \xB7 \u6545\u5BAE\u5348\u9580", en: "Beijing \xB7 Forbidden City" },
        "gps.shanghai": { zh: "\u4E0A\u6D77 \xB7 \u5916\u7058", en: "Shanghai \xB7 The Bund" },
        "gps.gz": { zh: "\u5EE3\u5DDE \xB7 \u5C0F\u883B\u8170", en: "Guangzhou \xB7 Canton Tower" },
        "gps.shenzhen": { zh: "\u6DF1\u5733 \xB7 \u5E73\u5B89\u91D1\u878D\u4E2D\u5FC3", en: "Shenzhen \xB7 Ping An Finance Centre" },
        "gps.chengdu": { zh: "\u6210\u90FD \xB7 \u6625\u7199\u8DEF", en: "Chengdu \xB7 Chunxi Road" },
        "gps.hongkong": { zh: "\u9999\u6E2F \xB7 \u7DAD\u591A\u5229\u4E9E\u6E2F", en: "Hong Kong \xB7 Victoria Harbour" },
        "gps.tokyo": { zh: "\u6771\u4EAC \xB7 \u6F80\u8C37\u7AD9", en: "Tokyo \xB7 Shibuya Stn" },
        "gps.nyc": { zh: "\u7D10\u7D04 \xB7 \u6642\u4EE3\u5EE3\u5834", en: "New York \xB7 Times Square" },
        // Analysis log (progressive)
        "log.readBytes": { zh: "\u8B80\u53D6\u6587\u4EF6\u5B57\u7BC0", en: "Read file bytes" },
        "log.sha256": { zh: "\u8A08\u7B97 SHA-256 \u6307\u7D0B", en: "Compute SHA-256" },
        "log.jumbf": { zh: "\u6383\u63CF JUMBF / C2PA \u7C3D\u540D\u5BB9\u5668", en: "Scan JUMBF / C2PA containers" },
        "log.exif": { zh: "\u89E3\u6790 EXIF / XMP / IPTC / ICC", en: "Parse EXIF / XMP / IPTC / ICC" },
        "log.markers": { zh: "\u5339\u914D AI \u751F\u6210\u6A19\u8A18\u5EAB", en: "Match AI marker library" },
        "log.wmHeuristic": { zh: "\u5B57\u7BC0\u7D1A\u6C34\u5370\u555F\u767C\u5206\u6790", en: "Byte-level watermark heuristics" },
        "log.hits": { zh: "\u547D\u4E2D ${n} \u9805", en: "${n} hits" },
        "log.allNeg": { zh: "\u5168\u90E8\u9670\u6027", en: "all negative" },
        "log.jumbfHit": { zh: "\u767C\u73FE ${n} \u500B JUMBF box", en: "Found ${n} JUMBF boxes" },
        "log.jumbfNone": { zh: "\u672A\u767C\u73FE", en: "None found" },
        "log.fieldsCount": { zh: "\u8B80\u53D6\u5230 ${n} \u500B\u5B57\u6BB5", en: "${n} fields parsed" },
        "log.noMeta": { zh: "\u7121\u5143\u6578\u64DA", en: "No metadata" },
        "log.err": { zh: "\u5206\u6790\u5931\u6557:${msg}", en: "Analysis failed: ${msg}" },
        // Stats bar
        "stats.visits": { zh: "\u8A2A\u554F", en: "Visits" },
        "stats.analyses": { zh: "\u6AA2\u6E2C", en: "Analyses" },
        "stats.conversions": { zh: "\u8F49\u63DB", en: "Conversions" },
        // Community card
        "comm.eyebrow": { zh: "\u793E\u7FA4", en: "Community" },
        "comm.title": { zh: "AI \u96FB\u5546\u5FAE\u4FE1\u4EA4\u6D41\u7FA4", en: "AI E-commerce WeChat Group" },
        "comm.sub": { zh: "\u6383\u78BC\u52A0\u5165\u8A0E\u8AD6 \xB7 AI \u5716\u7247\u5DE5\u5177 / \u96FB\u5546\u7D20\u6750 / \u81EA\u52D5\u5316 / \u5DE5\u5177\u93C8\u5206\u4EAB", en: "Scan to join \xB7 AI image tools / e-commerce assets / automation / toolchain sharing" },
        "comm.hint.html": { zh: '\u9EDE\u4E8C\u7DAD\u78BC\u67E5\u770B\u539F\u5716,\u6216\u5728 <a href="https://github.com/863401402/image-provenance/issues" target="_blank" rel="noopener">GitHub Issues</a> \u63D0\u9192\u66F4\u65B0', en: 'Tap the QR to open the full image, or ping on <a href="https://github.com/863401402/image-provenance/issues" target="_blank" rel="noopener">GitHub Issues</a> if it expired' },
        // Footer
        "foot.mit": { zh: 'MIT \xB7 \u958B\u6E90\u65BC <a href="https://github.com/863401402/image-provenance" target="_blank" rel="noopener">GitHub</a>', en: 'MIT \xB7 Open source on <a href="https://github.com/863401402/image-provenance" target="_blank" rel="noopener">GitHub</a>' },
        "foot.pitch": { zh: "\u96F6\u69CB\u5EFA \xB7 \u96F6\u5F8C\u7AEF \xB7 \u96F6\u4E0A\u50B3", en: "Zero build \xB7 Zero backend \xB7 Zero upload" },
        // SEO meta (rendered into document.title / meta[name=description]... on language change)
        "seo.title": {
          zh: "AI \u5716\u7247\u6AA2\u6E2C \xB7 C2PA / SynthID / Sora / Gemini / Midjourney \u6EAF\u6E90 \xB7 Image Provenance",
          en: "AI Image Detector \xB7 C2PA / SynthID / Sora / Gemini / Midjourney Provenance \xB7 Image Provenance"
        },
        "seo.description": {
          zh: "\u514D\u8CBB AI \u5716\u7247\u6AA2\u6E2C\u5DE5\u5177\u3002100% \u5728\u700F\u89BD\u5668\u88E1\u904B\u884C,\u5716\u7247\u4E0D\u4E0A\u50B3\u3002\u8B58\u5225 C2PA / Content Credentials \u4F86\u6E90\u6191\u8B49\u3001Google SynthID \u6C34\u5370\u3001OpenAI DALL\xB7E / Sora / gpt-image / Nano Banana\u3001Midjourney\u3001Stable Diffusion / SDXL / Flux\u3001Adobe Firefly \u7B49 AI \u751F\u6210\u7C3D\u540D\u3002\u63D0\u53D6 EXIF / XMP / IPTC / ICC \u5143\u6578\u64DA,65 \u9805\u983B\u57DF\u7279\u5FB5\u555F\u767C\u5F0F\u5206\u6790,\u652F\u6301\u53BB\u9664\u5143\u6578\u64DA\u3001\u64FE\u52D5\u6C34\u5370\u3001\u6CE8\u5165\u76F8\u6A5F EXIF \u507D\u88DD\u70BA\u771F\u5BE6\u7167\u7247\u3002",
          en: "Free AI-image detector that runs 100% in your browser \u2014 images are never uploaded. Identifies C2PA / Content Credentials, Google SynthID, OpenAI DALL\xB7E / Sora / gpt-image / Nano Banana, Midjourney, Stable Diffusion / SDXL / Flux, Adobe Firefly and more. Parses EXIF / XMP / IPTC / ICC, 65-feature frequency-domain heuristic analysis, metadata stripping, watermark disruption, fake camera EXIF injection."
        },
        "seo.keywords": {
          zh: "AI \u5716\u7247\u6AA2\u6E2C,AI \u751F\u6210\u5716\u6AA2\u6E2C,C2PA,SynthID,Sora,DALL-E,gpt-image,Nano Banana,Midjourney,Stable Diffusion,SDXL,Flux,ComfyUI,Adobe Firefly,Gemini,Imagen,EXIF \u5206\u6790,\u983B\u57DF\u5206\u6790,\u5716\u50CF\u6C34\u5370\u6AA2\u6E2C,\u6C34\u5370\u53BB\u9664,\u5716\u50CF\u6EAF\u6E90,image forensics,AI image detector,synthetic image detection,EXIF viewer online,C2PA verifier,watermark removal,\u5BA2\u6236\u7AEF\u5DE5\u5177,\u96F6\u5F8C\u7AEF",
          en: "AI image detector, AI-generated image detection, C2PA verifier, Content Credentials, SynthID detector, Sora detection, DALL-E detection, gpt-image, Nano Banana, Midjourney detector, Stable Diffusion detector, SDXL, Flux, ComfyUI, Adobe Firefly, Gemini, Imagen, EXIF viewer online, XMP parser, IPTC, JUMBF, frequency analysis, FFT image analysis, image forensics, watermark detection, watermark removal, synthetic image detection, diffusion model detection, client-side tool, no upload"
        },
        "seo.ogTitle": {
          zh: "AI \u5716\u7247\u6AA2\u6E2C \xB7 C2PA / SynthID / Sora / Midjourney / DALL-E \u6EAF\u6E90 \xB7 \u700F\u89BD\u5668\u904B\u884C\u4E0D\u4E0A\u50B3",
          en: "AI Image Detector \xB7 C2PA / SynthID / Sora / Midjourney / DALL-E \xB7 Runs in your browser, no upload"
        },
        "seo.ogDescription": {
          zh: "\u514D\u8CBB AI \u5716\u7247\u6AA2\u6E2C\u5DE5\u5177\u3002\u8B58\u5225 C2PA\u3001Google SynthID\u3001OpenAI DALL-E / Sora / gpt-image\u3001Midjourney\u3001Stable Diffusion\u3001Flux\u3001Adobe Firefly\u3001Gemini \u7B49 AI \u751F\u6210\u7C3D\u540D;\u8B80\u53D6 EXIF / XMP \u5143\u6578\u64DA;65 \u9805\u983B\u57DF\u7279\u5FB5\u5206\u6790\u3002100% \u5BA2\u6236\u7AEF,\u5716\u7247\u4E0D\u4E0A\u50B3\u3002",
          en: "Free AI-image detector. Recognizes C2PA, Google SynthID, OpenAI DALL-E / Sora / gpt-image, Midjourney, Stable Diffusion, Flux, Adobe Firefly, Gemini signatures. Parses EXIF / XMP. 65-feature frequency analysis. 100% client-side, no upload."
        },
        "seo.twDescription": {
          zh: "\u700F\u89BD\u5668\u5167\u904B\u884C\u7684\u514D\u8CBB AI \u5716\u7247\u6EAF\u6E90 \xB7 C2PA / EXIF / 65 \u983B\u57DF\u7279\u5FB5 \xB7 \u96F6\u5F8C\u7AEF\u5716\u7247\u4E0D\u4E0A\u50B3",
          en: "Free in-browser AI image provenance \xB7 C2PA / EXIF / 65 frequency features \xB7 Zero backend, no upload"
        }
      };
      _lang = null;
    }
  });

  // src/main.js
  var require_main = __commonJS({
    "src/main.js"() {
      init_utils();
      init_detect();
      init_cameras();
      init_convert();
      init_watermark();
      init_frequency();
      init_panel();
      init_metadata();
      init_panel_metadata();
      init_stats();
      init_i18n();
      applyI18n();
      refineLangByIP();
      initStats();
      var selectedProfile = "iphone17promax";
      var currentFile = null;
      var currentBytes = null;
      var currentMeta = null;
      var currentJumbf = null;
      var lastFreqBytes = null;
      var lastFreqResult = null;
      var sel = document.getElementById("cameraSelector");
      function renderCameraSelector() {
        const groupHtml = CAMERA_GROUPS.map((g2) => {
          const cams = Object.entries(CAMERA_PROFILES).filter(([, c2]) => c2.group === g2.id);
          const cells = cams.map(([key, cam]) => `
            <div class="camera-option ${key === selectedProfile ? "selected" : ""}" data-key="${key}">
                <div class="icon">${cam.icon}</div>
                <div class="name">${escHtml(cam.displayName)}</div>
                <div class="model">${escHtml(cam.Make)}</div>
            </div>`).join("");
          return `<div class="camera-group">
            <div class="camera-group-title">${g2.icon} ${escHtml(t2("conv.group." + g2.id))} <span class="camera-group-count">${cams.length}</span></div>
            <div class="camera-grid">${cells}</div>
        </div>`;
        }).join("");
        sel.innerHTML = groupHtml;
      }
      renderCameraSelector();
      sel.addEventListener("click", (e2) => {
        const opt = e2.target.closest(".camera-option");
        if (!opt) return;
        sel.querySelectorAll(".camera-option").forEach((n2) => n2.classList.remove("selected"));
        opt.classList.add("selected");
        selectedProfile = opt.dataset.key;
      });
      var gpsSel = document.getElementById("advGps");
      function renderGpsOptions() {
        if (!gpsSel) return;
        gpsSel.innerHTML = Object.keys(GPS_PRESETS).map((k2) => `<option value="${k2}">${escHtml(t2("gps." + k2))}</option>`).join("");
      }
      renderGpsOptions();
      var dateSel = document.getElementById("advDatePreset");
      var dateCustom = document.getElementById("advDateCustom");
      dateSel?.addEventListener("change", () => {
        dateCustom.classList.toggle("hidden", dateSel.value !== "custom");
      });
      var qMode = document.getElementById("advQualityMode");
      var qRange = document.getElementById("advQuality");
      var qVal = document.getElementById("advQualityVal");
      qMode?.addEventListener("change", () => {
        const custom = qMode.value === "custom";
        qRange.classList.toggle("hidden", !custom);
        qVal.classList.toggle("hidden", !custom);
      });
      qRange?.addEventListener("input", () => {
        qVal.textContent = qRange.value;
      });
      function resolveAdvanced() {
        const adv = { orientation: parseInt(document.getElementById("advOrientation").value, 10) || 1 };
        const dp = dateSel.value;
        if (dp === "now") {
          adv.dateTime = /* @__PURE__ */ new Date();
        } else if (dp === "custom") {
          adv.dateTime = dateCustom.value ? new Date(dateCustom.value) : /* @__PURE__ */ new Date();
        } else {
          const map = { "-1h": 36e5, "-1d": 864e5, "-7d": 7 * 864e5, "-30d": 30 * 864e5, "-365d": 365 * 864e5 };
          adv.dateTime = new Date(Date.now() - (map[dp] || 0));
        }
        const gp = GPS_PRESETS[gpsSel.value];
        if (gp && gp.lat != null) adv.gps = { lat: gp.lat, lon: gp.lon };
        const iso = parseFloat(document.getElementById("advIso").value);
        const fn = parseFloat(document.getElementById("advFNumber").value);
        const shutter = parseFloat(document.getElementById("advShutterDen").value);
        if (!isNaN(iso)) adv.iso = Math.round(iso);
        if (!isNaN(fn)) adv.fNumber = fn;
        if (!isNaN(shutter) && shutter >= 1) adv.exposureTime = [1, Math.round(shutter)];
        return adv;
      }
      function resolveQuality() {
        if (qMode.value === "custom") return parseInt(qRange.value, 10) / 100;
        return 0.88 + Math.random() * 0.07;
      }
      var uploadArea = document.getElementById("uploadArea");
      var fileInput = document.getElementById("fileInput");
      document.body.dataset.imgstate = "empty";
      uploadArea.addEventListener("click", (e2) => {
        if (e2.target.closest("input, button, a")) return;
        fileInput.click();
      });
      uploadArea.addEventListener("dragover", (e2) => {
        e2.preventDefault();
        uploadArea.classList.add("dragover");
      });
      uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
      uploadArea.addEventListener("drop", (e2) => {
        e2.preventDefault();
        uploadArea.classList.remove("dragover");
        if (e2.dataTransfer.files.length) handleFile(e2.dataTransfer.files[0]);
      });
      fileInput.addEventListener("change", () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
      });
      document.getElementById("btnChangeFile")?.addEventListener("click", (e2) => {
        e2.stopPropagation();
        fileInput.click();
      });
      var previewBlockEl = document.getElementById("previewBlock");
      if (previewBlockEl) {
        previewBlockEl.addEventListener("click", (e2) => {
          if (e2.target.closest("button, a")) return;
          fileInput.click();
        });
        previewBlockEl.addEventListener("dragover", (e2) => {
          e2.preventDefault();
          e2.dataTransfer.dropEffect = "copy";
          previewBlockEl.classList.add("dragover");
        });
        previewBlockEl.addEventListener("dragleave", (e2) => {
          if (!previewBlockEl.contains(e2.relatedTarget)) previewBlockEl.classList.remove("dragover");
        });
        previewBlockEl.addEventListener("drop", (e2) => {
          e2.preventDefault();
          previewBlockEl.classList.remove("dragover");
          const f = e2.dataTransfer.files?.[0];
          if (f) handleFile(f);
        });
      }
      document.addEventListener("paste", (e2) => {
        const items = e2.clipboardData?.items;
        if (!items) return;
        for (const it of items) {
          if (it.type?.startsWith("image/")) {
            const f = it.getAsFile();
            if (f) { handleFile(f); e2.preventDefault(); return; }
          }
        }
      });
      var wmRange = document.getElementById("wmIntensity");
      var wmLabel = document.getElementById("wmIntensityVal");
      if (wmRange && wmLabel) wmRange.addEventListener("input", () => {
        wmLabel.textContent = wmRange.value;
      });
      var currentPreset = "rec";
      function applyPresetToToggles(preset) {
        const ids = PRESETS[preset]?.techniques || [];
        document.querySelectorAll('#techGrid input[type="checkbox"]').forEach((cb) => {
          cb.checked = ids.includes(cb.dataset.tech);
        });
      }
      function setPresetUI(preset) {
        currentPreset = preset;
        document.querySelectorAll(".preset-btn").forEach((b2) => b2.classList.toggle("active", b2.dataset.preset === preset));
        const grid = document.getElementById("techGrid");
        const isCustom = preset === "custom";
        grid.classList.toggle("is-locked", !isCustom);
        grid.classList.toggle("is-open", isCustom);
        if (!isCustom) applyPresetToToggles(preset);
      }
      document.addEventListener("click", (ev) => {
        const b2 = ev.target.closest && ev.target.closest(".preset-btn");
        if (!b2) return;
        setPresetUI(b2.dataset.preset);
      });
      document.addEventListener("change", (ev) => {
        if (!ev.target.matches || !ev.target.matches('#techGrid input[type="checkbox"]')) return;
        if (currentPreset !== "custom") {
          const preset = PRESETS[currentPreset].techniques;
          const actual = Array.from(document.querySelectorAll("#techGrid input:checked")).map((cb) => cb.dataset.tech);
          const same = preset.length === actual.length && preset.every((t3) => actual.includes(t3));
          if (!same) setPresetUI("custom");
        }
      });
      setPresetUI(currentPreset);
      var wmMainToggle = document.getElementById("chkDisruptWatermark");
      var wmControls = document.getElementById("wmControls");
      function syncWmControlsVisibility() {
        if (!wmControls) return;
        wmControls.style.display = wmMainToggle?.checked ? "" : "none";
      }
      wmMainToggle?.addEventListener("change", syncWmControlsVisibility);
      syncWmControlsVisibility();
      function resolveTechniques() {
        return Array.from(document.querySelectorAll("#techGrid input:checked")).map((cb) => cb.dataset.tech);
      }
      function sleep(ms2) {
        return new Promise((r2) => setTimeout(r2, ms2));
      }
      async function runStep(log, text, fn, minMs = 260, tone = "done") {
        const line = document.createElement("div");
        line.className = "log-line pending";
        line.innerHTML = `<span class="log-mark"></span><span class="log-text">${escHtml(text)}<span class="trail"></span></span>`;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;
        const t0 = performance.now();
        const result = await fn();
        const elapsed = performance.now() - t0;
        if (elapsed < minMs) await sleep(minMs - elapsed);
        line.classList.remove("pending");
        line.classList.add("done");
        if (tone !== "done") line.classList.add(tone);
        const detail = typeof result === "object" && result?.detail;
        line.querySelector(".log-mark").innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8.5 6.5 12 13 4.5"/></svg>`;
        if (detail) {
          line.querySelector(".log-text").innerHTML = `${escHtml(text)} <span class="log-detail">${escHtml(detail)}</span>`;
        } else {
          line.querySelector(".log-text").textContent = text;
        }
        return result?.value !== void 0 ? result.value : result;
      }
      var emptyState = document.getElementById("emptyState");
      var resultView = document.getElementById("resultView");
      var previewBlock = document.getElementById("previewBlock");
      var analysisLog = document.getElementById("analysisLog");
      async function handleFile(file) {
        currentFile = file;
        lastFreqBytes = null;
        lastFreqResult = null;
        emptyState.classList.add("hidden");
        resultView.classList.remove("hidden");
        previewBlock.classList.remove("hidden");
        uploadArea.classList.add("hidden");
        document.body.dataset.imgstate = "loaded";
        document.querySelectorAll(".tab-btn").forEach((b2) => b2.classList.toggle("active", b2.dataset.tab === "detect"));
        document.querySelectorAll(".tab-panel").forEach((p2) => p2.classList.toggle("hidden", p2.dataset.panel !== "detect"));
        const freqPanel = document.getElementById("freqPanel");
        if (freqPanel) freqPanel.innerHTML = `
        <div class="freq-disclaimer">
            <span class="freq-disclaimer-tag">${escHtml(t2("freq.disclaimer.tag"))}</span>
            <span>${escHtml(t2("freq.disclaimer.text"))}</span>
        </div>
        <button class="btn-primary" id="btnRunFreq">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ${escHtml(t2("freq.runBtn"))}
        </button>
        <p class="panel-hint">${t2("freq.panelHint.html")}</p>`;
        document.getElementById("metadataPanel").innerHTML = "";
        document.getElementById("detectionItems").innerHTML = "";
        document.getElementById("convertResult").style.display = "none";
        document.getElementById("btnConvert").disabled = false;
        document.getElementById("previewImg").src = URL.createObjectURL(file);
        document.getElementById("fileName").textContent = file.name;
        document.getElementById("fileType").textContent = "\u2014";
        document.getElementById("fileSize").textContent = formatSize(file.size);
        document.getElementById("fileDims").textContent = "\u2026";
        document.getElementById("fileHash").textContent = "\u2026";
        document.getElementById("headerTitle").textContent = t2("result.analyzing");
        document.getElementById("headerSubtitle").textContent = "";
        document.getElementById("headerBadge").textContent = "";
        document.getElementById("headerBadge").className = "pill";
        analysisLog.innerHTML = "";
        analysisLog.classList.remove("hidden");
        try {
          const buffer = await runStep(analysisLog, t2("log.readBytes"), async () => {
            const b2 = await file.arrayBuffer();
            return { value: b2, detail: `${formatSize(b2.byteLength)}` };
          }, 180);
          const uint8 = new Uint8Array(buffer);
          currentBytes = uint8;
          const hashHex = await runStep(analysisLog, t2("log.sha256"), async () => {
            const h2 = await sha256(buffer);
            return { value: h2, detail: `${h2.slice(0, 16)}\u2026` };
          }, 240);
          document.getElementById("fileHash").textContent = hashHex;
          const fileType = file.type === "image/png" ? "PNG" : file.type === "image/jpeg" ? "JPEG" : file.type === "image/webp" ? "WebP" : file.type || "\u2014";
          document.getElementById("fileType").textContent = fileType;
          getImageDims(file).then((d2) => {
            document.getElementById("fileDims").textContent = d2;
          });
          await runStep(analysisLog, t2("log.jumbf"), async () => {
            currentJumbf = sniffJumbf(uint8);
            const jumbfDetail = currentJumbf.present ? t2("log.jumbfHit", { n: currentJumbf.indices.length }) + (currentJumbf.digitalSourceType ? ` \xB7 ${currentJumbf.digitalSourceType}` : "") : t2("log.jumbfNone");
            return { detail: jumbfDetail };
          }, 320, currentJumbf?.present ? "hit" : "done");
          await runStep(analysisLog, t2("log.exif"), async () => {
            currentMeta = await parseMetadata(uint8);
            const keys = Object.keys(currentMeta).filter((k2) => !k2.startsWith("_"));
            return { detail: keys.length ? t2("log.fieldsCount", { n: keys.length }) : t2("log.noMeta") };
          }, 420);
          const { detections } = await runStep(analysisLog, t2("log.markers"), async () => {
            const res = await runAllDetections(uint8);
            const hits = res.detections.filter((d2) => d2.hit && d2.category !== "edit" && (d2.confidence === "strong" || d2.confidence === "medium")).length;
            return { value: res, detail: hits ? t2("log.hits", { n: hits }) : t2("log.allNeg") };
          }, 360, "done");
          await runStep(analysisLog, t2("log.wmHeuristic"), () => sleep(200), 320);
          const aiHits = detections.filter((d2) => d2.hit && d2.category !== "edit" && (d2.confidence === "strong" || d2.confidence === "medium"));
          const weakOnly = detections.filter((d2) => d2.hit && d2.category !== "edit" && d2.confidence === "weak");
          const editHits = detections.filter((d2) => d2.hit && d2.category === "edit");
          const anyHit = aiHits.length > 0;
          document.getElementById("headerTitle").textContent = anyHit ? t2("result.aiHit") : t2("result.aiClean");
          document.getElementById("headerSubtitle").textContent = anyHit ? t2("result.aiHitSub") : weakOnly.length ? t2("result.weakSub") : editHits.length ? t2("result.editSub") : t2("result.cleanSub");
          const hb = document.getElementById("headerBadge");
          hb.textContent = anyHit ? t2("badge.hit") : t2("badge.miss");
          hb.className = "pill " + (anyHit ? "badge-hit" : "badge-clean");
          await sleep(350);
          analysisLog.classList.add("hidden");
          const container = document.getElementById("detectionItems");
          container.innerHTML = "";
          detections.forEach((d2) => {
            const div = document.createElement("div");
            div.className = "detection-item";
            const detailHtml = d2.detail ? `<details class="detection-item-details"><summary>${escHtml(t2("det.detail.viewMore"))}</summary><pre class="detection-item-detail">${escHtml(d2.detail)}</pre></details>` : "";
            const confHtml = d2.confidence ? `<span class="conf conf-${d2.confidence}">${escHtml(t2("conf." + d2.confidence))}</span>` : "";
            div.innerHTML = `
                <div class="detection-item-header">
                    <span class="detection-item-title">${escHtml(d2.title)}${confHtml}</span>
                    <span class="badge ${d2.badgeClass}">${escHtml(d2.badgeText)}</span>
                </div>
                <div class="detection-item-desc">${escHtml(d2.desc)}</div>
                ${detailHtml}
            `;
            container.appendChild(div);
          });
          document.getElementById("metadataPanel")._pending = true;
          trackAnalysis();
          document.getElementById("btnRunFreq")?.click();
        } catch (err) {
          const errLine = document.createElement("div");
          errLine.className = "log-line done hit";
          errLine.innerHTML = `<span class="log-mark">\u2715</span><span class="log-text">${escHtml(t2("log.err", { msg: err.message }))}</span>`;
          analysisLog.appendChild(errLine);
        }
      }
      document.addEventListener("click", (ev) => {
        const btn = ev.target.closest && ev.target.closest(".tab-btn");
        if (!btn) return;
        const target = btn.dataset.tab;
        document.querySelectorAll(".tab-btn").forEach((b2) => b2.classList.toggle("active", b2 === btn));
        document.querySelectorAll(".tab-panel").forEach((p2) => p2.classList.toggle("hidden", p2.dataset.panel !== target));
        if (target === "meta") {
          const panel = document.getElementById("metadataPanel");
          if (panel._pending && currentMeta) {
            renderMetadataPanel(panel, {
              meta: currentMeta,
              jumbf: currentJumbf,
              file: currentFile,
              dims: document.getElementById("fileDims").textContent
            });
            panel._pending = false;
          }
        }
      });
      document.addEventListener("click", async (ev) => {
        const btn = ev.target.closest && ev.target.closest("#btnRunFreq");
        if (!btn) return;
        if (!currentFile || !currentBytes) return;
        const panel = document.getElementById("freqPanel");
        if (lastFreqBytes === currentBytes && lastFreqResult) {
          renderFrequencyPanel(panel, lastFreqResult);
          return;
        }
        btn.disabled = true;
        panel.innerHTML = `
        <div class="loading"><div class="spinner"></div><br>
        <span id="freqStage">\u521D\u59CB\u5316...</span></div>`;
        try {
          const result = await analyzeFrequency(currentBytes, currentFile.type || "image/jpeg", {
            onProgress: ({ stage, pct, info }) => {
              const el = document.getElementById("freqStage");
              if (el) el.textContent = `[${pct}%] ${stage}${info ? " \xB7 " + info : ""}`;
            }
          });
          lastFreqBytes = currentBytes;
          lastFreqResult = result;
          renderFrequencyPanel(panel, result);
        } catch (err) {
          panel.innerHTML = `<div style="color:var(--danger);font-weight:600;padding:16px">${escHtml(t2("freq.err", { msg: err.message }))}</div>`;
        }
      });
      document.getElementById("btnConvert").addEventListener("click", async () => {
        if (!currentFile || !currentBytes) return;
        const btn = document.getElementById("btnConvert");
        const resultDiv = document.getElementById("convertResult");
        resultDiv.style.display = "block";
        resultDiv.className = "convert-result";
        resultDiv.innerHTML = `<div class="loading"><div class="spinner"></div>${escHtml(t2("conv.processing"))}</div>`;
        btn.disabled = true;
        try {
          const profile = CAMERA_PROFILES[selectedProfile];
          const disrupt = document.getElementById("chkDisruptWatermark")?.checked;
          const intensity = parseInt(document.getElementById("wmIntensity")?.value || "3", 10);
          const techniques = resolveTechniques();
          const advanced = resolveAdvanced();
          const quality = resolveQuality();
          let wmReport = null;
          const { blob, log } = await convertImage(currentBytes, currentFile.type, profile, {
            quality,
            advanced,
            disruptWatermark: disrupt ? async (canvas) => {
              wmReport = await disruptWatermark(canvas, { intensity, techniques });
            } : null
          });
          if (wmReport) for (const l2 of wmReport.log) log.push("  \xB7 " + l2);
          const url = URL.createObjectURL(blob);
          const origName = currentFile.name.replace(/\.[^.]+$/, "") || "photo";
          const outName = `${origName}_${profile.Make}_${Date.now().toString(36)}.jpg`;
          resultDiv.innerHTML = `
            <div style="color:var(--success);font-weight:600;margin-bottom:10px">${escHtml(t2("conv.done"))}</div>
            <img src="${url}" alt="\u8F49\u63DB\u7D50\u679C">
            <div style="font-size:12px;color:var(--text-muted);margin:8px 0;line-height:1.8">
                ${log.map((l2) => `\u2022 ${escHtml(l2)}`).join("<br>")}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
                <a class="download-btn" href="${url}" download="${escHtml(outName)}">${escHtml(t2("conv.download", { size: formatSize(blob.size) }))}</a>
                <button class="btn-secondary" id="btnReanalyze">${escHtml(t2("conv.reanalyze"))}</button>
            </div>
        `;
          document.getElementById("btnReanalyze").onclick = async () => {
            const reFile = new File([blob], outName, { type: "image/jpeg" });
            handleFile(reFile);
          };
          trackConversion();
        } catch (err) {
          resultDiv.className = "convert-result error";
          resultDiv.innerHTML = `<div style="color:var(--danger);font-weight:600">${escHtml(t2("conv.err", { msg: err.message }))}</div>`;
        } finally {
          btn.disabled = false;
        }
      });
      var themeToggle = document.getElementById("themeToggle");
      if (themeToggle) {
        themeToggle.addEventListener("click", () => {
          const current = document.documentElement.dataset.theme;
          const next = current === "dark" ? "light" : "dark";
          document.documentElement.dataset.theme = next;
          localStorage.setItem("theme", next);
          const meta = document.querySelector('meta[name="theme-color"]:not([media])');
          if (meta) meta.setAttribute("content", next === "dark" ? "#0a0a0b" : "#ffffff");
        });
      }
      var langToggle = document.getElementById("langToggle");
      function syncLangToggle() {
        const cur = getLang();
        langToggle?.querySelectorAll(".lang-opt").forEach((el) => {
          el.classList.toggle("active", el.dataset.lang === cur);
        });
      }
      syncLangToggle();
      langToggle?.addEventListener("click", (e2) => {
        const target = e2.target.closest(".lang-opt");
        const next = target ? target.dataset.lang : getLang() === "zh" ? "en" : "zh";
        if (next === getLang()) return;
        setLang(next);
      });
      document.addEventListener("langchange", () => {
        syncLangToggle();
        renderCameraSelector();
        renderGpsOptions();
        const mp = document.getElementById("metadataPanel");
        if (mp && mp.innerHTML && currentMeta) {
          renderMetadataPanel(mp, {
            meta: currentMeta,
            jumbf: currentJumbf,
            file: currentFile,
            dims: document.getElementById("fileDims").textContent
          });
        }
      });
    }
  });
  require_main();
})();
