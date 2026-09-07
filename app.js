(() => {
  const data = window.CATALOG_DATA || {wellesley:window.WELLESLEY_COURSES||[], mit:(window.MIT_COURSE_PARTS||[]).flat(), meta:window.CATALOG_META||{}};
  const $ = id => document.getElementById(id);
  const saved = JSON.parse(localStorage.getItem("crossreg-schedule-v2") || "[]");
  const state = {schedule:saved, matches:[], visible:20};
  const days = ["M","T","W","R","F"], dayNames={M:"Mon",T:"Tue",W:"Wed",R:"Thu",F:"Fri"};
  const mins = time => {const [h,m]=time.split(":").map(Number);return h*60+m};
  const clock = time => {const [h,m]=time.split(":").map(Number);return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`};
  const meetingText = m => `${m.days.join("")} ${clock(m.start)}–${clock(m.end)}`;
  const overlaps = (a,b) => a.days.some(d=>b.days.includes(d)) && mins(a.start)<mins(b.end) && mins(a.end)>mins(b.start);
  const busy = () => state.schedule.flatMap(item=>item.meetings.map(meeting=>({...meeting,location:item.location})));

  function fitGroups(course) {
    return course.groups.map(group=>({...group,options:group.options.filter(option=>!busy().some(item=>overlaps(item,option)))}));
  }
  function parseClock(value) {
    const match=value.match(/(\d+):(\d+)\s*(AM|PM)/i);if(!match)return 0;
    let hour=+match[1]%12;if(match[3].toUpperCase()==="PM")hour+=12;return hour*60+(+match[2]);
  }
  function shuttleForOption(option) {
    let choice=null;
    for (const day of option.days) {
      const local=busy().filter(m=>m.days.includes(day)&&m.location==="Wellesley");
      const previous=Math.max(0,...local.filter(m=>mins(m.end)<=mins(option.start)).map(m=>mins(m.end)));
      const next=Math.min(1440,...local.filter(m=>mins(m.start)>=mins(option.end)).map(m=>mins(m.start)));
      const out=SHUTTLE_DATA.trips.filter(t=>parseClock(t.wellesley)>=previous+10&&parseClock(t.mit)<=mins(option.start)-10).at(-1);
      const back=SHUTTLE_DATA.trips.find(t=>parseClock(t.mit)>=mins(option.end)+10&&parseClock(t.returnWellesley)<=next-10);
      if(!out||(next<1440&&!back))return null;choice=choice||{out,back};
    }
    return choice;
  }
  function shuttle(groups) {
    const plans=groups.map(g=>g.options.map(shuttleForOption).filter(Boolean));
    return plans.every(p=>p.length)?plans[0][0]:null;
  }

  function saveAndRender() {
    localStorage.setItem("crossreg-schedule-v2",JSON.stringify(state.schedule));
    $("clearSchedule").hidden=!state.schedule.length;
    $("selectedCourses").innerHTML=state.schedule.length?state.schedule.map(item=>`<div class="course-chip"><div><strong>${item.code||item.title} · ${item.title}</strong><small>${item.location} · ${item.meetings.map(meetingText).join(" · ")}</small></div><button data-remove="${item.id}" aria-label="Remove ${item.title}">×</button></div>`).join(""):`<div class="empty-state"><b>W</b><p>Your courses and time blocks will appear here.</p></div>`;
    renderCalendar();
  }
  function renderCalendar() {
    let html=`<div></div>${days.map(d=>`<div class="cal-head">${dayNames[d]}</div>`).join("")}`;
    for(let hour=8;hour<22;hour++) html+=`<div class="cal-time">${hour%12||12} ${hour<12?"am":"pm"}</div>${days.map(()=>`<div class="cal-cell"></div>`).join("")}`;
    state.schedule.forEach(item=>item.meetings.forEach(meeting=>meeting.days.forEach(day=>{
      const start=Math.max(mins(meeting.start),480),end=Math.min(mins(meeting.end),1320);if(end<=start||!days.includes(day))return;
      const top=34+(start-480)/60*52, height=Math.max(24,(end-start)/60*52-4), column=days.indexOf(day);
      html+=`<div class="cal-event ${item.kind}" data-remove="${item.id}" title="Click to remove" style="left:calc(54px + (100% - 54px)/5*${column} + 4px);width:calc((100% - 54px)/5 - 8px);top:${top}px;height:${height}px"><strong>${item.code||item.title}</strong><small>${clock(meeting.start)}</small></div>`;
    })));
    $("calendar").innerHTML=html;
    $("calendar").insertAdjacentHTML("afterend",`<div class="calendar-legend"><span><i style="background:#dfeee3"></i>Wellesley</span><span><i style="background:#fde8df"></i>MIT</span><span><i style="background:#e8e7ef"></i>Time block</span><span>Click any event to remove it</span></div>`);
    const legends=document.querySelectorAll(".calendar-legend");legends.forEach((el,i)=>{if(i<legends.length-1)el.remove()});
  }
  function renderSuggestions(query) {
    const q=query.trim().toLowerCase();if(q.length<2){$("suggestions").hidden=true;return}
    const found=data.wellesley.filter(c=>!state.schedule.some(s=>s.sourceId===c.id)&&`${c.code} ${c.title} ${c.instructor||""}`.toLowerCase().includes(q)).slice(0,10);
    $("suggestions").innerHTML=found.length?found.map(c=>`<button class="suggestion" data-add="${c.id}"><strong>${c.code} · ${c.title}</strong><small>${c.meetings.map(meetingText).join(" · ")}</small></button>`).join(""):`<div class="suggestion"><small>No Wellesley courses found.</small></div>`;$("suggestions").hidden=false;
  }
  function findMatches() {
    const q=$("mitQuery").value.trim().toLowerCase(),level=$("levelFilter").value,needBus=$("shuttleOnly").checked;
    state.matches=data.mit.map(course=>{const groups=fitGroups(course);if(groups.some(g=>!g.options.length))return null;return {...course,fitGroups:groups,shuttle:shuttle(groups)}}).filter(Boolean).filter(c=>(!q||`${c.code} ${c.title} ${c.description||""}`.toLowerCase().includes(q))&&(!level||c.level===level)&&(!needBus||c.shuttle));state.visible=20;renderResults();$("resultsSection").hidden=false;$("resultsSection").scrollIntoView({behavior:"smooth"});
  }
  function renderResults() {
    $("resultsTitle").textContent=`${state.matches.length.toLocaleString()} MIT courses fit`;$("resultsSummary").textContent=`Checked against ${state.schedule.length} schedule item${state.schedule.length===1?"":"s"}`;
    $("results").innerHTML=state.matches.slice(0,state.visible).map(c=>{const already=state.schedule.some(i=>i.kind==="mit"&&i.code===c.code),meetings=c.fitGroups.flatMap(g=>g.options.slice(0,2).map(o=>`<span class="meeting">${g.type}: ${meetingText(o)}</span>`)).join(""),bus=c.shuttle?`<div class="bus">🚌 <strong>Leave Wellesley ${c.shuttle.out.wellesley}</strong> → MIT ${c.shuttle.out.mit}${c.shuttle.back?` · Return ${c.shuttle.back.mit}`:""}</div>`:`<div class="bus">No workable Exchange Bus found.</div>`;return `<article class="result-card"><div class="result-top"><h3><span>${c.code}</span>${c.title}</h3><span class="level">${c.level==="G"?"Graduate":"Undergrad"}</span></div><div class="meetings">${meetings}</div>${bus}<p class="description">${c.description||"See the MIT subject listing for details."}</p><button class="add-mit ${already?"added":""}" data-mit="${c.code}" ${already?"disabled":""}>${already?"Added to schedule ✓":"+ Add to schedule"}</button><a class="result-link" href="${c.url}" target="_blank">Official listing ↗</a></article>`}).join("")||`<div class="empty-state"><p>No courses match. Try turning off the shuttle filter or using a broader search.</p></div>`;$("showMore").hidden=state.visible>=state.matches.length;
  }

  $("wellesleySearch").addEventListener("input",e=>{$("clearQuery").hidden=!e.target.value;renderSuggestions(e.target.value)});
  $("suggestions").addEventListener("click",e=>{const button=e.target.closest("[data-add]");if(!button)return;const c=data.wellesley.find(x=>x.id===button.dataset.add);if(c){state.schedule.push({id:`w-${c.id}`,sourceId:c.id,kind:"wellesley",location:"Wellesley",code:c.code,title:c.title,meetings:c.meetings});saveAndRender();$("wellesleySearch").value="";$("suggestions").hidden=true;$("clearQuery").hidden=true}});
  function removeFromSchedule(e){const button=e.target.closest("[data-remove]");if(button){state.schedule=state.schedule.filter(c=>c.id!==button.dataset.remove);saveAndRender();if(!$("resultsSection").hidden)findMatches()}}
  $("selectedCourses").addEventListener("click",removeFromSchedule);$("calendar").addEventListener("click",removeFromSchedule);
  $("results").addEventListener("click",e=>{const button=e.target.closest("[data-mit]");if(!button)return;const c=state.matches.find(x=>x.code===button.dataset.mit);if(!c)return;state.schedule.push({id:`mit-${c.code}-${Date.now()}`,kind:"mit",location:"MIT",code:c.code,title:c.title,meetings:c.fitGroups.map(g=>g.options.find(o=>shuttleForOption(o))||g.options[0])});saveAndRender();renderResults()});
  $("addBlockButton").onclick=()=>{$("blockForm").hidden=false;$("blockName").focus()};$("cancelBlock").onclick=()=>{$("blockForm").hidden=true};
  $("blockForm").addEventListener("submit",e=>{e.preventDefault();const selected=[...document.querySelectorAll("#blockDays input:checked")].map(i=>i.value),start=$("blockStart").value,end=$("blockEnd").value;if(!selected.length||!start||!end||mins(end)<=mins(start)){alert("Choose at least one day and an end time after the start time.");return}state.schedule.push({id:`block-${Date.now()}`,kind:"block",location:$("blockLocation").value,title:$("blockName").value.trim(),meetings:[{days:selected,start,end}]});e.target.reset();e.target.hidden=true;saveAndRender()});
  $("clearSchedule").onclick=()=>{state.schedule=[];saveAndRender()};$("clearQuery").onclick=()=>{$("wellesleySearch").value="";$("suggestions").hidden=true;$("clearQuery").hidden=true};$("findMatches").onclick=findMatches;$("showMore").onclick=()=>{state.visible+=20;renderResults()};document.addEventListener("click",e=>{if(!e.target.closest(".course-search-wrap"))$("suggestions").hidden=true});
  $("termLabel").textContent=data.meta.term||"Current term";$("dataNote").textContent=`Catalog updated ${data.meta.updated||"recently"} · ${data.wellesley.length.toLocaleString()} Wellesley sections · ${data.mit.length.toLocaleString()} scheduled MIT subjects`;saveAndRender();
})();
