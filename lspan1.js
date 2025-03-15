function startGame(participantID, onGameEnd) {
    document.getElementById("experiment-container").innerHTML = "";

    const jsPsych = initJsPsych({
            on_finish: function () {
                const filename = `data_lspan_${participantID}.csv`;
                jsPsych.data.get().localSave('csv', filename);

                // 结束实验，清空画面
                onGameEnd();
            }
        });

    jsPsych.randomization.setSeed('listeningspan');
    var timeline = [];

    var enter_fullscreen = {
        type: jsPsychFullscreen,
        fullscreen_mode: true
    }

    var get_participant_id = {
        type: jsPsychSurveyText,
        questions: [
            {prompt: 'Please enter the participant ID:', required: true, name: 'participant_id'}
        ],
        on_finish: function(data) {
            jsPsych.data.addProperties({
                participant_id: data.response.participant_id
            })

            subject = data.response.participant_id;
        }
    };


    ///////////////////////////////////////////
    // DEFINE TIMELINE AND GENERAL VARIABLES //
    ///////////////////////////////////////////

    //general variables for use throughout the experiment
    const arrAvg = arr => arr.reduce((a,b) => a + b, 0) / arr.length //simple constant for calculating mean of an array
    const arrSD = arr => Math.sqrt(arr.map(x => (x - arrAvg(arr)) ** 2).reduce((a,b) => a + b) / (arr.length-1)); // simple constant for calculating SD of an array; added by VL
    const arrSum = arr => arr.reduce((a,b) => a + b, 0) //simple constant for calculating sum of an array
    const makeRepeated = (arr, repeats) => [].concat(...Array.from({ length: repeats }, () => arr)); //constant to repeat elements in array
    var LSPAN_TOTAL = 0; //variable for tracking the LSPAN TOTAL score
    var LSPAN_ABS = 0; //variable for tracking the LSPAN ABSOLUTE score
    var fullCorrect; //to determine whether the entire trial was correct (for ABS score)
    var mainSelectionIndex = 0; //variable for selecting sentences from the main list
    var currentLetter; //current letter to be presented to participants
    var correctSEQ = []; //array for storing the correct letter sequence to be recalled
    var correctSEQfiles = []; // VL: array for storing the sound files corresponding to the letter sequence to be recalled
    var designation; //designation (for use in tagging different events in the data output)
    var useDynamicRT = true; //when false, standard timeout window of 10 seconds for reading the sentence; when true, mean RT from practice is used
    var calibRT = []; //array for storing RTs for practice sentences (to set timeout window for main task)
    var calibRTindex = 0; //variable for indexing sentence number during the sentence-only practice (for calculating mean RT)
    var letters = ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y']; //possible letters to be recalled
    var practice; //for dynamic data
    var showSentACC; //for displaying sentence accuracy on feedback
    var currRun; //for debugging/making sure the correct number of letters are shown
    var online = 0; 
    var subject; // Subject ID

    // create index variable to reference which letter is to be presented from the list of `letters`
    var indexLetters = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

    // VL: function to "pluck" the letters and the sound files associated with the indices iPluck from the array LetterArray
    function pluck(LetterArray, iPluck) {
        var lettersToDisplay = [],
            i = 0,
            len = iPluck.length;

        // loop that fills lettersToDisplay with the letter/file from LetterArray that corresponds to the iPluck index
        for (; i < len; i++) {
            lettersToDisplay.push(LetterArray[iPluck[i]]);
        }

        return lettersToDisplay;
    }

    // function to randomly select 'n' letters from the array without replacement
    // VL: for listening span, we change letterList to indexList as a more informative variable because this function now takes indices and not the actual letters; functionally no change
    function getSample(indexList, n) {
        return jsPsych.randomization.sampleWithoutReplacement(indexList, n);
    }

    // VL: define the filenames for the letter and sentence sound files
    var filename_letters = ['sound/f.wav', 'sound/h.wav', 'sound/j.wav', 'sound/k.wav', 'sound/l.wav', 'sound/n.wav',
                            'sound/p.wav', 'sound/q.wav', 'sound/r.wav', 'sound/s.wav', 'sound/t.wav', 'sound/y.wav']
    var filename_sentences_practice = ['sound/finger.wav', 'sound/lettuce.wav', 'sound/chair.wav', 'sound/pot.wav', 'sound/dentist.wav', 
                                        'sound/vanilla.wav', 'sound/verb.wav', 'sound/ring.wav', 'sound/shark.wav', 'sound/strawberry.wav', 
                                        'sound/red.wav', 'sound/cloud.wav', 'sound/yard.wav', 'sound/hydrogen.wav', 'sound/spice.wav'];
    var filename_sentences_main = ['sound/airplane.wav', 'sound/apple.wav', 'sound/aunt.wav', 'sound/basement.wav', 'sound/carrot.wav', 
                                    'sound/cat.wav', 'sound/cave.wav', 'sound/ceiling.wav', 'sound/coal.wav', 'sound/cricket.wav', 
                                    'sound/day.wav', 'sound/decade.wav', 'sound/dog.wav', 'sound/dollar.wav', 'sound/elephant.wav', 
                                    'sound/eye.wav', 'sound/football.wav', 'sound/gold.wav', 'sound/governor.wav', 'sound/gun.wav', 
                                    'sound/hand.wav', 'sound/hat.wav', 'sound/hawk.wav', 'sound/heart.wav', 'sound/hill.wav', 
                                    'sound/hockey.wav', 'sound/jail.wav', 'sound/knife.wav', 'sound/lake.wav', 'sound/linen.wav', 
                                    'sound/mouse.wav', 'sound/neck.wav', 'sound/newspaper.wav', 'sound/novel.wav', 'sound/nurse.wav', 
                                    'sound/oak.wav', 'sound/oil.wav', 'sound/organ.wav', 'sound/peach.wav', 'sound/potato.wav', 
                                    'sound/rifle.wav', 'sound/roof.wav', 'sound/ruby.wav', 'sound/saw.wav', 'sound/scarf.wav', 
                                    'sound/sister.wav', 'sound/skillet.wav', 'sound/snow.wav', 'sound/sofa.wav', 'sound/son.wav', 
                                    'sound/spider.wav', 'sound/tent.wav', 'sound/tie.wav', 'sound/tin.wav', 'sound/violin.wav', 
                                    'sound/volcano.wav', 'sound/water.wav', 'sound/yellow.wav', 'sound/zebra.wav'];

    // PRELOAD ALL AUDIO FILES
    var preload = {
        type: jsPsychPreload,
        audio: [filename_letters, filename_sentences_practice, filename_sentences_main]
    }

    ////////////////
    //INSTRUCTIONS//
    ////////////////

    //Letter Instructions
    var lspan_instruct_1 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'><b>Listening and Memory Task</b></p><p style='font-size:25px'>In this task, you will try to memorize letters you hear while you also listen to sentences.</p>" +
                "<p style='font-size:25px'>In the next few minutes, you will have some practice to get you familiar with how the task works.</p>" +
                "<p style='font-size:25px'>We will begin by practicing the letter part of the task.</p>",
        choices: ['CONTINUE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>',
        on_finish: function(){practice = true; showSentACC = false;} //switching practice to true for dynamic data, switching sentence feedback to false
    };

    var lspan_instruct_2 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>For this practice set, you will hear letters one at a time. Try to remember each letter in the order you hear them.</p>" +
                "<p style='font-size:25px'>After you hear 2-3 letters, you will see a response screen.</p>" +
                "<p style='font-size:25px'>Your job is to report the letters you heard <b>in order</b>. If you do not remember a particular letter, you will have the option to leave it blank.</p>",
        choices: ['CONTINUE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>'
    };

    var lspan_instruct_3 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>Remember, it is very important to get the letters in the same order as you hear them.</p>" +
                "<p style='font-size:25px'>When you're ready, you may begin the letter practice.</p>",
        choices: ['BEGIN PRACTICE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>'
    };

    //Sentence Instructions
    var lspan_instruct_4 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>Now you will practice doing the sentence listening part of the experiment.</p>" +
                "<p style='font-size:25px'>A fixation cross will appear on the screen, signalling that you will hear a sentence like the following:</p><p style='font-size: 30px;'><b>An article of clothing that is worn on the foot is a sock.</b></p>" +
                "<p style='font-size:25px'>You should listen to the sentence carefully and determine if what it says is true or not. The above sentence is true.</p>" +
                "<p style='font-size:25px'>An example of a sentence that is not true would be:</p><p style='font-size: 30px;'><b>A part of the body that is attached to the shoulder is the toe.</b></p>" +
                "<p style='font-size:25px'>After you hear the sentence, the cross will disappear.</p>",
        choices: ['CONTINUE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>'
    };

    var lspan_instruct_5 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>You will then see the following prompt displayed on the next screen:</p>" +
                "<p style='font-size:30px'>Is the sentence true?</p>" +
                "<p style='font-size:25px'>along with a box marked TRUE and a box marked FALSE.</p>" +
                "<p style='font-size:25px'>If the sentence on the previous screen was true, click on the TRUE box. If the sentence was false, click on the FALSE box.</p>" +
                "<p style='font-size:25px'>After you click on one of the boxes, the computer will tell you if you made the right choice.</p>",
        choices: ['CONTINUE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>'
    };

    var lspan_instruct_6 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>It is VERY important that you correctly answer whether the sentences are true or false.</p>" +
                "<p style='font-size:25px'>When you are ready, click on the button below to practice.</p>",
        choices: ['BEGIN PRACTICE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>'
    };

    //Combined Instructions
    var lspan_instruct_7 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>Now you will practice doing both parts of the experiment at the same time.</p>" +
                "<p style='font-size:25px'>In the next practice set, you will hear one sentence. Once you make your decision about the sentence,</br>you will hear a letter. Try and remember the letter.</p>" +
                "<p style='font-size:25px'>In the previous section where you only heard the sentences, the computer computed your average time to judge whether the sentence was true or false.</br>If you take significantly longer than your average time, the computer will automatically move you onto the next letter part, </br>thus counting your judgment on the sentence as an error.</p>" +
                "<p style='font-size:25px'>Therefore it is VERY important to listen to the sentences carefully and judge them as quickly and accurately as possible.</p>",
        choices: ['CONTINUE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>'
    };

    var lspan_instruct_8 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>After you hear a letter, you will hear another sentence, and then another letter.</p>" +
                "<p style='font-size:25px'>At the end of each set of letters and sentences, you will recall the letters you heard to the best of your ability.</br>Remember, try your best to get the letters in the correct order.</p>" +
                "<p style='font-size:25px'>It is important to work QUICKLY and ACCURATELY on the sentences.</p>" +
                "<p style='font-size:25px'> After the letter recall screen, you will be given feedback about your performance</br>regarding the number of letters you correctly recalled.</p>",
        choices: ['CONTINUE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>'
    };

    var lspan_instruct_9 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>On the feedback screen, you will also see a number in the top right corner.</br>This indicates your percent correct for answering whether the sentences were true for the entire experiment.</p>" +
                "<p style='font-size:25px'>It is VERY important for you to keep this at least at 85%.</br>For our purposes, we can only use data where the participant was at least 85% accurate on the sentences.</p>" +
                "<p style='font-size:25px'>Therefore, please try your best to perform at least at 85% on the sentences</br>WHILE doing your best to recall as many letters as possible.</p>" +
                "<p style='font-size:25px'>Click the button to practice.</p>",
        choices: ['BEGIN PRACTICE'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>',
        on_finish: function(){showSentACC = true;} //switching to show sentence accuracy for letter+sentence practice
    };

    //Wrap-up / final screen before main task
    var lspan_instruct_10 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>That is the end of practice.</p>" +
                "<p style='font-size:25px'>The real trials will be just like the practice trials you just completed.</br>First, you will hear a sentence, then a letter to remember.</p>" +
                "<p style='font-size:25px'>When the recall screen appears, report the letters in the order you heard them. If you forget a letter, remember to use the BLANK button to move to the next letter.</p>" +
                "<p style='font-size:25px'>Some of the sets will have more sentences and letters than others.</br>It is important that you do your best on both the sentences and the letter recall parts of the experiment.</p>" +
                "<p style='font-size:25px'>Remember for the sentences you must work as QUICKLY and ACCURATELY as possible.</br>Remember to keep your sentence accuracy at 85% or above.</p>" +
                "<p style='font-size:25px'><b>Do NOT use any external aid (e.g., paper and pencil, word processor) to write down the letters.</b></br>This task is meant to be challenging.</p>" +
                "<p style='font-size:25px'>Click the button to begin.</p>",
        choices: ['BEGIN'],
        post_trial_gap: 250,
        button_html: '<button class="buttonStyle">%choice%</button>',
        on_finish: function(){practice = false;} //switching practice to false for dynamic data
    };


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
        {stimulus: 'sound/finger.wav', nonsense: 1}, {stimulus: 'sound/lettuce.wav', nonsense: 0}, {stimulus: 'sound/chair.wav', nonsense: 0}, 
        {stimulus: 'sound/pot.wav', nonsense: 1}, {stimulus: 'sound/dentist.wav', nonsense: 0}, {stimulus: 'sound/vanilla.wav', nonsense: 0}, 
        {stimulus: 'sound/verb.wav', nonsense: 1}, {stimulus: 'sound/ring.wav', nonsense: 0}, {stimulus: 'sound/shark.wav', nonsense: 1}, 
        {stimulus: 'sound/strawberry.wav', nonsense: 1}, {stimulus: 'sound/red.wav', nonsense: 1}, {stimulus: 'sound/cloud.wav', nonsense: 1}, 
        {stimulus: 'sound/yard.wav', nonsense: 0}, {stimulus: 'sound/hydrogen.wav', nonsense: 0}, {stimulus: 'sound/spice.wav', nonsense: 1}
    ];

    var main_sentences = [
        {stimulus: 'sound/airplane.wav', nonsense: 1}, {stimulus: 'sound/apple.wav', nonsense: 1}, {stimulus: 'sound/aunt.wav', nonsense: 0}, {stimulus: 'sound/basement.wav', nonsense: 1}, 
        {stimulus: 'sound/carrot.wav', nonsense: 0}, {stimulus: 'sound/cat.wav', nonsense: 0}, {stimulus: 'sound/cave.wav', nonsense: 0}, {stimulus: 'sound/ceiling.wav', nonsense: 1}, 
        {stimulus: 'sound/coal.wav', nonsense: 1}, {stimulus: 'sound/cricket.wav', nonsense: 0}, {stimulus: 'sound/day.wav', nonsense: 0}, {stimulus: 'sound/decade.wav', nonsense: 1}, 
        {stimulus: 'sound/dog.wav', nonsense: 0}, {stimulus: 'sound/dollar.wav', nonsense: 0}, {stimulus: 'sound/elephant.wav', nonsense: 0}, {stimulus: 'sound/eye.wav', nonsense: 0}, 
        {stimulus: 'sound/football.wav', nonsense: 1}, {stimulus: 'sound/gold.wav', nonsense: 1}, {stimulus: 'sound/governor.wav', nonsense: 0}, {stimulus: 'sound/gun.wav', nonsense: 1}, 
        {stimulus: 'sound/hand.wav', nonsense: 0}, {stimulus: 'sound/hat.wav', nonsense: 1}, {stimulus: 'sound/hawk.wav', nonsense: 1}, {stimulus: 'sound/heart.wav', nonsense: 1}, 
        {stimulus: 'sound/hill.wav', nonsense: 0}, {stimulus: 'sound/hockey.wav', nonsense: 1}, {stimulus: 'sound/jail.wav', nonsense: 0}, {stimulus: 'sound/knife.wav', nonsense: 1}, 
        {stimulus: 'sound/lake.wav', nonsense: 1}, {stimulus: 'sound/linen.wav', nonsense: 1}, {stimulus: 'sound/mouse.wav', nonsense: 1}, {stimulus: 'sound/neck.wav', nonsense: 0}, 
        {stimulus: 'sound/newspaper.wav', nonsense: 0}, {stimulus: 'sound/novel.wav', nonsense: 0}, {stimulus: 'sound/nurse.wav', nonsense: 0}, {stimulus: 'sound/oak.wav', nonsense: 0}, 
        {stimulus: 'sound/oil.wav', nonsense: 1}, {stimulus: 'sound/organ.wav', nonsense: 1}, {stimulus: 'sound/peach.wav', nonsense: 0}, {stimulus: 'sound/potato.wav', nonsense: 0}, 
        {stimulus: 'sound/rifle.wav', nonsense: 1}, {stimulus: 'sound/roof.wav', nonsense: 1}, {stimulus: 'sound/ruby.wav', nonsense: 1}, {stimulus: 'sound/saw.wav', nonsense: 1}, 
        {stimulus: 'sound/scarf.wav', nonsense: 0}, {stimulus: 'sound/sister.wav', nonsense: 0}, {stimulus: 'sound/skillet.wav', nonsense: 0}, {stimulus: 'sound/snow.wav', nonsense: 1}, 
        {stimulus: 'sound/sofa.wav', nonsense: 0}, {stimulus: 'sound/son.wav', nonsense: 0}, {stimulus: 'sound/spider.wav', nonsense: 0}, {stimulus: 'sound/tent.wav', nonsense: 0}, 
        {stimulus: 'sound/tie.wav', nonsense: 1}, {stimulus: 'sound/tin.wav', nonsense: 1}, {stimulus: 'sound/violin.wav', nonsense: 1}, {stimulus: 'sound/volcano.wav', nonsense: 0}, 
        {stimulus: 'sound/water.wav', nonsense: 0}, {stimulus: 'sound/yellow.wav', nonsense: 1}, {stimulus: 'sound/zebra.wav', nonsense: 1}
    ];

    //Now we will randomize the main timeline variables. We will then sequentially go through the (randomized) list in the main task
    main_sentences = jsPsych.randomization.repeat(main_sentences, 1);

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
        choices: "NO_KEYS",
        stimulus: '<p style="font-size:75px;">...</p>',
        on_finish: function(data){
            var IndicesToPlay = getSample(indexLetters, 2); //select two random letters
            correctSEQ = [];
            correctSEQfiles = [];
            correctSEQ = pluck(letters, IndicesToPlay);
            correctSEQfiles = pluck(filename_letters, IndicesToPlay);
            numIndex = 0; //reset the numIndex
            currRun = 0; //reset debugger
        }
    };

    var set_up_3 = {
        type: jsPsychHtmlKeyboardResponse,
        trial_duration: 1000,
        choices: "NO_KEYS",
        stimulus: '<p style="font-size:75px;">...</p>',
        on_finish: function(data){
            var IndicesToPlay = getSample(indexLetters, 3); //select three random letters
            correctSEQ = [];
            correctSEQfiles = [];
            correctSEQ = pluck(letters, IndicesToPlay);
            correctSEQfiles = pluck(filename_letters, IndicesToPlay);
            numIndex = 0; //reset the numIndex
            currRun = 0; //reset debugger
        }
    };

    var set_up_4 = {
        type: jsPsychHtmlKeyboardResponse,
        trial_duration: 1000,
        choices: "NO_KEYS",
        stimulus: '<p style="font-size:75px;">...</p>',
        on_finish: function(data){
            var IndicesToPlay = getSample(indexLetters, 4); //select four random letters
            correctSEQ = [];
            correctSEQfiles = [];
            correctSEQ = pluck(letters, IndicesToPlay);
            correctSEQfiles = pluck(filename_letters, IndicesToPlay);
            numIndex = 0; //reset the numIndex
            currRun = 0; //reset debugger
        }
    };

    var set_up_5 = {
        type: jsPsychHtmlKeyboardResponse,
        trial_duration: 1000,
        choices: "NO_KEYS",
        stimulus: '<p style="font-size:75px;">...</p>',
        on_finish: function(data){
            var IndicesToPlay = getSample(indexLetters, 5); //select five random letters
            correctSEQ = [];
            correctSEQfiles = [];
            correctSEQ = pluck(letters, IndicesToPlay);
            correctSEQfiles = pluck(filename_letters, IndicesToPlay);
            numIndex = 0; //reset the numIndex
            currRun = 0; //reset debugger
        }
    };

    var set_up_6 = {
        type: jsPsychHtmlKeyboardResponse,
        trial_duration: 1000,
        choices: "NO_KEYS",
        stimulus: '<p style="font-size:75px;">...</p>',
        on_finish: function(data){
            var IndicesToPlay = getSample(indexLetters, 6); //select six random letters
            correctSEQ = [];
            correctSEQfiles = [];
            correctSEQ = pluck(letters, IndicesToPlay);
            correctSEQfiles = pluck(filename_letters, IndicesToPlay);
            numIndex = 0; //reset the numIndex
            currRun = 0; //reset debugger
        }
    };

    var set_up_7 = {
        type: jsPsychHtmlKeyboardResponse,
        trial_duration: 1000,
        choices: "NO_KEYS",
        stimulus: '<p style="font-size:75px;">...</p>',
        on_finish: function(data){
            var IndicesToPlay = getSample(indexLetters, 7); //select seven random letters
            correctSEQ = [];
            correctSEQfiles = [];
            correctSEQ = pluck(letters, IndicesToPlay);
            correctSEQfiles = pluck(filename_letters, IndicesToPlay);
            numIndex = 0; //reset the numIndex
            currRun = 0; //reset debugger
        }
    };

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
        choices: "NO_KEYS",
        trial_ends_after_audio: true,
        on_start: function(){currentLetter = correctSEQ[numIndex];},
        stimulus: function(){return correctSEQfiles[numIndex];},
        // prompt: '<p style="font-size: 30px;">+</p>', // Return just a fixation cross (so effectively a blank screen, which was done in James et al. (2018) MATLAB code); not implemented because it would appear-reappear for every letter and blinking effect is distracting
        data: {letterSeen: currentLetter},
        on_finish: function(){
            numIndex += 1;
            currRun += 1; //for debugging purposes
        }
    };

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

    var sentenceRESP; //button pressed to indicate whether the sentence made sense
    var sentenceCRESP; //whether the sentence indeed makes sense (yes/no)
    var senPracticeCorrect = 0; //running tally of correctly answered practice sentences
    var sentencetimeout = 0; //running tally of sentences in which a timeout is recorded (reading error)
    var sentenceACC = []; //this is the array that will carry the official tally of sentence accuracy for the main task
    var sentenceIndex = 0; //index for current sentence in the main task
    var practiceACC = []; //this is the array that will carry the official tally of sentence accuracy for the letter+sentence practice task
    var practiceIndex = 0; //index for current sentence in the practice task

    //SENTENCE-ONLY PRACTICE SCREENS
    var sentence_presentation_practice = {
        type: jsPsychAudioButtonResponse,
        stimulus: [function(){ return practice_sentences[calibRTindex].stimulus}],
        trial_ends_after_audio: true,
        response_allowed_while_playing: false,
        post_trial_gap: 250,
        choices: [function(){ return '<p style="font-size: 30px;">+</p>';}], // Return just a fixation cross (so effectively a blank screen, which was done in James et al. (2018) MATLAB code)
        button_html: '<button class="fullscreenStyle">%choice%</button>',
        on_finish: function(){

            jsPsych.data.addDataToLastTrial({
                designation: "PRACTICE",
                sentence: practice_sentences[calibRTindex].stimulus,
                sentenceCRESP: practice_sentences[calibRTindex].nonsense
                });
        }
    };

    var sentence_judgment_practice = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size: 30px; font-family: Arial;'>Is the sentence true?</p>",
        choices: ["TRUE", "FALSE"],
        button_html: '<button class="buttonStyle">%choice%</button>',
        on_finish: function(data) {
            sentenceRESP = data.response;
            sentenceCRESP = jsPsych.data.get().last(2).values()[0].sentenceCRESP;
            console.log(sentenceRESP, sentenceCRESP);
                if(sentenceRESP == sentenceCRESP) {
                    data.correct = 1;
                    senPracticeCorrect += 1;
                } else {
                    data.correct = 0;
                }

            // Calibration occurs during presentation of the prompt so transferred recording of calibration RT in here from `sentence_presentation_practice`
            calibRT[calibRTindex] = data.rt;
            console.log(calibRT[calibRTindex]); // Added for diagnosing that response deadline is correctly calculated at mean + 2.5 SD; uncomment when debugging
            calibRTindex += 1;
        }
    };

    var sentence_judgment_feedback = {
        type: jsPsychHtmlKeyboardResponse,
        trial_duration: 750,
        post_trial_gap: 250,
        choices: "NO_KEYS",
        stimulus: function(){
        var last_sentence_correct = jsPsych.data.get().last(1).values()[0].correct;
        if(last_sentence_correct){
        return '<p style="color:green; font-size: 35px">Correct</p>';
        } else {
        return '<p style="color:red; font-size: 35px">Incorrect</p>';
        }
    }
    };

    var overall_practice_feedback = {
        type: jsPsychHtmlButtonResponse,
        post_trial_gap: 250,
        stimulus: function(){
            if(senPracticeCorrect > 12) {
                return '<p style="font-size: 25px;">You responded correctly on ' + senPracticeCorrect + ' of ' + calibRTindex + ' sentences. Good job!</p>';
            } else {
                return '<p style="font-size: 25px;">You only responded correctly on ' + senPracticeCorrect + ' of ' + calibRTindex + ' sentences.</p><p style="font-size: 20px;"><b>In the main task, you must try harder to answer accurately.</b></p>';}
            },
        choices: ['CONTINUE'],
        button_html: '<button class="buttonStyle">%choice%</button>'
    };


    //LETTER+SENTENCE PRACTICE SCREENS
    var sentence_judgment_practice_combined = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size: 30px; font-family: Arial;'>Is the sentence true?</p>",
        choices: ["TRUE","FALSE"],
        button_html: '<button class="buttonStyle">%choice%</button>',
        trial_duration: function(){if(useDynamicRT == false){ return 10000; } else { return Math.round(arrAvg(calibRT) + 2.5*arrSD(calibRT));}}, //10-second timeout window OR mean RT from practice, depending on 'useDynamicRT' (mean RT + 2.5SD)
        on_finish: function(data) {
            sentenceCRESP = jsPsych.data.get().last(2).values()[0].sentenceCRESP;
            sentenceRESP = data.response;
            if(sentenceRESP == sentenceCRESP) {
                data.correct = 1;
                practiceACC[practiceIndex] = 1;
            } else {
        data.correct = 0;
                practiceACC[practiceIndex] = 0;
            }
            practiceIndex += 1;

        }
    };

    // VL: Not used in listening span because timeout happens during when the judgment prompt is shown
    var if_timeout_practice = {
        timeline: [sentence_judgment_practice_combined],
        conditional_function: function(){
            var data = jsPsych.data.get().last(1).values()[0];
            if(data.rt == null){
                return false;
            } else {
                return true;
            }
        }
    };

    /////////////////
    //MAIN SCREENS //
    /////////////////

    var sentence_presentation_main = {
        type: jsPsychAudioButtonResponse,
        stimulus: [function() { return main_sentences[mainSelectionIndex].stimulus;}],
        post_trial_gap: 250,
        choices: [function(){ return '<p style="font-size: 30px;">+</p>';}], // Return just a fixation cross (so effectively a blank screen, which was done in James et al. (2018) MATLAB code)
        button_html: '<button class="fullscreenStyle">%choice%</button>',
        trial_ends_after_audio: true,
        response_allowed_while_playing: false,
        on_finish: function(){
            
            jsPsych.data.addDataToLastTrial({
                designation: "MAIN",
                sentence: main_sentences[mainSelectionIndex].stimulus,
                sentenceCRESP: main_sentences[mainSelectionIndex].nonsense
                });
                mainSelectionIndex +=1;
            
        }
        };

    var sentence_judgment_main = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size: 30px; font-family: Arial;'>Is the sentence true?</p>",
        choices: ["TRUE","FALSE"],
        button_html: '<button class="buttonStyle">%choice%</button>',
        trial_duration: function(){if(useDynamicRT == false){ return 10000; } else { return Math.round(arrAvg(calibRT) + 2.5*arrSD(calibRT));}}, // 10-second timeout window OR mean RT from practice, depending on 'useDynamicRT' (mean RT + 2.5SD); property moved here from `sentence_presentation_main`
        on_finish: function(data) {
            // VL: Because the timeout occurs during the prompt/judgment phase, this section was moved from the `sentence_presentation_main` object to here
            var currentRT = data.rt;
            if (currentRT == null) {
                sentencetimeout += 1;
                sentenceACC[sentenceIndex] = 0;
                practiceACC[practiceIndex] = 0;
                sentenceIndex += 1;
                practiceIndex += 1;
            }

            // VL: Need to contrast the case for which RT was collected (i.e., valid, non-timeout trial), so original code was enclosed in a conditional
            //     that complements the conditional above
            if (currentRT != null) {
                sentenceRESP = data.response;
                sentenceCRESP = jsPsych.data.get().last(2).values()[0].sentenceCRESP;
                if(sentenceRESP == sentenceCRESP) {
                    data.correct = 1;
                    sentenceACC[sentenceIndex] = 1;
                } else {
                    data.correct = 0;
                    sentenceACC[sentenceIndex] = 0;
                }
                sentenceIndex += 1;
            }
        }
    };

    // VL: Not used in listening span because timeout happens during when the judgment prompt is shown
    var if_timeout_node = {
        timeline: [sentence_judgment_main],
        conditional_function: function(){
            var data = jsPsych.data.get().last(1).values()[0];
            if(data.rt == null){
                return false;
            } else {
                return true;
            }
        }
    };

    ////////////////////////////
    ///// RESPONSE SCREENS /////
    ////////////////////////////

    /*
    These response screens will show 'n' response boxes (corresponding
    to the number of letters participants saw). Participants will then
    be asked to type in the letters IN ORDER. If a particular letter
    is not remembered, they are instructued to leave this box blank.
    */

    var response = []; //this is the array we will use to store letter strings
    var trialCorrect = []; //for storing which letters were correct

    //function to push button responses to array
    window.recordClick = function(elm) {
            response.push(($(elm).text())) //push the letter to the array
            document.getElementById("echoed_txt").innerHTML = response.join(" ");
        }

    //function to clear the response array
    window.clearResponse = function() {
            response.pop(); //this will remove the most recent response
            document.getElementById("echoed_txt").innerHTML = response.join(" ");
        }

    //function to clear the response array
    window.blankResponse = function() {
            response.push('_'); //push the blank to the array
            document.getElementById("echoed_txt").innerHTML = response.join(" ");
        }


    //Adapted from the Experiment Factory Repository
    var response_grid =
    '<div class = numbox>' +
    '<p>Please recall the letters you saw to the best of your ability. If you do not remember a particular letter, use the SKIP button.<br><b>(When you are ready to lock in your answer, press ENTER or RETURN)</b></p>' +
    '<button id = button_1 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>F</div></div></button>' +
    '<button id = button_2 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>H</div></div></button>' +
    '<button id = button_3 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>J</div></div></button><br>' +
    '<button id = button_4 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>K</div></div></button>' +
    '<button id = button_5 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>L</div></div></button>' +
    '<button id = button_6 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>N</div></div></button><br>' +
    '<button id = button_7 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>P</div></div></button>' +
    '<button id = button_8 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>Q</div></div></button>' +
    '<button id = button_9 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>R</div></div></button><br>' +
    '<button id = button_10 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>S</div></div></button>' +
    '<button id = button_11 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>T</div></div></button>' +
    '<button id = button_12 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>Y</div></div></button>' +
    '<br><br>' +
    '<button class = clear_button id = "ClearButton" onclick = "clearResponse()">BACKSPACE</button>'+
    '<button class = blank_button id = "BlankButton" onclick = "blankResponse()">SKIP</button>'+
    '<p><u><b>Current Answer:</b></u><br><br></p><div id=echoed_txt style="font-size: 60px; color:blue; font-family:Arial; font-weight:bold;"><b></b></div></div>'


    //UPDATED RECALL SCREEN
    var lspan_recall = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: response_grid,
        choices: ['Enter'],
        on_finish: function(data){
            var feedbackarray = [];
            for (i = 0; i < correctSEQ.length; i++) {
                if (correctSEQ[i] == response[i]) {
                    if(practice == false){LSPAN_TOTAL +=1;} //add to lspan total if not practice
                    trialCorrect[i] = 1;
                    feedbackarray[i] = correctSEQ[i].fontcolor("green");
                    } else {
                    feedbackarray[i] = correctSEQ[i].fontcolor("red");
                    trialCorrect[i] = 0;
                }
            }
            var tallyCorrect = arrSum(trialCorrect); //sum of correct responses (for feedback)
            if(arrAvg(trialCorrect) == 1) {
                fullCorrect = 1;
                if(practice == false){
                    LSPAN_ABS += correctSEQ.length; //if main task, add to absolute score
                    }
            }
            var data_resp = JSON.stringify(response); //stringify response for data output
            var data_cresp = JSON.stringify(correctSEQ); //stringify correct answer for data output
            var spanlength = correctSEQ.length; //how long the sequence was

            response = []; //clear the response for the next trial
            trialCorrect = []; //clear correct answer array for next trial

            if(practice == false){
                if (currRun < spanlength){
                    var debug = 'PROBLEM'
                } else {
                    var debug = 'NO PROBLEM'
                    }
            }

            if(practice == true){
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
                debug: debug
            };
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
                debug: debug
            };
            }
            jsPsych.data.addDataToLastTrial(responseData);
        }
    };


    /////////////////////////////
    ////// FEEDBACK SCREEN //////
    /////////////////////////////


    var feedback_screen = {
        type: jsPsychHtmlButtonResponse,
        stimulus: function(){
            //dynamic feedback for sentence accuracy portion
            if(showSentACC==true){
                if(practice==false){
                    var currentACC = Math.round(arrAvg(sentenceACC)*100);
                } else {
                    var currentACC = Math.round(arrAvg(practiceACC)*100);
                }
                if(currentACC > 84){var sentFont = "green"}else{var sentFont = "red"} //assign colored font based on 85% accuracy threshold
                    currentACC = currentACC.toString();
                    currentACC = currentACC + '%';
                    var sentenceTicker = '<p class = "senFB" id="senFB">Sentence:</br>'+ currentACC.fontcolor(sentFont) +'</p>';
                } else {
                    var sentenceTicker = '';
                }
            var getFeedback = jsPsych.data.get().last(1).values()[0].feedback;
            var feedbackText = getFeedback.join(" ");
            var pageText = '<p style="font-size: 60px; font-family:Arial; font-weight:bold;">' + feedbackText + '</p>' + sentenceTicker +
                            '<p style="font-size:28px"> You correctly identified ' + jsPsych.data.get().last(1).values()[0].numCorrect + ' of  '+jsPsych.data.get().last(1).values()[0].LENGTH+' letters.</p>';

            return[pageText];
            },
        choices: ['Continue'],
        button_html: '<button class="buttonStyle">%choice%</button>'
    };


    /////////////////////////////////
    //// DEFINE THE FINAL BLOCKS ////
    /////////////////////////////////

    ///////////////////////
    //1. LETTER PRACTICE //
    ///////////////////////

    var letter_instructions = {
        timeline: [lspan_instruct_1, lspan_instruct_2, lspan_instruct_3]
    };

    var practice_twoletter_trial = {
        timeline: [set_up_2, letter_presentation, letter_presentation, lspan_recall, feedback_screen]
        };


    var practice_threeletter_trial = {
        timeline: [set_up_3, letter_presentation, letter_presentation, letter_presentation,  lspan_recall, feedback_screen]
        };

    //final letter practice proc
    var letter_practice_final = {
        timeline: [letter_instructions, practice_twoletter_trial, practice_twoletter_trial, practice_threeletter_trial, practice_threeletter_trial]
    };

    /////////////////////////
    //2. SENTENCE PRACTICE //
    /////////////////////////

    var sentence_instructions = {
        timeline: [lspan_instruct_4, lspan_instruct_5, lspan_instruct_6]
    };

    var sentence_practice = {
        timeline: [
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback,
        sentence_presentation_practice, sentence_judgment_practice, sentence_judgment_feedback
        ]
    };

    //final sentence practice proc
    var sentence_practice_final = {
        timeline: [sentence_instructions, sentence_practice, overall_practice_feedback]
    };


    ////////////////////////////////
    //3. LETTER+SENTENCE PRACTICE //
    ////////////////////////////////

    var lettersentence_instructions = {
        timeline: [lspan_instruct_7, lspan_instruct_8, lspan_instruct_9]
    };

    // VL: Modified in listening span to replace `if_timeout_practice` with actual `sentence_judgment_practice_combined` because timeout occurs in judgment window
    var lettersentence_practice = {
        timeline: [
        sentence_presentation_main, sentence_judgment_practice_combined, letter_presentation,
        sentence_presentation_main, sentence_judgment_practice_combined, letter_presentation
        ]
    };

    var lettersentence_practice_feedback = {
        timeline: [lspan_recall, feedback_screen]
    };

    var letterpractice_run = {
        timeline: [set_up_2, lettersentence_practice, lettersentence_practice_feedback],
    };

    //final combined practice proc
    var lettersentence_practice_final = {
        timeline: [lettersentence_instructions, letterpractice_run, letterpractice_run, lspan_instruct_10]
        };

    ///////////////////////
    //4. MAIN ASSESSMENT //
    ///////////////////////

    // VL: NOTE -- replaced all instances of `if_timeout_node` in this section with actual `sentence_judgment_main` because timeout occurs in judgment window

    // VL: added a 2 set size "core" object
    var lspan_2_core = {
        timeline: [
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        ]
    }

    var lspan_3_core = {
        timeline: [
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation
    ]
    }

    var lspan_4_core = {
        timeline: [
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation
    ]
    }

    var lspan_5_core = {
        timeline: [
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation
    ]
    }

    var lspan_6_core = {
        timeline: [
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation
    ]
    }

    var lspan_7_core = {
        timeline: [
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation,
        sentence_presentation_main, sentence_judgment_main, letter_presentation
    ]
    }

    //final procedures
    // VL: Added a final_lspan2_run object
    var final_lspan2_run = {
        timeline: [set_up_2, lspan_2_core, lspan_recall, feedback_screen]
    }

    var final_lspan3_run = {
        timeline: [set_up_3, lspan_3_core, lspan_recall, feedback_screen]
    }

    var final_lspan4_run = {
        timeline: [set_up_4, lspan_4_core, lspan_recall, feedback_screen]
    }

    var final_lspan5_run = {
        timeline: [set_up_5, lspan_5_core, lspan_recall, feedback_screen]
    }

    var final_lspan6_run = {
        timeline: [set_up_6, lspan_6_core, lspan_recall, feedback_screen]
    }

    var final_lspan7_run = {
        timeline: [set_up_7, lspan_7_core, lspan_recall, feedback_screen]
    }

    // VL: Modified final combined runs to consist of 2 trials for each set size from 2-7
    var final_combined_runs = {
        timeline: jsPsych.randomization.repeat([
            final_lspan2_run, final_lspan2_run,
            final_lspan3_run, final_lspan3_run, 
            final_lspan4_run, final_lspan4_run, 
            final_lspan5_run, final_lspan5_run, 
            final_lspan6_run, final_lspan6_run, 
            final_lspan7_run, final_lspan7_run
            ], 1)
    }


    ////////////////
    // 5. WRAP-UP //
    ////////////////

    var lspan_done = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p style='font-size:25px'>Thank you for your responses.</br></br>This completes the reading and memory task.</p>",
        choices: ['CONTINUE'],
        button_html: '<button class="buttonStyle">%choice%</button>',
        on_finish: function(data){
        var finalSentenceACC = Math.round(arrAvg(sentenceACC)*100); //sentence accuracy
        var sentenceCutoff = Math.round(arrAvg(calibRT) + 2.5*arrSD(calibRT));
            var summaryData = {
            designation: 'SUMMARY',
                LSPAN_TOTAL: LSPAN_TOTAL,
                LSPAN_ABS: LSPAN_ABS,
                SENT_ACC: finalSentenceACC,
                SENT_RT: sentenceCutoff
            };
            jsPsych.data.addDataToLastTrial(summaryData);
        }
    };


    var lspan_summary = {
        type: jsPsychHtmlButtonResponse,
        stimulus: function(){return "<p style='font-size:25px'>There are two scores typically associated with this task. The first is your TOTAL score.</br>" +
                                        "This reflects the number of letters you correctly identified. The second is your ABSOLUTE SCORE.</br>This reflects the number of letters you correctly " +
                                        "identified <b>only on trials in which you correctly identified all of the letters.</b></p><p>For example, if you correctly recalled 3 of 4 letters on a trial,</br> " +
                                        "your TOTAL score would increase by 3 but your ABSOLUTE score would increase by 0, as you did not correctly identify all of the letters.</br>" +
                                        "If you correctly recalled 4 of 4 letters on a trial, both your TOTAL and ABSOLUTE score would increase by 4.</p>" +
                                        "<p style='font-size:25px'></br></br>Your <b>TOTAL</b> score was " + LSPAN_TOTAL + ".</p><p>Your <b>ABSOLUTE</b> score was " + LSPAN_ABS +".</p>";},
            choices: ['Exit'],
            button_html: '<button class="buttonStyle">%choice%</button>'
    };

    var conclusion = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '<p style="font-size:25px;">You are now finished with this task.</p>'+
                '<p style="font-size:25px;"><b> Press any key to exit.</b></p>',
        trial_duration: 20000,
        on_start: function(data) {
            if (online == 0) {
                var filename = "data_lspan_" + subject + ".csv";
                jsPsych.data.get().localSave('csv', filename);
            }
        }	
    };


    // main lspan task
    // VL: Added the preload object to preload all audio files before proceeding with the experiment
    var lspan_final = {
    	timeline: [enter_fullscreen, preload, get_participant_id,
    		letter_practice_final, sentence_practice_final, lettersentence_practice_final,
    		final_combined_runs, lspan_done, lspan_summary, 
            conclusion]
    };

    
    timeline.push(lspan_final);

    jsPsych.run(timeline);
}
