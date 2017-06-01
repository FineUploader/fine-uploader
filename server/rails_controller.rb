# -*- coding: utf-8 -*-
class UploadFileController < ApplicationController
  def index
    return if params[:qqfile].blank? 
    dir = "#{Rails.root}/public/files"
    FileUtils.mkdir_p dir
    filename = "#{File.extname(params[:qqfile])}"
    filepath = "/files/#{filename}"
    filename = "#{dir}/#{filename}"
    if File.open(filename, 'wb'){|f| f.write request.raw_post }
      render :text => "{'success':true, 'img': '#{filepath}'}"
    else
      render :text => '{"error":"error message to display"}'
    end
  end
end
