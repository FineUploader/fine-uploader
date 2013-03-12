%% @author author <author@example.com>
%% @copyright YYYY author.

%% @doc Callbacks for the fileserver application.

-module(fileserver_app).
-author('author <author@example.com>').

-behaviour(application).
-export([start/2,stop/1]).


%% @spec start(_Type, _StartArgs) -> ServerRet
%% @doc application start callback for fileserver.
start(_Type, _StartArgs) ->
    fileserver_sup:start_link().

%% @spec stop(_State) -> ServerRet
%% @doc application stop callback for fileserver.
stop(_State) ->
    ok.
