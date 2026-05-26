new Vue({
    el: '#pageContainer',
    data: {
        textContent: '',
        qrSize: 200,
        qrColor: '#000000',
        useIcon: 'no',
        previewSrc: '',
        resultContent: '',
        qrEncodeMode: true,
        showResult: false,
        // Version 40 + EC level L, byte mode 的官方上限
        QR_MAX_BYTES: 2953
    },
    computed: {
        byteLength() {
            // QR 碼容量是以 UTF-8 編碼後的位元組數計算,中文 1 字 = 3 bytes
            return new TextEncoder().encode(this.textContent).length;
        },
        isOverLimit() {
            return this.byteLength > this.QR_MAX_BYTES;
        }
    },
    mounted() {
        const mode = new URL(location.href).searchParams.get('mode');
        this.qrEncodeMode = mode !== 'decode';

        if (location.protocol === 'chrome-extension:') {
            chrome.runtime.onMessage.addListener((e, t, done) => {
                if (e.type === 'TAB_CREATED_OR_UPDATED' && e.event === location.pathname.split('/')[1]) {
                    const url = e.content || (e.fromTab ? e.fromTab.url : '');
                    if (url) {
                        this.qrEncodeMode ? (this.textContent = url, this.convert()) : this._qrDecode(url);
                    }
                    done && done();
                    return true;
                }
            });
        }

        this.$refs.codeSource && this.$refs.codeSource.focus();

        document.addEventListener('drop', e => {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer.files;
            if (!files.length) return;
            this.qrEncodeMode ? this._drawIcon(files[0]) : this._decodeLocal(files[0]);
        }, false);

        document.addEventListener('dragover', e => {
            e.preventDefault();
            e.stopPropagation();
        }, false);

        document.addEventListener('paste', e => {
            if (!this.qrEncodeMode) { this.paste(e); return; }
            if (document.activeElement === this.$refs.codeSource) return;
            const items = e.clipboardData && e.clipboardData.items;
            if (!items) return;
            for (const key in items) {
                const item = items[key];
                if (/text\/plain/.test(item.type)) {
                    e.preventDefault();
                    item.getAsString(text => { this.textContent = text; });
                    break;
                }
            }
        }, false);

        $('#opt_fc').colorpicker({
            fillcolor: true,
            success: (e, color) => {
                this.qrColor = color;
                this.convert();
            }
        });
    },
    watch: {
        textContent() { this._scheduleConvert(); },
        qrSize()     { this._scheduleConvert(); },
        qrColor()    { this._scheduleConvert(); }
    },
    methods: {
        _scheduleConvert() {
            clearTimeout(this._convertTimer);
            this._convertTimer = setTimeout(() => this.convert(), 150);
        },
        convert() {
            if (!this.textContent) {
                this.showResult = false;
                $('#preview').html('');
                return;
            }
            if (this.isOverLimit) {
                this.showResult = false;
                $('#preview').html('');
                alert(`內容過長:${this.byteLength} bytes,已超過 QR 碼最大容量 ${this.QR_MAX_BYTES} bytes`);
                return;
            }
            this.showResult = true;
            this.$nextTick(() => {
                try {
                    $('#preview').html('').qrcode(this._createOptions());
                } catch (err) {
                    this.showResult = false;
                    $('#preview').html('');
                    alert('QR 碼生成失敗:' + (err && err.message || err));
                }
            });
        },
        fileChanged(e) {
            if (!e.target.files.length) return;
            this.qrEncodeMode ? this._drawIcon(e.target.files[0]) : this._decodeLocal(e.target.files[0]);
            e.target.value = '';
        },
        _drawIcon(file) {
            if (!/image\//.test(file.type)) {
                alert('請選擇圖片檔！');
                return;
            }
            this.useIcon = 'custom';
            const reader = new FileReader();
            reader.onload = e => {
                this.$refs.logoCustom.src = e.target.result;
                this.convert();
            };
            reader.readAsDataURL(file);
        },
        _createOptions() {
            const opts = {
                render: 'canvas',
                minVersion: 1,
                maxVersion: 40,
                ecLevel: 'L',
                left: 0,
                top: 0,
                size: +this.qrSize || 200,
                fill: this.qrColor,
                background: '#fff',
                radius: 0,
                quiet: 0,
                text: this.textContent,
                mode: 0,
                mSize: 0.15,
                mPosX: 0.5,
                mPosY: 0.5,
                label: 'FH',
                fontname: 'sans',
                fontcolor: '#f00',
                image: false
            };
            if (this.useIcon === 'default') {
                opts.mode = 4;
                opts.image = this.$refs.logoDefault;
            } else if (this.useIcon === 'custom') {
                opts.mode = 4;
                opts.image = this.$refs.logoCustom;
            }
            return opts;
        },
        trans() {
            this.qrEncodeMode = !this.qrEncodeMode;
        },
        select() {
            this.$refs.resultBox.select();
        },
        _decodeLocal(file) {
            const reader = new FileReader();
            reader.onload = e => this._qrDecode(e.target.result);
            reader.readAsDataURL(file);
        },
        paste(e) {
            const items = e.clipboardData.items || {};
            for (const key in items) {
                const item = items[key];
                if (/image\//.test(item.type)) {
                    return this._decodeLocal(item.getAsFile());
                }
            }
            try {
                (async () => {
                    for (const key in items) {
                        const item = items[key];
                        if (/text\/plain/.test(item.type)) {
                            const text = await new Promise(resolve => item.getAsString(resolve));
                            const ok = await new Promise(resolve => this._qrDecode(text, resolve));
                            if (ok) break;
                        }
                    }
                })();
            } catch {
                for (const key in items) {
                    const item = items[key];
                    if (/text\/plain/.test(item.type)) {
                        return item.getAsString(text => this._qrDecode(text));
                    }
                }
            }
        },
        _qrDecode(src, callback) {
            const zxing = new ZXing.BrowserMultiFormatReader();
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = src;
            img.onload = () => {
                zxing.decodeFromImage(img).then(result => {
                    this._showDecodeResult(src, result.text);
                    callback && callback(result.text);
                }).catch(err => {
                    this._showDecodeResult(src, err);
                    callback && callback(err);
                });
            };
            img.onerror = () => {
                callback && callback(false);
                alert('抱歉，當前圖片無法被解碼，請保存圖片再拖拽進來試試！');
            };
        },
        _showDecodeResult(src, text) {
            this.previewSrc = src;
            this.$refs.panelBox.style.backgroundImage = 'none';
            this.resultContent = text;
        }
    }
});
