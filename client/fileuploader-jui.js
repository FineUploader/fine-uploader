/**
* Class that creates upload widget with file list
* @inherits qq.FileUploaderBasic
*/
qq.jQueryUIUploader = function (o) {
	// call parent constructor
	qq.FileUploaderBasic.apply(this, arguments);

	// additional options    
	qq.extend(this._options, {
		element: null,
		// if set, will be used instead of qq-upload-list in template
		listElement: null,

		template: '<div class="jq-uploader">' +
						'<div class="jq-upload-button">Upload a file</div>' +
						'<ul class="jq-upload-list"></ul>' +
						'<div class="jq-upload-dialog"></div>' +
					'</div>',

		// template for one item in file list
		fileTemplate: '<li>' +
							'<span class="jq-upload-file"></span>' +
							'<span class="jq-upload-size"></span>' +
							'<br/><div class="jq-upload-progress"></div>' +
							'<a class="jq-upload-cancel" href="#">Cancel</a>' +
							'<span class="jq-upload-failed-text">Failed</span>' +
						'</li>',

		classes: {
			// used to get elements from templates
			button: 'jq-upload-button',
			list: 'jq-upload-list',

			file: 'jq-upload-file',
			progress: 'jq-upload-progress',
			dialog: 'jq-upload-dialog',
			size: 'jq-upload-size',
			cancel: 'jq-upload-cancel',

			// added to list item when upload completes
			// used in css to hide progress bar
			success: 'jq-upload-success',
			fail: 'jq-upload-fail'
		},
		showMessage: function (message) {
			$(".jq-upload-dialog").text(message);
			$(".jq-upload-dialog").dialog("open");
		}
	});
	// overwrite options with user supplied    
	qq.extend(this._options, o);

	this._element = this._options.element;
	this._element.innerHTML = this._options.template;

	this._listElement = this._options.listElement || this._find(this._element, 'list');

	this._classes = this._options.classes;

	this._button = this._createUploadButton(this._find(this._element, 'button'));

	// Check if we already made a dialog once
	if ($('.jq-upload-dialog').length > 1) {
		qq.remove(this._find(this._element, 'dialog'));
	} else {
		this._dialog = this._createDialog(this._find(this._element, 'dialog'));
	}

	this._bindCancelEvent();
};

// inherit from Basic Uploader
qq.extend(qq.jQueryUIUploader.prototype, qq.FileUploaderBasic.prototype);

qq.extend(qq.jQueryUIUploader.prototype, {
	/**
	* Override to use jUIUploadButton instead of normal one
	**/
	_createUploadButton: function (element) {
		var self = this;

		return new qq.jUIUploadButton({
			element: element,
			multiple: this._options.multiple && qq.UploadHandlerXhr.isSupported(),
			onChange: function (input) {
				self._onInputChange(input);
			}
		});
	},
	/**
	* Creates a reusable dialog for messages with jQueryUI instead of alert()
	**/
	_createDialog: function (element) {
		return $(element).dialog({
			modal: true,
			autoOpen: false,
			buttons: {
				OK: function() { $(this).dialog("close"); }
			}
		})[0];
	},
	/**
	* Gets one of the elements listed in this._options.classes
	**/
	_find: function (parent, type) {
		var element = qq.getByClass(parent, this._options.classes[type])[0];
		if (!element) {
			throw new Error('element not found ' + type);
		}

		return element;
	},
	_onSubmit: function (id, fileName) {
		qq.FileUploaderBasic.prototype._onSubmit.apply(this, arguments);
		this._addToList(id, fileName);
	},
	_onProgress: function (id, fileName, loaded, total) {
		qq.FileUploaderBasic.prototype._onProgress.apply(this, arguments);

		var item = this._getItemByFileId(id);
		var size = this._find(item, 'size');
		size.style.display = 'inline';

		var progress = this._find(item, 'progress');

		var text;
		if (loaded != total) {
			// Update the progress bar with the current progress value
			var current = Math.round(loaded / total * 100);
			$(progress).progressbar({ value: current });

			text = current + '% of ' + this._formatSize(total);
		} else {
			// Set the progress bar to completely full
			$(progress).progressbar({ value: 100 });

			text = this._formatSize(total);
		}

		qq.setText(size, text);
	},
	_onComplete: function (id, fileName, result) {
		qq.FileUploaderBasic.prototype._onComplete.apply(this, arguments);

		// mark completed
		var item = this._getItemByFileId(id);
		qq.remove(this._find(item, 'cancel'));
		qq.remove(this._find(item, 'progress'));

		if (result.success) {
			qq.addClass(item, this._classes.success);
		} else {
			qq.addClass(item, this._classes.fail);
		}
	},
	_addToList: function (id, fileName) {
		var item = qq.toElement(this._options.fileTemplate);
		item.qqFileId = id;

		var fileElement = this._find(item, 'file');
		qq.setText(fileElement, this._formatFileName(fileName));
		this._find(item, 'size').style.display = 'none';

		this._listElement.appendChild(item);
	},
	_getItemByFileId: function (id) {
		var item = this._listElement.firstChild;

		// there can't be txt nodes in dynamically created list
		// and we can  use nextSibling
		while (item) {
			if (item.qqFileId == id) return item;
			item = item.nextSibling;
		}
	},
	/**
	* delegate click event for cancel link 
	**/
	_bindCancelEvent: function () {
		var self = this,
            list = this._listElement;

		qq.attach(list, 'click', function (e) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			if (qq.hasClass(target, self._classes.cancel)) {
				qq.preventDefault(e);

				var item = target.parentNode;
				self._handler.cancel(item.qqFileId);
				qq.remove(item);
			}
		});
	}
});

qq.jUIUploadButton = function (o) {
	this._options = {
		element: null,
		// if set to true adds multiple attribute to file input      
		multiple: false,
		// name attribute of file input
		name: 'file',
		onChange: function (input) { }
	};

	qq.extend(this._options, o);

	this._element = this._options.element;

	// Create the jQueryUI button
	$(this._element).button();

	this._input = this._createInput();
};

// Inherit from UploadButton
qq.extend(qq.jUIUploadButton.prototype, qq.UploadButton.prototype);

qq.extend(qq.jUIUploadButton.prototype, {
	_createInput: function () {
		var input = document.createElement("input");

		if (this._options.multiple) {
			input.setAttribute("multiple", "multiple");
		}

		input.setAttribute("type", "file");
		input.setAttribute("name", this._options.name);
		
		this._element.appendChild(input);

		var self = this;
		qq.attach(input, 'change', function () {
			self._options.onChange(input);
		});

		// IE and Opera, unfortunately have 2 tab stops on file input
		// which is unacceptable in our case, disable keyboard access
		if (window.attachEvent) {
			// it is IE or Opera
			input.setAttribute('tabIndex', "-1");
		}

		return input;
	}
});