ISTEX-API-DEMO
=============
Changements depuis le tag v1.2.3
Correspond à l'API v.3.4.0
-------------
 Merge branch 'advancedQuery'
CorpusName dans la recherche avancée devient un select
Nettoyage du code obsolète de recherche avancée
Suppression des correspondances de langues non utilisées et peu probables de l'être un jour (393 langues sur 487)
Corrections : recherche 'ne commence pas par' + version négative avec NOT + affichage du temps en secondes si timeTotal>999ms
Ajout de quelques champs + meilleure gestion des types de filtre
Génération des morceaux de requête selon le type de demande
Ajout des opérateurs possibles
Ajout du numéro de version dans le footer + champs autocomplete plus petits + première version de queryBuilder
Insertion de jquery queryBuilder

