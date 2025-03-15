function startLspan() {
    document.getElementById("main-menu").style.display = "none"; 
    document.getElementById("experiment-container").style.display = "block"; 
    startGame("participant_001", endGame);
}

function endGame() {
    document.getElementById("experiment-container").innerHTML = "";
    document.getElementById("experiment-container").style.display = "none"; 
    document.getElementById("main-menu").style.display = "block"; 
}
