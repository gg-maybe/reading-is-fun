


$.fn.ignore = function(sel){
  return this.clone().find(sel||">*").remove().end();
};

// https://wicg.github.io/speech-api/#tts-section
window.utterances = [];


var u = new SpeechSynthesisUtterance();
utterances.push(u);
speechSynthesis.getVoices();
u.lang = 'zh';
u.rate = 1;

var speakDid = null;
var speakSid = null;
var currentDid = null;
var currentSid = null;
var plsCancel= false;


var autoplay = document.getElementById('autoplayon')

var myTimeout;
function myTimer() {
  console.log("timer")
  if(window.speechSynthesis.speaking && $('#play-button').attr('disabled')){
    console.log("timer->1")
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
    clearTimeout(myTimeout);
    myTimeout = setTimeout(myTimer, 10000);
  } else {
    console.log("timer->2")
    clearTimeout(myTimeout);
  }

}
u.onend = function(event) {
  console.log(u.text, 'ending')
  clearTimeout(myTimeout);
  if (plsCancel) {
    console.log('actually cancelling')
    plsCancel=false;
    return;
  }
  if(autoplay.checked) {
    console.log("autoplaying")
    playSpecificSpan(parseInt(speakDid)+1, null);
  } else {
    $('.speaking').removeClass('speaking');
  }

}
u.onstart = function(e){
  console.log('starting');
  plsCancel=false;
}

function playSpecificSpan(did, sid, $span) {
  myTimeout = setTimeout(myTimer, 10000);

  if (did == null) {
    did =  $(`p[pid]`).first().attr('did');
  }

  speakDid = did;

  if (sid==null){
    $span = $(`p[did=${speakDid}] span[sid]`).first()
    sid = $span.attr('sid');
  }

  speakSid = sid;
  if (!$span)
    $span = $(`p[did=${speakDid}] span[sid=${speakSid}]`);

  console.log('hey')
  speak($span);
  highlightRestOfP($span);
  playPauseButtons(true);
}
function playPauseButtons(playOn){
  if(playOn) {
    $('.play-button').attr('disabled',true)
    $('.pause-button').removeAttr('disabled')
  } else {
    $('.play-button').removeAttr('disabled')
    $('.pause-button').attr('disabled',true)
  }
}
window.onbeforeunload = function() {
  plsCancel= true;
  clearTimeout(myTimeout);
  this.speechSynthesis.cancel();
}
function changeSpeed(el) {
  u.rate = el.value;
}
function play(){
  speechSynthesis.resume();
  if(speechSynthesis.speaking){
    playPauseButtons(true);
  } else if (currentDid != null) {
    playSpecificSpan(currentDid, currentSid)
  } else {
    playSpecificSpan(null, null);
  }
}
function pause() {
  clearTimeout(myTimeout);
  speechSynthesis.pause();
  playPauseButtons(false);
}
function stop() {
  plsCancel = true;
  clearTimeout(myTimeout);
  console.log('stopping')
  speechSynthesis.cancel();
}
function start() {
  clearTimeout(myTimeout);
  myTimeout = setTimeout(myTimer, 10000);
  speechSynthesis.speak(u);
}

function speak(span) {
  console.log(u.voice)
  if(!u.voice) {
    u.voice = voices.currentVoice;
  }

  let start_txt = span.ignore('rt').text()
  if(autoplay.checked) {
    let txt = span.parent().ignore('rt').text()
    u.text = txt.substr(txt.indexOf(start_txt));
  } else {
    u.text = start_txt;
  }
  console.log(u.text);
  speechSynthesis.speak(u);
  return u
}


function highlightRestOfP(span) {
  $('.speaking').removeClass('speaking');
  span.addClass('speaking')
  if(autoplay.checked) {
    span.nextAll().addClass('speaking')
  }

}

var $glossary = $('#glossary');
var $glossaryData = $('#glossary-data');



function selectElement(element) {
  if (window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      var range = document.createRange();
      range.selectNodeContents(element);
      sel.addRange(range);
  } else if (document.selection) {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(element);
      textRange.select();
  }
}

function setGlossary(did, sid, end) {
  let txt = data[did]['text'];
  if(!end) end = txt.length+1;
  $glossaryData.empty();
  for (let i = sid; i < end; i++) {
    t = txt[i];
    let def = glossary[t];
    if(def) {
      let div = $(document.createElement('div'));
      div.html(`<span class="phrase"><ruby>${t}<rt>${rt[t]}</rt></ruby></span>
      <span class="def">${def}</span>`)
      $glossaryData.append(div)
    }

  }
}

function setTranslation(did) {
  $('#translate-data').text(data[did]['en'])
}

function setActiveSpan(span, forceSpeak) {
  //selectElement(span);
  let sid = parseInt(span.getAttribute('sid'));
  let did = $(span).closest('p').attr('did');
  setActive(did, sid, span, forceSpeak);
}

function setActive(did, sid, span, forceSpeak) {
  let original_sid = sid;
  if(sid == null || span == null) {
    span = $(`p[did=${did}] span[sid]`).first();
    sid = span.attr('sid');
  }
  if (!$glossary.hasClass('nodisplay') && (
      currentDid != did || currentSid != sid)) {
    if (original_sid == null){
      setGlossary(did, sid, null);
    } else {
      setGlossary(did, sid, parseInt($(span).next('span').attr('sid')));
    }

  }

  if(currentDid != did) {
    setTranslation(did);
  }

  if (forceSpeak) {
    stop();
    setTimeout(()=>{playSpecificSpan(did, sid, $(span))}, 300)
  }

  currentDid = did;
  currentSid = sid;
}



//function goNext(element)
$('p[pid]').click(function(e){
  if(e.target == this){
    $('.active').removeClass('active');
    $(this).addClass('active');
    setActive($(this).attr('did'))
    e.preventDefault();
  }
})
$('p[pid]').dblclick(function(e){
  if(e.target == this){
    setActive($(this).attr('did'), null, null, true);
    e.preventDefault();
  }
})


$('span.block').click(function(e){
  e.preventDefault();
  setActiveSpan(this);
  $('.active').removeClass('active');
  $(this).addClass('active')
})

$('span.block').dblclick(function(e){
  setActiveSpan(this, true);
  e.preventDefault();

})

  /*
  Option buttons
*/


// // From a god https://stackoverflow.com/a/41998497
var isSyncingLeftScroll = false;
var isSyncingRightScroll = false;
var leftDiv = document.getElementById('lang');
var leftChapter = leftDiv.children[0];
var rightDiv = document.getElementById('en-chapter');
var rightChapter = rightDiv.children[0];

// var numAnchors = 10;
// var leftAnchors = [];
// var rightAnchors = [];
// function getPPositions(div) {
//   let anchors = [];

//   pChildren = $(div).find('p[pid]');
//   let bottom = pChildren[pChildren.length-1]
//   let bottomOffset = bottom.position().top

//   let interval = bottom / numAnchors;
//   let offset = 0
//   for (let p of pChildren) {
//     let top = p.position().top;
//     if (top >= offset) {

//       offset += interval;
//     }
//   }


// }

leftDiv.onscroll = function(e) {
  if (!isSyncingLeftScroll && syncScroll && !altScroll) {
    isSyncingRightScroll = true;
    rightDiv.scrollTop = (this.scrollTop/leftDiv.scrollHeight - syncCorrector)*rightDiv.scrollHeight;
  }
  isSyncingLeftScroll = false;
}

rightDiv.onscroll = function(e) {
  if (!isSyncingRightScroll && syncScroll && !altScroll) {
    isSyncingLeftScroll = true;
    leftDiv.scrollTop = (this.scrollTop/rightDiv.scrollHeight + syncCorrector) *leftDiv.scrollHeight;
  }
  isSyncingRightScroll = false;
}

var syncScroll = true;
var syncCorrector = 0;  // left - right
var altScroll = false;
function toggleScroll() {
  syncScroll = !syncScroll;
  if(syncScroll) {
    $('.sync-scroll-button').addClass('toggle-on').attr('title', 'Synchronized scrolling is enabled.');
    syncCorrector = leftDiv.scrollTop/leftDiv.scrollHeight - rightDiv.scrollTop/rightDiv.scrollHeight;
  } else {
    $('.sync-scroll-button').removeClass('toggle-on').attr('title', 'Synchronized scrolling is disabled.');
  }
}


// Alt -scroll temporarily disables sync. Buggy af.
// document.addEventListener("keydown", function(e) {
//   if (e.altKey) {
//     altScroll = true;
//   }
// });


// document.addEventListener("keyup", function(e) {
//   if (e.key == 'Alt') {
//     altScroll = false;
//     syncCorrector = leftDiv.scrollTop/leftDiv.scrollHeight - rightDiv.scrollTop/rightDiv.scrollHeight;
//   }
// });

$('.sync-scroll-button').click(toggleScroll)


var voices = speechSynthesis.getVoices();
var langs = [];
var currentVoice = null;
function setVoiceOptions(){
  voices = speechSynthesis.getVoices();

  if(!voices || voices.length == 0) {
    setTimeout(setVoiceOptions, 100)
    return;
  }

  let $select = $('#voice-options')
  $('#lang p').each(function(){
    let l = this.getAttribute('lang')
    let lshort = l.substr(0, 2);
    if (lshort == 'en') {
      return;
    }
    if (langs.indexOf(l) < 0) langs.push(l)
    if (langs.indexOf(lshort) < 0) langs.push(lshort)
  })
  let numOptions = 0;
  let defaultOption = 0;
  voices.forEach((e,n)=>{
    if (langs.indexOf(e.lang) >= 0) {
      if (currentVoice == null) {
        currentVoice = n;
        defaultOption = numOptions;
      } else {
        if (voices[currentVoice].localService && !e.localService) {
          currentVoice = n;
          defaultOption = numOptions;
        }
      }
      addVoiceOption($select, e, n);
      numOptions++;
    }
    else {
      let l = e.lang.substr(0, 2);

      if (langs.indexOf(l) >= 0) {
        addVoiceOption($select, e, n);
        numOptions++;
      }
    }


  });

  if (currentVoice == null) {
    currentVoice = 0;
  }
  u.voice = voices[currentVoice];
  $('input[name=voice]')[defaultOption].checked = true;

}

function addVoiceOption(parent, e, n) {
  parent.append(`
    <input type="radio" name="voice" id="v${n}" value="${n}" onchange="setVoiceOption()">
    <label for="v${n}" class="${e.localService?'':'online'}">
    ${e.lang}: ${e.name}
    </label><br>`)
}
function setVoiceOption() {
  currentVoice = $('input[name=voice]:checked').val();
  u.voice = voices[currentVoice];
  if(speechSynthesis.speaking) {

    stop();
    start();
  }
}
setVoiceOptions();

$('#modalbg').click(function(e){
  if(e.target == this){
    $('#modal').addClass('nodisplay');
  }
})

function copyText(){
  let $copy = $('#copy-text');
  let copy = $copy[0];
  $copy.val($('.active').ignore('rt').text());
  $copy.select();
  copy.setSelectionRange(0, 99999); /*For mobile devices*/

  /* Copy the text inside the text field */
  document.execCommand("copy");
}