SHELL:=/bin/bash

less-compilation: less-checking ./less/istex/main.less
	@ ./node_modules/.bin/lessc ./less/istex/main.less ./css/main.min.css --clean-css="-s0"
	@ echo "Fichier main.less compilé et minifié"

less-checking: ./node_modules/.bin/lessc ./node_modules/less-plugin-clean-css
	@ echo "Verification des modules nodes"

install: ./package.json

