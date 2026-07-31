(function(){
  // ---- Mobile nav toggle ----
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', function(){
    var isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ navLinks.classList.remove('open'); navToggle.setAttribute('aria-expanded','false'); });
  });

  // ---- Toast helper ----
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toastText');
  var toastTimer;
  function showToast(msg){
    toastText.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 3200);
  }

  // ---- Destination cards -> jump to matching package ----
  document.querySelectorAll('.dest-card').forEach(function(card){
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(){
      var city = card.querySelector('.city').textContent.trim();
      var target = null;
      document.querySelectorAll('.package-card h3').forEach(function(h){
        if (h.textContent.indexOf(city) !== -1) target = h.closest('.package-card');
      });
      if (target){
        target.scrollIntoView({behavior:'smooth', block:'center'});
        target.style.transition = 'box-shadow .3s ease';
        target.style.boxShadow = '0 0 0 2px var(--brass)';
        setTimeout(function(){ target.style.boxShadow = ''; }, 1400);
      } else {
        document.getElementById('packages').scrollIntoView({behavior:'smooth'});
      }
    });
  });

  // ---- Multi-photo carousel dots (Machkund Duduma Waterfall) ----
  document.querySelectorAll('[data-carousel]').forEach(function(carouselCard){
    var slides = carouselCard.querySelectorAll('.slide');
    var dots = carouselCard.querySelectorAll('.carousel-dots .dot');
    dots.forEach(function(dot){
      dot.addEventListener('click', function(e){
        e.stopPropagation();
        var idx = parseInt(dot.getAttribute('data-index'), 10);
        slides.forEach(function(s, i){ s.classList.toggle('active', i === idx); });
        dots.forEach(function(d, i){ d.classList.toggle('active', i === idx); });
      });
    });
  });

  // ---- Booking modal ----
  var overlay = document.getElementById('modalOverlay');
  var modalForm = document.getElementById('modalForm');
  var modalSuccess = document.getElementById('modalSuccess');
  var bookingForm = document.getElementById('bookingForm');
  var modalTitle = document.getElementById('modalTitle');
  var modalDuration = document.getElementById('modalDuration');
  var modalPrice = document.getElementById('modalPrice');
  var modalTotal = document.getElementById('modalTotal');
  var modalETicket = document.getElementById('modalETicket');
  var bTravelers = document.getElementById('bTravelers');
  var bVehicle = document.getElementById('bVehicle');
  var bStay = document.getElementById('bStay');
  var currentBasePrice = 0;
  var lastFocused = null;

  function formatINR(n){
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  // ---- Shared e-ticket generator ----
  function generateBookingCode(){
    return 'TP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  function escHtml(str){
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
  function parseDaysFromDuration(durationText){
    var m = (durationText || '').match(/(\d+)\s*day/);
    return m ? parseInt(m[1], 10) : 1;
  }
  function buildDayPlan(totalDays, arrival, departure, stopsText){
    var lines = [];
    if (totalDays <= 1){
      lines.push('Day 1 — Arrival in ' + arrival + ', full-day visit covering ' + stopsText + ', departure to ' + departure + '.');
    } else {
      lines.push('Day 1 — Arrival in ' + arrival + ', check-in and evening at leisure.');
      if (totalDays > 2){
        lines.push('Day 2–' + (totalDays - 1) + ' — Sightseeing covering ' + stopsText + '.');
      } else {
        lines.push('Day 2 — Sightseeing covering ' + stopsText + '.');
      }
      lines.push('Day ' + totalDays + ' — Checkout, last-minute shopping, departure to ' + departure + '.');
    }
    return lines;
  }
  function buildETicketHTML(data){
    var code = generateBookingCode();
    var dayLines = buildDayPlan(data.totalDays, data.arrival, data.departure, data.stopsText);
    var dayLinesHtml = dayLines.map(function(l){ return '<div class="day-line">' + escHtml(l) + '</div>'; }).join('');
    function mealBadge(label, active){
      return '<span class="meal-badge' + (active ? ' active' : '') + '">' + label + '</span>';
    }
    return ''
      + '<div class="eticket">'
      + '<div class="eticket-head"><span class="eticket-brand">TRIP PLANNER E-TICKET</span><span class="eticket-code">#' + code + '</span></div>'
      + '<div class="eticket-route">'
      + '<div class="eticket-place"><span class="label">Arrival</span><span class="value">' + escHtml(data.arrival) + '</span></div>'
      + '<svg viewBox="0 0 100 14" preserveAspectRatio="none"><line x1="0" y1="7" x2="100" y2="7" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1,6" stroke-linecap="round"/></svg>'
      + '<div class="eticket-place" style="text-align:right;"><span class="label">Departure</span><span class="value">' + escHtml(data.departure) + '</span></div>'
      + '</div>'
      + '<div class="eticket-row"><div><span class="label">Passenger</span><span class="value">' + escHtml(data.name) + '</span></div><div style="text-align:right;"><span class="label">Package</span><span class="value">' + escHtml(data.title) + '</span></div></div>'
      + '<div class="eticket-row"><div><span class="label">Duration</span><span class="value">' + data.totalDays + ' day' + (data.totalDays > 1 ? 's' : '') + '</span></div><div style="text-align:right;"><span class="label">Travelers</span><span class="value">' + data.travelers + '</span></div></div>'
      + '<div class="eticket-row"><div><span class="label">Vehicle</span><span class="value">' + escHtml(data.vehicleLabel) + '</span></div><div style="text-align:right;"><span class="label">Stay</span><span class="value">' + escHtml(data.stayLabel) + '</span></div></div>'
      + '<div class="eticket-meals"><span class="label">Meals included</span><div class="meal-badges">'
      + mealBadge('Breakfast', data.meals.b) + mealBadge('Lunch', data.meals.l) + mealBadge('Dinner', data.meals.d)
      + '</div></div>'
      + '<div class="eticket-plan"><span class="label">Day-wise plan</span>' + dayLinesHtml + '</div>'
      + '<div class="eticket-foot"><span class="label">Total (estimate)</span><span class="value price">' + data.total + '</span></div>'
      + '<div class="barcode"></div>'
      + '</div>';
  }

  function recalcTotal(){
    var travelers = parseInt(bTravelers.value, 10) || 1;
    var vehicleAddon = parseFloat(bVehicle.selectedOptions[0].getAttribute('data-addon')) || 0;
    var stayAddon = parseFloat(bStay.selectedOptions[0].getAttribute('data-addon')) || 0;
    var perPerson = currentBasePrice + stayAddon;
    var total = (perPerson * travelers) + vehicleAddon;
    modalTotal.textContent = formatINR(total);
  }
  bTravelers.addEventListener('input', recalcTotal);
  bVehicle.addEventListener('change', recalcTotal);
  bStay.addEventListener('change', recalcTotal);

  function openModal(data){
    lastFocused = document.activeElement;
    modalTitle.textContent = data.title;
    modalDuration.textContent = data.duration;
    modalPrice.textContent = data.price;
    currentBasePrice = parseFloat(data.priceNum) || 0;
    modalForm.style.display = 'block';
    modalSuccess.classList.remove('show');
    modalETicket.innerHTML = '';
    bookingForm.reset();
    bTravelers.value = 2;
    recalcTotal();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function(){ document.getElementById('bName').focus(); }, 50);
  }
  function closeModal(){
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-open-booking]').forEach(function(btn){
    btn.addEventListener('click', function(){
      openModal({
        title: btn.getAttribute('data-title'),
        duration: btn.getAttribute('data-duration'),
        price: btn.getAttribute('data-price'),
        priceNum: btn.getAttribute('data-price-num')
      });
    });
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalDone').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

  bookingForm.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('bName').value.trim();
    var arrival = document.getElementById('bArrival').value.trim();
    var departure = document.getElementById('bDeparture').value.trim();
    var travelers = parseInt(bTravelers.value, 10) || 1;
    var vehicleLabel = bVehicle.selectedOptions[0].textContent.split(' — ')[0];
    var stayLabel = bStay.selectedOptions[0].textContent.split(' — ')[0];
    var total = modalTotal.textContent;
    var totalDays = parseDaysFromDuration(modalDuration.textContent);
    var meals = {
      b: document.getElementById('bMealB').checked,
      l: document.getElementById('bMealL').checked,
      d: document.getElementById('bMealD').checked
    };
    modalETicket.innerHTML = buildETicketHTML({
      name: name, arrival: arrival, departure: departure,
      title: modalTitle.textContent, totalDays: totalDays, travelers: travelers,
      vehicleLabel: vehicleLabel, stayLabel: stayLabel, meals: meals, total: total,
      stopsText: modalTitle.textContent
    });
    modalForm.style.display = 'none';
    modalSuccess.classList.add('show');
  });

  // ---- CTA form (hero route builder) ----
  var ctaForm = document.getElementById('ctaForm');
  var ctaDefault = document.getElementById('ctaDefault');
  var ctaSuccess = document.getElementById('ctaSuccess');
  var ctaSuccessBody = document.getElementById('ctaSuccessBody');

  ctaForm.addEventListener('submit', function(e){
    e.preventDefault();
    var dest = document.getElementById('ctaDestination').value.trim();
    if (!dest) return;
    ctaSuccessBody.textContent = 'We\'re matching "' + dest + '" against our routes — take a look at the packages above, or scroll back up to browse destinations.';
    ctaDefault.style.display = 'none';
    ctaSuccess.style.display = 'block';
    showToast('Route request received for ' + dest);
    setTimeout(function(){
      document.getElementById('packages').scrollIntoView({behavior:'smooth', block:'start'});
    }, 900);
  });

  // ---- Enquire form ----
  var enquireForm = document.getElementById('enquireForm');
  var enquireDefault = document.getElementById('enquireDefault');
  var enquireSuccess = document.getElementById('enquireSuccess');
  var enquireSuccessBody = document.getElementById('enquireSuccessBody');

  enquireForm.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('eqName').value.trim();
    var interest = document.getElementById('eqInterest').value.trim();
    enquireSuccessBody.textContent = 'Thanks, ' + name + ' — we\'ve got your question' + (interest ? ' about ' + interest : '') + ' and will get back to you by email soon.';
    enquireDefault.style.display = 'none';
    enquireSuccess.style.display = 'block';
    showToast('Enquiry sent — thanks, ' + name + '!');
  });

  // ---- Vehicle-only booking ----
  var vehicleOverlay = document.getElementById('vehicleOverlay');
  var vehicleModalForm = document.getElementById('vehicleModalForm');
  var vehicleModalSuccess = document.getElementById('vehicleModalSuccess');
  var vehicleForm = document.getElementById('vehicleForm');
  var vehicleModalTitle = document.getElementById('vehicleModalTitle');
  var vehicleModalPer = document.getElementById('vehicleModalPer');
  var vehicleTotal = document.getElementById('vehicleTotal');
  var vDays = document.getElementById('vDays');
  var currentVehiclePerDay = 0;
  var vehicleLastFocused = null;

  function recalcVehicleTotal(){
    var days = parseInt(vDays.value, 10) || 1;
    vehicleTotal.textContent = formatINR(currentVehiclePerDay * days);
  }
  vDays.addEventListener('input', recalcVehicleTotal);

  function openVehicleModal(data){
    vehicleLastFocused = document.activeElement;
    vehicleModalTitle.textContent = data.vehicle;
    vehicleModalPer.textContent = formatINR(data.vprice) + ' / day';
    currentVehiclePerDay = data.vprice;
    vehicleModalForm.style.display = 'block';
    vehicleModalSuccess.classList.remove('show');
    document.getElementById('vehicleETicket').innerHTML = '';
    vehicleForm.reset();
    vDays.value = 1;
    document.getElementById('vPassengers').value = 2;
    recalcVehicleTotal();
    vehicleOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function(){ document.getElementById('vPickup').focus(); }, 50);
  }
  function closeVehicleModal(){
    vehicleOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (vehicleLastFocused) vehicleLastFocused.focus();
  }

  document.querySelectorAll('[data-open-vehicle]').forEach(function(btn){
    btn.addEventListener('click', function(){
      openVehicleModal({
        vehicle: btn.getAttribute('data-vehicle'),
        vprice: parseFloat(btn.getAttribute('data-vprice')) || 0
      });
    });
  });

  document.getElementById('vehicleModalClose').addEventListener('click', closeVehicleModal);
  document.getElementById('vehicleModalDone').addEventListener('click', closeVehicleModal);
  vehicleOverlay.addEventListener('click', function(e){ if (e.target === vehicleOverlay) closeVehicleModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && vehicleOverlay.classList.contains('open')) closeVehicleModal(); });

  vehicleForm.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('vName').value.trim();
    var pickup = document.getElementById('vPickup').value.trim();
    var drop = document.getElementById('vDrop').value.trim();
    var places = document.getElementById('vPlaces').value.trim();
    var days = parseInt(vDays.value, 10) || 1;
    var passengers = parseInt(document.getElementById('vPassengers').value, 10) || 1;
    var total = vehicleTotal.textContent;
    document.getElementById('vehicleETicket').innerHTML = buildETicketHTML({
      name: name, arrival: pickup, departure: drop,
      title: vehicleModalTitle.textContent, totalDays: days, travelers: passengers,
      vehicleLabel: vehicleModalTitle.textContent, stayLabel: 'Not included (vehicle only)',
      meals: {b:false, l:false, d:false}, total: total,
      stopsText: places
    });
    vehicleModalForm.style.display = 'none';
    vehicleModalSuccess.classList.add('show');
  });

  // ---- Custom package builder ----
  var customOverlay = document.getElementById('customOverlay');
  var customModalForm = document.getElementById('customModalForm');
  var customModalSuccess = document.getElementById('customModalSuccess');
  var customForm = document.getElementById('customForm');
  var customChecks = document.querySelectorAll('#customModalForm .custom-check input');
  var cNights = document.getElementById('cNights');
  var cTravelers = document.getElementById('cTravelers');
  var cVehicle = document.getElementById('cVehicle');
  var cStay = document.getElementById('cStay');
  var customCount = document.getElementById('customCount');
  var customTotal = document.getElementById('customTotal');
  var BASE_NIGHT_RATE = 1200;
  var customLastFocused = null;

  function recalcCustomTotal(){
    var selected = 0, stopsCost = 0;
    customChecks.forEach(function(chk){
      if (chk.checked){ selected++; stopsCost += parseFloat(chk.getAttribute('data-price')) || 0; }
    });
    var nights = parseInt(cNights.value, 10) || 0;
    var travelers = parseInt(cTravelers.value, 10) || 1;
    var vehicleAddon = parseFloat(cVehicle.selectedOptions[0].getAttribute('data-addon')) || 0;
    var stayAddon = parseFloat(cStay.selectedOptions[0].getAttribute('data-addon')) || 0;
    var nightlyRate = Math.max(BASE_NIGHT_RATE + stayAddon, 400);
    var total = (stopsCost * travelers) + (nightlyRate * nights * travelers) + vehicleAddon;
    customCount.textContent = selected + (selected === 1 ? ' stop selected' : ' stops selected');
    customTotal.textContent = formatINR(total);
  }
  customChecks.forEach(function(chk){ chk.addEventListener('change', recalcCustomTotal); });
  cNights.addEventListener('input', recalcCustomTotal);
  cTravelers.addEventListener('input', recalcCustomTotal);
  cVehicle.addEventListener('change', recalcCustomTotal);
  cStay.addEventListener('change', recalcCustomTotal);

  function openCustomModal(){
    customLastFocused = document.activeElement;
    customModalForm.style.display = 'block';
    customModalSuccess.classList.remove('show');
    document.getElementById('customETicket').innerHTML = '';
    customChecks.forEach(function(chk){ chk.checked = false; });
    customForm.reset();
    cNights.value = 1;
    cTravelers.value = 2;
    recalcCustomTotal();
    customOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCustomModal(){
    customOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (customLastFocused) customLastFocused.focus();
  }

  document.getElementById('openCustomBuilder').addEventListener('click', openCustomModal);
  document.getElementById('customModalClose').addEventListener('click', closeCustomModal);
  document.getElementById('customModalDone').addEventListener('click', closeCustomModal);
  customOverlay.addEventListener('click', function(e){ if (e.target === customOverlay) closeCustomModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && customOverlay.classList.contains('open')) closeCustomModal(); });

  customForm.addEventListener('submit', function(e){
    e.preventDefault();
    var names = [];
    customChecks.forEach(function(chk){
      if (chk.checked) names.push(chk.parentElement.querySelector('span').textContent);
    });
    if (names.length === 0){
      customCount.textContent = 'Pick at least one stop';
      return;
    }
    var name = document.getElementById('cName').value.trim();
    var arrival = document.getElementById('cArrival').value.trim();
    var departure = document.getElementById('cDeparture').value.trim();
    var nights = parseInt(cNights.value, 10) || 0;
    var travelers = parseInt(cTravelers.value, 10) || 1;
    var vehicleLabel = cVehicle.selectedOptions[0].textContent.split(' — ')[0];
    var stayLabel = cStay.selectedOptions[0].textContent.split(' — ')[0];
    var total = customTotal.textContent;
    var totalDays = nights + 1;
    var meals = {
      b: document.getElementById('cMealB').checked,
      l: document.getElementById('cMealL').checked,
      d: document.getElementById('cMealD').checked
    };
    document.getElementById('customETicket').innerHTML = buildETicketHTML({
      name: name, arrival: arrival, departure: departure,
      title: 'Custom Route', totalDays: totalDays, travelers: travelers,
      vehicleLabel: vehicleLabel, stayLabel: stayLabel, meals: meals, total: total,
      stopsText: names.join(', ')
    });
    customModalForm.style.display = 'none';
    customModalSuccess.classList.add('show');
  });
})();