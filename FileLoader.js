'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const dbService = require('./DbService');

class FileLoader {
    /**
     * @param folder {string}
     * @param recurse {boolean}
     * @param exclude {[]}
     * @returns {FileLoader}
     */
    constructor(folder, exclude = [], recurse = true) {
        this.folder = folder;
        this.files = fs.readdirSync(folder);
        this.recurse = recurse;
        this.exclude = exclude;
        return this;
    }

    loadArray() {
        let output = [];
        if (this.#hasFiles()) {
            if (this.recurse) {
                this.files.forEach(item => {
                    if(this.#isFolder(item)) {
                        const full_name = this.#getFile(item);
                        const results = (new FileLoader(full_name, this.exclude, this.recurse)).loadArray();
                        output.concat(results);
                    }
                });
            }
            this.#filterFiles().forEach(file => {
                let object = this.#requireFile(file);
                output.push(object);
            });
        }
        return output;
    }

    loadModels() {
        let output = {};
        if (this.#hasFiles()) {
            if (this.recurse) {
                let results;
                this.files.forEach(item => {
                    if (this.#isFolder(item)) {
                        const full_name = this.#getFile(item);
                        results = (new FileLoader(full_name, this.exclude, this.recurse)).loadModels();
                    }
                });
                if (results) {
                    output = {...output, ...results};
                }
            }
            this.#filterFiles().forEach(file => {
                const object = this.#requireSequelize(file);
                console.log('FileLoader.loadModels().file = ' + file);
                this.#validateObjectName(object, file);
                output[object.name] = object;
            });
        }
        return output;
    }

    loadObject() {
        let output = {};
        if (this.#hasFiles()) {
            if (this.recurse) {
                let results;
                this.files.forEach(item => {
                    if(this.#isFolder(item)) {
                        const full_name = this.#getFile(item);
                        results = (new FileLoader(full_name, this.exclude, this.recurse)).loadObject();
                    }
                });
                if (results) {
                    output = {...output, ...results};
                }
            }
            this.#filterFiles().forEach(file => {
                let object = this.#requireFile(file);
                console.log('FileLoader.loadObject().file = ' + file);
                this.#validateObjectName(object, file);
                output[object.name] = object;
            });
        }
        return output;
    }

    //<editor-fold desc="Private Functions">
    #filterFiles() {
        return this.files.filter(file => {
            return (
                file.indexOf('.') !== 0 &&
                file !== 'index.js' &&
                file.slice(-3) === '.js' &&
                !this.exclude.includes(file)
            );
        });
    }

    #getFile(file) {
        return path.join(this.folder, file)
    }

    #hasFiles() {
        return (1 < this.files.length);
    }

    #isFolder(file) {
        const full_name = this.#getFile(file);
        let stats = fs.statSync(full_name);
        return (stats.isDirectory() && !this.exclude.includes(file));
    }

    #requireFile(file) {
         return require(this.#getFile(file));
    }

    #requireSequelize(file) {
        return this.#requireFile(file)(dbService, Sequelize.DataTypes);
    }

    #validateObjectName(object, file = '') {
        if (!object) {
            throw Error('FileLoader.loadObject(): Object is null for file: "' + file + '".')
        }
        if (undefined === object.name) {
            if (file) {
                object['name'] = file.slice(0, -3);
            } else {
                throw Error('FileLoader.loadObject(): Cannot have undefined ' +
                    'object name when loading an object');
            }
        }
    }
    //</editor-fold>
}
module.exports = FileLoader;
