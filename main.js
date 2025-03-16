function startGame(gameFunction) {
    document.getElementById("main-menu").style.display = "none"; 
    document.getElementById("experiment-container").style.display = "block"; 
    gameFunction("participant_001", endGame);
}

function startLspan() { startGame(startLspanGame); }
function startOspan() { startGame(startOspanGame); }
function startSspan() { startGame(startSspanGame); }
function startRspan() { startGame(startRspanGame); }

function endGame() {
    document.getElementById("experiment-container").innerHTML = "";
    document.getElementById("experiment-container").style.display = "none"; 
    document.getElementById("main-menu").style.display = "block"; 
}
