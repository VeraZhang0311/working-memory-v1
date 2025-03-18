function resetExperimentContainer() {
  const experimentContainer = document.getElementById('experiment-container')
  experimentContainer.innerHTML = ''
  experimentContainer.style.display = 'none'
}

// function startGame(gameFunction) {
//   if (!participantID) {
//     alert('Participant ID is missing. Please refresh the page.')
//     return
//   }

//   document.getElementById('main-menu').style.display = 'none'
//   document.getElementById('experiment-container').style.display = 'block'
//   gameFunction(participantID, resetExperimentContainer) // Pass ID properly
// }

// function startLspan() {
//   startGame(startLspanGame)
// }
// function startOspan() {
//   startGame(startOspanGame)
// }
// function startSspan() {
//   startGame(startSspanGame)
// }
// function startRspan() {
//   startGame(startRspanGame)
// }

// // Ask for participant ID before showing main menu
// document.addEventListener('DOMContentLoaded', function () {
//   document.getElementById('main-menu').style.display = 'none' // Hide menu initially
//   askForParticipantID(function (id) {
//     participantID = id
//     document.getElementById('main-menu').style.display = 'block' // Show main menu only after ID is entered
//   })
// })

function startGame(gameFunction, button) {
  if (!participantID) {
    alert('Participant ID is missing. Please refresh the page.')
    return
  }

  // Disable the clicked button
  button.style.backgroundColor = '#d3d3d3' // Light grey
  button.style.cursor = 'default'
  button.onclick = null // Remove click event
  button.classList.remove('menu-button-hover') // Remove hover effect

  document.getElementById('main-menu').style.display = 'none'
  document.getElementById('experiment-container').style.display = 'block'
  gameFunction(participantID, resetExperimentContainer)
}

// Attach modified start functions to buttons
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.menu-button').forEach((button) => {
    button.addEventListener('click', function () {
      const gameMap = {
        'Start LSPAN': startLspanGame,
        'Start OSPAN': startOspanGame,
        'Start SSPAN': startSspanGame,
        'Start RSPAN': startRspanGame,
      }
      startGame(gameMap[this.innerText], this)
    })
  })

  document.getElementById('main-menu').style.display = 'none'
  askForParticipantID(function (id) {
    participantID = id
    document.getElementById('main-menu').style.display = 'block'
  })
})
