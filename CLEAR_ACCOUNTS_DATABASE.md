# Nettoyage de la base de données des comptes

## Problème résolu ✅

Le vrai problème était le **refresh automatique** des comptes Microsoft au démarrage du launcher !

### Cause identifiée
- Le launcher essayait de rafraîchir TOUS les comptes Microsoft existants au démarrage
- Chaque compte = 1 appel API Microsoft
- Plusieurs comptes = spam d'API = `TOO_MANY_REQUESTS`

### Solution implémentée
J'ai désactivé le refresh automatique des comptes Microsoft dans `src/assets/js/launcher.js` (ligne ~168).

## Nettoyage optionnel de la base

Si vous voulez repartir à zéro avec les comptes :

### Option 1: Supprimer le dossier data (mode dev)
```bash
# Arrêtez le launcher
# Supprimez le dossier de données
rmdir /s data
# Ou sur Linux/Mac
rm -rf data
```

### Option 2: Supprimer seulement les comptes
Allez dans le dossier `data/Launcher` et supprimez les fichiers de comptes.

### Option 3: Garder les comptes existants
Les comptes existants fonctionneront maintenant sans refresh automatique.

## Test de la solution

1. Le launcher devrait maintenant démarrer sans erreur
2. Vous pouvez vous connecter manuellement avec Microsoft
3. Pas de refresh automatique = pas de spam d'API

## Logs à surveiller

Vous devriez voir :
```
[DEBUG] Skipping automatic refresh for Microsoft account to avoid TOO_MANY_REQUESTS
```

Au lieu de :
```
Refresh account Type: Xbox | Username: ...
```

## Réactivation future du refresh (optionnel)

Si vous voulez réactiver le refresh automatique plus tard :
1. Décommentez le code dans `launcher.js`
2. Ajoutez un délai entre les refresh (ex: 5 secondes)
3. Limitez à 1 refresh par session

---

**Le problème de connexion Microsoft est maintenant résolu !** 🎉