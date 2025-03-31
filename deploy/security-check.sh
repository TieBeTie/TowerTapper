#!/bin/bash

# Log file
LOGFILE="/home/ubuntu/towertapper/security-audit.log"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

echo "======== Security Check $DATE ========" >> $LOGFILE

# Check for suspicious PostgreSQL processes
check_postgres_processes() {
  echo "Checking for suspicious PostgreSQL processes..." >> $LOGFILE
  if ps aux | grep postgres | grep -v "166537\|1001" | grep -v grep > /dev/null; then
    echo "[ALERT] Found PostgreSQL processes running with unexpected UID!" >> $LOGFILE
    echo "Details:" >> $LOGFILE
    ps aux | grep postgres | grep -v "166537\|1001" | grep -v grep >> $LOGFILE
    
    # Restart containers to fix
    cd /home/ubuntu/towertapper
    docker-compose down
    docker-compose up -d
    
    echo "Containers restarted to fix the issue." >> $LOGFILE
    
    # Send notification
    echo "[CRITICAL] Security alert on $(hostname): Suspicious PostgreSQL processes detected and fixed on $DATE" | \
    mail -s "Security Alert - Tower Tapper" root@localhost 2>/dev/null || echo "Could not send mail notification" >> $LOGFILE
  else
    echo "No suspicious PostgreSQL processes found." >> $LOGFILE
  fi
}

# Check for unauthorized users
check_users() {
  echo "Checking for unauthorized users..." >> $LOGFILE
  SUSPICIOUS_USERS=$(awk -F: '$3 > 1000 && $3 != 1001 && $1 != "ubuntu" && $1 != "nobody" {print $1}' /etc/passwd)
  if [[ ! -z "$SUSPICIOUS_USERS" ]]; then
    echo "[ALERT] Found suspicious users:" >> $LOGFILE
    echo "$SUSPICIOUS_USERS" >> $LOGFILE
  else
    echo "No suspicious users found." >> $LOGFILE
  fi
}

# Check for suspicious CRON jobs
check_cron() {
  echo "Checking for suspicious CRON jobs..." >> $LOGFILE
  if sudo grep -r --include="*" "/tmp\|curl\|wget" /var/spool/cron /etc/cron* 2>/dev/null | grep -v "security-check.sh"; then
    echo "[ALERT] Found suspicious CRON jobs" >> $LOGFILE
  else
    echo "No suspicious CRON jobs found." >> $LOGFILE
  fi
}

# Check for failed login attempts
check_failed_logins() {
  echo "Checking for failed login attempts..." >> $LOGFILE
  FAILED_ATTEMPTS=$(grep -i "Failed password\|authentication failure\|Invalid user" /var/log/auth.log | tail -5)
  if [[ ! -z "$FAILED_ATTEMPTS" ]]; then
    echo "[INFO] Recent failed login attempts:" >> $LOGFILE
    echo "$FAILED_ATTEMPTS" >> $LOGFILE
  else
    echo "No recent failed login attempts found." >> $LOGFILE
  fi
}

# Run all checks
check_postgres_processes
check_users
check_cron
check_failed_logins

# Exit
echo "Security check completed." >> $LOGFILE
echo "" >> $LOGFILE 