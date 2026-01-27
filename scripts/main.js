const smudge = document.getElementById('smudge');
const obombo = document.getElementById('obombo');
const ms = document.getElementById('ms');
const state = new TapState();

var smudge_timer_running = false, obombo_state = false, new_state = false, obombo_timer_running = false;
var smudge_now = 0, obombo_now = 0;

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
    obombo_timer_running = true;
    this.textContent = 'CALM';
};

ms.onclick = function(e){
    const out = state.tapAndCompute();
    if(out){
        this.textContent = `${out.ms.toFixed(2)} m/s`;
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
            if (obombo_state !== false) {
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
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(centiseconds).padStart(2, "0")
    );
}
