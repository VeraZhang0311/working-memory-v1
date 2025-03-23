let participantID = null // Global variable to store participant ID

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
    type: jsPsychSurveyMultiSelect,
    questions: [
      {
        prompt: 'Select the games to play (in desired order):',
        name: 'games',
        options: ['LSPAN', 'OSPAN', 'SSPAN', 'RSPAN'],
        required: true,
      },
    ],
    on_finish: function (data) {
      const selected = data.response.games
      const gameMap = {
        LSPAN: startLspanGame,
        OSPAN: startOspanGame,
        SSPAN: startSspanGame,
        RSPAN: startRspanGame,
      }
      selectedGameFunctions = selected.map((g) => gameMap[g])
    },
  }

  const space_intro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="padding: 30px; font-size: 22px; max-width: 800px; text-align: center;">
        <h2>🚀 Welcome, Cadet!</h2>
        <p>You’ve been chosen for a critical mission on board the research ship <em>Cognitus</em>.</p>
        <p>Your task? Travel through memory galaxies and help us collect important data for the Intergalactic Brain Alliance.</p>
        <p>Each task is a memory-based challenge designed to test your mind under cosmic pressure.</p>
        <p>Complete them all to make it back to Earth a hero!</p>
        <p>Click the button below to begin your first challenge.</p>
      </div>
    `,
    choices: ['Launch Mission'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      jsPsych.endExperiment() // Finish jsPsych timeline before switching to custom game logic
      onIDEntered(selectedGameFunctions)
    },
  }

  timeline.push(get_participant_id, enter_fullscreen, select_games, space_intro)

  jsPsych.run(timeline)
}
