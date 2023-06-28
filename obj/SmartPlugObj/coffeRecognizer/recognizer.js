const { PowerOn, TwoCoffe, OneCoffe } = require('./arrayConfronto');
/**
 * Normalizza i tempi di una serie temporale.
 * @param {object} v Serie temporale da normalizzare.
 */
const normalize = v => {
  const offsetV = v[0];
  const rangeV = v[v.length - 1] - offsetV;

  for (let i = 0; i < v.length; i++)
    v[i] = (v[i] - offsetV) / rangeV;
};

/**
 * Confronta due serie temporali restituendo una misura proporzionale alla differenza tra le due.
 * I parametri sono oggetti nel formato seguente:
 * 
 * {
 *      t: [0, 4, 5, 6, 7],
 *      v: [5.7, 4.8, 1.2, 1.5, 4]
 * }
 * 
 * dove "t" contiene gli istanti di tempo e "v" i valori che assume la serie in tali istanti.
 * t e v devono avere la stessa lunghezza.
 * 
 * @param {object} a Prima serie temporale da confrontare. Viene modificata dalla funzione.
 * @param {object} b Seconda serie temporale da confrontare. Viene modificata dalla funzione.
 * @returns Errore quadratico medio
 */
const compareSeries = (a, b) => {
  // Check input errors
  if (!a.hasOwnProperty("t")) throw "a non contiene t";
  if (!a.hasOwnProperty("v")) throw "a non contiene v";
  if (!b.hasOwnProperty("t")) throw "b non contiene t";
  if (!b.hasOwnProperty("v")) throw "b non contiene v";
  if (a.t.length != a.v.length) throw "t e v di diversa lunghezza in a";
  if (b.t.length != b.v.length) throw "t e v di diversa lunghezza in b";
  if (a.t.length == 0) throw "array vuoti in a";
  if (b.t.length == 0) throw "array vuoti in b";

  // Normalizing
  normalize(a.t);
  normalize(b.t);

  // Picking longest and shortest array
  let long = a.t.length > b.t.length ? a : b;
  let short = a.t.length <= b.t.length ? a : b;

  // Resampling to size of longest array
  let resampled = { t: [], v: [] };
  for (let i = 0; i < long.t.length; i++) {
    for (let j = 0; j < short.t.length - 1; j++) {
      if (long.t[i] >= short.t[j] && long.t[i] <= short.t[j + 1]) {
        // Linear interpolation
        const k = (short.v[j + 1] - short.v[j]) / (short.t[j + 1] - short.t[j]);
        const inter = short.v[j];
        const t = long.t[i] - short.t[j];

        // Calculate the timestamp based on the original range
        const timestamp = inter + k * t;
        const originalRange = short.t[short.t.length - 1] - short.t[0];
        const normalizedTimestamp = timestamp * originalRange + short.t[0];

        // Add point to resampled array
        resampled.t.push(normalizedTimestamp);
        resampled.v.push(timestamp);

        break;
      }
    }
  }

  // Calculating Mean Squared Error (MSE)
  let acc = 0;
  for (let i = 0; i < long.t.length; i++) {
    const diff = long.v[i] - resampled.v[i];
    acc += diff * diff;
  }
  const mse = acc / long.t.length;


  return {
    mse: mse
  };
};



        
            function recognize(objSeries){
            // Inizializza il valore di confronto minimo a Infinity
            let minMSE = Infinity;

            // Inizializza la variabile di conteggio
            let count;
            let somma=0;
            console.log(objSeries)
            console.log(new Date());
            for(let i=0; i<objSeries.v.length; i++){
              somma+=objSeries.v[i];
            }

            if(somma>1500){
                PowerOn.forEach(series => {
                const res = compareSeries(objSeries, series);
                if (res.mse < minMSE) {
                    count=0;
                    minMSE = res.mse;
                }
                });


                OneCoffe.forEach(series => {
                const res = compareSeries(objSeries, series);
                if (res.mse < minMSE) {
                    count=1;
                    minMSE = res.mse;
                }
                });

                TwoCoffe.forEach(series => {
                const res = compareSeries(objSeries, series);
                if (res.mse < minMSE) {
                    count=2;
                    minMSE = res.mse;
                }

             
            });


}else {
    count = -1;
}
return count;
}

module.exports = recognize;