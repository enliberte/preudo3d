class Engine {
    constructor(width, height, level, cameraAngle, cameraX, cameraY, viewAngle, rate, velocity, rotation, renderer) {
        this.width = width;
        this.height = height;
        this.halfHeight = height / 2;
        this.level = level;
        this.cameraAngle = cameraAngle;
        this.cameraX = cameraX;
        this.cameraY = cameraY;
        this.prevCameraAngle = null;
        this.prevCameraX = null;
        this.prevCameraY = null;
        this.viewAngle = viewAngle;
        this.halfViewAngle = viewAngle / 2;
        this.rate = rate;
        this.rayStep = viewAngle / width;
        this.velocity = velocity;
        this.rotation = rotation;
        this.renderer = renderer;
        this.halfWallHeights = new Array(width).fill(0);
    }

    run() {
        this.initControls();
        this.render();    
    }

    initControls() {
        document.addEventListener('keydown', e => this.handleControls(e.code));
    }

    handleControls(button) {
        switch (button) {
            case 'KeyW':
                this.moveForward();
                break;
            case 'KeyS':
                this.moveBack();
                break;
            case 'KeyA':
                this.rotateLeft();
                break;
            case 'KeyD':
                this.rotateRight();
                break;            
        }
    }

    moveForward() {
        const [deltaX, deltaY] = this.calculateCoordinatesDelta();
        const nextX = this.cameraX + deltaX;
        const nextY = this.cameraY + deltaY;
        if (!this.hasCollision(nextX, nextY)) {
            this.prevCameraX = this.cameraX;
            this.prevCameraY = this.cameraY;
            this.cameraX = nextX;
            this.cameraY = nextY;
        }
    }

    moveBack() {
        const [deltaX, deltaY] = this.calculateCoordinatesDelta();
        const nextX = this.cameraX - deltaX;
        const nextY = this.cameraY - deltaY;
        if (!this.hasCollision(nextX, nextY)) {
            this.prevCameraX = this.cameraX;
            this.prevCameraY = this.cameraY;
            this.cameraX = nextX;
            this.cameraY = nextY;
        }
    }

    calculateCoordinatesDelta() {
        const cameraAngleInRadians = this.toRadians(this.cameraAngle);
        const deltaX = Math.cos(cameraAngleInRadians) / this.velocity;
        const deltaY = Math.sin(cameraAngleInRadians) / this.velocity;

        return [deltaX, deltaY];
    }

    rotateLeft() {
        this.prevCameraAngle = this.cameraAngle;
        this.cameraAngle -= this.rotation;
    }

    rotateRight() {
        this.prevCameraAngle = this.cameraAngle;
        this.cameraAngle += this.rotation;
    }

    render() {
        if (this.shouldRender) {
            this.castRays();
            this.renderer.render(this.halfWallHeights);
            this.prevCameraAngle = this.cameraAngle;
            this.prevCameraX = this.cameraX;
            this.prevCameraY = this.cameraY;
        }

        window.requestAnimationFrame(() => this.render());
    }

    get shouldRender() {
        return this.cameraAngle !== this.prevCameraAngle || this.cameraX !== this.prevCameraX || this.cameraY !== this.cameraY;
    }

    castRays() {
        const left = this.cameraAngle - this.halfViewAngle;
        for (let rayIndex = 0; rayIndex < this.width; rayIndex++) {
            const rayAngle = left + rayIndex * this.rayStep;
            const distance = this.castRay(rayAngle);
            this.halfWallHeights[rayIndex] = this.calculateHalfWallHeight(distance);
        }
    }

    castRay(angle) {
        const angleInRadians = this.toRadians(angle);
        let x = this.cameraX;
        let y = this.cameraY;
        let collided = this.hasCollision(x, y);
        while (!collided) {
            x += Math.cos(angleInRadians) / this.rate;
            y += Math.sin(angleInRadians) / this.rate;
            collided = this.hasCollision(x, y);
        }
        return this.calculateDistance(this.cameraX, x, this.cameraY, y, angle - this.cameraAngle);
    }

    hasCollision(x, y) {
        return this.level[Math.floor(x)][Math.floor(y)]
    }

    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    calculateDistance(x1, x2, y1, y2, angle) {
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const normalizedDistance = distance * Math.cos(this.toRadians(angle));
        return normalizedDistance;
    }

    calculateHalfWallHeight(distance) {
        return Math.floor(this.halfHeight / distance);
    }
}

class Renderer {
    constructor(context, width, height, ceilColor, wallColor, floorColor) {
        this.context = context;
        this.width = width;
        this.height = height;
        this.halfHeight = height / 2;
        this.ceilColor = ceilColor;
        this.wallColor = wallColor;
        this.floorColor = floorColor;
    }

    render(halfWallHeights) {
        this.context.clearRect(0, 0, this.width, this.height);
        for (let x = 0; x < halfWallHeights.length; x++) {
            const halfWallHeight = halfWallHeights[x];
            this.drawColumn(x, halfWallHeight);
        }
    } 

    drawColumn(x, halfWallHeight) {
        this.drawCeil(x, halfWallHeight);
        this.drawWall(x, halfWallHeight);
        this.drawFloor(x, halfWallHeight);
    }

    drawCeil(x, halfWallHeight) {
        this.drawLine(x, 0, this.halfHeight - halfWallHeight, this.ceilColor);
    }

    drawWall(x, halfWallHeight) {
        this.drawLine(x, this.halfHeight - halfWallHeight, this.halfHeight + halfWallHeight, this.wallColor);
    }

    drawFloor(x, halfWallHeight) {
        this.drawLine(x, this.halfHeight + halfWallHeight, this.height, this.floorColor);
    }

    drawLine(x, y1, y2, color) {
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.moveTo(x, y1);
        this.context.lineTo(x, y2);
        this.context.stroke();
    }
}

const width = 640;
const height = 480;

const level = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,1,0,1,0,0,1],
    [1,0,0,1,0,0,1,0,0,1],
    [1,0,0,1,0,0,1,0,0,1],
    [1,0,0,1,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1],
];

const ceilColor = '#3E94D1';
const floorColor = '#92F23C';
const wallColor = '#FF7340';

const cameraAngle = 90;
const cameraX = 2;
const cameraY = 2;

const viewAngle = 60;
const rate = 64;

const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;
document.body.appendChild(canvas);
const context = canvas.getContext('2d');

const velocity = 1;
const rotate = 2;

const renderer = new Renderer(context, width, height, ceilColor, wallColor, floorColor);
const engine = new Engine(width, height, level, cameraAngle, cameraX, cameraY, viewAngle, rate, velocity, rotate, renderer);

engine.run();