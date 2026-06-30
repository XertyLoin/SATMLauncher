# Solution - Erreur TOO_MANY_REQUESTS Microsoft

## Problème identifié ✅
L'erreur `TOO_MANY_REQUESTS` indique que vous avez fait trop de tentatives de connexion Microsoft en peu de temps. Microsoft limite le nombre de requêtes pour éviter les abus.

## Cause du problème
- Trop de tentatives de connexion rapprochées
- Rate limiting de l'API Microsoft
- Possible problème de cache des tokens

## Solutions immédiates

### 1. Attendre avant de réessayer ⏰
**Attendez 15-30 minutes** avant de retenter une connexion Microsoft. C'est la solution la plus simple.

### 2. Vider le cache du launcher 🗑️
```bash
# Arrêtez le launcher complètement
# Supprimez le dossier de cache (en mode dev)
rm -rf ./data/
# Ou sur Windows
rmdir /s data
```

### 3. Redémarrer en mode production
```bash
npm run build
# Puis lancez l'exécutable généré
```

## Solutions à long terme

### 1. Système de cooldown (déjà implémenté)
J'ai ajouté une gestion d'erreur qui affiche un message clair quand cette erreur survient.

### 2. Cache des tokens
Le launcher devrait sauvegarder les tokens pour éviter de redemander l'authentification à chaque fois.

### 3. Gestion des refresh tokens
Utiliser les refresh tokens pour renouveler l'accès sans redemander l'authentification complète.

## Test de la solution

1. **Attendez 30 minutes** ⏰
2. Relancez le launcher : `npm run dev`
3. Tentez UNE SEULE connexion Microsoft
4. Si ça fonctionne, vous devriez voir :
   ```
   [MS Auth Main] Checking result properties:
     - name: VotreNom
     - uuid: votre-uuid
     - access_token: Present
     - meta: {...}
   ```

## Prévention future

### Évitez les tentatives multiples
- Ne cliquez qu'une seule fois sur "Connexion"
- Attendez la fin du processus avant de réessayer
- Si ça échoue, attendez au moins 5 minutes avant de réessayer

### Utilisez le mode offline temporairement
Si vous devez tester le launcher, utilisez le mode offline (crack) temporairement.

## Messages d'erreur améliorés

Maintenant, quand cette erreur survient, vous verrez un message clair :
```
"Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer."
```

## Vérification du statut

Pour vérifier si le rate limiting est levé :
1. Attendez 30 minutes
2. Lancez le launcher
3. Tentez UNE connexion
4. Observez les logs dans la console

## Contact Microsoft
Si le problème persiste après plusieurs heures, il pourrait y avoir un problème avec votre compte Microsoft ou votre IP. Dans ce cas, contactez le support Microsoft.

---

**Résumé** : Attendez 30 minutes, puis réessayez UNE SEULE fois. Le problème devrait être résolu.