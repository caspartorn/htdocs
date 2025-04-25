const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Användarnamn: ', (username) => {
  rl.question('Lösenord: ', (password) => {
    axios.post('http://localhost:3000/login', {
      username,
      password
    })
    .then(res => {
      console.log('✅ Inloggad!');
      console.log('Token:', res.data.token);
    })
    .catch(err => {
      if (err.response) {
        console.error('❌ Fel:', err.response.data.error);
      } else {
        console.error('❌ Något gick fel:', err.message);
      }
    })
    .finally(() => {
      rl.close();
    });
  });
});
    