const toArray = (x) => Array.prototype.slice.call(x, 0);
const $ = (a, b) => typeof b == 'undefined' ? document.querySelector(a) : a.querySelector(b);
const $$ = (a, b) => toArray(typeof b == 'undefined' ? document.querySelectorAll(a) : a.querySelectorAll(b));

let data = null;

const settingsKeys = ['include_na', 'include_jp', 'show_upgrades',
    'show_passives', 'show_names', 'show_class'];

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

function startGame(settings) {
    if (!data) {
        fetch('https://fgo-data.netlify.com/servant_details_and_skills.json')
        .then(r => r.json())
        .then(json => { data = json; startGame(); },
            errorHandler('Failed to load servant data.'));
        return;
    }
    showView('view-game');
    return 1;
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
    const startBtn = $('#start');
    startBtn.addEventListener('click', () => {
        startBtn.classList.add('is-loading');
        startGame(getGameSettings())
    });
});