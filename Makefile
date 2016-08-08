.PHONY: clean _build publish

VERSION=$(shell node -pe "require('./package.json').version")
DIST-OUT-DIR = _dist
PUB-DIR = $(DIST-OUT-DIR)/$(VERSION)

NPM-BIN = $(shell npm bin)

BUILD-OUT-DIR = _build
SRC-DIR = client
JS-SRC-DIR = $(SRC-DIR)/js
JS-3RDPARTY-SRC-DIR = $(JS-SRC-DIR)/third-party
TEST-DIR = test
UNIT-TEST-DIR = $(TEST-DIR)/unit

EXPORT-FILE = $(JS-SRC-DIR)/export.js

PREAMBLE = "// Fine Uploader $(VERSION) - (c) 2013-present Widen Enterprises, Inc. MIT licensed. http://fineuploader.com"

CRYPTOJS-FILES = \
	$(JS-3RDPARTY-SRC-DIR)/crypto-js/core.js \
	$(JS-3RDPARTY-SRC-DIR)/crypto-js/enc-base64.js \
	$(JS-3RDPARTY-SRC-DIR)/crypto-js/hmac.js \
	$(JS-3RDPARTY-SRC-DIR)/crypto-js/sha1.js \
	$(JS-3RDPARTY-SRC-DIR)/crypto-js/sha256.js \
	$(JS-3RDPARTY-SRC-DIR)/crypto-js/lib-typedarrays.js

JQUERY-FILES = \
	$(JS-SRC-DIR)/jquery-plugin.js

DND-FILES-ONLY = \
	$(JS-SRC-DIR)/dnd.js

DND-FILES = \
	$(JS-SRC-DIR)/util.js \
	$(EXPORT-FILE) \
	$(JS-SRC-DIR)/version.js \
	$(JS-SRC-DIR)/features.js \
	$(JS-SRC-DIR)/promise.js \
	$(JS-SRC-DIR)/dnd.js

DND-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(DND-FILES)

CORE-FILES = \
	$(JS-SRC-DIR)/util.js \
	$(EXPORT-FILE) \
	$(JS-SRC-DIR)/error/error.js \
	$(JS-SRC-DIR)/version.js \
	$(JS-SRC-DIR)/features.js \
	$(JS-SRC-DIR)/promise.js \
	$(JS-SRC-DIR)/blob-proxy.js \
	$(JS-SRC-DIR)/button.js \
	$(JS-SRC-DIR)/upload-data.js \
	$(JS-SRC-DIR)/uploader.basic.api.js \
	$(JS-SRC-DIR)/uploader.basic.js \
	$(JS-SRC-DIR)/ajax.requester.js \
	$(JS-SRC-DIR)/upload-handler/upload.handler.js \
	$(JS-SRC-DIR)/upload-handler/upload.handler.controller.js \
	$(JS-SRC-DIR)/upload-handler/form.upload.handler.js \
	$(JS-SRC-DIR)/upload-handler/xhr.upload.handler.js \
	$(JS-SRC-DIR)/deletefile.ajax.requester.js \
	$(JS-SRC-DIR)/image-support/megapix-image.js \
	$(JS-SRC-DIR)/image-support/image.js \
	$(JS-SRC-DIR)/image-support/exif.js \
	$(JS-SRC-DIR)/identify.js \
	$(JS-SRC-DIR)/identify.js \
	$(JS-SRC-DIR)/image-support/validation.image.js \
	$(JS-SRC-DIR)/session.js \
	$(JS-SRC-DIR)/session.ajax.requester.js \
	$(JS-SRC-DIR)/image-support/scaler.js \
	$(JS-SRC-DIR)/third-party/ExifRestorer.js \
	$(JS-SRC-DIR)/total-progress.js \
	$(JS-SRC-DIR)/paste.js \
	$(JS-SRC-DIR)/form-support.js \

UI-FILES = \
	$(DND-FILES-ONLY) \
	$(JS-SRC-DIR)/uploader.api.js \
	$(JS-SRC-DIR)/uploader.js \
	$(JS-SRC-DIR)/templating.js \
	$(JS-SRC-DIR)/ui.handler.events.js \
    $(JS-SRC-DIR)/ui.handler.click.filebuttons.js \
	$(JS-SRC-DIR)/ui.handler.click.filename.js \
	$(JS-SRC-DIR)/ui.handler.focusin.filenameinput.js \
	$(JS-SRC-DIR)/ui.handler.focus.filenameinput.js \
	$(JS-SRC-DIR)/ui.handler.edit.filename.js

TRADITIONAL-FILES-ONLY = \
	$(JS-SRC-DIR)/traditional/traditional.form.upload.handler.js \
	$(JS-SRC-DIR)/traditional/traditional.xhr.upload.handler.js \
	$(JS-SRC-DIR)/traditional/all-chunks-done.ajax.requester.js \

TRADITIONAL-FILES = \
	$(CORE-FILES) \
	$(TRADITIONAL-FILES-ONLY)

TRADITIONAL-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(TRADITIONAL-FILES)

TRADITIONAL-UI-FILES = \
	$(CORE-FILES) \
	$(TRADITIONAL-FILES-ONLY) \
	$(UI-FILES)

TRADITIONAL-UI-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(TRADITIONAL-UI-FILES)

S3-FILES-ONLY = \
	$(CRYPTOJS-FILES) \
	$(JS-SRC-DIR)/s3/util.js \
	$(JS-SRC-DIR)/non-traditional-common/uploader.basic.api.js \
	$(JS-SRC-DIR)/s3/uploader.basic.js \
	$(JS-SRC-DIR)/s3/request-signer.js \
	$(JS-SRC-DIR)/uploadsuccess.ajax.requester.js \
	$(JS-SRC-DIR)/s3/multipart.initiate.ajax.requester.js \
	$(JS-SRC-DIR)/s3/multipart.complete.ajax.requester.js \
	$(JS-SRC-DIR)/s3/multipart.abort.ajax.requester.js \
	$(JS-SRC-DIR)/s3/s3.xhr.upload.handler.js \
	$(JS-SRC-DIR)/s3/s3.form.upload.handler.js

S3-FILES = \
	$(CORE-FILES) \
	$(S3-FILES-ONLY)

S3-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(S3-FILES)

S3-UI-FILES-ONLY = \
	$(JS-SRC-DIR)/s3/uploader.js

S3-UI-FILES = \
	$(CORE-FILES) \
	$(S3-FILES-ONLY) \
	$(UI-FILES) \
	$(S3-UI-FILES-ONLY) \

S3-UI-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(S3-UI-FILES)

AZURE-FILES-ONLY = \
	$(JS-SRC-DIR)/azure/util.js \
	$(JS-SRC-DIR)/non-traditional-common/uploader.basic.api.js \
	$(JS-SRC-DIR)/azure/uploader.basic.js \
	$(JS-SRC-DIR)/azure/azure.xhr.upload.handler.js \
	$(JS-SRC-DIR)/azure/get-sas.js \
	$(JS-SRC-DIR)/uploadsuccess.ajax.requester.js \
	$(JS-SRC-DIR)/azure/rest/delete-blob.js \
	$(JS-SRC-DIR)/azure/rest/put-blob.js \
	$(JS-SRC-DIR)/azure/rest/put-block.js \
	$(JS-SRC-DIR)/azure/rest/put-block-list.js

AZURE-FILES = \
	$(CORE-FILES) \
	$(AZURE-FILES-ONLY)

AZURE-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(AZURE-FILES)

AZURE-UI-FILES-ONLY = \
	$(JS-SRC-DIR)/azure/uploader.js

AZURE-UI-FILES = \
	$(CORE-FILES) \
	$(AZURE-FILES-ONLY) \
	$(UI-FILES) \
	$(AZURE-UI-FILES-ONLY)

AZURE-UI-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(AZURE-UI-FILES)

ALL-CORE-FILES = \
	$(CORE-FILES) \
	$(TRADITIONAL-FILES-ONLY) \
	$(S3-FILES-ONLY) \
	$(AZURE-FILES-ONLY)

ALL-CORE-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(ALL-CORE-FILES)

ALL-FILES = \
	$(CORE-FILES) \
	$(TRADITIONAL-FILES-ONLY) \
	$(UI-FILES) \
	$(S3-FILES-ONLY) \
	$(S3-UI-FILES-ONLY) \
	$(AZURE-FILES-ONLY) \
	$(AZURE-UI-FILES-ONLY)

ALL-JQUERY-FILES = \
	$(JQUERY-FILES) \
	$(ALL-FILES)

clean:
	rm -rf $(BUILD-OUT-DIR)
	rm -rf $(DIST-OUT-DIR)

lint:
	$(NPM-BIN)/jscs $(JS-SRC-DIR)/*
	$(NPM-BIN)/jshint $(JS-SRC-DIR)/* $(UNIT-TEST-DIR)/* $(TEST-DIR)/static/local/*

_build:
	mkdir -p $@
	cp -pR $(SRC-DIR)/placeholders $@
	cp -pR $(SRC-DIR)/html/templates $@
	cp LICENSE $@
	cp $(SRC-DIR)/*.css $@
	cp $(SRC-DIR)/*.gif $@
	$(NPM-BIN)/cleancss --source-map $@/fine-uploader.css -o $@/fine-uploader.min.css
	$(NPM-BIN)/cleancss --source-map $@/fine-uploader-gallery.css -o $@/fine-uploader-gallery.min.css
	$(NPM-BIN)/cleancss --source-map $@/fine-uploader-new.css -o $@/fine-uploader-new.min.css

uglify = $(NPM-BIN)/uglifyjs -b --preamble $(PREAMBLE) -e window:global -p relative --source-map-include-sources
uglify-min = $(NPM-BIN)/uglifyjs -c -m --preamble $(PREAMBLE) -e window:global -p relative --source-map-include-sources

build-dnd-standalone: _build
	$(uglify) $(DND-FILES) -o $(BUILD-OUT-DIR)/dnd.js --source-map $(BUILD-OUT-DIR)/dnd.js.map

build-dnd-standalone-min: _build
	$(uglify-min) $(DND-FILES) -o $(BUILD-OUT-DIR)/dnd.min.js --source-map $(BUILD-OUT-DIR)/dnd.min.js.map

build-core-traditional: _build
	$(uglify) $(TRADITIONAL-FILES) -o $(BUILD-OUT-DIR)/fine-uploader.core.js --source-map $(BUILD-OUT-DIR)/fine-uploader.core.js.map

build-core-traditional-min: _build
	$(uglify-min) $(TRADITIONAL-FILES) -o $(BUILD-OUT-DIR)/fine-uploader.core.min.js --source-map $(BUILD-OUT-DIR)/fine-uploader.core.min.js.map

build-ui-traditional: _build
	$(uglify) $(TRADITIONAL-UI-FILES) -o $(BUILD-OUT-DIR)/fine-uploader.js --source-map $(BUILD-OUT-DIR)/fine-uploader.js.map

build-ui-traditional-min: _build
	$(uglify-min) $(TRADITIONAL-UI-FILES) -o $(BUILD-OUT-DIR)/fine-uploader.min.js --source-map $(BUILD-OUT-DIR)/fine-uploader.min.js.map

build-ui-traditional-jquery: _build
	$(uglify) $(TRADITIONAL-UI-JQUERY-FILES) -o $(BUILD-OUT-DIR)/fine-uploader.jquery.js --source-map $(BUILD-OUT-DIR)/jquery.fine-uploader.js.map

build-ui-traditional-jquery-min: _build
	$(uglify-min) $(TRADITIONAL-UI-JQUERY-FILES) -o $(BUILD-OUT-DIR)/fine-uploader.jquery.min.js --source-map $(BUILD-OUT-DIR)/jquery.fine-uploader.min.js.map

build-core-s3: _build
	$(uglify) $(S3-FILES) -o $(BUILD-OUT-DIR)/s3.fine-uploader.core.js --source-map $(BUILD-OUT-DIR)/s3.fine-uploader.core.js.map

build-core-s3-min: _build
	$(uglify-min) $(S3-FILES) -o $(BUILD-OUT-DIR)/s3.fine-uploader.core.min.js --source-map $(BUILD-OUT-DIR)/s3.fine-uploader.core.min.js.map

build-ui-s3: _build
	$(uglify) $(S3-UI-FILES) -o $(BUILD-OUT-DIR)/s3.fine-uploader.js --source-map $(BUILD-OUT-DIR)/s3.fine-uploader.js.map

build-ui-s3-min: _build
	$(uglify-min) $(S3-UI-JQUERY-FILES) -o $(BUILD-OUT-DIR)/s3.jquery.fine-uploader.min.js --source-map $(BUILD-OUT-DIR)/s3.jquery.fine-uploader.min.js.map

build-ui-s3-jquery: _build
	$(uglify) $(S3-UI-JQUERY-FILES) -o $(BUILD-OUT-DIR)/s3.jquery.fine-uploader.js --source-map $(BUILD-OUT-DIR)/s3.jquery.fine-uploader.js.map

build-ui-s3-jquery-min: _build
	$(uglify-min) $(S3-UI-FILES) -o $(BUILD-OUT-DIR)/s3.fine-uploader.min.js -e window:global --source-map $(BUILD-OUT-DIR)/s3.fine-uploader.min.js.map

build-core-azure: _build
	$(uglify) $(AZURE-FILES) -o $(BUILD-OUT-DIR)/azure.fine-uploader.core.js --source-map $(BUILD-OUT-DIR)/azure.fine-uploader.core.js.map 

build-core-azure-min: _build
	$(uglify-min) $(AZURE-FILES) -o $(BUILD-OUT-DIR)/azure.fine-uploader.core.min.js -e window:global --source-map $(BUILD-OUT-DIR)/azure.fine-uploader.core.min.js.map

build-ui-azure: _build
	$(uglify) $(AZURE-UI-FILES) -o $(BUILD-OUT-DIR)/azure.fine-uploader.js --source-map $(BUILD-OUT-DIR)/azure.fine-uploader.js.map 

build-ui-azure-min: _build
	$(uglify-min) $(AZURE-UI-FILES) -o $(BUILD-OUT-DIR)/azure.fine-uploader.min.js -e window:global --source-map $(BUILD-OUT-DIR)/azure.fine-uploader.min.js.map

build-ui-azure-jquery: _build
	$(uglify) $(AZURE-UI-JQUERY-FILES) -o $(BUILD-OUT-DIR)/azure.jquery.fine-uploader.js --source-map $(BUILD-OUT-DIR)/azure.jquery.fine-uploader.js.map 

build-ui-azure-jquery-min: _build
	$(uglify-min) $(AZURE-UI-JQUERY-FILES) -o $(BUILD-OUT-DIR)/azure.jquery.fine-uploader.min.js -e window:global --source-map $(BUILD-OUT-DIR)/azure.jquery.fine-uploader.min.js.map

build-all-core: _build
	$(uglify) $(ALL-CORE-FILES) -o $(BUILD-OUT-DIR)/all.fine-uploader.core.js --source-map $(BUILD-OUT-DIR)/all.fine-uploader.core.js.map 

build-all-core-min: _build
	$(uglify-min) $(ALL-CORE-FILES) -o $(BUILD-OUT-DIR)/all.fine-uploader.core.min.js -e window:global --source-map $(BUILD-OUT-DIR)/all.fine-uploader.core.min.js.map

build-all-ui: _build
	$(uglify) $(ALL-FILES) -o $(BUILD-OUT-DIR)/all.fine-uploader.js --source-map $(BUILD-OUT-DIR)/all.fine-uploader.js.map 

build-all-ui-min: _build
	$(uglify-min) $(ALL-FILES) -o $(BUILD-OUT-DIR)/all.fine-uploader.min.js --source-map $(BUILD-OUT-DIR)/all.fine-uploader.min.js.map

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
	$(NPM-BIN)/static test/unit/resources -H '{"Access-Control-Allow-Origin": "*"}' -p 3000 & echo $$! > $@

root-server.PID:
	$(NPM-BIN)/static . -p 3001 & echo $$! > $@

stop-test-resources-server: test-resources-server.PID
	kill `cat $<` && rm $<

stop-root-server: root-server.PID
	kill `cat $<` && rm $<

test: start-test-resources-server start-root-server build-all-ui
	$(NPM-BIN)/karma start config/karma.conf.js
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
	(cd $(BUILD-OUT-DIR) ; zip fine-uploader.zip $(common-zip-files) fine-uploader*.*)

zip-s3:
	(cd $(BUILD-OUT-DIR) ; zip s3.fine-uploader.zip $(common-zip-files) s3*.*)

zip-azure:
	(cd $(BUILD-OUT-DIR) ; zip azure.fine-uploader.zip $(common-zip-files) azure*.*)

zip-all:
	(cd $(BUILD-OUT-DIR) ; zip all.fine-uploader.zip $(common-zip-files) all*.*)

setup-dist:
	mkdir -p $(PUB-DIR)
	cp LICENSE README.md package.json $(PUB-DIR)
	cp -pR $(SRC-DIR)/commonjs/ $(PUB-DIR)/lib/

copy-build-to-dist:
	mkdir -p $(PUB-DIR)/$(PUB-SUBDIR)
	cp -pR $(BUILD-OUT-DIR)/placeholders $(BUILD-OUT-DIR)/templates $(PUB-DIR)/$(PUB-SUBDIR)
	cp $(BUILD-OUT-DIR)/*.gif $(PUB-DIR)/$(PUB-SUBDIR)
ifneq (,$(findstring jquery,$(PUB-SUBDIR)))
else
	cp $(BUILD-OUT-DIR)/$(PUB-SUBDIR).core.min* $(BUILD-OUT-DIR)/$(PUB-SUBDIR).core.js* $(PUB-DIR)/$(PUB-SUBDIR)/
endif
	cp $(BUILD-OUT-DIR)/$(PUB-SUBDIR).min* $(BUILD-OUT-DIR)/$(PUB-SUBDIR).js* $(PUB-DIR)/$(PUB-SUBDIR)
	cp $(BUILD-OUT-DIR)/fine-uploader*.css* $(PUB-DIR)/$(PUB-SUBDIR)

copy-dnd:
	mkdir -p $(PUB-DIR)/dnd
	cp $(BUILD-OUT-DIR)/dnd*.* $(PUB-DIR)/dnd

copy-traditional-dist:
	make copy-build-to-dist PUB-SUBDIR=fine-uploader
	cp $(JS-SRC-DIR)/iframe.xss.response.js $(PUB-DIR)/fine-uploader

copy-traditional-jquery-dist:
	make copy-build-to-dist PUB-SUBDIR=jquery.fine-uploader
	cp $(JS-SRC-DIR)/iframe.xss.response.js $(PUB-DIR)/jquery.fine-uploader

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
	git tag $(VERSION)
	git push origin $(VERSION)

push-to-npm:
	(cd $(PUB-DIR) ; npm publish)

publish: \
	clean
	build
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
	sed -i "" -e 's/$(VERSION)/$(target)/g' client/js/version.js
	sed -i "" -e 's/$(VERSION)/$(target)/g' package.json
