# export NODE_DOMAIN=$(curl $ECS_CONTAINER_METADATA_URI | echo $(jq -r .DockerName).$NODE_DOMAIN)
export NODE_DOMAIN=lvh.me
export NODE_ALIAS=$HOSTNAME
export NODE_IP=$NODE_SCHEME://$NODE_DOMAIN

/usr/bin/supervisord