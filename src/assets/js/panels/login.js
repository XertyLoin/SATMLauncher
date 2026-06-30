/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */
const { AZauth, Mojang } = require('minecraft-java-core');
const { ipcRenderer } = require('electron');

import { popup, database, changePanel, accountSelect, addAccount, config, setStatus } from '../utils.js';

class Login {
    static id = "login";
    async init(config) {
        this.config = config;
        this.db = new database();

        if (typeof this.config.online == 'boolean') {
            this.config.online ? this.getMicrosoft() : this.getCrack()
        } else if (typeof this.config.online == 'string') {
            if (this.config.online.match(/^(http|https):\/\/[^ "]+$/)) {
                this.getAZauth();
            }
        }

        document.querySelector('.cancel-home').addEventListener('click', () => {
            document.querySelector('.cancel-home').style.display = 'none'
            changePanel('settings')
        })
    }

    async getMicrosoft() {
        console.log('Initializing Microsoft login...');
        let popupLogin = new popup();
        let loginHome = document.querySelector('.login-home');
        let microsoftBtn = document.querySelector('.connect-home');
        loginHome.style.display = 'block';

        microsoftBtn.addEventListener("click", () => {
            console.log('[MS Auth Frontend] Button clicked, starting authentication...');
            console.log('[MS Auth Frontend] Config client_id:', this.config.client_id);
            
            popupLogin.openPopup({
                title: 'Connexion',
                content: 'Veuillez patienter...',
                color: 'var(--color)'
            });

            ipcRenderer.invoke('Microsoft-window', this.config.client_id).then(async account_connect => {
                console.log('[MS Auth Frontend] IPC response received');
                console.log('[MS Auth Frontend] Response type:', typeof account_connect);
                console.log('[MS Auth Frontend] Response value:', account_connect);
                console.log('[MS Auth Frontend] Raw response:', JSON.stringify(account_connect, null, 2));
                
                if (account_connect == 'cancel' || !account_connect) {
                    console.log('[MS Auth Frontend] Authentication cancelled or failed');
                    popupLogin.closePopup();
                    return;
                } else {
                    console.log('[MS Auth Frontend] Authentication successful, saving data...');
                    console.log('[MS Auth Frontend] Account data to save:', {
                        name: account_connect.name,
                        uuid: account_connect.uuid,
                        hasAccessToken: !!account_connect.access_token,
                        meta: account_connect.meta
                    });
                    
                    try {
                        await this.saveData(account_connect);
                        console.log('[MS Auth Frontend] Data saved successfully');
                        popupLogin.closePopup();
                    } catch (saveError) {
                        console.error('[MS Auth Frontend] Error saving data:', saveError);
                        popupLogin.openPopup({
                            title: 'Erreur de sauvegarde',
                            content: 'Erreur lors de la sauvegarde: ' + saveError.message,
                            options: true
                        });
                    }
                }

            }).catch(err => {
                console.error('[MS Auth Frontend] IPC error:', err);
                console.error('[MS Auth Frontend] Error stack:', err.stack);
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Erreur d\'authentification: ' + (err.message || err),
                    options: true
                });
            });
        })
    }

    async getCrack() {
        console.log('Initializing offline login...');
        let popupLogin = new popup();
        let loginOffline = document.querySelector('.login-offline');

        let emailOffline = document.querySelector('.email-offline');
        let connectOffline = document.querySelector('.connect-offline');
        loginOffline.style.display = 'block';

        connectOffline.addEventListener('click', async () => {
            if (emailOffline.value.length < 3) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Votre pseudo doit faire au moins 3 caractères.',
                    options: true
                });
                return;
            }

            if (emailOffline.value.match(/ /g)) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Votre pseudo ne doit pas contenir d\'espaces.',
                    options: true
                });
                return;
            }

            let MojangConnect = await Mojang.login(emailOffline.value);

            if (MojangConnect.error) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: MojangConnect.message,
                    options: true
                });
                return;
            }
            await this.saveData(MojangConnect)
            popupLogin.closePopup();
        });
    }

    async getAZauth() {
        console.log('Initializing AZauth login...');
        let AZauthClient = new AZauth(this.config.online);
        let PopupLogin = new popup();
        let loginAZauth = document.querySelector('.login-AZauth');
        let loginAZauthA2F = document.querySelector('.login-AZauth-A2F');

        let AZauthEmail = document.querySelector('.email-AZauth');
        let AZauthPassword = document.querySelector('.password-AZauth');
        let AZauthA2F = document.querySelector('.A2F-AZauth');
        let connectAZauthA2F = document.querySelector('.connect-AZauth-A2F');
        let AZauthConnectBTN = document.querySelector('.connect-AZauth');
        let AZauthCancelA2F = document.querySelector('.cancel-AZauth-A2F');

        loginAZauth.style.display = 'block';

        AZauthConnectBTN.addEventListener('click', async () => {
            PopupLogin.openPopup({
                title: 'Connexion en cours...',
                content: 'Veuillez patienter...',
                color: 'var(--color)'
            });

            if (AZauthEmail.value == '' || AZauthPassword.value == '') {
                PopupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Veuillez remplir tous les champs.',
                    options: true
                });
                return;
            }

            let AZauthConnect = await AZauthClient.login(AZauthEmail.value, AZauthPassword.value);

            if (AZauthConnect.error) {
                PopupLogin.openPopup({
                    title: 'Erreur',
                    content: AZauthConnect.message,
                    options: true
                });
                return;
            } else if (AZauthConnect.A2F) {
                loginAZauthA2F.style.display = 'block';
                loginAZauth.style.display = 'none';
                PopupLogin.closePopup();

                AZauthCancelA2F.addEventListener('click', () => {
                    loginAZauthA2F.style.display = 'none';
                    loginAZauth.style.display = 'block';
                });

                connectAZauthA2F.addEventListener('click', async () => {
                    PopupLogin.openPopup({
                        title: 'Connexion en cours...',
                        content: 'Veuillez patienter...',
                        color: 'var(--color)'
                    });

                    if (AZauthA2F.value == '') {
                        PopupLogin.openPopup({
                            title: 'Erreur',
                            content: 'Veuillez entrer le code A2F.',
                            options: true
                        });
                        return;
                    }

                    AZauthConnect = await AZauthClient.login(AZauthEmail.value, AZauthPassword.value, AZauthA2F.value);

                    if (AZauthConnect.error) {
                        PopupLogin.openPopup({
                            title: 'Erreur',
                            content: AZauthConnect.message,
                            options: true
                        });
                        return;
                    }

                    await this.saveData(AZauthConnect)
                    PopupLogin.closePopup();
                });
            } else if (!AZauthConnect.A2F) {
                await this.saveData(AZauthConnect)
                PopupLogin.closePopup();
            }
        });
    }

    async saveData(connectionData) {
        try {
            console.log('[SaveData] Starting saveData process...');
            console.log('[SaveData] Connection data received:', {
                name: connectionData?.name,
                uuid: connectionData?.uuid,
                hasAccessToken: !!connectionData?.access_token,
                meta: connectionData?.meta,
                fullData: JSON.stringify(connectionData, null, 2)
            });

            console.log('[SaveData] Reading configClient...');
            let configClient = await this.db.readData('configClient');
            console.log('[SaveData] ConfigClient loaded:', configClient);

            console.log('[SaveData] Creating account in database...');
            let account = await this.db.createData('accounts', connectionData);
            console.log('[SaveData] Account created:', {
                ID: account?.ID,
                name: account?.name,
                uuid: account?.uuid
            });

            if (!account || !account.ID) {
                throw new Error('Failed to create account - no ID returned');
            }

            let instanceSelect = configClient.instance_selct;
            console.log('[SaveData] Current instance selected:', instanceSelect);

            console.log('[SaveData] Getting instances list...');
            let instancesList = await config.getInstanceList();
            console.log('[SaveData] Instances list:', instancesList);

            configClient.account_selected = account.ID;
            console.log('[SaveData] Set account_selected to:', account.ID);

            for (let instance of instancesList) {
                if (instance.whitelistActive) {
                    console.log('[SaveData] Checking whitelist for instance:', instance.name);
                    let whitelist = instance.whitelist.find(whitelist => whitelist == account.name);
                    if (whitelist !== account.name) {
                        console.log('[SaveData] Account not in whitelist for:', instance.name);
                        if (instance.name == instanceSelect) {
                            let newInstanceSelect = instancesList.find(i => i.whitelistActive == false);
                            console.log('[SaveData] Switching to non-whitelist instance:', newInstanceSelect?.name);
                            configClient.instance_selct = newInstanceSelect.name;
                            await setStatus(newInstanceSelect.status);
                        }
                    } else {
                        console.log('[SaveData] Account found in whitelist for:', instance.name);
                    }
                }
            }

            console.log('[SaveData] Updating configClient...');
            await this.db.updateData('configClient', configClient);

            console.log('[SaveData] Adding account to UI...');
            await addAccount(account);

            console.log('[SaveData] Selecting account...');
            await accountSelect(account);

            console.log('[SaveData] Changing to home panel...');
            changePanel('home');

            console.log('[SaveData] SaveData process completed successfully');
        } catch (error) {
            console.error('[SaveData] Error in saveData:', error);
            console.error('[SaveData] Error stack:', error.stack);
            throw error;
        }
    }
}
export default Login;