# Guide de débogage - Authentification Microsoft

## Problème identifié
L'authentification Microsoft semble se connecter mais affiche "undefined" et l'utilisateur n'est jamais connecté.

## Logs de débogage ajoutés

J'ai ajouté des logs détaillés dans plusieurs fichiers pour identifier le problème :

### 1. Dans `src/app.js` (processus principal Electron)
- Logs détaillés de l'authentification Microsoft
- Vérification des propriétés de la réponse
- Gestion d'erreurs améliorée

### 2. Dans `src/assets/js/panels/login.js` (interface utilisateur)
- Logs du processus d'authentification frontend
- Logs détaillés de la fonction `saveData`
- Vérification des données reçues

## Comment déboguer

### Étape 1: Ouvrir les outils de développement
1. Lancez le launcher en mode développement : `npm run dev`
2. Ouvrez les DevTools (F12 ou Ctrl+Shift+I)
3. Allez dans l'onglet "Console"

### Étape 2: Tenter une connexion Microsoft
1. Cliquez sur le bouton de connexion Microsoft
2. Observez les logs dans la console

### Étape 3: Analyser les logs

Recherchez ces préfixes dans la console :
- `[MS Auth Main]` - Logs du processus principal
- `[MS Auth Frontend]` - Logs de l'interface
- `[SaveData]` - Logs de sauvegarde des données

## Points de vérification critiques

### 1. Réponse de l'authentification Microsoft
Vérifiez si ces propriétés sont présentes :
```javascript
{
  "name": "NomUtilisateur",
  "uuid": "uuid-de-l-utilisateur",
  "access_token": "token-d-acces",
  "meta": {
    "online": true,
    "type": "Microsoft"
  }
}
```

### 2. Création du compte en base
Vérifiez si l'account est créé avec un ID :
```javascript
{
  "ID": "identifiant-unique",
  "name": "NomUtilisateur",
  "uuid": "uuid-de-l-utilisateur"
}
```

### 3. Configuration client
Vérifiez si `configClient` est correctement chargé et mis à jour.

## Problèmes potentiels identifiés

### 1. Réponse Microsoft vide ou malformée
- Si `account_connect` est `undefined` ou `null`
- Si les propriétés `name`, `uuid`, ou `access_token` sont manquantes

### 2. Erreur de base de données
- Si `this.db.createData('accounts', connectionData)` échoue
- Si l'account créé n'a pas d'ID

### 3. Problème de configuration
- Si `configClient` n'existe pas ou est corrompu
- Si la liste des instances n'est pas accessible

## Actions recommandées

1. **Lancez le launcher en mode dev** : `npm run dev`
2. **Ouvrez la console** et tentez une connexion
3. **Copiez tous les logs** qui commencent par `[MS Auth]` ou `[SaveData]`
4. **Partagez ces logs** pour un diagnostic précis

## Vérifications supplémentaires

### Version de minecraft-java-core
Vérifiez que vous utilisez une version compatible :
```bash
npm list minecraft-java-core
```

### Permissions réseau
Assurez-vous que le launcher peut accéder à :
- `login.microsoftonline.com`
- `user.auth.xboxlive.com`
- `xsts.auth.xboxlive.com`
- `api.minecraftservices.com`

### Configuration du launcher
Vérifiez le fichier de configuration pour s'assurer que `online: true` est défini.

## Contact
Si le problème persiste après ces vérifications, partagez :
1. Les logs complets de la console
2. La version de Node.js (`node --version`)
3. La version d'Electron (`npm list electron`)
4. Le système d'exploitation