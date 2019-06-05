/* global ngapp, xelib */
let executePatcher = (patchFile, helpers, settings) => {
    let {logMessage} = helpers,
        {GetLinksTo, GetPreviousOverride, GetUIntValue, GetFlag,
         GetHexFormID, FullName, SetValue, HasElement, GetValue} = xelib;

    let mapMarkers = [];

    let logNameChange = function(object, oldName, newName) {
        logMessage(`Changing ${object} name from "${oldName}" to "${newName}"`);
    };

    let getEncounterZone = function(cell) {
        let eczn = GetLinksTo(cell, 'XEZN');
        if (!eczn) return;
        return GetPreviousOverride(eczn, patchFile);
    };

    let getFormula = function(min, max) {
        if (min < max) return settings.formulaRangedLeveled;
        if (min === max) return settings.formulaDeleveled;
        return settings.formulaLeveled;
    };

    let getNewName = function(oldName, min, max) {
        return getFormula(min, max)
            .replace(/{name}/g, oldName)
            .replace(/{min}/g, min)
            .replace(/{max}/g, max);
    };

    let getEncounterZoneMinMax = function(eczn) {
        let min = GetUIntValue(eczn, 'DATA\\Min Level'),
            max = GetUIntValue(eczn, 'DATA\\Max Level');
        return { min, max };
    };

    let getEncounterZonesMinMax = function(encounterZones) {
        return encounterZones.reduce((obj, eczn) => {
            let {min, max} = getEncounterZoneMinMax(eczn);
            obj.min = Math.min(obj.min || 9999, min);
            obj.max = Math.max(obj.max || -9999, max);
            return obj;
        }, {});
    };

    let patchCell = function(cell, eczn) {
        let oldName = FullName(cell),
            {min, max} = getEncounterZoneMinMax(eczn),
            newName = getNewName(oldName, min, max);
        logNameChange('cell', oldName, newName);
        SetValue(cell, 'FULL', newName);
    };

    let getCellMapMarker = function(cell) {
        let location = GetLinksTo(cell, 'XLCN');
        if (!location) return;
        let mapMarker = GetLinksTo(location, 'MNAM');
        if (!mapMarker) return;
        return GetPreviousOverride(mapMarker, patchFile);
    };

    let newMapMarkerEntry = function(id, mapMarker) {
        let encounterZones = [];
        mapMarkers[id] = { mapMarker, encounterZones };
    };

    let trackMapMarker = function(cell, eczn) {
        if (!settings.patchMapMarkers) return;
        let mapMarker = getCellMapMarker(cell);
        if (!mapMarker || !HasElement(mapMarker, 'Map Marker\\FULL')) return;
        let id = GetHexFormID(mapMarker);
        if (!mapMarkers.hasOwnProperty(id))
            newMapMarkerEntry(id, mapMarker);
        let entry = mapMarkers[id];
        entry.encounterZones.push(eczn);
    };

    let patchMapMarker = function(mapMarker, encounterZones) {
        let oldName = GetValue(mapMarker, 'Map Marker\\FULL'),
            {min, max} = getEncounterZonesMinMax(encounterZones),
            newName = getNewName(oldName, min, max);
        logNameChange('map marker', oldName, newName);
        SetValue(mapMarker, 'Map Marker\\FULL', newName);
    };

    return {
        process: [{
            load: {
                signature: 'CELL',
                filter: function(record) {
                    return HasElement(record, 'FULL') &&
                        HasElement(record, 'XEZN') &&
                        GetFlag(record, 'DATA', 'Is Interior Cell');
                }
            },
            patch: function(cell) {
                let eczn = getEncounterZone(cell);
                if (!eczn) return;
                patchCell(cell, eczn);
                trackMapMarker(cell, eczn);
            }
        }, {
            records: () => Object.values(mapMarkers).mapOnKey('mapMarker'),
            patch: function(mapMarker) {
                let id = GetHexFormID(mapMarker),
                    {encounterZones} = mapMarkers[id];
                patchMapMarker(mapMarker, encounterZones);
            }
        }]
    };
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
    execute: executePatcher
});
