function resetExperimentContainer() {
  const experimentContainer = document.getElementById('experiment-container')
  experimentContainer.innerHTML = ''
  experimentContainer.style.display = 'none'
}

let selectedGames = [] // Filled by experimenter selection
let currentGameIndex = 0

function runNextGame() {
  if (currentGameIndex < selectedGames.length) {
    const gameFn = selectedGames[currentGameIndex]
    currentGameIndex += 1

    document.getElementById('experiment-container').style.display = 'block'
    gameFn(participantID, () => {
      resetExperimentContainer()
      runNextGame() // Call next game when done
    })
  } else {
    // All games complete
    document.body.innerHTML =
      '<h2 style="text-align:center; margin-top: 20%;">All selected games completed. Thank you!</h2>'
  }
}

// Ask for participant ID, full screen, game selection, and start sequence
document.addEventListener('DOMContentLoaded', () => {
  askForParticipantID((games) => {
    selectedGames = games
    currentGameIndex = 0
    runNextGame()
  })
})
