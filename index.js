/* global ngapp, xelib */
let getEncounterZone = function(record, patchFile) {
    let eczn = xelib.GetLinksTo(record, 'XEZN');
    if (!eczn) return;
    return xelib.GetPreviousOverride(eczn, patchFile);
};

let getFormula = functuion(settings, min, max) {   
    if (min < max) return settings.formulaRangedLeveled;
    if (min === max) return settings.formulaDeleveled;
    return settings.formulaLeveled;
};

registerPatcher({
    info: info,
    gameModes: [xelib.gmTES5, xelib.gmSSE],
    settings: {
        label: 'Cell Encounter Levels In Name',
        templateUrl: `${patcherPath}/partials/settings.html`,
        defaultSettings: {
            formulaRangedLeveled: '{name} ({min} ~ {max})',
            formulaDeleveled: '{name} ({min})',
            formulaLeveled: '{name} ({min}+)'
        }
    },
    execute: {
        initialize: function(patchFile, helpers, settings, locals) {
            locals.patchFile = patchFile;
        },
        process: [{
            load: function(plugin, helpers, settings, locals) {
                return {
                    signature: 'CELL',
                    filter: function(record) {
                        return xelib.HasElement(record, 'FULL') && 
                            xelib.HasElement(record, 'XEZN') && 
                            xelib.GetFlag(record, 'DATA', 'Is Interior Cell');
                    }
                }
            },
            patch: function(record, helpers, settings, locals) {
                let eczn = getEncounterZone(record, locals.patchFile);
                if (!eczn) return;
                
                let min = xelib.GetUIntValue(eczn, 'DATA\\Min Level'),
                    max = xelib.GetUIntValue(eczn, 'DATA\\Max Level'),
                    formula = getFormula(settings, min, max),
                    fullName = xelib.FullName(record);
                    
                let name = formula
                    .replace(/{name}/g, fullName)
                    .replace(/{min}/g, min)
                    .replace(/{max}/g, max);

                helpers.logMessage(name);
                xelib.SetValue(record, 'FULL', name);
            }
        }]
    }
});