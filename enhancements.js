(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const read = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { alert('La sauvegarde locale est pleine ou indisponible.'); return false; } };
  const escapeText = (value) => String(value ?? '');
  const initials = name => (String(name||'CIA').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'CIA');
  let profile = read('cia-member-profile-v3', null);
  let applications = read('cia-member-applications-v3', []);
  let approved = read('cia-approved-members-v3', []);
  let avatarData = profile?.avatar || '';
  const ranks = ['Agent 1','Agent 2','Agent 3','Agent 4','Agent 5','Agent 6','Agent 7','Agent 8','Agent 9','Agent 10','Recrue','Soldat','Capo','Conseiller','Co-Commandant','Commandant'];
  const rankLabels = {Recrue:'Recrue',Soldat:'Soldat',Capo:'Capo',Conseiller:'Conseiller', 'Co-Commandant':'Co-Commandant',Commandant:'Commandant'};
  const toast = message => { const el=$('#toast'); if(el){el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600);} else alert(message); };
  const avatarMarkup = (url, name, cls='') => { if(url){ const img=document.createElement('img'); img.src=url; img.alt=`Photo de ${name}`; img.className=cls; return img; } const span=document.createElement('span'); span.className=cls; span.textContent=initials(name); return span; };
  function renderProfile(){
    const name=profile?.accountName || '';
    const big=$('#profileAvatarPreview'); big.replaceChildren(); big.append(avatarMarkup(profile?.avatar,name,'avatar-image'));
    $('#profilePreviewName').textContent=name || 'Aucun profil enregistré';
    $('#profilePreviewRank').textContent=profile?.rank ? `Grade : ${profile.rank}` : 'Statut : visiteur';
    $('#profilePreviewStatus').textContent=profile?.status==='accepted'?'MEMBRE ACCEPTÉ':profile?.status==='pending'?'CANDIDATURE EN ATTENTE':(profile?'PROFIL ENREGISTRÉ':'PROFIL NON CRÉÉ');
    $('#topAvatar').replaceChildren(); $('#topAvatar').append(avatarMarkup(profile?.avatar,name,'avatar-image'));
    $('#topProfileName').textContent=name || 'MON PROFIL';
    $('#applicationAccountName').value=name;
    $('#applicationAccountName').readOnly=true;
    $('#applicationAvatar').replaceChildren(); $('#applicationAvatar').append(avatarMarkup(profile?.avatar,name,'avatar-image'));
    $('#applicationProfileText').textContent=name ? `Candidature au nom de ${name}` : 'Créez d’abord votre profil membre.';
    $('#applicationForm button[type="submit"]').disabled=!name;
    if(name) $('#profileForm [name="accountName"]').value=name;
  }
  $('#profileForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const name=String(new FormData(e.currentTarget).get('accountName')||'').trim();
    if(name.length<2){toast('Saisissez le nom exact de votre compte.');return;}
    const file=$('#avatarFile').files?.[0];
    let avatar=avatarData;
    if(file){
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('Format accepté : PNG, JPG ou WEBP.');return;}
      if(file.size>2*1024*1024){toast('Choisissez une image de moins de 2 Mo.');return;}
      avatar=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>resolve('');reader.readAsDataURL(file);});
    }
    const priorStatus=profile?.status==='accepted'?'accepted':(profile?.status==='pending'?'pending':'profile');
    profile={accountName:name,avatar,rank:profile?.rank||'Visiteur',status:priorStatus,updatedAt:new Date().toISOString()};
    avatarData=avatar;
    if(!write('cia-member-profile-v3',profile))return;
    $('#profileFeedback').textContent='Profil enregistré sur cet appareil. Le nom de compte n’est pas vérifié automatiquement.';
    renderProfile();if(typeof applySiteSettings==='function')applySiteSettings();toast('Profil membre enregistré.');
  });
  $('#profileLogout').addEventListener('click',()=>{
    if(!confirm('Effacer le profil enregistré sur cet appareil ?'))return;
    profile=null;avatarData='';$('#profileForm').reset();write('cia-member-profile-v3',null);renderProfile();toast('Profil effacé de cet appareil.');
  });
  // Replace the previous local preview handler with a richer application queue.
  const oldForm=$('#applicationForm'); const formClone=oldForm.cloneNode(true); oldForm.replaceWith(formClone);
  formClone.addEventListener('submit',e=>{
    e.preventDefault();
    if(!profile?.accountName){toast('Créez d’abord votre profil membre.');location.hash='#profile';return;}
    const f=new FormData(formClone); const name=String(f.get('name')||'').trim();
    if(name!==profile.accountName){toast('Le nom doit correspondre au profil enregistré.');return;}
    const app={id:`app-${Date.now()}-${Math.random().toString(16).slice(2,7)}`,accountName:profile.accountName,avatar:profile.avatar||'',age:String(f.get('age')||''),role:String(f.get('role')||''),motivation:String(f.get('motivation')||'').trim(),status:'pending',submittedAt:new Date().toISOString()};
    applications=applications.filter(x=>x.accountName.toLowerCase()!==app.accountName.toLowerCase());applications.push(app);
    profile.status='pending';write('cia-member-profile-v3',profile);write('cia-member-applications-v3',applications);
    $('#formFeedback').textContent='Candidature ajoutée à la file locale. Un administrateur doit vérifier le nom du compte manuellement.';
    renderProfile();renderApplications();if(typeof applySiteSettings==='function')applySiteSettings();toast('Candidature enregistrée localement.');
  });
  function createAvatar(url,name){return avatarMarkup(url,name,'avatar-image');}
  function renderApplications(){
    const list=$('#applicationReviewList');list.replaceChildren();
    if(!applications.length){const p=document.createElement('p');p.className='empty-admin';p.textContent='Aucune candidature locale pour le moment.';list.append(p);} 
    applications.slice().reverse().forEach(app=>{
      const card=document.createElement('article');card.className='review-card';
      const head=document.createElement('div');head.className='review-person';const av=document.createElement('div');av.className='review-avatar';av.append(createAvatar(app.avatar,app.accountName));const ident=document.createElement('div');const title=document.createElement('h4');title.textContent=app.accountName;const meta=document.createElement('p');meta.textContent=`${app.role} · ${app.age} ans · ${new Date(app.submittedAt).toLocaleDateString()}`;const status=document.createElement('span');status.className=`review-status status-${app.status}`;status.textContent=app.status==='accepted'?'ACCEPTÉE':app.status==='rejected'?'REFUSÉE':'EN ATTENTE';ident.append(title,meta,status);head.append(av,ident);card.append(head);
      const motivation=document.createElement('p');motivation.className='review-motivation';motivation.textContent=app.motivation;card.append(motivation);
      if(app.status==='pending'){
        const controls=document.createElement('div');controls.className='review-controls';const select=document.createElement('select');select.setAttribute('aria-label','Grade à attribuer');ranks.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;select.append(o);});
        const accept=document.createElement('button');accept.type='button';accept.className='btn btn-red';accept.textContent='ACCEPTER + ATTRIBUER LE GRADE';accept.addEventListener('click',()=>{const member={accountName:app.accountName,avatar:app.avatar,rank:select.value,acceptedAt:new Date().toISOString()};approved=approved.filter(m=>m.accountName.toLowerCase()!==member.accountName.toLowerCase());approved.push(member);app.status='accepted';app.rank=member.rank;if(profile?.accountName.toLowerCase()===app.accountName.toLowerCase()){profile.status='accepted';profile.rank=member.rank;write('cia-member-profile-v3',profile);renderProfile();}write('cia-member-applications-v3',applications);write('cia-approved-members-v3',approved);renderApplications();toast(`تم قبول ${app.accountName} برتبة ${member.rank}`);});
        const reject=document.createElement('button');reject.type='button';reject.className='btn btn-outline';reject.textContent='رفض';reject.addEventListener('click',()=>{app.status='rejected';write('cia-member-applications-v3',applications);renderApplications();toast('تم تحديث حالة الطلب.');});controls.append(select,accept,reject);card.append(controls);
      } else if(app.status==='accepted'){const rank=document.createElement('p');rank.className='approved-rank';rank.textContent=`الرتبة المعتمدة: ${app.rank||'Recrue'}`;card.append(rank);}
      list.append(card);
    });
    const members=$('#approvedMembersList');members.replaceChildren();
    if(!approved.length){const p=document.createElement('p');p.className='empty-admin';p.textContent='Les membres acceptés apparaîtront ici.';members.append(p);return;}
    approved.forEach(member=>{
      const row=document.createElement('article');row.className='approved-member';
      const av=document.createElement('div');av.className='review-avatar';av.append(createAvatar(member.avatar,member.accountName));
      const info=document.createElement('div');info.className='approved-member-info';
      const name=document.createElement('h4');name.textContent=member.accountName;
      const rank=document.createElement('p');rank.textContent=`الرتبة الحالية: ${member.rank||'Recrue'}`;
      info.append(name,rank);
      const controls=document.createElement('div');controls.className='rank-management';
      const select=document.createElement('select');select.setAttribute('aria-label',`تغيير رتبة ${member.accountName}`);
      ranks.forEach(r=>{const option=document.createElement('option');option.value=r;option.textContent=r;if(r===(member.rank||'Recrue'))option.selected=true;select.append(option);});
      const save=document.createElement('button');save.type='button';save.className='btn btn-red';save.textContent='تأكيد الرتبة';
      save.addEventListener('click',()=>{
        const newRank=select.value;const target=approved.find(m=>m.accountName.toLowerCase()===member.accountName.toLowerCase());
        if(!target)return;const oldRank=target.rank||'Recrue';target.rank=newRank;target.rankUpdatedAt=new Date().toISOString();
        applications=applications.map(app=>app.accountName.toLowerCase()===target.accountName.toLowerCase()?{...app,rank:newRank}:app);
        if(profile?.accountName.toLowerCase()===target.accountName.toLowerCase()){profile.rank=newRank;write('cia-member-profile-v3',profile);renderProfile();}
        write('cia-approved-members-v3',approved);write('cia-member-applications-v3',applications);renderApplications();
        toast(`تم تغيير رتبة ${target.accountName} من ${oldRank} إلى ${newRank}`);
      });
      controls.append(select,save);row.append(av,info,controls);members.append(row);
    });
  }
  renderProfile();renderApplications();
  window.addEventListener('storage',event=>{
    if(!event.key || ['cia-member-profile-v3','cia-member-applications-v3','cia-approved-members-v3'].includes(event.key)){
      profile=read('cia-member-profile-v3',null);applications=read('cia-member-applications-v3',[]);approved=read('cia-approved-members-v3',[]);avatarData=profile?.avatar||'';renderProfile();renderApplications();if(typeof applySiteSettings==='function')applySiteSettings();
    }
  });

  // Multilingual toggle: French, Arabic (RTL), and Spanish.
  const translations={
    'Vue générale':'نظرة عامة','Missions & tâches':'المهام والتكليفات','Annonces':'الإعلانات','Unités & grades':'الوحدات والرتب','Académie / QCM':'الأكاديمية / اختبار','Recrutement':'الانضمام','Profil membre':'الملف الشخصي','Espace Admin':'لوحة الإدارة','MON PROFIL':'ملفي الشخصي','REJOINDRE LA CIA':'الانضمام إلى CIA',
    'SYSTÈME OPÉRATIONNEL':'النظام يعمل','PORTAIL COMMUNAUTAIRE':'بوابة المجتمع','CENTRE DE COMMANDEMENT':'مركز القيادة','ORDRE • RESPECT • DISCIPLINE':'النظام • الاحترام • الانضباط','Un univers Roleplay fictif, construit par la communauté.':'مجتمع لعب أدوار خيالي من تنظيم الأعضاء.','TABLEAU DE BORD':'لوحة القيادة','HEURE LOCALE':'التوقيت المحلي',
    'DOSSIER CENTRAL // ACCÈS COMMUNAUTAIRE':'المركز الرئيسي // بوابة الأعضاء','LA MISSION':'المهمة','NE S’ARRÊTE':'لا تتوقف','NE S\'ARRÊTE':'لا تتوقف','JAMAIS.':'أبداً.','Bienvenue au centre CIA Morocco RP. Consultez les consignes, suivez les missions, découvrez les unités et préparez votre candidature.':'مرحباً بك في مركز CIA Morocco RP. تابع التعليمات والمهام، تعرّف على الوحدات، وجهّز طلب الانضمام.','ACCÉDER AUX MISSIONS':'عرض المهام','ESPACE ADMIN':'لوحة الإدارة','PORTAIL COMMUNAUTAIRE':'بوابة المجتمع','RÉFÉRENCE :':'المرجع:','STATUT DU RÉSEAU':'حالة الشبكة','CONNECTÉ':'متصل','NIVEAU':'المستوى','COMMUNAUTÉ':'المجتمع','SECTEUR':'القطاع','MAROC / RP':'المغرب / لعب الأدوار','AVIS CENTRAL':'إعلان مركزي','MISSIONS PUBLIÉES':'المهام المنشورة','Tâches communautaires':'مهام المجتمع','ANNONCES CENTRALES':'الإعلانات المركزية','Informations récentes':'آخر المعلومات','UNITÉS STRUCTURÉES':'الوحدات المنظمة','Organisation Roleplay':'تنظيم لعب الأدوار','OUVERT':'مفتوح','Candidatures communautaires':'طلبات الانضمام',
    'OBJECTIFS PRIORITAIRES':'الأهداف ذات الأولوية','MISSIONS':'المهام','Les consignes publiées pour la communauté. Choisissez une mission pour consulter son brief.':'التعليمات المنشورة للأعضاء. اختر مهمة للاطلاع على تفاصيلها.','PUBLIER UNE TÂCHE':'نشر مهمة','PRIORITÉ HAUTE':'أولوية عالية','PRIORITÉ NORMALE':'أولوية عادية','PRIORITÉ BASSE':'أولوية منخفضة','Briefing de la semaine':'اجتماع الأسبوع','Consulter les règles RP, les consignes générales et les objectifs communautaires.':'راجع قواعد لعب الأدوار والتعليمات العامة وأهداف المجتمع.','Préparation des recrues':'إعداد الأعضاء الجدد','Découvrir la charte, les rôles disponibles et les critères d’intégration.':'تعرّف على الميثاق والأدوار المتاحة وشروط الانضمام.','Entraînement QCM':'تدريب الاختبار','Passer le test de démonstration et vérifier sa compréhension des règles.':'أجرِ الاختبار التجريبي وتأكد من فهمك للقواعد.','CONSULTER LE BRIEF':'عرض التفاصيل','LANCER L’ENTRAÎNEMENT':'بدء التدريب','RÉCURRENT':'متكرر','ÉQUIPE CIA':'فريق CIA','À FAIRE':'مطلوب إنجازه','RECRUTEMENT':'الانضمام','ACADÉMIE':'الأكاديمية',
    'TRANSMISSIONS':'الرسائل','ANNONCES':'الإعلانات','Les nouvelles et messages publiés par l’administration du site.':'الأخبار والرسائل التي تنشرها إدارة الموقع.','FIL D’INFORMATION':'موجز الأخبار','COMMUNICATION GÉNÉRALE':'تواصل عام','Bienvenue au sein de CIA Morocco RP':'مرحباً بك في CIA Morocco RP','Respectez la charte, gardez un esprit d’équipe et consultez régulièrement les mises à jour.':'احترم الميثاق، تعاون مع الفريق، وتابع التحديثات بانتظام.','Les candidatures sont ouvertes':'طلبات الانضمام مفتوحة','Présentez votre profil et votre motivation dans le formulaire en bas de page.':'قدّم ملفك الشخصي ودوافعك عبر الاستمارة.','ACTIF':'نشط','ORGANISATION':'التنظيم','UNITÉS':'الوحدات','Une hiérarchie communautaire claire pour un Roleplay cohérent.':'هيكل تنظيمي واضح لمجتمع لعب أدوار منظم.','Commandement':'القيادة','Coordination, arbitrage et orientation de la communauté.':'التنسيق وحل الخلافات وتوجيه المجتمع.','LEADERSHIP':'القيادة','Opérations RP':'عمليات لعب الأدوار','Organisation des activités et respect du cadre Roleplay.':'تنظيم الأنشطة واحترام قواعد لعب الأدوار.','OPÉRATIONS':'العمليات','Formation':'التكوين','Accueil, apprentissage, préparation et évaluations.':'الاستقبال والتعلم والتحضير والتقييم.','Support':'الدعم','Orientation des membres et traitement des questions.':'توجيه الأعضاء والإجابة عن الاستفسارات.','ASSISTANCE':'المساعدة','CIA Morocco RP est un projet communautaire fictif. Les noms et unités présentés ici ne représentent pas une institution officielle réelle.':'CIA Morocco RP مشروع مجتمعي خيالي ولا يمثل أي مؤسسة رسمية حقيقية.',
    'ACADÉMIE CIA':'أكاديمية CIA','CONNAÎTRE LES':'تعرّف على','RÈGLES DU JEU.':'قواعد المجتمع.','Testez vos réflexes communautaires avec un QCM rapide. Votre score est calculé sur cet appareil.':'اختبر فهمك لقواعد المجتمع عبر اختبار قصير. تُحسب النتيجة على هذا الجهاز.','QUESTIONS DE DÉMO':'أسئلة تجريبية','UNE SEULE RÉPONSE PAR QUESTION':'إجابة واحدة لكل سؤال','ÉVALUATION / DÉMO':'اختبار تجريبي','Sélectionnez une réponse.':'اختر إجابة.','VALIDER':'تأكيد','TERMINER':'إنهاء','RÉSULTAT DE L’ÉVALUATION':'نتيجة الاختبار','Votre score :':'نتيجتك:','RECOMMENCER':'إعادة المحاولة',
    'NOUS REJOINDRE':'انضم إلينا','VOTRE PLACE':'مكانك','VOUS ATTEND.':'ينتظرك.','Envoyez votre candidature pour rejoindre l’univers communautaire CIA Morocco RP.':'أرسل طلبك للانضمام إلى مجتمع CIA Morocco RP.','PRÉSENTEZ-VOUS':'عرّف بنفسك','EXPLIQUEZ VOTRE MOTIVATION':'اشرح دوافعك','LISEZ LA CHARTE':'اقرأ الميثاق','FORMULAIRE D’INTÉGRATION':'استمارة الانضمام','CIA / RECRUTEMENT':'CIA / الانضمام','NOM EXACT DU COMPTE':'اسم الحساب الصحيح','ÂGE':'العمر','POSTE SOUHAITÉ':'الدور المطلوب','Sélectionner un rôle':'اختر دوراً','MOTIVATION':'الدافع','Pourquoi souhaitez-vous rejoindre CIA ? (20 caractères minimum)':'لماذا تريد الانضمام إلى CIA؟ (20 حرفاً على الأقل)','J’accepte la charte communautaire et confirme l’exactitude des informations.':'أوافق على ميثاق المجتمع وأؤكد صحة المعلومات.','PRÉPARER MA CANDIDATURE':'تقديم طلب الانضمام','Créer d’abord votre profil membre.':'أنشئ ملفك الشخصي أولاً.','Candidature au nom de':'طلب باسم','Profil enregistré sur cet appareil. Le nom de compte n’est pas vérifié automatiquement.':'تم حفظ الملف على هذا الجهاز. لا يتم التحقق من اسم الحساب تلقائياً.',
    'IDENTITÉ MEMBRE':'هوية العضو','VOTRE PROFIL':'ملفك الشخصي','CIA OFFICIEL.':'ملف CIA','Créez votre fiche membre avec le nom exact de votre compte et votre photo. Les informations seront reprises dans votre candidature.':'أنشئ ملف العضو باستخدام اسم حسابك الصحيح وصورتك. ستُستخدم هذه المعلومات في طلب الانضمام.','PROFIL MEMBRE':'ملف العضو','Aucun profil enregistré':'لا يوجد ملف محفوظ','Statut : visiteur':'الحالة: زائر','PROFIL NON CRÉÉ':'لم يتم إنشاء الملف','CRÉER / MODIFIER MON PROFIL':'إنشاء / تعديل ملفي','CIA / MEMBRE':'CIA / عضو','PHOTO DE PROFIL':'صورة الملف الشخصي','PNG, JPG ou WEBP. Choisissez une photo ou un avatar que vous avez le droit d’utiliser.':'PNG أو JPG أو WEBP. استخدم صورة تملك حق استخدامها.','ENREGISTRER MON PROFIL':'حفظ ملفي الشخصي','EFFACER CE PROFIL DE CET APPAREIL':'مسح الملف من هذا الجهاز','Démo locale : ce profil n’est pas un compte sécurisé et n’est pas partagé entre appareils.':'نسخة تجريبية: هذا الملف ليس حساباً آمناً ولا تتم مشاركته بين الأجهزة.','MEMBRE ACCEPTÉ':'عضو مقبول','Grade :':'الرتبة:','Profil enregistré':'تم حفظ الملف','ESPACE':'المساحة','ADMIN':'الإدارة','ZONE DE GESTION':'منطقة الإدارة','Créez des tâches et publiez des annonces directement sur cette page.':'أنشئ المهام وانشر الإعلانات من هذه الصفحة.','MODE DÉMONSTRATION':'وضع تجريبي','SAUVEGARDE SUR CET APPAREIL':'الحفظ على هذا الجهاز','ACCÈS ADMINISTRATEUR':'دخول الإدارة','Cette zone est réservée aux administrateurs CIA. Entrez le code d’accès pour ouvrir le centre de gestion.':'هذه المنطقة مخصصة لإدارة CIA. أدخل رمز الدخول لفتح مركز التحكم.','CODE D’ACCÈS':'رمز الدخول','DÉVERROUILLER LE CENTRE':'فتح مركز التحكم','ACCÈS PROTÉGÉ · CODE REQUIS':'الوصول محمي · الرمز مطلوب','SESSION ADMIN NON OUVERTE':'جلسة الإدارة غير مفتوحة','SESSION ADMIN ACTIVE':'جلسة الإدارة نشطة','VERROUILLER':'قفل','CANDIDATURES & MEMBRES':'الطلبات والأعضاء','Vérifiez le nom du compte manuellement, puis acceptez ou refusez la candidature et attribuez un grade.':'تحقق من اسم الحساب يدوياً، ثم اقبل الطلب أو ارفضه وحدد الرتبة.','MEMBRES ACCEPTÉS':'الأعضاء المقبولون','PUBLIER UNE TÂCHE':'نشر مهمة','Ajouter une mission au tableau de bord':'إضافة مهمة إلى لوحة القيادة','TITRE DE LA TÂCHE':'عنوان المهمة','DESCRIPTION':'الوصف','PRIORITÉ':'الأولوية','UNITÉ':'الوحدة','Tous les membres':'جميع الأعضاء','PUBLIER LA TÂCHE':'نشر المهمة','PUBLIER UNE ANNONCE':'نشر إعلان','Envoyer un message sur le fil central':'إرسال رسالة في الموجز المركزي','TITRE DE L’ANNONCE':'عنوان الإعلان','MESSAGE':'الرسالة','CATÉGORIE':'الفئة','PUBLIER L’ANNONCE':'نشر الإعلان','CONTENU PUBLIÉ':'المحتوى المنشور','RÉINITIALISER LES AJOUTS':'مسح الإضافات','SUPPRIMER':'حذف','RETOUR EN HAUT':'العودة للأعلى','DISCIPLINE. LOYAUTÉ. MISSION.':'الانضباط. الولاء. المهمة.','COMPRIS':'تم','Profil membre':'الملف الشخصي','CANDIDATURE EN ATTENTE':'طلب الانضمام قيد المراجعة','ACCÈS MEMBRE RESTREINT':'الدخول مخصص للأعضاء المقبولين','CONTRÔLE GLOBAL DU SITE':'التحكم الكامل في الموقع','ENREGISTRER LES RÉGLAGES':'حفظ الإعدادات'
  };
  const spanishTranslations={
    'Vue générale':'Resumen','Missions & tâches':'Misiones y tareas','Annonces':'Anuncios','Unités & grades':'Unidades y rangos','Académie / QCM':'Academia / Test','Recrutement':'Solicitud de ingreso','Profil membre':'Perfil de miembro','Espace Admin':'Panel de administración','MON PROFIL':'MI PERFIL','REJOINDRE LA CIA':'UNIRSE A CIA',
    'SYSTÈME OPÉRATIONNEL':'SISTEMA OPERATIVO','PORTAIL COMMUNAUTAIRE':'PORTAL DE LA COMUNIDAD','CENTRE DE COMMANDEMENT':'CENTRO DE MANDO','ORDRE • RESPECT • DISCIPLINE':'ORDEN • RESPETO • DISCIPLINA','TABLEAU DE BORD':'PANEL PRINCIPAL','HEURE LOCALE':'HORA LOCAL',
    'DOSSIER CENTRAL // ACCÈS COMMUNAUTAIRE':'CENTRO PRINCIPAL // ACCESO COMUNITARIO','Bienvenue au centre CIA Morocco RP. Consultez les consignes, suivez les missions, découvrez les unités et préparez votre candidature.':'Bienvenido al centro CIA Morocco RP. Consulta las instrucciones, sigue las misiones, conoce las unidades y prepara tu solicitud.','ACCÉDER AUX MISSIONS':'VER LAS MISIONES','ESPACE ADMIN':'PANEL ADMIN','AVIS CENTRAL':'AVISO CENTRAL','MISSIONS PUBLIÉES':'MISIONES PUBLICADAS','ANNONCES CENTRALES':'ANUNCIOS CENTRALES','UNITÉS STRUCTURÉES':'UNIDADES ORGANIZADAS','OUVERT':'ABIERTO',
    'OBJECTIFS PRIORITAIRES':'OBJETIVOS PRIORITARIOS','MISSIONS':'MISIONES','Les consignes publiées pour la communauté. Choisissez une mission pour consulter son brief.':'Instrucciones publicadas para la comunidad. Selecciona una misión para ver sus detalles.','PUBLIER UNE TÂCHE':'PUBLICAR UNA TAREA','PRIORITÉ HAUTE':'PRIORIDAD ALTA','PRIORITÉ NORMALE':'PRIORIDAD NORMAL','PRIORITÉ BASSE':'PRIORIDAD BAJA','Briefing de la semaine':'Reunión semanal','Préparation des recrues':'Preparación de reclutas','Entraînement QCM':'Práctica de test','CONSULTER LE BRIEF':'VER LOS DETALLES','LANCER L’ENTRAÎNEMENT':'INICIAR LA PRÁCTICA',
    'TRANSMISSIONS':'COMUNICADOS','ANNONCES':'ANUNCIOS','Les nouvelles et messages publiés par l’administration du site.':'Noticias y mensajes publicados por la administración del sitio.','FIL D’INFORMATION':'CENTRO DE NOTICIAS','Bienvenue au sein de CIA Morocco RP':'Bienvenido a CIA Morocco RP','Les candidatures sont ouvertes':'Las solicitudes están abiertas','ACTIF':'ACTIVO','ORGANISATION':'ORGANIZACIÓN','UNITÉS':'UNIDADES','Commandement':'Mando','Opérations RP':'Operaciones RP','Formation':'Formación','Support':'Soporte',
    'ACADÉMIE CIA':'ACADEMIA CIA','CONNAÎTRE LES':'CONOCE LAS','RÈGLES DU JEU.':'REGLAS DEL JUEGO.','Testez vos réflexes communautaires avec un QCM rapide. Votre score est calculé sur cet appareil.':'Pon a prueba tus conocimientos con un test rápido. La puntuación se calcula en este dispositivo.','QUESTIONS DE DÉMO':'PREGUNTAS DE PRUEBA','VALIDER':'CONFIRMAR','TERMINER':'FINALIZAR','RÉSULTAT DE L’ÉVALUATION':'RESULTADO DE LA PRUEBA','RECOMMENCER':'REPETIR',
    'NOUS REJOINDRE':'ÚNETE A NOSOTROS','VOTRE PLACE':'TU LUGAR','VOUS ATTEND.':'TE ESPERA.','Envoyez votre candidature pour rejoindre l’univers communautaire CIA Morocco RP.':'Envía tu solicitud para unirte a la comunidad CIA Morocco RP.','PRÉSENTEZ-VOUS':'PRESÉNTATE','EXPLIQUEZ VOTRE MOTIVATION':'EXPLICA TU MOTIVACIÓN','LISEZ LA CHARTE':'LEE LAS NORMAS','FORMULAIRE D’INTÉGRATION':'FORMULARIO DE INGRESO','NOM EXACT DU COMPTE':'NOMBRE EXACTO DE LA CUENTA','ÂGE':'EDAD','POSTE SOUHAITÉ':'PUESTO SOLICITADO','Sélectionner un rôle':'Selecciona un puesto','MOTIVATION':'MOTIVACIÓN','PRÉPARER MA CANDIDATURE':'ENVIAR SOLICITUD',
    'IDENTITÉ MEMBRE':'IDENTIDAD DEL MIEMBRO','VOTRE PROFIL':'TU PERFIL','CIA OFFICIEL.':'PERFIL OFICIAL CIA','PROFIL MEMBRE':'PERFIL DE MIEMBRO','Aucun profil enregistré':'No hay ningún perfil guardado','PROFIL NON CRÉÉ':'PERFIL NO CREADO','CRÉER / MODIFIER MON PROFIL':'CREAR / EDITAR MI PERFIL','PHOTO DE PROFIL':'FOTO DE PERFIL','ENREGISTRER MON PROFIL':'GUARDAR MI PERFIL','EFFACER CE PROFIL DE CET APPAREIL':'BORRAR EL PERFIL DE ESTE DISPOSITIVO','MEMBRE ACCEPTÉ':'MIEMBRO ACEPTADO','Grade :':'Rango:',
    'ZONE DE GESTION':'ZONA DE GESTIÓN','Créez des tâches et publiez des annonces directement sur cette page.':'Crea tareas y publica anuncios desde esta página.','MODE DÉMONSTRATION':'MODO DE DEMOSTRACIÓN','SAUVEGARDE SUR CET APPAREIL':'GUARDADO EN ESTE DISPOSITIVO','ACCÈS ADMINISTRATEUR':'ACCESO DE ADMINISTRADOR','CODE D’ACCÈS':'CÓDIGO DE ACCESO','DÉVERROUILLER LE CENTRE':'DESBLOQUEAR EL CENTRO','SESSION ADMIN ACTIVE':'SESIÓN ADMIN ACTIVA','VERROUILLER':'BLOQUEAR','CANDIDATURES & MEMBRES':'SOLICITUDES Y MIEMBROS','MEMBRES ACCEPTÉS':'MIEMBROS ACEPTADOS','PUBLIER UNE ANNONCE':'PUBLICAR UN ANUNCIO','TITRE DE L’ANNONCE':'TÍTULO DEL ANUNCIO','MESSAGE':'MENSAJE','CATÉGORIE':'CATEGORÍA','PUBLIER L’ANNONCE':'PUBLICAR ANUNCIO','CONTENU PUBLIÉ':'CONTENIDO PUBLICADO','RÉINITIALISER LES AJOUTS':'RESTABLECER CONTENIDO','SUPPRIMER':'ELIMINAR','RETOUR EN HAUT':'VOLVER ARRIBA','DISCIPLINE. LOYAUTÉ. MISSION.':'DISCIPLINA. LEALTAD. MISIÓN.','CANDIDATURE EN ATTENTE':'SOLICITUD PENDIENTE','ACCÈS MEMBRE RESTREINT':'ACCESO RESTRINGIDO A MIEMBROS','CONTRÔLE GLOBAL DU SITE':'CONTROL GLOBAL DEL SITIO','ENREGISTRER LES RÉGLAGES':'GUARDAR CONFIGURACIÓN'
  };
  let currentLanguage='fr';
  const originalText=new WeakMap();
  function dictionary(){return currentLanguage==='ar'?translations:(currentLanguage==='es'?spanishTranslations:{});}
  function translateTextNode(node){
    const current=node.nodeValue;const trimmed=current.trim();if(!trimmed)return;
    if(!originalText.has(node))originalText.set(node,trimmed);
    let source=originalText.get(node);if(current.trim()!==source && current.trim()!==translations[source] && current.trim()!==spanishTranslations[source]){source=current.trim();originalText.set(node,source);}const translated=dictionary()[source];
    const leading=current.match(/^\s*/)?.[0]||'';const trailing=current.match(/\s*$/)?.[0]||'';
    node.nodeValue=leading+((currentLanguage==='fr')?source:(translated||source))+trailing;
  }
  function applyLanguage(){
    document.documentElement.lang=currentLanguage;document.documentElement.dir=currentLanguage==='ar'?'rtl':'ltr';document.body.classList.toggle('arabic-mode',currentLanguage==='ar');
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))translateTextNode(node);
    $$('input[placeholder],textarea[placeholder]').forEach(el=>{if(!el.dataset.originalPlaceholder)el.dataset.originalPlaceholder=el.placeholder;const original=el.dataset.originalPlaceholder;el.placeholder=currentLanguage==='fr'?original:(dictionary()[original]||original);});
    $('#langBtn').innerHTML=currentLanguage.toUpperCase()+' <span>⌄</span>';
    $('#langBtn').setAttribute('aria-label',currentLanguage==='fr'?'Change language: French':currentLanguage==='ar'?'تغيير اللغة: العربية':'Cambiar idioma: español');
  }
  const oldLang=$('#langBtn');const newLang=oldLang.cloneNode(true);oldLang.replaceWith(newLang);
  newLang.addEventListener('click',()=>{currentLanguage=currentLanguage==='fr'?'ar':currentLanguage==='ar'?'es':'fr';try{localStorage.setItem('cia-language',currentLanguage);}catch{}applyLanguage();});
  try{const savedLanguage=localStorage.getItem('cia-language');if(['fr','ar','es'].includes(savedLanguage))currentLanguage=savedLanguage;}catch{}
  const rerenderObserver=new MutationObserver(records=>{records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else if(n.nodeType===Node.ELEMENT_NODE){const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode()))translateTextNode(t);}}));});
  rerenderObserver.observe(document.body,{subtree:true,childList:true});
  applyLanguage();
  const sectionLabelMap={home:'TABLEAU DE BORD',missions:'MISSIONS & TÂCHES',announcements:'ANNONCES CENTRALES',units:'UNITÉS & STRUCTURE',academy:'ACADÉMIE CIA',profile:'PROFIL MEMBRE',apply:'RECRUTEMENT',admin:'ESPACE ADMIN'};
  // Update section observer for the new profile anchor in the breadcrumb.
  const profileObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){const label=sectionLabelMap[entry.target.id];if(label)$('#sectionName').textContent=arabic?(translations[label]||label):label;}}),{rootMargin:'-25% 0px -60% 0px'});
  ['profile'].forEach(id=>profileObserver.observe($('#'+id)));

  // Access gate: visitors can create a profile and apply, but member sections stay hidden until approval.
  const siteSettingsDefaults={heroTitle:"LA MISSION|NE S'ARRÊTE|JAMAIS.",heroLead:'Bienvenue au centre CIA Morocco RP. Consultez les consignes, suivez les missions, découvrez les unités et préparez votre candidature.',ticker:'Bienvenue sur le portail CIA Morocco RP — consultez les missions et annonces officielles de la communauté.',recruitment:'open',memberGate:'approval',showMissions:true,showAnnouncements:true,showUnits:true,showAcademy:true};
  let siteSettings={...siteSettingsDefaults,...read('cia-site-settings-v1',{})};
  const settingsForm=$('#siteSettingsForm');
  function applySiteSettings(){
    const titleParts=String(siteSettings.heroTitle||siteSettingsDefaults.heroTitle).split('|');const hero=$('.hero h1');if(hero){hero.replaceChildren();titleParts.forEach((part,i)=>{if(i)hero.append(document.createElement('br'));const span=document.createElement(i===1?'span':i===2?'em':'b');span.textContent=part;hero.append(span);});}
    const lead=$('.hero-lead');if(lead)lead.textContent=siteSettings.heroLead||siteSettingsDefaults.heroLead;
    const ticker=$('#tickerText');if(ticker)ticker.textContent=siteSettings.ticker||siteSettingsDefaults.ticker;
    const recruitmentOpen=siteSettings.recruitment!=='closed';$$('.stat-highlight b').forEach(el=>el.textContent=recruitmentOpen?'OUVERT':'FERMÉ');
    const applySection=$('#apply');if(applySection){applySection.classList.toggle('recruitment-closed',!recruitmentOpen);const submit=$('#applicationForm button[type="submit"]');if(submit)submit.disabled=!recruitmentOpen;}
    [['missions','showMissions'],['announcements','showAnnouncements'],['units','showUnits'],['academy','showAcademy']].forEach(([id,key])=>{const el=$('#'+id);if(el)el.classList.toggle('admin-hidden-section',siteSettings[key]===false);});
    const locked=siteSettings.memberGate!=='open' && profile?.status!=='accepted';document.body.classList.toggle('site-locked',locked);
    const banner=$('#memberAccessBanner');if(banner){banner.hidden=!locked;const title=$('#accessBannerTitle'),copy=$('#accessBannerText');if(title)title.textContent=profile?.status==='pending'?'CANDIDATURE EN ATTENTE':'ACCÈS MEMBRE RESTREINT';if(copy)copy.textContent=profile?.status==='pending'?'Votre demande a été enregistrée sur cet appareil. Attendez qu’un administrateur examine votre candidature.':'Pour accéder au portail, créez votre profil, envoyez votre candidature et attendez qu’un administrateur vous attribue un badge.';}
  }
  function fillSettingsForm(){if(!settingsForm)return;Object.entries(siteSettings).forEach(([key,value])=>{const field=settingsForm.elements.namedItem(key);if(!field)return;if(field.type==='checkbox')field.checked=Boolean(value);else field.value=value;});}
  if(settingsForm){fillSettingsForm();settingsForm.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(settingsForm);siteSettings={heroTitle:String(f.get('heroTitle')||siteSettingsDefaults.heroTitle).trim(),heroLead:String(f.get('heroLead')||siteSettingsDefaults.heroLead).trim(),ticker:String(f.get('ticker')||siteSettingsDefaults.ticker).trim(),recruitment:String(f.get('recruitment')||'open'),memberGate:String(f.get('memberGate')||'approval'),showMissions:f.has('showMissions'),showAnnouncements:f.has('showAnnouncements'),showUnits:f.has('showUnits'),showAcademy:f.has('showAcademy')};write('cia-site-settings-v1',siteSettings);applySiteSettings();$('#siteSettingsFeedback').textContent='Réglages appliqués sur cet appareil.';toast('Configuration du site mise à jour.');});}
  const originalRenderProfile=renderProfile;
  // Re-check the member gate whenever a profile/application is updated.
  const gateObserver=new MutationObserver(()=>applySiteSettings());gateObserver.observe($('#profilePreviewStatus'),{childList:true,subtree:true,characterData:true});
  applySiteSettings();
})();
