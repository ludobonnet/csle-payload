#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
# Installation de csle sur le VPS (idempotent). À lancer en root depuis un dossier contenant :
# deploy.pub (clé publique CI brute), csle-deploy.sh,
# csle-front.service, front.env.example, postgres-setup.sql. Rien n'y touche aux services LSAN.
# Utilisateurs
useradd --system --no-create-home --shell /usr/sbin/nologin csle-front 2>/dev/null || true
id csle-deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash csle-deploy
install -d -m700 -o csle-deploy -g csle-deploy /home/csle-deploy/.ssh
# Options imposées ici (et non dans deploy.pub) : shell + rsync, tunnel vers Postgres seul, rien d'autre
key=$(grep -oE '(ssh-ed25519|ssh-rsa|ecdsa-[^ ]+) [A-Za-z0-9+/=]+' deploy.pub)
( umask 077; printf 'restrict,port-forwarding,permitopen="127.0.0.1:5432" %s csle-deploy-ci\n' "$key" \
    > /home/csle-deploy/.ssh/authorized_keys )
chown csle-deploy:csle-deploy /home/csle-deploy/.ssh/authorized_keys
# Arborescence
install -d -m755 -o root -g root /srv/csle
# Propriété csle-deploy : deploy.sh y écrit le lien `current` (piège constaté côté LSAN, runbook §2.2)
install -d -m750 -o csle-deploy -g csle-front /srv/csle/front
install -d -m750 -o csle-deploy -g csle-front /srv/csle/front/releases
install -d -m750 -o csle-front -g csle-front /srv/csle/front/cache
install -m750 -o csle-deploy -g csle-deploy csle-deploy.sh /srv/csle/deploy.sh
# Sudoers
sudoers_tmp=$(mktemp); trap 'rm -f "$sudoers_tmp"' EXIT
echo 'csle-deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart csle-front' > "$sudoers_tmp"
visudo -cf "$sudoers_tmp"
install -m440 -o root -g root "$sudoers_tmp" /etc/sudoers.d/csle-deploy
# Postgres
install -d -m750 -o root -g csle-front /etc/csle
if [ ! -f /etc/csle/pg-credentials.env ]; then
  ( umask 077; printf "CSLE_OWNER_PWD='%s'\nCSLE_APP_PWD='%s'\n" "$(openssl rand -hex 24)" "$(openssl rand -hex 24)" > /etc/csle/pg-credentials.env )
fi
set -a; . /etc/csle/pg-credentials.env; set +a
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='csle_owner'" | grep -q 1; then
  # SQL et mots de passe sur l'entrée standard : ni fichier temporaire, ni secret dans la liste des processus
  { printf '\\set owner_pwd %s\n\\set app_pwd %s\n' "$CSLE_OWNER_PWD" "$CSLE_APP_PWD"; cat postgres-setup.sql; } \
    | sudo -u postgres psql -q -v ON_ERROR_STOP=1
fi
# Environnement du service
if [ ! -f /etc/csle/front.env ]; then
  # Écrit directement à sa place sous umask 077 : jamais de copie lisible des secrets
  ( umask 077; sed -e "s|csle_app:__MOT_DE_PASSE__|csle_app:${CSLE_APP_PWD}|" \
      -e "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=$(openssl rand -hex 32)|" \
      -e "s|^CRON_SECRET=.*|CRON_SECRET=$(openssl rand -hex 32)|" \
      -e "s|^PREVIEW_SECRET=.*|PREVIEW_SECRET=$(openssl rand -hex 32)|" front.env.example > /etc/csle/front.env )
  chown root:csle-front /etc/csle/front.env; chmod 640 /etc/csle/front.env
fi
# Unit systemd (activée, pas démarrée : aucune release encore)
install -m644 -o root -g root csle-front.service /etc/systemd/system/csle-front.service
systemctl daemon-reload
systemctl enable csle-front >/dev/null 2>&1
echo OK
