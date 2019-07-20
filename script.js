const toArray = (x) => Array.prototype.slice.call(x, 0);
const $ = (a, b) => typeof b == 'undefined' ? document.querySelector(a) : a.querySelector(b);
const $$ = (a, b) => toArray(typeof b == 'undefined' ? document.querySelectorAll(a) : a.querySelectorAll(b));

let startBtn;
let answerInput; 
let answerBtn; 
let resultMessage;

let scoreCorrect, scoreTotal, scoreText;

let allData = null;
let servantIDs;
let servantNames;

let showingAnswer;
let currServant;
let nextIndex;

let numCorrect;

const settingsKeys = ['include_na', 'include_jp', 'show_upgrades',
    'show_passives', 'show_names', 'show_class'];
    
function makeSkillElement(name, iconId) {
    /*<div class="skill-icon" aria-label="Transient Wall of Snowflakes" data-balloon-pos="up">
                    <img src="http://kazemai.github.io/fgo-vz/common/images/SkillIcon/SkillIcon_400.png">
                  </div>*/
    return crel('div', {'class': 'skill-icon', 'aria-label': name, 'data-balloon-pos': 'up'},
        crel('img', {src: 'https://kazemai.github.io/fgo-vz/common/images/SkillIcon/SkillIcon_'+iconId+'.png'}));
}

function showServantSkills(svt) {
    currServant = allData[svt];
    const skills = currServant.skills;
    const passives = currServant.passives;
    skills.forEach((list, i) => {
        /** @type HTMLElement */
        const el = $('#skill-'+(i+1));
        el.innerHTML = '';
        list.map(([name, icon]) => makeSkillElement(name, icon))
            .forEach(el.appendChild.bind(el))
    });
    const passivesEl = $('.passives');
    passivesEl.innerHTML = '';
    passives.map(([name, icon]) => makeSkillElement(name, icon))
        .forEach(passivesEl.appendChild.bind(passivesEl));
}

function showView(view) {
    $$('.view:not(.'+view+')').forEach(el => {el.style.display = 'none'});
    $('.view.'+view+'').style.display = '';
}

function errorHandler(message) {
    return function() {
        $('#error-text').textContent = message;
        $('#error').style.display = '';
    };
}

function showNextServant() {
    showingAnswer = false;
    resultMessage.style.display = 'none';
    showServantSkills(servantIDs[nextIndex]);
    answerInput.readOnly = false; 
    answerInput.value = '';
    answerBtn.textContent = 'Guess';
    answerBtn.classList.remove('is-link');
    nextIndex++;

    $(resultMessage, 'img').src = `https://kazemai.github.io/fgo-vz/common/images/Servants/Status/${currServant.kaz_id}/status_servant_1.png`;
    $(resultMessage, '.result-name').textContent = currServant.name;
}

function showAnswer() {
    showingAnswer = true;
    answerInput.readOnly = true;
    answerBtn.textContent = 'Next';
    answerBtn.classList.add('is-link');
    
    const guess = answerInput.value.trim();
    const correct = guess === currServant.name;
    $(resultMessage, '.message-header').textContent = correct ? 'Correct' : 'Incorrect';
    resultMessage.className = 'message ' + (correct ? 'is-success' : 'is-danger');
    resultMessage.style.display = '';

    if (correct) numCorrect++;
    scoreCorrect.textContent = numCorrect;
    scoreTotal.textContent = nextIndex;
}

function submitGuess(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if (!showingAnswer) {
        showAnswer();
    } else {
        showNextServant();
    }
}

function startGame(settings) {
    if (!allData) {
        startBtn.classList.add('is-loading');
        fetch('https://fgo-data.netlify.com/servant_details_and_skills.json')
        .then(r => r.json())
        .then(json => { allData = json; startGame(settings); },
            errorHandler('Failed to load servant data.'))
        .then(() => startBtn.classList.remove('is-loading'));
        return;
    }
    showView('view-game');
    
    
    servantIDs = Object.keys(allData).filter(svt => 
        (settings.include_na && allData[svt].release == 'NA')
        || (settings.include_jp && allData[svt].release == 'JP'));
    servantNames = servantIDs.map(id => allData[id].name);
    new Awesomplete(answerInput, {list: servantNames, minChars: 1, });
    
    const settingsCSS = $('#settings-css');
    let css = '';
    if (!settings.show_passives) css += '.passives-container {display:none}';
    if (!settings.show_names) css += '.skill-icon::before, .skill-icon::after {display: none}';
    if (!settings.show_upgrades) css += '.skills .skill-icon:not(:first-child) {display:none}';
    settingsCSS.innerHTML = '';
    crel(settingsCSS, {}, css);
    
    nextIndex = 0;
    numCorrect = 0;
    shuffleArray(servantIDs);
    showNextServant();
}

function getGameSettings() {
    const settings = {};
    settingsKeys.forEach(key => {
        settings[key] = $('#'+key).checked
    });
    return settings;
}

document.addEventListener('DOMContentLoaded', () => {
    showView('view-start');
    
    $$('.message-header > .delete').forEach(del => 
        del.addEventListener('click', () => {del.parentNode.parentNode.style.display = 'none'})
    );

    /** @type HTMLButtonElement */
    startBtn = $('#start');
    startBtn.addEventListener('click', () => {
        startGame(getGameSettings())
    });

    answerInput = $('#answer-input');
    answerBtn = $('#answer-form button');
    $('#answer-form').addEventListener('submit', submitGuess);

    resultMessage = $('#result');
    scoreCorrect = $('.score-correct');
    scoreTotal = $('.score-total');
    scoreText = $('.score-text');
});