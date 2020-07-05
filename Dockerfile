FROM elixir

LABEL "repository"="https://github.com/bglusman/check-formatted"
LABEL "homepage"="https://github.com/bglusman/check-formatted"
LABEL "maintainer"="Brian Glusman <brian@glusman.me>"

LABEL "com.github.actions.name"="Run Elixir mix format --check-formatted"
LABEL "com.github.actions.description"="An action for testing changed files are formatted"
LABEL "com.github.actions.icon"="code"
LABEL "com.github.actions.color"="orange"

ARG MIX_HOME=/.mix
ENV MIX_HOME=$MIX_HOME
ARG MIX_ENV=dev
ENV MIX_ENV=$MIX_ENV

RUN mix local.rebar --force
RUN mix local.hex --force

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
