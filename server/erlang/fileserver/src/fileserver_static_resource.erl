%% Credit where credit due taken from webmachine demo
%% @author Bryan Fink <bryan@basho.com>
%% @author Andy Gross <andy@basho.com>
%% @author Justin Sheehy <justin@basho.com>
%% @copyright 2008-2009 Basho Technologies, Inc.

-module(fileserver_static_resource).
-export([init/1]).
-export([allowed_methods/2,
         resource_exists/2,
         content_types_provided/2,
         provide_content/2]).

-record(context, {root,response_body=undefined,metadata=[]}).

-include_lib("webmachine/include/webmachine.hrl").

init([ContentDir]) ->
    {ok, App}= application:get_application(),
    PrivDir = code:priv_dir(App),
    SourceDir = filename:join([PrivDir, ContentDir]),
    {ok, #context{root=SourceDir}}.

allowed_methods(ReqData, Context) ->
    {['HEAD', 'GET'], ReqData, Context}.

content_types_provided(ReqData, Context) ->
    %%CT = webmachine_util:guess_mime(wrq:disp_path(ReqData)),
    CT = webmachine_util:guess_mime(
           get_full_path(Context, wrq:disp_path(ReqData))
          ),
    {[{CT, provide_content}], ReqData,
     Context#context{metadata=[{'content-type', CT}|Context#context.metadata]}}.

get_full_path(Context, Path) ->
  Root = Context#context.root,
  Result = case mochiweb_util:safe_relative_path(Path) of
               undefined ->
                   undefined;
               RelPath ->
                   FullPath = filename:join([Root, RelPath]),
                   case filelib:is_dir(FullPath) of
                       true ->
                           filename:join([FullPath, "index.html"]);
                       false ->
                           FullPath
                   end
           end,
    Result.

file_exists(Context, Name) ->
    NamePath = get_full_path(Context, Name),
    case filelib:is_regular(NamePath) of
        true ->
            {true, NamePath};
        false ->
            false
    end.

resource_exists(ReqData, Context) ->
    Path = wrq:disp_path(ReqData),
    case file_exists(Context, Path) of
        {true, _} ->
            {true, ReqData, Context};
        _ ->
            case Path of
                "p" -> {true, ReqData, Context};
                _ -> {false, ReqData, Context}
            end
    end.

maybe_fetch_object(Context, Path) ->
    % if returns {true, NewContext} then NewContext has response_body
    case Context#context.response_body of
        undefined ->
            case file_exists(Context, Path) of
                {true, FullPath} ->
                    {ok, Value} = file:read_file(FullPath),
                    {true, Context#context{response_body=Value}};
                false ->
                    {false, Context}
            end;
        _Body ->
            {true, Context}
    end.

provide_content(ReqData, Context) ->
    case maybe_fetch_object(Context, wrq:disp_path(ReqData)) of
        {true, NewContext} ->
            Body = NewContext#context.response_body,
            {Body, ReqData, Context};
        {false, NewContext} ->
            {error, ReqData, NewContext}
    end.
