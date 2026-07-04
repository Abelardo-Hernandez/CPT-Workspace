const express = require('express');
const router = express.Router();

const verificarToken =
require('../middleware/verificarToken');

router.get(
    '/perfil',
    verificarToken,
    (req, res) => {

        res.json({
            usuario: req.user
        });

    }
);

module.exports = router;