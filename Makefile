SHELL:=/bin/bash

less-compilation: less-checking ./less/istex/main.less
	@ ./node_modules/.bin/lessc ./less/istex/main.less ./css/main.min.css --clean-css="-s0"
	@ echo "Fichier less/istex/main.less compilé et minifié  dans css/main.min.css"

less-checking: ./node_modules/.bin/lessc ./node_modules/less-plugin-clean-css
	@ echo "Verification des modules nodes lessc et less-plugin-clean-css"

npm-install:
	@ npm install

mapping:
	@ node ./js/takeMapping.js
	@ echo "Mapping récupéré et transformé"

install: ./package.json npm-install less-compilation mapping
	@ bower install