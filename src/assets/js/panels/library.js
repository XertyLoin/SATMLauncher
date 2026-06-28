/**
 * @author Luuxis / 56games
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

import { changePanel, database, appdata, config } from '../utils.js';
const fs = require('fs');
const path = require('path');

class Library {
    static id = "library";
    
    async init(config) {
        this.config = config;
        this.db = new database();
        this.currentTab = "mods";
        
        this.initNav();
        this.initInputs();
        this.initDragAndDrop();
        await this.loadTab("mods");
    }

    initNav() {
        document.querySelector('.library .nav-box').addEventListener('click', async e => {
            if (e.target.classList.contains('nav-library-btn')) {
                let id = e.target.id;

                if (id === 'library-back') {
                    // Reset tab active classes when leaving
                    let activeSettingsBTN = document.querySelector('.library .active-settings-BTN');
                    let activeContainerSettings = document.querySelector('.library .active-container-settings');
                    
                    if (activeSettingsBTN) activeSettingsBTN.classList.remove('active-settings-BTN');
                    document.querySelector('#tab-mods').classList.add('active-settings-BTN');

                    if (activeContainerSettings) {
                        activeContainerSettings.style.display = 'none';
                        activeContainerSettings.classList.remove('active-container-settings');
                    }
                    
                    document.querySelector(`#mods-tab`).style.display = 'flex';
                    document.querySelector(`#mods-tab`).classList.add('active-container-settings');
                    
                    return changePanel('home');
                }

                let category = id.replace('tab-', '');
                let activeSettingsBTN = document.querySelector('.library .active-settings-BTN');
                let activeContainerSettings = document.querySelector('.library .active-container-settings');

                if (activeSettingsBTN) activeSettingsBTN.classList.remove('active-settings-BTN');
                e.target.classList.add('active-settings-BTN');

                if (activeContainerSettings) {
                    activeContainerSettings.style.display = 'none';
                    activeContainerSettings.classList.remove('active-container-settings');
                }

                let newTab = document.querySelector(`#${category}-tab`);
                newTab.style.display = 'flex';
                newTab.classList.add('active-container-settings');

                this.currentTab = category;
                await this.loadTab(category);
            }
        });
    }

    initInputs() {
        // Wire up addition buttons
        ['mods', 'shaders', 'resourcepacks'].forEach(cat => {
            let addBtn = document.getElementById(`add-${cat}-btn`);
            let fileInput = document.getElementById(`${cat}-file-input`);

            if (addBtn && fileInput) {
                addBtn.addEventListener('click', () => {
                    fileInput.click();
                });

                fileInput.addEventListener('change', async (e) => {
                    let files = e.target.files;
                    if (files.length > 0) {
                        await this.copyFiles(cat, files);
                        fileInput.value = ''; // reset
                    }
                });
            }
        });
    }

    initDragAndDrop() {
        ['mods', 'shaders', 'resourcepacks'].forEach(cat => {
            let container = document.getElementById(`${cat}-tab`);
            if (container) {
                container.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    container.style.borderColor = 'var(--element-color)';
                });

                container.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    container.style.borderColor = '';
                });

                container.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    container.style.borderColor = '';
                    
                    let files = e.dataTransfer.files;
                    if (files.length > 0) {
                        await this.copyFiles(cat, files);
                    }
                });
            }
        });
    }

    async getFolderPath(category) {
        let configClient = await this.db.readData('configClient');
        let activeInstance = configClient?.instance_selct || "SATM";
        let rootPath = `${await appdata()}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`;
        
        // Match actual folder names in game
        let folderName = category;
        if (category === 'shaders') folderName = 'shaderpacks';
        if (category === 'resourcepacks') folderName = 'resourcepacks';

        let folder = path.join(rootPath, 'instances', activeInstance, folderName);
        return folder;
    }

    async loadTab(category) {
        let folderPath = await this.getFolderPath(category);
        let folderPathDisplay = document.getElementById(`${category}-folder-path`);
        let listContainer = document.getElementById(`${category}-list`);

        if (folderPathDisplay) {
            // Display path in user friendly layout
            folderPathDisplay.textContent = folderPath;
        }

        // Ensure path exists
        if (!fs.existsSync(folderPath)) {
            try {
                fs.mkdirSync(folderPath, { recursive: true });
            } catch (err) {
                console.error("Failed to create library folder:", err);
            }
        }

        if (listContainer) {
            listContainer.innerHTML = '';
            
            if (!fs.existsSync(folderPath)) {
                this.renderEmpty(category, listContainer);
                return;
            }

            let files = [];
            try {
                files = fs.readdirSync(folderPath).filter(file => {
                    let isDir = fs.statSync(path.join(folderPath, file)).isDirectory();
                    // In case of shaders or resourcepacks, directories are also valid
                    if (category === 'mods') {
                        return !isDir && file.endsWith('.jar') && !file.startsWith('.');
                    }
                    return !file.startsWith('.') && (file.endsWith('.zip') || isDir);
                });
            } catch (err) {
                console.error("Error reading library folder:", err);
            }

            if (files.length === 0) {
                this.renderEmpty(category, listContainer);
                return;
            }

            // Sort files alphabetically
            files.sort();

            files.forEach(file => {
                let filePath = path.join(folderPath, file);
                let stat = fs.statSync(filePath);
                let sizeStr = stat.isDirectory() ? 'Dossier' : this.formatBytes(stat.size);

                let itemDiv = document.createElement('div');
                itemDiv.className = 'library-file-item';
                itemDiv.innerHTML = `
                    <div class="file-info">
                        <div class="file-name" title="${file}">${file}</div>
                        <div class="file-meta">${sizeStr}</div>
                    </div>
                    <div class="file-delete-btn" data-file="${file}" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </div>
                `;

                // Add delete event
                itemDiv.querySelector('.file-delete-btn').addEventListener('click', async (e) => {
                    let targetBtn = e.currentTarget;
                    let fileName = targetBtn.getAttribute('data-file');
                    let fullPath = path.join(folderPath, fileName);
                    
                    if (confirm(`Voulez-vous vraiment supprimer "${fileName}" ?`)) {
                        try {
                            if (fs.statSync(fullPath).isDirectory()) {
                                fs.rmSync(fullPath, { recursive: true });
                            } else {
                                fs.unlinkSync(fullPath);
                            }
                            await this.loadTab(category);
                        } catch (err) {
                            alert(`Erreur lors de la suppression du fichier : ${err.message}`);
                        }
                    }
                });

                listContainer.appendChild(itemDiv);
            });
        }
    }

    renderEmpty(category, container) {
        let label = "fichier";
        if (category === 'mods') label = "mod";
        if (category === 'shaders') label = "shader";
        if (category === 'resourcepacks') label = "pack de ressources";

        container.innerHTML = `
            <div class="empty-library-message">
                <div class="empty-icon">📁</div>
                <div>Aucun ${label} installé.</div>
                <div style="font-size: 0.85rem; opacity: 0.6; margin-top: 0.5rem;">Glissez-déposez des fichiers ici pour les installer !</div>
            </div>
        `;
    }

    async copyFiles(category, files) {
        let folderPath = await this.getFolderPath(category);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        let count = 0;
        let errors = [];

        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let name = file.name;
            let ext = path.extname(name).toLowerCase();

            // Validate extension
            if (category === 'mods' && ext !== '.jar') {
                errors.push(`"${name}" n'est pas un fichier de mod valide (.jar).`);
                continue;
            }
            if ((category === 'shaders' || category === 'resourcepacks') && ext !== '.zip') {
                errors.push(`"${name}" n'est pas un fichier zip valide (.zip).`);
                continue;
            }

            let destPath = path.join(folderPath, name);
            try {
                // If it is a File object from input, copy its path
                let srcPath = file.path;
                fs.copyFileSync(srcPath, destPath);
                count++;
            } catch (err) {
                errors.push(`Erreur avec "${name}": ${err.message}`);
            }
        }

        if (errors.length > 0) {
            alert(`Certains fichiers n'ont pas pu être ajoutés :\n\n${errors.join('\n')}`);
        }

        if (count > 0) {
            await this.loadTab(category);
        }
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

export default Library;
