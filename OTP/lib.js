var fn = (function() {
  const openCity = (evt, cityName) => {
    var i, tabcontent, tablinks;
      tabcontent = document.getElementsByClassName("tabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }
      document.getElementById(cityName).style.display = "block";
      evt.currentTarget.className += " active";
  }

  const getOTP = (pos, key) => {
    document.getElementById(pos).innerText = new TOTP(key).genOTP();
  }

  return {
    openCity: openCity,
    getOTP: getOTP
  };
})();