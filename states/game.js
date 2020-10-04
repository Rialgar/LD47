let scale = 1;
const offset = { x: 0, y: 0 };

const gameSize = {
    x: 160,
    y: 120
}

const outerBorder = 1;
const innerBorder = 13;
const pathWidth = innerBorder - outerBorder;
const pathDistance = (outerBorder + innerBorder) / 2;
const pathSize = {
    x: (gameSize.x - 2 * innerBorder),
    y: (gameSize.y - 2 * innerBorder),
    arc: Math.PI * 0.5 * pathWidth / 2
}
const centerPath = [
    {
        start: { pos: 0, x: pathDistance, y: innerBorder },
        end: { pos: pathSize.y, x: pathDistance, y: gameSize.y - innerBorder }
    },
    {
        start: { pos: pathSize.y, angle: Math.PI },
        end: { pos: pathSize.y + pathSize.arc, angle: Math.PI * 0.5 },
        cx: innerBorder,
        cy: gameSize.y - innerBorder,
        r: pathWidth / 2
    },
    {
        start: { pos: pathSize.y + pathSize.arc, x: innerBorder, y: gameSize.y - pathDistance },
        end: { pos: pathSize.x + pathSize.y + pathSize.arc, x: gameSize.x - innerBorder, y: gameSize.y - pathDistance }
    },
    {
        start: { pos: pathSize.x + pathSize.y + pathSize.arc, angle: Math.PI * 0.5 },
        end: { pos: pathSize.x + pathSize.y + 2 * pathSize.arc, angle: 0 },
        cx: gameSize.x - innerBorder,
        cy: gameSize.y - innerBorder,
        r: pathWidth / 2
    },
    {
        start: { pos: pathSize.x + pathSize.y + 2 * pathSize.arc, x: gameSize.x - pathDistance, y: gameSize.y - innerBorder },
        end: { pos: pathSize.x + 2 * pathSize.y + 2 * pathSize.arc, x: gameSize.x - pathDistance, y: innerBorder }
    },
    {
        start: { pos: pathSize.x + 2 * pathSize.y + 2 * pathSize.arc, angle: Math.PI * 2 },
        end: { pos: pathSize.x + 2 * pathSize.y + 3 * pathSize.arc, angle: Math.PI * 1.5 },
        cx: gameSize.x - innerBorder,
        cy: innerBorder,
        r: pathWidth / 2
    },
    {
        start: { pos: pathSize.x + 2 * pathSize.y + 3 * pathSize.arc, x: gameSize.x - innerBorder, y: pathDistance },
        end: { pos: 2 * pathSize.x + 2 * pathSize.y + 3 * pathSize.arc, x: innerBorder, y: pathDistance }
    },
    {
        start: { pos: 2 * pathSize.x + 2 * pathSize.y + 3 * pathSize.arc, angle: Math.PI * 1.5 },
        end: { pos: 2 * pathSize.x + 2 * pathSize.y + 4 * pathSize.arc, angle: Math.PI },
        cx: innerBorder,
        cy: innerBorder,
        r: pathWidth / 2
    }
]
const pathLength = centerPath[centerPath.length - 1].end.pos;

const innerPath = JSON.parse(JSON.stringify(centerPath));
innerPath.forEach(segment => {
    if(segment.r){
        segment.r = pathWidth / 4;
    }
    ['start', 'end'].forEach(key => {
        ['x', 'y'].forEach(axis => {
            if(segment[key][axis] === pathDistance){
                segment[key][axis] += pathWidth / 4;
            }
            if(segment[key][axis] === gameSize[axis] - pathDistance){
                segment[key][axis] -= pathWidth / 4;
            }
        });
    });
})
const outerPath = JSON.parse(JSON.stringify(centerPath));
outerPath.forEach(segment => {
    if(segment.r){
        segment.r = 3 * pathWidth / 4;
    }
    ['start', 'end'].forEach(key => {
        ['x', 'y'].forEach(axis => {
            if(segment[key][axis] === pathDistance){
                segment[key][axis] -= pathWidth / 4;
            }
            if(segment[key][axis] === gameSize[axis] - pathDistance){
                segment[key][axis] += pathWidth / 4;
            }
        });
    });
});

const playerSize = 4;
const player = {
    position: 0,
    speed: 10,
    evasion: 0,
    round: 0,
    coins: 0
}

let things = [];

function getPathPoint(path, position) {
    while (position < 0) {
        position += pathLength;
    }
    while (position >= pathLength) {
        position -= pathLength;
    }
    const segment = path.find(seg => seg.start.pos <= position && seg.end.pos > position);
    const blend = (position - segment.start.pos) / (segment.end.pos - segment.start.pos);
    if(segment.r){
        return {
            segment,
            angle: segment.start.angle + (segment.end.angle - segment.start.angle) * blend
        }
    } else {
        return {
            segment,
            segmentIndex: path.indexOf(segment),
            x: segment.start.x + (segment.end.x - segment.start.x) * blend,
            y: segment.start.y + (segment.end.y - segment.start.y) * blend
        }
    }
}

function drawThing(ctx, position, side, size, color) {
    const path = side < 0 ? innerPath : (side > 0 ? outerPath : centerPath);
    const start = getPathPoint(path, position - size);
    const end = getPathPoint(path, position + size);
    ctx.beginPath();
    if(!start.angle){
        ctx.lineTo(start.x, start.y);
    }
    
    if(start.angle || end.angle){
        const cx = start.segment.cx || end.segment.cx;
        const cy = start.segment.cy || end.segment.cy;
        const r = start.segment.r || end.segment.r;
        const startAngle = start.angle || end.segment.start.angle;
        const endAngle = end.angle || start.segment.end.angle;

        ctx.arc(cx, cy, r, startAngle, endAngle, true);
    } else if (start.segment !== end.segment && end.segmentIndex != (start.segmentIndex + 1) % path.length ){
        const midSegment = path[(start.segmentIndex + 1) % path.length];
        ctx.arc(midSegment.cx, midSegment.cy, midSegment.r, midSegment.start.angle, midSegment.end.angle, true);
    }

    if(!end.angle){
        ctx.lineTo(end.x, end.y);
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();    
}

const maxSpawnAttempts = 50;
const coinSize = 2;
function addCoin() {
    let attempts = 0;
    let position, side;
    do {
        side = (Math.random() < 0.5) ? -1 : 1;
        position = Math.round(Math.random() * (pathLength * 2 / 3 - 2 * pathWidth) + player.position + pathLength / 3);
        attempts++;
    } while (attempts < maxSpawnAttempts && things.some(thing =>
        thing.side === side && thing.position - thing.size - coinSize < position && thing.position + thing.size + coinSize > position
    ));
    if (attempts < maxSpawnAttempts) {
        things.push({
            type: 'coin',
            size: coinSize,
            position,
            side,
            color: 'gold',
            alive: true
        });
    } else {
        console.log("Skipping a Coin");
    }
}

const obstacleSize = 4;
function addObstacle() {
    let attempts = 0;
    let position, side;
    do {
        side = (Math.random() < 0.5) ? -1 : 1;
        position = Math.round(Math.random() * (pathLength * 3 / 4 - 2 * pathWidth) + player.position + pathLength / 4);
        attempts++;
    } while (attempts < maxSpawnAttempts && things.some(thing =>
        (thing.side === side && thing.position - thing.size - obstacleSize < position && thing.position + thing.size + obstacleSize > position) ||
        (thing.side !== side && thing.type === 'obstacle' && thing.position - thing.size - 5 * obstacleSize < position && thing.position + thing.size + 5 * obstacleSize > position)
    ));
    if (attempts < maxSpawnAttempts) {
        things.push({
            type: 'obstacle',
            size: obstacleSize,
            position,
            side,
            color: 'red',
            alive: true
        });
    } else {
        console.log("Skipping an Obstacle");
    }
}

let score = 0;
let highScore = parseInt(localStorage.highScore) || 0;

function updateScore() {
    score = Math.round(player.position + pathLength * player.coins);
    if (score > highScore) {
        highScore = score;
        localStorage.highScore = highScore;
    }
}

const GameState = () => ({
    create: function () {
        this.resize();

        player.position = 0;
        player.speed = 50;
        player.evasion = 0;
        player.round = 0;
        player.coins = 0;
        things = [];
        score = 0;

        addCoin();
        addObstacle();
    },
    resize: function () {
        scale = Math.floor(Math.min(this.app.width / gameSize.x, this.app.height / gameSize.y));
        offset.x = (this.app.width - scale * gameSize.x) / 2;
        offset.y = (this.app.height - scale * gameSize.y) / 2;
    },

    step: function (dt) {
        player.position += player.speed * dt;
        updateScore();
        things.forEach(thing => {
            if (player.evasion * thing.side >= 0 && thing.position - thing.size - playerSize < player.position && thing.position + thing.size + playerSize > player.position) {
                switch (thing.type) {
                    case 'coin':
                        player.coins += 1;
                        updateScore();
                        thing.alive = false;
                        break;
                    case 'obstacle':
                        if (thing.hitOnce) {
                            this.app.loose(score);
                        } else {
                            thing.hitOnce = true;
                        }
                        break;
                }
            }
            if (thing.position <= player.position - 2 * pathWidth) {
                switch (thing.type) {
                    case 'coin':
                        thing.position += pathLength;
                        break;
                    case 'obstacle':
                        thing.alive = false;
                        break;
                }
            }
        })
        things.filter(thing => !thing.alive).forEach(thing => {
            switch (thing.type) {
                case 'coin':
                    addCoin();
                    break;
                case 'obstacle':
                    addObstacle();
                    player.speed += .2;
                    break;
            }
        })
        things = things.filter(thing => thing.alive);
        if (player.position > player.round * pathLength) {
            player.round++;
            addCoin();
            addObstacle();
        }
    },
    render: function (dt) {
        const ctx = this.app.layer.context;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.app.width, this.app.height);

        ctx.strokeStyle = 'white';
        ctx.strokeRect(offset.x, offset.y, gameSize.x * scale, gameSize.y * scale);

        ctx.save();
        ctx.transform(scale, 0, 0, scale, offset.x, offset.y);

        ctx.strokeStyle = 'white';
        ctx.strokeRect(outerBorder, outerBorder, gameSize.x - 2 * outerBorder, gameSize.y - 2 * outerBorder);
        ctx.strokeRect(innerBorder, innerBorder, gameSize.x - 2 * innerBorder, gameSize.y - 2 * innerBorder);

        ctx.globalAlpha = 1;


        drawThing(ctx, player.position, player.evasion, playerSize, 'turquoise');

        things.forEach(thing => {
            drawThing(ctx, thing.position, thing.side, thing.size, thing.color);
        });

        const textMargin = 4;
        const textLeft = innerBorder + textMargin;
        const textRight = gameSize.x - innerBorder - textMargin;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.font = `5px 'Press Start 2P'`;
        ctx.fillText("Distance", textLeft, innerBorder + textMargin);
        ctx.fillText("Coins", textLeft, innerBorder + textMargin + 20);
        ctx.fillText("Score", textLeft, innerBorder + textMargin + 40);
        ctx.fillText("Highscore", textLeft, innerBorder + textMargin + 60);

        ctx.textAlign = 'right';
        ctx.fillText(Math.round(player.position), textRight, innerBorder + textMargin + 10);
        ctx.fillText(player.coins, textRight, innerBorder + textMargin + 30);
        ctx.fillText(score, textRight, innerBorder + textMargin + 50);
        ctx.fillText(highScore, textRight, innerBorder + textMargin + 70);

        ctx.restore();
    },

    keydown: function (data) {
        if (data.key === 'left' || data.key === 'a') {
            player.evasion -= 1;
        }
        if (data.key === 'right' || data.key === 'd') {
            player.evasion += 1;
        }
    },
    keyup: function (data) {
        if (data.key === 'left' || data.key === 'a') {
            player.evasion += 1;
        }
        if (data.key === 'right' || data.key === 'd') {
            player.evasion -= 1;
        }
    },

    mousedown: function (data) { },
    mouseup: function (data) { },
    mousemove: function (data) { },

    gamepaddown: function (data) { },
    gamepadhold: function (data) { },
    gamepadup: function (data) { },
    gamepadmove: function (data) { },
});

export default GameState;