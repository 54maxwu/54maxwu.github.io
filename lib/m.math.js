m = (() => {
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/big.js@6.2.1/big.min.js";
    document.head.appendChild(script);
    return {
         plus(a, b) {
              return parseFloat(new Big(a).plus(b))
         },
         minus(a, b) {
              return parseFloat(new Big(a).minus(b))
         },
         times(a, b) {
              return parseFloat(new Big(a).times(b))
         },
         div(a, b) {
              return parseFloat(new Big(a).div(b))
         },
         mod(a, b) {
              return parseFloat(new Big(a).mod(b))
         },
         abs(a) {
              return parseFloat(new Big(a).abs())
         },
         pow(a, b) {
              return parseFloat(new Big(a).pow(b))
         },
         fixed(a, b) {
              return parseFloat(new Big(a).toFixed(b))
         },
    };
})();