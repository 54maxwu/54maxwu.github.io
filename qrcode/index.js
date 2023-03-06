new Vue({
    el: "#pageContainer",
    data: {
        textContent: "",
        qrSize: 200,
        qrColor: "#000000",
        useIcon: "no",
        previewSrc: "",
        resultContent: "",
        qrEncodeMode: !0,
        showResult: !1
    },
    mounted: function () {
        let e = new URL(location.href).searchParams.get("mode");
        this.qrEncodeMode = "decode" !== e, "chrome-extension:" === location.protocol && chrome.runtime.onMessage.addListener((e, t, o) => {
            if ("TAB_CREATED_OR_UPDATED" === e.type && e.event === location.pathname.split("/")[1]) {
                let t = e.content || (e.fromTab ? e.fromTab.url : "");
                return t && (this.qrEncodeMode ? (this.textContent = t, this.convert()) : this._qrDecode(t)), o && o(), !0
            }
        }), this.$refs.codeSource && this.$refs.codeSource.focus(), document.addEventListener("drop", e => {
            e.preventDefault(), e.stopPropagation();
            let t = e.dataTransfer.files;
            t.length && (this.qrEncodeMode ? this._drawIcon(t[0]) : this._decodeLocal(t[0]))
        }, !1), document.addEventListener("dragover", e => {
            e.preventDefault(), e.stopPropagation()
        }, !1), document.addEventListener("paste", e => {
            this.qrEncodeMode || this.paste(e)
        }, !1), $("#opt_fc").colorpicker({
            fillcolor: !0,
            success: (e, t) => {
                this.qrColor = t, this.convert()
            }
        })
    },
    methods: {
        convert: function () {
            this.showResult = !0, this.$nextTick(() => {
                this.textContent ? $("#preview").html("").qrcode(this._createOptions()) : $("#preview").html("再在輸入框裡輸入一些內容，就能生成二維碼了哦~")
            })
        },
        fileChanged: function (e) {
            e.target.files.length && (this.qrEncodeMode ? this._drawIcon(e.target.files[0]) : this._decodeLocal(e.target.files[0]), e.target.value = "")
        },
        _drawIcon: function (e) {
            if (/image\//.test(e.type)) {
                this.useIcon = "custom";
                let t = new FileReader;
                t.onload = (e => {
                    this.$refs.logoCustom.src = e.target.result, this.convert()
                }), t.readAsDataURL(e)
            } else alert("請選擇圖片檔！")
        },
        _createOptions: function () {
            let e = {
                render: "canvas",
                minVersion: 1,
                maxVersion: 40,
                ecLevel: "L",
                left: 0,
                top: 0,
                size: +this.qrSize || 200,
                fill: this.qrColor,
                background: "#fff",
                radius: 0,
                quiet: 0,
                text: this.textContent,
                mode: 0,
                mSize: .15,
                mPosX: .5,
                mPosY: .5,
                label: "FH",
                fontname: "sans",
                fontcolor: "#f00",
                image: !1
            };
            switch (this.useIcon) {
                case "default":
                    e.mode = 4, e.image = this.$refs.logoDefault;
                    break;
                case "custom":
                    e.mode = 4, e.image = this.$refs.logoCustom
            }
            return e
        },
        trans: function () {
            this.qrEncodeMode = !this.qrEncodeMode
        },
        select: function () {
            this.$refs.resultBox.select()
        },
        _decodeLocal: function (e) {
            let t = new FileReader;
            t.onload = (e => {
                this._qrDecode(e.target.result)
            }), t.readAsDataURL(e)
        },
        paste: function (e) {
            let t = e.clipboardData.items || {};
            for (let e in t) {
                let o = t[e];
                if (/image\//.test(o.type)) {
                    let e = o.getAsFile();
                    return this._decodeLocal(e)
                }
            }
            try {
                (async () => {
                    for (let e in t) {
                        let o = t[e];
                        if (/text\/plain/.test(o.type)) {
                            let e = await new Promise(e => {
                                o.getAsString(t => e(t))
                            });
                            if (await new Promise(t => {
                                    this._qrDecode(e, e => t(e))
                                })) break
                        }
                    }
                })()
            } catch (e) {
                for (let e in t) {
                    let o = t[e];
                    if (/text\/plain/.test(o.type)) return o.getAsString(e => {
                        this._qrDecode(e)
                    })
                }
            }
        },
        _qrDecode: function (e, t) {
            let o = this;
            const n = new ZXing.BrowserMultiFormatReader;
            let s = new Image;
            s.src = e, s.setAttribute("crossOrigin", "Anonymous"), s.onload = function () {
                n.decodeFromImage(this).then(n => {
                    o._showDecodeResult(e, n.text), t && t(n.text)
                }).catch(n => {
                    o._showDecodeResult(e, n), t && t(n)
                })
            }, s.onerror = function (e) {
                t && t(!1), alert("抱歉，當前圖片無法被解碼，請保存圖片再拖拽進來試試！")
            }
        },
        _showDecodeResult: function (e, t) {
            this.previewSrc = e, this.$refs.panelBox.style.backgroundImage = "none", this.resultContent = t
        }
    }
});
