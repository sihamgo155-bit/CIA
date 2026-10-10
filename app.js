(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const toast = $('#toast');
  let toastTimer;
  function notify(message){ toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2800); }
  const safeRead = (key) => { try { const v=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } };
  const save = (key, value) => { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { notify('Sauvegarde locale indisponible dans ce navigateur.'); return false; } };
  let tasks=safeRead('cia-rp-tasks-v2');
  let notices=safeRead('cia-rp-notices-v2');
  // Client-side demo gate. This is a visual barrier, not secure authentication.
  const ADMIN_ACCESS_CODE = '1937';
  const adminGate = $('#adminGate'), adminProtected = $('#adminProtected');
  const adminLoginForm = $('#adminLoginForm'), adminCodeInput = $('#adminCode');
  let adminUnlocked = false;
  adminLoginForm.addEventListener('submit', e => {
    e.preventDefault();
    const feedback = $('#adminLoginFeedback');
    if (adminCodeInput.value === ADMIN_ACCESS_CODE) {
      adminUnlocked = true;
      adminGate.hidden = true;
      adminProtected.hidden = false;
      feedback.textContent = 'ACCÈS AUTORISÉ';
      adminCodeInput.value = '';
      notify('Bienvenue dans le centre Admin CIA.');
    } else {
      feedback.textContent = 'CODE INCORRECT — ACCÈS REFUSÉ';
      adminCodeInput.value = '';
      adminCodeInput.focus();
      adminGate.classList.remove('gate-error');
      void adminGate.offsetWidth;
      adminGate.classList.add('gate-error');
    }
  });
  $('#adminLogout').addEventListener('click', () => {
    adminUnlocked = false;
    adminProtected.hidden = true;
    adminGate.hidden = false;
    $('#adminLoginFeedback').textContent = 'ACCÈS PROTÉGÉ · CODE REQUIS';
    adminCodeInput.value = '';
    notify('Espace Admin verrouillé.');
  });
  const priorityLabels={high:'PRIORITÉ HAUTE',medium:'PRIORITÉ NORMALE',low:'PRIORITÉ BASSE'};
  const priorityClass={high:'priority-high',medium:'priority-medium',low:'priority-low'};
  const missionGrid=$('#missionGrid'), announcementList=$('#announcementList'), adminContentList=$('#adminContentList');
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  function renderTasks(){
    $$('.mission-card[data-user-task]').forEach(el=>el.remove());
    tasks.forEach((t,i)=>{
      const card=make('article','mission-card');card.dataset.userTask=t.id;
      const top=make('div','mission-card-top');top.append(make('span','mission-id',`TASK / ${String(i+4).padStart(3,'0')}`));top.append(make('span',`priority ${priorityClass[t.priority]||priorityClass.medium}`,priorityLabels[t.priority]||priorityLabels.medium));card.append(top);
      card.append(make('div','mission-symbol','▣'));card.append(make('h3','',t.title));card.append(make('p','',t.description));
      const meta=make('div','mission-meta');meta.append(make('span','',`◷ ${t.unit.toUpperCase()}`));meta.append(make('span','','PUBLIÉ PAR ADMIN'));card.append(meta);
      const btn=make('button','text-button','CONSULTER LE BRIEF');btn.type='button';btn.append(make('b','','↗'));btn.addEventListener('click',()=>showBrief(t.title,`${t.description}\n\nUnité : ${t.unit}\nPriorité : ${priorityLabels[t.priority]||priorityLabels.medium}`));card.append(btn);missionGrid.append(card);
    });
    $('#missionCount').textContent=String(3+tasks.length).padStart(2,'0');
  }
  function renderNotices(){
    $$('.announcement[data-user-notice]').forEach(el=>el.remove());
    notices.forEach((n,i)=>{
      const row=make('article','announcement');row.dataset.userNotice=n.id;
      row.append(make('div','announcement-mark',i%2?'↗':'!'));
      const body=make('div','announcement-body');const meta=make('div','announcement-meta');meta.append(make('span','',n.category.toUpperCase()));meta.append(make('time','',`MESSAGE / ${String(i+3).padStart(3,'0')}`));body.append(meta);body.append(make('h3','',n.title));body.append(make('p','',n.message));row.append(body);row.append(make('span','announcement-status','ACTIF'));announcementList.prepend(row);
    });
    $('#announcementCount').textContent=String(2+notices.length).padStart(2,'0');
    if(notices.length){$('#tickerText').textContent=notices[0].title+' — '+notices[0].message;}
    else $('#tickerText').textContent='Bienvenue sur le portail CIA Morocco RP — consultez les missions et annonces officielles de la communauté.';
  }
  function renderAdminList(){
    adminContentList.replaceChildren();
    const entries=[...tasks.map(t=>({...t,kind:'TÂCHE'})),...notices.map(n=>({...n,kind:'ANNONCE'}))];
    if(!entries.length){adminContentList.append(make('p','empty-admin','Les tâches et annonces ajoutées apparaîtront ici.'));return;}
    entries.reverse().forEach(entry=>{
      const row=make('div','admin-item');row.append(make('div','admin-item-icon',entry.kind==='TÂCHE'?'▣':'◉'));
      const info=make('div','');info.append(make('h4','',entry.title));info.append(make('p','',entry.description||entry.message));info.append(make('small','',`${entry.kind} · ${entry.unit||entry.category||'CIA'}`));row.append(info);
      const del=make('button','delete-button','SUPPRIMER');del.type='button';del.addEventListener('click',()=>{if(entry.kind==='TÂCHE'){tasks=tasks.filter(x=>x.id!==entry.id);save('cia-rp-tasks-v2',tasks);}else{notices=notices.filter(x=>x.id!==entry.id);save('cia-rp-notices-v2',notices);}renderAll();notify('Contenu supprimé de ce navigateur.');});row.append(del);adminContentList.append(row);
    });
  }
  function renderAll(){renderTasks();renderNotices();renderAdminList();}
  $('#taskForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const t={id:Date.now()+Math.random().toString(16).slice(2),title:String(f.get('title')).trim(),description:String(f.get('description')).trim(),priority:String(f.get('priority')||'medium'),unit:String(f.get('unit')||'Tous les membres')};if(!t.title||!t.description)return;tasks.push(t);save('cia-rp-tasks-v2',tasks);e.currentTarget.reset();renderAll();notify('Tâche publiée sur cette page.');$('#missions').scrollIntoView({behavior:'smooth'});});
  $('#noticeForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const n={id:Date.now()+Math.random().toString(16).slice(2),title:String(f.get('title')).trim(),message:String(f.get('message')).trim(),category:String(f.get('category')||'Communication générale')};if(!n.title||!n.message)return;notices.push(n);save('cia-rp-notices-v2',notices);e.currentTarget.reset();renderAll();notify('Annonce publiée sur le fil central.');$('#announcements').scrollIntoView({behavior:'smooth'});});
  $('#resetContent').addEventListener('click',()=>{if(!tasks.length&&!notices.length){notify('Aucun ajout à réinitialiser.');return;}if(!confirm('Supprimer toutes les tâches et annonces ajoutées depuis cet appareil ?'))return;tasks=[];notices=[];save('cia-rp-tasks-v2',tasks);save('cia-rp-notices-v2',notices);renderAll();notify('Les ajouts ont été réinitialisés.');});
  // Task brief modal
  const modal=$('#briefModal');function showBrief(title,body){$('#briefTitle').textContent=title;$('#briefText').textContent=body;modal.classList.add('open');modal.setAttribute('aria-hidden','false');$('#closeBrief').focus();}
  function closeBrief(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
  $('#closeBrief').addEventListener('click',closeBrief);$('#closeBriefBtn').addEventListener('click',closeBrief);modal.addEventListener('click',e=>{if(e.target===modal)closeBrief();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBrief();});
  $$('[data-demo]').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.demo;const desc=name==='Briefing de la semaine'?'Consultez les règles de la communauté, respectez les consignes et suivez les informations publiées par les administrateurs.':'Lisez la charte communautaire, choisissez le rôle qui vous intéresse et préparez une candidature claire et respectueuse.';showBrief(name,desc);}));
  // Five-question demo quiz
  const questions=[
    {q:'Si une règle du serveur n\'est pas claire, que faut-il faire ?',a:['Demander une explication à un responsable','L’ignorer sans rien dire','Décider seul de sa propre règle'],correct:0},
    {q:'Quel comportement aide le plus une communauté RP ?',a:['Gagner à tout prix','Respecter les autres et le cadre RP','Provoquer les autres membres'],correct:1},
    {q:'Vous remarquez un problème entre deux membres. Que faire ?',a:['Publier leurs informations partout','Envenimer le conflit','Rester calme et utiliser le canal de signalement prévu'],correct:2},
    {q:'Que doit contenir une bonne candidature ?',a:['Des informations honnêtes et une motivation claire','Uniquement des emojis','Des informations inventées'],correct:0},
    {q:'Une consigne administrative vous semble injuste. Quelle est la meilleure réaction ?',a:['Insulter le responsable','En discuter poliment par la voie prévue','Perturber l’activité'],correct:1}
  ];let qIndex=0,selected=null,score=0,answered=false;
  function renderQuestion(){const q=questions[qIndex];selected=null;answered=false;$('#quizCounter').textContent=`${String(qIndex+1).padStart(2,'0')} / ${String(questions.length).padStart(2,'0')}`;$('#quizProgress').style.width=`${qIndex/questions.length*100}%`;$('#quizContent').replaceChildren();$('#quizContent').append(make('div','quiz-label',`QUESTION ${String(qIndex+1).padStart(2,'0')}`));$('#quizContent').append(make('h3','',q.q));const answers=make('div','answers');q.a.forEach((answer,i)=>{const b=make('button','answer-option');b.type='button';b.append(make('span','',String.fromCharCode(65+i)));b.append(make('span','answer-text',answer));b.addEventListener('click',()=>{if(answered)return;selected=i;$$('.answer-option',answers).forEach(x=>x.classList.remove('selected'));b.classList.add('selected');});answers.append(b);});$('#quizContent').append(answers);$('#quizHint').textContent='Sélectionnez une réponse.';$('#nextQuestion').innerHTML=qIndex===questions.length-1?'TERMINER <b>✓</b>':'VALIDER <b>→</b>';}
  $('#nextQuestion').addEventListener('click',()=>{if(qIndex>=questions.length){qIndex=0;score=0;renderQuestion();return;}if(selected===null){notify('Choisissez une réponse avant de continuer.');return;}if(answered)return;answered=true;if(selected===questions[qIndex].correct)score++;$('#quizProgress').style.width=`${(qIndex+1)/questions.length*100}%`;qIndex++;if(qIndex<questions.length){renderQuestion();}else{$('#quizContent').replaceChildren();$('#quizContent').append(make('div','quiz-label','RÉSULTAT DE L’ÉVALUATION'));$('#quizContent').append(make('h3','',`Votre score : ${score} / ${questions.length}`));$('#quizContent').append(make('p','',score>=4?'Très bien ! Vous avez compris les principes essentiels de la communauté.':'Continuez à lire la charte et réessayez pour améliorer votre score.'));$('#quizCounter').textContent='TERMINÉ';$('#quizHint').textContent='Résultat calculé dans votre navigateur.';$('#nextQuestion').innerHTML='RECOMMENCER <b>↻</b>';qIndex=questions.length;}});
  // Application preview: no server-side sending
  $('#applicationForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const app={name:String(f.get('name')).trim(),age:String(f.get('age')),role:String(f.get('role')),motivation:String(f.get('motivation')).trim(),date:new Date().toLocaleString()};save('cia-rp-application-draft-v2',app);const fb=$('#formFeedback');fb.textContent=`Aperçu préparé pour ${app.name} — cette candidature n'a pas été envoyée. Copiez-la et transmettez-la aux responsables via le canal officiel de votre communauté.`;fb.style.color='#d6ff4f';notify('Aperçu préparé. Aucun envoi serveur effectué.');});
  // Navigation section label
  const labelMap={home:'TABLEAU DE BORD',missions:'MISSIONS & TÂCHES',announcements:'ANNONCES CENTRALES',units:'UNITÉS & STRUCTURE',academy:'ACADÉMIE CIA',apply:'RECRUTEMENT',admin:'ESPACE ADMIN'};
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$('#sectionName').textContent=labelMap[entry.target.id]||'PORTAIL CIA';$$('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));}});},{rootMargin:'-25% 0px -60% 0px'});
  Object.keys(labelMap).forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el);});
  function updateClock(){const now=new Date();$('#clock').textContent=now.toLocaleTimeString('fr-FR',{hour12:false});}updateClock();setInterval(updateClock,1000);$('#year').textContent=new Date().getFullYear();
  // Language toggle changes document direction and compact labels for Arabic readers.
  let arabic=false;$('#langBtn').addEventListener('click',()=>{arabic=!arabic;document.documentElement.lang=arabic?'ar':'fr';document.documentElement.dir=arabic?'rtl':'ltr';$('#langBtn').innerHTML=arabic?'AR <span>⌄</span>':'FR <span>⌄</span>';if(arabic){notify('تم تفعيل اتجاه العربية. محتوى الإدارة ما زال بالفرنسية في هذه النسخة التجريبية.');}else notify('Langue de navigation : français.');});
  renderAll();renderQuestion();
})();
