new Vue({
    el: "#pageContainer",
    data: {
        sizeOri: "暫無數據",
        sizeBase: "暫無數據",
        previewSrc: "",
        resultContent: "",
        toolName: {
            image: "圖片轉Base64",
            base64: "Base64轉圖片"
        },
        curType: "image",
        nextType: "base64",
        txtBase64Input: "",
        txtBase64Output: "",
        error: ""
    },
    watch: {
        txtBase64Input: {
            immediate: !0,
            handler(t, e) {
                this.error = "", this.txtBase64Output = "", 0 !== t.length && (-1 === t.indexOf("data:") ? this.txtBase64Output = "data:image/jpeg;base64," + t : this.txtBase64Output = t)
            }
        }
    },
    computed: {
        dataUriInputSize: function () {
            return this.txtBase64Input.length ? this._sizeFormat(this.txtBase64Input.length) : "暫無數據";
        },
        decodedImageSize: function () {
            const s = this.txtBase64Input;
            if (!s.length) return "暫無數據";
            // 取 base64 主體 — 有 data: 前綴就抓 base64, 後面那段, 沒有就全當 base64
            const m = s.match(/base64,([A-Za-z0-9+/=\s]+)/);
            const b64 = (m ? m[1] : s).replace(/\s+/g, '');
            if (!b64.length) return "暫無數據";
            const padding = (b64.match(/=+$/) || [''])[0].length;
            const bytes = Math.floor(b64.length * 3 / 4) - padding;
            return bytes > 0 ? this._sizeFormat(bytes) : "暫無數據";
        }
    },
    mounted: function () {
        "chrome-extension:" === location.protocol && chrome.tabs.query({
            currentWindow: !0,
            active: !0
        }, t => {
            let e = t.filter(t => t.active)[0];
            chrome.runtime.sendMessage({
                type: "fh-dynamic-any-thing",
                thing: "request-page-content",
                tabId: e.id
            }).then(t => {
                t && t.content && ("image" !== this.curType && this.trans(), this.convertOnline(t.content, e => {
                    e || alert("抱歉，" + t.content + " 對應的圖片未轉碼成功！")
                }))
            })
        }), document.addEventListener("paste", t => {
            if ("image" === this.curType) return this.paste(t);
            if ("base64" === this.curType) {
                let e = document.getElementById("base64Input");
                if (document.activeElement === e) return;
                let i = t.clipboardData && t.clipboardData.getData("text");
                if (!i) return;
                t.preventDefault(), this.txtBase64Input = i, e && e.focus()
            }
        }, !1), document.addEventListener("drop", t => {
            if (t.preventDefault(), t.stopPropagation(), "image" !== this.curType) return;
            let e = t.dataTransfer.files;
            e.length && (/image\//.test(e[0].type) ? this._getDataUri(e[0]) : alert("請選擇圖片檔！"))
        }, !1), document.addEventListener("dragover", t => {
            "image" === this.curType && (t.preventDefault(), t.stopPropagation())
        }, !1)
    },
    methods: {
        _sizeFormat: function (t) {
            return isNaN(t) ? "暫無數據" : (t = +t) < 1024 ? t + " B" : t < 1048576 ? (t / 1024).toFixed(2) + " KB" : (t / 1024 / 1024).toFixed(2) + " MB"
        },
        _getDataUri: function (t) {
            let e = new FileReader;
            e.onload = (e => {
                this.resultContent = e.target.result, this.previewSrc = e.target.result, this.$refs.panelBox.style.backgroundImage = "none", this.sizeOri = this._sizeFormat(t.size), this.sizeBase = this._sizeFormat(e.target.result.length)
            }), e.readAsDataURL(t)
        },
        convertOnline: function (t, e) {
            let i = this;
            i.previewSrc = t;
            let n = new Image;
            n.src = t, n.onload = function () {
                let t = this.naturalWidth,
                    a = this.naturalHeight;
                ! function (n, s, r, o, l) {
                    let u = document.createElement("canvas");
                    u.setAttribute("id", "qr-canvas"), u.height = l + 100, u.width = o + 100;
                    let h = u.getContext("2d");
                    h.fillStyle = "rgb(255,255,255)", h.fillRect(0, 0, u.width, u.height), h.drawImage(n, r, s, o, l, 50, 50, o, l), i.resultContent = u.toDataURL(), i.$refs.panelBox.style.backgroundImage = "none", i.sizeOri = t + "x" + a, i.sizeBase = i._sizeFormat(i.resultContent.length), e && e(!0)
                }(n, 0, 0, t, a)
            }, n.onerror = function () {
                e && e(!1)
            }
        },
        convert: function () {
            this.$refs.fileBox.files.length && (this._getDataUri(this.$refs.fileBox.files[0]), this.$refs.fileBox.value = "")
        },
        select: function () {
            this.$refs.resultBox.select()
        },
        upload: function (t) {
            t.preventDefault(), this.$refs.fileBox.click()
        },
        paste: function (t) {
            let e = t.clipboardData.items || {};
            for (let t in e) {
                let i = e[t];
                if (/image\//.test(i.type)) {
                    let t = i.getAsFile();
                    return this._getDataUri(t)
                }
            }
            try {
                (async () => {
                    for (let t in e) {
                        let i = e[t];
                        if (/text\/plain/.test(i.type)) {
                            let t = await new Promise(t => {
                                i.getAsString(e => t(e))
                            });
                            if (await new Promise(e => {
                                    this.convertOnline(t, t => e(t))
                                })) break
                        }
                    }
                })()
            } catch (t) {
                for (let t in e) {
                    let i = e[t];
                    if (/text\/plain/.test(i.type)) return i.getAsString(t => {
                        this.convertOnline(t)
                    })
                }
            }
        },
        trans: function () {
            this.curType = {
                image: "base64",
                base64: "image"
            } [this.curType], this.nextType = {
                image: "base64",
                base64: "image"
            } [this.nextType]
        },
        loadError: function (t) {
            "base64" === this.curType && this.txtBase64Input.trim().length && (this.error = "無法識別的Base64編碼，請確認是正確的圖片Data URI？")
        }
    }
});
