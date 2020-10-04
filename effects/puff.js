const puff = ({ r, g, b, dampening, speedScale, maxAge, partIntervalMin, partIntervalMax }) => {
    let particles = [];

    let lastX = 0;
    let lastY = 0;
    let currentX = 0;
    let currentY = 0;
    let lastDt = 1;

    const partIntervalRange = partIntervalMax - partIntervalMin;
    let timeTilPart = Math.random() * partIntervalRange + partIntervalMin;

    let soundCounter = 1;

    function update(dt, app) {
        timeTilPart -= dt;

        let remainder = dt;
        while (timeTilPart < 0) {
            let nextPart = Math.random() * partIntervalRange + partIntervalMin;
            timeTilPart += nextPart
            const delta = Math.min(remainder, nextPart);
            remainder -= nextPart;

            const speedFactor = Math.random() * speedScale * lastDt;
            const startAge = Math.pow(Math.random(), 2) * maxAge;
            particles.push({
                x: currentX,
                y: currentY,
                vx: (lastX - currentX) * speedFactor,
                vy: (lastY - currentY) * speedFactor,
                age: startAge,
                size: 2
            });

            if (startAge < 2 * maxAge / 3) {
                soundCounter--;
                if (soundCounter <= 0) {
                    app.sound.play('puff_s');
                    soundCounter = 8;
                }
            }

            particles.forEach(part => {
                part.age += delta;
                part.x += part.vx * delta;
                part.y += part.vy * delta;
                part.vx *= Math.pow(dampening, delta);
                part.vy *= Math.pow(dampening, delta);
            });
        }

        if (remainder > 0) {
            particles.forEach(part => {
                part.age += remainder;
                part.x += part.vx * remainder;
                part.y += part.vy * remainder;
                part.vx *= Math.pow(dampening, remainder);
                part.vy *= Math.pow(dampening, remainder);
            });
        }
        particles = particles.filter(part => part.age < maxAge);
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

    function move(x1, y1, x2, y2, dt) {
        lastX = x1;
        lastY = y1;
        currentX = x2;
        currentY = y2;
        lastDt = dt;
    }

    function reset() {
        particles = [],
            lastX = 0;
        lastY = 0;
        currentX = 0;
        currentY = 0;
        lastDt = 1;
        timeTilPart = Math.random() * partIntervalRange + partIntervalMin;
    }

    return {
        update,
        draw,
        move,
        reset,
        alive: true
    }
}

export default puff;