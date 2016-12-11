.PHONY: clean _build publish

version=$(shell node -pe "require('./package.json').version")
dist-out-dir = _dist
pub-dir = $(dist-out-dir)/$(version)

npm-bin = $(shell npm bin)

build-out-dir = _build
src-dir = client
js-src-dir = $(src-dir)/js
js-3rdparty-src-dir = $(js-src-dir)/third-party
test-dir = test
unit-test-dir = $(test-dir)/unit

export-file = $(js-src-dir)/export.js

preamble = "// Fine Uploader $(version) - (c) 2013-present Widen Enterprises, Inc. MIT licensed. http://fineuploader.com"

cryptojs-files = \
	$(js-3rdparty-src-dir)/crypto-js/core.js \
	$(js-3rdparty-src-dir)/crypto-js/enc-base64.js \
	$(js-3rdparty-src-dir)/crypto-js/hmac.js \
	$(js-3rdparty-src-dir)/crypto-js/sha1.js \
	$(js-3rdparty-src-dir)/crypto-js/sha256.js \
	$(js-3rdparty-src-dir)/crypto-js/lib-typedarrays.js

jquery-files = \
	$(js-src-dir)/jquery-plugin.js \
	$(js-src-dir)/jquery-dnd.js

dnd-files-only = \
	$(js-src-dir)/dnd.js

dnd-files = \
	$(js-src-dir)/util.js \
	$(export-file) \
	$(js-src-dir)/version.js \
	$(js-src-dir)/features.js \
	$(js-src-dir)/promise.js \
	$(js-src-dir)/dnd.js

core-files = \
	$(js-src-dir)/util.js \
	$(export-file) \
	$(js-src-dir)/error/error.js \
	$(js-src-dir)/version.js \
	$(js-src-dir)/features.js \
	$(js-src-dir)/promise.js \
	$(js-src-dir)/blob-proxy.js \
	$(js-src-dir)/button.js \
	$(js-src-dir)/upload-data.js \
	$(js-src-dir)/uploader.basic.api.js \
	$(js-src-dir)/uploader.basic.js \
	$(js-src-dir)/ajax.requester.js \
	$(js-src-dir)/upload-handler/upload.handler.js \
	$(js-src-dir)/upload-handler/upload.handler.controller.js \
	$(js-src-dir)/window.receive.message.js \
	$(js-src-dir)/upload-handler/form.upload.handler.js \
	$(js-src-dir)/upload-handler/xhr.upload.handler.js \
	$(js-src-dir)/deletefile.ajax.requester.js \
	$(js-src-dir)/image-support/megapix-image.js \
	$(js-src-dir)/image-support/image.js \
	$(js-src-dir)/image-support/exif.js \
	$(js-src-dir)/identify.js \
	$(js-src-dir)/image-support/validation.image.js \
	$(js-src-dir)/session.js \
	$(js-src-dir)/session.ajax.requester.js \
	$(js-src-dir)/image-support/scaler.js \
	$(js-src-dir)/third-party/ExifRestorer.js \
	$(js-src-dir)/total-progress.js \
	$(js-src-dir)/paste.js \
	$(js-src-dir)/form-support.js \

ui-files = \
	$(dnd-files-only) \
	$(js-src-dir)/uploader.api.js \
	$(js-src-dir)/uploader.js \
	$(js-src-dir)/templating.js \
	$(js-src-dir)/ui.handler.events.js \
    $(js-src-dir)/ui.handler.click.filebuttons.js \
	$(js-src-dir)/ui.handler.click.filename.js \
	$(js-src-dir)/ui.handler.focusin.filenameinput.js \
	$(js-src-dir)/ui.handler.focus.filenameinput.js \
	$(js-src-dir)/ui.handler.edit.filename.js

traditional-files-only = \
	$(js-src-dir)/traditional/traditional.form.upload.handler.js \
	$(js-src-dir)/traditional/traditional.xhr.upload.handler.js \
	$(js-src-dir)/traditional/all-chunks-done.ajax.requester.js \

traditional-files = \
	$(core-files) \
	$(traditional-files-only)

traditional-jquery-files = \
	$(jquery-files) \
	$(traditional-files)

traditional-ui-files = \
	$(core-files) \
	$(traditional-files-only) \
	$(ui-files)

traditional-ui-jquery-files = \
	$(jquery-files) \
	$(traditional-ui-files)

s3-files-only = \
	$(cryptojs-files) \
	$(js-src-dir)/s3/util.js \
	$(js-src-dir)/non-traditional-common/uploader.basic.api.js \
	$(js-src-dir)/s3/uploader.basic.js \
	$(js-src-dir)/s3/request-signer.js \
	$(js-src-dir)/uploadsuccess.ajax.requester.js \
	$(js-src-dir)/s3/multipart.initiate.ajax.requester.js \
	$(js-src-dir)/s3/multipart.complete.ajax.requester.js \
	$(js-src-dir)/s3/multipart.abort.ajax.requester.js \
	$(js-src-dir)/s3/s3.xhr.upload.handler.js \
	$(js-src-dir)/s3/s3.form.upload.handler.js

s3-files = \
	$(core-files) \
	$(s3-files-only)

s3-ui-files-only = \
	$(js-src-dir)/s3/uploader.js

s3-ui-files = \
	$(core-files) \
	$(s3-files-only) \
	$(ui-files) \
	$(s3-ui-files-only) \

s3-ui-jquery-files = \
	$(jquery-files) \
    $(js-src-dir)/s3/jquery-plugin.js \
	$(s3-ui-files)

azure-files-only = \
	$(js-src-dir)/azure/util.js \
	$(js-src-dir)/non-traditional-common/uploader.basic.api.js \
	$(js-src-dir)/azure/uploader.basic.js \
	$(js-src-dir)/azure/azure.xhr.upload.handler.js \
	$(js-src-dir)/azure/get-sas.js \
	$(js-src-dir)/uploadsuccess.ajax.requester.js \
	$(js-src-dir)/azure/rest/delete-blob.js \
	$(js-src-dir)/azure/rest/put-blob.js \
	$(js-src-dir)/azure/rest/put-block.js \
	$(js-src-dir)/azure/rest/put-block-list.js

azure-files = \
	$(core-files) \
	$(azure-files-only)

azure-ui-files-only = \
	$(js-src-dir)/azure/uploader.js

azure-ui-files = \
	$(core-files) \
	$(azure-files-only) \
	$(ui-files) \
	$(azure-ui-files-only)

azure-ui-jquery-files = \
	$(jquery-files) \
    $(js-src-dir)/azure/jquery-plugin.js \
	$(azure-ui-files)

all-core-files = \
	$(core-files) \
	$(traditional-files-only) \
	$(s3-files-only) \
	$(azure-files-only)

all-core-jquery-files = \
	$(jquery-files) \
	$(all-core-files)

all-files = \
	$(core-files) \
	$(traditional-files-only) \
	$(ui-files) \
	$(s3-files-only) \
	$(s3-ui-files-only) \
	$(azure-files-only) \
	$(azure-ui-files-only)

all-jquery-files = \
	$(jquery-files) \
	$(all-files)

clean:
	rm -rf $(build-out-dir)
	rm -rf $(dist-out-dir)

lint:
	$(npm-bin)/jscs $(js-src-dir)/*
	$(npm-bin)/jshint $(js-src-dir)/* $(unit-test-dir)/* $(test-dir)/static/local/*

_build:
	mkdir -p $@
	cp -pR $(src-dir)/placeholders $@
	cp -pR $(src-dir)/html/templates $@
	cp LICENSE $@
	cp $(src-dir)/*.css $@
	cp $(src-dir)/*.gif $@
	$(npm-bin)/cleancss --source-map $@/fine-uploader.css -o $@/fine-uploader.min.css
	$(npm-bin)/cleancss --source-map $@/fine-uploader-gallery.css -o $@/fine-uploader-gallery.min.css
	$(npm-bin)/cleancss --source-map $@/fine-uploader-new.css -o $@/fine-uploader-new.min.css

uglify = $(npm-bin)/uglifyjs -b --preamble $(preamble) -e window:global -p relative --source-map-include-sources
uglify-min = $(npm-bin)/uglifyjs -c -m --preamble $(preamble) -e window:global -p relative --source-map-include-sources

build-dnd-standalone: _build
	$(uglify) $(dnd-files) -o $(build-out-dir)/dnd.js --source-map $(build-out-dir)/dnd.js.map

build-dnd-standalone-min: _build
	$(uglify-min) $(dnd-files) -o $(build-out-dir)/dnd.min.js --source-map $(build-out-dir)/dnd.min.js.map

build-core-traditional: _build
	$(uglify) $(traditional-files) -o $(build-out-dir)/fine-uploader.core.js --source-map $(build-out-dir)/fine-uploader.core.js.map

build-core-traditional-min: _build
	$(uglify-min) $(traditional-files) -o $(build-out-dir)/fine-uploader.core.min.js --source-map $(build-out-dir)/fine-uploader.core.min.js.map

build-ui-traditional: _build
	$(uglify) $(traditional-ui-files) -o $(build-out-dir)/fine-uploader.js --source-map $(build-out-dir)/fine-uploader.js.map

build-ui-traditional-min: _build
	$(uglify-min) $(traditional-ui-files) -o $(build-out-dir)/fine-uploader.min.js --source-map $(build-out-dir)/fine-uploader.min.js.map

build-ui-traditional-jquery: _build
	$(uglify) $(traditional-ui-jquery-files) -o $(build-out-dir)/jquery.fine-uploader.js --source-map $(build-out-dir)/jquery.fine-uploader.js.map

build-ui-traditional-jquery-min: _build
	$(uglify-min) $(traditional-ui-jquery-files) -o $(build-out-dir)/jquery.fine-uploader.min.js --source-map $(build-out-dir)/jquery.fine-uploader.min.js.map

build-core-s3: _build
	$(uglify) $(s3-files) -o $(build-out-dir)/s3.fine-uploader.core.js --source-map $(build-out-dir)/s3.fine-uploader.core.js.map

build-core-s3-min: _build
	$(uglify-min) $(s3-files) -o $(build-out-dir)/s3.fine-uploader.core.min.js --source-map $(build-out-dir)/s3.fine-uploader.core.min.js.map

build-ui-s3: _build
	$(uglify) $(s3-ui-files) -o $(build-out-dir)/s3.fine-uploader.js --source-map $(build-out-dir)/s3.fine-uploader.js.map

build-ui-s3-min: _build
	$(uglify-min) $(s3-ui-jquery-files) -o $(build-out-dir)/s3.jquery.fine-uploader.min.js --source-map $(build-out-dir)/s3.jquery.fine-uploader.min.js.map

build-ui-s3-jquery: _build
	$(uglify) $(s3-ui-jquery-files) -o $(build-out-dir)/s3.jquery.fine-uploader.js --source-map $(build-out-dir)/s3.jquery.fine-uploader.js.map

build-ui-s3-jquery-min: _build
	$(uglify-min) $(s3-ui-files) -o $(build-out-dir)/s3.fine-uploader.min.js -e window:global --source-map $(build-out-dir)/s3.fine-uploader.min.js.map

build-core-azure: _build
	$(uglify) $(azure-files) -o $(build-out-dir)/azure.fine-uploader.core.js --source-map $(build-out-dir)/azure.fine-uploader.core.js.map 

build-core-azure-min: _build
	$(uglify-min) $(azure-files) -o $(build-out-dir)/azure.fine-uploader.core.min.js -e window:global --source-map $(build-out-dir)/azure.fine-uploader.core.min.js.map

build-ui-azure: _build
	$(uglify) $(azure-ui-files) -o $(build-out-dir)/azure.fine-uploader.js --source-map $(build-out-dir)/azure.fine-uploader.js.map 

build-ui-azure-min: _build
	$(uglify-min) $(azure-ui-files) -o $(build-out-dir)/azure.fine-uploader.min.js -e window:global --source-map $(build-out-dir)/azure.fine-uploader.min.js.map

build-ui-azure-jquery: _build
	$(uglify) $(azure-ui-jquery-files) -o $(build-out-dir)/azure.jquery.fine-uploader.js --source-map $(build-out-dir)/azure.jquery.fine-uploader.js.map 

build-ui-azure-jquery-min: _build
	$(uglify-min) $(azure-ui-jquery-files) -o $(build-out-dir)/azure.jquery.fine-uploader.min.js -e window:global --source-map $(build-out-dir)/azure.jquery.fine-uploader.min.js.map

build-all-core: _build
	$(uglify) $(all-core-files) -o $(build-out-dir)/all.fine-uploader.core.js --source-map $(build-out-dir)/all.fine-uploader.core.js.map 

build-all-core-min: _build
	$(uglify-min) $(all-core-files) -o $(build-out-dir)/all.fine-uploader.core.min.js -e window:global --source-map $(build-out-dir)/all.fine-uploader.core.min.js.map

build-all-ui: _build
	$(uglify) $(all-files) -o $(build-out-dir)/all.fine-uploader.js --source-map $(build-out-dir)/all.fine-uploader.js.map 

build-all-ui-min: _build
	$(uglify-min) $(all-files) -o $(build-out-dir)/all.fine-uploader.min.js --source-map $(build-out-dir)/all.fine-uploader.min.js.map

build: \
	build-dnd-standalone \
	build-dnd-standalone-min \
	build-core-traditional \
	build-core-traditional-min \
	build-ui-traditional \
	build-ui-traditional-min \
	build-ui-traditional-jquery \
	build-ui-traditional-jquery-min \
	build-core-s3 \
	build-core-s3-min \
	build-ui-s3 \
	build-ui-s3-min \
	build-ui-s3-jquery \
	build-ui-s3-jquery-min \
	build-core-azure \
	build-core-azure-min \
	build-ui-azure \
	build-ui-azure-min \
	build-ui-azure-jquery \
	build-ui-azure-jquery-min \
	build-all-core \
	build-all-core-min \
	build-all-ui \
	build-all-ui-min

start-test-resources-server: test-resources-server.PID

start-root-server: root-server.PID

test-resources-server.PID:
	$(npm-bin)/static test/unit/resources -H '{"Access-Control-Allow-Origin": "*"}' -p 3000 & echo $$! > $@

root-server.PID:
	$(npm-bin)/static . -p 3001 & echo $$! > $@

stop-test-resources-server: test-resources-server.PID
	kill `cat $<` && rm $<

stop-root-server: root-server.PID
	kill `cat $<` && rm $<

test: start-test-resources-server start-root-server build-all-ui
	$(npm-bin)/karma start config/karma.conf.js
	make stop-test-resources-server
	make stop-root-server

zip: zip-traditional zip-s3 zip-azure zip-all

common-zip-files = \
	dnd*.* \
	LICENSE \
	placeholders/* \
	templates/* \
	*.gif \
	fine-uploader*.css*

zip-traditional:
	(cd $(build-out-dir) ; zip fine-uploader.zip $(common-zip-files) fine-uploader*.* jquery.fine-uploader*.*)

zip-s3:
	(cd $(build-out-dir) ; zip s3.fine-uploader.zip $(common-zip-files) s3*.*)

zip-azure:
	(cd $(build-out-dir) ; zip azure.fine-uploader.zip $(common-zip-files) azure*.*)

zip-all:
	(cd $(build-out-dir) ; zip all.fine-uploader.zip $(common-zip-files) all*.*)

setup-dist:
	mkdir -p $(pub-dir)
	cp LICENSE README.md package.json $(pub-dir)
	cp -pR $(src-dir)/commonjs/ $(pub-dir)/lib/

copy-build-to-dist:
	mkdir -p $(pub-dir)/$(PUB-SUBDIR)
	cp -pR $(build-out-dir)/placeholders $(build-out-dir)/templates $(pub-dir)/$(PUB-SUBDIR)
	cp $(build-out-dir)/*.gif $(pub-dir)/$(PUB-SUBDIR)
ifneq (,$(findstring jquery,$(PUB-SUBDIR)))
else
	cp $(build-out-dir)/$(PUB-SUBDIR).core.min* $(build-out-dir)/$(PUB-SUBDIR).core.js* $(pub-dir)/$(PUB-SUBDIR)/
endif
	cp $(build-out-dir)/$(PUB-SUBDIR).min* $(build-out-dir)/$(PUB-SUBDIR).js* $(pub-dir)/$(PUB-SUBDIR)
	cp $(build-out-dir)/fine-uploader*.css* $(pub-dir)/$(PUB-SUBDIR)

copy-dnd:
	mkdir -p $(pub-dir)/dnd
	cp $(build-out-dir)/dnd*.* $(pub-dir)/dnd

copy-traditional-dist:
	make copy-build-to-dist PUB-SUBDIR=fine-uploader
	cp $(js-src-dir)/iframe.xss.response.js $(pub-dir)/fine-uploader

copy-traditional-jquery-dist:
	make copy-build-to-dist PUB-SUBDIR=jquery.fine-uploader
	cp $(js-src-dir)/iframe.xss.response.js $(pub-dir)/jquery.fine-uploader

copy-s3-dist:
	make copy-build-to-dist PUB-SUBDIR=s3.fine-uploader

copy-s3-jquery-dist:
	make copy-build-to-dist PUB-SUBDIR=s3.jquery.fine-uploader

copy-azure-dist:
	make copy-build-to-dist PUB-SUBDIR=azure.fine-uploader

copy-azure-jquery-dist:
	make copy-build-to-dist PUB-SUBDIR=azure.jquery.fine-uploader

copy-all-dist:
	make copy-build-to-dist PUB-SUBDIR=all.fine-uploader

tag-release:
ifeq ($(simulate), true)
	@echo version is $(version)
else
	git tag $(version)
	git push origin $(version)
endif

push-to-npm:
ifeq ($(simulate), true)
	@echo not publishing - simulation mode
else
	(cd $(pub-dir) ; npm publish)
endif

publish: \
	clean \
	build \
	zip \
	setup-dist \
	copy-dnd \
	copy-traditional-dist \
	copy-traditional-jquery-dist \
	copy-s3-dist \
	copy-s3-jquery-dist \
	copy-azure-dist \
	copy-azure-jquery-dist \
	copy-all-dist \
	tag-release \
	push-to-npm

setup-dev:
	(cd test/dev/handlers; curl -sS https://getcomposer.org/installer | php; php composer.phar install)

start-local-dev:
	(. test/dev/handlers/s3keys.sh; php -S 0.0.0.0:9090 -t . -c test/dev/handlers/php.ini)

update-dev:
	(cd test/dev/handlers; php composer.phar update)

rev-version:
	sed -i "" -e 's/$(version)/$(target)/g' client/js/version.js
	sed -i "" -e 's/$(version)/$(target)/g' package.json
