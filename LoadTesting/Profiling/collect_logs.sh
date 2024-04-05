#!/bin/bash

# load-balancer
LB_LOG=$(docker exec -t spark-chat-load-balancer-1 find . -type f -name "*.log" -print -quit)
LB_LOG=${LB_LOG:2:-1}
docker cp spark-chat-load-balancer-1:/app/$LB_LOG .
node --prof-process $LB_LOG > load_balancer_profile.txt

# websocket-server
WS_LOG=$(docker exec -t spark-chat-websocket-server-1 find . -type f -name "*.log" -print -quit)
WS_LOG=${WS_LOG:2:-1}
docker cp spark-chat-websocket-server-1:/app/$WS_LOG .
node --prof-process $WS_LOG > websocket_server_profile.txt