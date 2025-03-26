function startLspanGame(participantID, onGameEnd) {
  const jsPsych = initJsPsych({
    display_element: 'experiment-container',
    on_finish: function () {
      const filename = `data_lspan_${participantID}.csv`
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

  document.getElementById('experiment-container').innerHTML = '' // Ensure fresh start

  jsPsych.data.addProperties({
    participant_id: participantID,
  })

  jsPsych.randomization.setSeed('listeningspan')
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
  var LSPAN_TOTAL = 0 //variable for tracking the LSPAN TOTAL score
  var LSPAN_ABS = 0 //variable for tracking the LSPAN ABSOLUTE score
  var fullCorrect //to determine whether the entire trial was correct (for ABS score)
  var mainSelectionIndex = 0 //variable for selecting sentences from the main list
  var currentLetter //current letter to be presented to participants
  var correctSEQ = [] //array for storing the correct letter sequence to be recalled
  var correctSEQfiles = [] // VL: array for storing the sound files corresponding to the letter sequence to be recalled
  var designation //designation (for use in tagging different events in the data output)
  var useDynamicRT = true //when false, standard timeout window of 10 seconds for reading the sentence; when true, mean RT from practice is used
  var calibRT = [] //array for storing RTs for practice sentences (to set timeout window for main task)
  var calibRTindex = 0 //variable for indexing sentence number during the sentence-only practice (for calculating mean RT)
  var letters = ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y'] //possible letters to be recalled
  var practice //for dynamic data
  var showSentACC //for displaying sentence accuracy on feedback
  var currRun //for debugging/making sure the correct number of letters are shown
  var online = 0

  // create index variable to reference which letter is to be presented from the list of `letters`
  var indexLetters = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  // VL: function to "pluck" the letters and the sound files associated with the indices iPluck from the array LetterArray
  function pluck(LetterArray, iPluck) {
    var lettersToDisplay = [],
      i = 0,
      len = iPluck.length

    // loop that fills lettersToDisplay with the letter/file from LetterArray that corresponds to the iPluck index
    for (; i < len; i++) {
      lettersToDisplay.push(LetterArray[iPluck[i]])
    }

    return lettersToDisplay
  }

  // function to randomly select 'n' letters from the array without replacement
  // VL: for listening span, we change letterList to indexList as a more informative variable because this function now takes indices and not the actual letters; functionally no change
  function getSample(indexList, n) {
    return jsPsych.randomization.sampleWithoutReplacement(indexList, n)
  }

  // VL: define the filenames for the letter and sentence sound files
  var filename_letters = [
    'sound/f.wav',
    'sound/h.wav',
    'sound/j.wav',
    'sound/k.wav',
    'sound/l.wav',
    'sound/n.wav',
    'sound/p.wav',
    'sound/q.wav',
    'sound/r.wav',
    'sound/s.wav',
    'sound/t.wav',
    'sound/y.wav',
  ]
  var filename_sentences_practice = [
    'sound/finger.wav',
    'sound/lettuce.wav',
    'sound/chair.wav',
    'sound/pot.wav',
    'sound/dentist.wav',
    'sound/vanilla.wav',
    'sound/verb.wav',
    'sound/ring.wav',
    'sound/shark.wav',
    'sound/strawberry.wav',
    'sound/red.wav',
    'sound/cloud.wav',
    'sound/yard.wav',
    'sound/hydrogen.wav',
    'sound/spice.wav',
  ]
  var filename_sentences_main = [
    'sound/airplane.wav',
    'sound/apple.wav',
    'sound/aunt.wav',
    'sound/basement.wav',
    'sound/carrot.wav',
    'sound/cat.wav',
    'sound/cave.wav',
    'sound/ceiling.wav',
    'sound/coal.wav',
    'sound/cricket.wav',
    'sound/day.wav',
    'sound/decade.wav',
    'sound/dog.wav',
    'sound/dollar.wav',
    'sound/elephant.wav',
    'sound/eye.wav',
    'sound/football.wav',
    'sound/gold.wav',
    'sound/governor.wav',
    'sound/gun.wav',
    'sound/hand.wav',
    'sound/hat.wav',
    'sound/hawk.wav',
    'sound/heart.wav',
    'sound/hill.wav',
    'sound/hockey.wav',
    'sound/jail.wav',
    'sound/knife.wav',
    'sound/lake.wav',
    'sound/linen.wav',
    'sound/mouse.wav',
    'sound/neck.wav',
    'sound/newspaper.wav',
    'sound/novel.wav',
    'sound/nurse.wav',
    'sound/oak.wav',
    'sound/oil.wav',
    'sound/organ.wav',
    'sound/peach.wav',
    'sound/potato.wav',
    'sound/rifle.wav',
    'sound/roof.wav',
    'sound/ruby.wav',
    'sound/saw.wav',
    'sound/scarf.wav',
    'sound/sister.wav',
    'sound/skillet.wav',
    'sound/snow.wav',
    'sound/sofa.wav',
    'sound/son.wav',
    'sound/spider.wav',
    'sound/tent.wav',
    'sound/tie.wav',
    'sound/tin.wav',
    'sound/violin.wav',
    'sound/volcano.wav',
    'sound/water.wav',
    'sound/yellow.wav',
    'sound/zebra.wav',
  ]

  // PRELOAD ALL AUDIO FILES
  var preload = {
    type: jsPsychPreload,
    audio: [
      filename_letters,
      filename_sentences_practice,
      filename_sentences_main,
    ],
  }

  var lspan_welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="mission-welcome">Mission EchoCore</div>`,
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
          color: black;
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

  //Letter Instructions
  var lspan_instruct_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>📡 Alien Signal Training</b></h1>' +
      "<p style='font-size:25px'>Cadet, your first task is to train your ears and memory to pick up alien signals.</p>" +
      "<p style='font-size:25px'>You’ll start with a warm-up round focused just on signal (letter) memory. <br><br>Let’s get you ready!</p><br>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      practice = true
      showSentACC = false
    }, //switching practice to true for dynamic data, switching sentence feedback to false
  }

  var lspan_instruct_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'>You’ll hear a few alien signal letters, one at a time.</p>" +
      "<p style='font-size:25px'>Try to remember them in the order you hear them.</p>" +
      "<p style='font-size:25px'>After 2–3 letters, you’ll enter recall mode and report them <b>in order</b>.</p>" +
      "<p style='font-size:25px'>If you do not remember a particular letter, you will have the option to leave it blank.</p>" +
      "<p style='font-size:25px'>Ready to begin your signal memory drill?</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  //Sentence Instructions
  var lspan_instruct_3 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🧠 Sentence Logic Training</b></h1>' +
      "<p style='font-size:25px'>Cadet, we’ve intercepted alien intelligence containing facts about Earth.</p>" +
      "<p style='font-size:25px'>Some of this intel was accurate. Some… not so much.</p>" +
      "<p style='font-size:25px'>Your next training is to analyze each transmission and decide whether it’s true or false.</p>" +
      "<p style='font-size:25px'><b>Example (True):</b> An article of clothing worn on the foot is a sock.</p>" +
      "<p style='font-size:25px'><b>Example (False):</b> A part of the body attached to the shoulder is the toe.</p>" +
      "<p style='font-size:25px'>After each sentence, the signal will end and you’ll respond.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var lspan_instruct_4 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'>Accuracy counts! Let's practice identifying true and false statements.</p>" +
      "<p style='font-size:25px'>Ready to fire up your reasoning engine?</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  //Combined Instructions
  var lspan_instruct_5 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🛰️ Dual Task Simulation</b></h1>' +
      "<p style='font-size:25px'>Now it’s time to put your training to the test. You’ll be doing both parts of the mission at once.</p>" +
      "<p style='font-size:25px'>First, you'll hear a piece of alien intel. Decide quickly if it’s true or false.</p>" +
      "<p style='font-size:25px'>Then, a signal letter will come through. Remember it -- order matters.</p>" +
      "<p style='font-size:25px'>You’ll go back and forth like this: sentence → letter → sentence → letter...</p>" +
      "<p style='font-size:25px'>At the end of each sequence, you’ll recall the letters in the exact order you received them.</p><br>" +
      "<p style='font-size:25px'>⚠️ <b>Heads up</b>: We’ve calculated your average response time. If you take too long to decide on a sentence, we’ll skip ahead and count it as a mistake.</p>" +
      "<p style='font-size:25px'>So stay sharp -- respond quickly and accurately!</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var lspan_instruct_6 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>📊 Accuracy Checkpoint</b></h1>' +
      "<p style='font-size:25px'>After each set, you’ll see how well you did.</p>" +
      "<p style='font-size:25px'><b>Your mission score must stay above 85% accuracy on the sentences.</b></p>" +
      "<p style='font-size:25px'>This is critical for mission success. Give it your all, cadet!</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      showSentACC = true
    }, //switching to show sentence accuracy for letter+sentence practice
  }

  //Wrap-up / final screen before main task
  var lspan_instruct_7 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h2><b>Training complete. Time for the real mission.</b></h2>' +
      "<p style='font-size:25px'>Each round: Hear a sentence, answer TRUE/FALSE, then remember the letter.</p>" +
      "<p style='font-size:25px'>After each sequence, recall all the letters in order. Use the Skip button if you forget one.</p>" +
      "<p style='font-size:25px'>Some rounds will be tougher -- stay focused. Aim for speed and accuracy.</p>" +
      "<p style='font-size:25px'><b>No tools allowed -- no notes, no typing helpers. It’s just you and your brain.</b></p>" +
      "<p style='font-size:25px'>Ready to prove yourself, space cadet?</p>",
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
    sentence and letter within and across trials), the 'main_sentences'
    timline variable is not treated as a traditional timeline variable.
    Rather, the array is randomized and then for each sentence an index
    selects one element (sequentially). Because the array was randomized,
    this ensures that the main sentences are presented in random order
    AND that each sentence is only presented one time in the experiment.
    There is probably a more elegant way of doing this, but oh well.
    */

  var practice_sentences = [
    { stimulus: 'sound/finger.wav', nonsense: 1 },
    { stimulus: 'sound/lettuce.wav', nonsense: 0 },
    { stimulus: 'sound/chair.wav', nonsense: 0 },
    { stimulus: 'sound/pot.wav', nonsense: 1 },
    { stimulus: 'sound/dentist.wav', nonsense: 0 },
    { stimulus: 'sound/vanilla.wav', nonsense: 0 },
    { stimulus: 'sound/verb.wav', nonsense: 1 },
    { stimulus: 'sound/ring.wav', nonsense: 0 },
    { stimulus: 'sound/shark.wav', nonsense: 1 },
    { stimulus: 'sound/strawberry.wav', nonsense: 1 },
    { stimulus: 'sound/red.wav', nonsense: 1 },
    { stimulus: 'sound/cloud.wav', nonsense: 1 },
    { stimulus: 'sound/yard.wav', nonsense: 0 },
    { stimulus: 'sound/hydrogen.wav', nonsense: 0 },
    { stimulus: 'sound/spice.wav', nonsense: 1 },
  ]

  var main_sentences = [
    { stimulus: 'sound/airplane.wav', nonsense: 1 },
    { stimulus: 'sound/apple.wav', nonsense: 1 },
    { stimulus: 'sound/aunt.wav', nonsense: 0 },
    { stimulus: 'sound/basement.wav', nonsense: 1 },
    { stimulus: 'sound/carrot.wav', nonsense: 0 },
    { stimulus: 'sound/cat.wav', nonsense: 0 },
    { stimulus: 'sound/cave.wav', nonsense: 0 },
    { stimulus: 'sound/ceiling.wav', nonsense: 1 },
    { stimulus: 'sound/coal.wav', nonsense: 1 },
    { stimulus: 'sound/cricket.wav', nonsense: 0 },
    { stimulus: 'sound/day.wav', nonsense: 0 },
    { stimulus: 'sound/decade.wav', nonsense: 1 },
    { stimulus: 'sound/dog.wav', nonsense: 0 },
    { stimulus: 'sound/dollar.wav', nonsense: 0 },
    { stimulus: 'sound/elephant.wav', nonsense: 0 },
    { stimulus: 'sound/eye.wav', nonsense: 0 },
    { stimulus: 'sound/football.wav', nonsense: 1 },
    { stimulus: 'sound/gold.wav', nonsense: 1 },
    { stimulus: 'sound/governor.wav', nonsense: 0 },
    { stimulus: 'sound/gun.wav', nonsense: 1 },
    { stimulus: 'sound/hand.wav', nonsense: 0 },
    { stimulus: 'sound/hat.wav', nonsense: 1 },
    { stimulus: 'sound/hawk.wav', nonsense: 1 },
    { stimulus: 'sound/heart.wav', nonsense: 1 },
    { stimulus: 'sound/hill.wav', nonsense: 0 },
    { stimulus: 'sound/hockey.wav', nonsense: 1 },
    { stimulus: 'sound/jail.wav', nonsense: 0 },
    { stimulus: 'sound/knife.wav', nonsense: 1 },
    { stimulus: 'sound/lake.wav', nonsense: 1 },
    { stimulus: 'sound/linen.wav', nonsense: 1 },
    { stimulus: 'sound/mouse.wav', nonsense: 1 },
    { stimulus: 'sound/neck.wav', nonsense: 0 },
    { stimulus: 'sound/newspaper.wav', nonsense: 0 },
    { stimulus: 'sound/novel.wav', nonsense: 0 },
    { stimulus: 'sound/nurse.wav', nonsense: 0 },
    { stimulus: 'sound/oak.wav', nonsense: 0 },
    { stimulus: 'sound/oil.wav', nonsense: 1 },
    { stimulus: 'sound/organ.wav', nonsense: 1 },
    { stimulus: 'sound/peach.wav', nonsense: 0 },
    { stimulus: 'sound/potato.wav', nonsense: 0 },
    { stimulus: 'sound/rifle.wav', nonsense: 1 },
    { stimulus: 'sound/roof.wav', nonsense: 1 },
    { stimulus: 'sound/ruby.wav', nonsense: 1 },
    { stimulus: 'sound/saw.wav', nonsense: 1 },
    { stimulus: 'sound/scarf.wav', nonsense: 0 },
    { stimulus: 'sound/sister.wav', nonsense: 0 },
    { stimulus: 'sound/skillet.wav', nonsense: 0 },
    { stimulus: 'sound/snow.wav', nonsense: 1 },
    { stimulus: 'sound/sofa.wav', nonsense: 0 },
    { stimulus: 'sound/son.wav', nonsense: 0 },
    { stimulus: 'sound/spider.wav', nonsense: 0 },
    { stimulus: 'sound/tent.wav', nonsense: 0 },
    { stimulus: 'sound/tie.wav', nonsense: 1 },
    { stimulus: 'sound/tin.wav', nonsense: 1 },
    { stimulus: 'sound/violin.wav', nonsense: 1 },
    { stimulus: 'sound/volcano.wav', nonsense: 0 },
    { stimulus: 'sound/water.wav', nonsense: 0 },
    { stimulus: 'sound/yellow.wav', nonsense: 1 },
    { stimulus: 'sound/zebra.wav', nonsense: 1 },
  ]

  //Now we will randomize the main timeline variables. We will then sequentially go through the (randomized) list in the main task
  main_sentences = jsPsych.randomization.repeat(main_sentences, 1)

  //////////////////
  //SET-UP SCREENS//
  //////////////////
  /*
    These screens are just 1000ms fixation screens before each trial run.
    They should help orient participants' attention to the center of the screen,
    where the first sentence of a trial will appear (or letter in the case of
    letter-only practice). However, they serve the purpose of selecting the
    appropriate length of letter strings (with no letter repeats)

    VL: Modified to distinguish the letters heard (stored in correctSEQ) from the sound files that play those letters (stored in correctSEQfiles)
        correctSEQ and correctSEQfiles are matched by `IndicesToPlay`: `IndicesToPlay` makes sure that letters stored in the data match the sound files being played

    */
  var set_up_2 = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    choices: 'NO_KEYS',
    stimulus: '<p style="font-size:75px;">...</p>',
    on_finish: function (data) {
      var IndicesToPlay = getSample(indexLetters, 2) //select two random letters
      correctSEQ = []
      correctSEQfiles = []
      correctSEQ = pluck(letters, IndicesToPlay)
      correctSEQfiles = pluck(filename_letters, IndicesToPlay)
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
      var IndicesToPlay = getSample(indexLetters, 3) //select three random letters
      correctSEQ = []
      correctSEQfiles = []
      correctSEQ = pluck(letters, IndicesToPlay)
      correctSEQfiles = pluck(filename_letters, IndicesToPlay)
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
      var IndicesToPlay = getSample(indexLetters, 4) //select four random letters
      correctSEQ = []
      correctSEQfiles = []
      correctSEQ = pluck(letters, IndicesToPlay)
      correctSEQfiles = pluck(filename_letters, IndicesToPlay)
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
      var IndicesToPlay = getSample(indexLetters, 5) //select five random letters
      correctSEQ = []
      correctSEQfiles = []
      correctSEQ = pluck(letters, IndicesToPlay)
      correctSEQfiles = pluck(filename_letters, IndicesToPlay)
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
      var IndicesToPlay = getSample(indexLetters, 6) //select six random letters
      correctSEQ = []
      correctSEQfiles = []
      correctSEQ = pluck(letters, IndicesToPlay)
      correctSEQfiles = pluck(filename_letters, IndicesToPlay)
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
      var IndicesToPlay = getSample(indexLetters, 7) //select seven random letters
      correctSEQ = []
      correctSEQfiles = []
      correctSEQ = pluck(letters, IndicesToPlay)
      correctSEQfiles = pluck(filename_letters, IndicesToPlay)
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
    type: jsPsychAudioKeyboardResponse,
    // trial_duration: 400, // Based on MATLAB code in James et al. (2018) [lines 85, 322]
    post_trial_gap: 500, // No description of ISI in James et al., Unsworth et al. (2005; 2009), or Stine & Hindman but keeping it so that there's a break in the presentation of letters
    choices: 'NO_KEYS',
    trial_ends_after_audio: true,
    on_start: function () {
      currentLetter = correctSEQ[numIndex]
    },
    stimulus: function () {
      return correctSEQfiles[numIndex]
    },
    // prompt: '<p style="font-size: 30px;">+</p>', // Return just a fixation cross (so effectively a blank screen, which was done in James et al. (2018) MATLAB code); not implemented because it would appear-reappear for every letter and blinking effect is distracting
    data: { letterSeen: currentLetter },
    on_finish: function () {
      numIndex += 1
      currRun += 1 //for debugging purposes
    },
  }

  /////////////////////////
  //SENTENCE PRESENTATION//
  /////////////////////////
  /*
    These screens display the to-be-judged sentence to participants.
    For each sentence, participants must determine whether it makes
    sense. During practice, these judgments are untimed and the
    sentences are drawn SEQUENTIALLY from the practice list ('practice_sentences').
    During the main task, sentences are drawn from the RANDOMIZED main
    list ('sentenceRandom') AND each sentence is shown for the average amount
    of time that participants took to read the practice sentences. This RT value
    is stored in the array 'calibRT'
    */

  var sentenceRESP //button pressed to indicate whether the sentence made sense
  var sentenceCRESP //whether the sentence indeed makes sense (yes/no)
  var senPracticeCorrect = 0 //running tally of correctly answered practice sentences
  var sentencetimeout = 0 //running tally of sentences in which a timeout is recorded (reading error)
  var sentenceACC = [] //this is the array that will carry the official tally of sentence accuracy for the main task
  var sentenceIndex = 0 //index for current sentence in the main task
  var practiceACC = [] //this is the array that will carry the official tally of sentence accuracy for the letter+sentence practice task
  var practiceIndex = 0 //index for current sentence in the practice task

  //SENTENCE-ONLY PRACTICE SCREENS
  var sentence_presentation_practice = {
    type: jsPsychAudioButtonResponse,
    stimulus: [
      function () {
        return practice_sentences[calibRTindex].stimulus
      },
    ],
    trial_ends_after_audio: true,
    response_allowed_while_playing: false,
    post_trial_gap: 250,
    choices: [
      function () {
        return '<p style="font-size: 30px;">+</p>'
      },
    ], // Return just a fixation cross (so effectively a blank screen, which was done in James et al. (2018) MATLAB code)
    button_html: '<button class="fullscreenStyle">%choice%</button>',
    on_finish: function () {
      jsPsych.data.addDataToLastTrial({
        designation: 'PRACTICE',
        sentence: practice_sentences[calibRTindex].stimulus,
        sentenceCRESP: practice_sentences[calibRTindex].nonsense,
      })
    },
  }

  var sentence_judgment_practice = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size: 30px; font-family: Arial;'>Is the sentence true?</p>",
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      sentenceRESP = data.response
      sentenceCRESP = jsPsych.data.get().last(2).values()[0].sentenceCRESP
      console.log(sentenceRESP, sentenceCRESP)
      if (sentenceRESP == sentenceCRESP) {
        data.correct = 1
        senPracticeCorrect += 1
      } else {
        data.correct = 0
      }

      // Calibration occurs during presentation of the prompt so transferred recording of calibration RT in here from `sentence_presentation_practice`
      calibRT[calibRTindex] = data.rt
      console.log(calibRT[calibRTindex]) // Added for diagnosing that response deadline is correctly calculated at mean + 2.5 SD; uncomment when debugging
      calibRTindex += 1
    },
  }

  var sentence_judgment_feedback = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 750,
    post_trial_gap: 250,
    choices: 'NO_KEYS',
    stimulus: function () {
      var last_sentence_correct = jsPsych.data.get().last(1).values()[0].correct
      if (last_sentence_correct) {
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
      if (senPracticeCorrect > 12) {
        return (
          '<p style="font-size: 25px;">You responded correctly on ' +
          senPracticeCorrect +
          ' of ' +
          calibRTindex +
          ' sentences. Good job!</p>'
        )
      } else {
        return (
          '<p style="font-size: 25px;">You only responded correctly on ' +
          senPracticeCorrect +
          ' of ' +
          calibRTindex +
          ' sentences.</p><p style="font-size: 20px;"><b>In the main task, you must try harder to answer accurately.</b></p>'
        )
      }
    },
    choices: ['CONTINUE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  //LETTER+SENTENCE PRACTICE SCREENS
  var sentence_judgment_practice_combined = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size: 30px; font-family: Arial;'>Is the sentence true?</p>",
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    trial_duration: function () {
      if (useDynamicRT == false) {
        return 10000
      } else {
        return Math.round(arrAvg(calibRT) + 2.5 * arrSD(calibRT))
      }
    }, //10-second timeout window OR mean RT from practice, depending on 'useDynamicRT' (mean RT + 2.5SD)
    on_finish: function (data) {
      sentenceCRESP = jsPsych.data.get().last(2).values()[0].sentenceCRESP
      sentenceRESP = data.response
      if (sentenceRESP == sentenceCRESP) {
        data.correct = 1
        practiceACC[practiceIndex] = 1
      } else {
        data.correct = 0
        practiceACC[practiceIndex] = 0
      }
      practiceIndex += 1
    },
  }

  // VL: Not used in listening span because timeout happens during when the judgment prompt is shown
  var if_timeout_practice = {
    timeline: [sentence_judgment_practice_combined],
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

  var sentence_presentation_main = {
    type: jsPsychAudioButtonResponse,
    stimulus: [
      function () {
        return main_sentences[mainSelectionIndex].stimulus
      },
    ],
    post_trial_gap: 250,
    choices: [
      function () {
        return '<p style="font-size: 30px;">+</p>'
      },
    ], // Return just a fixation cross (so effectively a blank screen, which was done in James et al. (2018) MATLAB code)
    button_html: '<button class="fullscreenStyle">%choice%</button>',
    trial_ends_after_audio: true,
    response_allowed_while_playing: false,
    on_finish: function () {
      jsPsych.data.addDataToLastTrial({
        designation: 'MAIN',
        sentence: main_sentences[mainSelectionIndex].stimulus,
        sentenceCRESP: main_sentences[mainSelectionIndex].nonsense,
      })
      mainSelectionIndex += 1
    },
  }

  var sentence_judgment_main = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size: 30px; font-family: Arial;'>Is the sentence true?</p>",
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    trial_duration: function () {
      if (useDynamicRT == false) {
        return 10000
      } else {
        return Math.round(arrAvg(calibRT) + 2.5 * arrSD(calibRT))
      }
    }, // 10-second timeout window OR mean RT from practice, depending on 'useDynamicRT' (mean RT + 2.5SD); property moved here from `sentence_presentation_main`
    on_finish: function (data) {
      // VL: Because the timeout occurs during the prompt/judgment phase, this section was moved from the `sentence_presentation_main` object to here
      var currentRT = data.rt
      if (currentRT == null) {
        sentencetimeout += 1
        sentenceACC[sentenceIndex] = 0
        practiceACC[practiceIndex] = 0
        sentenceIndex += 1
        practiceIndex += 1
      }

      // VL: Need to contrast the case for which RT was collected (i.e., valid, non-timeout trial), so original code was enclosed in a conditional
      //     that complements the conditional above
      if (currentRT != null) {
        sentenceRESP = data.response
        sentenceCRESP = jsPsych.data.get().last(2).values()[0].sentenceCRESP
        if (sentenceRESP == sentenceCRESP) {
          data.correct = 1
          sentenceACC[sentenceIndex] = 1
        } else {
          data.correct = 0
          sentenceACC[sentenceIndex] = 0
        }
        sentenceIndex += 1
      }
    },
  }

  // VL: Not used in listening span because timeout happens during when the judgment prompt is shown
  var if_timeout_node = {
    timeline: [sentence_judgment_main],
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
  window.recordClick_lspan = function (elm) {
    response.push($(elm).text()) //push the letter to the array
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //function to clear the response array
  window.clearResponse_lspan = function () {
    response.pop() //this will remove the most recent response
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //function to clear the response array
  window.blankResponse_lspan = function () {
    response.push('_') //push the blank to the array
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //Adapted from the Experiment Factory Repository
  var response_grid =
    '<div class = numbox>' +
    '<p>Please recall the letters you saw to the best of your ability. If you do not remember a particular letter, use the SKIP button.<br><b>(When you are ready to lock in your answer, press ENTER or RETURN)</b></p>' +
    '<button id = button_1 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>F</div></div></button>' +
    '<button id = button_2 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>H</div></div></button>' +
    '<button id = button_3 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>J</div></div></button><br>' +
    '<button id = button_4 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>K</div></div></button>' +
    '<button id = button_5 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>L</div></div></button>' +
    '<button id = button_6 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>N</div></div></button><br>' +
    '<button id = button_7 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>P</div></div></button>' +
    '<button id = button_8 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>Q</div></div></button>' +
    '<button id = button_9 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>R</div></div></button><br>' +
    '<button id = button_10 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>S</div></div></button>' +
    '<button id = button_11 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>T</div></div></button>' +
    '<button id = button_12 class = "square num-button" onclick = "recordClick_lspan(this)"><div class = content><div class = numbers>Y</div></div></button>' +
    '<br><br>' +
    '<button class = clear_button id = "ClearButton" onclick = "clearResponse_lspan()">BACKSPACE</button>' +
    '<button class = blank_button id = "BlankButton" onclick = "blankResponse_lspan()">SKIP</button>' +
    '<p><u><b>Current Answer:</b></u><br><br></p><div id=echoed_txt style="font-size: 60px; color:blue; font-family:Arial; font-weight:bold;"><b></b></div></div>'

  //UPDATED RECALL SCREEN
  var lspan_recall = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: response_grid,
    choices: ['Enter'],
    on_finish: function (data) {
      var feedbackarray = []
      for (i = 0; i < correctSEQ.length; i++) {
        if (correctSEQ[i] == response[i]) {
          if (practice == false) {
            LSPAN_TOTAL += 1
          } //add to lspan total if not practice
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
          LSPAN_ABS += correctSEQ.length //if main task, add to absolute score
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
          LSPAN_TOTAL: 'NA',
          LSPAN_ABS: 'NA',
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
          LSPAN_TOTAL: LSPAN_TOTAL,
          LSPAN_ABS: LSPAN_ABS,
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
      //dynamic feedback for sentence accuracy portion
      if (showSentACC == true) {
        if (practice == false) {
          var currentACC = Math.round(arrAvg(sentenceACC) * 100)
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
        var sentenceTicker =
          '<p class = "senFB" id="senFB">Sentence:</br>' +
          currentACC.fontcolor(sentFont) +
          '</p>'
      } else {
        var sentenceTicker = ''
      }
      var getFeedback = jsPsych.data.get().last(1).values()[0].feedback
      var feedbackText = getFeedback.join(' ')
      var pageText =
        '<p style="font-size: 60px; font-family:Arial; font-weight:bold;">' +
        feedbackText +
        '</p>' +
        sentenceTicker +
        '<p style="font-size:28px"> You correctly identified ' +
        jsPsych.data.get().last(1).values()[0].numCorrect +
        ' of  ' +
        jsPsych.data.get().last(1).values()[0].LENGTH +
        ' letters.</p>'

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
    timeline: [lspan_instruct_1, lspan_instruct_2],
  }

  var practice_twoletter_trial = {
    timeline: [
      set_up_2,
      letter_presentation,
      letter_presentation,
      lspan_recall,
      feedback_screen,
    ],
  }

  var practice_threeletter_trial = {
    timeline: [
      set_up_3,
      letter_presentation,
      letter_presentation,
      letter_presentation,
      lspan_recall,
      feedback_screen,
    ],
  }

  //final letter practice proc
  var letter_practice_final = {
    timeline: [
      letter_instructions,
      practice_twoletter_trial,
      practice_twoletter_trial,
      practice_threeletter_trial,
      practice_threeletter_trial,
    ],
  }

  /////////////////////////
  //2. SENTENCE PRACTICE //
  /////////////////////////

  var sentence_instructions = {
    timeline: [lspan_instruct_3, lspan_instruct_4],
  }

  var sentence_practice = {
    timeline: [
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
      sentence_presentation_practice,
      sentence_judgment_practice,
      sentence_judgment_feedback,
    ],
  }

  //final sentence practice proc
  var sentence_practice_final = {
    timeline: [
      sentence_instructions,
      sentence_practice,
      overall_practice_feedback,
    ],
  }

  ////////////////////////////////
  //3. LETTER+SENTENCE PRACTICE //
  ////////////////////////////////

  var lettersentence_instructions = {
    timeline: [lspan_instruct_5, lspan_instruct_6],
  }

  // VL: Modified in listening span to replace `if_timeout_practice` with actual `sentence_judgment_practice_combined` because timeout occurs in judgment window
  var lettersentence_practice = {
    timeline: [
      sentence_presentation_main,
      sentence_judgment_practice_combined,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_practice_combined,
      letter_presentation,
    ],
  }

  var lettersentence_practice_feedback = {
    timeline: [lspan_recall, feedback_screen],
  }

  var letterpractice_run = {
    timeline: [
      set_up_2,
      lettersentence_practice,
      lettersentence_practice_feedback,
    ],
  }

  //final combined practice proc
  var lettersentence_practice_final = {
    timeline: [
      lettersentence_instructions,
      letterpractice_run,
      letterpractice_run,
      lspan_instruct_7,
    ],
  }

  ///////////////////////
  //4. MAIN ASSESSMENT //
  ///////////////////////

  // VL: NOTE -- replaced all instances of `if_timeout_node` in this section with actual `sentence_judgment_main` because timeout occurs in judgment window

  // VL: added a 2 set size "core" object
  var lspan_2_core = {
    timeline: [
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
    ],
  }

  var lspan_3_core = {
    timeline: [
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
    ],
  }

  var lspan_4_core = {
    timeline: [
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
    ],
  }

  var lspan_5_core = {
    timeline: [
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
    ],
  }

  var lspan_6_core = {
    timeline: [
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
    ],
  }

  var lspan_7_core = {
    timeline: [
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
      sentence_presentation_main,
      sentence_judgment_main,
      letter_presentation,
    ],
  }

  //final procedures
  // VL: Added a final_lspan2_run object
  var final_lspan2_run = {
    timeline: [set_up_2, lspan_2_core, lspan_recall, feedback_screen],
  }

  var final_lspan3_run = {
    timeline: [set_up_3, lspan_3_core, lspan_recall, feedback_screen],
  }

  var final_lspan4_run = {
    timeline: [set_up_4, lspan_4_core, lspan_recall, feedback_screen],
  }

  var final_lspan5_run = {
    timeline: [set_up_5, lspan_5_core, lspan_recall, feedback_screen],
  }

  var final_lspan6_run = {
    timeline: [set_up_6, lspan_6_core, lspan_recall, feedback_screen],
  }

  var final_lspan7_run = {
    timeline: [set_up_7, lspan_7_core, lspan_recall, feedback_screen],
  }

  // VL: Modified final combined runs to consist of 2 trials for each set size from 2-7
  var final_combined_runs = {
    timeline: jsPsych.randomization.repeat(
      [
        final_lspan2_run,
        final_lspan2_run,
        final_lspan3_run,
        final_lspan3_run,
        final_lspan4_run,
        final_lspan4_run,
        final_lspan5_run,
        final_lspan5_run,
        final_lspan6_run,
        final_lspan6_run,
        final_lspan7_run,
        final_lspan7_run,
      ],
      1
    ),
  }

  ////////////////
  // 5. WRAP-UP //
  ////////////////

  var lspan_done = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🧠 Mission EchoCore Complete</b></h1>' +
      "<p style='font-size:25px'>Thanks for decoding alien intel and storing critical signal data.</br></br>You’ve completed the Listening & Memory simulation.</p>" +
      "<p style='font-size:25px'>Let’s review your mission performance.</p>",
    choices: ['CONTINUE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      var finalSentenceACC = Math.round(arrAvg(sentenceACC) * 100) //sentence accuracy
      var sentenceCutoff = Math.round(arrAvg(calibRT) + 2.5 * arrSD(calibRT))
      var summaryData = {
        designation: 'SUMMARY',
        LSPAN_TOTAL: LSPAN_TOTAL,
        LSPAN_ABS: LSPAN_ABS,
        SENT_ACC: finalSentenceACC,
        SENT_RT: sentenceCutoff,
      }
      jsPsych.data.addDataToLastTrial(summaryData)
    },
  }

  var lspan_summary = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      return (
        "<p style='font-size:25px'><b>📊 Mission Summary</b></p>" +
        "<p style='font-size:25px'><b>TOTAL Score:</b> Letters correctly recalled across all rounds.</p>" +
        "<p style='font-size:25px'><b>ABSOLUTE Score:</b> Letters correctly recalled <b>only</b> on rounds where you got the entire set right.</p>" +
        "<p style='font-size:25px'><br>Your <b>TOTAL</b> score: " +
        LSPAN_TOTAL +
        '</p>' +
        "<p style='font-size:25px'>Your <b>ABSOLUTE</b> score: " +
        LSPAN_ABS +
        '</p>' +
        "<p style='font-size:25px'>Report your <b>TOTAL</b> score to the mission commander.</p>"
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

  // main lspan task
  // VL: Added the preload object to preload all audio files before proceeding with the experiment
  var lspan_final = {
    timeline: [
      preload,
      lspan_welcome,
      letter_practice_final,
      // sentence_practice_final,
      // lettersentence_practice_final,
      // final_combined_runs,
      // lspan_done,
      // lspan_summary,
    ],
  }

  timeline.push(lspan_final)

  if (game_counts > 0) {
    timeline.push(nextGame)
  }

  jsPsych.run(timeline)
}
