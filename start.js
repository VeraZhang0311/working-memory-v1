let participantID = null // Global variable to store participant ID
let selectedGameFunctions = [] // Store game functions in selected order

function askForParticipantID(onIDEntered) {
  const jsPsych = initJsPsych({
    display_element: 'experiment-container',
  })

  let timeline = []

  const get_participant_id = {
    type: jsPsychSurveyText,
    questions: [
      {
        prompt: 'Please enter the participant ID:',
        required: true,
        name: 'participant_id',
      },
    ],
    on_finish: function (data) {
      participantID = data.response.participant_id.trim()
    },
  }

  const enter_fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
  }

  const select_games = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="text-align: center;">
        <h3>Select the games in the order you want to play (click again to unselect):</h3>
        <div id="game-buttons" style="margin-top: 20px;">
          <button class="game-button" data-game="LSPAN">LSPAN</button>
          <button class="game-button" data-game="OSPAN">OSPAN</button>
          <button class="game-button" data-game="SSPAN">SSPAN</button>
          <button class="game-button" data-game="RSPAN">RSPAN</button>
        </div>
        <p id="selected-list" style="margin-top:20px; font-size: 18px;"></p>
        <button id="confirm-selection" disabled>Confirm Selection</button>
      </div>
    `,
    choices: [],
    on_load: function () {
      let selected = []
      const buttons = document.querySelectorAll('.game-button')
      const list = document.getElementById('selected-list')
      const confirmBtn = document.getElementById('confirm-selection')

      function updateList() {
        list.textContent =
          selected.length > 0
            ? 'Selected: ' + selected.join(', ')
            : 'No games selected yet.'
        confirmBtn.disabled = selected.length === 0
        // Re-style buttons based on selection
        buttons.forEach((btn) => {
          const game = btn.getAttribute('data-game')
          btn.classList.toggle('selected', selected.includes(game))
        })
      }

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const game = btn.getAttribute('data-game')
          const index = selected.indexOf(game)
          if (index === -1) {
            selected.push(game)
          } else {
            selected.splice(index, 1)
          }
          updateList()
        })
      })

      confirmBtn.addEventListener('click', () => {
        const gameMap = {
          LSPAN: startLspanGame,
          OSPAN: startOspanGame,
          SSPAN: startSspanGame,
          RSPAN: startRspanGame,
        }
        selectedGameFunctions = selected.map((g) => gameMap[g])
        jsPsych.finishTrial()
      })

      updateList()
    },
  }

  const space_intro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="padding: 30px; font-size: 22px; max-width: 800px; text-align: center;">
        <h2>🚀 Welcome, Cadet!</h2>
        <p>You’ve been chosen for a critical mission on board the research ship <em>Cognitus</em>.</p>
        <p>Your task? Travel through memory galaxies and help us collect important data for the Intergalactic Brain Alliance.</p>
        <p>Each task is a <b>memory-based</b> challenge designed to test your mind under cosmic pressure.</p>
        <p>Complete them all to make it back to Earth a hero!</p>
        <p>Click the button below to begin your first challenge.</p>
      </div>
    `,
    choices: ['Launch Mission'],
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  const delay_and_exit = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '',
    choices: 'NO_KEYS',
    trial_duration: 1000,
    on_finish: function () {
      jsPsych.endExperiment()
      onIDEntered(selectedGameFunctions)
    },
  }

  timeline.push(
    get_participant_id,
    enter_fullscreen,
    select_games,
    space_intro,
    delay_and_exit
  )

  jsPsych.run(timeline)
}
