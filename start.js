let participantID = null // Global variable to store participant ID

function askForParticipantID(onIDEntered) {
  const jsPsych = initJsPsych({
    display_element: 'experiment-container',
  })

  var timeline = []

  var get_participant_id = {
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

  var enter_fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
  }

  var returnToMenuScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:
      '<p id="game-start-text" style="font-size: 40px; opacity: 0;">Game STARTS!</p>',
    choices: 'NO_KEYS', // No user response allowed
    trial_duration: 2000, // Show for 2 seconds
    on_load: function () {
      // Apply fade-in effect using JavaScript
      let textElement = document.getElementById('game-start-text')
      textElement.style.transition = 'opacity 1.5s ease-in-out'
      textElement.style.opacity = '1'
    },
    on_finish: function () {
      document.getElementById('experiment-container').style.display = 'none'
      document.getElementById('main-menu').style.display = 'block'
    },
  }

  timeline.push(get_participant_id, enter_fullscreen, returnToMenuScreen)
  jsPsych.run(timeline)
}
