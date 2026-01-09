const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/lstm/run-all', {});
    console.log('STATUS', res.status);
    console.log(JSON.stringify(res.data, null, 2));
    process.exit(0);
  } catch (err) {
    if (err.response) {
      console.error('ERROR', err.response.status, err.response.data);
    } else {
      console.error('ERROR', err.message);
    }
    process.exit(1);
  }
})();
