reget = (() => {
    const reget = () => {
        fetch("/voslot-ims/api/v1/thirdpartypayments?", {
            "headers": {
              "authorization": localStorage.getItem("token").replaceAll('"', ''),
            },
            "method": "GET",
          }).then((response) => response.json())
          .then((data) => {
            var limit = 100000
            var result = ""
            data.forEach(d => {
              let maxdailyamt = d.currencies[0].maxdailyamt
              let maxtotalamt = d.currencies[0].maxtotalamt
              let dailyamt = d.currencies[0].dailyamt
              let totalamt = d.currencies[0].totalamt
              let daily = maxdailyamt - dailyamt
              let total = maxtotalamt - totalamt
              if (daily < limit || total < limit) {
                result += d.thirdpartypaymentcode + ': ' + d.thirdpartypaymentdisplayname['en-US'] + '每日已收: ' + daily + '總收已收' + total + ' 已小於' + limit + '\r\n'
              }
            })
            if (result != '') {
              alert(result)
            }
          });
      }
      reget()
      setInterval(() => {
        reget()
      }, 900000)
})();