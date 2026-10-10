# CIA Morocco RP — CIA Morocco RP — Elite Update

Portail web responsive pour une communauté Roleplay fictive : tableau de bord, missions, annonces, unités, QCM, profils, candidatures, badges/rangs et panneau Admin.

## Fonctionnalités ajoutées
- Interface en français, arabe (RTL) et espagnol. Le bouton de langue fait défiler FR → AR → ES.
- Zone membre verrouillée jusqu’à l’acceptation locale par un administrateur ; le visiteur peut créer son profil et envoyer sa candidature.
- La file Admin affiche les candidatures déposées, la photo, le nom, la motivation et le statut.
- L’administrateur peut attribuer un badge/rang : Agent 1 à Agent 10, Recrue, Soldat, Capo, Conseiller, Co-Commandant ou Commandant.
- Contrôle global de démonstration : modifier le titre d’accueil, le texte d’accueil, la bannière, ouvrir/fermer le recrutement et masquer/afficher des sections.
- Tâches et annonces peuvent être publiées et supprimées dans le panneau Admin.
- Synchronisation automatique entre onglets du même navigateur grâce à l’événement `storage`.

## Publier gratuitement avec GitHub Pages
1. Créez un nouveau dépôt public sur GitHub afin de ne pas écraser l’ancien site.
2. Téléversez `index.html`, `style.css`, `app.js`, `enhancements.js` et le dossier `assets` à la racine du dépôt.
3. Dans **Settings → Pages**, choisissez **Deploy from a branch**, puis `main` et `/ (root)`.
4. Enregistrez et attendez que GitHub fournisse l’adresse publique.

## Limite importante — données multi-utilisateurs
Cette version reste une démonstration front-end. Les candidatures, profils, badges, tâches, annonces et réglages sont enregistrés dans `localStorage` du navigateur. La synchronisation fonctionne entre onglets du même navigateur et du même site, mais **pas entre des appareils différents ni entre le navigateur d’un membre et celui de l’Admin**. C’est la raison pour laquelle une candidature d’un autre utilisateur peut ne pas apparaître dans l’espace Admin.

Pour que toutes les candidatures apparaissent chez l’Admin, que les badges soient partagés et que les contrôles soient réellement sécurisés, le site doit être relié à une base de données et à une authentification côté serveur (par exemple Supabase ou Firebase). Le code Admin `1937` est uniquement un verrou de démonstration côté navigateur et ne doit pas être considéré comme une protection réelle.

Le site est un projet communautaire fictif et ne représente aucune institution gouvernementale réelle.


### إدارة الرتب (نسخة محلية تجريبية)
من لوحة الإدارة، داخل قائمة الأعضاء المقبولين، اختر الرتبة الجديدة ثم اضغط «تأكيد الرتبة». يمكن ترقية العضو أو خفض رتبته (مثلاً من Soldat إلى Commando إذا كانت الرتبة موجودة في القائمة). التغييرات محفوظة محلياً في المتصفح فقط؛ لمزامنة الرتب بين الأجهزة يلزم ربط قاعدة بيانات وصلاحيات خادم.
