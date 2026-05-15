
const globaltel = new Set(['0817', '0904', '0905', '0906', '0915', '0916', '0917', '0926', '0927', '0935', '0936', '0937', '0945', '0954', '0955', '0956', '0957', '0958', '0959', '0965', '0966', '0967', '0975', '0976', '0977', '0978', '0979', '0995', '0996', '0997', '09253', '09255', '09256', '09257', '09258'])

const RE_10 = /^9[0-9]{9}/
const RE_11 = /^09[0-9]{9}/
const RE_12 = /^639[0-9]{9}/
const RE_13 = /^6309[0-9]{9}/

onmessage = (event) => {
    let sum = 0
    let sum_del = 0
    const newdata = []
    const excluded = []

    event.data.forEach(d => {
        const l = d.length
        switch (l) {
            case 10:
                if (RE_10.test(d)) { sum++; newdata.push("63" + d) }
                else { sum_del++; excluded.push(d) }
                break
            case 11:
                if (RE_11.test(d)) { sum++; newdata.push("63" + d.slice(1)) }
                else { sum_del++; excluded.push(d) }
                break
            case 12:
                if (RE_12.test(d)) { sum++; newdata.push(d) }
                else { sum_del++; excluded.push(d) }
                break
            case 13:
                if (RE_13.test(d)) { sum++; newdata.push("63" + d.slice(3)) }
                else { sum_del++; excluded.push(d) }
                break
            default:
                sum_del++; excluded.push(d)
        }
    })

    if (excluded.length > 0) {
        postMessage({ type: "excluded", data: excluded })
    }

    newdata.forEach(d => {
        const tel = "0" + d.slice(2, 5)
        postMessage({ type: globaltel.has(tel) ? "global" : "noneglobal", data: d })
    })

    postMessage({ type: "summary", data: "收錄總數:" + sum + " 排除總數:" + sum_del })
    postMessage({ type: "finished", data: '' })
};