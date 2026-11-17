#!/usr/bin/env bash
#
# Bascule atomique d'une release de csle.fr + purge des anciennes.
# Installé en /srv/csle/deploy.sh (csle-deploy:csle-deploy, 750). Appelé par la CI via SSH.
# Rollback : /srv/csle/deploy.sh <sha-précédent>
#
# Les migrations sont jouées avant, par la CI (job « migrate », rôle csle_owner).
#
set -euo pipefail
SHA="${1:?usage: deploy.sh <sha>}"
BASE="/srv/csle/front"
SVC="csle-front"
RELEASE="$BASE/releases/$SHA"

[ -f "$RELEASE/server.js" ] || { echo "release absente ou incomplète : $RELEASE" >&2; exit 1; }

# Garde-fou : jamais de .env dans une release (Next le copie dans le standalone)
find "$RELEASE" -maxdepth 1 -name '.env*' -print -delete

# Cache Next persistant (images optimisées), propriété du service, partagé entre releases.
# La release appartient à csle-deploy : sans ce lien, Next ne peut pas écrire son cache.
if [ -d "$BASE/cache" ]; then
  link="$RELEASE/.next/cache"
  if [ -e "$link" ] && [ ! -L "$link" ]; then rm -rf "$link"; fi
  ln -sfn "$BASE/cache" "$link"
fi

ln -sfn "$RELEASE" "$BASE/current.tmp"
mv -Tf "$BASE/current.tmp" "$BASE/current"   # swap atomique
sudo -n /usr/bin/systemctl restart "$SVC"

# Garde les 5 dernières releases (rollback)
ls -1dt "$BASE"/releases/*/ 2>/dev/null | tail -n +6 | xargs -r rm -rf
echo "déployé : $SHA (service $SVC)"
