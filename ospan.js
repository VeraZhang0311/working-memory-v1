function startOspanGame(participantID, onGameEnd) {
  const jsPsych = initJsPsych({
    display_element: 'experiment-container',
    on_finish: function () {
      const filename = `data_ospan_${participantID}.csv`
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

  jsPsych.randomization.setSeed('operationspan')
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
  const makeRepeated = (arr, repeats) =>
    [].concat(...Array.from({ length: repeats }, () => arr)) //constant to repeat elements in array
  var OSPAN_TOTAL = 0 //variable for tracking the OSPAN TOTAL score
  var OSPAN_ABS = 0 //variable for tracking the OSPAN ABSOLUTE score
  var fullCorrect //to determine whether the entire trial was correct (for ABS score)
  var mainSelectionIndex = 0 //variable for selecting equations from the main list
  var currentLetter //current letter to be presented to participants
  var correctSEQ = [] //array for storing the correct letter sequence to be recalled
  var designation //designation (for use in tagging different events in the data output)
  var useDynamicRT = true //when false, standard timeout window of 10 seconds for reading the equation; when true, mean RT from practice is used
  var calibRT = [] //array for storing RTs for practice equations (to set timeout window for main task)
  var calibRTindex = 0 //variable for indexing equation number during the equation-only practice (for calculating mean RT)
  var letters = ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y'] //possible letters to be recalled
  var practice //for dynamic data
  var showEqnACC //for displaying equation accuracy on feedback
  var currRun //for debugging/making sure the correct number of letters are shown
  var online = 0 // Numeric: 0 indicating that task is being run locally, 1 indicating that the task is being run through a platform

  //function to randomly select 'n' letters from the array without replacement
  function getSample(letterList, n) {
    return jsPsych.randomization.sampleWithoutReplacement(letterList, n)
  }
  ////////////////
  //INSTRUCTIONS//
  ////////////////

  //Letter Instructions
  var ospan_instruct_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>⛽ Fuel Equation & Memory Task</b></h1>' +
      "<p style='font-size:25px'>Cadet, to launch the ship, </p>" +
      "<p style='font-size:25px'>you'll solve quick fuel equations while memorizing secret launch codes.</p>" +
      "<p style='font-size:25px'>You’ll start with a warm-up round focused just on launch codes.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      practice = true
      showEqnACC = false
      let experimentContainer = document.getElementById('experiment-container')
      if (experimentContainer) {
        console.log('experiment-container found!')
      } else {
        console.warn('experiment-container not found!')
      }
    }, //switching practice to true for dynamic data, switching equation feedback to false
  }

  var ospan_instruct_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'>Letters will flash on the screen one at a time.</p>" +
      "<p style='font-size:25px'>Remember them in the exact order you see them.</p>" +
      "<p style='font-size:25px'>After two letters, you’ll be asked to recall them in order. You can leave blanks if needed.</p>" +
      "<p style='font-size:25px'>Accuracy and order matter for launch codes.</p>" +
      "<p style='font-size:25px'>Ready to train your memory?</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  // var ospan_instruct_3 = {
  //   type: jsPsychHtmlButtonResponse,
  //   stimulus:
  //     "<p style='font-size:25px'>Remember, it is very important to get the letters in the same order as you see them.</p>" +
  //     "<p style='font-size:25px'>When you're ready, you may begin the letter practice.</p>",
  //   choices: ['BEGIN PRACTICE'],
  //   post_trial_gap: 250,
  //   button_html: '<button class="buttonStyle">%choice%</button>',
  // }

  //Equation Instructions
  var ospan_instruct_4 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🧮 Fuel Calculation Practice</b></h1>' +
      "<p style='font-size:25px'>Now let’s calibrate your reactor by solving quick fuel equations.</p>" +
      "<p style='font-size:25px'>You’ll see a math problem like:</p>" +
      "<p style='font-size: 45px;'><b>(4 × 2) − 1 = ?</b></p>" +
      "<p style='font-size:25px'>Solve it in your head, then click anywhere to continue.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var ospan_instruct_5 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'>You’ll then see a number, like:</p>" +
      "<p style='font-size:45px;'><b>7</b></p>" +
      "<p style='font-size:25px'>Click <b>TRUE</b> if it matches your answer, or <b>FALSE</b> if it doesn’t.</p>" +
      "<p style='font-size:25px'>You’ll get feedback after each one -- just like a reactor check.</p>" +
      "<p style='font-size:25px'>Make sure your fuel calculations are fast and accurate.</p>" +
      "<p style='font-size:25px'>When you’re ready, begin your practice!</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  // var ospan_instruct_6 = {
  //   type: jsPsychHtmlButtonResponse,
  //   stimulus:
  //     "<p style='font-size:25px'>It is VERY important that you answer the math problems correctly.</p>" +
  //     "<p style='font-size:25px'>It is also important that you try and solve the problems as quickly as you can.</p>" +
  //     "<p style='font-size:25px'>When you are ready, click on the button below to try some practice problems.</p>",
  //   choices: ['BEGIN PRACTICE'],
  //   post_trial_gap: 250,
  //   button_html: '<button class="buttonStyle">%choice%</button>',
  // }

  //Combined Instructions
  var ospan_instruct_7 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🚀 Dual Task Simulation</b></h1>' +
      "<p style='font-size:25px'>Now you’ll do both: solve a fuel equation, then memorize a launch code letter.</p>" +
      "<p style='font-size:25px'>This will repeat -- equation, letter, equation, letter...</p>" +
      "<p style='font-size:25px'>Once the sequence ends, recall the letters in order.</p>" +
      "<p style='font-size:25px'>⚠️ If you take too long on a fuel equation, the system will skip ahead and count it as a mistake.</p>" +
      "<p style='font-size:25px'>So stay focused, solve fast, and memorize carefully!</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  // var ospan_instruct_8 = {
  //   type: jsPsychHtmlButtonResponse,
  //   stimulus:
  //     "<p style='font-size:25px'>After the letter goes away, another math problem will appear, and then another letter.</p>" +
  //     "<p style='font-size:25px'>At the end of each set of letters and math problems, you will recall the letters to the best of your ability.</br>Remember, try your best to get the letters in the correct order.</p>" +
  //     "<p style='font-size:25px'>It is important to work QUICKLY and ACCURATELY on the problems.</br>Make sure you've correctly solved the math problem before clicking the mouse to advance to the next screen.</p>" +
  //     "<p style='font-size:25px'> After the letter recall screen, you will be given feedback about your performance regarding the number of letters you correctly recalled.</p>",
  //   choices: ['CONTINUE'],
  //   post_trial_gap: 250,
  //   button_html: '<button class="buttonStyle">%choice%</button>',
  // }

  var ospan_instruct_9 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>📊 Accuracy Checkpoint</b></h1>' +
      "<p style='font-size:25px'>You’ll also see a math accuracy score at the top right.</p>" +
      "<p style='font-size:25px'>Keep it at or above <b>85%</b> to stay in mission-ready condition.</p>" +
      "<p style='font-size:25px'>Both solving and memory matter.</p>" +
      "<p style='font-size:25px'>Give it your best shot!</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      showEqnACC = true
    }, //switching to show equation accuracy for letter+equation practice
  }

  //Wrap-up / final screen before main task
  var ospan_instruct_10 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🎯 Main Mission Begins</b></h1>' +
      "<p style='font-size:25px'>Practice complete. Now the real mission begins!</p>" +
      "<p style='font-size:25px'>You’ll get a math problem, then a letter. Recall the letters in order at the end of each set.</p>" +
      "<p style='font-size:25px'>Use the <b>SKIP</b> button if you forget a letter.</p>" +
      "<p style='font-size:25px'>Some rounds will be longer than others -- stay sharp!</p>" +
      "<p style='font-size:25px'>💡 Remember: Solve problems quickly and aim for 85%+ accuracy.</p>" +
      "<p style='font-size:25px'><b>No outside help—your brain is the only onboard system allowed.</b></p>",

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
    equation and letter within and across trials), the 'main_equations'
    timline variable is not treated as a traditional timeline variable.
    Rather, the array is randomized and then for each equation an index
    selects one element (sequentially). Because the array was randomized,
    this ensures that the main equations are presented in random order
    AND that each equation is only presented one time in the experiment.
    There is probably a more elegant way of doing this, but oh well.
  */

  var practice_equations = [
    { stimulus: '(1 &#215; 5) &#8722; 3 = ?', probe: 2, nonsense: 0 },
    { stimulus: '(4 &#247; 2) &#43; 5 = ?', probe: 13, nonsense: 1 },
    { stimulus: '(5 &#215; 1) &#8722; 4 = ?', probe: 1, nonsense: 0 },
    { stimulus: '(6 &#247; 3) &#43; 9 = ?', probe: 11, nonsense: 0 },
    { stimulus: '(6 &#247; 2) &#43; 3 = ?', probe: 6, nonsense: 0 },
    { stimulus: '(5 &#215; 7) &#8722; 8 = ?', probe: 23, nonsense: 1 },
    { stimulus: '(8 &#215; 6) &#43; 3 = ?', probe: 51, nonsense: 0 },
    { stimulus: '(6 &#215; 6) &#8722; 1 = ?', probe: 27, nonsense: 1 },
    { stimulus: '(1 &#215; 3) &#43; 9 = ?', probe: 4, nonsense: 1 },
    { stimulus: '(8 &#247; 1) &#8722; 5 = ?', probe: 7, nonsense: 1 },
    { stimulus: '(3 &#215; 9) &#43; 4 = ?', probe: 22, nonsense: 1 },
    { stimulus: '(1 &#215; 2) &#43; 4 = ?', probe: 9, nonsense: 1 },
    { stimulus: '(7 &#247; 1) &#8722; 2 = ?', probe: 8, nonsense: 1 },
    { stimulus: '(6 &#215; 6) &#8722; 8 = ?', probe: 28, nonsense: 0 },
    { stimulus: '(4 &#215; 8) &#43; 6 = ?', probe: 38, nonsense: 0 },
  ]

  var main_equations = [
    { stimulus: '(4 &#215; 5) &#8722; 5 = ?', probe: 15, nonsense: 0 },
    { stimulus: '(9 &#215; 9) &#43; 5 = ?', probe: 79, nonsense: 1 },
    { stimulus: '(9 &#215; 5) &#8722; 8 = ?', probe: 46, nonsense: 1 },
    { stimulus: '(3 &#215; 8) &#8722; 4 = ?', probe: 20, nonsense: 0 },
    { stimulus: '(3 &#215; 7) &#43; 4 = ?', probe: 25, nonsense: 0 },
    { stimulus: '(9 &#215; 7) &#8722; 5 = ?', probe: 58, nonsense: 0 },
    { stimulus: '(6 &#215; 5) &#8722; 1 = ?', probe: 23, nonsense: 1 },
    { stimulus: '(7 &#215; 6) &#43; 4 = ?', probe: 42, nonsense: 1 },
    { stimulus: '(6 &#247; 1) &#43; 7 = ?', probe: 13, nonsense: 0 },
    { stimulus: '(6 &#215; 4) &#43; 9 = ?', probe: 27, nonsense: 1 },
    { stimulus: '(4 &#215; 8) &#8722; 7 = ?', probe: 30, nonsense: 1 },
    { stimulus: '(4 &#247; 4) &#43; 4 = ?', probe: 9, nonsense: 1 },
    { stimulus: '(4 &#215; 6) &#43; 7 = ?', probe: 31, nonsense: 0 },
    { stimulus: '(6 &#247; 1) &#43; 6 = ?', probe: 20, nonsense: 1 },
    { stimulus: '(5 &#215; 8) &#8722; 1 = ?', probe: 39, nonsense: 0 },
    { stimulus: '(1 &#215; 9) &#43; 6 = ?', probe: 6, nonsense: 1 },
    { stimulus: '(9 &#215; 9) &#8722; 4 = ?', probe: 77, nonsense: 0 },
    { stimulus: '(3 &#247; 3) &#43; 5 = ?', probe: 3, nonsense: 1 },
    { stimulus: '(5 &#215; 3) &#8722; 1 = ?', probe: 15, nonsense: 1 },
    { stimulus: '(4 &#215; 6) &#8722; 2 = ?', probe: 16, nonsense: 1 },
    { stimulus: '(9 &#215; 3) &#8722; 2 = ?', probe: 25, nonsense: 0 },
    { stimulus: '(7 &#247; 7) &#43; 1 = ?', probe: 2, nonsense: 0 },
    { stimulus: '(3 &#215; 5) &#43; 3 = ?', probe: 15, nonsense: 1 },
    { stimulus: '(2 &#215; 5) &#43; 7 = ?', probe: 24, nonsense: 1 },
    { stimulus: '(1 &#215; 8) &#43; 3 = ?', probe: 11, nonsense: 0 },
    { stimulus: '(1 &#247; 1) &#43; 4 = ?', probe: 5, nonsense: 0 },
    { stimulus: '(8 &#215; 8) &#43; 5 = ?', probe: 63, nonsense: 1 },
    { stimulus: '(4 &#215; 1) &#43; 9 = ?', probe: 13, nonsense: 0 },
    { stimulus: '(7 &#215; 3) &#8722; 8 = ?', probe: 16, nonsense: 1 },
    { stimulus: '(4 &#215; 9) &#43; 5 = ?', probe: 41, nonsense: 0 },
    { stimulus: '(2 &#215; 4) &#8722; 5 = ?', probe: 3, nonsense: 0 },
    { stimulus: '(7 &#215; 4) &#43; 1 = ?', probe: 26, nonsense: 1 },
    { stimulus: '(6 &#215; 2) &#43; 5 = ?', probe: 17, nonsense: 0 },
    { stimulus: '(8 &#215; 1) &#43; 8 = ?', probe: 16, nonsense: 0 }, //,
    // {stimulus: '(4 &#215; 3) &#8722; 9 = ?', probe: 8, nonsense: 1},
    // {stimulus: '(1 &#247; 1) &#43; 1 = ?', probe: 2, nonsense: 0},
    // {stimulus: '(6 &#215; 4) &#8722; 3 = ?', probe: 21, nonsense: 0},
    // {stimulus: '(4 &#247; 1) &#43; 5 = ?', probe: 9, nonsense: 0},
    // {stimulus: '(6 &#215; 5) &#43; 2 = ?', probe: 30, nonsense: 1},
    // {stimulus: '(2 &#215; 5) &#43; 3 = ?', probe: 13, nonsense: 0},
    // {stimulus: '(8 &#215; 3) &#43; 6 = ?', probe: 37, nonsense: 1},
    // {stimulus: '(9 &#247; 3) &#43; 9 = ?', probe: 12, nonsense: 0},
    // {stimulus: '(2 &#215; 8) &#8722; 5 = ?', probe: 8, nonsense: 1},
    // {stimulus: '(8 &#215; 7) &#8722; 9 = ?', probe: 47, nonsense: 0},
    // {stimulus: '(4 &#247; 2) &#8722; 1 = ?', probe: 4, nonsense: 1},
    // {stimulus: '(6 &#215; 5) &#43; 9 = ?', probe: 39, nonsense: 0},
    // {stimulus: '(9 &#215; 5) &#8722; 9 = ?', probe: 36, nonsense: 0},
    // {stimulus: '(7 &#215; 2) &#8722; 3 = ?', probe: 11, nonsense: 0},
    // {stimulus: '(8 &#215; 8) &#8722; 8 = ?', probe: 56, nonsense: 0},
    // {stimulus: '(2 &#215; 1) &#43; 4 = ?', probe: 1, nonsense: 1},
    // {stimulus: '(9 &#215; 3) &#43; 7 = ?', probe: 34, nonsense: 0},
    // {stimulus: '(7 &#215; 5) &#8722; 2 = ?', probe: 26, nonsense: 1},
    // {stimulus: '(7 &#247; 1) &#43; 5 = ?', probe: 17, nonsense: 1},
    // {stimulus: '(6 &#215; 7) &#43; 9 = ?', probe: 49, nonsense: 1},
    // {stimulus: '(3 &#215; 5) &#8722; 8 = ?', probe: 12, nonsense: 1},
    // {stimulus: '(4 &#215; 7) &#43; 6 = ?', probe: 34, nonsense: 0},
    // {stimulus: '(6 &#247; 2) &#8722; 1 = ?', probe: 10, nonsense: 1},
    // {stimulus: '(5 &#215; 8) &#43; 6 = ?', probe: 46, nonsense: 0},
    // {stimulus: '(3 &#215; 6) &#8722; 5 = ?', probe: 6, nonsense: 1},
    // {stimulus: '(5 &#215; 7) &#43; 4 = ?', probe: 37, nonsense: 1},
    // {stimulus: '(6 &#215; 9) &#8722; 2 = ?', probe: 53, nonsense: 1},
    // {stimulus: '(3 &#215; 8) &#8722; 2 = ?', probe: 14, nonsense: 1},
    // {stimulus: '(6 &#247; 2) &#43; 2 = ?', probe: 5, nonsense: 0},
    // {stimulus: '(9 &#247; 1) &#8722; 5 = ?', probe: 4, nonsense: 0},
    // {stimulus: '(4 &#215; 9) &#43; 8 = ?', probe: 38, nonsense: 1},
    // {stimulus: '(3 &#215; 3) &#8722; 7 = ?', probe: 4, nonsense: 1},
    // {stimulus: '(3 &#215; 8) &#43; 1 = ?', probe: 22, nonsense: 1},
    // {stimulus: '(2 &#247; 2) &#43; 7 = ?', probe: 8, nonsense: 0},
    // {stimulus: '(6 &#215; 3) &#8722; 3 = ?', probe: 15, nonsense: 0},
    // {stimulus: '(2 &#215; 8) &#8722; 8 = ?', probe: 8, nonsense: 0},
    // {stimulus: '(8 &#215; 5) &#43; 3 = ?', probe: 46, nonsense: 1},
    // {stimulus: '(6 &#247; 2) &#43; 5 = ?', probe: 11, nonsense: 1},
    // {stimulus: '(9 &#215; 6) &#8722; 8 = ?', probe: 38, nonsense: 1},
    // {stimulus: '(6 &#247; 6) &#43; 6 = ?', probe: 7, nonsense: 0},
    // {stimulus: '(2 &#215; 1) &#43; 7 = ?', probe: 9, nonsense: 0},
    // {stimulus: '(3 &#215; 5) &#8722; 4 = ?', probe: 9, nonsense: 1},
    // {stimulus: '(8 &#215; 9) &#8722; 2 = ?', probe: 78, nonsense: 1},
    // {stimulus: '(5 &#215; 6) &#8722; 7 = ?', probe: 23, nonsense: 0},
    // {stimulus: '(7 &#215; 6) &#43; 3 = ?', probe: 45, nonsense: 0},
    // {stimulus: '(3 &#215; 6) &#8722; 2 = ?', probe: 16, nonsense: 0},
    // {stimulus: '(5 &#215; 1) &#8722; 1 = ?', probe: 10, nonsense: 1}
  ]

  //Now we will randomize the main timeline variables. We will then sequentially go through the (randomized) list in the main task
  main_equations = jsPsych.randomization.repeat(main_equations, 1)

  //////////////////
  //SET-UP SCREENS//
  //////////////////
  /*
    These screens are just 1000ms fixation screens before each trial run.
    They should help orient participants' attention to the center of the screen,
    where the first equation of a trial will appear (or letter in the case of
    letter-only practice). However, they serve the purpose of selecting the
    appropriate length of letter strings (with no letter repeats)
  */
  var set_up_2 = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    choices: 'NO_KEYS',
    stimulus: '<p style="font-size:75px;">...</p>',
    on_finish: function (data) {
      correctSEQ = getSample(letters, 2) //select two random letters
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
      correctSEQ = []
      correctSEQ = getSample(letters, 3) //select three random letters
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
      correctSEQ = []
      correctSEQ = getSample(letters, 4) //select four random letters
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
      correctSEQ = []
      correctSEQ = getSample(letters, 5) //select five random letters
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
      correctSEQ = []
      correctSEQ = getSample(letters, 6) //select six random letters
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
      correctSEQ = []
      correctSEQ = getSample(letters, 7) //select seven random letters
      numIndex = 0 //reset the numIndex
      currRun = 0 //reset debugger
    },
  }

  ///////////////////////
  //LETTER PRESENTATION//
  ///////////////////////
  /*
    This screen displays each to-be-remembered letter to participants.
    The number of letters displayed ranges from 3 to 7 depending on
    the trial. 'numIndex' increases on the finish so that the next letter
    presentation will be different (and non-repeating)
  */

  var letter_presentation = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000, // Based on Unsworth et al. (2009); different from James et al. (2018) and Unsworth et al. (2005) but Unsworth et al. (2009) cited as first instance of automated reading span
    post_trial_gap: 500, // No description of ISI in James et al. or Unsworth et al. (2005; 2009) but keeping it so that there is a break before the sentence is presented
    choices: 'NO_KEYS',
    on_start: function () {
      currentLetter = correctSEQ[numIndex]
    },
    stimulus: function () {
      return (
        '<div style="font-size:75px; font-family: Arial; font-weight: bold;">' +
        correctSEQ[numIndex] +
        '</div>'
      )
    },
    data: { letterSeen: currentLetter },
    on_finish: function () {
      numIndex += 1
      currRun += 1 //for debugging purposes
    },
  }

  /////////////////////////
  //EQUATION PRESENTATION//
  /////////////////////////
  /*
    These screens display the to-be-judged equation to participants.
    For each equation, participants must determine whether it makes
    sense. During practice, these judgments are untimed and the
    equations are drawn SEQUENTIALLY from the practice list ('practice_equations').
    During the main task, equations are drawn from the RANDOMIZED main
    list ('equationRandom') AND each equation is shown for the average amount
    of time that participants took to read the practice equations. This RT value
    is stored in the array 'calibRT'
  */

  var equationRESP //button pressed to indicate whether the equation made sense
  var equationCRESP //whether the equation indeed makes sense (yes/no)
  var eqnPracticeCorrect = 0 //running tally of correctly answered practice equations
  var equationtimeout = 0 //running tally of equations in which a timeout is recorded (reading error)
  var equationACC = [] //this is the array that will carry the official tally of equation accuracy for the main task
  var equationIndex = 0 //index for current equation in the main task
  var practiceACC = [] //this is the array that will carry the official tally of equation accuracy for the letter+equation practice task
  var practiceIndex = 0 //index for current equation in the practice task

  //EQUATION-ONLY PRACTICE SCREENS
  var equation_presentation_practice = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    post_trial_gap: 250,
    choices: [
      function () {
        return (
          '<p style="font-size: 45px;">' +
          practice_equations[calibRTindex].stimulus +
          '</p><br><br><p style="font-size: 15px;">When you have solved this math problem,</br>click on the screen to continue.</p>'
        )
      },
    ],
    button_html: '<button class="fullscreenStyle">%choice%</button>',
    on_finish: function (data) {
      jsPsych.data.addDataToLastTrial({
        designation: 'PRACTICE',
        equation: practice_equations[calibRTindex].stimulus,
        equation_probe: practice_equations[calibRTindex].probe,
        equationCRESP: practice_equations[calibRTindex].nonsense,
      })

      calibRT[calibRTindex] = data.rt
      console.log(calibRT[calibRTindex]) // Added for diagnosing that response deadline is correctly calculated at mean + 2.5 SD; uncomment when debugging
      calibRTindex += 1
    },
  }

  var equation_judgment_practice = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      return (
        '<p style="font-size: 45px; font-family: Arial;">' +
        practice_equations[calibRTindex - 1].probe +
        '</p>'
      )
    },
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      equationRESP = data.response
      equationCRESP = jsPsych.data.get().last(2).values()[0].equationCRESP
      console.log(equationRESP, equationCRESP)
      if (equationRESP == equationCRESP) {
        data.correct = 1
        eqnPracticeCorrect += 1
      } else {
        data.correct = 0
      }
    },
  }

  var equation_judgment_feedback = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 750,
    post_trial_gap: 250,
    stimulus: function () {
      var last_equation_correct = jsPsych.data.get().last(1).values()[0].correct
      if (last_equation_correct) {
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
      if (eqnPracticeCorrect > 12) {
        return (
          '<p style="font-size: 25px;">You responded correctly on ' +
          eqnPracticeCorrect +
          ' of ' +
          calibRTindex +
          ' equations. Good job!</p>'
        )
      } else {
        return (
          '<p style="font-size: 25px;">You only responded correctly on ' +
          eqnPracticeCorrect +
          ' of ' +
          calibRTindex +
          ' equations.</p><p style="font-size: 20px;"><b>In the main task, you must try harder to answer accurately.</b></p>'
        )
      }
    },
    choices: ['CONTINUE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  //LETTER+EQUATION PRACTICE SCREENS
  var equation_judgment_practice_combined = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      return (
        '<p style="font-size: 45px;">' +
        main_equations[mainSelectionIndex - 1].probe +
        '</p>'
      )
    },
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      equationCRESP = jsPsych.data.get().last(2).values()[0].equationCRESP
      equationRESP = data.response
      if (equationRESP == equationCRESP) {
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
    timeline: [equation_judgment_practice_combined],
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

  var equation_presentation_main = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    post_trial_gap: 250,
    choices: [
      function () {
        return (
          '<p style="font-size: 45px;">' +
          main_equations[mainSelectionIndex].stimulus +
          '</p><br><br><p style="font-size: 15px;">When you have solved this math problem,</br>click on the screen to continue.</p>'
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
        equation: main_equations[mainSelectionIndex].stimulus,
        equation_probe: main_equations[mainSelectionIndex].probe,
        equationCRESP: main_equations[mainSelectionIndex].nonsense,
      })
      mainSelectionIndex += 1
      if (currentRT == null) {
        equationtimeout += 1
        equationACC[equationIndex] = 0
        practiceACC[practiceIndex] = 0
        equationIndex += 1
        practiceIndex += 1
      }
    },
  }

  var equation_judgment_main = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      return (
        '<p style="font-size: 45px; font-family: Arial;">' +
        main_equations[mainSelectionIndex - 1].probe +
        '</p>'
      )
    },
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      equationRESP = data.response
      equationCRESP = jsPsych.data.get().last(2).values()[0].equationCRESP
      if (equationRESP == equationCRESP) {
        data.correct = 1
        equationACC[equationIndex] = 1
      } else {
        data.correct = 0
        equationACC[equationIndex] = 0
      }
      equationIndex += 1
    },
  }

  var if_timeout_node = {
    timeline: [equation_judgment_main],
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
    to the number of letters participants saw). Participants will then
    be asked to type in the letters IN ORDER. If a particular letter
    is not remembered, they are instructued to leave this box blank.
  */

  var response = [] //this is the array we will use to store letter strings
  var trialCorrect = [] //for storing which letters were correct

  //function to push button responses to array
  window.recordClick_ospan = function (elm) {
    response.push($(elm).text()) //push the letter to the array
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //function to clear the response array
  window.clearResponse_ospan = function () {
    response.pop() //this will remove the most recent response
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //function to clear the response array
  window.blankResponse_ospan = function () {
    response.push('_') //push the blank to the array
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //Adapted from the Experiment Factory Repository
  var response_grid =
    '<div class = numbox>' +
    '<p>Please recall the letters you saw to the best of your ability. If you do not remember a particular letter, use the SKIP button.<br><b>(When you are ready to lock in your answer, press ENTER or RETURN)</b></p>' +
    '<button id = button_1 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>F</div></div></button>' +
    '<button id = button_2 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>H</div></div></button>' +
    '<button id = button_3 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>J</div></div></button><br>' +
    '<button id = button_4 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>K</div></div></button>' +
    '<button id = button_5 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>L</div></div></button>' +
    '<button id = button_6 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>N</div></div></button><br>' +
    '<button id = button_7 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>P</div></div></button>' +
    '<button id = button_8 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>Q</div></div></button>' +
    '<button id = button_9 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>R</div></div></button><br>' +
    '<button id = button_10 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>S</div></div></button>' +
    '<button id = button_11 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>T</div></div></button>' +
    '<button id = button_12 class = "square num-button" onclick = "recordClick_ospan(this)"><div class = content><div class = numbers>Y</div></div></button>' +
    '<br><br>' +
    '<button class = clear_button id = "ClearButton" onclick = "clearResponse_ospan()">BACKSPACE</button>' +
    '<button class = blank_button id = "BlankButton" onclick = "blankResponse_ospan()">SKIP</button>' +
    '<p><u><b>Current Answer:</b></u></p><br><div id=echoed_txt style="font-size: 60px; color:blue; font-family:Arial; font-weight:bold;"><b></b></div></div>'

  //UPDATED RECALL SCREEN
  var ospan_recall = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: response_grid,
    choices: ['Enter'],
    on_finish: function (data) {
      var feedbackarray = []
      for (i = 0; i < correctSEQ.length; i++) {
        if (correctSEQ[i] == response[i]) {
          if (practice == false) {
            OSPAN_TOTAL += 1
          } //add to ospan total if not practice
          trialCorrect[i] = 1
          feedbackarray[i] = correctSEQ[i].fontcolor('green')
        } else {
          feedbackarray[i] = correctSEQ[i].fontcolor('red')
          trialCorrect[i] = 0
        }
      }
      var tallyCorrect = arrSum(trialCorrect) //sum of correct responses (for feedback)
      if (arrAvg(trialCorrect) == 1) {
        fullCorrect = 1
        if (practice == false) {
          OSPAN_ABS += correctSEQ.length //if main task, add to absolute score
        }
      }
      var data_resp = JSON.stringify(response) //stringify response for data output
      var data_cresp = JSON.stringify(correctSEQ) //stringify correct answer for data output
      var spanlength = correctSEQ.length //how long the sequence was

      response = [] //clear the response for the next trial
      trialCorrect = [] //clear correct answer array for next trial

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
          OSPAN_TOTAL: 'NA',
          OSPAN_ABS: 'NA',
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
          OSPAN_TOTAL: OSPAN_TOTAL,
          OSPAN_ABS: OSPAN_ABS,
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

  var feedback_screen = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      //dynamic feedback for equation accuracy portion
      if (showEqnACC == true) {
        if (practice == false) {
          var currentACC = Math.round(arrAvg(equationACC) * 100)
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
        var equationTicker =
          '<p class = "senFB" id="senFB">Math Problems:</br>' +
          currentACC.fontcolor(sentFont) +
          '</p>'
      } else {
        var equationTicker = ''
      }
      var getFeedback = jsPsych.data.get().last(1).values()[0].feedback
      var feedbackText = getFeedback.join(' ')
      var pageText =
        '<p style="font-size: 60px; font-family:Arial; font-weight:bold;">' +
        feedbackText +
        '</p>' +
        equationTicker +
        '<p style="font-size:28px;"> You correctly identified ' +
        jsPsych.data.get().last(1).values()[0].numCorrect +
        ' of  ' +
        jsPsych.data.get().last(1).values()[0].LENGTH +
        ' letters.</p><br>'

      return [pageText]
    },
    choices: ['Continue'],
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  /////////////////////////////////
  //// DEFINE THE FINAL BLOCKS ////
  /////////////////////////////////

  ///////////////////////
  //1. LETTER PRACTICE //
  ///////////////////////

  var letter_instructions = {
    timeline: [ospan_instruct_1, ospan_instruct_2],
  }

  var practice_twoletter_trial = {
    timeline: [
      set_up_2,
      letter_presentation,
      letter_presentation,
      ospan_recall,
      feedback_screen,
    ],
  }

  var practice_threeletter_trial = {
    timeline: [
      set_up_3,
      letter_presentation,
      letter_presentation,
      letter_presentation,
      ospan_recall,
      feedback_screen,
    ],
  }

  //final letter practice proc; VL: E-Prime file only has two practice trials for set size 2
  var letter_practice_final = {
    timeline: [
      letter_instructions,
      practice_twoletter_trial,
      practice_twoletter_trial,
    ],
  }

  /////////////////////////
  //2. EQUATION PRACTICE //
  /////////////////////////

  var equation_instructions = {
    timeline: [ospan_instruct_4, ospan_instruct_5],
  }

  var equation_practice = {
    timeline: [
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
      equation_presentation_practice,
      equation_judgment_practice,
      equation_judgment_feedback,
    ],
  }

  //final equation practice proc
  var equation_practice_final = {
    timeline: [
      equation_instructions,
      equation_practice,
      overall_practice_feedback,
    ],
  }

  ////////////////////////////////
  //3. LETTER+EQUATION PRACTICE //
  ////////////////////////////////

  var letterequation_instructions = {
    timeline: [ospan_instruct_7, ospan_instruct_9],
  }

  var letterequation_practice = {
    timeline: [
      equation_presentation_main,
      if_timeout_practice,
      letter_presentation,
      equation_presentation_main,
      if_timeout_practice,
      letter_presentation,
    ],
  }

  var letterequation_practice_feedback = {
    timeline: [ospan_recall, feedback_screen],
  }

  var letterpractice_run = {
    timeline: [
      set_up_2,
      letterequation_practice,
      letterequation_practice_feedback,
    ],
  }

  //final combined practice proc
  var letterequation_practice_final = {
    timeline: [
      letterequation_instructions,
      letterpractice_run,
      letterpractice_run,
      ospan_instruct_10,
    ],
  }

  ///////////////////////
  //4. MAIN ASSESSMENT //
  ///////////////////////

  var ospan_3_core = {
    timeline: [
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  var ospan_4_core = {
    timeline: [
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  var ospan_5_core = {
    timeline: [
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  var ospan_6_core = {
    timeline: [
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  var ospan_7_core = {
    timeline: [
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
      equation_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  //final procedures
  var final_ospan3_run = {
    timeline: [set_up_3, ospan_3_core, ospan_recall, feedback_screen],
  }

  var final_ospan4_run = {
    timeline: [set_up_4, ospan_4_core, ospan_recall, feedback_screen],
  }

  var final_ospan5_run = {
    timeline: [set_up_5, ospan_5_core, ospan_recall, feedback_screen],
  }

  var final_ospan6_run = {
    timeline: [set_up_6, ospan_6_core, ospan_recall, feedback_screen],
  }

  var final_ospan7_run = {
    timeline: [set_up_7, ospan_7_core, ospan_recall, feedback_screen],
  }

  // Critical changes to shorten based on Oswald et al. (2015):
  //      1. Only have set sizes 4-6 (remove shortest and largest set sizes)
  //      2. 2 blocks per set size

  var final_combined_runs = {
    timeline: jsPsych.randomization.repeat(
      [
        // final_ospan3_run, final_ospan3_run, final_ospan3_run,
        final_ospan4_run, // final_ospan4_run, final_ospan4_run,
        final_ospan5_run, // final_ospan5_run, final_ospan5_run,
        final_ospan6_run, //, final_ospan6_run, final_ospan6_run,
        // final_ospan7_run, final_ospan7_run, final_ospan7_run
      ],
      1
    ),
  }

  ////////////////
  // 5. WRAP-UP //
  ////////////////

  var ospan_done = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🧠 Fuel & Memory Simulation Complete!</b></h1>' +
      "<p style='font-size:25px;'>Well done, cadet. Let’s review your performance.</p>",
    choices: ['CONTINUE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      var finalEquationACC = Math.round(arrAvg(equationACC) * 100) //equation accuracy
      var equationCutoff = Math.round(arrAvg(calibRT) + 2.5 * arrSD(calibRT))
      var summaryData = {
        designation: 'SUMMARY',
        OSPAN_TOTAL: OSPAN_TOTAL,
        OSPAN_ABS: OSPAN_ABS,
        EQTN_ACC: finalEquationACC,
        EQTN_RT: equationCutoff,
      }
      jsPsych.data.addDataToLastTrial(summaryData)
    },
  }

  var ospan_summary = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      return (
        '<h1><b>📈 Mission Summary</b></h1>' +
        "<p style='font-size:25px'><b>TOTAL Score:</b> All letters you remembered correctly.</p>" +
        "<p style='font-size:25px'><b>ABSOLUTE Score:</b> Letters recalled only on fully correct sets.</p>" +
        "<p style='font-size:25px'><br>Your <b>TOTAL</b> score: " +
        OSPAN_TOTAL +
        '</p>' +
        "<p style='font-size:25px'>Your <b>ABSOLUTE</b> score: " +
        OSPAN_ABS +
        '</p>' +
        "<p style='font-size:25px'>Report your <b>TOTAL</b> score to the mission commander.</p>"
      )
    },
    choices: ['CONTINUE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  // final trial to bring user to the next game
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

  //main ospan task
  var ospan_final = {
    timeline: [
      letter_practice_final,
      // equation_practice_final,
      // letterequation_practice_final,
      // final_combined_runs,
      // final_combined_runs,
      // ospan_done,
      // ospan_summary,
      nextGame,
    ],
  }

  timeline.push(ospan_final)

  jsPsych.run(timeline)
}
