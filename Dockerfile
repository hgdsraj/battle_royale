FROM go1.10-stretch

MOVE . .
WORKDIR .

CMD go build main.go

EXPOSE 8000