
onmessage = (event) => {
    sum = 0
    sum_del = 0
    obj = {}
    newdata = []
    globaltel = ['0905', '0906', '0915', '0916', '0917', '0926', '0927', '0935', '0936', '0937', '0945', '0953', '0954', '0955', '0956', '0965', '0966', '0967', '0975', '0977', '0978', '0979', '0995', '0996', '0997']
    event.data.forEach(d=>{
        l = d.length
        switch (l) {
            case 10:
                if(new RegExp('^9[0-9]{9}').test(d)){
                    sum++
                    newdata.push("63"+d)
                }else{
                    sum_del++
                    postMessage("排除:"+d)
                }
                break;
            case 11:
                if(new RegExp('^09[0-9]{9}').test(d)){
                    sum++
                    newdata.push("63"+d.substr(1))
                }else{
                    sum_del++
                    postMessage("排除:"+d)
                }
                break;
            case 12:
                if(new RegExp('^639[0-9]{9}').test(d)){
                    sum++
                    newdata.push(d)
                }else{
                    sum_del++
                    postMessage("排除:"+d)
                }
                break;
            case 13:
                if(new RegExp('^6309[0-9]{9}').test(d)){
                    sum++
                    newdata.push("63"+d.substr(3))
                }else{
                    sum_del++
                    postMessage("排除:"+d)
                }
                break;
            default:
                sum_del++
                postMessage("排除:"+d)
                break;
        }
    })
    newdata.forEach(d=>{
        tel = "0"+d.substr(2,3)
        if(globaltel.includes(tel)){
            obj.type = "global"
        }else{
            obj.type = "noneglobal"
        }
        obj.data = d
        postMessage(obj)
    })
    obj.type = "summary"
    obj.data = "收錄總數:"+sum+" 排除總數:"+sum_del
    postMessage(obj)
    obj.type = "finished"
    obj.data = ''
    postMessage(obj)

};