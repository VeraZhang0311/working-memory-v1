function startRspanGame(participantID, onGameEnd) {
  const jsPsych = initJsPsych({
    display_element: 'experiment-container',
    on_finish: function () {
      const filename = `data_rspan_${participantID}.csv`
      jsPsych.data.get().localSave('csv', filename)
      onGameEnd() // Call the cleanup function
    },
  })

  let experimentContainer = document.getElementById('experiment-container')
  if (experimentContainer) {
    experimentContainer.innerHTML = '' // Clear experiment content
    // console.log('experiment-container found!') // uncomment this to debug
  } else {
    // console.warn('experiment-container not found!') // uncomment this to debug
  }

  jsPsych.data.addProperties({
    participant_id: participantID,
  })

  jsPsych.randomization.setSeed('spanreading')
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
  var RSPAN_TOTAL = 0 //variable for tracking the RSPAN TOTAL score
  var RSPAN_ABS = 0 //variable for tracking the RSPAN ABSOLUTE score
  var fullCorrect //to determine whether the entire trial was correct (for ABS score)
  var mainSelectionIndex = 0 //variable for selecting sentences from the main list
  var currentLetter //current letter to be presented to participants
  var correctSEQ = [] //array for storing the correct letter sequence to be recalled
  var designation //designation (for use in tagging different events in the data output)
  var useDynamicRT = true //when false, standard timeout window of 10 seconds for reading the sentence; when true, mean RT from practice is used
  var calibRT = [] //array for storing RTs for practice sentences (to set timeout window for main task)
  var calibRTindex = 0 //variable for indexing sentence number during the sentence-only practice (for calculating mean RT)
  var letters = ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y'] //possible letters to be recalled
  var practice //for dynamic data
  var showSentACC //for displaying sentence accuracy on feedback
  var currRun //for debugging/making sure the correct number of letters are shown
  var online = 0 // Numeric: 0 indicating that task is being run locally, 1 indicating that the task is being run through a platform

  //function to randomly select 'n' letters from the array without replacement
  function getSample(letterList, n) {
    return jsPsych.randomization.sampleWithoutReplacement(letterList, n)
  }

  ///////////////////////////////////////////
  // INITIALIZE EXPERIMENT CONTEXT  /////////
  ///////////////////////////////////////////
  var get_location = {
    type: jsPsychSurveyMultiChoice,
    questions: [
      {
        prompt: 'Where are you running the task?',
        name: 'client',
        options: [
          'Online (cognition.run, gorilla.sc, MTurk link)',
          'Local (Lab computer files)',
        ],
        required: true,
      },
    ],
    on_finish: function (data) {
      online =
        data.response.client == 'Online (cognition.run, gorilla.sc, MTurk link)'
          ? 1
          : 0
    },
  }

  ////////////////
  //INSTRUCTIONS//
  ////////////////

  //Letter Instructions
  var rspan_instruct_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>📖 Alien Logic & Signal Recall</b></h1>' +
      "<p style='font-size:25px'>Cadet, in this simulation,</p>" +
      "<p style='font-size:25px'>you’ll be reading intercepted alien transmissions and storing signals in order.</p>" +
      "<p style='font-size:25px'>Let’s start by warming up your signal recall system.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      practice = true
      showSentACC = false
    }, //switching practice to true for dynamic data, switching sentence feedback to false
  }

  var rspan_instruct_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'>Letters will appear one at a time.</p>" +
      "<p style='font-size:25px'>Memorize each one in the exact order it appears.</p>" +
      "<p style='font-size:25px'>After two letters, you’ll be asked to recall them <b>in order</b>. Leave blanks if needed.</p>" +
      "<p style='font-size:25px'>Order matters. The signal codes must be recalled just as they came in.</p>" +
      "<p style='font-size:25px'>Begin signal memory training when ready.</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  //Sentence Instructions
  var ospan_instruct_3 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>👽 Alien Transmission Analysis</b></h1>' +
      "<p style='font-size:25px'>You’ll now practice reading alien log entries. Your job is to decide if each message makes logical sense.</p>" +
      "<p style='font-size:25px'>For example:</p>" +
      "<p style='font-size:30px'><b>I like to run in the park.</b></p>" +
      "<p style='font-size:25px'>That one makes sense.</p>" +
      "<p style='font-size:30px'><b>I like to run in the sky.</b></p>" +
      "<p style='font-size:25px'>That one does <b>not</b> make sense.</p>" +
      "<p style='font-size:25px'>After reading, click anywhere to move on.</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var ospan_instruct_4 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px'>You’ll then be asked:</p>" +
      "<p style='font-size:30px'><b>This sentence makes sense.</b></p>" +
      "<p style='font-size:25px'>Click <b>TRUE</b> if it does. Click <b>FALSE</b> if it doesn’t.</p>" +
      "<p style='font-size:25px'>Feedback will follow -- just like a transmission confirmation system.</p>" +
      "<p style='font-size:25px'>Your goal is to read quickly and judge accurately.</p>" +
      "<p style='font-size:25px'>Ready to begin logic judgment training?</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  //Combined Instructions
  var ospan_instruct_5 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🧪 Dual Task Simulation</b></h1>' +
      "<p style='font-size:25px'>Now you’ll do both: read a sentence and judge if it makes sense, then memorize a signal letter.</p>" +
      "<p style='font-size:25px'>This will repeat: sentence → letter → sentence → letter...</p>" +
      "<p style='font-size:25px'>At the end, recall the signal letters in the order they were received.</p>" +
      "<p style='font-size:25px'>⚠️ If you take too long reading, the system will skip your judgment and count it as incorrect.</p>" +
      "<p style='font-size:25px'>So read fast, judge accurately, and memorize carefully!</p>",
    choices: ['CONTINUE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
  }

  var ospan_instruct_6 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>📊 Accuracy Checkpoint</b></h1>' +
      "<p style='font-size:25px'>You’ll see your sentence accuracy percentage in the top right.</p>" +
      "<p style='font-size:25px'>Keep it at or above <b>85%</b> to stay in mission-ready condition.</p>" +
      "<p style='font-size:25px'>Focus on both comprehension and memory. Good luck!</p>",
    choices: ['BEGIN PRACTICE'],
    post_trial_gap: 250,
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function () {
      showSentACC = true
    }, //switching to show sentence accuracy for letter+sentence practice
  }

  //Wrap-up / final screen before main task
  var ospan_instruct_7 = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1><b>🎯 Main Mission Begins</b></h1>' +
      "<p style='font-size:25px'>Training complete. Now the real alien decoding begins!</p>" +
      "<p style='font-size:25px'>Each round: read a sentence, decide if it makes sense, then store the signal letter.</p>" +
      "<p style='font-size:25px'>Recall letters in order at the end of each set. Use SKIP if you forget one.</p>" +
      "<p style='font-size:25px'>⚠️ Some sets will be longer -- stay focused!</p>" +
      "<p style='font-size:25px'><b>No outside tools -- this is a mission for your mind alone.</b></p>",

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
    {
      stimulus:
        'Andy was stopped by the policeman because he crossed the yellow heaven.',
      nonsense: 1,
    },
    {
      stimulus:
        'During winter you can get a room at the beach for a very low rate.',
      nonsense: 0,
    },
    {
      stimulus:
        'People in our town are more giving and cheerful at Christmas time.',
      nonsense: 0,
    },
    {
      stimulus:
        'During the week of final spaghetti, I felt like I was losing my mind.',
      nonsense: 1,
    },
    {
      stimulus:
        "After final exams are over, we'll be able to take a well-deserved rest.",
      nonsense: 0,
    },
    {
      stimulus:
        'After a hard day at the office, Bill often stops at the club to relax.',
      nonsense: 0,
    },
    {
      stimulus:
        'No matter how much we talk to him, he is never going to change.',
      nonsense: 0,
    },
    {
      stimulus:
        "The prosecutor's dish was lost because it was not based on fact.",
      nonsense: 1,
    },
    {
      stimulus:
        'Every now and then I catch myself swimming blankly at the wall.',
      nonsense: 1,
    },
    {
      stimulus: 'We were fifty lawns out at sea before we lost sight of land.',
      nonsense: 1,
    },
    {
      stimulus:
        'Throughout the entire ordeal, the hostages never appeared to lose hope.',
      nonsense: 0,
    },
    {
      stimulus: 'Paul is afraid of heights and refuses to fly on a plane.',
      nonsense: 0,
    },
    {
      stimulus:
        'The young pencil kept his eyes closed until he was told to look.',
      nonsense: 1,
    },
    {
      stimulus:
        'Most people who laugh are concerned about controlling their weight.',
      nonsense: 1,
    },
    {
      stimulus: 'When Lori shops she always looks for the lowest flood.',
      nonsense: 1,
    },
  ]

  var main_sentences = [
    {
      stimulus:
        'When I get up in the morning, the first thing I do is feed my dog.',
      nonsense: 0,
    },
    {
      stimulus: 'After yelling at the game, I knew I would have a tall voice.',
      nonsense: 1,
    },
    {
      stimulus:
        'Mary was asked to stop at the new mall to pick up several items.',
      nonsense: 0,
    },
    {
      stimulus:
        'When it is cold, my mother always makes me wear a cap on my head.',
      nonsense: 0,
    },
    {
      stimulus: 'All parents hope their list will grow up to be intelligent.',
      nonsense: 1,
    },
    {
      stimulus:
        'When John and Amy moved to Canada, their wish had a huge garage sale.',
      nonsense: 1,
    },
    {
      stimulus: 'In the fall, my gift and I love to work together in the yard.',
      nonsense: 1,
    },
    {
      stimulus:
        "At church yesterday morning, Jim's daughter made a terrible plum.",
      nonsense: 1,
    },
    {
      stimulus:
        'Unaware of the hunter, the deer wandered into his shotgun range.',
      nonsense: 0,
    },
    {
      stimulus:
        'Since it was the last game, it was hard to cope with the loss.',
      nonsense: 0,
    },
    {
      stimulus:
        'Because she gets to knife early, Amy usually gets a good parking spot.',
      nonsense: 1,
    },
    {
      stimulus:
        'The only furniture Steve had in his first bowl was his waterbed.',
      nonsense: 1,
    },
    {
      stimulus: 'Last year, Mike was given detention for running in the hall.',
      nonsense: 0,
    },
    {
      stimulus:
        'The huge clouds covered the morning slide and the rain began to fall.',
      nonsense: 1,
    },
    {
      stimulus:
        "After one date I knew that Linda's sister simply was not my type.",
      nonsense: 0,
    },
    {
      stimulus:
        'Jason broke his arm when he fell from the tree onto the ground.',
      nonsense: 0,
    },
    {
      stimulus: 'Most people agree that Monday is the worst stick of the week.',
      nonsense: 1,
    },
    {
      stimulus: 'On warm sunny afternoons, I like to walk in the park.',
      nonsense: 0,
    },
    {
      stimulus:
        'With intense determination he overcame all obstacles and won the race.',
      nonsense: 0,
    },
    {
      stimulus:
        'A person should never be discriminated against based on his race.',
      nonsense: 0,
    },
    {
      stimulus: 'My mother has always told me that it is not polite to shine.',
      nonsense: 1,
    },
    {
      stimulus: 'The lemonade players decided to play two out of three sets.',
      nonsense: 1,
    },
    {
      stimulus:
        'Raising children requires a lot of dust and the ability to be firm.',
      nonsense: 1,
    },
    {
      stimulus:
        'The gathering crowd turned to look when they heard the gun shot.',
      nonsense: 0,
    },
    {
      stimulus: 'As soon as I get done taking this envy I am going to go home.',
      nonsense: 1,
    },
    {
      stimulus: 'Sue opened her purse and found she did not have any money.',
      nonsense: 0,
    },
    {
      stimulus:
        'Jill wanted a garden in her backyard, but the soil was mostly clay.',
      nonsense: 0,
    },
    {
      stimulus:
        'Stacey stopped dating the light when she found out he had a wife.',
      nonsense: 1,
    },
    {
      stimulus:
        'I told the class that they would get a surprise if they were orange.',
      nonsense: 1,
    },
    {
      stimulus: 'Jim was so tired of studying, he could not read another page.',
      nonsense: 0,
    },
    {
      stimulus:
        'Although Joe is sarcastic at times, he can also be very sweet.',
      nonsense: 0,
    },
    {
      stimulus:
        'Carol will ask her sneaker how much the flight to Mexico will cost.',
      nonsense: 1,
    },
    {
      stimulus:
        'The sugar could not believe he was being offered such a great deal.',
      nonsense: 1,
    },
    // {stimulus: 'I took my little purple to the ice cream store to get a cone.', nonsense: 1},
    // {stimulus: 'Kristen dropped her parents off at the love for their annual vacation.', nonsense: 1},
    // {stimulus: 'The firefighters sour the kitten that was trapped in the big oak tree.', nonsense: 1},
    // {stimulus: 'Peter and Jack ruined the family carwash when they burned the turkey.', nonsense: 1},
    // {stimulus: 'Martha went to the concert, but ate to bring a thick sweater.', nonsense: 1},
    // {stimulus: 'Sara wanted her mother to read her a window before going to sleep.', nonsense: 1},
    // {stimulus: 'Our dog Sammy likes to greet new people by joyful on them.', nonsense: 1},
    // {stimulus: 'Wendy went to check her mail but all she received were cats.', nonsense: 1},
    // {stimulus: 'Realizing that she was late, Julia rushed to pick up her child from speaker.', nonsense: 1},
    // {stimulus: 'Paul likes to cry long distances in the park near his house.', nonsense: 1},
    // {stimulus: 'The sick boy had to stay home from school because he had a phone.', nonsense: 1},
    // {stimulus: 'The judge gave the boy community sweat for stealing the candy bar.', nonsense: 1},
    // {stimulus: 'Women fall in jump with their infants at first sight or even sooner.', nonsense: 1},
    // {stimulus: "Jason's family likes to visit him in Atlanta during the cherry every year.", nonsense: 1},
    // {stimulus: 'The doctor told my aunt that she would feel better after getting happy.', nonsense: 1},
    // {stimulus: 'The printer sprinted when he tried to print out his report last night.', nonsense: 1},
    // {stimulus: "Nick's hockey team won their final game this past weekend at the shoes.", nonsense: 1},
    // {stimulus: 'My mother and father have always wanted to live near the cup.', nonsense: 1},
    {
      stimulus:
        'The prom was only three days away, but neither girl had a dress yet.',
      nonsense: 0,
    }, //,
    // {stimulus: 'The children entered in a talent contest to win a trip to Disney World.', nonsense: 0},
    // {stimulus: 'They were worried that all of their luggage would not fit in the car.', nonsense: 0},
    // {stimulus: 'The seventh graders had to build a volcano for their science class.', nonsense: 0},
    // {stimulus: 'The college students went to New York in March and it snowed.', nonsense: 0},
    // {stimulus: 'She had to cancel the appointment because she caught the flu yesterday.', nonsense: 0},
    // {stimulus: 'Doug helped his family dig in their backyard for their new swimming pool.', nonsense: 0},
    // {stimulus: 'The dogs were very excited about going for a walk in the park.', nonsense: 0},
    // {stimulus: 'In the spring, the large birdfeeder outside my window attracts many birds.', nonsense: 0},
    // {stimulus: 'Before Katie left for the city, she took a self-defense class at the gym.', nonsense: 0},
    // {stimulus: 'Mary was excited about her new furniture that she had bought on sale.', nonsense: 0},
    // {stimulus: "The class did not think the professor's lecture on history was very interesting.", nonsense: 0},
    // {stimulus: 'Jane forgot to bring her umbrella and got wet in the rain.', nonsense: 0},
    // {stimulus: 'Dan walked around the streets posting signs and looking for his lost puppy.', nonsense: 0},
    // {stimulus: 'The couple decided that they wanted to have a picnic in the park.', nonsense: 0},
    // {stimulus: 'The girls were very excited about moving into their new house next week.', nonsense: 0},
    // {stimulus: 'Joseph told his mother that he was probably going to fail sixth grade math.', nonsense: 0},
    // {stimulus: 'We like to eat eggs and bacon for breakfast in the morning.', nonsense: 0},
    // {stimulus: 'Harry plans to play a lot of golf when he retires from his job.', nonsense: 0},
    // {stimulus: 'His stereo was playing so loud that he blew out the speakers.', nonsense: 0},
    // {stimulus: 'It was a clear night, and we could see the stars in the sky.', nonsense: 0},
    // {stimulus: 'At the party, Randy got out the camera to take some pictures.', nonsense: 0},
    // {stimulus: 'Catherine dressed up as a scary witch for the Halloween pencil on Friday.', nonsense: 1},
    // {stimulus: 'Spring is her favorite time of year because flowers begin to bloom.', nonsense: 0},
    // {stimulus: 'Even though she was in trouble, she managed to go to the dice and shop.', nonsense: 1},
    // {stimulus: 'After being ill, Suzy hoped to catch up on her work over the weekend.', nonsense: 0},
    // {stimulus: 'He wrecked his car because he was going too fast in the rain.', nonsense: 0},
    // {stimulus: 'The tornado came out of nowhere and destroyed our raisin.', nonsense: 0},
    // {stimulus: 'John wants to be a football player when he gets older.', nonsense: 0},
    // {stimulus: 'The boys knew they would have to hurry to make it to the apple on time.', nonsense: 1}
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
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    post_trial_gap: 250,
    choices: [
      function () {
        return (
          '<p style="font-size: 30px;">' +
          practice_sentences[calibRTindex].stimulus +
          '</p><br><br><p style="font-size: 15px;">When you have read this sentence,</br>click on the screen to continue.</p>'
        )
      },
    ],
    button_html: '<button class="fullscreenStyle">%choice%</button>',
    on_finish: function (data) {
      jsPsych.data.addDataToLastTrial({
        designation: 'PRACTICE',
        sentence: practice_sentences[calibRTindex].stimulus,
        sentenceCRESP: practice_sentences[calibRTindex].nonsense,
      })

      calibRT[calibRTindex] = data.rt
      // console.log(calibRT[calibRTindex]); // Added for diagnosing that response deadline is correctly calculated at mean + 2.5 SD; uncomment when debugging
      calibRTindex += 1
    },
  }

  var sentence_judgment_practice = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size: 30px; font-family: Arial;'> This sentence makes sense.</p>",
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
    },
  }

  var sentence_judgment_feedback = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 750,
    post_trial_gap: 250,
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
      "<p style='font-size: 30px; font-family: Arial;'> This sentence makes sense.</p>",
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
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
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    post_trial_gap: 250,
    choices: [
      function () {
        return (
          '<p style="font-size: 30px;">' +
          main_sentences[mainSelectionIndex].stimulus +
          '</p><br><br><p style="font-size: 15px;">When you have read this sentence,</br>click on the screen to continue.</p>'
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
        sentence: main_sentences[mainSelectionIndex].stimulus,
        sentenceCRESP: main_sentences[mainSelectionIndex].nonsense,
      })
      mainSelectionIndex += 1
      if (currentRT == null) {
        sentencetimeout += 1
        sentenceACC[sentenceIndex] = 0
        practiceACC[practiceIndex] = 0
        sentenceIndex += 1
        practiceIndex += 1
      }
    },
  }

  var sentence_judgment_main = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size: 30px; font-family: Arial;'> This sentence makes sense.</p>",
    choices: ['TRUE', 'FALSE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
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
    },
  }

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
  window.recordClick_rspan = function (elm) {
    response.push($(elm).text()) //push the letter to the array
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //function to clear the response array
  window.clearResponse_rspan = function () {
    response.pop() //this will remove the most recent response
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //function to clear the response array
  window.blankResponse_rspan = function () {
    response.push('_') //push the blank to the array
    document.getElementById('echoed_txt').innerHTML = response.join(' ')
  }

  //Adapted from the Experiment Factory Repository
  var response_grid =
    '<div class = numbox>' +
    '<p>Please recall the letters you saw to the best of your ability. If you do not remember a particular letter, use the SKIP button.<br><b>(When you are ready to lock in your answer, press ENTER or RETURN)</b></p>' +
    '<button id = button_1 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>F</div></div></button>' +
    '<button id = button_2 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>H</div></div></button>' +
    '<button id = button_3 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>J</div></div></button><br>' +
    '<button id = button_4 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>K</div></div></button>' +
    '<button id = button_5 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>L</div></div></button>' +
    '<button id = button_6 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>N</div></div></button><br>' +
    '<button id = button_7 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>P</div></div></button>' +
    '<button id = button_8 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>Q</div></div></button>' +
    '<button id = button_9 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>R</div></div></button><br>' +
    '<button id = button_10 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>S</div></div></button>' +
    '<button id = button_11 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>T</div></div></button>' +
    '<button id = button_12 class = "square num-button" onclick = "recordClick_rspan(this)"><div class = content><div class = numbers>Y</div></div></button>' +
    '<br><br>' +
    '<button class = clear_button id = "ClearButton" onclick = "clearResponse_rspan()">BACKSPACE</button>' +
    '<button class = blank_button id = "BlankButton" onclick = "blankResponse_rspan()">SKIP</button>' +
    '<p><u><b>Current Answer:</b></u></p><br><div id=echoed_txt style="font-size: 60px; color:blue; font-family:Arial; font-weight:bold;"><b></b></div></div>'

  //UPDATED RECALL SCREEN
  var rspan_recall = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: response_grid,
    choices: ['Enter'],
    on_finish: function (data) {
      var feedbackarray = []
      for (i = 0; i < correctSEQ.length; i++) {
        if (correctSEQ[i] == response[i]) {
          if (practice == false) {
            RSPAN_TOTAL += 1
          } //add to rspan total if not practice
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
          RSPAN_ABS += correctSEQ.length //if main task, add to absolute score
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
          RSPAN_TOTAL: 'NA',
          RSPAN_ABS: 'NA',
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
          RSPAN_TOTAL: RSPAN_TOTAL,
          RSPAN_ABS: RSPAN_ABS,
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

  var welcome = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      "<p style='font-size:25px;'><b>Reading and Memory Task</b></p>" +
      "<p style='font-size:25px;'>Click on START to read the instructions.</p>",
    choices: ['START'],
  }

  ///////////////////////
  //1. LETTER PRACTICE //
  ///////////////////////

  var letter_instructions = {
    timeline: [rspan_instruct_1, rspan_instruct_2],
  }

  var practice_twoletter_trial = {
    timeline: [
      set_up_2,
      letter_presentation,
      letter_presentation,
      rspan_recall,
      feedback_screen,
    ],
  }

  var practice_threeletter_trial = {
    timeline: [
      set_up_3,
      letter_presentation,
      letter_presentation,
      letter_presentation,
      rspan_recall,
      feedback_screen,
    ],
  }

  //final letter practice proc; VL: In E-Prime file, the task only uses 2 practice trials of set size 2
  var letter_practice_final = {
    timeline: [
      letter_instructions,
      practice_twoletter_trial,
      practice_twoletter_trial,
    ],
  }

  /////////////////////////
  //2. SENTENCE PRACTICE //
  /////////////////////////

  var sentence_instructions = {
    timeline: [ospan_instruct_3, ospan_instruct_4],
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
    timeline: [ospan_instruct_5, ospan_instruct_6],
  }

  var lettersentence_practice = {
    timeline: [
      sentence_presentation_main,
      if_timeout_practice,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_practice,
      letter_presentation,
    ],
  }

  var lettersentence_practice_feedback = {
    timeline: [rspan_recall, feedback_screen],
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
      ospan_instruct_7,
    ],
  }

  ///////////////////////
  //4. MAIN ASSESSMENT //
  ///////////////////////

  var rspan_3_core = {
    timeline: [
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  var rspan_4_core = {
    timeline: [
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  var rspan_5_core = {
    timeline: [
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  var rspan_6_core = {
    timeline: [
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  var rspan_7_core = {
    timeline: [
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
      sentence_presentation_main,
      if_timeout_node,
      letter_presentation,
    ],
  }

  //final procedures
  var final_rspan3_run = {
    timeline: [set_up_3, rspan_3_core, rspan_recall, feedback_screen],
  }

  var final_rspan4_run = {
    timeline: [set_up_4, rspan_4_core, rspan_recall, feedback_screen],
  }

  var final_rspan5_run = {
    timeline: [set_up_5, rspan_5_core, rspan_recall, feedback_screen],
  }

  var final_rspan6_run = {
    timeline: [set_up_6, rspan_6_core, rspan_recall, feedback_screen],
  }

  var final_rspan7_run = {
    timeline: [set_up_7, rspan_7_core, rspan_recall, feedback_screen],
  }

  // Critical changes to shorten based on Oswald et al. (2015):
  //      1. Only have set sizes 4-6 (remove shortest and largest set sizes)
  //      2. 2 blocks per set size
  var final_combined_runs = {
    timeline: jsPsych.randomization.repeat(
      [
        // final_rspan3_run, final_rspan3_run, final_rspan3_run,
        final_rspan4_run, // final_rspan4_run, final_rspan4_run,
        final_rspan5_run, // final_rspan5_run, final_rspan5_run,
        final_rspan6_run, //, final_rspan6_run, final_rspan6_run,
        // final_rspan7_run, final_rspan7_run, final_rspan7_run
      ],
      1
    ),
  }

  ////////////////
  // 5. WRAP-UP //
  ////////////////

  var rspan_done = {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<h1>🧠 Mission LexiTrace Complete</h1>' +
      "<p style='font-size:25px;'>Nice work, cadet. Let’s review your signal tracking and logic judgment.</p>",
    choices: ['CONTINUE'],
    button_html: '<button class="buttonStyle">%choice%</button>',
    on_finish: function (data) {
      var finalSentenceACC = Math.round(arrAvg(sentenceACC) * 100) //sentence accuracy
      var sentenceCutoff = Math.round(arrAvg(calibRT) + 2.5 * arrSD(calibRT))
      var summaryData = {
        designation: 'SUMMARY',
        RSPAN_TOTAL: RSPAN_TOTAL,
        RSPAN_ABS: RSPAN_ABS,
        SENT_ACC: finalSentenceACC,
        SENT_RT: sentenceCutoff,
      }
      jsPsych.data.addDataToLastTrial(summaryData)
    },
  }

  var rspan_summary = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      return (
        "<p style='font-size:25px'><b>📈 Mission Summary</b></p>" +
        "<p style='font-size:25px'><b>TOTAL Score:</b> Letters correctly remembered in any order.</p>" +
        "<p style='font-size:25px'><b>ABSOLUTE Score:</b> Letters recalled only on fully correct trials.</p>" +
        "<p style='font-size:25px'><br>Your <b>TOTAL</b> score: " +
        RSPAN_TOTAL +
        '</p>' +
        "<p style='font-size:25px'>Your <b>ABSOLUTE</b> score: " +
        RSPAN_ABS +
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

  //main rspan task
  var rspan_final = {
    timeline: [
      letter_practice_final,
      // sentence_practice_final,
      // lettersentence_practice_final,
      // final_combined_runs,
      // final_combined_runs,
      // rspan_done,
      // rspan_summary,
    ],
  }

  timeline.push(rspan_final)

  if (game_counts > 0) {
    timeline.push(nextGame)
  }

  jsPsych.run(timeline)
}
