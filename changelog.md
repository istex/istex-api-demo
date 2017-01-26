ISTEX-API-DEMO
=============
Changements depuis le tag v1.4.4
Correspond à l'API v.4.0.0
-------------
 Correctif : enrichments n'apparait plus si inexistant
Merge branch 'sid'
Changement &sid vers ?sid dans certains cas
On encode la query envoyée à l'API via encodeURIComponent
Ajout sid dans les liens vers les fichiers
Ajout de &sid pour les requêtes, routes /corpus et /properties + sélection des corpus disponibles dans la recherche avancée
Ajout de la facette Science-Metrix
Merge branch 'master' of https://github.com/istex/istex-api-demo
Changement de comportement : si facette range, finir par } au lieu de ] dans la requête
Retour des errata (suite à modif mustache vers handlebars)
Merge remote-tracking branch 'origin/ocr'
Affichage Firefox
Add % to quality ocr
Icone Ocr disponible avec quality
Ajout image ocr + remplissage gitignore
Découpage des titres trop longs en CSS
Ajout du flag de la langue du document + correction enrichments : logo disparu
Suppression de fichiers img inutiles
Merge de la branche enrichments
Changement de code langue zxx
Ajout de la facette types enrichissement
Merge pull request #3 from istex/fix-about
Merge pull request #2 from istex/fix-contact-link
add info about istex-widgets
fix contact link
Remplacement de mustache par handlebars
MAJ bootstrap vers 3.3.7

