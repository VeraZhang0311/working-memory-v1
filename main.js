function resetExperimentContainer() {
  const experimentContainer = document.getElementById('experiment-container')
  experimentContainer.innerHTML = ''
  experimentContainer.style.display = 'none'
}

function startGame(gameFunction) {
  if (!participantID) {
    alert('Participant ID is missing. Please refresh the page.')
    return
  }

  document.getElementById('main-menu').style.display = 'none'
  document.getElementById('experiment-container').style.display = 'block'
  gameFunction(participantID, resetExperimentContainer) // Pass ID properly
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

// Ask for participant ID before showing main menu
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('main-menu').style.display = 'none' // Hide menu initially
  askForParticipantID(function (id) {
    participantID = id
    document.getElementById('main-menu').style.display = 'block' // Show main menu only after ID is entered
  })
})
