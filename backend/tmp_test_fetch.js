const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/predict/fetch-predict-save', { lat: 17.9757, lon: 102.6331 }, { timeout: 20000 });
    console.log('STATUS', res.status);
    console.log('BODY', JSON.stringify(res.data, null, 2));
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
