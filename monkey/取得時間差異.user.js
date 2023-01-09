// ==UserScript==
// @name         取得時間差異

// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       Max
// @match        https://bo.desafiobet.com/Transaction
// @icon         https://kd88.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
            if(this.url.split("?")[0]=='https://bo.desafiobet.com/Player/GetTransactionHistory'){
                document.getElementsByClassName("row-fluid")[6].getElementsByClassName("span6")[3].innerHTML += "<div><font color='red'>("+formatSeconds(secDiff(new Date(document.getElementsByClassName("row-fluid")[6].getElementsByClassName("span6")[1].innerText),new Date(document.getElementsByClassName("row-fluid")[6].getElementsByClassName("span6")[3].innerText)))+")</font></div>"
            }
        });
        origOpen.apply(this, arguments);
    };
})();

const secDiff = (date1, date2) => Math.ceil(Math.abs(date1.getTime() - date2.getTime()) / 1000);

const formatSeconds = s => { const [hour, minute, second, sign] = s > 0 ? [s / 3600, (s / 60) % 60, s % 60, ''] : [-s / 3600, (-s / 60) % 60, -s % 60, '-']; return ( sign + [hour, minute, second] .map(v => `${Math.floor(v)}`.padStart(2, '0')) .join(':') ); };