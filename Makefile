
CWD=$(shell pwd)

SRC=./client/js/
BUILD=./fine-uploader/
TESTS=./test/
DOCS=./docs/
LIBS=./libs/

NODE_MODULES=./node_modules/

SELENIUM=${TESTS}vendor/selenium-server-standalone-2.33.0.jar

JS_SRC_CORE=${SRC}header.js \
	 ${SRC}util.js \
	 ${SRC}version.js \
	 ${SRC}features.js \
	 ${SRC}promise.js \
	 ${SRC}button.js \
	 ${SRC}paste.js \
	 ${SRC}upload-data.js \
	 ${SRC}uploader.basic.js \
	 ${SRC}dnd.js \
	 ${SRC}uploader.js \
	 ${SRC}ajax.requester.js \
	 ${SRC}deletefile.ajax.requester.js \
	 ${SRC}window.receive.message.js \
	 ${SRC}handler.base.js \
	 ${SRC}handler.form.js \
	 ${SRC}handler.xhr.js 
JS_SRC_JQUERY+=${JS_SRC_CORE}
JS_SRC_JQUERY+=${SRC}jquery-plugin.js \
			   ${SRC}jquery-dnd.js

all: fine-uploader

fine-uploader: clean build test docs
	@echo "${HR}"
	@echo "${DATE}\n"

#
# Node Modules
#
node_modules: package.json
	npm update

VERSION=$(shell cat ./client/js/version.js | sed 's/[^\"]*\"\([^\"]*\)\"[^\"]*/\1/g')

#
# Clean
#
clean: clean-node clean-build clean-docs

clean-build:
	rm -rf ${BUILD}*
	mkdir -p ${BUILD}{js,css,img}

clean-node:
	rm -rf ${NODE_MODULES}

clean-docs:
	rm -rf ${DOCS}docco.css
	rm -rf ${DOCS}fine-uploader.html
	rm -rf ${DOCS}public

#
# Build
#
build: node_modules build-js build-css build-img

build-js: concat-js minify-js 
#build-js: lint concat-js minify-js 

build-css: minify-css

build-img:
	cp ${SRC}../{loading.gif,processing.gif} ${BUILD}img 

build-docs: docs

concat-js:
	@echo "Combining js ..."
	cat ${JS_SRC_CORE} | tee ${BUILD}js/fine-uploader-${VERSION}.js
	cat ${JS_SRC_JQUERY} | tee ${BUILD}js/jquery-fine-uploader-${VERSION}.js
	cat ${SRC}iframe.xss.response.js | tee ${BUILD}js/iframe.xss.response.js
	cp README ${BUILD}README
	cp LICENSE ${BUILD}LICENSE
	@echo "Js combined."

#
# Minify
#
minify: minify-js minify-css

minify-js:
	@echo "Minifying js ..."
	${NODE_MODULES}uglify-js/bin/uglifyjs ./fine-uploader/js/fine-uploader-${VERSION}.js -o ./fine-uploader/js/fine-uploader-${VERSION}.min.js
	${NODE_MODULES}uglify-js/bin/uglifyjs ./fine-uploader/js/jquery-fine-uploader-${VERSION}.js -o ./fine-uploader/js/jquery-fine-uploader-${VERSION}.min.js
	@echo "Js minified."

minify-css:
	@echo "Minifying css ..."
	cp ./client/fineuploader.css ${BUILD}css/fine-uploader-${VERSION}.css
	${NODE_MODULES}clean-css/bin/cleancss -o ${BUILD}css/fine-uploader-${VERSION}.min.css \
		${BUILD}css/fine-uploader-${VERSION}.css
	@echo "Css minified."

#
# Lint
#
lint:
	@echo "\n${HR}"
	@echo "Linting ..."
	${NODE_MODULES}jshint/bin/jshint ${SRC}
	@echo "Linted."

#
# Docs
#
docs:
	@echo "\n${HR}"
	@echo "Building docs ..."
	#${NODE_MODULES}docco/bin/docco -o ${DOCS} ${BUILD}js/fine-uploader.js
	@echo "Docs built."

#
# Tests
#
test-all: clean build test

test:
	@echo "\n${HR}"
	@echo "Running tests ..."
	PHANTOMJS_BIN=${NODE_MODULES}phantomjs/bin/phantomjs ${NODE_MODULES}karma/bin/karma start --single-run
	@echo "Tests run."

test-watch:
	@echo "\n${HR}"
	@echo "Watching tests ..."
	PHANTOMJS_BIN=${NODE_MODULES}phantomjs/bin/phantomjs ${NODE_MODULES}karma/bin/karma start
	@echo "Tests run."

#
# Utils
#
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

start-test-server:
	@echo "Starting test HTTP server ..."
	node test/test-server.js &
	sleep 5
	@echo "Test HTTP server started."

stop-test-server:
	@echo "Stop test HTTP server ..."
	cat ${TESTS}pid.txt | xargs kill
	sleep 5
	@echo "Test HTTP server stop."

restart-test-server: stop-test-server start-test-server

DATE=$(shell date +%I:%M%p)
CHECK=\033[32m✔\033[39m
HR=\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#

#
# Instructions
#

.PHONY: all
.PHONY: start-selenium stop-selenium restart-selenium
.PHONY: start-test-server stop-test-server restart-test-server
.PHONY: test test-watch
.PHONY: docs lint minify clean build
.PHONY: build-js build-css
.PHONY: minify-js minify-css
