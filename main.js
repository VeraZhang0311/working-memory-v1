function resetExperimentContainer() {
  const experimentContainer = document.getElementById('experiment-container')
  experimentContainer.innerHTML = ''
  experimentContainer.style.display = 'none'
}

function startGame(gameFunction) {
  document.getElementById('main-menu').style.display = 'none'
  document.getElementById('experiment-container').style.display = 'block'
  gameFunction('participant_001', resetExperimentContainer)
}

function startLspan() {
  startGame(startLspanGame)
}
function startOspan() {
  startGame(startOspanGame)
}
function startSspan() {
  startGame(startSspanGame)
}
function startRspan() {
  startGame(startRspanGame)
}
