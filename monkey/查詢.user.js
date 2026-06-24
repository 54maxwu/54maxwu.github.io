// ==UserScript==
// @name         查詢
// @namespace    http://tampermonkey.net/
// @version      v1
// @description  查詢
// @author       Max
// @match        https://bo.voslot.games/*
// @grant        none
// @icon         https://kd88.com/favicon.ico
// ==/UserScript==

(function() {
    'use strict';
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    var heighlight = "Referral Libre 50";
    var css = '#myMenu {width:300px;background:cornsilk;display:none;position:fixed;right:40px;top:200px;z-index:999;padding:3px;border:solid;border-color:brown;} #result{border-top:#ffffff30;border-style:groove;text-align:left;margin-left:20px;margin-top:4px;margin-bottom:2px;font-size:smaller;padding-top:4px;}',
        head = document.head || document.getElementsByTagName('head')[0],
        style = document.createElement('style');
    head.appendChild(style);

style.type = 'text/css';
if (style.styleSheet){
    // This is required for IE8 and below.
    style.styleSheet.cssText = css;
} else {
    style.appendChild(document.createTextNode(css));
}

document.oncontextmenu = function(ev) {
    var myMenu = document.getElementById('myMenu');
    myMenu.style.display = 'block';
    return false;
}

    let str = '<div id="myMenu"><span style="margin-left:20px;">🔎</span><input type="text" id="acc" size="10" style="margin-left:10px;margin-right:10px;height:25px">';
    str += '<button type="button" onclick="ss()">送出</button>';
    str += '<button type="button" onclick="cc()" style="position:absolute;right:0;top:0;background-color:transparent;border:0">❌</button>';
    str += '<div id="result"></div>';
    str += '<table id="tb" border="1" style="border:1px solid maroon;border-collapse:collapse;text-align:center;font-size:small;width:100%;display:none">';
    str += '<thead><tr><th style="padding:5px;text-align:center;">存款總數</th><th style="padding:5px;text-align:center;">存款總額</th>';
    str += '<th rowspan="2" style="padding:5px;text-align:center;vertical-align:bottom;">玩家總盈虧</th></tr><tr><th id="deposit_count" style="padding:5px;text-align:center;">x</th>';
    str += '<th id="deposit" style="padding:5px;text-align:center;">x</th></tr></thead><tbody><tr><td style="padding:5px;text-align:center;">提款總數</td><td style="padding:5px;text-align:center;">提款總額</td>';
    str += '<td rowspan="3" id="totalresult" style="padding:5px;text-align:center;vertical-align:baseline;">x</td></tr><tr><td id="withdraw_count" style="padding:5px;text-align:center;">x</td>';
    str += '<td id="withdraw" style="padding:5px;text-align:center;">x</td></tr>';
    str += '<tr><td style="padding:5px;text-align:center;background-color:antiquewhite";border-width: 1px 0px 1px 1px;>淨入金</td><td id="diff" style="padding:5px;text-align:center;border-width:1px1px1px0px;border-style:solid;background-color:antiquewhite;">x</td>';
    str += '<tr><td style="padding:5px;text-align:center;">現金餘額</td><td style="padding:5px;text-align:center;">優惠金額</td><td style="padding:5px;text-align:center;">可用餘額</td></tr>';
    str += '<tr><td id="totalmoney" style="padding:5px;text-align:center;">x</td><td id="bonus" style="padding:5px;text-align:center;">x</td><td id="canusemoney" style="padding:5px;text-align:center;">x</td></tr>';
    str += '</tbody></table>';
    str += '</div>';
document.body.insertAdjacentHTML('beforeend', str)
window.nAdd = (n1, n2) => {
    let n1base = n1.toString().split(".")[1]?.length ?? 0;
    let n2base = n2.toString().split(".")[1]?.length ?? 0;
    let baseNum = Math.pow(10, Math.max(n1base, n2base));
    return (n1 * baseNum + n2 * baseNum) / baseNum
}
window.nf = (num) => {
    return num.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}
window.getmoney = (player) => {
    let totalmoney = document.getElementById('totalmoney');
    totalmoney.innerHTML = 0;
    let canusemoney = document.getElementById('canusemoney');
    canusemoney.innerHTML = 0;
    let bonus = document.getElementById('bonus');
    bonus.innerHTML = 0;
    //取得平台
    fetch('https://boapi.voslot.games/voslot-ims/api/v1/playerwallets', {
        "headers": {
            "authorization": localStorage.getItem("token").replaceAll('"', ''),
        },
        "method": "GET",
    }).then((response) => response.json())
      .then((result) => {
        result.forEach(d=>{
            fetch('https://boapi.voslot.games/voslot-ims/api/v1/playerwallets/wallets/'+player+'/'+d.walletid, {
                "headers": {
                    "authorization": localStorage.getItem("token").replaceAll('"', ''),
                },
                "method": "GET",
            }).then((rsp) => rsp.json())
              .then((m) => {
                totalmoney.innerHTML = window.nAdd(totalmoney.innerHTML,m.balance);
                canusemoney.innerHTML = window.nAdd(canusemoney.innerHTML,m.available);
                bonus.innerHTML = window.nAdd(bonus.innerHTML,m.bonus);
            })
        })
    })
    //加上主錢包
    fetch('https://boapi.voslot.games/voslot-ims/api/v1/playerwallets/wallets/'+player+'/MAIN', {
        "headers": {
            "authorization": localStorage.getItem("token").replaceAll('"', ''),
        },
        "method": "GET",
    }).then((rsp) => rsp.json())
      .then((m) => {
        totalmoney.innerHTML = window.nAdd(totalmoney.innerHTML,m.balance);
        canusemoney.innerHTML = window.nAdd(canusemoney.innerHTML,m.available);
        bonus.innerHTML = window.nAdd(bonus.innerHTML,m.bonus);
    })
}

window.cc = () => {
    var myMenu = document.getElementById('myMenu');
    myMenu.style.display = 'none';
}

window.ss = () => {
    document.getElementById('tb').style.display = 'none';
    document.getElementById('result').innerHTML = "";
    let player = document.getElementById('acc').value;
    let params = new URLSearchParams({
        dateFrom: "2021-12-01",
        dateTo: "2122-12-27",
        exactmatch: "true",
        limit: 25,
        offset: 0,
        playerid: player,
        promogroup1: 0,
        sort: "DESC",
        sortcolumn: "createdat",
        updatedatfrom: 1638288000000,
        updatedatto: 4827830399999,
        withapplicationcount: "true",
        withcurrentconditioncount: "true",
        zonetype: "ASIA_SHANGHAI",
    });
    params.append('group1promotypes', 1);
    params.append('group1promotypes', 2);
    params.append('group1promotypes', 3);
    params.append('group1promotypes', 4);
    params.append('group1promotypes', 8);
    params.append('group1promotypes', 9);
    params.append('group1promotypes', 10);
    //優惠申請
    fetch('https://boapi.voslot.games/voslot-ims/api/v1/promoreqs?' + params, {
        "headers": {
            "authorization": localStorage.getItem("token").replaceAll('"', ''),
        },
        "method": "GET",
    }).then((response) => response.json())
      .then((result) => {
        let str = ""
        result.data.forEach(d => {
            let datestr = new Date(d.createdat+8*3600*1000).toISOString().split('.')[0]
            let dd = datestr.substr(5,2)+'/'+datestr.substr(8,2)
            if(d.promoname == heighlight){
                str += `<font size='3' color='red'>${esc(dd)} ${esc(d.promoname)} (${esc(d.bonus)}) 💥 </font><br>`;
            }else{
                str += `${esc(dd)} ${esc(d.promoname)} (${esc(d.bonus)}) <br>`;
            }
        })
        document.getElementById('result').innerHTML = str;
    })

    //存提款
    fetch('https://boapi.voslot.games/voslot-ims/api/v1/players/'+player+'/cashsummary', {
        "headers": {
            "authorization": localStorage.getItem("token").replaceAll('"', ''),
        },
        "method": "GET",
    }).then((response) => response.json())
      .then((result) => {
        document.getElementById('tb').style.display = 'inline-table';
        document.getElementById('deposit_count').innerHTML=result.totaldepositcount;
        document.getElementById('deposit').innerHTML=window.nf(result.totaldeposit);
        document.getElementById('withdraw_count').innerHTML=result.totalwithdrawcount;
        document.getElementById('withdraw').innerHTML=window.nf(result.totalwithdraw);
        document.getElementById('totalresult').innerHTML=window.nf(result.totalresult);
        document.getElementById('diff').innerHTML=window.nf(result.totaldeposit-result.totalwithdraw);
        window.getmoney(player);
    })
}

})();
