/* Original ambient music + soft, synthesized giggle accents for «Тропинка».
   Browsers block audible autoplay on a first visit. We prewarm silently and
   start on the first user gesture; a previously enabled preference is retried on load. */
(function(){
  if(window.__tropinkaAmbienceLoaded)return;
  window.__tropinkaAmbienceLoaded=true;
  var key="tropinka-ambient-enabled";
  var ctx=null,master=null,timer=null,giggleTimer=null,active=false,step=0,button=null,unlocking=false;
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
    b.setAttribute("aria-label","Включить музыку и весёлые звуки");
    b.textContent="♫ Музыка и смех";
    b.title="Музыка включится после первого нажатия или прикосновения к сайту";
    b.addEventListener("click",function(){if(active)stop();else start(true);});
    document.body.appendChild(b);
    return b;
  }
  function label(on){
    if(!button)return;
    button.textContent=on?"♫ Музыка и смех · выключить":"♫ Музыка и смех";
    button.setAttribute("aria-pressed",on?"true":"false");
    button.setAttribute("aria-label",on?"Выключить музыку и весёлые звуки":"Включить музыку и весёлые звуки");
    button.title=on?"Выключить музыку и звуковые эффекты":"Музыка включится после первого нажатия или прикосновения к сайту";
  }
  function prepare(){
    if(ctx)return;
    var Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    try{
      ctx=new Audio();
      master=ctx.createGain();
      master.gain.setValueAtTime(.0001,ctx.currentTime);
      master.connect(ctx.destination);
      /* Silent prewarm: some browsers allow a muted context before user input. */
      var silent=ctx.createOscillator(),silence=ctx.createGain();
      silence.gain.value=0;silent.connect(silence);silence.connect(master);
      silent.start();silent.stop(ctx.currentTime+.03);
      ctx.resume().catch(function(){});
    }catch(e){ctx=null;master=null;}
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
    var now=ctx.currentTime+.12,chord=chords[step%chords.length];
    chord.forEach(function(f,i){tone(f,now,7.8,.012,i===0?"triangle":"sine",i===3?3:0);});
    var offsets=[.8,2.0,3.35,4.75,6.2,7.1];
    offsets.forEach(function(offset,i){bell(melody[(step*2+i)%melody.length],now+offset);});
    step++;
  }
  /* A short, original, cartoon-soft giggle made with formant-shaped synthesis.
     It is an illustrative sound effect, not a recording of a real child. */
  function giggleSyllable(when,f0,duration,level){
    if(!ctx||!master)return;
    var src=ctx.createOscillator(),amp=ctx.createGain();
    src.type="sawtooth";
    src.frequency.setValueAtTime(f0*1.08,when);
    src.frequency.exponentialRampToValueAtTime(f0*.88,when+duration);
    var formants=[
      {f:850,q:2.1,g:.36},
      {f:1450,q:2.4,g:.23},
      {f:2450,q:2.8,g:.10}
    ];
    formants.forEach(function(v){
      var bp=ctx.createBiquadFilter(),fg=ctx.createGain();
      bp.type="bandpass";bp.frequency.setValueAtTime(v.f,when);bp.Q.value=v.q;
      fg.gain.value=v.g;src.connect(bp);bp.connect(fg);fg.connect(amp);
    });
    amp.gain.setValueAtTime(.0001,when);
    amp.gain.exponentialRampToValueAtTime(level,when+.025);
    amp.gain.setValueAtTime(level*.8,when+duration*.42);
    amp.gain.exponentialRampToValueAtTime(.0001,when+duration);
    amp.connect(master);src.start(when);src.stop(when+duration+.02);
    /* Soft breath at the start makes the syllable less like a pure synth tone. */
    var length=Math.max(1,Math.floor(ctx.sampleRate*duration*.32));
    var buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
    for(var i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
    var noise=ctx.createBufferSource(),nf=ctx.createBiquadFilter(),ng=ctx.createGain();
    noise.buffer=buffer;nf.type="bandpass";nf.frequency.value=1900;nf.Q.value=.7;
    ng.gain.setValueAtTime(.0001,when);ng.gain.exponentialRampToValueAtTime(level*.16,when+.018);
    ng.gain.exponentialRampToValueAtTime(.0001,when+duration*.28);
    noise.connect(nf);nf.connect(ng);ng.connect(master);noise.start(when);noise.stop(when+duration*.3);
  }
  function giggle(){
    if(!active||!ctx)return;
    var now=ctx.currentTime+.15;
    var count=4+Math.floor(Math.random()*3),t=0;
    for(var i=0;i<count;i++){
      var d=.105+Math.random()*.055;
      var pitch=315+Math.random()*95+(i%2?24:-8);
      giggleSyllable(now+t,pitch,d,.0038+Math.random()*.0014);
      t+=d+.045+Math.random()*.045;
    }
    /* A tiny sparkle after the giggle. */
    bell(1046.5,now+t+.08);
  }
  function scheduleGiggle(){
    if(giggleTimer)clearTimeout(giggleTimer);
    if(!active)return;
    giggleTimer=setTimeout(function(){
      giggle();
      scheduleGiggle();
    },28000+Math.random()*18000);
  }
  async function start(fromButton){
    if(active||unlocking)return;
    unlocking=true;
    try{
      prepare();
      if(!ctx||!master)throw new Error("Web Audio is not supported");
      await ctx.resume();
      if(ctx.state!=="running")throw new Error("Audio is waiting for browser permission");
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(.48,ctx.currentTime,.45);
      active=true;step=0;phrase();timer=setInterval(phrase,8000);scheduleGiggle();
      try{localStorage.setItem(key,"1");}catch(e){}
      label(true);
    }catch(e){
      if(button){button.textContent="♫ Нажмите, чтобы включить";button.title="Браузер ждёт разрешения на воспроизведение звука";}
      if(!fromButton)console.info("Tropinka ambience is waiting for a user gesture:",e);
    }finally{unlocking=false;}
  }
  function stop(){
    active=false;
    if(timer){clearInterval(timer);timer=null;}
    if(giggleTimer){clearTimeout(giggleTimer);giggleTimer=null;}
    try{localStorage.setItem(key,"0");}catch(e){}
    label(false);
    if(ctx&&master){
      try{master.gain.setTargetAtTime(.0001,ctx.currentTime,.16);}catch(e){}
    }
  }
  function isButtonTarget(target){return !!(button&&(target===button||button.contains(target)));}
  function firstGesture(event){
    if(active||isButtonTarget(event.target))return;
    start(false);
  }
  document.addEventListener("DOMContentLoaded",function(){
    button=makeButton();label(false);prepare();
    var saved=false;try{saved=localStorage.getItem(key)==="1";}catch(e){}
    if(saved)start(false);
    ["pointerdown","keydown","touchstart"].forEach(function(type){
      document.addEventListener(type,firstGesture,{capture:true,passive:true});
    });
  });
})();