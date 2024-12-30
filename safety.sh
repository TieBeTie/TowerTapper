sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw status | grep -q "22/tcp" || sudo ufw allow 22/tcp
sudo ufw status | grep -q "80/tcp" || sudo ufw allow 80/tcp
sudo ufw status | grep -q "443/tcp" || sudo ufw allow 443/tcp
sudo ufw status | grep -q "8080/tcp" || sudo ufw allow 8080/tcp
sudo ufw status | grep -q "1194/udp" || sudo ufw allow 1194/udp  # AmneziaVPN
sudo ufw logging on
sudo ufw reload
