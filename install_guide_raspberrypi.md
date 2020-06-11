### Assumptions

We will be using port 8888 and 9735 as external ports.

### Enable Port Forwarding on your home router

We need to forward both (8888 & 9735) ports to our Raspberry Pi.

Typically this will be under Advanced and then Port Forwarding or Virtual Server.

On the Port Forwarding page enter in a name for the forwarding like, "Relay" and another for "LND". Then enter the port you are forwarding in the port field. Select "TCP/UDP" or "Both" under Protocol if you are unsure which protocol you are using. Next, enter the internal IP address of the device you are port forwarding to and click "Apply" or "Save" to store the changes.

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

Next, logout and login again

### Install docker-compose
```
sudo apt-get install libffi-dev libssl-dev
sudo apt install python3-dev
sudo apt-get install -y python3 python3-pip
sudo pip3 install docker-compose
```

### Build docker image and run (with docker-compose)
```
cd sphinx-relay

docker-compose -f docker-compose.arm.yml build
```

Edit docker-compose.arm.yml file with your IP under the NODE_DOMAIN environment variable

```
docker-compose -f docker-compose.arm.yml up -d
```

### Optional: Build docker image and run manually
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

## Commands

### Login to container

```
docker-compose exec relay sh
```
or
```
docker exec -it relay /bin/sh
```

### Check QR Code (inside container):
```
head -n 500 /var/log/supervisor/relay.log
```

### Unlock wallet (inside container):

```
head -n 1 /relay/.lnd/.lndpwd | lncli --lnddir=/relay/.lnd/ unlock --stdin
```

## Using noip

Prerequisite: Have an account in https://www.noip.com/

```
cd /usr/local/src

sudo wget https://www.noip.com/client/linux/noip-duc-linux.tar.gz

sudo tar xzf noip-duc-linux.tar.gz
```

At this point you need to ls to check what version is the one you downloaded. At the time of writing the latest version is noip-2.1.9-1

```
cd noip-2.1.9-1

sudo make

sudo make install
```

Follow the questions and after:

```
sudo vi /etc/systemd/system/noip2.service
```

Insert the following:

```
[Unit]
Description=No-ip.com dynamic IP address updater
After=network.target
After=syslog.target

[Install]
WantedBy=multi-user.target
Alias=noip.service

[Service]
# Start main service
ExecStart=/usr/local/bin/noip2
Restart=always
Type=forking
```

Then enable the service and start it

```
sudo systemctl enable noip2

sudo systemctl start noip2
```

Credits: https://ivancarosati.com/no-ip-with-raspberry-pi/

## Using Tor


