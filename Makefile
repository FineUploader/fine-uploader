####
#
# Makefile
#
# Fine Uploader
# @author: Mark Feltner
#
# Tasks:


CURRENT_BRANCH=$(shell git rev-parse --abbrev-ref HEAD)
ON_MASTER=$(shell if [[ "master" == $$CURRENT_BRANCH ]]; then echo "true"; else echo "false"; fi)
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
BIN = ${NODE_MODULES}.bin/

CASPERJS=${TEST_DIR}vendor/casperjs/bin/casperjs
SELENIUM=${TEST_DIR}vendor/selenium-server-standalone.jar

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

all: clean-node clean-vendor build test docs
	@echo "${HR}"
	@echo "${DATE}\n"
	@echo "${CHECK} Done with a comprehensive build.\n"

#
# Build
#
build: modules clean fineuploader
	@echo "${HR}"
	@echo "${DATE}\n"
	@echo "${CHECK} Built!"

fineuploader: js css img

js: concat-js minify-js 
#js: lint concat-js minify-js 

css: minify-css

img:
	cp ${SRC_DIR}{loading.gif,processing.gif} ${BUILD}img 

clean: clean-build clean-docs 
	@echo "\n${HR}"
	@echo "${CHECK} So fresh, so clean!\n"

wipe: clean clean-node clean-vendor

clean-build:
	rm -rf ${BUILD}

clean-docs: $(DOCS)
	rm -rf ${DOCS}docco.css
	rm -rf ${DOCS}fine-uploader.html
	rm -rf ${DOCS}public

clean-node: $(NODE_MODULES)
	rm -rf ${NODE_MODULES}

clean-vendor: $(TEST_DIR)vendor/
	rm -rf ${TEST_DIR}vendor/

#
# Docs
#
docs: $(DOCS)
	mkdir -p ${DOCS}
	@echo "\n${HR}"
	@echo "Building docs ..."
	#${NODE_MODULES}docco/bin/docco -o ${DOCS} ${BUILD}js/fine-uploader.js
	@echo "${CHECK} Docs built!\n"

#
# Tests
#
## Test everything, done before a release
test-all: wipe build test

## Quicker test; useful during development
ci-test: build
ifeq ($(ON_MASTER), true)
	@echo "\nWoah, no running tests on master!\n"
	$(shell false)
else
	${BIN}mocha-phantomjs -p ${BIN}phantomjs -R dot ${TEST_DIR}index.html
	@echo "${CHECK} Tests complete!\n"

test: build
	@echo "\n${HR}"
	@echo "Running tests ..."
	${BIN}mocha-phantomjs -p ${BIN}phantomjs -R dot ${TEST_DIR}index.html
	@echo "${CHECK} Tests complete!\n"
endif

## Test whenever changes are made.
test-watch: build
	@echo "Watching tests ..."
	PHANTOMJS_BIN=${BIN}phantomjs ${BIN}karma start
	@echo "${CHECK} Tests complete!\n"

#
# Utils
#

## Node Modules
node_modules: package.json
	npm update

vendor_modules: node_modules 
	mkdir -p ${TEST_DIR}vendor
	cp ${NODE_MODULES}chai/chai.js ${TEST_DIR}vendor/.
	curl --progress-bar http://code.jquery.com/jquery-1.10.0.min.js >> ${TEST_DIR}vendor/jquery-1.10.0.min.js
	curl --progress-bar http://code.jquery.com/jquery-2.0.1.min.js >> ${TEST_DIR}vendor/jquery-2.0.1.min.js
	curl --progress-bar http://code.jquery.com/qunit/qunit-1.11.0.js >> ${TEST_DIR}vendor/qunit.js
	curl --progress-bar http://code.jquery.com/qunit/qunit-1.11.0.css >> ${TEST_DIR}vendor/qunit.css
	curl --progress-bar https://raw.github.com/allmarkedup/purl/master/purl.js >> ${TEST_DIR}vendor/purl.js
	curl --progress-bar https://raw.github.com/douglascrockford/JSON-js/master/json2.js >> ${TEST_DIR}vendor/json2.js
	curl --progress-bar https://raw.github.com/mmonteleone/pavlov/master/pavlov.js >> ${TEST_DIR}vendor/pavlov.js
	#curl http://selenium.googlecode.com/files/selenium-server-standalone-2.33.0.jar >> ${TEST_DIR}vendor/selenium-server-standalone.jar

modules: vendor_modules

## Concatenation
concat-js: 
	@echo "Combining js ..."
	mkdir -p ${BUILD}{js,css,img}
	cat ${SRCJS} | tee ${BUILD}js/fine-uploader.js
	@#cat ${SRCJS} | tee ${BUILD}js/fine-uploader-${VERSION}.js
	cat ${JQ_SRCJS} | tee ${BUILD}js/jquery-fine-uploader.js
	@#cat ${JQ_SRCJS} | tee ${BUILD}js/jquery-fine-uploader-${VERSION}.js
	cat ${SRCJS_DIR}js/iframe.xss.response.js | tee ${BUILD}js/iframe.xss.response.js
	cp README.md ${BUILD}README
	cp LICENSE ${BUILD}LICENSE
	@echo "${SRC} JS combined."

# Minification
minify: minify-js minify-css

minify-js:
	@echo "Minifying js ..."
	${BIN}uglifyjs ./fine-uploader/js/fine-uploader.js -o ./fine-uploader/js/fine-uploader.min.js
	@#${NODE_MODULES}uglify-js/bin/uglifyjs ./fine-uploader/js/fine-uploader-${VERSION}.js -o ./fine-uploader/js/fine-uploader-${VERSION}.min.js
	${BIN}uglifyjs ./fine-uploader/js/jquery-fine-uploader.js -o ./fine-uploader/js/jquery-fine-uploader.min.js
	@#${NODE_MODULES}uglify-js/bin/uglifyjs ./fine-uploader/js/jquery-fine-uploader-${VERSION}.js -o ./fine-uploader/js/jquery-fine-uploader-${VERSION}.min.js
	@echo "${CHECK} JS minified.\n"

minify-css:
	@echo "Minifying css ..."
	cp ./client/fineuploader.css ${BUILD}css/fine-uploader.css
	@#cp ./client/fineuploader.css ${BUILD}css/fine-uploader-${VERSION}.css
	${BIN}cleancss -o ${BUILD}css/fine-uploader.min.css ${BUILD}css/fine-uploader.css
	@#${NODE_MODULES}clean-css/bin/cleancss -o ${BUILD}css/fine-uploader-${VERSION}.min.css ${BUILD}css/fine-uploader-${VERSION}.css
	@echo "${CHECK} CSS minified.\n"

## Linting
lint: $(SRCJS_DIR)
	@echo "\n${HR}"
	@echo "Linting ..."
	${BIN}jshint ${SRCJS_DIR}
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
start-server:
	@echo "Starting basic HTTP server ..."
	node ${TEST_DIR}bin/server.js &
	sleep 5
	@echo "Test HTTP server started."

stop-server:
	@echo "Stopping basic HTTP server ..."
	cat ${TEST_DIR}bin/pid.txt | xargs kill
	@echo "Test HTTP server stopped."

restart-server: stop-server start-server

#
# Releasing, Publishing, and Deploying
# 

# rewrite package.json with a new incremented version number
# creates a corresponding git commit and tag
define release
	VERSION=`node -pe "require('./package.json').version"` && \
	NEXT_VERSION=`node -pe "require('semver').inc(\"$$VERSION\", '$(1)')"` && \
	node -e "\
		var j = require('./package.json');\
		j.version = \"$$NEXT_VERSION\";\
		var s = JSON.stringify(j, null, 2);\
		require('fs').writeFileSync('./package.json', s);" 
		git commit -m "release $$NEXT_VERSION" -- package.json && \
		git tag "$$NEXT_VERSION" -m "release $$NEXT_VERSION"
endef

release-patch: build test
	@$(call release,patch)

release-minor: build test
	@$(call release,minor)

release-major: build test
	@$(call release,major)

publish:
	@echo "Publishing ..."
	git push --tags origin HEAD:master
	npm publish
	@echo "${DATE}\n"
	@echo "${CHECK} Published!"

#
# Instructions
#

#.PHONY: all release modules wipe build minify
#.PHONY: clean wipe clean-build clean-node
#.PHONY: build js css img fineuploader
#.PHONY: minify minify-js minify-css
#.PHONY: test test-all test-watch
#.PHONY: docs lint
#.PHONY: start-basic-server stop-basic-server restart-basic-server
#.PHONY: start-selenium stop-selenium restart-selenium
