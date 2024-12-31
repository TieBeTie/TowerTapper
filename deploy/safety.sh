#!/bin/bash

# Backup SSH config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup 

# Update system
apt-get update && apt-get upgrade -y

# Install security tools
apt-get install -y fail2ban ufw

# Configure SSH
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config
echo "MaxAuthTries 3" >> /etc/ssh/sshd_config
echo "AllowAgentForwarding no" >> /etc/ssh/sshd_config

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
findtime = 300
bantime = 3600
EOF

# Configure UFW
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

# Start/restart services
systemctl restart ssh
systemctl enable fail2ban
systemctl restart fail2ban

# Remove unused packages and clean up
apt-get autoremove -y
apt-get clean

# Set secure permissions on important files
chmod 600 /etc/ssh/sshd_config
chmod 600 /etc/fail2ban/jail.local

echo "Security hardening completed. Please check the logs for any errors."
