/* global ngapp, xelib */
registerPatcher({
    info: info,
    gameModes: [xelib.gmTES5, xelib.gmSSE],
    settings: {
        label: 'Cell Encounter Levels In Name',
        templateUrl: `${patcherPath}/partials/settings.html`,
        defaultSettings: {
            formulaRangedLeveled: '{name} [{min} ~ {max}]',
            formulaDeleveled: '{name} [{min}]',
            formulaLeveled: '{name} [{min}+]'
        }
    },
    requiredFiles: [],
    getFilesToPatch: function(filenames) {
        return filenames;
    },
    execute: {
        process: [{
            load: function(plugin, helpers, settings, locals) {
                return {
                    signature: 'CELL',
                    filter: function(record) {
                        return xelib.HasElement(record, 'FULL') && xelib.HasElement(record, 'XEZN') && xelib.GetFlag(record, 'DATA', 'Is Interior Cell');
                    }
                }
            },
            patch: function(record, helpers, settings, locals) {
                let name = xelib.FullName(record);
                let eczn = xelib.GetLinksTo(record, 'XEZN');
                let min = xelib.GetUIntValue(eczn, 'DATA\\Min Level');
                let max = xelib.GetUIntValue(eczn, 'DATA\\Max Level');

                let formula = settings.formulaLeveled;

                if (min < max) {
                    formula = settings.formulaRangedLeveled;
                } else if (min == max) {
                    formula = settings.formulaDeleveled;
                }

                name = formula.replace(/{name}/g, name);
                name = name.replace(/{min}/g, min);
                name = name.replace(/{max}/g, max);

                helpers.logMessage(name);
                xelib.SetValue(record, 'FULL', name);
            }
        }]
    }
});