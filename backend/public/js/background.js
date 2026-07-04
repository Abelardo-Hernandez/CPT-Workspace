const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');

let width;
let height;
let nodes = [];

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    crearNodos();
}

function crearNodos() {
    nodes = [];

    const cantidad = Math.floor((width * height) / 18000);

    for (let i = 0; i < cantidad; i++) {
        nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 2 + 1
        });
    }
}

function dibujar() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
        const nodo = nodes[i];

        nodo.x += nodo.vx;
        nodo.y += nodo.vy;

        if (nodo.x < 0 || nodo.x > width) nodo.vx *= -1;
        if (nodo.y < 0 || nodo.y > height) nodo.vy *= -1;

        ctx.beginPath();
        ctx.arc(nodo.x, nodo.y, nodo.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(25, 135, 84, 0.55)';
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
            const otro = nodes[j];

            const dx = nodo.x - otro.x;
            const dy = nodo.y - otro.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia < 145) {
                ctx.beginPath();
                ctx.moveTo(nodo.x, nodo.y);
                ctx.lineTo(otro.x, otro.y);
                ctx.strokeStyle = `rgba(44, 187, 120, ${1 - distancia / 145})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(dibujar);
}

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
dibujar();