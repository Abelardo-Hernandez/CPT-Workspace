const bcrypt = require('bcrypt');

async function generar() {
    const password = '1a2b3c*';
    const hash = await bcrypt.hash(password, 10);
    console.log(hash);

}

generar();