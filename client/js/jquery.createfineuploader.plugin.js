(function($){
    $.fn.createFineUploader = function(ops){
        var reg = />[\r\n\s]+</g,
            list = this.find('.qq-upload-list'),
            tpl;
        if( list.length ) {
            tpl = list.html().replace(reg, '><');
            ops.fileTemplate = $.trim(tpl);
            list.empty();
        }

        if( this.hasClass('qq-uploader') || this.find('.qq-uploader').length ) {
            tpl = this.html().replace(reg, '><');
            ops.template = $.trim(tpl);
            this.empty();
        }

        ops.element = this.get(0);

        return new qq.FineUploader(ops);
    };
})(jQuery);
