(function(){
  // ── SMS thread staged reveal + typing indicators, replayable ──
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = { 1: document.getElementById('typing1'), 2: document.getElementById('typing2') };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    Object.keys(typers).forEach(function(k){ typers[k].classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 250,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 950,  action: function(){ typers[1].classList.add('show'); } },
      { t: 1900, action: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2700, action: function(){ bubbles[2].classList.add('show'); } },
      { t: 3300, action: function(){ typers[2].classList.add('show'); } },
      { t: 4200, action: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playThread();
  });

  // Auto-play once the demo panel scrolls into view
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ playThread(); demoIO.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    demoIO.observe(thread);
  } else {
    playThread();
  }

  // ── Reveal-on-scroll for sections ──
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('visible'); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function(el){ revealIO.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('visible'); });
  }

  // ── Animated counter for the stat number (DOM nodes, no innerHTML) ──
  var statEl = document.querySelector('.stat-number');
  if (statEl && 'IntersectionObserver' in window){
    // Build the two text pieces once: a text node for the dollars, a span for the ember cents.
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    var counted = false;
    var statIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting && !counted){
          counted = true;
          var target = 8000;
          var dur = 1400;
          var start = null;
          function step(ts){
            if (!start) start = ts;
            var progress = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var val = Math.round(eased * target);
            var dollars = Math.floor(val / 1000);
            var cents = String(val % 1000).padStart(3, '0');
            dollarNode.textContent = '$' + dollars;
            centsSpan.textContent = ',' + cents;
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          statIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    statIO.observe(statEl);
  }
})();
// ── 7/16 sequencer contract override (patched 2026-07-21) ──
// play at ~15% visible; re-arm ONLY after full viewport exit; replay hard-resets.
;(function(){
  // Locate the SMS thread element (try common IDs in priority order)
  var threadIds = ['thread','thread-mobile','thread-desktop','sms-thread','sms-thread-desktop','demo-thread'];
  var threadEl = null;
  for (var _i = 0; _i < threadIds.length; _i++){
    threadEl = document.getElementById(threadIds[_i]);
    if (threadEl) break;
  }
  if (!threadEl) return; // no thread found — bail

  // Locate replay buttons (use the FIRST one if multiple)
  var replayBtns = Array.prototype.slice.call(document.querySelectorAll('[id*="replay"],[data-replay]'));

  function hardReset(){
    // Simulate a replay button click to let the existing implementation reset+play.
    // If no replay button exists, try firing a custom event the sequencer may listen for.
    if (replayBtns.length > 0){ replayBtns[0].click(); }
  }

  var _armed = true;
  function _autoplay(){
    if (!_armed) return;
    _armed = false;
    hardReset();
  }

  // playIO: fires when >= 15% of the thread is visible
  var playIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting && e.intersectionRatio >= 0.15){ _autoplay(); }
    });
  }, { threshold: 0.18 });
  playIO.observe(threadEl);

  // rearmIO: fires when thread fully exits the viewport (threshold:0 + !isIntersecting)
  var rearmIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting){ _armed = true; }
    });
  }, { threshold: 0 });
  rearmIO.observe(threadEl);

  // Check already-visible case at init time
  var _rect = threadEl.getBoundingClientRect();
  var _vh = window.innerHeight || document.documentElement.clientHeight;
  var _vis = Math.min(_rect.bottom, _vh) - Math.max(_rect.top, 0);
  if (_rect.height > 0 && _vis / _rect.height >= 0.15){ _autoplay(); }
})();
