function startSspanGame(participantID, onGameEnd) {
  const jsPsych = initJsPsych({
    display_element: 'experiment-container',
    on_finish: function () {
      const filename = `data_sspan_${participantID}.csv`
      jsPsych.data.get().localSave('csv', filename)
      onGameEnd() // Call the cleanup function
    },
  })

  let experimentContainer = document.getElementById('experiment-container')
  if (experimentContainer) {
    experimentContainer.innerHTML = '' // Clear experiment content
    console.log('experiment-container found!')
  } else {
    console.warn('experiment-container not found!')
  }

  jsPsych.data.addProperties({
    participant_id: participantID,
  })

  jsPsych.randomization.setSeed('spansymmetry')
  var timeline = []

  ///////////////////////////////////////////
  // DEFINE TIMELINE AND GENERAL VARIABLES //
  ///////////////////////////////////////////
  //general variables for use throughout the experiment
  const arrAvg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length //simple constant for calculating mean of an array
  const arrSD = (arr) =>
    Math.sqrt(
      arr.map((x) => (x - arrAvg(arr)) ** 2).reduce((a, b) => a + b) /
        (arr.length - 1)
    ) // simple constant for calculating SD of an array; added by VL
  const arrSum = (arr) => arr.reduce((a, b) => a + b, 0) //simple constant for calculating sum of an array
  var SSPAN_TOTAL = 0 //variable for tracking the SSPAN TOTAL score
  var SSPAN_ABS = 0 //variable for tracking the SSPAN ABSOLUTE score
  var fullCorrect //to determine whether the entire trial was correct (for ABS score)
  var mainSelectionIndex = 0 //variable for selecting pictures from the main list
  var currentLetter //current square to be presented to participants
  var correctSEQ = [] //array for storing the correct square sequence to be recalled
  var correctSEQfiles = [] // VL: array for storing the image files corresponding to the square sequence to be recalled
  var designation //designation (for use in tagging different events in the data output)
  var useDynamicRT = true //when false, standard timeout window of 10 seconds for reading the picture; when true, mean RT from practice is used
  var calibRT = [] //array for storing RTs for practice pictures (to set timeout window for main task)
  var calibRTindex = 0 //variable for indexing picture number during the picture-only practice (for calculating mean RT)
  var squarePos = Array.from(Array(16), (_, i) => i + 1) // Array from 1-16
  var practice //for dynamic data
  var showPattACC //for displaying picture accuracy on feedback
  var currRun //for debugging/making sure the correct number of squares are shown
  var online = 0 // Numeric: 0 indicating that task is being run locally, 1 indicating that the task is being run through a platform

  //function to randomly select 'n' squares from the array without replacement
  // VL: for symmetry span, we change squareList to indexList as a more informative variable because this function now takes indices and not the actual squares; functionally no change
  function getSample(pictureList, n) {
    return jsPsych.randomization.sampleWithoutReplacement(pictureList, n)
  }

  // VL: define the filenames for the pictures
  var filename_pictures = [
    'SymBitmaps/example_symm1.bmp',
    'SymBitmaps/example_symm2.bmp',
    'SymBitmaps/example_symm3.bmp',
    'SymBitmaps/example_symm4.bmp',
    'SymBitmaps/pracsymm1.bmp',
    'SymBitmaps/pracsymm2.bmp',
    'SymBitmaps/pracsymm3.bmp',
    'SymBitmaps/pracsymm4.bmp',
    'SymBitmaps/pracsymm5.bmp',
    'SymBitmaps/pracsymm6.bmp',
    'SymBitmaps/pracsymm7.bmp',
    'SymBitmaps/pracsymm8.bmp',
    'SymBitmaps/pracsymm9.bmp',
    'SymBitmaps/pracsymm10.bmp',
    'SymBitmaps/pracsymm11.bmp',
    'SymBitmaps/pracsymm12.bmp',
    'SymBitmaps/pracsymm13.bmp',
    'SymBitmaps/pracsymm14.bmp',
    'SymBitmaps/pracsymm15.bmp',
    'SymBitmaps/symm1.bmp',
    'SymBitmaps/symm2.bmp',
    'SymBitmaps/symm3.bmp',
    'SymBitmaps/symm4.bmp',
    'SymBitmaps/symm5.bmp',
    'SymBitmaps/symm6.bmp',
    'SymBitmaps/symm7.bmp',
    'SymBitmaps/symm8.bmp',
    'SymBitmaps/symm9.bmp',
    'SymBitmaps/symm10.bmp',
    'SymBitmaps/symm11.bmp',
    'SymBitmaps/symm12.bmp',
    'SymBitmaps/symm13.bmp',
    'SymBitmaps/symm14.bmp',
    'SymBitmaps/symm15.bmp',
    'SymBitmaps/symm16.bmp',
    'SymBitmaps/symm17.bmp',
    'SymBitmaps/symm18.bmp',
    'SymBitmaps/symm19.bmp',
    'SymBitmaps/symm20.bmp',
    'SymBitmaps/symm21.bmp',
    'SymBitmaps/symm22.bmp',
    'SymBitmaps/symm23.bmp',
    'SymBitmaps/symm24.bmp',
    'SymBitmaps/symm25.bmp',
    'SymBitmaps/symm26.bmp',
    'SymBitmaps/symm27.bmp',
    'SymBitmaps/symm28.bmp',
    'SymBitmaps/symm29.bmp',
    'SymBitmaps/symm30.bmp',
    'SymBitmaps/symm31.bmp',
    'SymBitmaps/symm32.bmp',
    'SymBitmaps/symm33.bmp',
    'SymBitmaps/symm34.bmp',
    'SymBitmaps/symm35.bmp',
    'SymBitmaps/symm36.bmp',
    'SymBitmaps/symm37.bmp',
    'SymBitmaps/symm38.bmp',
    'SymBitmaps/symm39.bmp',
    'SymBitmaps/symm40.bmp',
    'SymBitmaps/symm41.bmp',
    'SymBitmaps/symm42.bmp',
    'SymBitmaps/symm43.bmp',
    'SymBitmaps/symm44.bmp',
    'SymBitmaps/symm45.bmp',
    'SymBitmaps/symm46.bmp',
    'SymBitmaps/symm47.bmp',
    'SymBitmaps/symm48.bmp',
  ]

  //   var get_participant_id = {
  //     type: jsPsychSurveyText,
  //     questions: [
  //       {
  //         prompt: 'Please enter the participant ID:',
  //         required: true,
  //         name: 'participant_id',
  //       },
  //     ],
  //     on_finish: function (data) {
  //       jsPsych.data.addProperties({
  //         participant_id: data.response.participant_id,
  //       })

  //       subject = data.response.participant_id
  //     },
  //   }

  // PRELOAD ALL AUDIO FILES
  var preload = {
    type: jsPsychPreload,
    images: [filename_pictures],
  }

  var sspan_welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="mission-welcome">Mission TotemTrace</div>`,
    choices: 'NO_KEYS',
    trial_duration: 3000,
    on_start: function () {
      const link = document.createElement('link')
      link.href =
        'https://fonts.googleapis.com/css2?family=Orbitron:wght@600&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)

      const style = document.createElement('style')
      style.innerHTML = `
        .mission-welcome {
          opacity: 0;
          font-size: 64px;
          color: white;
          font-family: 'Orbitron', sans-serif;
          text-align: center;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: fadeInOut 3s forwards;
          z-index: 9999;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `
      document.head.appendChild(style)
    },
  }

  ////////////////
  //INSTRUCTIONS//
  ////////////////

  //square Instructions
  var sspan_instruct_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🧠 Control Panel Memory Task</b></h1>' +
      "<p style='font-size:25px'>Cadet, your next training mission involves <br><br>mapping square locations on the ship's control panel while checking alien totems.</p>" +
      "<p style='font-size:25px'>Let’s start with the square memory system.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      practice = true
      showPattACC = false
    }, //switching practice to true for dynamic data, switching picture feedback to false
  }

  var sspan_instruct_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'>You’ll see colored squares light up one at a time.</p>" +
      "<p style='font-size:25px'>Memorize their positions in the exact order they appear.</p>" +
      "<p style='font-size:25px'>After two squares, you’ll see a 4x4 grid. Select the positions <b>in order</b>. You can mark blanks if needed.</p>" +
      "<p style='font-size:25px'>Order matters, cadet! Accuracy is key to keeping the control system running.</p>" +
      "<p style='font-size:25px'>Begin your square memory warm-up now.</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  //Picture Instructions
  var sspan_instruct_3 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'><b>👾 Alien Totem Analysis</b></p>" +
      "<p style='font-size:25px'>You’ll now examine mysterious totems intercepted from deep space transmissions.</p>" +
      "<p style='font-size:25px'>Your job is to decide if each totem is <i>symmetrical</i> -- meaning the left and right sides mirror each other vertically.</p>" +
      "<p style='font-size:25px'>Here's an example of a symmetrical alien totem:</p>" +
      "<img src='SymBitmaps/example_symm1.bmp' width='500px' height='350px'><br>" +
      "<p style='font-size:18px'>The red line won’t be shown during the real task—it’s just here to help you practice.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var sspan_instruct_4 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<img src='SymBitmaps/example_symm2.bmp' width='500px' height='350px'><br>" +
      "<p style='font-size:25px'>This alien totem is <b>NOT</b> symmetrical -- the sides don’t line up.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var sspan_instruct_5 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<img src='SymBitmaps/example_symm3.bmp' width='500px' height='350px'><br>" +
      "<p style='font-size:25px'>Here’s another symmetrical totem -- fold it vertically and the halves match.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var sspan_instruct_6 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<img src='SymBitmaps/example_symm4.bmp' width='500px' height='350px'><br>" +
      "<p style='font-size:25px'>This totem is <b>NOT</b> symmetrical -- its sides don’t mirror each other.</p>" +
      "<p style='font-size:25px'>If you're unsure about how to judge symmetry, now’s the time to ask questions.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var sspan_instruct_7 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'>Symmetry judgments must be fast and accurate -- no time for hesitation in space!</p>" +
      "<p style='font-size:25px'>Begin symmetry practice when ready.</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  // Combined Instructions
  var sspan_instruct_8 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🧪 Dual Task Simulation</b></h1>' +
      "<p style='font-size:25px'>Now you'll solve both parts together. First, judge an alien totem for symmetry.</p>" +
      "<p style='font-size:25px'>Then, a colored square will light up—memorize its location.</p>" +
      "<p style='font-size:25px'>This will repeat: symmetry → square → symmetry → square...</p>" +
      "<p style='font-size:25px'>At the end of the round, recall all square locations in the correct order.</p>" +
      "<p style='font-size:25px'>⚠️ Don’t take too long on symmetry decisions. The totem will disappear if you go over your time limit!</p>" +
      "<p style='font-size:25px'>Quick thinking and precise memory -- that’s your goal!</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var sspan_instruct_9 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>📊 Accuracy Checkpoint</b></h1>' +
      "<p style='font-size:25px'>You’ll see a symmetry accuracy percentage in the top right of the screen.</p>" +
      "<p style='font-size:25px'>Keep it at or above <b>85%</b> to stay in mission-ready condition.</p>" +
      "<p style='font-size:25px'>Do your best on both symmetry checks and square recalls!</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      showPattACC = true
    }, //switching to show picture accuracy for square+picture practice
  }

  //Wrap-up / final screen before main task
  var sspan_instruct_10 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🎯 Main Mission Begins</b></h1>' +
      "<p style='font-size:25px'>Practice is complete. Time for the full control panel challenge!</p>" +
      "<p style='font-size:25px'>You’ll judge symmetry, then memorize square positions -- same as practice.</p>" +
      "<p style='font-size:25px'>When recalling, use the SKIP button if needed. Order is important!</p>" +
      "<p style='font-size:25px'>Some sets will be longer than others -- stay sharp and steady.</p>" +
      "<p style='font-size:25px'>💡 Keep your symmetry accuracy at 85%+!</p>" +
      "<p style='font-size:25px'><b>This is a secret mission -- just you and your mind.</b></p>",
    choices: ['BEGIN'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      practice = false
    }, //switching practice to false for dynamic data
  }

  //////////////////////
  //TIMELINE VARIABLES//
  //////////////////////

  /*
NOTE: Due to the particular nature of the complex span (interleaving
picture and square within and across trials), the 'main_pictures'
timline variable is not treated as a traditional timeline variable.
Rather, the array is randomized and then for each picture an index
selects one element (sequentially). Because the array was randomized,
this ensures that the main pictures are presented in random order
AND that each picture is only presented one time in the experiment.
There is probably a more elegant way of doing this, but oh well.
*/

  var practice_pictures = [
    { stimulus: 'SymBitmaps/pracsymm14.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/pracsymm8.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/pracsymm9.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/pracsymm5.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/pracsymm10.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/pracsymm15.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/pracsymm3.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/pracsymm1.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/pracsymm12.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/pracsymm7.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/pracsymm6.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/pracsymm4.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/pracsymm13.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/pracsymm11.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/pracsymm2.bmp', asymmetric: 0 },
  ]

  var main_pictures = [
    { stimulus: 'SymBitmaps/symm1.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm2.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm3.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm4.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm5.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm6.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm7.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm8.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm9.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm10.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm11.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm12.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm13.bmp', asymmetric: 0 },
    { stimulus: 'SymBitmaps/symm14.bmp', asymmetric: 0 }, // { stimulus: 'SymBitmaps/symm15.bmp', asymmetric: 0}, { stimulus: 'SymBitmaps/symm16.bmp', asymmetric: 0},
    // { stimulus: 'SymBitmaps/symm17.bmp', asymmetric: 0}, { stimulus: 'SymBitmaps/symm18.bmp', asymmetric: 0}, { stimulus: 'SymBitmaps/symm19.bmp', asymmetric: 0}, { stimulus: 'SymBitmaps/symm20.bmp', asymmetric: 0},
    // { stimulus: 'SymBitmaps/symm21.bmp', asymmetric: 0}, { stimulus: 'SymBitmaps/symm22.bmp', asymmetric: 0}, { stimulus: 'SymBitmaps/symm23.bmp', asymmetric: 0}, { stimulus: 'SymBitmaps/symm24.bmp', asymmetric: 0},
    { stimulus: 'SymBitmaps/symm25.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm26.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm27.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm28.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm29.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm30.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm31.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm32.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm33.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm34.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm35.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm36.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm37.bmp', asymmetric: 1 },
    { stimulus: 'SymBitmaps/symm38.bmp', asymmetric: 1 }, //, { stimulus: 'SymBitmaps/symm39.bmp', asymmetric: 1}, { stimulus: 'SymBitmaps/symm40.bmp', asymmetric: 1},
    // { stimulus: 'SymBitmaps/symm41.bmp', asymmetric: 1}, { stimulus: 'SymBitmaps/symm42.bmp', asymmetric: 1}, { stimulus: 'SymBitmaps/symm43.bmp', asymmetric: 1}, { stimulus: 'SymBitmaps/symm44.bmp', asymmetric: 1},
    // { stimulus: 'SymBitmaps/symm45.bmp', asymmetric: 1}, { stimulus: 'SymBitmaps/symm46.bmp', asymmetric: 1}, { stimulus: 'SymBitmaps/symm47.bmp', asymmetric: 1}, { stimulus: 'SymBitmaps/symm48.bmp', asymmetric: 1}
  ]

  //Now we will randomize the main timeline variables. We will then sequentially go through the (randomized) list in the main task
  main_pictures = jsPsych.randomization.repeat(main_pictures, 1)

  //////////////////
  //SET-UP SCREENS//
  //////////////////
  /*
These screens are just 1000ms fixation screens before each trial run.
They should help orient participants' attention to the center of the screen,
where the first picture of a trial will appear (or square in the case of
square-only practice). However, they serve the purpose of selecting the
appropriate length of square strings (with no square repeats)
*/
  var set_up_2 = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    choices: 'NO_KEYS',
    stimulus: '<p style="font-size:75px;">...</p>',
    on_finish: function (data) {
      correctSEQ = getSample(squarePos, 2) //select two random letters
      numIndex = 0 //reset the numIndex
      currRun = 0 //reset debugger
    },
  }

  var set_up_3 = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    choices: 'NO_KEYS',
    stimulus: '<p style="font-size:75px;">...</p>',
    on_finish: function (data) {
      correctSEQ = getSample(squarePos, 3) //select six random square positions
      numIndex = 0 //reset the numIndex
      currRun = 0 //reset debugger
    },
  }

  var set_up_4 = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    choices: 'NO_KEYS',
    stimulus: '<p style="font-size:75px;">...</p>',
    on_finish: function (data) {
      correctSEQ = getSample(squarePos, 4) //select six random square positions
      numIndex = 0 //reset the numIndex
      currRun = 0 //reset debugger
    },
  }

  var set_up_5 = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    choices: 'NO_KEYS',
    stimulus: '<p style="font-size:75px;">...</p>',
    on_finish: function (data) {
      correctSEQ = getSample(squarePos, 5) //select six random square positions
      numIndex = 0 //reset the numIndex
      currRun = 0 //reset debugger
    },
  }

  var set_up_6 = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    choices: 'NO_KEYS',
    stimulus: '<p style="font-size:75px;">...</p>',
    on_finish: function (data) {
      correctSEQ = getSample(squarePos, 6) //select six random square positions
      numIndex = 0 //reset the numIndex
      currRun = 0 //reset debugger
    },
  }

  var set_up_7 = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    choices: 'NO_KEYS',
    stimulus: '<p style="font-size:75px;">...</p>',
    on_finish: function (data) {
      correctSEQ = getSample(squarePos, 7) //select seven random square positions
      numIndex = 0 //reset the numIndex
      currRun = 0 //reset debugger
    },
  }

  ///////////////////////
  //square PRESENTATION//
  ///////////////////////
  /*
This screen displays each to-be-remembered square to participants.
The number of squarePos displayed ranges from 3 to 7 depending on
the trial. 'numIndex' increases on the finish so that the next square
presentation will be different (and non-repeating)
*/

  // Draw square
  function drawGrid(pos) {
    var grid = '<div>'
    for (var i = 1; i <= 16; i++) {
      if (i == pos) {
        switch (i) {
          case 4:
          case 8:
          case 12:
          case 16:
            grid =
              grid +
              '<button id = button_' +
              i +
              ' class = "num-button_sspan" style = "background-color: red; color: red">*</button><br>'
            break
          default:
            grid =
              grid +
              '<button id = button_' +
              i +
              ' class = "num-button_sspan" style = "background-color: red; color: red">*</button>'
            break
        }
      }

      if (i != pos) {
        switch (i) {
          case 4:
          case 8:
          case 12:
          case 16:
            grid =
              grid +
              '<button id = button_' +
              i +
              ' class = "num-button_sspan">*</button><br>'
            break
          default:
            grid =
              grid +
              '<button id = button_' +
              i +
              ' class = "num-button_sspan">*</button>'
            break
        }
      }
    }

    grid = grid + '</div>'

    return grid
  }

  var square_presentation = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 650, // Literally from Unsworth et al. (2009); Note that stimulus duration here is different from letters in Ospan & Rspan (1000 ms)
    post_trial_gap: 500, // No description of ISI in James et al. or Unsworth et al. (2005; 2009) but keeping it so that there is a break before the picture is presented
    choices: 'NO_KEYS',
    stimulus: function () {
      currentLetter = correctSEQ[numIndex]
      return drawGrid(currentLetter)
    },
    data: { squareSeen: currentLetter },
    on_finish: function () {
      numIndex += 1
      currRun += 1 //for debugging purposes
    },
  }

  /////////////////////////
  //PICTURE PRESENTATION//
  /////////////////////////
  /*
These screens display the to-be-judged picture to participants.
For each picture, participants must determine whether it makes
sense. During practice, these judgments are untimed and the
pictures are drawn SEQUENTIALLY from the practice list ('practice_pictures').
During the main task, pictures are drawn from the RANDOMIZED main
list ('pictureRandom') AND each picture is shown for the average amount
of time that participants took to read the practice pictures. This RT value
is stored in the array 'calibRT'
*/

  var pictureRESP //button pressed to indicate whether the picture made sense
  var pictureCRESP //whether the picture indeed makes sense (yes/no)
  var picPracticeCorrect = 0 //running tally of correctly answered practice pictures
  var picturetimeout = 0 //running tally of pictures in which a timeout is recorded (reading error)
  var PictureACC = [] //this is the array that will carry the official tally of picture accuracy for the main task
  var pictureIndex = 0 //index for current picture in the main task
  var practiceACC = [] //this is the array that will carry the official tally of picture accuracy for the square+picture practice task
  var practiceIndex = 0 //index for current picture in the practice task

  //PICTURE-ONLY PRACTICE SCREENS
  var picture_presentation_practice = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    post_trial_gap: 250,
    choices: [
      function () {
        return (
          '<img src="' +
          practice_pictures[calibRTindex].stimulus +
          '" style = "width: 1200px; height: 840px;">'
        )
      },
    ],
    button_html: '<button class="fullscreenStyle">%choice%</button>',
    on_finish: function (data) {
      jsPsych.data.addDataToLastTrial({
        designation: 'PRACTICE',
        picture: practice_pictures[calibRTindex].stimulus,
        pictureCRESP: practice_pictures[calibRTindex].asymmetric,
      })

      calibRT[calibRTindex] = data.rt
      // console.log(calibRT[calibRTindex]); // Added for diagnosing that response deadline is correctly calculated at mean + 2.5 SD; uncomment when debugging
      calibRTindex += 1
    },
  }

  var picture_judgment_practice = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size: 30px; font-family: Arial;'> Is this symmetrical? </p>",
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      pictureRESP = data.response
      pictureCRESP = jsPsych.data.get().last(2).values()[0].pictureCRESP
      console.log(pictureRESP, pictureCRESP)
      if (pictureRESP == pictureCRESP) {
        data.correct = 1
        picPracticeCorrect += 1
      } else {
        data.correct = 0
      }
    },
  }

  var picture_judgment_feedback = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 750,
    post_trial_gap: 250,
    stimulus: function () {
      var last_picture_correct = jsPsych.data.get().last(1).values()[0].correct
      if (last_picture_correct) {
        return '<p style="color:green; font-size: 35px">Correct</p>'
      } else {
        return '<p style="color:red; font-size: 35px">Incorrect</p>'
      }
    },
  }

  var overall_practice_feedback = {
    type: jsPsychHtmlButtonResponse,
    post_trial_gap: 250,
    stimulus: function () {
      if (picPracticeCorrect > 12) {
        return (
          '<p style="font-size: 25px;">You responded correctly on ' +
          picPracticeCorrect +
          ' of ' +
          calibRTindex +
          ' pictures. Good job!</p>'
        )
      } else {
        return (
          '<p style="font-size: 25px;">You only responded correctly on ' +
          picPracticeCorrect +
          ' of ' +
          calibRTindex +
          ' pictures.</p><p style="font-size: 20px;"><b>In the main task, you must try harder to answer accurately.</b></p>'
        )
      }
    },
    choices: ['CONTINUE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  //square+PICTURE PRACTICE SCREENS
  var picture_judgment_practice_combined = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size: 30px; font-family: Arial;'> Is this symmetrical? </p>",
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      pictureCRESP = jsPsych.data.get().last(2).values()[0].pictureCRESP
      pictureRESP = data.response
      if (pictureRESP == pictureCRESP) {
        data.correct = 1
        practiceACC[practiceIndex] = 1
      } else {
        data.correct = 0
        practiceACC[practiceIndex] = 0
      }
      practiceIndex += 1
    },
  }

  var if_timeout_practice = {
    timeline: [picture_judgment_practice_combined],
    conditional_function: function () {
      var data = jsPsych.data.get().last(1).values()[0]
      if (data.rt == null) {
        return false
      } else {
        return true
      }
    },
  }

  /////////////////
  //MAIN SCREENS //
  /////////////////

  var picture_presentation_main = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    post_trial_gap: 250,
    choices: [
      function () {
        return (
          '<img src="' +
          main_pictures[mainSelectionIndex].stimulus +
          '" style = "width: 1200px; height: 840px;">'
        )
      },
    ],
    button_html: '<button class="fullscreenStyle">%choice%</button>',
    trial_duration: function () {
      if (useDynamicRT == false) {
        return 10000
      } else {
        return Math.round(arrAvg(calibRT) + 2.5 * arrSD(calibRT))
      }
    }, //10-second timeout window OR mean RT from practice, depending on 'useDynamicRT' (mean RT + 2.5SD)
    on_finish: function (data) {
      var currentRT = data.rt
      jsPsych.data.addDataToLastTrial({
        designation: 'MAIN',
        picture: main_pictures[mainSelectionIndex].stimulus,
        pictureCRESP: main_pictures[mainSelectionIndex].asymmetric,
      })
      mainSelectionIndex += 1
      if (currentRT == null) {
        picturetimeout += 1
        PictureACC[pictureIndex] = 0
        practiceACC[practiceIndex] = 0
        pictureIndex += 1
        practiceIndex += 1
      }
    },
  }

  var picture_judgment_main = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size: 30px; font-family: Arial;'> Is this symmetrical? </p>",
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      pictureRESP = data.response
      pictureCRESP = jsPsych.data.get().last(2).values()[0].pictureCRESP
      if (pictureRESP == pictureCRESP) {
        data.correct = 1
        PictureACC[pictureIndex] = 1
      } else {
        data.correct = 0
        PictureACC[pictureIndex] = 0
      }
      pictureIndex += 1
    },
  }

  var if_timeout_node = {
    timeline: [picture_judgment_main],
    conditional_function: function () {
      var data = jsPsych.data.get().last(1).values()[0]
      if (data.rt == null) {
        return false
      } else {
        return true
      }
    },
  }

  ////////////////////////////
  ///// RESPONSE SCREENS /////
  ////////////////////////////

  /*
These response screens will show 'n' response boxes (corresponding
to the number of squares participants saw). Participants will then
be asked to type in the squares IN ORDER. If a particular square
is not remembered, they are instructued to leave this box blank.
*/

  var response = [] //this is the array we will use to store square strings
  var response_index = 0 // Numeric indicator of which position the box was clicked on
  var skip_index = [] // Numeric indicator of which positions were skipped
  var trialCorrect = [] //for storing which squares were correct

  //function to push button responses to array
  window.recordClick_sspan = function (elm, squarepos) {
    if (!response.includes(squarepos)) {
      var button_id = 'button_' + squarepos
      response_index++
      $(elm).animate().css({
        backgroundColor: 'red',
        color: 'white',
      })
      response.push(squarepos) //push the square position to the array
      document.getElementById(button_id).innerHTML = response_index
      // console.log(button_id) // Here to debug
    }
  }

  //function to clear the response array
  window.clearResponse_sspan = function () {
    if ((response[response_index - 1] !== '_') & (response_index > 0)) {
      var button_tbc = 'button_' + response[response_index - 1]
      document.getElementById(button_tbc).innerHTML = '*'
      document.getElementById(button_tbc).style.backgroundColor = 'white'
    }

    if ((response[response_index - 1] === '_') & (response_index > 0)) {
      skip_index.pop()
      document.getElementById('echoed_txt').innerHTML = skip_index.join(' ')
    }

    response_index = response_index > 0 ? response_index - 1 : 0

    response.pop() //this will remove the most recent response

    console.log(response, response_index)
  }

  //function to clear the response array
  window.blankResponse_sspan = function () {
    response_index++
    skip_index.push(response_index)
    response.push('_') //push the blank to the array
    document.getElementById('echoed_txt').innerHTML = skip_index.join(' ')

    console.log(response, response_index)
  }

  //Adapted from the Experiment Factory Repository
  var response_grid =
    '<div class = numbox>' +
    '<p>Please recall the squares in the order they were presented. If you do not remember a particular square, use the SKIP button.<br><b>(When you are ready to lock in your answer, press ENTER or RETURN)</b></p><br><br>' +
    '<button id = button_1 class = "num-button_sspan" onclick = "recordClick_sspan(this, 1)">*</button>' +
    '<button id = button_2 class = " num-button_sspan" onclick = "recordClick_sspan(this, 2)">*</button>' +
    '<button id = button_3 class = " num-button_sspan" onclick = "recordClick_sspan(this, 3)">*</button>' +
    '<button id = button_4 class = " num-button_sspan" onclick = "recordClick_sspan(this, 4)">*</button><br>' +
    '<button id = button_5 class = " num-button_sspan" onclick = "recordClick_sspan(this, 5)">*</button>' +
    '<button id = button_6 class = " num-button_sspan" onclick = "recordClick_sspan(this, 6)">*</button>' +
    '<button id = button_7 class = " num-button_sspan" onclick = "recordClick_sspan(this, 7)">*</button>' +
    '<button id = button_8 class = " num-button_sspan" onclick = "recordClick_sspan(this, 8)">*</button><br>' +
    '<button id = button_9 class = " num-button_sspan" onclick = "recordClick_sspan(this, 9)">*</button>' +
    '<button id = button_10 class = " num-button_sspan" onclick = "recordClick_sspan(this, 10)">*</button>' +
    '<button id = button_11 class = " num-button_sspan" onclick = "recordClick_sspan(this, 11)">*</button>' +
    '<button id = button_12 class = " num-button_sspan" onclick = "recordClick_sspan(this, 12)">*</button><br>' +
    '<button id = button_13 class = " num-button_sspan" onclick = "recordClick_sspan(this, 13)">*</button>' +
    '<button id = button_14 class = " num-button_sspan" onclick = "recordClick_sspan(this, 14)">*</button>' +
    '<button id = button_15 class = " num-button_sspan" onclick = "recordClick_sspan(this, 15)">*</button>' +
    '<button id = button_16 class = " num-button_sspan" onclick = "recordClick_sspan(this, 16)">*</button><br>' +
    '<br><br><br>' +
    '<button class = clear_button id = "ClearButton" onclick = "clearResponse_sspan()">BACKSPACE</button>' +
    '<button class = blank_button id = "BlankButton" onclick = "blankResponse_sspan()">SKIP</button>' +
    '<p><u><b>Skipped:</b></u></p><br><div id=echoed_txt style="font-size: 32px; font-family:Arial; font-weight:bold;"><b></b></div></div>'

  //UPDATED RECALL SCREEN
  var sspan_recall = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: response_grid,
    choices: ['Enter'],
    on_start: function () {
      response = [] //this is the array we will use to store square strings
      response_index = 0 // Numeric indicator of which position the box was clicked on
      skip_index = [] // Numeric indicator of which positions were skipped
      trialCorrect = [] //for storing which squares were correct
    },
    on_finish: function (data) {
      var feedbackarray = []
      for (i = 0; i < correctSEQ.length; i++) {
        if (correctSEQ[i] == response[i]) {
          if (practice == false) {
            SSPAN_TOTAL += 1
          } //add to sspan total if not practice
          trialCorrect[i] = 1
        } else {
          trialCorrect[i] = 0
        }
      }
      var tallyCorrect = arrSum(trialCorrect) //sum of correct responses (for feedback)
      if (arrAvg(trialCorrect) == 1) {
        fullCorrect = 1
        if (practice == false) {
          SSPAN_ABS += correctSEQ.length //if main task, add to absolute score
        }
      }
      var data_resp = JSON.stringify(response) //stringify response for data output
      var data_cresp = JSON.stringify(correctSEQ) //stringify correct answer for data output
      var spanlength = correctSEQ.length //how long the sequence was

      if (practice == false) {
        if (currRun < spanlength) {
          var debug = 'PROBLEM'
        } else {
          var debug = 'NO PROBLEM'
        }
      }

      if (practice == true) {
        var responseData = {
          designation: 'PRACTICE',
          SSPAN_TOTAL: 'NA',
          SSPAN_ABS: 'NA',
          LENGTH: spanlength,
          actualRESP: data_resp,
          correctRESP: data_cresp,
          fullCorrect: fullCorrect,
          numCorrect: tallyCorrect,
          feedback: feedbackarray,
          debug: debug,
        }
      } else {
        var responseData = {
          designation: 'MAIN',
          SSPAN_TOTAL: SSPAN_TOTAL,
          SSPAN_ABS: SSPAN_ABS,
          LENGTH: spanlength,
          actualRESP: data_resp,
          correctRESP: data_cresp,
          fullCorrect: fullCorrect,
          numCorrect: tallyCorrect,
          feedback: feedbackarray,
          debug: debug,
        }
      }
      jsPsych.data.addDataToLastTrial(responseData)
    },
  }

  /////////////////////////////
  ////// FEEDBACK SCREEN //////
  /////////////////////////////
  function drawCorrectGrid() {
    var grid = '<div>'
    for (var i = 1; i <= 16; i++) {
      if (!correctSEQ.includes(i)) {
        switch (i) {
          case 4:
          case 8:
          case 12:
          case 16:
            grid =
              grid +
              '<button id = button_' +
              i +
              ' class = "num-button_sspan">*</button><br>'
            break
          default:
            grid =
              grid +
              '<button id = button_' +
              i +
              ' class = "num-button_sspan">*</button>'
            break
        }
      } else {
        var csi = correctSEQ.indexOf(i)
        if (correctSEQ[csi] == response[csi]) {
          switch (i) {
            case 4:
            case 8:
            case 12:
            case 16:
              grid =
                grid +
                '<button id = button_' +
                i +
                ' class = "num-button_sspan" style = "background-color: red;">' +
                (correctSEQ.indexOf(i) + 1) +
                '</button><br>'
              break
            default:
              grid =
                grid +
                '<button id = button_' +
                i +
                ' class = "num-button_sspan" style = "background-color: red;">' +
                (correctSEQ.indexOf(i) + 1) +
                '</button>'
              break
          }
        } else {
          switch (i) {
            case 4:
            case 8:
            case 12:
            case 16:
              grid =
                grid +
                '<button id = button_' +
                i +
                ' class = "num-button_sspan" style = "background-color: black;">' +
                (correctSEQ.indexOf(i) + 1) +
                '</button><br>'
              break
            default:
              grid =
                grid +
                '<button id = button_' +
                i +
                ' class = "num-button_sspan" style = "background-color: black;">' +
                (correctSEQ.indexOf(i) + 1) +
                '</button>'
              break
          }
        }
      }
    }

    console.log(correctSEQ, response)

    grid = grid + '</div>'

    return grid
  }

  var feedback_screen = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      //dynamic feedback for picture accuracy portion
      if (showPattACC == true) {
        if (practice == false) {
          var currentACC = Math.round(arrAvg(PictureACC) * 100)
        } else {
          var currentACC = Math.round(arrAvg(practiceACC) * 100)
        }
        if (currentACC > 84) {
          var sentFont = 'green'
        } else {
          var sentFont = 'red'
        } //assign colored font based on 85% accuracy threshold
        currentACC = currentACC.toString()
        currentACC = currentACC + '%'
        var pictureTicker =
          '<p class = "senFB" id="senFB">Symmetry:</br>' +
          currentACC.fontcolor(sentFont) +
          '</p>'
      } else {
        var pictureTicker = ''
      }
      var getFeedback = jsPsych.data.get().last(1).values()[0].feedback
      // var feedbackText = getFeedback.join(" ");
      var pageText =
        '<p>' +
        drawCorrectGrid() +
        '</p>' +
        pictureTicker +
        '<p style="font-size:28px"> You correctly identified ' +
        jsPsych.data.get().last(1).values()[0].numCorrect +
        ' of  ' +
        jsPsych.data.get().last(1).values()[0].LENGTH +
        ' squares.</p>'

      return [pageText]
    },
    choices: ['Continue'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      response = [] //clear the response for the next trial
      trialCorrect = [] //clear correct answer array for next trial
    },
  }

  /////////////////////////////////
  //// DEFINE THE FINAL BLOCKS ////
  /////////////////////////////////

  ///////////////////////
  //1. square PRACTICE //
  ///////////////////////

  var square_instructions = {
    timeline: [sspan_instruct_1, sspan_instruct_2],
  }

  var practice_twosquare_trial = {
    timeline: [
      set_up_2,
      square_presentation,
      square_presentation,
      sspan_recall,
      feedback_screen,
    ],
  }

  var practice_threesquare_trial = {
    timeline: [
      set_up_3,
      square_presentation,
      square_presentation,
      square_presentation,
      sspan_recall,
      feedback_screen,
    ],
  }

  //final square practice proc
  var square_practice_final = {
    timeline: [
      square_instructions,
      practice_twosquare_trial,
      practice_twosquare_trial,
    ],
  }

  /////////////////////////
  //2. PICTURE PRACTICE //
  /////////////////////////

  var picture_instructions = {
    timeline: [
      sspan_instruct_3,
      sspan_instruct_4,
      sspan_instruct_5,
      sspan_instruct_6,
      sspan_instruct_7,
    ],
  }

  var picture_practice = {
    timeline: [
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
      picture_presentation_practice,
      picture_judgment_practice,
      picture_judgment_feedback,
    ],
  }

  //final picture practice proc
  var picture_practice_final = {
    timeline: [
      picture_instructions,
      picture_practice,
      overall_practice_feedback,
    ],
  }

  ////////////////////////////////
  //3. square+PICTURE PRACTICE //
  ////////////////////////////////

  var squarepicture_instructions = {
    timeline: [sspan_instruct_8, sspan_instruct_9],
  }

  var squarepicture_practice = {
    timeline: [
      picture_presentation_main,
      if_timeout_practice,
      square_presentation,
      picture_presentation_main,
      if_timeout_practice,
      square_presentation,
    ],
  }

  var squarepicture_practice_feedback = {
    timeline: [sspan_recall, feedback_screen],
  }

  var squarepractice_run = {
    timeline: [
      set_up_2,
      squarepicture_practice,
      squarepicture_practice_feedback,
    ],
  }

  //final combined practice proc
  var squarepicture_practice_final = {
    timeline: [
      squarepicture_instructions,
      squarepractice_run,
      squarepractice_run,
      sspan_instruct_10,
    ],
  }

  ///////////////////////
  //4. MAIN ASSESSMENT //
  ///////////////////////

  var sspan_3_core = {
    timeline: [
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
    ],
  }

  var sspan_4_core = {
    timeline: [
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
    ],
  }

  var sspan_5_core = {
    timeline: [
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
    ],
  }

  var sspan_6_core = {
    timeline: [
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
    ],
  }

  var sspan_7_core = {
    timeline: [
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
      picture_presentation_main,
      if_timeout_node,
      square_presentation,
    ],
  }

  //final procedures
  var final_sspan3_run = {
    timeline: [set_up_3, sspan_3_core, sspan_recall, feedback_screen],
  }

  var final_sspan4_run = {
    timeline: [set_up_4, sspan_4_core, sspan_recall, feedback_screen],
  }

  var final_sspan5_run = {
    timeline: [set_up_5, sspan_5_core, sspan_recall, feedback_screen],
  }

  var final_sspan6_run = {
    timeline: [set_up_6, sspan_6_core, sspan_recall, feedback_screen],
  }

  var final_sspan7_run = {
    timeline: [set_up_7, sspan_7_core, sspan_recall, feedback_screen],
  }

  // Critical changes to shorten based on Oswald et al. (2015):
  //      1. Only have set sizes 3-5 (remove shortest and largest set sizes)
  //      2. 2 blocks per set size

  var final_combined_runs = {
    timeline: jsPsych.randomization.repeat(
      [
        final_sspan3_run, // final_sspan3_run, final_sspan3_run,
        final_sspan4_run, // final_sspan4_run, final_sspan4_run,
        final_sspan5_run, //, final_sspan5_run, final_sspan5_run,
        // final_sspan6_run, final_sspan6_run, final_sspan6_run,
        // final_sspan7_run, final_sspan7_run, final_sspan7_run
      ],
      1
    ),
  }

  ////////////////
  // 5. WRAP-UP //
  ////////////////

  var sspan_done = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🧠 Mission TotemTrace Complete!</b></h1>' +
      "<p style='font-size:25px'>Well done, cadet. Let’s review your performance.</p>",
    choices: ['CONTINUE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      var finalPictureACC = Math.round(arrAvg(PictureACC) * 100) //picture accuracy
      var pictureCutoff = Math.round(arrAvg(calibRT) + 2.5 * arrSD(calibRT))
      var summaryData = {
        designation: 'SUMMARY',
        SSPAN_TOTAL: SSPAN_TOTAL,
        SSPAN_ABS: SSPAN_ABS,
        PIC_ACC: finalPictureACC,
        PIC_RT: pictureCutoff,
      }
      jsPsych.data.addDataToLastTrial(summaryData)
    },
  }

  var sspan_summary = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      return (
        '<h1><b>📈 Mission Summary</b></h1>' +
        "<p style='font-size:25px'><b>TOTAL Score:</b> Total number of square positions remembered.</p>" +
        "<p style='font-size:25px'><b>ABSOLUTE Score:</b> Number of squares remembered <b>only</b> on fully correct trials.</p>" +
        "<p style='font-size:25px'><br>Your <b>TOTAL</b> score: " +
        SSPAN_TOTAL +
        '</p>' +
        "<p style='font-size:25px'>Your <b>ABSOLUTE</b> score: " +
        SSPAN_ABS +
        '</p>' +
        "<p style='font-size:25px'>Please report your <b>TOTAL</b> score to the mission commander.</p>"
      )
    },
    choices: ['OK'],
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  // final trial to bring user to the next game
  var nextGame = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<p style="font-size:25px">🚀 Preparing for your next challenge...</p>' +
      '<p style="font-size:25px">Click NEXT when you’re ready to move on to your next task!</p>',
    choices: ['NEXT'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      document.getElementById('experiment-container').innerHTML = ''
      document.getElementById('experiment-container').style.display = 'none'
    },
  }

  //main sspan task
  var sspan_final = {
    timeline: [
      preload,
      sspan_welcome,
      square_practice_final,
      picture_practice_final,
      squarepicture_practice_final,
      final_combined_runs,
      final_combined_runs,
      sspan_done,
      sspan_summary,
    ],
  }

  timeline.push(sspan_final)

  if (game_counts > 0) {
    timeline.push(nextGame)
  }

  jsPsych.run(timeline)
}
