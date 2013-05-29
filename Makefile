VERSION=$(shell cat ./client/js/version.js | sed 's/[^\"]*\"\([^\"]*\)\"[^\"]*/\1/g')
CWD=$(shell pwd)
DATE=$(shell date +%I:%M%p)
CHECK=\033[32m✔\033[39m
HR=\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#

SRC_DIR=./client/
SRCJS_DIR=./client/js/
TEST_DIR=./test/
DOCS=./docs/
BUILD=./fine-uploader/

NODE_MODULES=./node_modules/

SELENIUM=${TESTS}vendor/selenium-server-standalone-2.33.0.jar

# core
SRCJS=${SRCJS_DIR}header.js \
	  ${SRCJS_DIR}util.js \
	  ${SRCJS_DIR}version.js \
	  ${SRCJS_DIR}features.js \
	  ${SRCJS_DIR}promise.js \
	  ${SRCJS_DIR}button.js \
	  ${SRCJS_DIR}paste.js \
	  ${SRCJS_DIR}upload-data.js \
	  ${SRCJS_DIR}uploader.basic.js \
	  ${SRCJS_DIR}dnd.js \
	  ${SRCJS_DIR}uploader.js \
	  ${SRCJS_DIR}ajax.requester.js \
	  ${SRCJS_DIR}deletefile.ajax.requester.js \
	  ${SRCJS_DIR}window.receive.message.js \
	  ${SRCJS_DIR}handler.base.js \
	  ${SRCJS_DIR}handler.form.js \
	  ${SRCJS_DIR}handler.xhr.js 

# jQuery plugin
JQ_SRCJS+=${SRCJS}
JQ_SRCJS+=${SRCJS_DIR}jquery-plugin.js \
		  ${SRCJS_DIR}jquery-dnd.js

all: release

release: clean-node clean-vendor clean node_modules vendor_modules build test docs
	@echo "${HR}"
	@echo "${DATE}\n"
	@echo "${CHECK} Done with a release build.\n"

#
# Build
#
build: build-js build-css build-img
	@echo "${CHECK} Built!"

build-js: concat-js minify-js 
#build-js: lint concat-js minify-js 

build-css: minify-css

build-img:
	cp ${SRC_DIR}{loading.gif,processing.gif} ${BUILD}img 

#build-docs: docs

#
# Clean
#
clean: clean-build clean-docs clean-vendor
	@echo "\n${HR}"
	@echo "${CHECK} So fresh, so clean!\n"

clean-build:
	rm -rf ${BUILD}*
	mkdir -p ${BUILD}{js,css,img}

clean-docs:
	rm -rf ${DOCS}docco.css
	rm -rf ${DOCS}fine-uploader.html
	rm -rf ${DOCS}public

clean-node:
	rm -rf ${NODE_MODULES}

clean-vendor:
	rm -rf ${TEST_DIR}vendor/*

#
# Docs
#
docs:
	@echo "\n${HR}"
	@echo "Building docs ..."
	#${NODE_MODULES}docco/bin/docco -o ${DOCS} ${BUILD}js/fine-uploader.js
	@echo "${CHECK} Docs built!\n"

#
# Tests
#
## Test everything, done before a release
test-all: clean build test

## Quicker test; useful during development
test:
	@echo "\n${HR}"
	@echo "Running tests ..."
	PHANTOMJS_BIN=${NODE_MODULES}phantomjs/bin/phantomjs ${NODE_MODULES}karma/bin/karma start --single-run
	@echo "${CHECK} Tests complete!\n"

## Test whenever changes are made.
test-watch:
	@echo "Watching tests ..."
	PHANTOMJS_BIN=${NODE_MODULES}phantomjs/bin/phantomjs ${NODE_MODULES}karma/bin/karma start
	@echo "${CHECK} Tests complete!\n"

#
# Utils
#

## Node Modules
node_modules: package.json
	npm update

vendor_modules:
	cp ${NODE_MODULES}chai/chai.js ${TEST_DIR}vendor
	cp ${NODE_MODULES}mocha/mocha.js ${TEST_DIR}vendor
	cp ${NODE_MODULES}mocha/mocha.css ${TEST_DIR}vendor
	curl http://code.jquery.com/jquery-1.10.0.min.js >> ${TEST_DIR}vendor/jquery-1.10.0.min.js
	curl http://code.jquery.com/jquery-2.0.1.min.js >> ${TEST_DIR}vendor/jquery-2.0.1.min.js
	curl https://raw.github.com/allmarkedup/jQuery-URL-Parser/master/purl.js > ${TEST_DIR}vendor/purl.js
	curl https://raw.github.com/douglascrockford/JSON-js/master/json2.js >> ${TEST_DIR}vendor/json2.js

## Concatenation
concat-js:
	@echo "Combining js ..."
	cat ${SRCJS} | tee ${BUILD}js/fine-uploader.js
	@#cat ${SRCJS} | tee ${BUILD}js/fine-uploader-${VERSION}.js
	cat ${JQ_SRCJS} | tee ${BUILD}js/jquery-fine-uploader.js
	@#cat ${JQ_SRCJS} | tee ${BUILD}js/jquery-fine-uploader-${VERSION}.js
	cat ${SRC}js/iframe.xss.response.js | tee ${BUILD}js/iframe.xss.response.js
	cp README.md ${BUILD}README
	cp LICENSE ${BUILD}LICENSE
	@echo "${SRC} JS combined."

# Minification
minify: minify-js minify-css

minify-js:
	@echo "Minifying js ..."
	${NODE_MODULES}uglify-js/bin/uglifyjs ./fine-uploader/js/fine-uploader.js -o ./fine-uploader/js/fine-uploader.min.js
	@#${NODE_MODULES}uglify-js/bin/uglifyjs ./fine-uploader/js/fine-uploader-${VERSION}.js -o ./fine-uploader/js/fine-uploader-${VERSION}.min.js
	${NODE_MODULES}uglify-js/bin/uglifyjs ./fine-uploader/js/jquery-fine-uploader.js -o ./fine-uploader/js/jquery-fine-uploader.min.js
	@#${NODE_MODULES}uglify-js/bin/uglifyjs ./fine-uploader/js/jquery-fine-uploader-${VERSION}.js -o ./fine-uploader/js/jquery-fine-uploader-${VERSION}.min.js
	@echo "${CHECK} JS minified.\n"

minify-css:
	@echo "Minifying css ..."
	cp ./client/fineuploader.css ${BUILD}css/fine-uploader.css
	@#cp ./client/fineuploader.css ${BUILD}css/fine-uploader-${VERSION}.css
	${NODE_MODULES}clean-css/bin/cleancss -o ${BUILD}css/fine-uploader.min.css ${BUILD}css/fine-uploader.css
	@#${NODE_MODULES}clean-css/bin/cleancss -o ${BUILD}css/fine-uploader-${VERSION}.min.css ${BUILD}css/fine-uploader-${VERSION}.css
	@echo "${CHECK} CSS minified.\n"

## Linting
lint:
	@echo "\n${HR}"
	@echo "Linting ..."
	${NODE_MODULES}jshint/bin/jshint ${SRCJS_DIR}
	@echo "Linted."

## Selenium
start-selenium:
	@echo "Starting Selenium ..."
	export PATH=./node_modules/phantomjs/bin:$$PATH
	PATH=./node_modules/phantomjs/bin:$$PATH java -jar ${SELENIUM} -log selenium.log -browserSideLog > /dev/null 2>&1 &
	sleep 5
	@echo "Selenium Started."

stop-selenium:
	@echo "Stopping Selenium ..."
	$(shell ps aux \
		| grep '[/]usr/bin/java -jar ./test/vendor/selenium-server-standalone' \
		| awk '{print $$2}' \
		| xargs kill $$2)
	@echo "Selenium Stopped."

restart-selenium: stop-selenium start-selenium

## Test Server
start-basic-server:
	@echo "Starting basic HTTP server ..."
	node test/basic-server.js &
	sleep 5
	@echo "Test HTTP server started."

stop-basic-server:
	@echo "Stopping basic HTTP server ..."
	cat ${TEST_DIR}pid.txt | xargs kill
	@echo "Test HTTP server stopped."

restart-basic-server: stop-basic-server start-basic-server


#
# Instructions
#

.PHONY: all release
.PHONY: clean clean-build clean-node
.PHONY: build build-release build-js build-img build-css
.PHONY: minify minify-js minify-css
.PHONY: test test-all test-watch
.PHONY: docs lint
.PHONY: start-basic-server stop-basic-server restart-basic-server
#.PHONY: start-selenium stop-selenium restart-selenium
