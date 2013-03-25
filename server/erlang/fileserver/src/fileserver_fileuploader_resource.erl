%% @author Dipesh Patel <dipthegeezer.opensource(at)gmail.com>
%% @copyright 2013 Dipesh Patel

%%
%% Licensed under the Apache License, Version 2.0 (the "License");
%% you may not use this file except in compliance with the License.
%% You may obtain a copy of the License at
%%
%% http://www.apache.org/licenses/LICENSE-2.0
%%
%% Unless required by applicable law or agreed to in writing, software
%% distributed under the License is distributed on an "AS IS" BASIS,
%% WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
%% See the License for the specific language governing permissions and
%% limitations under the License.

%% @doc Webmachine resource file for use with Fine Uploader
%% @reference See <a href="https://github.com/Widen/fine-uploader">file-uploader</a>
%% and <a href="https://github.com/basho/webmachine">webmachine</a>
%% for more information.

-module(fileserver_fileuploader_resource).

%% ------------------------------------------------------------------
%% API Function Exports
%% ------------------------------------------------------------------

-export([init/1,
         allowed_methods/2,
         delete_resource/2,
         process_post/2]).

-include_lib("webmachine/include/webmachine.hrl").

%% @type context() = Record :: #context{ outdir = filelib:dirname() }.

-record(context, {outdir}).

%% @todo tests, check delete works, debug mode to log file.

%% ------------------------------------------------------------------
%% API Function Definitions
%% ------------------------------------------------------------------

%% @spec init([OutputDir]) -> {ok, context()}
%%      OutputDir = filelib:dirname()
%% @doc Initialise resource.
init([OutputDir]) -> {ok, #context{outdir=OutputDir}}.

%% @spec allowed_methods(wrq:reqdata(), context()) -> {[atom()], wrq:reqdata(), context()}
%% @doc Only allow POST and DELETE
allowed_methods(ReqData, Context) -> {['POST', 'DELETE'], ReqData, Context}.

%% @spec delete_resource(wrq:reqdata(), context()) -> {boolean(), wrq:reqdata(), context()}
%% @doc Delete the file given by the uuid in the dispatch path
delete_resource(ReqData, Context) ->
    Dirname = file_path(wrq:disp_path(ReqData), Context),
    Files = find_all_files(Dirname++"/*"),
    case  delete_files(Files) of
        ok -> case file:del_dir(Dirname) of
                  ok -> {true, ReqData, Context};
                  _ -> {false, ReqData, Context}
              end;
        _ -> {false, ReqData, Context}
    end.

%% @spec process_post(wrq:reqdata(), context()) -> {boolean(), wrq:reqdata(), context()}
%% @doc process a file post request. Assumes files are sent in parts.
process_post(ReqData, Context) ->
    try
        Boundary = webmachine_multipart:find_boundary(ReqData),
        %%io:format("Boundary ~p~n",[Boundary]),
        Parts = accumulate_stream_parts(webmachine_multipart:stream_parts(
                wrq:stream_req_body(ReqData, 1024), Boundary
              ),[]),
        %%io:format("Parts ~p~n", [Parts]),
        case write_to_disk(Parts, Context) of
            ok -> {true, success(ReqData), Context};
            {error, Msg} -> {true, failure(Msg, ReqData), Context};
            {prevent_retry, Msg} -> {true, prevent_retry(Msg, ReqData), Context};
            {reset, Msg} -> {true, reset(Msg, ReqData), Context}
        end
    of
        Ret -> Ret
    catch
        Exception:Reason ->
            io:format("Caught Exception ~p~n", [{Exception, Reason}]),
            {true,
             prevent_retry(
               "Caught Exception",
               ReqData
             ),
             Context}
    %%after
        %%Maybe clean out file system?
    end.

%% ------------------------------------------------------------------
%% Internal Function Definitions
%% ------------------------------------------------------------------

%% @spec accumulate_stream_parts('done_parts' | {fpart(), function()}, [fpart()]) -> [fpart()]
%% @doc Return all multipart streams as list
accumulate_stream_parts(done_parts, Acc) ->
    %%io:format("RECEIVED ~p~n",[done_parts]),
    lists:reverse(Acc);
accumulate_stream_parts({Hunk,Next},Acc) ->
    %%io:format("RECEIVED ~p~n",[Hunk]),
    accumulate_stream_parts(Next(),[Hunk|Acc]).

%% @spec write_to_disk([fpart()], context()) -> ok | {error,Error}
%% @doc Write part to disk, consolidate parts to one file if receive final part.
write_to_disk(Parts, Context) ->
    Path = file_path(qquuid(Parts), Context),
    case filelib:ensure_dir(Path++"/") of
        ok -> %%io:format("Path ~p~n",[Path]),
            case  write_to_disk(Parts, Context, qqpartindex(Parts), qqtotalparts(Parts)-1) of
                ok -> ok;
                %% TODO:handle more specific errors here.
                {error, Error} -> {error,Error}
            end;
        {error,Error} -> {error,Error}
    end.

%% @spec write_to_disk([fpart()], context(), integer(), integer()) -> ok | {error,Error}
%% @doc Write a part to disk, consolidate parts to one file if part is last one.
write_to_disk(Parts, Context, Last, Last) ->
    case write_to_disk(Parts, Context, Last, Last+1) of
        ok ->
            Path = file_path(qquuid(Parts), Context),
            Filename = filename:join(Path, qqfilename(Parts)),
            case write_combined_parts(Filename) of
                ok -> case check_file_size(
                             filelib:file_size(Filename),
                             qqtotalfilesize(Parts)) of
                          ok -> ok;
                          {error, Error} -> {error, Error} %%return error and delete file?
                      end;
                {error, Error} -> {error, Error}
            end;
        {error,Error} -> {error,Error}
    end;
write_to_disk(Parts, Context, Index, _TotalIndex) ->
    Path = file_path(qquuid(Parts), Context),
    Filename = filename:join(Path, qqfilename(Parts)++"_"++integer_to_list(Index)),
    %%io:format("Filename ~p~n",[Filename]),
    Bytes = qqfile(Parts),
    case file:write_file(Filename, Bytes) of
        ok -> ok; %%TODO check filesize
        {error, Reason} -> {error, Reason}
    end.


%% @spec write_combined_parts(file:filename()) -> ok | {error,Error}
%% @doc Write parts to one file
write_combined_parts(Filename) when is_list(Filename) ->
    Files = find_all_files(Filename++"_*"),
    %%io:format("Com files ~p~n",[Files]),
    case file:open(Filename, [append]) of
        {ok, Handle} ->
            case write_combined_parts(Handle, Files) of
                ok -> delete_files(Files),
                      ok;
                {error, Reason} ->
                           delete_files([Filename]),
                           {error, Reason}
            end;
        {error, Reason} -> {error, Reason}
    end.

%% @spec write_combined_parts(file:iodata(), [file:filename()]) -> ok | {error,Error}
%% @doc Write parts to one file
write_combined_parts(Handle,[]) ->
    file:close(Handle);
write_combined_parts(Handle, [H|T]) ->
    %%io:format("Head in com ~p~n",[H]),
    case file:read_file(H) of
        {ok, Binary} ->
            case file:write(Handle, Binary) of
                ok -> write_combined_parts(Handle, T);
                {error, Reason} -> {error, Reason}
            end;
        {error, Reason} -> {error, Reason}
    end.

%%params from body
qqfilename(Parts) ->
    binary_to_list(get_param("qqfilename", Parts)).

qqtotalparts(Parts) ->
    binary_to_int(get_param("qqtotalparts", Parts)).

qqtotalfilesize(Parts) ->
    binary_to_int(get_param("qqtotalfilesize", Parts)).

qqpartindex(Parts) ->
    binary_to_int(get_param("qqpartindex", Parts)).

qquuid(Parts) ->
    binary_to_list(get_param("qquuid", Parts)).

qqfile(Parts) ->
    get_param("qqfile", Parts).

get_param(Name, Parts) ->
    {Name, _, Val} = proplists:lookup(Name, Parts),
    Val.

%%responses
success(ReqData) ->
    success("true", ReqData).

success(BooleanStr, ReqData) ->
    build_response([{success, BooleanStr}], ReqData).

reset(Msg, ReqData) ->
    build_response([{success, "false"}, {error, Msg}, {reset, "true"}], ReqData).

prevent_retry(Msg, ReqData) ->
    build_response([{success, "false"}, {error, Msg}, {preventRetry, "true"}], ReqData).

failure(Msg, ReqData) ->
    build_response([{error, Msg}], ReqData).

build_response(Status, ReqData)->
    wrq:set_resp_header(
      "Content-type", "text/plain",
      response_body(Status, ReqData)
    ).

response_body(Status, ReqData) ->
    wrq:set_resp_body(
      mochijson:encode(
        {struct, Status}
      ), ReqData
    ).

%% @spec binary_to_int(binary()) -> integer()
binary_to_int(N) ->
    list_to_integer(binary_to_list(N)).

%% @spec check_file_size(integer(), integer()) -> ok | {error, string()}
%% @doc Check that the two sizes given match
check_file_size(_Same, _Same) -> ok;
check_file_size(FileSize, Expected) ->
    {error, "Expected "++Expected++" got "++FileSize}.

%% @spec find_all_files(file:filename()) -> [file:filename()]
%% @doc find all files of the given wildcard
find_all_files(Wildcard) ->
    lists:sort(filelib:wildcard(Wildcard)).

%% @spec delete_files([file:filename()]) -> ok | {error,Error}
%% @doc delete files from given list
delete_files([]) -> ok;
delete_files([H|T]) ->
    case file:delete(H) of
        ok -> delete_files(T);
        {error, Reason} -> {error, Reason}
    end.

%% @spec file_path(string(), context()) -> false | file:filename()
%% @doc Removes any begining "/" from the Name.
file_path([], _Context) ->
    false;
file_path(Name, Context) ->
    RelName = case hd(Name) of
        "/" -> tl(Name);
        _ -> Name
    end,
    filename:join([Context#context.outdir, RelName]).



%% ------------------------------------------------------------------
%% EUnit Tests
%% ------------------------------------------------------------------
-ifdef(TEST).

-include_lib("eunit/include/eunit.hrl").

setup() ->
    [{"qqfilename", some_stuff, <<"test.txt">>},
     {"qqtotalparts", some_stuff, <<"2">>},
     {"qqtotalfilesize", some_stuff, <<"10">>},
     {"qqpartindex", some_stuff, <<"1">>},
     {"qquuid", some_stuff, <<"er3-rere-dc">>},
     {"qqfile", some_stuff, <<"binary data for the win">>}
    ].

cleanup(_SetupData) ->
    ok.

params_test_() ->
    {setup,
     fun setup/0,
     fun cleanup/1,
     fun(SetupData) ->
             ?_assertEqual("test.txt", qqfilename(SetupData)),
             ?_assertEqual(2, qqtotalparts(SetupData)),
             ?_assertEqual(10, qqtotalfilesize(SetupData)),
             ?_assertEqual(1, qqpartindex(SetupData)),
             ?_assertEqual("er3-rere-dc", qquuid(SetupData)),
             ?_assertEqual(<<"binary data for the win">>, qqfile(SetupData))
     end
    }.

-endif.
