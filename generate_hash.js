const bcrypt = require('bcrypt');
// ПАРОЛЬ, который хотим захэшировать (можете взять из process.argv[2]) const password = process.argv[2] || 'pwd'; 

const saltRounds = 10;
const password = "pwd";

bcrypt.hash(password, saltRounds).then(hash => { console.log('bcrypt hash:', hash); }).catch(console.error);