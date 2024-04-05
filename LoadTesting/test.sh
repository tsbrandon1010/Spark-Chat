#!/bin/bash
  
now="200_users"

while true; do printf "\n$(date +'%d_%b_%Y_%H_%M_%S'):\n" | tee --append stats_$now.txt;  docker stats --no-stream | tee --append stats_$now.txt; sleep 1; done