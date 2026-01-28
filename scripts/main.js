const smudge = document.getElementById('smudge');
const obombo = document.getElementById('obombo');
const ms = document.getElementById('ms');
const ghostSpeed = document.getElementById('ghost-speed');
const bloodMoon = document.getElementById('blood-moon');
const state = new TapState();

const SPEEDS = [
    0.5,
    0.75,
    1.0,
    1.25,
    1.50
];

var smudge_timer_running = false, obombo_state = false, new_state = false, obombo_timer_running = false, ghost_speed_toggle;
var smudge_now = 0, obombo_now = 0, ghost_speed = 2;

smudge.onclick = function(e){
    smudge_now = new Date().getTime();
    if(smudge_timer_running){
        smudge_timer_running = false;
        return;
    }
    
    smudge_timer_running = true;
};

obombo.onclick = function(e){
    obombo_now = new Date().getTime();
    if(obombo_timer_running){
        obombo_timer_running = false;
        this.textContent = 'NONE';
        return;
    }

    obombo_timer_running = true;
    this.textContent = 'CALM';
};

ms.onclick = function(e){
    const out = state.tapAndCompute();
    if(out){
        let ms = out.ms/SPEEDS[ghost_speed];

        if(bloodMoon.checked){
            ms = ms*0.85;
        }

        this.textContent = `${ms.toFixed(2)} m/s`;
        return;
    }
    this.textContent = '0.00 m/s';
};

setInterval(function(){
    const time = new Date().getTime();

    if(smudge_timer_running && time >= smudge_now){
        smudge.textContent = msToMsm(time - smudge_now);
    }

    if(obombo_timer_running && time >= obombo_now){
        const elapsed = time - obombo_now;

        if(elapsed < 60000){
            if(obombo_state !== false){
                obombo_state = false;
                obombo.textContent = 'CALM';
            }
        }else{
            const phase = elapsed - 60000;

            if(phase % 120000 < 16){
                obombo_state = !obombo_state;
                obombo.textContent = obombo_state ? 'AGGRO' : 'CALM';
            }
        }
    }
}, 16);

ghostSpeed.onmousedown = function(event){
    ghost_speed_toggle = true;
};

window.onmousemove = function(event){
    if(ghost_speed_toggle){
        let percent = (((event.clientX-ghostSpeed.getBoundingClientRect().left)/ghostSpeed.clientWidth)*100);
        ghost_speed = getGhostSpeed(percent);
        ghostSpeed.style.setProperty('--seek', getRelativeSeek(percent)+'%');
    }
};

window.onmouseup = function(event){
    ghost_speed_toggle = false;
};

ghostSpeed.onclick = function(event){
    let percent = (((event.clientX-this.getBoundingClientRect().left)/this.clientWidth)*100);
    ghost_speed = getGhostSpeed(percent);
    this.style.setProperty('--seek', getRelativeSeek(percent)+'%');
};

function getRelativeSeek(num){
    switch(true){
        case (num >= 0 && num < 12.5):
            return 0;

        case (num >= 12.5 && num < 37.5):
            return 25;

        case (num >= 37.5 && num < 62.5):
            return 50;

        case (num >= 62.5 && num < 87.5):
            return 75;

        default:
            return 100;
    }
}

function getGhostSpeed(num){
    switch(true){
        case (num >= 0 && num < 12.5):
            return 0;

        case (num >= 12.5 && num < 37.5):
            return 1;

        case (num >= 37.5 && num < 62.5):
            return 2;

        case (num >= 62.5 && num < 87.5):
            return 3;

        default:
            return 4;
    }
}

function msToMsm(ms){
    let totalSeconds = Math.floor(ms / 1000);
    let centiseconds = Math.floor(((ms % 1000) + 5) / 10); // rounded
    
    if(centiseconds === 100){
        centiseconds = 0;
        totalSeconds += 1;
    }
    
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    
    return (
        String(minutes).padStart(2, '0') +
        ':' +
        String(seconds).padStart(2, '0') +
        '.' +
        String(centiseconds).padStart(2, '0')
    );
}
