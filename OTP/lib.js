var fn = (function () {
  window.addEventListener('load', function () {
    updateOtp()
  });
  const dec2hex = (s) => {
    return (s < 15.5 ? "0" : "") + Math.round(s).toString(16);
  }
  const hex2dec = (s) => {
    return parseInt(s, 16);
  }
  const base32tohex = (base32) => {
    let base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    let hex = "";

    for (let i = 0; i < base32.length; i++) {
      let val = base32chars.indexOf(base32.charAt(i).toUpperCase());
      bits += leftpad(val.toString(2), 5, "0");
    }

    for (let i = 0; i + 4 <= bits.length; i += 4) {
      let chunk = bits.substr(i, 4);
      hex = hex + parseInt(chunk, 2).toString(16);
    }
    return hex;
  }
  const leftpad = (str, len, pad) => {
    if (len + 1 >= str.length) {
      str = Array(len + 1 - str.length).join(pad) + str;
    }
    return str;
  }
  const updateOtp = () => {
    $("tr").each(function () {
      key = $(this).find("td:eq(1)").text()
      $(this).find("td:eq(2)").text(getKey(key))
    })
  }
  const getKey = (key) => {
    var key = base32tohex(key);
    var epoch = Math.round(new Date().getTime() / 1000.0);
    var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, "0");

    var shaObj = new jsSHA("SHA-1", "HEX");
    shaObj.setHMACKey(key, "HEX");
    shaObj.update(time);
    var hmac = shaObj.getHMAC("HEX");

    var offset = hex2dec(hmac.substring(hmac.length - 1));
    var part1 = hmac.substr(0, offset * 2);
    var part2 = hmac.substr(offset * 2, 8);
    var part3 = hmac.substr(offset * 2 + 8, hmac.length - offset);

    var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec("7fffffff")) + "";
    otp = otp.substr(otp.length - 6, 6);
    return otp;
  }
  setInterval(()=>{
    let epoch = Math.round(new Date().getTime() / 1000.0);
    let countDown = 30 - (epoch % 30)
    if (epoch % 30 == 0) updateOtp()
    $("#countDown").text(countDown)
  },1000)
  return {
    updateOtp: updateOtp
  };
})();
