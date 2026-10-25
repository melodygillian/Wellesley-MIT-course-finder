(() => {
  const legacyCatalog = window.CATALOG_DATA || {wellesley:window.WELLESLEY_COURSES||[], mit:(window.MIT_COURSE_PARTS||[]).flat(), meta:window.CATALOG_META||{}};
  const catalogs = window.SEMESTER_CATALOGS || {};
  const semesterConfig = window.SEMESTER_CONFIG || {default:"current",available:[{id:"current",label:legacyCatalog.meta.term||"Current term"}]};
  if (!catalogs.current) catalogs.current = legacyCatalog;
  let semesterId = catalogs[semesterConfig.default] ? semesterConfig.default : Object.keys(catalogs)[0];
  let data = catalogs[semesterId] || legacyCatalog;
  const $ = id => document.getElementById(id);
  const storageKey = (id=semesterId) => `crossreg-schedule-v3:${id}`;
  function loadSchedule(id=semesterId) {
    try {
      const saved=localStorage.getItem(storageKey(id));
      if(saved)return JSON.parse(saved);
      if(id==="2026-fall")return JSON.parse(localStorage.getItem("crossreg-schedule-v2")||"[]");
    } catch (_) {}
    return [];
  }
  const state = {schedule:loadSchedule(), matches:[], visible:20};
  const degreeData=window.DEGREE_REQUIREMENTS||{majors:[]};
  const generalRequirements=[
    {id:"units",label:"Complete 32 academic units, including at least 16 at Wellesley.",details:"At least 18 units must be outside any single department.",patterns:[]},
    {id:"arts-language",label:"Complete the Language & Literature and Arts distribution group.",details:"Three units total, with at least one LL and one ARS unit.",patterns:[{type:"distribution",code:"LL"},{type:"distribution",code:"ARS"}]},
    {id:"social-humanities",label:"Complete the Social & Behavioral Analysis and humanities distribution group.",details:"One SBA unit plus two units from two of EC, REP, and HS.",patterns:[{type:"distribution",code:"SBA"},{type:"distribution",code:"EC"},{type:"distribution",code:"REP"},{type:"distribution",code:"HS"}]},
    {id:"science-math",label:"Complete the science and mathematical modeling distribution group.",details:"Three units total, including NPS, MM, and at least one laboratory unit.",patterns:[{type:"distribution",code:"NPS"},{type:"distribution",code:"MM"},{type:"distribution",code:"LAB"}]},
    {id:"writing",label:"Complete one First-Year Writing course.",details:"The expository writing requirement is normally completed in the first year.",patterns:[{type:"distribution",code:"WFY"}]},
    {id:"language",label:"Complete the foreign-language requirement.",details:"For Fall 2020 or later entrants: ordinarily two units at the second-year level, or another approved route.",patterns:[]},
    {id:"qr",label:"Complete Quantitative Reasoning (QR).",details:"QR 140 or a passing QR Assessment, normally in the first year.",patterns:[{type:"course",code:"QR 140"},{type:"distribution",code:"QR"}]},
    {id:"dl",label:"Complete one Data Literacy (DL) course.",details:"A 5 on AP Statistics also satisfies this component.",patterns:[{type:"distribution",code:"DL"}]},
    {id:"advanced",label:"Complete four 300-level units.",details:"At least two must be in the major and at least two in the last two years.",patterns:[{type:"anyLevel",level:3}]},
    {id:"multicultural",label:"Complete the multicultural requirement and submit the approval form.",details:"Confirm approval with your Class Dean.",patterns:[]},
    {id:"major",label:"Complete an approved major of at least eight units.",details:"Many majors require more than eight units.",patterns:[]},
    {id:"pe",label:"Complete the Physical Education requirement.",details:"Davis Scholars are exempt; transfer requirements vary.",patterns:[]},
    {id:"experiential",label:"Complete two experiential-learning units.",details:"Applies to students entering Fall 2024 or later; these do not count toward the 32 academic units.",patterns:[]}
  ];
  let degreeState;
  try{degreeState=JSON.parse(localStorage.getItem("crossreg-degree-v1")||"{}")}catch(_){degreeState={}}
  degreeState={majorId:degreeState.majorId||"",general:degreeState.general||[],majors:degreeState.majors||{}};
  let degreeVisible=18;
  const days = ["M","T","W","R","F"], dayNames={M:"Mon",T:"Tue",W:"Wed",R:"Thu",F:"Fri"};
  const mins = time => {const [h,m]=time.split(":").map(Number);return h*60+m};
  const clock = time => {const [h,m]=time.split(":").map(Number);return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`};
  const meetingText = m => `${m.days.join("")} ${clock(m.start)}–${clock(m.end)}`;
  const cleanText = value => String(value || "").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
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

  function renderSemesterTabs() {
    $("semesterTabs").innerHTML=semesterConfig.available.filter(semester=>catalogs[semester.id]).map(semester=>`<button class="semester-tab" type="button" role="tab" data-semester="${semester.id}" aria-selected="${semester.id===semesterId}">${semester.label}</button>`).join("");
  }
  function updateCatalogNote() {
    $("dataNote").textContent=`${data.meta.term||"Current term"} catalog updated ${data.meta.updated||"recently"} · ${data.wellesley.length.toLocaleString()} Wellesley sections · ${data.mit.length.toLocaleString()} scheduled MIT subjects`;
  }
  function saveDegreeState(){localStorage.setItem("crossreg-degree-v1",JSON.stringify(degreeState))}
  function courseCodes(course){return [...course.code.matchAll(/\b([A-Z]{2,5})\s*([0-9]{3})([A-Z]?)\b/g)].map(match=>`${match[1]} ${match[2]}${match[3]}`)}
  function patternMatches(course,pattern){
    const codes=courseCodes(course);
    if(pattern.type==="course")return codes.includes(pattern.code);
    if(pattern.type==="range")return codes.some(code=>{const match=code.match(/^([A-Z]{2,5}) (\d{3})/);return match&&match[1]===pattern.subject&&+match[2]>=pattern.start&&+match[2]<=pattern.end});
    if(pattern.type==="above")return codes.some(code=>{const match=code.match(/^([A-Z]{2,5}) (\d{3})/);return match&&match[1]===pattern.subject&&+match[2]>pattern.number});
    if(pattern.type==="level")return codes.some(code=>{const match=code.match(/^([A-Z]{2,5}) (\d)/);return match&&match[1]===pattern.subject&&+match[2]===pattern.level});
    if(pattern.type==="anyLevel")return codes.some(code=>+code.match(/\d/)?.[0]===pattern.level);
    if(pattern.type==="distribution")return (course.distributions||[]).some(value=>value===pattern.code||value.startsWith(`${pattern.code} `)||value.startsWith(`${pattern.code}-`));
    return false;
  }
  function requirementRow(item,scope,id,checked){
    return `<label class="requirement-item ${checked?"completed":""}"><input type="checkbox" data-requirement-scope="${scope}" data-requirement-id="${cleanText(id)}" ${checked?"checked":""}><span>${cleanText(item.label)}${item.details?`<small>${cleanText(item.details)}</small>`:""}${item.group&&item.group!=="Major requirements"?`<small>${cleanText(item.group)}</small>`:""}</span></label>`;
  }
  function currentMajor(){return degreeData.majors.find(major=>major.id===degreeState.majorId)}
  function renderDegreeRequirements(){
    $("majorSelect").innerHTML=`<option value="">Choose a major</option>`+degreeData.majors.map(major=>`<option value="${major.id}" ${major.id===degreeState.majorId?"selected":""}>${cleanText(major.name)}</option>`).join("");
    $("generalRequirements").innerHTML=generalRequirements.map(item=>requirementRow(item,"general",item.id,degreeState.general.includes(item.id))).join("");
    const major=currentMajor();
    if(!major){$("majorRequirementTitle").textContent="Major requirements";$("majorSource").href=degreeData.source||"https://catalog.wellesley.edu/";$("majorRequirements").innerHTML=`<p class="planner-empty">Choose a major to load its official 2026–27 requirement checklist.</p>`;return}
    $("majorRequirementTitle").textContent=`${major.name} requirements`;$("majorSource").href=major.source;
    const completed=degreeState.majors[major.id]||[];
    $("majorRequirements").innerHTML=major.requirements.map((item,index)=>requirementRow(item,"major",String(index),completed.includes(String(index)))).join("");
  }
  function degreeCandidates(){
    const major=currentMajor();
    if(!major)return [];
    const remaining=generalRequirements.filter(item=>!degreeState.general.includes(item.id)&&item.patterns.length).map(item=>({kind:"General",item}));
    const completed=degreeState.majors[major.id]||[];
    if(major)major.requirements.forEach((item,index)=>{if(!completed.includes(String(index))&&item.patterns.length)remaining.push({kind:"Major",item})});
    return data.wellesley.map(course=>{
      if(major&&major.requirements.some((item,index)=>completed.includes(String(index))&&item.patterns.some(pattern=>patternMatches(course,pattern))))return null;
      const matches=remaining.filter(entry=>entry.item.patterns.some(pattern=>patternMatches(course,pattern)));
      return matches.length?{course,matches}:null;
    }).filter(Boolean).sort((a,b)=>Number(b.matches.some(match=>match.kind==="Major"))-Number(a.matches.some(match=>match.kind==="Major"))||a.course.code.localeCompare(b.course.code));
  }
  function renderDegreeMatches(){
    const candidates=degreeCandidates(),visible=candidates.slice(0,degreeVisible),major=currentMajor();
    $("degreeMatchesTitle").textContent=`${data.meta.term||"Current term"} courses for remaining requirements`;
    $("degreeMatchesSummary").textContent=!major?"Choose a major to generate a course list.":candidates.length?`${candidates.length.toLocaleString()} section${candidates.length===1?"":"s"} may match unchecked major or graduation requirements.`:"No published sections match the unchecked machine-readable requirements for this term.";
    $("degreeMatches").innerHTML=visible.map(({course,matches})=>{
      const added=state.schedule.some(item=>item.sourceId===course.id),tags=[...new Set(matches.map(match=>match.kind))];
      return `<article class="degree-course"><h4><span>${cleanText(course.code)}</span>${cleanText(course.title)}</h4><p>${course.meetings.map(meetingText).join(" · ")}${course.distributions?.length?`<br>${course.distributions.map(cleanText).join(" · ")}`:""}</p><div class="degree-course-tags">${tags.map(tag=>`<span>${tag}</span>`).join("")}</div><button data-degree-add="${cleanText(course.id)}" ${added?"disabled":""}>${added?"Added ✓":"+ Add to calendar"}</button></article>`;
    }).join("")||`<p class="planner-empty">${major?"Check your official requirements or choose another semester. Broad elective and advisor-approved rules may not map automatically.":"Select your major above to see current sections for remaining requirements."}</p>`;
    $("moreDegreeMatches").hidden=degreeVisible>=candidates.length;
  }
  function renderDegreePlanner(){renderDegreeRequirements();renderDegreeMatches()}
  function addWellesleyCourse(course){
    if(!course||state.schedule.some(item=>item.sourceId===course.id))return;
    state.schedule.push({id:`w-${course.id}`,sourceId:course.id,kind:"wellesley",location:"Wellesley",code:course.code,title:course.title,meetings:course.meetings});saveAndRender();
  }
  function switchSemester(nextId) {
    if(nextId===semesterId||!catalogs[nextId])return;
    semesterId=nextId;data=catalogs[semesterId];state.schedule=loadSchedule();state.matches=[];state.visible=20;
    $("wellesleySearch").value="";$("suggestions").hidden=true;$("clearQuery").hidden=true;$("resultsSection").hidden=true;$("blockForm").hidden=true;
    renderSemesterTabs();updateCatalogNote();saveAndRender();renderDegreePlanner();
  }

  function saveAndRender() {
    localStorage.setItem(storageKey(),JSON.stringify(state.schedule));
    $("clearSchedule").hidden=!state.schedule.length;
    $("selectedCourses").innerHTML=state.schedule.length?state.schedule.map(item=>`<div class="course-chip"><div><strong>${item.code||item.title} · ${item.title}</strong><small>${item.location} · ${item.meetings.map(meetingText).join(" · ")}</small></div><button data-remove="${item.id}" aria-label="Remove ${item.title}">×</button></div>`).join(""):`<div class="empty-state"><b>W</b><p>Your courses and time blocks will appear here.</p></div>`;
    renderCalendar();
    if($("degreeMatches"))renderDegreeMatches();
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
    const q=$("mitQuery").value.trim().toLowerCase(),level=$("levelFilter").value,needBus=$("shuttleOnly").checked,minRating=+$("ratingFilter").value;
    state.matches=data.mit.map(course=>{const groups=fitGroups(course);if(groups.some(g=>!g.options.length))return null;return {...course,fitGroups:groups,shuttle:shuttle(groups)}}).filter(Boolean).filter(c=>(!q||`${c.code} ${c.title} ${c.description||""}`.toLowerCase().includes(q))&&(!level||c.level===level)&&(!minRating||(c.rating&&c.rating>=minRating))&&(!needBus||c.shuttle));state.visible=20;renderResults();$("resultsSection").hidden=false;$("resultsSection").scrollIntoView({behavior:"smooth"});
  }
  function renderResults() {
    $("resultsTitle").textContent=`${state.matches.length.toLocaleString()} MIT courses fit`;$("resultsSummary").textContent=`${data.meta.term||"Current term"} · Checked against ${state.schedule.length} schedule item${state.schedule.length===1?"":"s"}`;
    $("results").innerHTML=state.matches.slice(0,state.visible).map(c=>{
      const already=state.schedule.some(i=>i.kind==="mit"&&i.code===c.code);
      const meetings=c.fitGroups.flatMap(g=>g.options.slice(0,2).map(o=>`<span class="meeting">${cleanText(g.type)}: ${meetingText(o)}</span>`)).join("");
      const bus=c.shuttle?`<div class="bus">🚌 <strong>Leave Wellesley ${c.shuttle.out.wellesley}</strong> → MIT ${c.shuttle.out.mit}${c.shuttle.back?` · Return ${c.shuttle.back.mit}`:""}</div>`:`<div class="bus">No workable Exchange Bus found.</div>`;
      const rating=c.rating?`<div class="metric"><span class="stars" style="--score:${Math.min(100,c.rating/7*100)}%" aria-label="${c.rating} out of 7"><span>★★★★★★★</span></span><strong>${c.rating.toFixed(1)}/7</strong><small>student rating</small></div>`:`<div class="metric unavailable"><strong>Not rated yet</strong><small>student rating</small></div>`;
      const hours=c.hours?`<div class="metric"><span class="metric-icon">◷</span><strong>${c.hours.toFixed(1)} hrs/week</strong><small>${c.inClassHours?`${c.inClassHours.toFixed(1)} in class`:""}${c.inClassHours&&c.outOfClassHours?" + ":""}${c.outOfClassHours?`${c.outOfClassHours.toFixed(1)} outside`:""}</small></div>`:`<div class="metric unavailable"><strong>Hours unavailable</strong><small>weekly workload</small></div>`;
      const required=c.prerequisites&&c.prerequisites!=="None"?`<div class="prep-row"><span class="prep-label required">Required</span><span>${cleanText(c.prerequisites)}</span></div>`:"";
      const corequired=c.corequisites?`<div class="prep-row"><span class="prep-label required">Corequisite</span><span>${cleanText(c.corequisites)}</span></div>`:"";
      const recommended=c.recommendedPreparation?`<div class="prep-row"><span class="prep-label recommended">Recommended</span><span>${cleanText(c.recommendedPreparation)}</span></div>`:"";
      const preparation=required||corequired||recommended?`<div class="preparation">${required}${corequired}${recommended}</div>`:`<div class="preparation none"><span>No listed prerequisites</span></div>`;
      const terms=(c.terms||["fall"]).map(term=>term==="spring"?`<span class="term-badge spring" title="Usually offered in spring">🌸 Spring</span>`:`<span class="term-badge fall" title="Usually offered in fall">🍂 Fall</span>`).join("");
      return `<article class="result-card"><div class="result-top"><h3><span>${cleanText(c.code)}</span>${cleanText(c.title)}</h3><div class="result-tags"><span class="level">${c.level==="G"?"Graduate":"Undergrad"}</span><div class="term-badges">${terms}</div></div></div><div class="course-metrics">${rating}${hours}</div>${preparation}<div class="meetings">${meetings}</div>${bus}<p class="description">${cleanText(c.description||"See the MIT subject listing for details.")}</p><button class="add-mit ${already?"added":""}" data-mit="${cleanText(c.code)}" ${already?"disabled":""}>${already?"Added to schedule ✓":"+ Add to schedule"}</button><a class="result-link" href="${cleanText(c.url)}" target="_blank" rel="noopener">Official listing ↗</a></article>`;
    }).join("")||`<div class="empty-state"><p>No courses match. Try lowering the rating, turning off the shuttle filter, or using a broader search.</p></div>`;$("showMore").hidden=state.visible>=state.matches.length;
  }

  $("wellesleySearch").addEventListener("input",e=>{$("clearQuery").hidden=!e.target.value;renderSuggestions(e.target.value)});
  $("suggestions").addEventListener("click",e=>{const button=e.target.closest("[data-add]");if(!button)return;const c=data.wellesley.find(x=>x.id===button.dataset.add);if(c){addWellesleyCourse(c);$("wellesleySearch").value="";$("suggestions").hidden=true;$("clearQuery").hidden=true}});
  function removeFromSchedule(e){const button=e.target.closest("[data-remove]");if(button){state.schedule=state.schedule.filter(c=>c.id!==button.dataset.remove);saveAndRender();if(!$("resultsSection").hidden)findMatches()}}
  $("selectedCourses").addEventListener("click",removeFromSchedule);$("calendar").addEventListener("click",removeFromSchedule);
  $("results").addEventListener("click",e=>{const button=e.target.closest("[data-mit]");if(!button)return;const c=state.matches.find(x=>x.code===button.dataset.mit);if(!c)return;state.schedule.push({id:`mit-${c.code}-${Date.now()}`,kind:"mit",location:"MIT",code:c.code,title:c.title,meetings:c.fitGroups.map(g=>g.options.find(o=>shuttleForOption(o))||g.options[0])});saveAndRender();renderResults()});
  $("addBlockButton").onclick=()=>{$("blockForm").hidden=false;$("blockName").focus()};$("cancelBlock").onclick=()=>{$("blockForm").hidden=true};
  $("blockForm").addEventListener("submit",e=>{e.preventDefault();const selected=[...document.querySelectorAll("#blockDays input:checked")].map(i=>i.value),start=$("blockStart").value,end=$("blockEnd").value;if(!selected.length||!start||!end||mins(end)<=mins(start)){alert("Choose at least one day and an end time after the start time.");return}state.schedule.push({id:`block-${Date.now()}`,kind:"block",location:$("blockLocation").value,title:$("blockName").value.trim(),meetings:[{days:selected,start,end}]});e.target.reset();e.target.hidden=true;saveAndRender()});
  $("clearSchedule").onclick=()=>{state.schedule=[];saveAndRender()};$("clearQuery").onclick=()=>{$("wellesleySearch").value="";$("suggestions").hidden=true;$("clearQuery").hidden=true};$("findMatches").onclick=findMatches;$("showMore").onclick=()=>{state.visible+=20;renderResults()};$("ratingFilter").addEventListener("input",e=>{$("ratingValue").textContent=+e.target.value?`${(+e.target.value).toFixed(1)}+ / 7`:"Any"});document.addEventListener("click",e=>{if(!e.target.closest(".course-search-wrap"))$("suggestions").hidden=true});
  $("majorSelect").addEventListener("change",e=>{degreeState.majorId=e.target.value;degreeVisible=18;saveDegreeState();renderDegreePlanner()});
  function updateRequirement(e){const input=e.target.closest("[data-requirement-id]");if(!input)return;const id=input.dataset.requirementId;if(input.dataset.requirementScope==="general"){degreeState.general=input.checked?[...new Set([...degreeState.general,id])]:degreeState.general.filter(value=>value!==id)}else{const major=currentMajor();if(!major)return;const completed=degreeState.majors[major.id]||[];degreeState.majors[major.id]=input.checked?[...new Set([...completed,id])]:completed.filter(value=>value!==id)}degreeVisible=18;saveDegreeState();renderDegreePlanner()}
  $("generalRequirements").addEventListener("change",updateRequirement);$("majorRequirements").addEventListener("change",updateRequirement);
  $("degreeMatches").addEventListener("click",e=>{const button=e.target.closest("[data-degree-add]");if(button)addWellesleyCourse(data.wellesley.find(course=>course.id===button.dataset.degreeAdd))});
  $("moreDegreeMatches").onclick=()=>{degreeVisible+=18;renderDegreeMatches()};
  $("semesterTabs").addEventListener("click",e=>{const button=e.target.closest("[data-semester]");if(button)switchSemester(button.dataset.semester)});
  renderSemesterTabs();updateCatalogNote();renderDegreePlanner();saveAndRender();
})();
