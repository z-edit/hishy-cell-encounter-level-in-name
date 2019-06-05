/* global ngapp, xelib */
let getEncounterZone = function(cell, patchFile) {
    let eczn = xelib.GetLinksTo(record, 'XEZN');
    if (!eczn) return;
    return xelib.GetPreviousOverride(eczn, patchFile);
};

let getFormula = function(settings, min, max) {
    if (min < max) return settings.formulaRangedLeveled;
    if (min === max) return settings.formulaDeleveled;
    return settings.formulaLeveled;
};

let getNewCellName = function(cell, settings, eczn) {
    let min = xelib.GetUIntValue(eczn, 'DATA\\Min Level'),
        max = xelib.GetUIntValue(eczn, 'DATA\\Max Level'),
        formula = getFormula(settings, min, max),
        fullName = xelib.FullName(cell);

    return formula
        .replace(/{name}/g, fullName)
        .replace(/{min}/g, min)
        .replace(/{max}/g, max);
};

let patchMapMarker = function(cell, name) {
    let location = xelib.GetLinksTo(cell, 'XLCN');
    if (!location) return;
    let mapMarker = xelib.GetLinksTo(location, 'MNAM');
    if (!mapMarker) return;
    xelib.SetValue(mapMarker, 'Map Marker\\FULL', name);
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
    execute: (patchFile, helpers, settings, locals) => ({
        process: [{
            load: {
                signature: 'CELL',
                filter: function(record) {
                    return xelib.HasElement(record, 'FULL') &&
                        xelib.HasElement(record, 'XEZN') &&
                        xelib.GetFlag(record, 'DATA', 'Is Interior Cell');
                }
            },
            patch: function(cell) {
                let eczn = getEncounterZone(cell, locals.patchFile);
                if (!eczn) return;
                let name = getNewCellName(cell, settings, eczn);
                helpers.logMessage(name);
                xelib.SetValue(cell, 'FULL', name);
                if (!settings.patchMapMarkers) return;
                patchMapMarker(cell, name);
            }
        }]
    })
});
