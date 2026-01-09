const axios = require('axios');
(async () => {
  try {
    const payload = {
      coordinates: { lat: 17.9757, lon: 102.6331 },
      historical_data: [],
      stats: {}
    };
    const res = await axios.post('http://127.0.0.1:5001/ingest_and_predict', payload, { timeout: 20000 });
    console.log('STATUS', res.status);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('ERR STATUS', err.response.status);
      console.error('ERR DATA', err.response.data);
    } else {
      console.error('ERR', err.message);
    }
    process.exit(1);
  }
})();
