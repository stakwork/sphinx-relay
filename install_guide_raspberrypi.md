### Install ufw Firewall to open ports
```
sudo apt install ufw
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 9735
sudo ufw enable
```

### Install git
```
sudo apt-get install git
```

### Clone relay
```
git clone https://github.com/stakwork/sphinx-relay
```

### Install Docker
```
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $(whoami)
```

Next logout and login again

### Build docker image and run
```
cd sphinx-relay

docker build -f Dockerfile.arm -t relay:0.1 .

docker run -p 80:80 -p 9735:9735 \
      -e "PORT=80" \
      -e "NODE_ENV=production" \
      -e "NODE_DOMAIN=$(curl ifconfig.me):8888" \
      -e "NODE_LND_PORT:9735" \
      --name relay \
      relay:0.1
```

### Optional: Install docker-compose
```
sudo apt-get install libffi-dev libssl-dev
sudo apt install python3-dev
sudo apt-get install -y python3 python3-pip
sudo pip3 install docker-compose
```

### Optional: Build docker image and run (with docker-compose)
```
cd sphinx-relay

docker-compose -f docker-compose.arm.yml build
```

Edit docker-compose.arm.yml file with the exposed ports and NODE_DOMAIN (IP + PORT)

```
docker-compose -f docker-compose.arm.yml up -d
```

Check QR Code:
```
docker-compose exec relay head -n 500 /var/log/supervisor/relay.log
```

# Unlock wallet (inside container)

```
head -n 1 /relay/.lnd/.lndpwd | lncli --lnddir=/relay/.lnd/ unlock --stdin
```
