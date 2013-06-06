####
#
# Makefile
#
# Fine Uploader
# @author: Mark Feltner
#
# Tasks:


# Global Variables
HR=\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#
CHECK=\033[32m✔\033[39m
CWD=$(shell pwd)
DATE=$(shell date +%I:%M%p)
VERSION=$(shell node -pe "require('./package.json').version")
#CURRENT_BRANCH=$(shell git rev-parse --abbrev-ref HEAD)
#ON_MASTER=$(shell if [[ "master" == $$CURRENT_BRANCH ]]; then echo "true"; else echo "false"; fi)

# Build Directories
SRC_DIR=./client/
SRCJS_DIR=./client/js/
TEST_DIR=./test/
DOCS=./docs/
BUILD=./build/
DIST=./dist/
CORE_DIST=${DIST}fine-uploader-${VERSION}/
JQ_DIST=${DIST}jquery.fine-uploader-${VERSION}/

NODE_MODULES=./node_modules/
BIN=${NODE_MODULES}.bin/

# Core Source JS 
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

# jQuery Plugin
JQ_SRCJS+=${SRCJS}
JQ_SRCJS+=${SRCJS_DIR}jquery-plugin.js \
		  ${SRCJS_DIR}jquery-dnd.js

# rewrite package.json and jQuery manifest
# with a new incremented version number.
# Creates a corresponding git commit and tag.
define release
	VERSION=`node -pe "require('./package.json').version"` && \
	NEXT_VERSION=`node -pe "require('semver').inc(\"$$VERSION\", '$(1)')"` && \
	node -e "\
		var j = require('./package.json');\
		j.version = \"$$NEXT_VERSION\";\
		var s = JSON.stringify(j, null, 2);\
		require('fs').writeFileSync('./package.json', s);\
		var j = require('./fineuploader.jquery.json');\
		j.version = \"$$NEXT_VERSION\";\
		var s = JSON.stringify(j, null, 2);\
		require('fs').writeFileSync('./fineuploader.jquery.json', s);"
	#git commit -m "release $$NEXT_VERSION" package.json fineuploader.jquery.json && \
	#git tag "$$NEXT_VERSION" -m "release $$NEXT_VERSION"
endef

.PHONY: all build dist clean test watch wipe publish
.PHONY: release-patch release-minor release-major
.PHONY: start-server stop-server restart-server
.PHONY: ci-test
.PHONY: node_modules

## Complete build; wipe everything and start over.
all: clean-node clean-vendor modules build test docs
	@echo "${HR}"
	@echo "${DATE}\n"
	@echo "Comprehensive build...						${CHECK} Done\n"

## Build fine uploader from latest source
build: modules clean fineuploader
	@echo "${HR}"
	@echo "${DATE}\n"
	@echo "Fine Uploader built...						${CHECK} Done\n"

## Build from latest source and prepare zipped files
## for distribution.
dist: build test
	@echo "${HR}"
	@echo "Assembling Fine Uploader distribution..."
	@mkdir -p ${CORE_DIST}
	@mkdir -p ${JQ_DIST}
	@cp ${BUILD}iframe.xss.response.js ${CORE_DIST}iframe.xss.response.js
	@cp ${BUILD}iframe.xss.response.js ${JQ_DIST}iframe.xss.response.js
	@cp ${BUILD}fine-uploader.js ${CORE_DIST}fine-uploader-${VERSION}.js
	@cp ${BUILD}fine-uploader.min.js ${CORE_DIST}/fine-uploader-${VERSION}.min.js
	@cp ${BUILD}fine-uploader.css ${CORE_DIST}fine-uploader-${VERSION}.css
	@cp ${BUILD}fine-uploader.min.css ${CORE_DIST}fine-uploader-${VERSION}.min.css
	@cp ${BUILD}loading.gif ${CORE_DIST}loading.gif
	@cp ${BUILD}processing.gif ${CORE_DIST}processing.gif
	@cp README.md ${CORE_DIST}README
	@cp LICENSE ${CORE_DIST}LICENSE
	@cp ${BUILD}jquery-fine-uploader.js ${JQ_DIST}jquery.fine-uploader-${VERSION}.js
	@cp ${BUILD}jquery-fine-uploader.min.js ${JQ_DIST}jquery.fine-uploader-${VERSION}.min.js
	@cp ${BUILD}fine-uploader.css ${JQ_DIST}fine-uploader-${VERSION}.css
	@cp ${BUILD}fine-uploader.min.css ${JQ_DIST}fine-uploader-${VERSION}.min.css
	@cp ${BUILD}loading.gif ${JQ_DIST}loading.gif
	@cp ${BUILD}processing.gif ${JQ_DIST}processing.gif
	@cp README.md ${JQ_DIST}README
	@cp LICENSE ${JQ_DIST}LICENSE
	@find ${CORE_DIST} -path '/*.*' -prune -o -type f -print | zip fine-uploader-${VERSION}.zip -@ -j
	@find ${JQ_DIST} -path '/*.*' -prune -o -type f -print | zip jquery.fine-uploader-${VERSION}.zip -@ -j
	@echo "Fine Uploader distribution assembled...						${CHECK} Done\n"

## Clean out the ./build ./dist and ./docs folders
clean: clean-build clean-dist clean-docs 
	@echo "So fresh, so clean...						${CHECK} Done\n"

## Build from latest source and run tests
test: build restart-server
	@echo "Running tests ..."
	${BIN}phantomjs ${TEST_DIR}bin/phantomjs "http://localhost:3000/tests/"
	@echo "Headless phantomsjs tests complete...				${CHECK} Done\n"

## Test whenever changes are made.
watch: clean-build build restart-server
	@echo "Watching tests ..."
	watchr ${TEST_DIR}bin/watchr

wipe: clean clean-modules
	@echo "Everything wiped...						${CHECK} Done\n"

fineuploader: js css img
	@echo "\n${HR}"
	@echo "Fine Uploader built from latest source...			${CHECK} Done\n"

js: lint concat-js minify-js 

css: minify-css

img:
	cp ${SRC_DIR}loading.gif ${BUILD}loading.gif
	cp ${SRC_DIR}processing.gif ${BUILD}processing.gif 

## Linting
lint:
	@echo "Linting ..."
	#${BIN}jshint ${SRCJS_DIR}
	#${BIN}jshint ${TEST}specs/unit/*.js
	@echo "Linted with jshint...						${CHECK} Done\n"

## Concatenation
concat-js:
	@echo "Combining js ..."
	@mkdir -p ${BUILD}
	@cat ${SRCJS} > ${BUILD}fine-uploader.js
	@cat ${JQ_SRCJS} > ${BUILD}jquery-fine-uploader.js
	@cat ${SRCJS_DIR}iframe.xss.response.js > ${BUILD}iframe.xss.response.js
	@echo "JS combined...							${CHECK} Done\n"

## Minification
minify: minify-js minify-css

minify-js:
	@echo "Minifying js ..."
	${BIN}uglifyjs ${BUILD}fine-uploader.js -o ${BUILD}fine-uploader.min.js
	${BIN}uglifyjs ${BUILD}jquery-fine-uploader.js -o ${BUILD}jquery-fine-uploader.min.js
	@echo "JS minified...							${CHECK} Done\n"

minify-css:
	@echo "Minifying css ..."
	cp ./client/fineuploader.css ${BUILD}fine-uploader.css
	${BIN}cleancss -o ${BUILD}fine-uploader.min.css ${BUILD}fine-uploader.css
	@echo "CSS minified...							${CHECK} Done\n"

clean-dist:
	rm -rf ${DIST}
	@echo "Dist cleansed...						${CHECK} Done\n"

clean-build:
	rm -rf ${BUILD}
	@echo "Build cleansed...						${CHECK} Done\n"

clean-docs: 
	rm -rf ${DOCS}docco.css
	rm -rf ${DOCS}fine-uploader.html
	rm -rf ${DOCS}public
	@echo "Docs cleansed...						${CHECK} Done\n"

clean-node: 
	rm -rf ${NODE_MODULES}
	@echo "Node modules cleansed...						${CHECK} Done\n"

clean-vendor: 
	rm -rf ${TEST_DIR}vendor/
	@echo "Vendor modules cleansed...						${CHECK} Done\n"

clean-modules: clean-node clean-vendor

## Docs
docs: 
	@echo "Building docs ..."
	mkdir -p ${DOCS}
	mkdir -p ${DOCS}
	#${NODE_MODULES}docco/bin/docco -o ${DOCS} ${BUILD}js/fine-uploader.js
	@echo "Docs built...						${CHECK} Done\n"

#
# Releasing, Publishing, and Deploying
# 
## Updates the x: a.b.x
release-patch: build test docs dist
	@$(call release,patch)
	@echo "Patch released...						${CHECK} Done\n"

## Updates the x: a.x.c
release-minor: build test docs dist
	@$(call release,minor)
	@echo "Minor released...						${CHECK} Done\n"

## Updates the x: x.b.c
release-major: build test docs dist
	@$(call release,major)
	@echo "Major released...						${CHECK} Done\n"

## Publish the release online
publish:
	@echo "Publishing ..."
	#git push --tags origin HEAD:master
	@echo "${DATE}\n"
	@echo "Published...						${CHECK} Done\n"

#
# Utils
#
## Get all our dependencies back
modules: vendor_modules node_modules

## Update the node dependencies
node_modules:
	npm update

## Get dependencies for running tests
vendor_modules:
	mkdir -p ${TEST_DIR}vendor/
	@curl -L --progress-bar http://code.jquery.com/jquery-1.10.0.min.js >> ${TEST_DIR}vendor/jquery-1.10.0.min.js
	@curl -L --progress-bar http://code.jquery.com/qunit/qunit-1.11.0.js >> ${TEST_DIR}vendor/qunit.js
	@curl -L --progress-bar http://code.jquery.com/qunit/qunit-1.11.0.css >> ${TEST_DIR}vendor/qunit.css
	@curl -L --progress-bar https://raw.github.com/allmarkedup/purl/master/purl.js >> ${TEST_DIR}vendor/purl.js
	@curl -L --progress-bar https://raw.github.com/douglascrockford/JSON-js/master/json2.js >> ${TEST_DIR}vendor/json2.js
	@curl -L --progress-bar https://raw.github.com/jquery/qunit/master/addons/phantomjs/runner.js >> ${TEST_DIR}bin/runner.js
	@curl -L --progress-bar http://underscorejs.org/underscore-min.js >> ${TEST_DIR}vendor/underscore.min.js
	##curl http://selenium.googlecode.com/files/selenium-server-standalone-2.33.0.jar >> ${TEST_DIR}vendor/selenium-server-standalone.jar

## Test Server
start-server:
	@echo "Starting basic HTTP server ..."
	node ${TEST_DIR}bin/server.js &
	@echo "Test HTTP server started.					${CHECK} Done\n"

stop-server:
	@echo "Stopping basic HTTP server ..."
	cat ${TEST_DIR}bin/pid.txt | xargs kill
	@echo "Test HTTP server stopped.					${CHECK} Done\n"

restart-server: 
	@echo "Restarting basic HTTP server ..."
	$(shell if [[ "" != `ps aux | grep $$(cat ${TEST_DIR}bin/pid.txt)` ]]; then cat ${TEST_DIR}bin/pid.txt | xargs kill; fi)
	node ${TEST_DIR}bin/server.js &
	@echo "Test HTTP server restarted.					${CHECK} Done\n"

define runTests
    node ./test/bin/server.js &
    ${BIN}phantomjs ${TEST_DIR}bin/phantomjs "http://localhost:3000/tests/"
    @echo "CI Test Complete...						${CHECK} Done\n"
endef

## Travis test
ci-test:
ifeq ($(TRAVIS_BRANCH), master)
    ifneq($(TRAVIS_PULL_REQUEST), false)
	    @echo "\nWoah there!  No pull requests allowed against master!\n"
	    $(shell false)
    else
        $(call runTests)
    endif
else
    $(call runTests)
endif

#SELENIUM=${TEST_DIR}vendor/selenium-server-standalone.jar
#.PHONY: start-selenium stop-selenium restart-selenium
## Selenium
## @FUTURE_IN_MIND:
#  start-selenium:
#	@echo "Starting Selenium ..."
#	export PATH=./node_modules/phantomjs/bin:$$PATH
#	PATH=./node_modules/phantomjs/bin:$$PATH java -jar ${SELENIUM} -log selenium.log -browserSideLog > /dev/null 2>&1 &
#	sleep 5
#	sleep 5
#	export PATH=./node_modules/phantomjs/bin:$$PATH
#  
#  stop-selenium:
#	@echo "Stopping Selenium ..."
#	$(shell ps aux \
#		| grep '[/]usr/bin/java -jar ./test/vendor/selenium-server-standalone' \
#		| awk '{print $$2}' \
#		| xargs kill $$2)
#	@echo "Selenium Stopped."
#  
#  restart-selenium: stop-selenium start-selenium
