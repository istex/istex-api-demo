# istex-api-demo #

Démontrateur pour l'API de la plateforme ISTEX.

Le démonstrateur est basé sur le framework Bootstrap de Twitter.

## Installation
Installer les composants Bower
```
npm run install:bower
```
**Note:** Si vous n'avez pas Bower, vous pouvez l'installer avec `npm install -g bower`.

Compiler les fichiers css
```
npm run build:css
```

Générer le fichier de configuration
```
npm run build:config
```

Générer le mapping
```
npm run mapping
```

## Lancement
Lancement classique (redémarrage nécessaire à chaque modification du code)
```
npm start
```

Lancement avec mise à jour automatique
```
npm run watch
```

Le démonstrateur est ensuite disponible à l'URL suivante http://127.0.0.1:8080/
