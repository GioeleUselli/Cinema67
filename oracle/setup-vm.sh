#!/bin/bash
# ============================================================================
# Cinema67 - Oracle Cloud VM Setup Script
# ============================================================================
# Run this ONCE on a fresh Ubuntu 22.04/24.04 VM on Oracle Cloud.
#
# Usage:
#   chmod +x setup-vm.sh
#   sudo ./setup-vm.sh
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Cinema67 Oracle Cloud VM Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ────────────────────────────────────────────────────────────────────────
# Step 1: Update system
# ────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/7] Updating system packages...${NC}"
apt-get update && apt-get upgrade -y
echo -e "${GREEN}System updated${NC}"

# ────────────────────────────────────────────────────────────────────────
# Step 2: Install Docker
# ────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/7] Installing Docker...${NC}"
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
echo -e "${GREEN}Docker installed${NC}"

# ────────────────────────────────────────────────────────────────────────
# Step 3: Add current user to docker group
# ────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/7] Configuring Docker permissions...${NC}"
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
    echo -e "${GREEN}User $SUDO_USER added to docker group${NC}"
fi

# ────────────────────────────────────────────────────────────────────────
# Step 4: Configure firewall (Oracle Cloud)
# ────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[4/7] Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw reload
echo -e "${GREEN}Firewall configured (22, 80, 443 open)${NC}"

# ────────────────────────────────────────────────────────────────────────
# Step 5: Install Git
# ────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[5/7] Installing Git...${NC}"
apt-get install -y git
echo -e "${GREEN}Git installed${NC}"

# ────────────────────────────────────────────────────────────────────────
# Step 6: Create project directory
# ────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[6/7] Creating project directory...${NC}"
mkdir -p /opt/cinema67
chown -R "$SUDO_USER:$SUDO_USER" /opt/cinema67 2>/dev/null || true
echo -e "${GREEN}Project directory created at /opt/cinema67${NC}"

# ────────────────────────────────────────────────────────────────────────
# Step 7: Create systemd service for auto-start
# ────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[7/7] Creating systemd service for auto-start on boot...${NC}"
cat > /etc/systemd/system/cinema67.service << 'EOF'
[Unit]
Description=Cinema67 Docker Compose
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cinema67/oracle
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo -e "${GREEN}Systemd service created (enable with: sudo systemctl enable cinema67)${NC}"

# ────────────────────────────────────────────────────────────────────────
# Done
# ────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VM Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Log out and back in (or run: newgrp docker) to use Docker without sudo"
echo "  2. IMPORTANT: Open ports 80 and 443 in Oracle Cloud Security List:"
echo "     Oracle Console → Networking → Virtual Cloud Networks → Security Lists → Add Ingress Rules"
echo "     - TCP 80  from 0.0.0.0/0"
echo "     - TCP 443 from 0.0.0.0/0"
echo ""
echo "  3. Clone your project:"
echo "     cd /opt/cinema67"
echo "     git clone <YOUR_REPO_URL> ."
echo ""
echo "  4. Configure environment:"
echo "     cd /opt/cinema67/oracle"
echo "     cp .env.production .env"
echo "     nano .env   # Fill in your secrets"
echo ""
echo "  5. Start the application:"
echo "     docker compose up -d --build"
echo ""
echo "  6. Enable auto-start on boot:"
echo "     sudo systemctl enable cinema67"
echo ""
echo -e "${YELLOW}IMPORTANT: Also open ports in Oracle Cloud console (not just UFW):${NC}"
echo "  Oracle Console → Compute → Instances → [Your VM] → Attached VNIC → Security Lists"
echo "  Add ingress rules for TCP 80 and TCP 443 from 0.0.0.0/0"
