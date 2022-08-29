const toArray = (x) => Array.prototype.slice.call(x, 0);
const $ = (a, b) => typeof b == 'undefined' ? document.querySelector(a) : a.querySelector(b);
const $$ = (a, b) => toArray(typeof b == 'undefined' ? document.querySelectorAll(a) : a.querySelectorAll(b));

const VERSION = '0.2.0';

let startBtn;
let answerInput; 
let answerBtn; 
let resultMessage;
let shareLink;

let scoreCorrect, scoreTotal, scoreText;

let awesomplete;

let allData = null;
let servantIDs;
let servantNames;

let showingAnswer;
let currServant;
let nextIndex;

let numCorrect;
let numTotal;

let rng;

const settingsKeys = ['include_na', 'include_jp', 'show_upgrades',
    'show_passives', 'show_names', 'show_class', 'seed'];
    
function skillImage(iconId) {
    return 'https://kazemai.github.io/fgo-vz/common/images/SkillIcon/SkillIcon_'+iconId+'.png';
}

function servantImage(kazemaiId) {
    return 'https://kazemai.github.io/fgo-vz/common/images/Servants/Status/'+kazemaiId+'/status_servant_1.png';
}

function showEl(el) { el.classList.remove('is-hidden'); }
function hideEl(el) { el.classList.add('is-hidden'); }

function makeSkillElement(name, iconId) {
    /*<div class="skill-icon" aria-label="Transient Wall of Snowflakes" data-balloon-pos="up">
                    <img src="http://kazemai.github.io/fgo-vz/common/images/SkillIcon/SkillIcon_400.png">
                  </div>*/
    return crel('div', {'class': 'skill-icon', 'aria-label': name, 'data-balloon-pos': 'up-left'},
        crel('img', {src: skillImage(iconId)}));
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
    if (passives.length == 0) {
        passivesEl.innerHTML = '<div>(none)</div>';
    } else {
        passives.map(([name, icon]) => makeSkillElement(name, icon))
            .forEach(passivesEl.appendChild.bind(passivesEl));
    }
}

function preload(url) { (new Image()).src = url; }

function preloadServantSkills(svt) {
    servant = allData[svt];
    const skills = servant.skills;
    const passives = servant.passives;
    skills.forEach((list, i) => 
        list.forEach(([name, icon]) => preload(skillImage(icon))));
    passives.forEach(([name, icon]) => preload(skillImage(icon)));
}

function showView(view) {
    $$('.view:not(.'+view+')').forEach(hideEl);
    showEl($('.view.'+view+''));
}

function errorHandler(message) {
    return function() {
        $('#error-text').textContent = message;
        showEl($('#error'));
    };
}

function showNextServant() {
    showingAnswer = false;
    answerInput.readOnly = false; 
    answerInput.value = '';
    answerBtn.textContent = 'Guess';
    answerBtn.classList.remove('is-link');

    if (nextIndex >= servantIDs.length) {
        shuffleArray(servantIDs);
        nextIndex = 0;
    }

    showServantSkills(servantIDs[nextIndex]);
    nextIndex++;
    if (servantIDs[nextIndex]) preloadServantSkills(servantIDs[nextIndex]);
    
    hideEl(resultMessage);
    $(resultMessage, 'img').src = servantImage(currServant.kaz_id);
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
    showEl(resultMessage);

    if (correct) numCorrect++;
    numTotal++;
    scoreCorrect.textContent = numCorrect;
    scoreTotal.textContent = numTotal;
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
        fetch('https://fgo-data.netlify.app/servant_details_and_skills.json')
        .then(r => r.json())
        .then(json => { allData = json; startGame(settings); },
            errorHandler('Failed to load servant data.'))
        .then(() => startBtn.classList.remove('is-loading'));
        return;
    }

    if (!(settings.include_jp || settings.include_na)) {
        showEl($('#choose-servants'));
        return;
    }
    hideEl($('#choose-servants'));
    
    servantIDs = Object.keys(allData).filter(svt => 
        (settings.include_na && allData[svt].release == 'NA')
        || (settings.include_jp && allData[svt].release == 'JP'));
    servantIDs = servantIDs.filter(svt => allData[svt].skills[0].length > 0);
    // servantIDs = servantIDs.slice(0, 3);
    servantNames = servantIDs.map(id => allData[id].name);
    awesomplete.list = servantNames;
    
    const settingsCSS = $('#settings-css');
    let css = '';
    if (!settings.show_passives) css += '.passives-container {display:none}';
    if (!settings.show_names) css += '.skill-icon::before, .skill-icon::after {display: none}';
    if (!settings.show_upgrades) css += '.skills .skill-icon:not(:first-child) {display:none}';
    settingsCSS.innerHTML = '';
    crel(settingsCSS, {}, css);
    
    nextIndex = 0;
    numCorrect = 0;
    numTotal = 0;
    const randomSeed = settings.seed == null || settings.seed === '';
    rng = new Math.seedrandom(settings.seed, randomSeed);
    shuffleArray(servantIDs, rng);
    showNextServant();
    showView('view-game');
}

function getGameSettings() {
    const settings = {};
    settingsKeys.forEach(key => {
        const el = $('#'+key);
        settings[key] = el.type=='checkbox' ? el.checked : el.value;
    });
    return settings;
}

function applyGameSettingsFromURL() {
    const params = new URLSearchParams(window.location.search);
    const settingsStr = params.get('settings');
    if (!settingsStr) return;
    
    let settings;
    try {
        settings = JSON.parse(decodeURIComponent(settingsStr));
    } catch (e) { console.warn('Error loading settings from URL:', e); return; }
    settings.forEach((val, i) => {
        const el = $('#'+settingsKeys[i]);
        const valKey = el.type=='checkbox' ? 'checked' : 'value';
        el[valKey] = val;
        el.disabled = true;
    });

    showEl($('.locked-help'));
}

const baseURL = `${location.protocol}//${location.host}${location.pathname}`;

function updateShareLink(ev) {
    const settingsJSON = JSON.stringify(Object.values(getGameSettings()));
    $('.share-link').value = baseURL + '?settings='
        + encodeURIComponent(settingsJSON);

    if (ev !== false) {
        shareLink.classList.remove('share-link-transition');
        shareLink.style.borderColor = '#3273dc';
        
        setTimeout(() => {
            shareLink.classList.add('share-link-transition');
            shareLink.style.borderColor = '';
        }, 0);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    $('#version').textContent = VERSION;
    showView('view-start');
    
    $$('.message-header > .delete').forEach(del => 
        del.addEventListener('click', () => hideEl(del.parentNode.parentNode))
    );

    /** @type HTMLButtonElement */
    startBtn = $('#start');
    $('#settings-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        startGame(getGameSettings())
    });

    shareLink = $('.share-link')
    shareLink.addEventListener('focus', ev => {
        ev.target.select();
    });
    
    applyGameSettingsFromURL();
    updateShareLink(false);
    $$('#settings-form input:not([type="text"])').forEach(el => 
        el.addEventListener('input', updateShareLink));
    $$('#settings-form input[type="text"]').forEach(el => 
        el.addEventListener('input', debounce(updateShareLink, 200)));

    $('.locked-help a').addEventListener('click', () => {
        window.location.href = baseURL;
    });

    answerInput = $('#answer-input');
    awesomplete = new Awesomplete(answerInput, {list: ['NOT LOADED'], minChars: 1, autoFirst: true});
    
    answerBtn = $('#answer-form .guess');
    $('#answer-form').addEventListener('submit', submitGuess);

    resultMessage = $('#result');
    scoreCorrect = $('.score-correct');
    scoreTotal = $('.score-total');
    scoreText = $('.score-text');
});
