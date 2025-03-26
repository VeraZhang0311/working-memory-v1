function resetExperimentContainer() {
  const experimentContainer = document.getElementById('experiment-container')
  experimentContainer.innerHTML = ''
  experimentContainer.style.display = 'none'
}

let selectedGames = [] // Filled by experimenter selection
let currentGameIndex = 0
let game_counts = 0 // control the "nextGame" block in the last game's timeline

function runNextGame() {
  if (currentGameIndex < selectedGames.length) {
    const gameFn = selectedGames[currentGameIndex]
    currentGameIndex += 1
    game_counts -= 1

    document.getElementById('experiment-container').style.display = 'block'
    gameFn(participantID, () => {
      resetExperimentContainer()
      runNextGame() // Call next game when done
    })
  } else {
    // All games complete
    document.head.insertAdjacentHTML(
      'beforeend',
      `<style>
        body {
          margin: 0;
        }
        .centered-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          text-align: center;
          font-family: sans-serif;
          padding: 0 40px;
        }
        .typewriter-wrapper {
          width: 100%;
          max-width: 800px;
          min-height: 120px;
        }
        .type-line {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 0.15em solid orange;
          font-size: 22px;
          line-height: 1.6;
          text-align: center;
        }
    
        .line1 {
          width: 100%;
          animation: typing1 2s steps(60, end);
        }
    
        .line2 {
          width: 100%;
          visibility: hidden;
          animation: typing2 2s steps(50, end) 2.2s forwards;
        }
    
        .final-caret {
          border-right: none;
        }
    
        @keyframes typing1 {
          from { width: 0 }
          to { width: 100% }
        }
    
        @keyframes typing2 {
          0% { width: 0; visibility: visible; }
          100% { width: 100%; visibility: visible; }
        }
    
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: orange }
        }
      </style>`
    )

    document.body.innerHTML = `
      <div class="centered-container">
        <h2 style="font-size: 40px;">🪐 Mission Complete!</h2>
        <div class="typewriter-wrapper">
          <div class="type-line line1">You’ve successfully completed all assigned cognitive simulations.</div>
          <div class="type-line line2">Thank you for your service, Cadet. Earth awaits your return.</div>
        </div>
      </div>
    `

    setTimeout(() => {
      document.querySelector('.line2').classList.add('final-caret')
    }, 4200)
  }
}

// Ask for participant ID, full screen, game selection, and start sequence
document.addEventListener('DOMContentLoaded', () => {
  askForParticipantID((games) => {
    selectedGames = games
    currentGameIndex = 0
    game_counts = games.length
    console.log(game_counts)
    runNextGame()
  })
})
