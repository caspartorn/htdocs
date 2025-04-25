const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Användarnamn: ', (username) => {
  rl.question('Lösenord: ', (password) => {
    axios.post('http://localhost:3000/signup', {
      username,
      password
    })
    .then(res => {
      console.log('✅ Användare registrerad!');
      console.log('Användarnamn:', res.data.username);
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
