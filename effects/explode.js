const explode = ({ x, y, r, g, b, dampening, maxSpeed, maxAge, partCount, gravity }) => {
    const particles = [];
    while (particles.length < partCount) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * maxSpeed;
        const vx = Math.sin(angle) * speed;
        const vy = Math.cos(angle) * speed;
        const size = 2;
        particles.push({ x, y, vx, vy, size, age: Math.pow(Math.random(), 2) * maxAge });
    }
    let age = 0;

    function update(dt) {
        particles.forEach(part => {
            part.age += dt;
            part.x += part.vx * dt;
            part.y += part.vy * dt + gravity * 0.5 * dt * dt;
            part.vx *= Math.pow(dampening, dt);
            part.vy *= Math.pow(dampening, dt);
            part.vy += gravity * dt
        });
        age += dt;
        if (age > maxAge) {
            this.alive = false;
        }
    }

    function draw(ctx) {
        particles.forEach(part => {
            const gradient = ctx.createRadialGradient(part.x, part.y, 0, part.x, part.y, part.size);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(maxAge - part.age) / maxAge})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

            ctx.beginPath();
            ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }

    return {
        update,
        draw,
        alive: true
    }
}

export default explode;