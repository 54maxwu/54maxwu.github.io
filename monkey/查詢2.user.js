// ==UserScript==
// @name         查詢2
// @namespace    http://tampermonkey.net/
// @version      v1
// @description  查詢2
// @author       Max
// @match        https://admin.supergo88.com/*
// @match        https://admin.jilibee.org/*
// @grant        none
// @icon         https://kd88.com/favicon.ico
// ==/UserScript==

(function() {
    'use strict';
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
    str += '</div>';
document.body.innerHTML += str

window.getWithdraw = (player) => {
    let result = document.getElementById('result');
    result.innerHTML = "";
    //取得出款紀錄
    let today = new Date();
    let endday = today.toISOString().split('T')[0];
    let beforeday = new Date(today.getTime()-24*60*60*1000*60).toISOString().split('T')[0];
    fetch(location.origin+'/service/v2/financial/audit/withdraw/getList', {
         "headers": {
             "authorization": localStorage.getItem("Authorization").replaceAll("\"",""),
             "content-type": "application/json;charset=UTF-8",
             "refreshtoken": localStorage.getItem("RefreshToken").replaceAll("\"",""),
         },
             "body": "{\"agentId\":null,\"advertiseId\":null,\"applicantId\":null,\"username\":\""+player+"\",\"email\":null,\"withdrawBankIdList\":[],\"withdrawBankAccount\":null,\"withdrawBankAccountName\":null,\"type\":null,\"remitAccountId\":null,\"orderNumber\":null,\"amountType\":1,\"minAmount\":null,\"maxAmount\":null,\"addStartTime\":\""+beforeday+"T16:00:00.000Z\",\"addEndTime\":\""+endday+"T15:59:59.000Z\",\"statuses\":[1],\"lastModifyStartTime\":null,\"lastModifyEndTime\":null,\"auditorId\":null,\"payerId\":null,\"limit\":{\"startIndex\":0,\"pageSize\":5},\"sorts\":[{\"columnName\":\"addTime\",\"orderType\":\"desc\"}],\"withdrawBankType\":null}",
             "method": "POST",
    }).then((response) => response.json())
      .then((r) => {
        if(r.data.count > 0){
            r.data.records.forEach(d=>{
                result.innerHTML += `單號: ${d.ordernumber} 出款方式: ${d.withdrawBankName} 出款帳號: <font color='#056b00' size='6'>${d.withdrawBankAccount}</font> <p>`
            })
        }else{
            result.innerHTML = "近90天沒出過款"
        }
    })
}

window.cc = () => {
    var myMenu = document.getElementById('myMenu');
    myMenu.style.display = 'none';
}

window.ss = () => {
    document.getElementById('result').innerHTML = "";
    let player = document.getElementById('acc').value;
    window.getWithdraw(player);
}

})();
