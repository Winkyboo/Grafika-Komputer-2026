const canvas = document.getElementById("graphicsCanvas");
const ctx = canvas.getContext("2d");

console.log(canvas.width, canvas.height);

ctx.fillStyle = "red";
ctx.fillRect(0, 0, 10, 10);

ctx.fillStyle = "blue";
ctx.fillRect(100, 100, 10, 10);

ctx.fillStyle = "green";
ctx.fillRect(400, 250, 10, 10);

const rectangle = {
    x: 80,
    y: 80,
    width: 160,
    height: 100,
    color: "#3498db"
};

const line = {
    x1: 300,
    y1: 80,
    x2: 500,
    y2: 180,
    color: "#e74c3c",
    width: 5
};

const circle = {
    x: 650,
    y: 120,
    radius: 60,
    startAngle: 0,
    endAngle: Math.PI * 2,
    color: "#2ecc71"
};

const triangle = {
    x1: 150,
    y1: 300,
    x2: 80,
    y2: 430,
    x3: 220,
    y3: 430,
    width: 3,
    color1: "#f39c12",
    color2: "#8a5705"
};

const movingBall = {
    x: 350,
    y: 300,
    radius: 25,
    speedX: 1,
    speedY: 1,
    color: "#9b59b6"
};

const mouse = {
    x: 0,
    y: 0
};

const colors = [
    "#9b59b6",
    "#e74c3c",
    "#2ecc71",
    "#f1c40f",
    "#3498db"
];

const player = {
    x: 600,
    y: 350,
    width: 107,
    height: 60,
    speed: 5,
    image: new Image() 
};
player.image.src = "frieren_player.png";

const movingFrieren = {
    x: 600,
    y: 350,
    width: 60,
    height: 60,
    speedX: 4,
    speedY: 4,
    image: new Image() 
};
movingFrieren.image.src = "frieren_movingobject.png";

const movingFrieren2 = {
    x: 250,
    y: 200,
    width: 65,
    height: 65,
    speedX: 7,
    speedY: 7,
    image: new Image() 
};
movingFrieren2.image.src = "frieren_movingobject (2).png";

const keys = {};

const btnReset = document.getElementById("btnReset");
const btnPause = document.getElementById("btnPause");
const btnClearCircles = document.getElementById("btnClearCircles");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");

let colorIndex = 0;

let isTrailMode = false;
let isPaused = false;
const btnTrail = document.getElementById("btnTrail");

btnTrail.addEventListener("click", function() {
    isTrailMode = !isTrailMode; 
    if (isTrailMode) {
        btnTrail.innerText = "Matikan Trail Mode (Bersihkan)";
        btnTrail.style.backgroundColor = "#e74c3c"; 
        btnTrail.style.color = "white";
    } else {
        btnTrail.innerText = "Aktifkan Trail Mode (Jejak)";
        btnTrail.style.backgroundColor = ""; 
        btnTrail.style.color = "";
    }
});

function resetPlayer() {
    player.x = 600;
    player.y = 350;
}

btnReset.addEventListener("click", resetPlayer);

function togglePause() {
    isPaused = !isPaused;
    btnPause.textContent = isPaused ? "Resume " : "Pause ";
    btnPause.appendChild(document.createElement("kbd"));
    btnPause.lastElementChild.textContent = "Space";
    btnPause.classList.toggle("button-paused", isPaused);

    if (!isPaused) {
        requestAnimationFrame(animate);
    }
}

btnPause.addEventListener("click", togglePause);

speedRange.addEventListener("input", function() {
    player.speed = Number(speedRange.value);
    speedValue.textContent = speedRange.value;
});

const followerCircle = {
    radius: 15,
    color: "#f39c12" 
};

const clickedCircles = [];

function clearClickedCircles() {
    clickedCircles.length = 0;
}

btnClearCircles.addEventListener("click", clearClickedCircles);

canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();

    mouse.x =
        (event.clientX - rect.left) *
        (canvas.width / rect.width);

    mouse.y =
        (event.clientY - rect.top) *
        (canvas.height / rect.height);
});

canvas.addEventListener("click", function() {
    colorIndex = (colorIndex + 1) % colors.length;
    movingBall.color = colors[colorIndex];
    clickedCircles.push({
        x: mouse.x,
        y: mouse.y,
        radius: 10 + Math.random() * 20, 
        color: colors[Math.floor(Math.random() * colors.length)]
    });
});

canvas.addEventListener("contextmenu", function(event) {
    event.preventDefault();

    if (clickedCircles.length > 0) {
        const removedCircle = clickedCircles.pop();
        console.log("Lingkaran terakhir dihapus pada posisi:", removedCircle.x, removedCircle.y);
    } else {
        console.log("Tidak ada lingkaran untuk dihapus.");
    }
});

window.addEventListener("keydown", function(event) {
    if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        togglePause();
        return;
    }

    const controlledKeys = [
        "arrowleft",
        "arrowright",
        "arrowup",
        "arrowdown",
        "a",
        "d",
        "w",
        "s"
    ];

    if (controlledKeys.includes(event.key.toLowerCase())) {
        event.preventDefault();
    }

    keys[event.key.toLowerCase()] = true;

    if (
        event.key.toLowerCase() === "r" &&
        !event.repeat
    ) {
        resetPlayer();
    }
});

window.addEventListener("keyup", function(event) {
    keys[event.key.toLowerCase()] = false;
});


function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCoordinateGrid() {
    const gridSize = 50;

    ctx.save();
    ctx.strokeStyle = "rgba(45, 65, 110, 0.15)";
    ctx.lineWidth = 1;

    for (let x = gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.restore();
}

function drawRectangle() {
    ctx.fillStyle = rectangle.color;
    ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
}

function drawLine() {
    ctx.beginPath();

    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);

    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.width;

    ctx.stroke();
}

function drawCircle() {
    ctx.beginPath();

    ctx.arc(
        circle.x,
        circle.y,
        circle.radius,
        circle.startAngle,
        circle.endAngle
    );

    ctx.fillStyle = circle.color;
    ctx.fill();
}

function drawTriangle() {
    ctx.beginPath();

    ctx.moveTo(triangle.x1, triangle.y1);
    ctx.lineTo(triangle.x2, triangle.y2);
    ctx.lineTo(triangle.x3, triangle.y3);

    ctx.closePath();

    ctx.fillStyle = triangle.color1;
    ctx.fill();

    ctx.strokeStyle = triangle.color2;
    ctx.lineWidth = triangle.width;
    ctx.stroke();
}

function drawStaticScene() {
    drawRectangle();
    drawLine();
    drawCircle();
    drawTriangle();
}

function drawFollowerCircle() {
    ctx.beginPath();
    ctx.arc(
        mouse.x,
        mouse.y,
        followerCircle.radius,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = followerCircle.color;
    ctx.fill();
}

function drawClickedCircles() {
    for (const c of clickedCircles) {
        ctx.beginPath();
        ctx.arc(
            c.x,
            c.y,
            c.radius,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = c.color;
        ctx.fill();
    }
}

function drawMovingBall() {
    ctx.beginPath();

    ctx.arc(
        movingBall.x,
        movingBall.y,
        movingBall.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = movingBall.color;
    ctx.fill();
}

function updateMovingBall() {
    movingBall.x += movingBall.speedX;
    movingBall.y += movingBall.speedY;

    if (
        movingBall.x + movingBall.radius >= canvas.width ||
        movingBall.x - movingBall.radius <= 0
    ) {
        movingBall.speedX *= -1;
    }

    if (
        movingBall.y + movingBall.radius >= canvas.height ||
        movingBall.y - movingBall.radius <= 0
    ) {
        movingBall.speedY *= -1;
    } 
}

function drawMovingFrieren() {
    ctx.drawImage(
        movingFrieren.image,
        movingFrieren.x,
        movingFrieren.y,
        movingFrieren.width,
        movingFrieren.height
    );
}

function drawMovingFrieren2() {
    ctx.drawImage(
        movingFrieren2.image,
        movingFrieren2.x,
        movingFrieren2.y,
        movingFrieren2.width,
        movingFrieren2.height
    );
}

function updateMovingFrieren() {
    movingFrieren.x += movingFrieren.speedX;
    movingFrieren.y += movingFrieren.speedY;
    if (movingFrieren.x + movingFrieren.width >= canvas.width || movingFrieren.x <= 0) {
        movingFrieren.speedX *= -1;  
    }
    if (movingFrieren.y + movingFrieren.height >= canvas.height || movingFrieren.y <= 0) {
        movingFrieren.speedY *= -1;  
    }
}

function updateMovingFrieren2() {
    movingFrieren2.x += movingFrieren2.speedX;
    movingFrieren2.y += movingFrieren2.speedY;
    if (movingFrieren2.x + movingFrieren2.width >= canvas.width || movingFrieren2.x <= 0) {
        movingFrieren2.speedX *= -1;
    }
    if (movingFrieren2.y + movingFrieren2.height >= canvas.height || movingFrieren2.y <= 0) {
        movingFrieren2.speedY *= -1;
    }
}

function drawMouseCoordinate() {
    ctx.fillStyle = "#222";
    ctx.font = "16px Arial";

    ctx.fillText(
        `Mouse: (${Math.round(mouse.x)}, ${Math.round(mouse.y)})`,
        20,
        30
    );
}

function drawPlayer() {
    // ctx.fillStyle = "#222";

    // ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.drawImage(
        player.image,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

function updatePlayer() {
    if (keys["arrowleft"] || keys["a"]) {
        player.x -= player.speed;
    }

    if (keys["arrowright"] || keys["d"]) {
        player.x += player.speed;
    }

    if (keys["arrowup"] || keys["w"]) {
        player.y -= player.speed;
    }

    if (keys["arrowdown"] || keys["s"]) {
        player.y += player.speed;
    }

    player.x = Math.max(
        0,
        Math.min(
            canvas.width - player.width,
            player.x
            )
    );

    player.y = Math.max(
        0,
        Math.min(
            canvas.height - player.height,
            player.y
        )
    );
}

function animate() {
    if (isPaused) {
        return;
    }

    if (!isTrailMode) {
        clearCanvas();
        drawCoordinateGrid();
    }

    updateMovingBall();
    updatePlayer();
    updateMovingFrieren();
    updateMovingFrieren2();
    drawStaticScene();
    drawClickedCircles();
    drawPlayer();
    drawMovingBall();
    drawMovingFrieren();
    drawMovingFrieren2();
    drawFollowerCircle();
    drawMouseCoordinate();

    requestAnimationFrame(animate);
}

animate();
