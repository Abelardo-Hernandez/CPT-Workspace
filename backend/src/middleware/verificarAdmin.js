function verificarAdmin(req, res, next) {

    if (req.user.rol !== 'administrador') {

        return res.status(403).json({
            message: 'No autorizado'
        });

    }

    next();

}

module.exports = verificarAdmin;