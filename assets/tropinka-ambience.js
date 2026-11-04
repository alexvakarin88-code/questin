/* Original, quiet ambient soundscape for «Тропинка». No external music files. */
(function(){
  if(window.__tropinkaAmbienceLoaded)return;
  window.__tropinkaAmbienceLoaded=true;
  var key="tropinka-ambient-enabled";
  var ctx=null,master=null,timer=null,active=false,closingTimer=null,step=0;
  var chords=[
    [261.63,329.63,392.00,493.88],
    [220.00,261.63,329.63,392.00],
    [174.61,220.00,261.63,329.63],
    [196.00,246.94,293.66,392.00]
  ];
  var melody=[659.25,587.33,523.25,587.33,659.25,783.99,698.46,587.33];
  function makeButton(){
    var b=document.createElement("button");
    b.type="button";b.className="tp-music-toggle";
    b.setAttribute("aria-pressed","false");
    b.setAttribute("aria-label","Включить спокойную волшебную музыку");
    b.textContent="♫ Включить волшебную музыку";
    b.addEventListener("click",function(){if(active)stop();else start(false);});
    document.body.appendChild(b);
    return b;
  }
  var button;
  function label(on){
    if(!button)return;
    button.textContent=on?"♫ Музыка включена · Выключить":"♫ Включить волшебную музыку";
    button.setAttribute("aria-pressed",on?"true":"false");
    button.setAttribute("aria-label",on?"Выключить спокойную волшебную музыку":"Включить спокойную волшебную музыку");
    button.title=on?"Выключить музыку":"Включить спокойную волшебную музыку";
  }
  function tone(freq,when,duration,volume,type,detune){
    if(!ctx||!master)return;
    var osc=ctx.createOscillator(),env=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type=type||"sine";osc.frequency.setValueAtTime(freq,when);
    if(detune)osc.detune.setValueAtTime(detune,when);
    filter.type="lowpass";filter.frequency.setValueAtTime(type==="triangle"?1050:1700,when);filter.Q.value=.35;
    env.gain.setValueAtTime(.0001,when);
    env.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+.75);
    env.gain.setValueAtTime(Math.max(.0002,volume),when+Math.max(.8,duration-.8));
    env.gain.exponentialRampToValueAtTime(.0001,when+duration);
    osc.connect(filter);filter.connect(env);env.connect(master);
    osc.start(when);osc.stop(when+duration+.05);
  }
  function bell(freq,when){
    if(!ctx||!master)return;
    var osc=ctx.createOscillator(),env=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type="sine";osc.frequency.setValueAtTime(freq,when);
    filter.type="lowpass";filter.frequency.setValueAtTime(2300,when);
    env.gain.setValueAtTime(.0001,when);
    env.gain.exponentialRampToValueAtTime(.009,when+.04);
    env.gain.exponentialRampToValueAtTime(.0001,when+2.1);
    osc.connect(filter);filter.connect(env);env.connect(master);
    osc.start(when);osc.stop(when+2.2);
  }
  function phrase(){
    if(!active||!ctx)return;
    var now=ctx.currentTime+.12, chord=chords[step%chords.length];
    chord.forEach(function(f,i){tone(f,now,7.8,.012,i===0?"triangle":"sine",i===3?3:0);});
    var offsets=[.8,2.0,3.35,4.75,6.2,7.1];
    offsets.forEach(function(offset,i){bell(melody[(step*2+i)%melody.length],now+offset);});
    step++;
  }
  async function start(fromSaved){
    if(active)return;
    try{
      var Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw new Error("Web Audio is not supported");
      ctx=new Audio();
      await ctx.resume();
      master=ctx.createGain();master.gain.setValueAtTime(.52,ctx.currentTime);master.connect(ctx.destination);
      active=true;step=0;phrase();timer=setInterval(phrase,8000);
      try{localStorage.setItem(key,"1");}catch(e){}
      label(true);
    }catch(e){
      active=false;label(false);
      if(button){button.textContent="♫ Нажмите, чтобы включить";button.title="Браузер не разрешил автоматический запуск звука";}
      if(!fromSaved)console.info("Tropinka ambience could not start:",e);
    }
  }
  function stop(){
    active=false;
    if(timer){clearInterval(timer);timer=null;}
    try{localStorage.setItem(key,"0");}catch(e){}
    label(false);
    if(ctx&&master){
      try{master.gain.setTargetAtTime(.0001,ctx.currentTime,.16);}catch(e){}
      var old=ctx;ctx=null;master=null;
      closingTimer=setTimeout(function(){try{old.close();}catch(e){}closingTimer=null;},550);
    }
  }
  document.addEventListener("DOMContentLoaded",function(){
    button=makeButton();label(false);
    var saved=false;try{saved=localStorage.getItem(key)==="1";}catch(e){}
    if(saved)start(true);
  });
})();